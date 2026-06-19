/* ============================================================
   OFFRES.JS — Taya Fitness · Plans dynamiques depuis Supabase
   ============================================================ */

import { initNavbar } from './navbar.js';
import { initFooter } from './footer.js';
import { supabase } from './supabase.js';

const CHECKOUT_URL = 'https://esylzsacjkimcqxllhwd.supabase.co/functions/v1/stripe-checkout';

let isAnnuel = false;
let currentPlans = [];

document.addEventListener('DOMContentLoaded', async () => {
  initNavbar();
  initFooter();
  initBillingToggle();
  handleMessages();

  await loadPlans();

  // Temps réel — mise à jour automatique dès qu'un plan change dans le CRM
  supabase
    .channel('subscription_plans_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'subscription_plans' }, () => {
      loadPlans();
    })
    .subscribe();

  const hash = window.location.hash;
  if (hash) {
    setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
  }
});

// ── Chargement et rendu des plans ────────────────────────────────────────────

async function loadPlans() {
  const { data: plans, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('price', { ascending: true });

  if (error) {
    console.error('Erreur chargement plans:', error);
    document.getElementById('plans-grid').innerHTML =
      '<div style="grid-column:1/-1;text-align:center;padding:60px;color:rgba(255,255,255,0.4);">Impossible de charger les formules.</div>';
    return;
  }

  currentPlans = plans || [];
  renderPlans(currentPlans);
}

function renderPlans(plans) {
  const grid = document.getElementById('plans-grid');
  if (!grid) return;

  if (!plans.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:rgba(255,255,255,0.4);">Aucune formule disponible pour le moment.</div>';
    const comp = document.getElementById('comparatif-section');
    if (comp) comp.style.display = 'none';
    return;
  }

  grid.innerHTML = plans.map(plan => {
    const slug = plan.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-');
    const priceM = plan.price;
    const priceA = Math.round(plan.price * 0.8);
    const isFeatured = plan.is_best_seller;
    const cycle = plan.billing_cycle === 'yearly' ? '/an' : '/mois';
    const features = (plan.features || []);
    const btnClass = isFeatured ? 'btn btn-primary' : 'btn btn-gold-outline';
    const accentColor = plan.color || '#e8c547';

    return `
      <div class="offre-detail-card${isFeatured ? ' featured' : ''}" id="${slug}"
           style="${isFeatured ? `--plan-accent:${accentColor};border-color:${accentColor};` : ''}">
        ${isFeatured ? `<div class="popular-badge" style="background:${accentColor};color:#000;">⭐ Best-seller</div>` : ''}
        <div class="offre-detail-header">
          <div class="offre-name${isFeatured ? ' gold' : ''}">${escHtml(plan.name)}</div>
          <div class="offre-detail-price">
            <span class="price-num" data-mensuel="${priceM}" data-annuel="${priceA}">${isAnnuel ? priceA : priceM}€</span>
            <span class="price-per">${cycle}</span>
          </div>
          ${plan.description ? `<p class="offre-tagline">${escHtml(plan.description)}</p>` : ''}
        </div>
        ${features.length ? `
        <ul class="offre-detail-features">
          ${features.map(f => `<li class="feat-yes">✓ ${escHtml(f)}</li>`).join('')}
        </ul>` : ''}
        <div class="offre-detail-footer">
          <button
            class="${btnClass}"
            style="width:100%;justify-content:center;"
            data-checkout="abonnement"
            data-plan="${slug}"
            data-plan-name="${escHtml(plan.name)}">
            Choisir ${escHtml(plan.name)}
          </button>
        </div>
      </div>`;
  }).join('');

  // Réactiver les boutons de checkout après rendu
  initCheckoutButtons();

  // Afficher le comparatif si des plans existent
  const comp = document.getElementById('comparatif-section');
  if (comp) comp.style.display = '';
}

function escHtml(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Toggle mensuel / annuel ───────────────────────────────────────────────────

function initBillingToggle() {
  const toggle  = document.getElementById('toggle-annuel');
  const labelM  = document.getElementById('label-mensuel');
  const labelA  = document.getElementById('label-annuel');

  toggle?.addEventListener('change', () => {
    isAnnuel = toggle.checked;
    labelM.classList.toggle('active', !isAnnuel);
    labelA.classList.toggle('active',  isAnnuel);
    document.querySelectorAll('.price-num').forEach(el => {
      el.textContent = `${isAnnuel ? el.dataset.annuel : el.dataset.mensuel}€`;
    });
  });
}

// ── Boutons Stripe checkout ───────────────────────────────────────────────────

function initCheckoutButtons() {
  document.querySelectorAll('[data-checkout="abonnement"]').forEach(btn => {
    // Éviter de doubler les listeners
    btn.replaceWith(btn.cloneNode(true));
  });

  document.querySelectorAll('[data-checkout="abonnement"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const plan = btn.dataset.plan;
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Chargement...';

      try {
        const { data: { user } } = await supabase.auth.getUser();

        const res = await fetch(CHECKOUT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'abonnement',
            plan,
            user_id:    user?.id    || '',
            user_email: user?.email || '',
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.url) throw new Error(data.error || 'Erreur');
        window.location.href = data.url;

      } catch (err) {
        console.error('Checkout error:', err);
        showToast('Une erreur est survenue. Veuillez réessayer.', 'error');
        btn.disabled = false;
        btn.textContent = originalText;
      }
    });
  });
}

// ── Messages succès / annulation ─────────────────────────────────────────────

function handleMessages() {
  const params = new URLSearchParams(window.location.search);

  if (params.get('abonnement') === 'success') {
    const plan = params.get('plan') || '';
    showToast(`🎉 Abonnement ${plan} activé ! Bienvenue dans Taya Fitness.`, 'success');
    window.history.replaceState({}, '', '/offres');
  }
  if (params.get('cancelled') === '1') {
    showToast('Paiement annulé. Tu peux réessayer quand tu veux.', 'info');
    window.history.replaceState({}, '', '/offres');
  }
}

function showToast(message, type = 'info') {
  const colors    = { success: '#3ecf8e', error: '#ff4d6a', info: '#ff6b4a' };
  const textColors = { success: '#0d1b2a', error: '#fff',    info: '#fff'    };
  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed;bottom:32px;left:50%;transform:translateX(-50%);
    background:${colors[type]};color:${textColors[type]};
    padding:16px 28px;border-radius:12px;font-weight:600;
    font-size:0.95rem;z-index:9999;box-shadow:0 8px 32px rgba(0,0,0,0.3);
    white-space:nowrap;max-width:90vw;text-align:center;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}
