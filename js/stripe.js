/* ============================================================
   STRIPE.JS — Module partagé pour les paiements Taya Fitness
   Appelle l'Edge Function Supabase stripe-checkout
   ============================================================ */

import { supabase } from './supabase.js';

const CHECKOUT_URL = 'https://esylzsacjkimcqxllhwd.supabase.co/functions/v1/stripe-checkout';
const INTENT_KEY = 'taya_checkout_intent';

/**
 * Le compte est créé AVANT le paiement : un seul mot de passe, une seule
 * adresse e-mail, et l'abonnement se rattache directement au bon compte.
 *
 * Renvoie l'utilisateur connecté, ou null après avoir mémorisé l'achat et
 * redirigé vers la création de compte.
 */
export async function exigerCompte(intent) {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return user;
  try { sessionStorage.setItem(INTENT_KEY, JSON.stringify(intent)); } catch (_) { /* mode privé */ }
  window.location.href = '/auth?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
  return null;
}

/**
 * Reprise automatique : le client cliquait pour acheter, on l'a envoyé créer
 * son compte, il revient connecté → son achat repart tout seul.
 * Renvoie true si une reprise est en cours (la page va être quittée).
 */
export async function reprendreAchatEnAttente() {
  let intent;
  try { intent = sessionStorage.getItem(INTENT_KEY); } catch (_) { return false; }
  if (!intent) return false;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  try { sessionStorage.removeItem(INTENT_KEY); } catch (_) { /* ignore */ }
  try { await startCheckout(JSON.parse(intent)); return true; } catch (_) { return false; }
}

/**
 * Lance le checkout Stripe pour un abonnement ou un programme.
 * Redirige automatiquement vers Stripe Checkout.
 */
export async function startCheckout({ type, plan, billing, programme_id, programme_titre, programme_prix, btnEl }) {
  if (btnEl) {
    btnEl.disabled = true;
    btnEl.textContent = 'Chargement...';
  }

  try {
    const user = await exigerCompte({ type, plan, billing, programme_id, programme_titre, programme_prix });
    if (!user) return;

    const payload = {
      type,
      user_id:    user.id    || '',
      user_email: user.email || '',
      ...(type === 'abonnement' ? { plan, ...(billing ? { billing } : {}) } : { programme_id }),
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
export async function initCheckoutButtons() {
  if (await reprendreAchatEnAttente()) return;

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
