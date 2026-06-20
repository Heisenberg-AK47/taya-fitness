/* ============================================================
   INDEX.JS — Page d'accueil
   ============================================================ */

import { initNavbar } from './navbar.js';
import { initFooter } from './footer.js';
import { supabase } from './supabase.js';
import { addToCart, isInCart } from './cart.js';

/* ── Init ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  initNavbar();
  initFooter();
  initScrollAnimations();
  await loadProgrammesVedettes();
  initBillingToggle();
  initNewsletter();
});

/* ── Toggle mensuel / annuel ────────────────────────────── */
function initBillingToggle() {
  const toggle = document.getElementById('home-toggle-annuel');
  if (!toggle) return;

  toggle.addEventListener('change', () => {
    const annuel = toggle.checked;
    document.getElementById('home-label-mensuel')?.classList.toggle('active', !annuel);
    document.getElementById('home-label-annuel')?.classList.toggle('active', annuel);

    document.querySelectorAll('.home-price').forEach(el => {
      const val = annuel ? el.dataset.annuel : el.dataset.mensuel;
      el.textContent = val + '€';
    });
  });
}

/* ── Animations fade-in au scroll ───────────────────────── */
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

/* ── Charger les 3 programmes vedettes depuis Supabase ───── */
async function loadProgrammesVedettes() {
  const grid = document.getElementById('programmes-grid');
  if (!grid) return;

  try {
    const { data: programmes, error } = await supabase
      .from('programmes')
      .select('id, titre, slug, description_courte, prix, prix_promo, image_url, niveau, duree_heures, nb_modules, categorie')
      .eq('actif', true)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) throw error;

    if (!programmes || programmes.length === 0) {
      grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--white-muted); padding: 40px 0;">Programmes bientôt disponibles.</p>`;
      return;
    }

    grid.innerHTML = programmes.map(p => programmCard(p)).join('');
    initScrollAnimations();

    // Boutons ajouter au panier
    grid.querySelectorAll('[data-add-cart]').forEach(btn => {
      btn.addEventListener('click', () => {
        const prog = programmes.find(p => p.id === btn.dataset.addCart);
        if (!prog) return;
        addToCart({ id: prog.id, titre: prog.titre, prix: prog.prix, image_url: prog.image_url });
        btn.textContent = '✓ Ajouté';
        btn.classList.add('btn-outline');
        btn.classList.remove('btn-primary');
      });
    });

  } catch (err) {
    console.error('Erreur chargement programmes:', err);
    grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--white-muted); padding: 40px 0;">Impossible de charger les programmes.</p>`;
  }
}

/* ── Template carte programme ────────────────────────────── */
function programmCard(p) {
  const niveauLabels = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' };
  const niveauBadge  = `badge-${p.niveau || 'debutant'}`;
  const prixPromo    = p.prix_promo ? `<span class="prix-promo">${p.prix}€</span>` : '';
  const prixFinal    = p.prix_promo ?? p.prix;
  const inCart       = isInCart(p.id);

  return `
  <div class="programme-card fade-in">
    <div class="programme-img">
      ${p.image_url
        ? `<img src="${p.image_url}" alt="${p.titre}" loading="lazy" />`
        : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:3rem;background:var(--black-border)">🏋️</div>`
      }
      <span class="badge ${niveauBadge}">${niveauLabels[p.niveau] || 'Tous niveaux'}</span>
    </div>
    <div class="programme-body">
      <div class="programme-meta">
        <span>⏱ ${p.duree_heures || '?'}h</span>
        <span>📚 ${p.nb_modules || '?'} modules</span>
        <span>🏷 ${p.categorie || 'Fitness'}</span>
      </div>
      <h3>${p.titre}</h3>
      <p>${p.description_courte || ''}</p>
      <div class="programme-footer">
        <div class="programme-price">
          ${prixPromo}
          <span>${prixFinal}€ <small>/mois</small></span>
        </div>
        <div style="display:flex;gap:8px;">
          <a href="/programme-detail?slug=${p.slug}" class="btn btn-outline btn-sm">Voir</a>
          <button class="btn btn-primary btn-sm" data-add-cart="${p.id}">
            ${inCart ? '✓ Ajouté' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  </div>`;
}

/* ── Newsletter ──────────────────────────────────────────── */
function initNewsletter() {
  document.getElementById('newsletter-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = e.target.querySelector('input[type=email]').value;
    const btn   = e.target.querySelector('button');

    btn.disabled = true;
    btn.textContent = '...';

    try {
      await supabase.from('newsletter').upsert({ email, created_at: new Date().toISOString() });
      btn.textContent = '✓ Inscrit !';
      e.target.reset();
    } catch {
      btn.textContent = 'Erreur';
      setTimeout(() => { btn.textContent = "S'inscrire"; btn.disabled = false; }, 2000);
    }
  });
}

/* ── Stripe Checkout ─────────────────────────────────────── */
const CHECKOUT_URL = 'https://esylzsacjkimcqxllhwd.supabase.co/functions/v1/stripe-checkout';

window.checkoutPlan = async function(plan, evt) {
  const btn = evt?.currentTarget || evt?.target;
  if (btn) { btn.disabled = true; btn.textContent = 'Chargement...'; }
  const billing = document.getElementById('home-toggle-annuel')?.checked ? 'annual' : 'monthly';
  try {
    const res = await fetch(CHECKOUT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'abonnement', plan, billing })
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error(data.error || 'Erreur checkout');
    }
  } catch (err) {
    console.error(err);
    if (btn) { btn.disabled = false; btn.textContent = 'Réessayer'; }
    alert('Une erreur est survenue. Merci de réessayer.');
  }
};
