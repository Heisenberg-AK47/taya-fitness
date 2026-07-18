/* ============================================================
   COACHING-EN-LIGNE.JS — Page de vente du coaching 100% online
   Charge les formules "online" du CRM et branche le checkout Stripe
   ============================================================ */

import { initNavbar } from './navbar.js';
import { initFooter } from './footer.js';
import { supabase } from './supabase.js';
import { initCheckoutButtons } from './stripe.js';

/* Secours si la base est indisponible : la page reste vendeuse. */
const FALLBACK_PLANS = [
  { name: 'ESSENTIEL ONLINE', price: 79, color: '#b4f000', is_best_seller: false, duration_months: 3,
    description: "100% online — Plan d'entraînement personnalisé pour démarrer.",
    includes_app: true, includes_nutrition: false,
    features: ["Plan d'entraînement personnalisé", 'Nutrition de base', 'Suivi toutes les 2 semaines', "Accès à l'app coaching"] },
  { name: 'TRANSFORMATION ONLINE', price: 129, color: '#ff1b8d', is_best_seller: true, duration_months: 3,
    description: "100% online — L'accompagnement complet pour des résultats rapides.",
    includes_app: true, includes_nutrition: true,
    features: ['Coaching complet premium', 'Nutrition complète', 'Suivi hebdomadaire', 'Ajustements illimités', 'Support & motivation', "Accès à l'app coaching"] },
  { name: 'PREMIUM ONLINE', price: 199, color: '#7a5cff', is_best_seller: false, duration_months: 3,
    description: '100% online — Accompagnement VIP et suivi ultra personnalisé.',
    includes_app: true, includes_nutrition: true,
    features: ['Accompagnement VIP', 'Appels mensuels', 'Analyse approfondie', 'Priorité totale', 'Suivi ultra personnalisé', "Accès à l'app coaching"] },
];

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initFooter();
  loadOnlinePlans();
});

/** Clé attendue par la fonction stripe-checkout : online_essentiel / online_transformation / online_premium */
function checkoutKey(name) {
  const base = String(name || '')
    .toLowerCase()
    .replace(/online/g, '')
    .trim()
    .replace(/\s+/g, '_');
  return 'online_' + base;
}

function escHtml(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function loadOnlinePlans() {
  let plans = [];
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .contains('coaching_modes', ['online'])
      .order('price', { ascending: true });
    if (!error && data && data.length) plans = data;
  } catch (e) {
    console.warn('Chargement des formules online :', e);
  }
  if (!plans.length) plans = FALLBACK_PLANS;
  renderPlans(plans);
}

function renderPlans(plans) {
  const grid = document.getElementById('online-plans-grid');
  if (!grid) return;

  grid.innerHTML = plans.map(plan => {
    const featured = !!plan.is_best_seller;
    const accent = plan.color || '#e8c547';
    const btnClass = featured ? 'btn btn-primary' : 'btn btn-gold-outline';
    const key = checkoutKey(plan.name);
    const months = plan.duration_months || 3;

    const extras = [
      plan.includes_app ? "📱 Application coaching incluse" : null,
      plan.includes_nutrition ? '🥗 Suivi nutritionnel personnalisé' : null,
    ].filter(Boolean);
    const allFeatures = [...extras, ...(plan.features || [])];

    return `
    <div class="offre-detail-card${featured ? ' featured' : ''}" id="${escHtml(key)}"
      ${featured ? 'style="border-color:' + escHtml(accent) + ';"' : ''}>
      ${featured ? '<div class="popular-badge" style="background:' + escHtml(accent) + ';color:#000;">⭐ Le plus choisi</div>' : ''}
      <div class="offre-detail-header">
        <div class="offre-name${featured ? ' gold' : ''}">${escHtml(plan.name)}</div>
        <div class="offre-detail-price">
          <span class="price-num">${escHtml(plan.price)}€</span><span class="price-per">/mois</span>
        </div>
        <div class="engagement-badge">🔒 Engagement ${months} mois minimum</div>
        <div class="plan-location">🌍 100% en ligne · où que tu sois</div>
        ${plan.description ? '<p class="offre-tagline">' + escHtml(plan.description) + '</p>' : ''}
      </div>
      ${allFeatures.length ? `
      <ul class="offre-detail-features">
        ${allFeatures.map(f => '<li class="feat-yes">✓ ' + escHtml(f) + '</li>').join('')}
      </ul>` : ''}
      <div class="offre-detail-footer">
        <button class="${btnClass}" style="width:100%;justify-content:center;"
          data-checkout="abonnement" data-plan="${escHtml(key)}">
          Choisir ${escHtml(plan.name)}
        </button>
        <p class="co-secure">🔒 Paiement sécurisé · Accès immédiat à ton espace</p>
      </div>
    </div>`;
  }).join('');

  initCheckoutButtons();
}
