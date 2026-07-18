/* ============================================================
   STRIPE.JS — Module partagé pour les paiements Taya Fitness
   Appelle l'Edge Function Supabase stripe-checkout
   ============================================================ */

import { supabase } from './supabase.js';

const CHECKOUT_URL = 'https://esylzsacjkimcqxllhwd.supabase.co/functions/v1/stripe-checkout';

/**
 * Lance le checkout Stripe pour un abonnement ou un programme.
 * Redirige automatiquement vers Stripe Checkout.
 */
export async function startCheckout({ type, plan, programme_id, programme_titre, programme_prix, btnEl }) {
  if (btnEl) {
    btnEl.disabled = true;
    btnEl.textContent = 'Chargement...';
  }

  try {
    // Récupérer l'utilisateur connecté si possible
    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      type,
      user_id:    user?.id    || '',
      user_email: user?.email || '',
      ...(type === 'abonnement' ? { plan } : { programme_id, programme_titre, programme_prix }),
    };

    const res = await fetch(CHECKOUT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || !data.url) {
      throw new Error(data.error || 'Erreur lors de la création du paiement');
    }

    // Redirection vers Stripe Checkout
    window.location.href = data.url;

  } catch (err) {
    console.error('Checkout error:', err);
    alert('Une erreur est survenue. Veuillez réessayer.');
    if (btnEl) {
      btnEl.disabled = false;
      btnEl.textContent = btnEl.dataset.originalText || 'Souscrire';
    }
  }
}

/**
 * Initialise les boutons de checkout sur une page.
 * Usage : <button data-checkout="abonnement" data-plan="starter">Souscrire</button>
 *         <button data-checkout="programme" data-id="..." data-titre="..." data-prix="49">Acheter</button>
 */
export function initCheckoutButtons() {
  document.querySelectorAll('[data-checkout]').forEach(btn => {
    btn.dataset.originalText = btn.textContent;

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const type = btn.dataset.checkout;

      if (type === 'abonnement') {
        await startCheckout({ type, plan: btn.dataset.plan, btnEl: btn });
      } else if (type === 'programme') {
        await startCheckout({
          type,
          programme_id:    btn.dataset.id,
          programme_titre: btn.dataset.titre,
          programme_prix:  parseFloat(btn.dataset.prix),
          btnEl: btn,
        });
      }
    });
  });
}
