/* ============================================================
   PROGRAMME-DETAIL.JS
   ============================================================ */

import { initNavbar } from './navbar.js';
import { initFooter } from './footer.js';
import { supabase } from './supabase.js';
import { getCurrentUser } from './auth.js';
import { addToCart, isInCart } from './cart.js';

document.addEventListener('DOMContentLoaded', async () => {
  initNavbar();
  initFooter();

  const slug = new URLSearchParams(window.location.search).get('slug');
  if (!slug) { renderError('Programme introuvable.'); return; }

  await loadDetail(slug);
});

async function loadDetail(slug) {
  try {
    // Récupère le programme (sans modules)
    const { data: prog, error } = await supabase
      .from('programmes')
      .select('*')
      .eq('slug', slug)
      .eq('actif', true)
      .single();

    if (error || !prog) { renderError('Programme introuvable.'); return; }

    // SEO dynamique
    document.title = `${prog.titre} — Taya Fitness`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', prog.description_courte || '');

    // Modules via fonction sécurisée (gère l'accès vidéo)
    const { data: modules } = await supabase
      .rpc('get_modules_with_access', { p_programme_id: prog.id });

    const reviews = await loadReviews(prog.id);
    const user = await getCurrentUser();
    const hasAccess = await checkAccess(prog.id, user);

    renderDetail(prog, modules || [], reviews, hasAccess);
  } catch (err) {
    console.error(err);
    renderError('Erreur de chargement.');
  }
}

async function checkAccess(programmeId, user) {
  if (!user) return false;
  const { data } = await supabase
    .from('achats')
    .select('id')
    .eq('user_id', user.id)
    .eq('programme_id', programmeId)
    .eq('statut', 'active')
    .maybeSingle();
  return !!data;
}

async function loadReviews(programmeId) {
  try {
    const { data } = await supabase
      .from('reviews')
      .select('*, profiles(full_name)')
      .eq('programme_id', programmeId)
      .order('created_at', { ascending: false });
    return data || [];
  } catch { return []; }
}

