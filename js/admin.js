/* ============================================================
   ADMIN.JS — Panel de gestion Sarah
   ============================================================ */

import { supabase } from './supabase.js';
import { getCurrentUser, signOut } from './auth.js';

const ADMIN_EMAIL = 'contact@tayafitness.com'; // email admin Sarah

let currentUser = null;
let editingProgrammeId = null;
let allClients = [];
let allPaiements = [];
let allReservations = [];
let modalCallback = null;

/* ── Init ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  currentUser = await getCurrentUser();
  if (!currentUser) { window.location.href = '/auth?redirect=/admin'; return; }

  document.getElementById('admin-welcome').textContent = `👋 ${currentUser.user_metadata?.full_name?.split(' ')[0] || 'Sarah'}`;

  initNav();
  initBurger();
  initLogout();
  initModal();

  loadPanel('dashboard');
});

/* ── Navigation ──────────────────────────────────────────── */
function initNav() {
  document.querySelectorAll('.admin-nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadPanel(btn.dataset.panel);
    });
  });

  // Liens raccourcis dans les cards
  document.querySelectorAll('[data-panel]').forEach(btn => {
    if (btn.classList.contains('admin-nav-item')) return;
    btn.addEventListener('click', () => {
      const navBtn = document.querySelector(`.admin-nav-item[data-panel="${btn.dataset.panel}"]`);
      navBtn?.click();
    });
  });
}

function loadPanel(name) {
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`panel-${name}`)?.classList.add('active');
  document.getElementById('admin-page-title').textContent = {
    dashboard:    'Dashboard',
    clients:      'Clients',
    programmes:   'Programmes',
    reservations: 'Réservations',
    paiements:    'Paiements & Facturation',
    messages:     'Messages'
  }[name] || name;

  if (name === 'dashboard')    loadDashboard();
  if (name === 'clients')      loadClients();
  if (name === 'programmes')   loadProgrammes();
  if (name === 'reservations') loadReservations();
  if (name === 'paiements')    loadPaiements();
  if (name === 'messages')     loadMessages();
}

/* ── Burger mobile ───────────────────────────────────────── */
function initBurger() {
  document.getElementById('admin-burger')?.addEventListener('click', () => {
    document.getElementById('admin-sidebar')?.classList.toggle('open');
  });
}

/* ── Logout ──────────────────────────────────────────────── */
function initLogout() {
  document.getElementById('admin-logout')?.addEventListener('click', signOut);
}

/* ── Modal confirm ───────────────────────────────────────── */
function initModal() {
  document.getElementById('modal-cancel-btn')?.addEventListener('click',  hideModal);
  document.getElementById('modal-confirm-btn')?.addEventListener('click', () => {
    if (modalCallback) modalCallback();
    hideModal();
  });
}

function showModal(title, body, callback) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').textContent  = body;
  document.getElementById('admin-modal').style.display = 'flex';
  modalCallback = callback;
}

function hideModal() {
  document.getElementById('admin-modal').style.display = 'none';
  modalCallback = null;
}

function showSuccess(msg) {
  const el = document.getElementById('admin-alert-success');
  el.textContent = msg; el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 3500);
}

function showError(msg) {
  const el = document.getElementById('admin-alert-error');
  el.textContent = msg; el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}

