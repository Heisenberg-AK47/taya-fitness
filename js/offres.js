/* ============================================================
   OFFRES.JS — Taya Fitness (avec Stripe intégré)
   ============================================================ */

import { initNavbar } from './navbar.js';
import { initFooter } from './footer.js';
import { supabase } from './supabase.js';

const CHECKOUT_URL = 'https://esylzsacjkimcqxllhwd.supabase.co/functions/v1/stripe-checkout';

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initFooter();
  initBillingToggle();
  initCheckoutButtons();
  handleMessages();

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

function initCheckoutButtons() {
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

function handleMessages() {
  const params = new URLSearchParams(window.location.search);
  const names = { starter: 'Starter', performance: 'Performance', vip: 'Premium VIP' };

  if (params.get('abonnement') === 'success') {
    const plan = params.get('plan') || '';
    showToast(`🎉 Abonnement ${names[plan] || plan} activé ! Bienvenue dans Taya Fitness.`, 'success');
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
