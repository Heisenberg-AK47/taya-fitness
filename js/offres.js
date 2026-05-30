/* ============================================================
   OFFRES.JS
   ============================================================ */

import { initNavbar } from './navbar.js';
import { initFooter } from './footer.js';

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initFooter();
  initBillingToggle();

  // Scroll vers l'ancre si présente (#starter, #performance, #vip)
  const hash = window.location.hash;
  if (hash) {
    setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
  }
});

function initBillingToggle() {
  const toggle      = document.getElementById('toggle-annuel');
  const labelM      = document.getElementById('label-mensuel');
  const labelA      = document.getElementById('label-annuel');
  const priceEls    = document.querySelectorAll('.price-num');

  toggle?.addEventListener('change', () => {
    const annuel = toggle.checked;
    labelM.classList.toggle('active', !annuel);
    labelA.classList.toggle('active',  annuel);

    priceEls.forEach(el => {
      const price = annuel ? el.dataset.annuel : el.dataset.mensuel;
      el.textContent = `${price}€`;
    });
  });
}
