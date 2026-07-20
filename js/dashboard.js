/* ============================================================
   DASHBOARD.JS
============================================================ */

import { initNavbar } from './navbar.js';
import { initFooter } from './footer.js';
import { requireAuth, signOut, getProfile, updateProfile } from './auth.js';
import { supabase } from './supabase.js';

let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  initNavbar();
  initFooter();

  currentUser = await requireAuth('/auth?redirect=/dashboard');
  if (!currentUser) return;

  loadUserInfo();
  initSidebar();
  initTab(getDefaultTab());
  document.getElementById('sidebar-logout')?.addEventListener('click', signOut);
});

function getDefaultTab() {
  const hash = window.location.hash.replace('#', '');
  const param = new URLSearchParams(window.location.search).get('tab');
  // « Mon espace » ouvre sur le profil : c'est la première chose qu'un
  // nouveau membre doit compléter, et le premier onglet de la colonne.
  return param || hash || 'profil';
}

/* ── Info utilisateur sidebar ────────────────────────────── */
async function loadUserInfo() {
  const name = currentUser.user_metadata?.full_name || currentUser.email || 'Utilisateur';
  const email = currentUser.email;

  setAvatar(currentUser.user_metadata?.avatar_url || null, name);
  document.getElementById('sidebar-name').textContent = name.split(' ')[0];
  document.getElementById('sidebar-email').textContent = email;
  initAvatarUpload();
}

/* ── Photo de profil ─────────────────────────────────────── */

/** Affiche la photo si elle existe, sinon l'initiale du prénom. */
function setAvatar(url, name) {
  const el = document.getElementById('sidebar-avatar');
  if (!el) return;
  const initiale = (name || currentUser?.email || '?')[0].toUpperCase();
  if (url) {
    // Le paramètre force le navigateur à recharger l'image après un changement.
    el.innerHTML = `<img src="${url}" alt="Ma photo de profil">`;
  } else {
    el.textContent = initiale;
  }
}

/** Charge un fichier image en objet Image exploitable. */
function chargerImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload  = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image illisible')); };
    img.src = url;
  });
}

const AVATAR_PX = 400;   // taille finale enregistrée

/**
 * Ouvre l'outil de recadrage : l'image se déplace au doigt/à la souris sous
 * un disque, la molette ou le curseur règle le zoom. Renvoie l'image finale
 * (400 px, JPEG) ou null si l'utilisateur annule.
 *
 * On n'envoie que le disque visible : une photo de téléphone de 5 Mo
 * ressort sous les 100 Ko.
 */
