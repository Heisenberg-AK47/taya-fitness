/* reveal.js — observer fade-in autonome, sans import (résiste aux CDN lents/bloqués) */
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function revealAll() {
    document.querySelectorAll('.fade-in:not(.visible)').forEach(el => el.classList.add('visible'));
  }

  if (reduced || !('IntersectionObserver' in window)) {
    revealAll();
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  function observe() {
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
  }

  // Filet de sécurité : si DOM pas encore prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observe);
  } else {
    observe();
  }

  // Filet 2 s pour les éléments déjà visibles à l'écran au chargement
  setTimeout(revealAll, 2000);
})();
