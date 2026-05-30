# Taya Fitness — Site de coaching en ligne

Site MPA (Multi-Page Application) en HTML/CSS/JS vanilla, connecté à Supabase, déployé sur Vercel.

## Stack
- **Frontend** : HTML5 / CSS3 / JavaScript ES Modules (vanilla)
- **Backend** : Supabase (Auth + PostgreSQL + RLS)
- **Déploiement** : Vercel
- **Paiement** : Stripe (à configurer)

## Structure
```
/
├── index.html               # Accueil
├── programmes.html          # Catalogue
├── programme-detail.html    # Fiche programme
├── offres.html              # Les 3 abonnements
├── panier.html              # Panier
├── checkout.html            # Commande
├── auth.html                # Connexion / Inscription
├── dashboard.html           # Espace membre
├── contact.html             # Contact & À propos
├── vercel.json
├── css/                     # Styles par page
├── js/                      # Logique par page
└── supabase/
    └── schema.sql           # Script BDD complet
```

## Installation

### 1. Supabase
1. Aller dans [Supabase](https://supabase.com) → ton projet
2. SQL Editor → coller le contenu de `supabase/schema.sql` → Run
3. Les tables et données de démo sont créées

### 2. Variables (déjà intégrées dans `/js/supabase.js`)
```
SUPABASE_URL  = https://esylzsacjkimcqxllhwd.supabase.co
SUPABASE_ANON = sb_publishable_BwFcaEtnSEZovSIOYiVM3w_CAwp-gpc
```

### 3. GitHub
```bash
git init
git add .
git commit -m "Initial commit — Taya Fitness"
git remote add origin https://github.com/[ton-compte]/taya-fitness.git
git push -u origin main
```

### 4. Vercel
1. [vercel.com](https://vercel.com) → New Project → Import depuis GitHub
2. Pas de build command ni output directory (site statique)
3. Deploy → le site est en ligne

### 5. Stripe (prochaine étape)
- Créer un compte Stripe
- Créer 3 produits (Starter 49€, Performance 99€, VIP 199€) en abonnement récurrent
- Ajouter une Vercel Function `/api/create-checkout-session`
- Configurer le webhook Stripe pour mettre à jour les achats en `active`

## Pages
| URL | Fichier | Description |
|-----|---------|-------------|
| `/` | index.html | Accueil + hero + offres + témoignages |
| `/programmes` | programmes.html | Catalogue avec filtres |
| `/programme-detail?slug=xxx` | programme-detail.html | Fiche détaillée |
| `/offres` | offres.html | 3 abonnements + comparatif |
| `/panier` | panier.html | Panier (localStorage) |
| `/checkout` | checkout.html | Commande + facturation |
| `/auth` | auth.html | Connexion / Inscription |
| `/dashboard` | dashboard.html | Espace membre (protégé) |
| `/contact` | contact.html | Contact + FAQ + À propos |

## SEO
- Balises meta title/description sur chaque page
- Canonical URLs
- Structure H1/H2/H3 sémantique
- Images lazy-load
- Données structurées (à ajouter)
- Sitemap (à générer)