function ouvrirRecadrage(img) {
  return new Promise((resolve) => {
    const D = 260;                                   // diamètre affiché
    // Échelle minimale : l'image doit toujours couvrir tout le disque.
    const echelleMin = Math.max(D / img.width, D / img.height);
    let echelle = echelleMin;
    let x = (D - img.width  * echelle) / 2;          // décalage courant
    let y = (D - img.height * echelle) / 2;

    const overlay = document.createElement('div');
    overlay.className = 'crop-overlay';
    overlay.innerHTML = `
      <div class="crop-box" role="dialog" aria-label="Recadrer ma photo">
        <h3>Recadre ta photo</h3>
        <p class="crop-aide">Fais glisser l'image pour la positionner,<br>et utilise le curseur pour zoomer.</p>
        <div class="crop-zone" id="crop-zone"><canvas id="crop-canvas" width="${D}" height="${D}"></canvas></div>
        <input type="range" class="crop-range" id="crop-range" min="1" max="4" step="0.01" value="1">
        <div class="crop-actions">
          <button type="button" class="crop-annuler" id="crop-annuler">Annuler</button>
          <button type="button" class="crop-valider" id="crop-valider">Utiliser cette photo</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const zone   = overlay.querySelector('#crop-zone');
    const canvas = overlay.querySelector('#crop-canvas');
    const range  = overlay.querySelector('#crop-range');
    const ctx    = canvas.getContext('2d');

    // Empêche de laisser un bord vide : l'image reste toujours couvrante.
    function borner() {
      const l = img.width * echelle, h = img.height * echelle;
      x = Math.min(0, Math.max(D - l, x));
      y = Math.min(0, Math.max(D - h, y));
    }
    function dessiner() {
      borner();
      ctx.clearRect(0, 0, D, D);
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, x, y, img.width * echelle, img.height * echelle);
    }
    dessiner();

    // ── Déplacement (souris et tactile via Pointer Events) ──
    let actif = false, px = 0, py = 0;
    zone.addEventListener('pointerdown', (e) => {
      actif = true; px = e.clientX; py = e.clientY;
      zone.setPointerCapture(e.pointerId);
    });
    zone.addEventListener('pointermove', (e) => {
      if (!actif) return;
      x += e.clientX - px; y += e.clientY - py;
      px = e.clientX; py = e.clientY;
      dessiner();
    });
    const relacher = () => { actif = false; };
    zone.addEventListener('pointerup', relacher);
    zone.addEventListener('pointercancel', relacher);

    // ── Zoom : curseur, molette, et pincement à deux doigts ──
    function zoomer(facteur, cx = D / 2, cy = D / 2) {
      const avant = echelle;
      echelle = Math.min(echelleMin * 4, Math.max(echelleMin, echelle * facteur));
      // On zoome autour du point visé, pas du coin.
      x = cx - (cx - x) * (echelle / avant);
      y = cy - (cy - y) * (echelle / avant);
      range.value = (echelle / echelleMin).toFixed(2);
      dessiner();
    }
    range.addEventListener('input', () => {
      const cible = echelleMin * parseFloat(range.value);
      zoomer(cible / echelle);
    });
    zone.addEventListener('wheel', (e) => {
      e.preventDefault();
      const r = zone.getBoundingClientRect();
      zoomer(e.deltaY < 0 ? 1.08 : 1 / 1.08, e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });

    // ── Sortie ──
    function fermer(resultat) { overlay.remove(); resolve(resultat); }
    overlay.querySelector('#crop-annuler').addEventListener('click', () => fermer(null));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) fermer(null); });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { document.removeEventListener('keydown', esc); fermer(null); }
    });

    overlay.querySelector('#crop-valider').addEventListener('click', (e) => {
      e.target.disabled = true;
      // On rejoue le même cadrage à la taille finale.
      const out = document.createElement('canvas');
      out.width = out.height = AVATAR_PX;
      const k = AVATAR_PX / D;
      const octx = out.getContext('2d');
      octx.imageSmoothingQuality = 'high';
      octx.drawImage(img, x * k, y * k, img.width * echelle * k, img.height * echelle * k);
      out.toBlob(b => fermer(b), 'image/jpeg', 0.9);
    });
  });
}

function initAvatarUpload() {
  const btn = document.getElementById('avatar-btn');
  const input = document.getElementById('avatar-input');
  const spin = document.getElementById('avatar-spin');
  if (!btn || !input || btn.dataset.pret) return;
  btn.dataset.pret = '1';

  btn.addEventListener('click', () => input.click());

  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    input.value = '';                       // permet de re-choisir le même fichier
    if (!file) return;

    if (!file.type.startsWith('image/')) { alert('Choisis une image.'); return; }
    if (file.size > 15 * 1024 * 1024)    { alert('Image trop lourde (15 Mo maximum).'); return; }

    // Recadrage avant tout envoi : rien ne part si l'utilisateur annule.
    let blob;
    try {
      blob = await ouvrirRecadrage(await chargerImage(file));
    } catch (err) {
      console.error('Lecture de l\'image:', err);
      alert("Cette image n'a pas pu être ouverte. Essaie avec une autre.");
      return;
    }
    if (!blob) return;

    spin.hidden = false;
    try {
      // Un dossier par utilisateur : la règle de sécurité n'autorise que le sien.
      const chemin = `${currentUser.id}/avatar.jpg`;

      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(chemin, blob, { upsert: true, contentType: 'image/jpeg', cacheControl: '3600' });
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(chemin);
      const url = `${publicUrl}?v=${Date.now()}`;   // contourne le cache navigateur

      await supabase.from('profiles').upsert({ id: currentUser.id, avatar_url: url, updated_at: new Date().toISOString() });
      await supabase.auth.updateUser({ data: { avatar_url: url } });

      setAvatar(url, currentUser.user_metadata?.full_name);
    } catch (err) {
      console.error('Envoi de la photo:', err);
      alert("La photo n'a pas pu être enregistrée. Réessaie dans un instant.");
    } finally {
      spin.hidden = true;
    }
  });
}

/* ── Navigation sidebar ──────────────────────────────────── */
function initSidebar() {
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = link.dataset.tab;
      document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      initTab(tab);
    });
  });
}

function initTab(tab) {
  document.querySelectorAll('.dash-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`panel-${tab}`)?.classList.add('active');
  document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');

  if (tab === 'mes-programmes') loadMesProgrammes();
  if (tab === 'progression') loadProgression();
  if (tab === 'creneaux') loadCreneaux();
  if (tab === 'profil') initProfilForm();
}

/* ── Mes programmes ──────────────────────────────────────── */
const ABO_URL = 'https://esylzsacjkimcqxllhwd.supabase.co/functions/v1/gerer-abonnement';

/** Appelle la fonction serveur qui gère l'abonnement (état, résiliation, reprise). */
async function appelAbonnement(action) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Session expirée. Reconnecte-toi.');
  const res = await fetch(ABO_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ action }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Opération impossible.');
  return data;
}

const dateFr = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
const euros  = (n) => (n === null || n === undefined) ? '—' : Number(n).toFixed(2).replace('.00', '') + ' €';

/**
 * Panneau « Mes formules & achats » : l'abonnement en cours et tout ce qui a
 * été acheté à l'unité, avec la gestion de la résiliation.
 */
async function loadMesProgrammes() {
  const el = document.getElementById('mes-programmes-list');
  el.innerHTML = `<div class="loader"><div class="spinner"></div></div>`;

  try {
    // L'état de l'abonnement vient du serveur : c'est lui qui fait autorité
    // sur l'engagement, le navigateur ne fait qu'afficher.
    const [etat, achatsRes] = await Promise.all([
      appelAbonnement('etat').catch(err => ({ erreur: err.message })),
      supabase.from('achats')
        .select('*, programmes(id, titre, slug, image_url, nb_modules)')
        .or(`user_id.eq.${currentUser.id},email.ilike.${currentUser.email}`)
        .order('created_at', { ascending: false }),
    ]);

    const achats = (achatsRes.data || []).filter(a => a.programme_id && a.programmes);
    const html = [carteAbonnement(etat), blocAchats(achats)].filter(Boolean).join('');

    el.innerHTML = html || `
      <div class="dash-empty">
        <span>🎯</span>
        <p>Tu n'as encore souscrit à aucune formule ni acheté de programme.</p>
        <a href="/offres" class="btn btn-primary">Découvrir les offres</a>
      </div>`;

    brancherActionsAbonnement();
  } catch (err) {
    console.error(err);
    el.innerHTML = `<p style="color:var(--white-muted)">Erreur de chargement : ${err.message}</p>`;
  }
}

/* ── L'abonnement en cours ───────────────────────────────── */
function carteAbonnement(etat) {
  if (etat?.erreur) {
    return `<div class="formule-card"><p class="formule-note">Impossible de charger ton abonnement : ${etat.erreur}</p></div>`;
  }
  const a = etat?.abonnement;
  if (!a) {
    return `
      <div class="formule-card">
        <div class="formule-kicker">Abonnement</div>
        <p class="formule-none">Tu n'as pas d'abonnement en cours.</p>
        <a href="/offres" class="btn btn-primary btn-sm">Voir les formules</a>
      </div>`;
  }

  const periode = a.billing === 'annual' ? 'an' : 'mois';
  const enEchec = a.statut === 'past_due';

  // Trois situations distinctes, trois messages distincts.
  let etatBloc, action;
  if (a.resiliation_programmee) {
    etatBloc = `<div class="formule-etat ferme">
      🔔 Résiliation enregistrée — ton accès reste ouvert jusqu'au <strong>${dateFr(a.periode_fin)}</strong>,
      puis l'abonnement s'arrête. Aucun prélèvement ne sera fait ensuite.</div>`;
    action = `<button class="btn btn-primary btn-sm" data-abo="reprendre">Reprendre mon abonnement</button>`;
  } else if (!a.engagement_termine) {
    etatBloc = `<div class="formule-etat bloque">
      🔒 Engagement de ${a.engagement_mois} mois en cours, jusqu'au <strong>${dateFr(a.engagement_fin)}</strong>.
      La résiliation sera possible à partir de cette date.</div>`;
    action = `<button class="btn btn-outline btn-sm" disabled>Résilier</button>`;
  } else {
    etatBloc = `<div class="formule-etat libre">
      ✓ Engagement terminé — tu peux résilier quand tu veux.</div>`;
    action = `<button class="btn btn-outline btn-sm" data-abo="resilier">Résilier mon abonnement</button>`;
  }

  return `
    <div class="formule-card${enEchec ? ' alerte' : ''}">
      <div class="formule-kicker">Abonnement${enEchec ? ' · paiement en échec' : ''}</div>
      <div class="formule-titre">
        <h3>${escapeHtml(a.nom)}</h3>
        <span class="formule-prix">${euros(a.prix)}<small>/${periode}</small></span>
      </div>
      ${enEchec ? `<div class="formule-etat alerte-txt">
        ⚠️ Ton dernier prélèvement a échoué. Mets ta carte à jour pour ne pas perdre ton accès — écris à Sarah.</div>` : ''}
      <dl class="formule-infos">
        <div><dt>Souscrit le</dt><dd>${dateFr(a.debut)}</dd></div>
        <div><dt>Période en cours jusqu'au</dt><dd>${dateFr(a.periode_fin)}</dd></div>
        <div><dt>Formule</dt><dd>${a.mode === 'online' ? 'Coaching en ligne' : 'Coaching en salle'}</dd></div>
      </dl>
      ${etatBloc}
      <div class="formule-actions">${action}<span class="formule-msg" id="abo-msg"></span></div>
    </div>`;
}

/* ── Les programmes achetés à l'unité ────────────────────── */
function blocAchats(achats) {
  if (!achats.length) return '';
  return `
    <div class="formule-kicker" style="margin:32px 0 14px">Programmes achetés · accès à vie</div>
    <div class="mes-programmes-grid">${achats.map(a => achatCard(a)).join('')}</div>`;
}

/* ── Résiliation / reprise ───────────────────────────────── */
function brancherActionsAbonnement() {
  document.querySelectorAll('[data-abo]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.abo;
      const msg = document.getElementById('abo-msg');

      if (action === 'resilier' &&
          !confirm("Confirmer la résiliation ?\n\nTon accès reste ouvert jusqu'à la fin de la période déjà payée. Tu pourras revenir sur ta décision jusqu'à cette date.")) {
        return;
      }

      const texte = btn.textContent;
      btn.disabled = true; btn.textContent = '...';
      if (msg) { msg.textContent = ''; msg.className = 'formule-msg'; }

      try {
        const r = await appelAbonnement(action);
        if (msg) { msg.textContent = r.message || 'C\'est fait.'; msg.className = 'formule-msg ok'; }
        setTimeout(loadMesProgrammes, 1400);   // on réaffiche l'état réel
      } catch (err) {
        if (msg) { msg.textContent = err.message; msg.className = 'formule-msg ko'; }
        btn.disabled = false; btn.textContent = texte;
      }
    });
  });
}

function escapeHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function achatCard(achat) {
  const prog = achat.programmes;
  if (!prog) return '';
  const statusLabel = achat.statut === 'active' ? '✓ Actif' : '⏳ En attente';
  const statusClass = achat.statut === 'active' ? 'active' : 'pending';

  return `
    <div class="achat-card">
      <div class="achat-card-img">
        ${prog.image_url
          ? `<img src="${prog.image_url}" alt="${prog.titre}" loading="lazy" />`
          : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:2.5rem;background:var(--black-border)">🏋️</div>`
        }
      </div>
      <div class="achat-card-body">
        <h3>${prog.titre}</h3>
        <span class="achat-status ${statusClass}">${statusLabel}</span>
        <div class="progress-bar-wrap">
          <div class="progress-bar-label">
            <span>Progression</span>
            <span id="prog-pct-${prog.id}">0%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-bar-fill" id="prog-bar-${prog.id}" style="width:0%"></div>
          </div>
        </div>
        <a href="/programme-detail?slug=${prog.slug}" class="btn btn-outline btn-sm">Accéder →</a>
      </div>
    </div>`;
}

/* ── Progression ─────────────────────────────────────────── */
async function loadProgression() {
  const el = document.getElementById('progression-content');
  el.innerHTML = `<div class="loader"><div class="spinner"></div></div>`;

  try {
    const { data: achats } = await supabase
      .from('achats')
      .select('*, programmes(id, titre, nb_modules, modules(id))')
      .eq('user_id', currentUser.id)
      .eq('statut', 'active');

    if (!achats || achats.length === 0) {
      el.innerHTML = `<div class="dash-empty"><span>📈</span><p>Commence un programme pour suivre ta progression.</p></div>`;
      return;
    }

    const { data: progressions } = await supabase
      .from('progression')
      .select('module_id, termine')
      .eq('user_id', currentUser.id)
      .eq('termine', true);

    const doneIds = new Set((progressions || []).map(p => p.module_id));

    el.innerHTML = `<div class="progression-list">
      ${achats.map(a => {
        const prog = a.programmes;
        const modules = prog?.modules || [];
        const done = modules.filter(m => doneIds.has(m.id)).length;
        const total = modules.length || prog?.nb_modules || 1;
        const pct = Math.round((done / total) * 100);
        return `
          <div class="progression-item">
            <h4>${prog?.titre || 'Programme'}</h4>
            <div class="progress-bar-wrap">
              <div class="progress-bar-label">
                <span>${done} / ${total} modules terminés</span>
                <span>${pct}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-bar-fill" style="width:${pct}%"></div>
              </div>
            </div>
          </div>`;
      }).join('')}
    </div>`;
  } catch (err) {
    console.error(err);
    el.innerHTML = `<p style="color:var(--white-muted)">Erreur de chargement.</p>`;
  }
}

/* ── Créneaux ────────────────────────────────────────────── */
async function loadCreneaux() {
  const el = document.getElementById('creneaux-content');
  el.innerHTML = `<div class="loader"><div class="spinner"></div></div>`;

  try {
    const { data: creneaux, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('user_id', currentUser.id)
      .gte('date_heure', new Date().toISOString())
      .order('date_heure', { ascending: true });

    if (error || !creneaux || creneaux.length === 0) {
      el.innerHTML = `
        <div class="dash-empty">
          <span>📅</span>
          <p>Aucun créneau réservé.</p>
          <a href="/offres" class="btn btn-primary">Réserver un créneau</a>
        </div>`;
      return;
    }

    el.innerHTML = `<div class="creneaux-list">
      ${creneaux.map(c => {
        const d = new Date(c.date_heure);
        return `
          <div class="creneau-item">
            <div class="creneau-date">
              <strong>${d.getDate()}</strong>
              <small>${d.toLocaleString('fr-FR', { month: 'short' })}</small>
            </div>
            <div class="creneau-info">
              <strong>${c.type || 'Visio coaching'}</strong>
              <small>${d.toLocaleString('fr-FR', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}</small>
            </div>
            <span class="achat-status active">Confirmé</span>
          </div>`;
      }).join('')}
    </div>`;
  } catch (err) {
    el.innerHTML = `<div class="dash-empty"><span>📅</span><p>Aucun créneau réservé.</p></div>`;
  }
}

/* ── Profil ──────────────────────────────────────────────── */
async function initProfilForm() {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .maybeSingle();

    document.getElementById('profil-email').value = currentUser.email;

    if (profile) {
      document.getElementById('profil-prenom').value = profile.prenom || '';
      document.getElementById('profil-nom').value = profile.nom || '';
      document.getElementById('profil-telephone').value = profile.telephone || '';
      document.getElementById('profil-date-naissance').value = profile.date_naissance || '';
      document.getElementById('profil-gender').value = profile.gender || '';
      document.getElementById('profil-adresse').value = profile.adresse || '';
      document.getElementById('profil-weight').value = profile.weight_kg || '';
      document.getElementById('profil-height').value = profile.height_cm || '';
      document.getElementById('profil-notes').value = profile.notes || '';

      const displayName = profile.prenom || profile.full_name?.split(' ')[0] || currentUser.email.split('@')[0];
      document.getElementById('sidebar-name').textContent = displayName;
      // La photo enregistrée prime sur l'initiale.
      setAvatar(profile.avatar_url || currentUser.user_metadata?.avatar_url || null, displayName);
    } else {
      const name = currentUser.user_metadata?.full_name || '';
      const parts = name.split(' ');
      document.getElementById('profil-prenom').value = parts[0] || '';
      document.getElementById('profil-nom').value = parts.slice(1).join(' ') || '';
    }
  } catch (err) {
    console.error('Erreur chargement profil:', err);
  }

  document.getElementById('profil-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type=submit]');
    const alertEl = document.getElementById('profil-alert');

    const prenom = document.getElementById('profil-prenom').value.trim();
    const nom = document.getElementById('profil-nom').value.trim();
    const telephone = document.getElementById('profil-telephone').value.trim();
    const date_naissance = document.getElementById('profil-date-naissance').value || null;
    const gender = document.getElementById('profil-gender').value || null;
    const adresse = document.getElementById('profil-adresse').value.trim() || null;
    const weight_kg = parseFloat(document.getElementById('profil-weight').value) || null;
    const height_cm = parseInt(document.getElementById('profil-height').value) || null;
    const notes = document.getElementById('profil-notes').value.trim() || null;
    const full_name = [prenom, nom].filter(Boolean).join(' ') || null;

    btn.disabled = true;
    btn.textContent = '...';

    try {
      const { error } = await supabase.from('profiles').upsert({
        id: currentUser.id,
        email: currentUser.email,
        prenom, nom, full_name, telephone,
        date_naissance, gender, adresse,
        weight_kg, height_cm, notes,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;

      await supabase.auth.updateUser({ data: { full_name } });

      alertEl.textContent = '✓ Profil mis à jour !';
      alertEl.style.background = '';
      alertEl.style.color = '';
      alertEl.classList.add('show');
      if (prenom) {
        document.getElementById('sidebar-name').textContent = prenom;
        // Ne pas écraser une photo déjà en place.
        if (!document.querySelector('#sidebar-avatar img')) setAvatar(null, prenom);
      }
      setTimeout(() => alertEl.classList.remove('show'), 3000);
    } catch (err) {
      console.error(err);
      // Message précis : « Erreur lors de la mise à jour » masquait la vraie
      // cause (3 colonnes inexistantes) et rendait le bug indiagnosticable.
      alertEl.textContent = 'Enregistrement impossible : ' + (err?.message || 'erreur inconnue');
      alertEl.style.background = 'rgba(239,68,68,0.15)';
      alertEl.style.color = '#f87171';
      alertEl.classList.add('show');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Enregistrer le profil';
    }
  });
}
