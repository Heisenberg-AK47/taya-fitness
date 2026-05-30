/* ============================================================
   CHECKOUT.JS
   ============================================================ */

import { initNavbar } from './navbar.js';
import { initFooter } from './footer.js';
import { getCart, getCartTotal, clearCart } from './cart.js';
import { getCurrentUser } from './auth.js';
import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
  initNavbar();
  initFooter();

  const cart = getCart();
  if (cart.length === 0) { window.location.href = '/panier'; return; }

  renderRecap(cart);
  prefillUser();

  document.getElementById('checkout-form')?.addEventListener('submit', handleSubmit);
});

function renderRecap(cart) {
  const total = getCartTotal();

  document.getElementById('checkout-items').innerHTML = cart.map(item => `
    <div class="checkout-item">
      <span>${item.titre}</span>
      <span>${item.prix}€/mois</span>
    </div>
  `).join('');

  document.getElementById('checkout-total').innerHTML = `
    <span>Total mensuel</span>
    <span>${total}€</span>
  `;
}

async function prefillUser() {
  const user = await getCurrentUser();
  if (!user) return;
  const email = document.getElementById('billing-email');
  if (email) email.value = user.email;
  const name = user.user_metadata?.full_name || '';
  if (name) {
    const parts = name.split(' ');
    const fn = document.getElementById('billing-firstname');
    const ln = document.getElementById('billing-lastname');
    if (fn && parts[0]) fn.value = parts[0];
    if (ln && parts[1]) ln.value = parts.slice(1).join(' ');
  }
}

async function handleSubmit(e) {
  e.preventDefault();
  const btn   = document.getElementById('btn-pay');
  const alert = document.getElementById('checkout-alert');
  btn.disabled = true;
  btn.textContent = '...';

  try {
    const user = await getCurrentUser();
    const cart = getCart();

    if (user && cart.length > 0) {
      // Enregistrer les achats en statut "pending" (Stripe viendra les valider)
      const achats = cart.map(item => ({
        user_id:      user.id,
        programme_id: item.id,
        montant:      item.prix,
        statut:       'pending',
        created_at:   new Date().toISOString()
      }));

      const { error } = await supabase.from('achats').insert(achats);
      if (error) throw error;
    }

    // Vider le panier
    clearCart();

    // Confirmation
    alert.textContent = '✅ Commande enregistrée ! Tu seras contacté(e) pour finaliser le paiement.';
    alert.classList.add('show');
    btn.textContent = '✓ Confirmé';

    setTimeout(() => { window.location.href = '/dashboard'; }, 2500);

  } catch (err) {
    console.error(err);
    btn.disabled = false;
    btn.textContent = 'Confirmer la commande';
    alert.textContent = 'Une erreur est survenue. Réessaie.';
    alert.classList.remove('show');
  }
}