/* ══════════════════════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════════════════════ */
async function loadDashboard() {
  try {
    const now   = new Date();
    const debut = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [
      { count: nbClients },
      { data: achats },
      { data: rdvSemaine },
      { data: messages },
      { data: derniers },
      { data: derniersClients }
    ] = await Promise.all([
      supabase.from('achats').select('*', { count: 'exact', head: true }).eq('statut', 'active'),
      supabase.from('achats').select('montant').eq('statut','active').gte('created_at', debut),
      supabase.from('reservations').select('*').gte('date_heure', now.toISOString()).lte('date_heure', new Date(now.getTime()+7*86400000).toISOString()),
      supabase.from('contacts').select('id').order('created_at', {ascending:false}).limit(100),
      supabase.from('reservations').select('*, profiles(full_name)').gte('date_heure', now.toISOString()).order('date_heure').limit(5),
      supabase.from('profiles').select('*').order('created_at',{ascending:false}).limit(5)
    ]);

    const revenus = (achats || []).reduce((s, a) => s + (a.montant || 0), 0);

    document.getElementById('stat-clients').textContent  = nbClients ?? 0;
    document.getElementById('stat-revenus').textContent  = `${revenus}€`;
    document.getElementById('stat-rdv').textContent      = (rdvSemaine || []).length;
    document.getElementById('stat-messages').textContent = (messages || []).length;

    // RDV
    const rdvList = document.getElementById('dash-rdv-list');
    rdvList.innerHTML = (derniers || []).length === 0
      ? `<div class="admin-empty"><span>📅</span>Aucun RDV à venir</div>`
      : (derniers || []).map(r => {
          const d = new Date(r.date_heure);
          return `<div class="admin-list-item">
            <div class="admin-list-avatar">${(r.profiles?.full_name || '?')[0].toUpperCase()}</div>
            <div class="admin-list-info">
              <strong>${r.profiles?.full_name || 'Client'}</strong>
              <small>${r.type || 'visio'} · ${r.notes || ''}</small>
            </div>
            <span style="font-size:0.78rem;color:var(--white-muted);">${d.toLocaleDateString('fr-FR', {day:'numeric',month:'short'})} ${d.toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'})}</span>
          </div>`;
        }).join('');

    // Derniers clients
    const clientsList = document.getElementById('dash-clients-list');
    clientsList.innerHTML = (derniersClients || []).length === 0
      ? `<div class="admin-empty"><span>👥</span>Aucun client</div>`
      : (derniersClients || []).map(c => `
          <div class="admin-list-item">
            <div class="admin-list-avatar">${(c.full_name || c.id)[0].toUpperCase()}</div>
            <div class="admin-list-info">
              <strong>${c.full_name || 'Anonyme'}</strong>
              <small>Inscrit le ${new Date(c.created_at).toLocaleDateString('fr-FR')}</small>
            </div>
          </div>`).join('');

    // Derniers messages
    const { data: msgs } = await supabase.from('contacts').select('*').order('created_at',{ascending:false}).limit(3);
    const msgsList = document.getElementById('dash-messages-list');
    msgsList.innerHTML = (msgs || []).length === 0
      ? `<div class="admin-empty"><span>💬</span>Aucun message</div>`
      : (msgs || []).map(m => `
          <div class="admin-list-item">
            <div class="admin-list-avatar">${(m.prenom || '?')[0].toUpperCase()}</div>
            <div class="admin-list-info">
              <strong>${m.prenom} ${m.nom || ''} — ${m.sujet || ''}</strong>
              <small>${m.message?.slice(0,80)}...</small>
            </div>
            <span style="font-size:0.75rem;color:var(--white-muted);">${new Date(m.created_at).toLocaleDateString('fr-FR')}</span>
          </div>`).join('');

  } catch (err) { console.error('Dashboard error:', err); }
}

/* ══════════════════════════════════════════════════════════
   CLIENTS
══════════════════════════════════════════════════════════ */
async function loadClients() {
  const tbody = document.getElementById('clients-tbody');
  tbody.innerHTML = `<tr><td colspan="6" class="table-loading"><div class="spinner"></div></td></tr>`;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, achats(statut, montant, programmes(titre))')
      .order('created_at', { ascending: false });

    if (error) throw error;
    allClients = data || [];
    renderClientsTable(allClients);

    // Recherche
    document.getElementById('search-clients')?.addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      renderClientsTable(allClients.filter(c =>
        (c.full_name || '').toLowerCase().includes(q)
      ));
    });

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--white-muted);padding:32px">Erreur chargement</td></tr>`;
    console.error(err);
  }
}