function youtubeEmbed(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1` : null;
}

function renderModuleVideo(m, hasAccess) {
  const embedUrl = youtubeEmbed(m.video_url);

  if (embedUrl) {
    return `
      <div class="module-video">
        <iframe
          src="${embedUrl}"
          title="${m.titre}"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          loading="lazy">
        </iframe>
        ${m.video_gratuite ? '<span class="video-badge video-badge-free">Aperçu gratuit</span>' : ''}
      </div>`;
  }

  if (!hasAccess) {
    return `
      <div class="module-locked">
        <div class="locked-icon">🔒</div>
        <p>Vidéo réservée aux membres</p>
        <a href="/offres" class="btn btn-gold-outline btn-sm">Voir les offres</a>
      </div>`;
  }

  return '';
}

function renderDetail(p, modules, reviews, hasAccess) {
  const niveauLabels = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' };
  modules = (modules || []).sort((a, b) => a.ordre - b.ordre);
  const avgNote = reviews.length
    ? (reviews.reduce((s, r) => s + r.note, 0) / reviews.length).toFixed(1)
    : null;

  document.getElementById('detail-main').innerHTML = `

    <!-- Hero -->
    <section class="detail-hero">
      <div class="container">
        <div class="detail-hero-grid">
          <div class="detail-left">
            <div class="detail-breadcrumb">
              <a href="/">Accueil</a><span>/</span>
              <a href="/programmes">Programmes</a><span>/</span>
              <span>${p.titre}</span>
            </div>
            <div class="detail-badges">
              <span class="badge badge-${p.niveau || 'debutant'}">${niveauLabels[p.niveau] || 'Tous niveaux'}</span>
              ${p.categorie ? `<span class="badge" style="background:rgba(201,168,76,0.1);color:var(--gold)">${p.categorie}</span>` : ''}
            </div>
            <h1 class="detail-title">${p.titre}</h1>
            <p class="detail-desc">${p.description_courte || ''}</p>
            <div class="detail-stats">
              <div class="detail-stat">
                <strong>${p.duree_heures || '?'}h</strong>
                <small>Durée totale</small>
              </div>
              <div class="detail-stat">
                <strong>${modules.length || p.nb_modules || '?'}</strong>
                <small>Modules</small>
              </div>
              ${avgNote ? `<div class="detail-stat"><strong>${avgNote}★</strong><small>${reviews.length} avis</small></div>` : ''}
              <div class="detail-stat">
                <strong>En ligne</strong>
                <small>Accès immédiat</small>
              </div>
            </div>
          </div>

          <!-- Carte achat -->
          <div class="detail-buy-card">
            <div class="buy-image">
              ${p.image_url
                ? `<img src="${p.image_url}" alt="${p.titre}" />`
                : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:4rem;background:var(--black-border)">🏋️</div>`
              }
            </div>
            <div class="buy-price">
              ${p.prix_promo ? `<span class="promo">${p.prix}€</span>` : ''}
              <span class="amount">${p.prix_promo ?? p.prix}€</span>
              <span class="period">/mois</span>
            </div>
            <p class="buy-desc">Accès complet au programme, suivi et mises à jour inclus.</p>
            <div class="buy-actions">
              <button class="btn btn-primary" id="btn-cart" ${isInCart(p.id) ? 'disabled' : ''}>
                ${isInCart(p.id) ? '✓ Dans le panier' : '🛒 Ajouter au panier'}
              </button>
              <a href="/panier" class="btn btn-outline">Voir le panier</a>
            </div>
            <div class="buy-guarantees">
              <div class="buy-guarantee-item">✅ Accès immédiat après paiement</div>
              <div class="buy-guarantee-item">📱 Compatible mobile & desktop</div>
              <div class="buy-guarantee-item">🔄 Sans engagement</div>
              <div class="buy-guarantee-item">💳 Paiement sécurisé</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Contenu onglets -->
    <section class="section">
      <div class="container">
        <div class="detail-tabs">
          <button class="tab-btn active" data-tab="description">Description</button>
          <button class="tab-btn" data-tab="programme">Programme (${modules.length} modules)</button>
          <button class="tab-btn" data-tab="avis">Avis (${reviews.length})</button>
        </div>

        <!-- Description -->
        <div class="tab-panel active" id="tab-description">
          <div class="detail-description">
            ${(p.description || p.description_courte || 'Description complète bientôt disponible.')
              .split('\n').map(l => `<p>${l}</p>`).join('')}
          </div>
        </div>

        <!-- Modules -->
        <div class="tab-panel" id="tab-programme">
          ${!hasAccess ? `
            <div class="modules-access-banner">
              <span>🔒</span>
              <div>
                <strong>Contenu réservé aux membres</strong>
                <p>Achetez ce programme pour accéder à toutes les vidéos.</p>
              </div>
              <a href="/offres" class="btn btn-primary btn-sm">Voir les offres</a>
            </div>` : ''}
          ${modules.length === 0
            ? '<p style="color:var(--white-muted)">Les modules seront bientôt disponibles.</p>'
            : `<div class="modules-list">
                ${modules.map(m => `
                  <div class="module-item ${m.video_url || !hasAccess ? 'module-has-video' : ''}">
                    <div class="module-header">
                      <div class="module-num">${m.ordre}</div>
                      <div class="module-info">
                        <strong>${m.titre}</strong>
                        <small>${m.description || ''}</small>
                      </div>
                      <div class="module-meta">
                        ${m.video_url ? '<span class="module-has-video-icon">▶</span>' : (hasAccess ? '' : '<span class="module-locked-icon">🔒</span>')}
                        <span class="module-duree">⏱ ${m.duree_minutes || '?'} min</span>
                      </div>
                    </div>
                    ${renderModuleVideo(m, hasAccess)}
                  </div>`).join('')}
               </div>`
          }
        </div>

        <!-- Avis -->
        <div class="tab-panel" id="tab-avis">
          ${reviews.length === 0
            ? '<p style="color:var(--white-muted)">Aucun avis pour l\'instant. Sois le premier !</p>'
            : `<div class="reviews-header">
                <div class="reviews-score">
                  <span class="score-big">${avgNote}</span>
                  <div>
                    <div class="score-stars">${'★'.repeat(Math.round(avgNote))}${'☆'.repeat(5 - Math.round(avgNote))}</div>
                    <div class="score-count">${reviews.length} avis</div>
                  </div>
                </div>
               </div>
               <div class="reviews-list">
                ${reviews.map(r => `
                  <div class="review-item">
                    <div class="review-header">
                      <div class="review-author">
                        <div class="review-avatar">${(r.profiles?.full_name || 'A')[0].toUpperCase()}</div>
                        <div>
                          <strong>${r.profiles?.full_name || 'Client'}</strong>
                          <small>${new Date(r.created_at).toLocaleDateString('fr-FR')}</small>
                        </div>
                      </div>
                      <span class="review-stars">${'★'.repeat(r.note)}${'☆'.repeat(5 - r.note)}</span>
                    </div>
                    <p class="review-text">${r.commentaire || ''}</p>
                  </div>`).join('')}
               </div>`
          }
        </div>
      </div>
    </section>
  `;

  // Bouton panier
  document.getElementById('btn-cart')?.addEventListener('click', () => {
    addToCart({ id: p.id, titre: p.titre, prix: p.prix_promo ?? p.prix, image_url: p.image_url });
    const btn = document.getElementById('btn-cart');
    btn.textContent = '✓ Dans le panier';
    btn.disabled = true;
  });

  // Expand/collapse vidéo au clic sur un module
  document.querySelectorAll('.module-item.module-has-video').forEach(item => {
    item.querySelector('.module-header')?.addEventListener('click', () => {
      item.classList.toggle('open');
    });
  });

  // Onglets
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`)?.classList.add('active');
    });
  });
}

function renderError(msg) {
  document.getElementById('detail-main').innerHTML = `
    <div style="min-height:60vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;color:var(--white-muted);">
      <span style="font-size:3rem">⚠️</span>
      <p>${msg}</p>
      <a href="/programmes" class="btn btn-gold-outline">Retour aux programmes</a>
    </div>`;
}
