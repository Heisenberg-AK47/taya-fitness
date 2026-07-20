/* ============================================================
   PROGRAMMES.JS — Taya Fitness
   ============================================================ */

import { initNavbar } from './navbar.js';
import { initFooter } from './footer.js';
import { supabase } from './supabase.js';
import { startCheckout } from './stripe.js';

let allProgrammes = [];
let filtreCategorie = 'all';
let filtreNiveau    = 'all';

document.addEventListener('DOMContentLoaded', async () => {
  initNavbar();
  initFooter();
  initFiltres();
  handleSuccessMessage();

  // Filtre depuis URL (?categorie=perte-de-poids)
  const params = new URLSearchParams(window.location.search);
  if (params.get('categorie')) {
    filtreCategorie = params.get('categorie');
    document.querySelector(`[data-filter="${filtreCategorie}"]`)?.classList.add('active');
    document.querySelector('#filtres-categorie .filtre-btn[data-filter="all"]')?.classList.remove('active');
  }

  await loadProgrammes();
});

async function loadProgrammes() {
  const grid = document.getElementById('programmes-grid');
  grid.innerHTML = `<div class="loader"><div class="spinner"></div></div>`;

  try {
    const { data, error } = await supabase
      .from('programmes')
      .select('*')
      .eq('actif', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    allProgrammes = data || [];
    renderProgrammes();
  } catch (err) {
    console.error(err);
    document.getElementById('programmes-grid').innerHTML =
      `<div class="empty-state"><span>⚠️</span><p>Impossible de charger les programmes.</p></div>`;
  }
}

function renderProgrammes() {
  const filtered = allProgrammes.filter(p => {
    const catOk = filtreCategorie === 'all' || p.categorie === filtreCategorie;
    const nivOk = filtreNiveau    === 'all' || p.niveau    === filtreNiveau;
    return catOk && nivOk;
  });

  const grid  = document.getElementById('programmes-grid');
  const count = document.getElementById('programmes-count');

  count.textContent = `${filtered.length} programme${filtered.length > 1 ? 's' : ''} trouvé${filtered.length > 1 ? 's' : ''}`;

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state"><span>🔍</span><p>Aucun programme pour ces filtres.</p></div>`;
    return;
  }

  const niveauLabels = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' };

  grid.innerHTML = filtered.map(p => {
    const prix = p.prix_promo ?? p.prix;
    return `
    <div class="programme-card">
      <div class="programme-img">
        ${p.image_url
          ? `<img src="${p.image_url}" alt="${p.titre}" loading="lazy" />`
          : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:3rem;background:var(--black-border)">🏋️</div>`
        }
        <span class="badge badge-${p.niveau || 'debutant'}">${niveauLabels[p.niveau] || 'Tous niveaux'}</span>
      </div>
      <div class="programme-body">
        <div class="programme-meta">
          <span>⏱ ${p.duree_heures || '?'}h</span>
          <span>📚 ${p.nb_modules || '?'} modules</span>
          <span>🏷 ${p.categorie || 'Fitness'}</span>
        </div>
        <h3>${p.titre}</h3>
        <p>${p.description_courte || ''}</p>
        <div class="programme-footer">
          <div class="programme-price">
            ${p.prix_promo ? `<span class="prix-promo">${p.prix}€</span>` : ''}
            <span>${prix}€ <small>/mois</small></span>
          </div>
          <div style="display:flex;gap:8px;">
            <a href="/programme-detail?slug=${p.slug}" class="btn btn-outline btn-sm">Voir</a>
            <button
              class="btn btn-primary btn-sm"
              data-buy="${p.id}"
              data-titre="${p.titre.replace(/"/g, '&quot;')}"
              data-prix="${prix}">
              Acheter
            </button>
          </div>
        </div>
      </div>
    </div>
  `}).join('');

  // Boutons achat Stripe
  grid.querySelectorAll('[data-buy]').forEach(btn => {
    btn.addEventListener('click', async () => {
      await startCheckout({
        type:             'programme',
        programme_id:     btn.dataset.buy,
        programme_titre:  btn.dataset.titre,
        programme_prix:   parseFloat(btn.dataset.prix),
        btnEl:            btn,
      });
    });
  });
}

function initFiltres() {
  document.getElementById('filtres-categorie')?.addEventListener('click', e => {
    const btn = e.target.closest('.filtre-btn');
    if (!btn) return;
    document.querySelectorAll('#filtres-categorie .filtre-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filtreCategorie = btn.dataset.filter;
    renderProgrammes();
  });

  document.getElementById('filtres-niveau')?.addEventListener('click', e => {
    const btn = e.target.closest('.filtre-btn');
    if (!btn) return;
    document.querySelectorAll('#filtres-niveau .filtre-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filtreNiveau = btn.dataset.filter;
    renderProgrammes();
  });
}

function handleSuccessMessage() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('achat') === 'success') {
    showToast('🎉 Achat confirmé ! Retrouve ton programme dans ton espace client.', 'success');
    window.history.replaceState({}, '', '/programmes');
  }
  if (params.get('cancelled') === '1') {
    showToast('Paiement annulé. Tu peux réessayer quand tu veux.', 'info');
    window.history.replaceState({}, '', '/programmes');
  }
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
    background: ${type === 'success' ? '#c5fd7a' : 'var(--gold)'};
    color: ${type === 'success' ? '#0d1b2a' : '#fff'};
    padding: 16px 28px; border-radius: 12px; font-weight: 600;
    font-size: 0.95rem; z-index: 9999; box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}
