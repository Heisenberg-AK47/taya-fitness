/* ============================================================
   FOOTER.JS — Injection du footer dynamique
   ============================================================ */

export function initFooter() {
  const html = `
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">

        <!-- Marque -->
        <div class="footer-brand">
          <a href="/" class="footer-logo">Taya<span>Fitness</span></a>
          <p>Coach sportive certifiée, spécialisée en coaching personnalisé, nutrition et développement personnel. Transforme ton corps et ton esprit.</p>
          <div class="footer-socials">
            <a href="https://instagram.com/tayafitness" target="_blank" rel="noopener" aria-label="Instagram">📸</a>
            <a href="https://youtube.com" target="_blank" rel="noopener" aria-label="YouTube">▶️</a>
            <a href="https://facebook.com" target="_blank" rel="noopener" aria-label="Facebook">📘</a>
            <a href="https://tiktok.com" target="_blank" rel="noopener" aria-label="TikTok">🎵</a>
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
