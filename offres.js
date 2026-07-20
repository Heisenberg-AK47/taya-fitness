/* ============================================================
   OFFRES.JS — Abonnements Taya Fitness
   ============================================================ */

import { initNavbar } from './navbar.js';
import { initFooter } from './footer.js';
import { initCheckoutButtons } from './stripe.js';

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initFooter();
  initBillingToggle();
  initCheckoutButtons();
  handleSuccessMessage();

  // Scroll vers l'ancre si présente (#starter, #performance, #vip)
  const hash = window.location.hash;
  if (hash) {
    setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
  }
});

function initBillingToggle() {
  const toggle   = document.getElementById('toggle-annuel');
  const labelM   = document.getElementById('label-mensuel');
  const labelA   = document.getElementById('label-annuel');
  const priceEls = document.querySelectorAll('.price-num');

  toggle?.addEventListener('change', () => {
    const annuel = toggle.checked;
    labelM.classList.toggle('active', !annuel);
    labelA.classList.toggle('active',  annuel);
    priceEls.forEach(el => {
      el.textContent = `${annuel ? el.dataset.annuel : el.dataset.mensuel}€`;
    });
  });
}

function handleSuccessMessage() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('abonnement') === 'success') {
    const plan = params.get('plan') || '';
    const names = { starter: 'Starter', performance: 'Performance', vip: 'Premium VIP' };
    showToast(`🎉 Abonnement ${names[plan] || plan} activé ! Bienvenue dans Taya Fitness.`, 'success');
    window.history.replaceState({}, '', '/offres');
  }
  if (params.get('cancelled') === '1') {
    showToast('Paiement annulé. Tu peux réessayer quand tu veux.', 'info');
    window.history.replaceState({}, '', '/offres');
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
    animation: slideUp 0.4s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}
