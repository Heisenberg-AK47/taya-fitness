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
    const { data: prog, error } = await supabase
      .from('programmes')
      .select('*')
      .eq('slug', slug)
      .eq('actif', true)
      .single();
    if (error || !prog) { renderError('Programme introuvable.'); return; }
    document.title = prog.titre + ' — Taya Fitness';
    document.querySelector('meta[name="description"]')?.setAttribute('content', prog.description_courte || prog.titre);
    const { data: modules } = await supabase.rpc('get_modules_with_access', { p_programme_id: prog.id });
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
  const { data } = await supabase.from('achats').select('id')
    .eq('user_id', user.id).eq('programme_id', programmeId).eq('statut', 'active').maybeSingle();
  return !!data;
}

async function loadReviews(programmeId) {
  try {
    const { data } = await supabase.from('reviews').select('*, profiles(full_name)')
      .eq('programme_id', programmeId).order('created_at', { ascending: false });
    return data || [];
  } catch { return []; }
}

function youtubeEmbed(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? 'https://www.youtube.com/embed/' + match[1] + '?rel=0&modestbranding=1' : null;
}

/* ── Contenu contextuel selon le type de programme ─────── */
function getProgrammeContent(titre, objectif) {
  const t = (titre + ' ' + (objectif || '')).toLowerCase();
  const isGrossesse = t.includes('grossesse');
  const isPostPartum = t.includes('post-partum') || t.includes('partum');
  const isStrength = t.includes('stronger') || t.includes('strength') || t.includes('muscle') || t.includes('mass') || t.includes('athletic') || t.includes('rugby');
  const isSlim = t.includes('slim') || t.includes('poids') || t.includes('kilos') || t.includes('minceur');
  const isHome = t.includes('home') || t.includes('domicile');
  const isAndropause = t.includes('andropause') || t.includes('40 ans') || t.includes('after 40') || t.includes('building muscle after');

  if (isGrossesse) return {
    tagline: 'Rester active et en bonne santé pendant toute ta grossesse.',
    resultats: ['💪 Maintien du tonus musculaire', '🧘 Réduction des douleurs de dos', '😴 Meilleur sommeil', '❤️ Circulation sanguine optimisée'],
    benefices: [
      { icon: '🤰', titre: 'Adapté trimestre par trimestre', desc: 'Des exercices spécialement conçus pour chaque phase de ta grossesse, en toute sécurité.' },
      { icon: '🦺', titre: 'Sécurité avant tout', desc: 'Tous les exercices sont validés pour les femmes enceintes. Zéro prise de risque.' },
      { icon: '⚡', titre: 'Maintien de l\'énergie', desc: 'Combattre la fatigue, booster l\'humeur et garder la forme jusqu\'à l\'accouchement.' },
      { icon: '🔄', titre: 'Récupération facilitée', desc: 'Rester active pendant la grossesse prépare ton corps pour une meilleure récupération post-partum.' },
    ],
    pourQui: ['Tu es enceinte et veux rester active en sécurité', 'Tu veux éviter les douleurs musculaires et dorsales', 'Tu cherches un programme validé par une coach spécialisée'],
  };

  if (isPostPartum) return {
    tagline: 'Retrouver ton corps et ton énergie après l\'accouchement, en douceur et en sécurité.',
    resultats: ['🔄 Récupération du périnée', '💪 Retour progressif du tonus', '😌 Réduction du baby blues', '⚡ Regain d\'énergie'],
    benefices: [
      { icon: '🌱', titre: 'Programme progressif', desc: 'Reprise douce et graduée, adaptée à ta récupération post-accouchement.' },
      { icon: '🦺', titre: 'Sécurité périnéale', desc: 'Des exercices conçus pour protéger et renforcer ton périnée en priorité.' },
      { icon: '❤️', titre: 'Corps et mental', desc: 'Reprendre confiance en ton corps après l\'accouchement, à ton propre rythme.' },
      { icon: '🏠', titre: 'Faisable à domicile', desc: 'Pratique depuis chez toi, adaptable à ton rythme avec bébé.' },
    ],
    pourQui: ['Tu viens d\'accoucher et veux reprendre le sport sereinement', 'Tu veux retrouver ton tonus sans risquer de te blesser', 'Tu cherches un accompagnement spécialisé post-partum'],
  };

  if (isAndropause) return {
    tagline: 'Sculpter et maintenir une masse musculaire de qualité après 40 ans.',
    resultats: ['💪 +15% de masse musculaire en 8 semaines', '⚡ Regain d\'énergie et de vitalité', '🔥 Accélération du métabolisme', '🧠 Meilleure concentration'],
    benefices: [
      { icon: '🔬', titre: 'Adapté à la physiologie masculine', desc: 'Programme conçu pour les spécificités hormonales après 40 ans.' },
      { icon: '💪', titre: 'Préservation musculaire', desc: 'Lutter contre la sarcopénie et maintenir une composition corporelle optimale.' },
      { icon: '⚡', titre: 'Récupération optimisée', desc: 'Séances équilibrées pour maximiser les résultats sans surentraînement.' },
      { icon: '📈', titre: 'Progression garantie', desc: '8 semaines de programme progressif pour des résultats durables.' },
    ],
    pourQui: ['Tu as plus de 40 ans et veux reprendre le sport', 'Tu ressens une baisse de forme ou d\'énergie', 'Tu veux sculpter ton corps avec un programme adapté à ton âge'],
  };

  if (isSlim) return {
    tagline: 'Perdre du poids durablement et sculpter ta silhouette.',
    resultats: ['🔥 Brûle jusqu\'à 500 kcal par séance', '📉 Perte de poids durable', '💪 Tonus musculaire préservé', '⚡ Énergie boostée'],
    benefices: [
      { icon: '🔥', titre: 'Brûlage de graisses ciblé', desc: 'Protocoles cardio-training et HIIT pour maximiser la combustion des graisses.' },
      { icon: '💪', titre: 'Muscle préservé', desc: 'Perdre du gras sans perdre du muscle grâce à un équilibre entraînement/récupération optimal.' },
      { icon: '📊', titre: 'Résultats mesurables', desc: 'Suivi de tes progrès semaine par semaine avec des indicateurs concrets.' },
      { icon: '🥗', titre: 'Conseils nutrition inclus', desc: 'Des conseils alimentaires pour accompagner ton effort physique.' },
    ],
    pourQui: ['Tu veux perdre du poids de manière durable', 'Tu en as assez des régimes qui ne durent pas', 'Tu veux retrouver une silhouette tonique et en bonne santé'],
  };

  if (isStrength) return {
    tagline: 'Développer ta force, sculpter ta masse musculaire et dépasser tes limites.',
    resultats: ['💪 +20% de force en 8 semaines', '🏋️ Masse musculaire visible', '⚡ Récupération accélérée', '🎯 Technique maîtrisée'],
    benefices: [
      { icon: '🏋️', titre: 'Programme de force progressive', desc: 'Charge et intensité augmentent chaque semaine pour forcer ton corps à s\'adapter.' },
      { icon: '🎯', titre: 'Technique irréprochable', desc: 'Chaque exercice est enseigné avec la bonne forme pour éviter les blessures et maximiser les gains.' },
      { icon: '🔄', titre: 'Récupération intégrée', desc: 'Des protocoles de récupération active pour maintenir l\'intensité sur la durée.' },
      { icon: '📈', titre: 'Progression semaine après semaine', desc: '8 semaines de périodisation soigneusement planifiée pour des résultats tangibles.' },
    ],
    pourQui: ['Tu veux développer une vraie masse musculaire', 'Tu t\'entraînes déjà mais tu stagnes', 'Tu veux une méthode structurée avec des résultats concrets'],
  };

  // Default
  return {
    tagline: 'Un programme complet pour transformer ton corps et dépasser tes objectifs.',
    resultats: ['💪 Corps sculpté et tonifié', '⚡ Énergie et vitalité décuplées', '🎯 Objectifs atteints', '😌 Confiance retrouvée'],
    benefices: [
      { icon: '📋', titre: 'Programme structuré', desc: 'Un plan d\'entraînement progressif conçu par Sarah pour des résultats optimaux.' },
      { icon: '🎥', titre: 'Vidéos HD', desc: 'Chaque séance est filmée avec explications techniques pour une exécution parfaite.' },
      { icon: '🔄', titre: 'Progressivité', desc: 'Intensité croissante semaine après semaine pour continuer à progresser.' },
      { icon: '💬', titre: 'Coaching inclus', desc: 'Sarah t\'accompagne tout au long de ton parcours avec conseils et motivation.' },
    ],
    pourQui: ['Tu veux des résultats concrets et durables', 'Tu cherches un programme structuré et professionnel', 'Tu veux être guidé(e) par une coach certifiée'],
  };
}

