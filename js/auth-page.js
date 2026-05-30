/* ============================================================
   AUTH-PAGE.JS — Connexion / Inscription
   ============================================================ */

import { initNavbar } from './navbar.js';
import { initFooter } from './footer.js';
import { signIn, signUp, resetPassword, getCurrentUser } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  initNavbar();
  initFooter();

  // Rediriger si déjà connecté
  const user = await getCurrentUser();
  if (user) { window.location.href = '/dashboard'; return; }

  initTabs();
  initLoginForm();
  initSignupForm();
  initForgot();
});

function showAlert(type, msg) {
  document.querySelectorAll('.alert').forEach(a => { a.classList.remove('show'); a.textContent = ''; });
  const el = document.getElementById(`alert-${type}`);
  if (el) { el.textContent = msg; el.classList.add('show'); }
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading ? '...' : (btnId === 'btn-login' ? 'Se connecter' : 'Créer mon compte');
}

/* ── Onglets ─────────────────────────────────────────────── */
function initTabs() {
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const t = tab.dataset.tab;
      document.getElementById('form-login').classList.toggle('hidden', t !== 'login');
      document.getElementById('form-signup').classList.toggle('hidden', t !== 'signup');
      document.querySelectorAll('.alert').forEach(a => { a.classList.remove('show'); });
    });
  });
}

/* ── Connexion ───────────────────────────────────────────── */
function initLoginForm() {
  document.getElementById('form-login')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    setLoading('btn-login', true);
    try {
      await signIn({ email, password });
      const redirect = new URLSearchParams(window.location.search).get('redirect') || '/dashboard';
      window.location.href = redirect;
    } catch (err) {
      showAlert('error', translateError(err.message));
      setLoading('btn-login', false);
    }
  });
}

/* ── Inscription ─────────────────────────────────────────── */
function initSignupForm() {
  document.getElementById('form-signup')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = document.getElementById('signup-name').value.trim();
    const email    = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirm  = document.getElementById('signup-confirm').value;

    if (password !== confirm) { showAlert('error', 'Les mots de passe ne correspondent pas.'); return; }
    if (password.length < 8)  { showAlert('error', 'Le mot de passe doit faire au moins 8 caractères.'); return; }

    setLoading('btn-signup', true);
    try {
      await signUp({ email, password, fullName });
      showAlert('success', 'Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse.');
      document.getElementById('form-signup').reset();
    } catch (err) {
      showAlert('error', translateError(err.message));
    } finally {
      setLoading('btn-signup', false);
    }
  });
}

/* ── Mot de passe oublié ─────────────────────────────────── */
function initForgot() {
  document.getElementById('forgot-btn')?.addEventListener('click', async () => {
    const email = document.getElementById('login-email').value.trim();
    if (!email) { showAlert('error', 'Saisis ton email d\'abord.'); return; }
    try {
      await resetPassword(email);
      showAlert('success', 'Email de réinitialisation envoyé ! Vérifie ta boîte mail.');
    } catch (err) {
      showAlert('error', translateError(err.message));
    }
  });
}

/* ── Traduction erreurs Supabase ─────────────────────────── */
function translateError(msg) {
  if (msg.includes('Invalid login'))       return 'Email ou mot de passe incorrect.';
  if (msg.includes('Email not confirmed')) return 'Confirme ton adresse email avant de te connecter.';
  if (msg.includes('already registered'))  return 'Cet email est déjà utilisé. Connecte-toi.';
  if (msg.includes('Password'))            return 'Mot de passe trop faible (min. 8 caractères).';
  return msg;
}
