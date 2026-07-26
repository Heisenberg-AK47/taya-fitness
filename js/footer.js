/* ============================================================
   FOOTER.JS — Taya Fitness avec vrais logos réseaux sociaux
   ============================================================ */

export function initFooter() {
  const html = `
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">

        <!-- Marque -->
        <div class="footer-brand">
          <a href="/" class="footer-logo"><img src="/assets/logo.png" alt="Taya Fitness" style="height:36px;width:auto;display:block"></a>
          <p>Coach sportive certifiée, spécialisée en coaching personnalisé, nutrition et développement personnel. Transforme ton corps et ton esprit.</p>
          <div class="footer-socials">
            <a href="https://instagram.com/tayafitness" target="_blank" rel="noopener" aria-label="Instagram" title="Instagram">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a href="https://youtube.com/@tayafitness" target="_blank" rel="noopener" aria-label="YouTube" title="YouTube">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
            <a href="https://facebook.com/tayafitness" target="_blank" rel="noopener" aria-label="Facebook" title="Facebook">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a href="https://www.tiktok.com/@taya.fitness" target="_blank" rel="noopener" aria-label="TikTok" title="TikTok">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
              </svg>
            </a>
          </div>
        </div>

        <!-- Navigation -->
        <div class="footer-col">
          <h4>Navigation</h4>
          <ul>
            <li><a href="/">Accueil</a></li>
            <li><a href="/programmes">Programmes</a></li>
            <li><a href="/offres">Nos offres</a></li>
            <li><a href="/contact">À propos</a></li>
            <li><a href="/auth">Connexion</a></li>
          </ul>
        </div>

        <!-- Programmes -->
        <div class="footer-col">
          <h4>Programmes</h4>
          <ul>
            <li><a href="/programmes?categorie=perte-de-poids">Perte de poids</a></li>
            <li><a href="/programmes?categorie=musculation">Musculation</a></li>
            <li><a href="/programmes?categorie=grossesse">Grossesse</a></li>
            <li><a href="/programmes?categorie=post-partum">Post-partum</a></li>
            <li><a href="/programmes?categorie=nutrition">Nutrition</a></li>
          </ul>
        </div>

        <!-- Contact -->
        <div class="footer-col footer-contact">
          <h4>Contact</h4>
          <div class="contact-item">
            <div class="icon">📧</div>
            <p><strong>Email</strong>contact@tayafitness.com</p>
          </div>
          <div class="contact-item">
            <div class="icon">📞</div>
            <p><strong>Téléphone</strong>07 49 07 17 81</p>
          </div>
          <div class="contact-item">
            <div class="icon">📍</div>
            <p><strong>Zone</strong>Région parisienne</p>
          </div>
        </div>

      </div>
    </div>

    <!-- Bas de page -->
    <div class="container">
      <div class="footer-bottom">
        <p>© ${new Date().getFullYear()} TayaFitness. Tous droits réservés. —
          <a href="/mentions-legales">Mentions légales</a> ·
          <a href="/cgv">CGV</a>
        </p>
        <div class="footer-bottom-links">
          <a href="/mentions-legales#donnees">Politique de confidentialité</a>
          <a href="/mentions-legales#cookies">Cookies</a>
        </div>
      </div>
    </div>
  </footer>`;

  const placeholder = document.getElementById('footer-placeholder');
  if (placeholder) {
    placeholder.outerHTML = html;
  } else {
    document.body.insertAdjacentHTML('beforeend', html);
  }
}
