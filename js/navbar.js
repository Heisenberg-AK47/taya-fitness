// ── Google Analytics 4 — Taya Fitness (G-LY3D859GY9) ──────
if (!window.__ga4Loaded) {
  window.__ga4Loaded = true;
  const _s = document.createElement('script');
  _s.async = true;
  _s.src = 'https://www.googletagmanager.com/gtag/js?id=G-LY3D859GY9';
  document.head.appendChild(_s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function(){ window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', 'G-LY3D859GY9');
}

/* ============================================================
   NAVBAR.JS — Injection + état connecté/déconnecté
   ============================================================ */

import { getCurrentUser, signOut } from './auth.js';
import { getCartCount } from './cart.js';

/* ── Template HTML navbar ────────────────────────────────── */
function navbarTemplate() {
  return `
  <nav class="navbar" id="navbar">
    <div class="navbar-inner">

      <!-- Logo -->
      <a href="/" class="navbar-logo">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 110" style="height:42px;width:auto;display:block">
          <text x="8" y="92" font-family="'Black Han Sans',Arial Black,Impact,sans-serif" font-size="100" font-weight="900" fill="#E8603C" letter-spacing="-2">TAYA</text>
          <text x="154" y="84" font-family="'Great Vibes','Brush Script MT',cursive" font-size="46" fill="#1B2B4B" transform="rotate(-5,154,84)">Fitness</text>
        </svg>
      </a>

      <!-- Liens desktop -->
      <ul class="navbar-links">
        <li><a href="/" data-page="index">Accueil</a></li>
        <li><a href="/programmes" data-page="programmes">Programmes</a></li>
        <li><a href="/offres" data-page="offres">Offres</a></li>
        <li><a href="/coaching-en-ligne" data-page="coaching-en-ligne">Coaching en ligne</a></li>
        <li><a href="/reservation" data-page="reservation">Réserver</a></li>
        <li><a href="/contact" data-page="contact">À propos</a></li>
      </ul>

      <!-- Actions droite -->
      <div class="navbar-actions">
        <!-- Panier -->
        <a href="/panier" class="cart-btn" aria-label="Panier">
          🛒
          <span class="cart-count" id="cart-count"></span>
        </a>

        <!-- État auth (injecté dynamiquement) -->
        <div id="navbar-auth-zone"></div>

        <!-- Burger mobile -->
        <button class="navbar-burger" id="navbar-burger" aria-label="Menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </div>

    <!-- Menu mobile -->
    <div class="navbar-mobile" id="navbar-mobile">
      <a href="/">Accueil</a>
      <a href="/programmes">Programmes</a>
      <a href="/offres">Offres</a>
      <a href="/coaching-en-ligne">Coaching en ligne</a>
      <a href="/reservation">Réserver</a>
      <a href="/contact">À propos</a>
      <div class="mobile-actions" id="mobile-auth-zone"></div>
    </div>
  </nav>`;
}

/* ── Template bouton non connecté ───────────────────────── */
function authZoneGuest() {
  return `<a href="/auth" class="btn btn-primary btn-sm navbar-auth-btn">Connexion</a>`;
}

/* ── Template utilisateur connecté ─────────────────────── */
function authZoneUser(user) {
  const initials = (user.user_metadata?.full_name || user.email || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // La photo de profil remplace les initiales dès qu'elle existe.
  const photo = user.user_metadata?.avatar_url;
  const avatar = photo
    ? `<div class="navbar-user-avatar has-photo"><img src="${photo}" alt=""></div>`
    : `<div class="navbar-user-avatar">${initials}</div>`;

  return `
  <div class="navbar-user" id="navbar-user">
    <button class="navbar-user-btn" id="user-btn" aria-expanded="false">
      ${avatar}
      <span>${user.user_metadata?.full_name?.split(' ')[0] || 'Mon espace'}</span>
      ▾
    </button>
    <div class="navbar-dropdown">
      <a href="/dashboard">🏠 Mon espace</a>
      <a href="/dashboard?tab=progression">📈 Ma progression</a>
      <a href="/dashboard?tab=profil">👤 Mon profil</a>
      <div class="divider"></div>
      <button id="logout-btn">🚪 Se déconnecter</button>
    </div>
  </div>`;
}

/* ── Marquer le lien actif ──────────────────────────────── */
function setActiveLink() {
  const path = window.location.pathname.replace('/', '') || 'index';
  document.querySelectorAll('.navbar-links a[data-page]').forEach(a => {
    if (a.dataset.page === path) a.classList.add('active');
  });
}

/* ── Mise à jour compteur panier ────────────────────────── */
function updateCartBadge() {
  const count = getCartCount();
  const badge = document.getElementById('cart-count');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count;
    badge.classList.add('visible');
  } else {
    badge.classList.remove('visible');
  }
}

/* ── Init navbar ─────────────────────────────────────────── */
export async function initNavbar() {
  // Injecter le HTML
  const placeholder = document.getElementById('navbar-placeholder');
  if (placeholder) {
    placeholder.outerHTML = navbarTemplate();
  } else {
    document.body.insertAdjacentHTML('afterbegin', navbarTemplate());
  }

  // Scroll effet
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar?.classList.toggle('scrolled', window.scrollY > 50);
  });

  // Burger menu mobile
  const burger = document.getElementById('navbar-burger');
  const mobileMenu = document.getElementById('navbar-mobile');
  burger?.addEventListener('click', () => {
    burger.classList.toggle('active');
    mobileMenu?.classList.toggle('open');
  });

  // Lien actif
  setActiveLink();

  // Panier
  updateCartBadge();
  window.addEventListener('cart-updated', updateCartBadge);

  // Zone auth
  const authZone = document.getElementById('navbar-auth-zone');
  const mobileAuthZone = document.getElementById('mobile-auth-zone');

  try {
    const user = await getCurrentUser();

    if (user) {
      authZone.innerHTML = authZoneUser(user);
      mobileAuthZone.innerHTML = `
        <a href="/dashboard" class="btn btn-gold-outline btn-sm">Mon espace</a>
        <button id="mobile-logout" class="btn btn-outline btn-sm">Déconnexion</button>`;

      // Dropdown toggle
      document.getElementById('user-btn')?.addEventListener('click', () => {
        document.getElementById('navbar-user')?.classList.toggle('open');
      });

      // Fermer dropdown au clic extérieur
      document.addEventListener('click', (e) => {
        if (!document.getElementById('navbar-user')?.contains(e.target)) {
          document.getElementById('navbar-user')?.classList.remove('open');
        }
      });

      // Logout
      document.getElementById('logout-btn')?.addEventListener('click', signOut);
      document.getElementById('mobile-logout')?.addEventListener('click', signOut);

    } else {
      authZone.innerHTML = authZoneGuest();
      mobileAuthZone.innerHTML = `<a href="/auth" class="btn btn-primary btn-sm">Connexion</a>`;
    }
  } catch (err) {
    console.error('Navbar auth error:', err);
    authZone.innerHTML = authZoneGuest();
  }
}
