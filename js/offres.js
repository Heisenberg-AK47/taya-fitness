/* ============================================================
OFFRES.JS — Taya Fitness · Plans dynamiques depuis Supabase
============================================================ */

import { initNavbar } from './navbar.js';
import { initFooter } from './footer.js';
import { supabase } from './supabase.js';

const CHECKOUT_URL = 'https://esylzsacjkimcqxllhwd.supabase.co/functions/v1/stripe-checkout';
const MODES = { en_salle: '🏋️ En salle', a_domicile: '🏠 À domicile', en_ligne: '💻 En ligne' };

let isAnnuel = false;
let currentPlans = [];

document.addEventListener('DOMContentLoaded', async () => {
  initNavbar();
  initFooter();
  initBillingToggle();
  handleMessages();
  await loadPlans();

  supabase
    .channel('subscription_plans_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'subscription_plans' }, () => loadPlans())
    .subscribe();

  const hash = window.location.hash;
  if (hash) setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
});

// ── Chargement ───────────────────────────────────────────────

async function loadPlans() {
  const { data: plans, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('price', { ascending: true });

  if (error) {
    document.getElementById('plans-grid').innerHTML =
      '<div style="grid-column:1/-1;text-align:center;padding:60px;color:rgba(255,255,255,0.4);">Impossible de charger les formules.</div>';
    return;
  }
  currentPlans = plans || [];
  renderPlans(currentPlans);
}

// ── Rendu des cartes ─────────────────────────────────────────

function renderPlans(plans) {
  const grid = document.getElementById('plans-grid');
  if (!grid) return;

  if (!plans.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:rgba(255,255,255,0.4);">Aucune formule disponible pour le moment.</div>';
    document.getElementById('comparatif-section')?.style.setProperty('display', 'none');
    return;
  }

  // ── Séance découverte ──────────────────────────────────────
  const decouverte = `
  <div class="decouverte-banner">
    <div class="decouverte-left">
      <span class="decouverte-badge">✨ Séance découverte</span>
      <h3>Essaie avant de t'engager</h3>
      <p>Une séance de coaching personnalisé à Fitness Park La Défense avec Sarah. Sans engagement, sans surprise.</p>
      <ul class="decouverte-list">
        <li>✓ Bilan de forme & objectifs</li>
        <li>✓ 1 séance complète en salle</li>
        <li>✓ Plan d'action personnalisé</li>
        <li>✓ Déductible si tu t'abonnes</li>
      </ul>
    </div>
    <div class="decouverte-right">
      <div class="decouverte-price">69€ <span>/ séance unique</span></div>
      <p class="decouverte-note">Paiement sécurisé</p>
      <button class="btn btn-primary decouverte-btn" data-checkout="decouverte" data-plan="seance-decouverte">
        Réserver ma séance
      </button>
    </div>
  </div>`;

  grid.innerHTML = decouverte + plans.map(plan => {
    const slug = plan.name.toLowerCase()
      .replace(/[àáâã]/g,'a').replace(/[éèêë]/g,'e').replace(/[îï]/g,'i')
      .replace(/[ôõ]/g,'o').replace(/[ùûü]/g,'u').replace(/ç/g,'c')
      .replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');

    const isFeatured = plan.is_best_seller;
    const accent = plan.color || '#e8c547';
    const btnClass = isFeatured ? 'btn btn-primary' : 'btn btn-gold-outline';

    const priceM = plan.price;
    const priceA = plan.annual_price || Math.round(plan.price * 0.8);
    const priceHtml = `<span class="price-num" data-mensuel="${priceM}" data-annuel="${priceA}">${isAnnuel ? priceA : priceM}€</span><span class="price-per">/mois</span>
      ${plan.annual_price ? '<div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:4px;">ou ' + plan.annual_price + '€/mois en annuel · économisez ' + Math.round((plan.price - plan.annual_price) * 12) + '€/an</div>' : ''}`;

    const modesHtml = (plan.coaching_modes || [])
      .map(m => '<span style="display:inline-block;font-size:11px;background:rgba(255,255,255,0.07);border-radius:20px;padding:3px 10px;margin:2px 2px 4px 0;color:rgba(255,255,255,0.6);">' + (MODES[m] || m) + '</span>')
      .join('');
    const appIncludes = [
      plan.includes_app ? '📱 Application mobile' : null,
      plan.includes_nutrition ? '🥗 Suivi nutritionnel personnalisé' : null,
      plan.includes_recipes ? '🍽️ Recettes diet adaptées' : null,
    ].filter(Boolean);
    const allFeatures = [...appIncludes, ...(plan.features || [])];

    // Engagement dynamique : 3 mois mensuel / 12 mois annuel
    const engagementMois = isAnnuel ? 12 : (plan.duration_months || 3);
    const durationNote = `<div class="engagement-badge">
      🔒 Engagement ${engagementMois} mois minimum
    </div>
    <div class="plan-location">📍 Fitness Park La Défense · Stade de France</div>`;

    const referralHtml = plan.referral_enabled ? `
      <div style="margin-top:12px;padding:9px 12px;background:rgba(232,197,71,0.07);border:1px solid rgba(232,197,71,0.2);border-radius:10px;font-size:12px;color:rgba(255,255,255,0.65);">
        🤝 <strong>Parrainage</strong> · Parraine un ami → tu gagnes <strong>${plan.referral_credit || '?'}€</strong>
      </div>` : '';

    return `
    <div class="offre-detail-card${isFeatured ? ' featured' : ''}" id="${slug}"
      ${isFeatured ? 'style="border-color:' + accent + ';"' : ''}>
      ${isFeatured ? '<div class="popular-badge" style="background:' + accent + ';color:#000;">⭐ Best-seller</div>' : ''}
      <div class="offre-detail-header">
        <div class="offre-name${isFeatured ? ' gold' : ''}">${escHtml(plan.name)}</div>
        ${modesHtml ? '<div style="margin:6px 0 8px;">' + modesHtml + '</div>' : ''}
        <div class="offre-detail-price">${priceHtml}</div>
        ${durationNote}
        ${plan.description ? '<p class="offre-tagline">' + escHtml(plan.description) + '</p>' : ''}
      </div>
      ${allFeatures.length ? `
      <ul class="offre-detail-features">
        ${allFeatures.map(f => {
          const isCredit = f.toLowerCase().includes('impôt') || f.toLowerCase().includes('impot') || f.toLowerCase().includes('crédit');
          return '<li class="feat-yes' + (isCredit ? ' feat-credit-impot' : '') + '">✓ ' + escHtml(f) + (isCredit ? ' <span class="credit-tag">-50%</span>' : '') + '</li>';
        }).join('')}
      </ul>` : ''}
      ${referralHtml}
      <div class="offre-detail-footer">
        <button class="${btnClass}" style="width:100%;justify-content:center;"
          data-checkout="abonnement" data-plan="${slug}">
          Choisir ${escHtml(plan.name)}
        </button>
      </div>
    </div>`;
  }).join('');

  // Injecter le toggle après la bannière découverte
  const decBanner = grid.querySelector('.decouverte-banner');
  if (decBanner) {
    const toggleEl = document.createElement('div');
    toggleEl.innerHTML = '<div class="billing-toggle-inline"><span class="toggle-label active" id="label-mensuel">Mensuel</span><label class="toggle-switch"><input type="checkbox" id="toggle-annuel"><span class="toggle-track"></span></label><span class="toggle-label" id="label-annuel">Annuel <span class="save-badge">-20%</span></span></div>';
    decBanner.after(toggleEl.firstChild);
    initBillingToggle();
  }
  initCheckoutButtons();
  const comp = document.getElementById('comparatif-section');
  if (comp) comp.style.display = '';
}

function escHtml(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Toggle mensuel / annuel ──────────────────────────────────

function initBillingToggle() {
  const toggle = document.getElementById('toggle-annuel');
  const labelM = document.getElementById('label-mensuel');
  const labelA = document.getElementById('label-annuel');

  toggle?.addEventListener('change', () => {
    isAnnuel = toggle.checked;
    labelM.classList.toggle('active', !isAnnuel);
    labelA.classList.toggle('active', isAnnuel);

    // Mise à jour des prix
    document.querySelectorAll('.price-num[data-mensuel]').forEach(el => {
      el.textContent = (isAnnuel ? el.dataset.annuel : el.dataset.mensuel) + '€';
    });

    // Mise à jour des badges d'engagement
    document.querySelectorAll('.engagement-badge').forEach(badge => {
      badge.textContent = '🔒 Engagement ' + (isAnnuel ? '12' : '3') + ' mois minimum';
    });
  });
}

// ── Checkout ─────────────────────────────────────────────────

function initCheckoutButtons() {
  document.querySelectorAll('[data-checkout]').forEach(btn => {
    btn.replaceWith(btn.cloneNode(true));
  });
  document.querySelectorAll('[data-checkout]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const plan = btn.dataset.plan;
      const type = btn.dataset.checkout;
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Chargement...';
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const res = await fetch(CHECKOUT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, plan, user_id: user?.id || '', user_email: user?.email || '' }),
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

// ── Messages ─────────────────────────────────────────────────

function handleMessages() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('abonnement') === 'success') {
    showToast('🎉 Abonnement activé ! Bienvenue dans Taya Fitness.', 'success');
    window.history.replaceState({}, '', '/offres');
  }
  if (params.get('cancelled') === '1') {
    showToast('Paiement annulé. Tu peux réessayer quand tu veux.', 'info');
    window.history.replaceState({}, '', '/offres');
  }
}

function showToast(message, type = 'info') {
  const colors = { success: '#3ecf8e', error: '#ff4d6a', info: '#ff6b4a' };
  const textColors = { success: '#0d1b2a', error: '#fff', info: '#fff' };
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:32px;left:50%;transform:translateX(-50%);background:' + colors[type] + ';color:' + textColors[type] + ';padding:16px 28px;border-radius:12px;font-weight:600;font-size:0.95rem;z-index:9999;box-shadow:0 8px 32px rgba(0,0,0,0.3);white-space:nowrap;max-width:90vw;text-align:center;';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}