/* ── Render ─────────────────────────────────────────────── */
function renderModuleVideo(m, hasAccess) {
  const embedUrl = youtubeEmbed(m.video_url);
  if (embedUrl) {
    return '<div class="module-video"><iframe src="' + embedUrl + '" title="' + m.titre + '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>' +
      (m.video_gratuite ? '<span class="video-badge video-badge-free">Aperçu gratuit</span>' : '') + '</div>';
  }
  if (!hasAccess) {
    return '<div class="module-locked"><div class="locked-icon">🔒</div><p>Vidéo réservée aux membres</p><a href="/offres" class="btn btn-gold-outline btn-sm">Voir les offres</a></div>';
  }
  return '';
}

function renderDetail(p, modules, reviews, hasAccess) {
  const niveauLabels = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' };
  modules = (modules || []).sort((a, b) => a.ordre - b.ordre);
  const avgNote = reviews.length ? (reviews.reduce((s, r) => s + r.note, 0) / reviews.length).toFixed(1) : null;
  const content = getProgrammeContent(p.titre, p.objectif);
  const semaines = p.duree_semaines || 8;
  const inCart = isInCart(p.id);

  document.getElementById('detail-main').innerHTML = `

<!-- HERO -->
<section class="detail-hero">
  <div class="container">
    <div class="detail-hero-grid">
      <div class="detail-left">
        <div class="detail-breadcrumb">
          <a href="/">Accueil</a><span>/</span>
          <a href="/programmes">Programmes</a><span>/</span>
          <span>${esc(p.titre)}</span>
        </div>
        <div class="detail-badges">
          <span class="badge badge-${p.niveau || 'debutant'}">${niveauLabels[p.niveau] || 'Tous niveaux'}</span>
          ${p.categorie ? '<span class="badge" style="background:rgba(201,168,76,0.1);color:var(--gold)">' + esc(p.categorie) + '</span>' : ''}
        </div>
        <h1 class="detail-title">${esc(p.titre)}</h1>
        <p class="detail-desc">${esc(p.description_courte || content.tagline)}</p>
        ${avgNote ? '<div class="detail-rating"><span class="rating-stars">' + '★'.repeat(Math.round(avgNote)) + '☆'.repeat(5 - Math.round(avgNote)) + '</span><span class="rating-num">' + avgNote + '</span><span class="rating-count">(' + reviews.length + ' avis)</span></div>' : ''}
        <div class="detail-stats">
          <div class="detail-stat">
            <strong>${p.duree_heures ? p.duree_heures + 'h' : semaines + ' sem.'}</strong>
            <small>${p.duree_heures ? 'Durée totale' : 'Programme'}</small>
          </div>
          <div class="detail-stat">
            <strong>${modules.length || p.nb_modules || '?'}</strong>
            <small>Modules</small>
          </div>
          <div class="detail-stat">
            <strong>🏋️</strong>
            <small>En ligne</small>
          </div>
          <div class="detail-stat">
            <strong>✓</strong>
            <small>Certifiée</small>
          </div>
        </div>

        <div class="hero-benefits-mini">
          ${content.benefices.slice(0, 3).map(b => `<div class="hero-benefit-item"><span class="hbi-icon">✓</span><span>${esc(b)}</span></div>`).join('')}
        </div>
      </div>

      <!-- Carte achat -->
      <div class="detail-buy-card">
        <div class="buy-image">
          ${p.image_url
            ? '<img src="' + p.image_url + '" alt="' + esc(p.titre) + '" />'
            : '<div style="width:100%;height:200px;display:flex;align-items:center;justify-content:center;font-size:4rem;background:var(--black-border);border-radius:var(--radius)">🏋️</div>'}
        </div>
        <div class="buy-price">
          ${p.prix_promo ? '<span class="promo">' + p.prix + '€</span>' : ''}
          <span class="amount">${p.prix_promo ?? p.prix}€</span>
          <span class="period">/mois</span>
        </div>
        <p class="buy-desc">Accès illimité · Suivi inclus · Mises à jour gratuites</p>
        <div class="buy-actions">
          <button class="btn btn-primary" id="btn-cart" ${inCart ? 'disabled' : ''}>
            ${inCart ? '✓ Dans le panier' : '🛒 Commencer maintenant'}
          </button>
          ${inCart ? '<a href="/panier" class="btn btn-outline">Voir le panier</a>' : ''}
        </div>
        <div class="buy-guarantees">
          <div class="buy-guarantee-item">✅ Accès immédiat après paiement</div>
          <div class="buy-guarantee-item">📱 Mobile &amp; desktop</div>
          <div class="buy-guarantee-item">🔄 Sans engagement</div>
          <div class="buy-guarantee-item">💳 Paiement sécurisé</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- RÉSULTATS ATTENDUS -->
<section class="detail-results-bar">
  <div class="container">
    <div class="results-grid">
      ${content.resultats.map(r => '<div class="result-item"><span>' + r + '</span></div>').join('')}
    </div>
  </div>
</section>

<!-- BÉNÉFICES -->
<section class="section detail-benefices-section">
  <div class="container">
    <div class="detail-two-col">
      <div class="detail-benefices">
        <h2 class="section-title-sm">Ce que tu vas obtenir</h2>
        <div class="benefices-grid">
          ${content.benefices.map(b => `
          <div class="benefice-card">
            <div class="benefice-icon">${b.icon}</div>
            <div>
              <strong>${b.titre}</strong>
              <p>${b.desc}</p>
            </div>
          </div>`).join('')}
        </div>
      </div>
      <div class="detail-pour-qui">
        <h2 class="section-title-sm">Pour qui ?</h2>
        <ul class="pour-qui-list">
          ${content.pourQui.map(q => '<li>✓ ' + q + '</li>').join('')}
        </ul>
        <div class="detail-coach-mini">
          <img src="https://esylzsacjkimcqxllhwd.supabase.co/storage/v1/object/public/media/APC_0640.JPG" alt="Sarah" class="coach-mini-img" />
          <div>
            <strong>Sarah · Coach certifiée</strong>
            <p>8 ans d'expérience · 200+ clients accompagnés</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ONGLETS -->
<section class="section detail-tabs-section">
  <div class="container">
    <div class="detail-tabs">
      <button class="tab-btn active" data-tab="description">Description</button>
      <button class="tab-btn" data-tab="programme">Programme (${modules.length} modules)</button>
      <button class="tab-btn" data-tab="avis">Avis (${reviews.length})</button>
    </div>

    <!-- Description -->
    <div class="tab-panel active" id="tab-description">
      <div class="detail-description">
        ${(p.description || p.description_courte
          ? (p.description || p.description_courte).split('\n').map(l => '<p>' + l + '</p>').join('')
          : '<p>' + content.tagline + '</p><p>Ce programme de <strong>' + semaines + ' semaines</strong> a été conçu par Sarah pour t\'accompagner pas à pas vers tes objectifs. Chaque module est structuré pour maximiser tes résultats tout en respectant ton corps.</p>'
        )}
        <div class="desc-highlights">
          <div class="desc-highlight-item"><strong>${semaines} semaines</strong><small>de programme</small></div>
          <div class="desc-highlight-item"><strong>${modules.length || p.nb_modules || '?'} modules</strong><small>vidéos HD</small></div>
          <div class="desc-highlight-item"><strong>Accès illimité</strong><small>à vie</small></div>
          <div class="desc-highlight-item"><strong>Certifié</strong><small>par Sarah</small></div>
        </div>
      </div>
    </div>

    <!-- Modules -->
    <div class="tab-panel" id="tab-programme">
      ${!hasAccess ? '<div class="modules-access-banner"><span>🔒</span><div><strong>Contenu réservé aux membres</strong><p>Achetez ce programme pour accéder à toutes les vidéos.</p></div><a href="/offres" class="btn btn-primary btn-sm">Voir les offres</a></div>' : ''}
      ${modules.length === 0
        ? '<p style="color:var(--white-muted)">Les modules seront bientôt disponibles.</p>'
        : '<div class="modules-list">' + modules.map(m => `
          <div class="module-item ${m.video_url || !hasAccess ? 'module-has-video' : ''}">
            <div class="module-header">
              <div class="module-num">${m.ordre}</div>
              <div class="module-info">
                <strong>${esc(m.titre)}</strong>
                <small>${esc(m.description || '')}</small>
              </div>
              <div class="module-meta">
                ${m.video_url ? '<span class="module-has-video-icon">▶</span>' : (hasAccess ? '' : '<span class="module-locked-icon">🔒</span>')}
                <span class="module-duree">⏱ ${m.duree_minutes || '?'} min</span>
              </div>
            </div>
            ${renderModuleVideo(m, hasAccess)}
          </div>`).join('') + '</div>'}
    </div>

    <!-- Avis -->
    <div class="tab-panel" id="tab-avis">
      ${reviews.length === 0
        ? '<div class="no-reviews"><p>Pas encore d\'avis. Sois la première à témoigner après ta transformation !</p></div>'
        : '<div class="reviews-header"><div class="reviews-score"><span class="score-big">' + avgNote + '</span><div><div class="score-stars">' + '★'.repeat(Math.round(avgNote)) + '☆'.repeat(5 - Math.round(avgNote)) + '</div><div class="score-count">' + reviews.length + ' avis</div></div></div></div>' +
          '<div class="reviews-list">' + reviews.map(r => '<div class="review-item"><div class="review-header"><div class="review-author"><div class="review-avatar">' + (r.profiles?.full_name || 'A')[0].toUpperCase() + '</div><div><strong>' + esc(r.profiles?.full_name || 'Client') + '</strong><small>' + new Date(r.created_at).toLocaleDateString('fr-FR') + '</small></div></div><span class="review-stars">' + '★'.repeat(r.note) + '☆'.repeat(5 - r.note) + '</span></div><p class="review-text">' + esc(r.commentaire || '') + '</p></div>').join('') + '</div>'}
    </div>
  </div>
</section>

<!-- CTA STICKY MOBILE -->
<div class="sticky-cta-mobile" id="sticky-cta">
  <div class="sticky-cta-price">${p.prix_promo ?? p.prix}€<span>/mois</span></div>
  <button class="btn btn-primary" id="btn-cart-sticky" ${inCart ? 'disabled' : ''}>
    ${inCart ? '✓ Dans le panier' : '🛒 Commencer maintenant'}
  </button>
</div>
`;

  // Bouton panier principal
  document.getElementById('btn-cart')?.addEventListener('click', () => {
    addToCart({ id: p.id, titre: p.titre, prix: p.prix_promo ?? p.prix, image_url: p.image_url });
    const btn = document.getElementById('btn-cart');
    const stickyBtn = document.getElementById('btn-cart-sticky');
    if (btn) { btn.textContent = '✓ Dans le panier'; btn.disabled = true; }
    if (stickyBtn) { stickyBtn.textContent = '✓ Dans le panier'; stickyBtn.disabled = true; }
  });

  // Bouton panier sticky
  document.getElementById('btn-cart-sticky')?.addEventListener('click', () => {
    addToCart({ id: p.id, titre: p.titre, prix: p.prix_promo ?? p.prix, image_url: p.image_url });
    const btn = document.getElementById('btn-cart');
    const stickyBtn = document.getElementById('btn-cart-sticky');
    if (btn) { btn.textContent = '✓ Dans le panier'; btn.disabled = true; }
    if (stickyBtn) { stickyBtn.textContent = '✓ Dans le panier'; stickyBtn.disabled = true; }
  });

  // Expand/collapse modules
  document.querySelectorAll('.module-item.module-has-video').forEach(item => {
    item.querySelector('.module-header')?.addEventListener('click', () => item.classList.toggle('open'));
  });

  // Onglets
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab)?.classList.add('active');
    });
  });

  // Sticky CTA : masquer quand la buy card est visible
  const buyCard = document.querySelector('.detail-buy-card');
  const stickyCta = document.getElementById('sticky-cta');
  if (buyCard && stickyCta) {
    const obs = new IntersectionObserver(entries => {
      stickyCta.classList.toggle('hidden', entries[0].isIntersecting);
    }, { threshold: 0.1 });
    obs.observe(buyCard);
  }
}

function esc(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderError(msg) {
  document.getElementById('detail-main').innerHTML = `
    <div style="min-height:60vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;color:var(--white-muted);">
      <span style="font-size:3rem">⚠️</span>
      <p>${msg}</p>
      <a href="/programmes" class="btn btn-gold-outline">Retour aux programmes</a>
    </div>`;
}
