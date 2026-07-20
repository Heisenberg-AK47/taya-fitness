/* ============================================================
   CONTACT.JS
   ============================================================ */

import { initNavbar } from './navbar.js';
import { initFooter } from './footer.js';
const CONTACT_URL = 'https://esylzsacjkimcqxllhwd.supabase.co/functions/v1/contact-message';

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initFooter();
  initContactForm();
  initFaq();
});

function initContactForm() {
  document.getElementById('contact-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn   = document.getElementById('btn-contact');
    const ok    = document.getElementById('contact-alert');
    const err   = document.getElementById('contact-error');
    [ok, err].forEach(el => el.classList.remove('show'));

    btn.disabled = true;
    btn.textContent = '...';

    const payload = {
      prenom:   document.getElementById('contact-prenom').value.trim(),
      nom:      document.getElementById('contact-nom').value.trim(),
      email:    document.getElementById('contact-email').value.trim(),
      tel:      document.getElementById('contact-tel').value.trim(),
      sujet:    document.getElementById('contact-sujet').value,
      message:  document.getElementById('contact-message').value.trim(),
      // Piège à robots : invisible pour un humain, donc toujours vide.
      website:  document.getElementById('contact-website')?.value || '',
    };

    try {
      // On passe par une fonction serveur : elle filtre le spam, enregistre
      // le message ET prévient Sarah par e-mail. L'écriture directe en base
      // ne notifiait personne — 66 messages y ont dormi sans réponse.
      const res = await fetch(CONTACT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Envoi impossible');
      ok.textContent = '✅ Message envoyé ! Sarah vous répondra sous 24h.';
      ok.classList.add('show');
      e.target.reset();
    } catch (error) {
      console.error(error);
      err.textContent = 'Une erreur est survenue. Réessayez ou écrivez directement à contact@tayafitness.com';
      err.classList.add('show');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Envoyer le message';
    }
  });
}

function initFaq() {
  document.querySelectorAll('.faq-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
}
