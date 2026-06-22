/* ============================================================
   RESERVATION-PAIEMENT.JS
   ============================================================ */

import { initNavbar } from './navbar.js';
import { initFooter } from './footer.js';
import { getCurrentUser } from './auth.js';

const SUPABASE_URL = 'https://esylzsacjkimcqxllhwd.supabase.co';
const CHECKOUT_FN  = `${SUPABASE_URL}/functions/v1/stripe-checkout`;

document.addEventListener('DOMContentLoaded', async () => {
  initNavbar();
  initFooter();

  // Lire la réservation depuis sessionStorage
  const bookingRaw = sessionStorage.getItem('taya_booking');
  if (!bookingRaw) {
    window.location.href = '/reservation';
    return;
  }

  const booking = JSON.parse(bookingRaw);

  // Afficher le récapitulatif
  document.getElementById('recap-lieu').textContent  = booking.label     || '—';
  document.getElementById('recap-date').textContent  = booking.date_label || booking.date || '—';
  document.getElementById('recap-heure').textContent = booking.heure     || '—';

  // Bouton payer
  document.getElementById('btn-pay')?.addEventListener('click', async () => {
    const btn   = document.getElementById('btn-pay');
    const errEl = document.getElementById('payment-error');
    btn.disabled     = true;
    btn.textContent  = 'Chargement...';
    errEl.style.display = 'none';

    try {
      const user = await getCurrentUser();

      const res = await fetch(CHECKOUT_FN, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:             'decouverte',
          user_id:          user?.id    || null,
          user_email:       user?.email || null,
          date_heure:       booking.date_heure,
          location_name:    booking.label,
          location_address: booking.address,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Erreur lors de la création du paiement.');
      }

      // Rediriger vers Stripe Checkout
      window.location.href = data.url;

    } catch (err) {
      console.error(err);
      errEl.textContent   = err.message || 'Une erreur est survenue. Réessaie.';
      errEl.style.display = 'block';
      btn.disabled        = false;
      btn.textContent     = 'Payer 69 € →';
    }
  });
});