function renderClientsTable(clients) {
  const tbody = document.getElementById('clients-tbody');
  if (clients.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--white-muted);padding:32px">Aucun client</td></tr>`;
    return;
  }
  tbody.innerHTML = clients.map(c => {
    const achat = (c.achats || []).find(a => a.statut === 'active');
    const offre = achat?.programmes?.titre || '—';
    const statut = achat ? 'active' : 'pending';
    return `<tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="admin-list-avatar">${(c.full_name || '?')[0].toUpperCase()}</div>
          <strong>${c.full_name || 'Anonyme'}</strong>
        </div>
      </td>
      <td style="font-size:0.8rem">${c.id.slice(0,8)}…</td>
      <td>${offre}</td>
      <td><span class="status-badge status-${statut}">${statut === 'active' ? '✓ Actif' : '⏳ Inactif'}</span></td>
      <td>${new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
      <td>
        <div class="table-actions">
          <button class="btn-xs" onclick="alert('Profil client — bientôt disponible')">Voir profil</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

/* ══════════════════════════════════════════════════════════
   PROGRAMMES
══════════════════════════════════════════════════════════ */
async function loadProgrammes() {
  const tbody = document.getElementById('programmes-tbody');
  tbody.innerHTML = `<tr><td colspan="6" class="table-loading"><div class="spinner"></div></td></tr>`;

  initProgrammeForm();

  try {
    const { data, error } = await supabase
      .from('programmes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    tbody.innerHTML = (data || []).map(p => `
      <tr>
        <td><strong>${p.titre}</strong></td>
        <td>${p.categorie || '—'}</td>
        <td><span class="status-badge status-${p.niveau === 'debutant' ? 'active' : p.niveau === 'intermediaire' ? 'pending' : 'cancelled'}">${p.niveau || '—'}</span></td>
        <td style="color:var(--gold);font-weight:700">${p.prix}€<small style="color:var(--white-muted);font-weight:400">/mois</small></td>
        <td><span class="status-badge ${p.actif ? 'status-active' : 'status-cancelled'}">${p.actif ? '✓ Actif' : '✗ Inactif'}</span></td>
        <td>
          <div class="table-actions">
            <button class="btn-xs" data-edit="${p.id}">Modifier</button>
            <button class="btn-xs danger" data-delete="${p.id}">Supprimer</button>
          </div>
        </td>
      </tr>
    `).join('');

    // Édition
    tbody.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => editProgramme(data.find(p => p.id === btn.dataset.edit)));
    });

    // Suppression
    tbody.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        const prog = data.find(p => p.id === btn.dataset.delete);
        showModal('Supprimer le programme', `Supprimer "${prog?.titre}" ? Cette action est irréversible.`, async () => {
          await supabase.from('programmes').delete().eq('id', btn.dataset.delete);
          showSuccess('Programme supprimé.');
          loadProgrammes();
        });
      });
    });

  } catch (err) { console.error(err); }
}

function initProgrammeForm() {
  document.getElementById('btn-new-programme')?.addEventListener('click', () => {
    editingProgrammeId = null;
    document.getElementById('form-programme-title').textContent = 'Nouveau programme';
    document.getElementById('form-programme').reset();
    document.getElementById('prog-actif').checked = true;
    document.getElementById('form-programme-wrap').style.display = 'block';
    document.getElementById('form-programme-wrap').scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('btn-cancel-programme')?.addEventListener('click', () => {
    document.getElementById('form-programme-wrap').style.display = 'none';
    editingProgrammeId = null;
  });

  document.getElementById('prog-titre')?.addEventListener('input', e => {
    if (!editingProgrammeId) {
      document.getElementById('prog-slug').value = e.target.value
        .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
  });

  document.getElementById('form-programme')?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('btn-save-programme');
    btn.disabled = true; btn.textContent = '...';

    const payload = {
      titre:             document.getElementById('prog-titre').value,
      slug:              document.getElementById('prog-slug').value,
      prix:              parseFloat(document.getElementById('prog-prix').value),
      prix_promo:        document.getElementById('prog-prix-promo').value || null,
      categorie:         document.getElementById('prog-categorie').value,
      niveau:            document.getElementById('prog-niveau').value,
      duree_heures:      parseInt(document.getElementById('prog-duree').value) || null,
      nb_modules:        parseInt(document.getElementById('prog-modules').value) || null,
      image_url:         document.getElementById('prog-image').value || null,
      description_courte:document.getElementById('prog-desc-courte').value,
      description:       document.getElementById('prog-desc').value,
      actif:             document.getElementById('prog-actif').checked
    };

    try {
      if (editingProgrammeId) {
        await supabase.from('programmes').update(payload).eq('id', editingProgrammeId);
        showSuccess('Programme mis à jour.');
      } else {
        await supabase.from('programmes').insert(payload);
        showSuccess('Programme créé !');
      }
      document.getElementById('form-programme-wrap').style.display = 'none';
      editingProgrammeId = null;
      loadProgrammes();
    } catch (err) {
      showError('Erreur : ' + err.message);
    } finally {
      btn.disabled = false; btn.textContent = 'Enregistrer';
    }
  });
}

function editProgramme(p) {
  if (!p) return;
  editingProgrammeId = p.id;
  document.getElementById('form-programme-title').textContent = 'Modifier le programme';
  document.getElementById('prog-titre').value        = p.titre || '';
  document.getElementById('prog-slug').value         = p.slug || '';
  document.getElementById('prog-prix').value         = p.prix || '';
  document.getElementById('prog-prix-promo').value   = p.prix_promo || '';
  document.getElementById('prog-categorie').value    = p.categorie || 'musculation';
  document.getElementById('prog-niveau').value       = p.niveau || 'debutant';
  document.getElementById('prog-duree').value        = p.duree_heures || '';
  document.getElementById('prog-modules').value      = p.nb_modules || '';
  document.getElementById('prog-image').value        = p.image_url || '';
  document.getElementById('prog-desc-courte').value  = p.description_courte || '';
  document.getElementById('prog-desc').value         = p.description || '';
  document.getElementById('prog-actif').checked      = p.actif;
  document.getElementById('form-programme-wrap').style.display = 'block';
  document.getElementById('form-programme-wrap').scrollIntoView({ behavior: 'smooth' });
}

/* ══════════════════════════════════════════════════════════
   RÉSERVATIONS
══════════════════════════════════════════════════════════ */
async function loadReservations() {
  const tbody = document.getElementById('reservations-tbody');
  tbody.innerHTML = `<tr><td colspan="6" class="table-loading"><div class="spinner"></div></td></tr>`;

  try {
    const { data, error } = await supabase
      .from('reservations')
      .select('*, profiles(full_name)')
      .order('date_heure', { ascending: true });

    if (error) throw error;
    allReservations = data || [];
    renderReservations(allReservations);

    document.getElementById('filter-resa-statut')?.addEventListener('change', e => {
      const v = e.target.value;
      renderReservations(v === 'all' ? allReservations : allReservations.filter(r => r.statut === v));
    });

  } catch (err) { console.error(err); }
}

function renderReservations(list) {
  const tbody = document.getElementById('reservations-tbody');
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--white-muted);padding:32px">Aucune réservation</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(r => {
    const d = new Date(r.date_heure);
    const typeLabel = { visio: '💻 Visio', domicile: '🏠 Domicile', salle: '🏋️ Salle' }[r.type] || r.type;
    return `<tr>
      <td><strong>${r.profiles?.full_name || 'Client'}</strong></td>
      <td>${typeLabel}</td>
      <td>${d.toLocaleDateString('fr-FR', {weekday:'short',day:'numeric',month:'short'})} ${d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</td>
      <td>${r.notes || '—'}</td>
      <td><span class="status-badge status-${r.statut}">${r.statut}</span></td>
      <td>
        <div class="table-actions">
          ${r.statut === 'en_attente' ? `<button class="btn-xs confirm" data-confirm="${r.id}">Confirmer</button>` : ''}
          <button class="btn-xs danger" data-cancel="${r.id}">Annuler</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  tbody.querySelectorAll('[data-confirm]').forEach(btn => {
    btn.addEventListener('click', async () => {
      await supabase.from('reservations').update({ statut: 'confirme' }).eq('id', btn.dataset.confirm);
      showSuccess('Créneau confirmé.');
      loadReservations();
    });
  });

  tbody.querySelectorAll('[data-cancel]').forEach(btn => {
    btn.addEventListener('click', () => {
      showModal('Annuler le créneau', 'Confirmer l\'annulation de ce créneau ?', async () => {
        await supabase.from('reservations').update({ statut: 'annule' }).eq('id', btn.dataset.cancel);
        showSuccess('Créneau annulé.');
        loadReservations();
      });
    });
  });
}

/* ══════════════════════════════════════════════════════════
   PAIEMENTS
══════════════════════════════════════════════════════════ */
async function loadPaiements() {
  const tbody = document.getElementById('paiements-tbody');
  tbody.innerHTML = `<tr><td colspan="6" class="table-loading"><div class="spinner"></div></td></tr>`;

  try {
    const now   = new Date();
    const debut_mois = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const debut_an   = new Date(now.getFullYear(), 0, 1).toISOString();

    const { data, error } = await supabase
      .from('achats')
      .select('*, profiles(full_name), programmes(titre)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    allPaiements = data || [];

    // KPIs
    const actifs   = allPaiements.filter(a => a.statut === 'active');
    const mois     = actifs.filter(a => a.created_at >= debut_mois).reduce((s,a)=>s+(a.montant||0), 0);
    const annee    = actifs.filter(a => a.created_at >= debut_an).reduce((s,a)=>s+(a.montant||0), 0);

    document.getElementById('kpi-mois').textContent    = `${mois}€`;
    document.getElementById('kpi-annee').textContent   = `${annee}€`;
    document.getElementById('kpi-abonnes').textContent = actifs.length;

    renderPaiements(allPaiements);

    document.getElementById('filter-statut')?.addEventListener('change', e => {
      const v = e.target.value;
      renderPaiements(v === 'all' ? allPaiements : allPaiements.filter(a => a.statut === v));
    });

  } catch (err) { console.error(err); }
}

function renderPaiements(list) {
  const tbody = document.getElementById('paiements-tbody');
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--white-muted);padding:32px">Aucun paiement</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(a => `
    <tr>
      <td><strong>${a.profiles?.full_name || 'Client'}</strong></td>
      <td>${a.programmes?.titre || '—'}</td>
      <td style="color:var(--gold);font-weight:600">${a.montant || 0}€</td>
      <td><span class="status-badge status-${a.statut}">${a.statut}</span></td>
      <td>${new Date(a.created_at).toLocaleDateString('fr-FR')}</td>
      <td>
        <div class="table-actions">
          ${a.statut === 'pending'
            ? `<button class="btn-xs confirm" data-activate="${a.id}">Activer</button>`
            : ''}
          ${a.statut === 'active'
            ? `<button class="btn-xs danger" data-cancel-pay="${a.id}">Annuler</button>`
            : ''}
        </div>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-activate]').forEach(btn => {
    btn.addEventListener('click', async () => {
      await supabase.from('achats').update({ statut: 'active' }).eq('id', btn.dataset.activate);
      showSuccess('Abonnement activé.');
      loadPaiements();
    });
  });

  tbody.querySelectorAll('[data-cancel-pay]').forEach(btn => {
    btn.addEventListener('click', () => {
      showModal('Annuler l\'abonnement', 'Confirmer l\'annulation de cet abonnement ?', async () => {
        await supabase.from('achats').update({ statut: 'cancelled' }).eq('id', btn.dataset.cancelPay);
        showSuccess('Abonnement annulé.');
        loadPaiements();
      });
    });
  });
}

