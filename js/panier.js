/* ============================================================
   PANIER.JS
   ============================================================ */

import { initNavbar } from './navbar.js';
import { initFooter } from './footer.js';
import { getCart, removeFromCart, getCartTotal, clearCart } from './cart.js';
import { getCurrentUser } from './auth.js';
import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
  initNavbar();
  initFooter();
  renderPanier();
  window.addEventListener('cart-updated', renderPanier);
});

function renderPanier() {
  const cart  = getCart();
  const grid  = document.getElementById('panier-grid');

  if (cart.length === 0) {
    grid.innerHTML = `
      <div class="panier-empty">
        <span>🛒</span>
        <h2>Ton panier est vide</h2>
        <p>Découvre nos programmes et commence ta transformation.</p>
        <a href="/programmes" class="btn btn-primary btn-lg">Voir les programmes</a>
      </div>`;
    return;
  }

  const total = getCartTotal();

  grid.innerHTML = `
    <div class="panier-items">
      ${cart.map(item => `
        <div class="panier-item">
          <div class="panier-item-img">
            ${item.image_url
              ? `<img src="${item.image_url}" alt="${item.titre}" />`
              : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:2rem;background:var(--black-border)">🏋️</div>`
            }
          </div>
          <div class="panier-item-info">
            <h3>${item.titre}</h3>
            <small>Abonnement mensuel · Engagement 3 mois</small>
          </div>
          <div class="panier-item-price">${item.prix}€<small style="font-size:0.7rem;font-family:var(--font-body);font-weight:400;color:var(--white-muted)">/mois</small></div>
          <button class="panier-item-remove" data-remove="${item.id}" aria-label="Retirer">✕</button>
        </div>
      `).join('')}
    </div>

    <div class="panier-recap">
      <h3>Récapitulatif</h3>
      ${cart.map(item => `
        <div class="recap-line">
          <span>${item.titre}</span>
          <span>${item.prix}€</span>
        </div>
      `).join('')}
      <div class="recap-total">
        <span>Total / mois</span>
        <span>${total}€</span>
      </div>
      <a href="/checkout" class="btn btn-primary">Passer la commande →</a>
      <a href="/programmes" class="btn btn-outline">Continuer mes achats</a>
      <p class="recap-secure">🔒 Paiement sécurisé · SSL</p>
    </div>
  `;

  // Boutons supprimer
  grid.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      removeFromCart(btn.dataset.remove);
    });
  });
}