/* ══════════════════════════════════════════════════════════
   MESSAGES
══════════════════════════════════════════════════════════ */
async function loadMessages() {
  const list = document.getElementById('messages-list');
  list.innerHTML = `<div class="loader"><div class="spinner"></div></div>`;

  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      list.innerHTML = `<div class="admin-empty"><span>💬</span>Aucun message reçu</div>`;
      return;
    }

    const sujetLabels = {
      offre: 'Renseignements offre',
      programme: 'Programme sur mesure',
      grossesse: 'Grossesse / post-partum',
      domicile: 'Coaching à domicile',
      autre: 'Autre'
    };

    list.innerHTML = data.map(m => `
      <div class="message-card">
        <div class="message-header">
          <div class="message-sender">
            <strong>${m.prenom || ''} ${m.nom || ''}</strong>
            <small>📧 ${m.email} ${m.tel ? '· 📞 ' + m.tel : ''}</small>
          </div>
          <span class="message-date">${new Date(m.created_at).toLocaleDateString('fr-FR', {day:'numeric',month:'long',year:'numeric'})}</span>
        </div>
        <div class="message-sujet">${sujetLabels[m.sujet] || m.sujet || 'Message'}</div>
        <div class="message-body">${m.message || ''}</div>
        <div class="message-actions">
          <a href="mailto:${m.email}?subject=Re: ${encodeURIComponent(sujetLabels[m.sujet]||'Votre message')}" class="btn btn-sm btn-primary">Répondre par email</a>
          ${m.tel ? `<a href="tel:${m.tel}" class="btn btn-sm btn-gold-outline">Appeler</a>` : ''}
          <button class="btn btn-sm btn-outline" data-delete-msg="${m.id}">Supprimer</button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('[data-delete-msg]').forEach(btn => {
      btn.addEventListener('click', () => {
        showModal('Supprimer le message', 'Supprimer définitivement ce message ?', async () => {
          await supabase.from('contacts').delete().eq('id', btn.dataset.deleteMsg);
          showSuccess('Message supprimé.');
          loadMessages();
        });
      });
    });

  } catch (err) { console.error(err); }
}
