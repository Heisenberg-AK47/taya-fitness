# Taya Fitness — Coaching Online (PWA)

PWA de coaching 100% online, branchée sur le Supabase Taya Fitness existant
(projet `esylzsacjkimcqxllhwd`) et le checkout Stripe (`stripe-checkout`).

## Structure
- `index.html` — page d'offre + mur de paiement (3 formules online)
- `login.html` — connexion / inscription (Supabase Auth)
- `app/index.html` — espace membre (onboarding, programme, logging, suivi de poids)
- `app/demo.html` — démo interactive (données fictives, sans connexion)
- `assets/` — `app.css` (thème), `supabase.js` (client + gate paywall)
- `sw.js`, `manifest.webmanifest`, `icons/` — PWA installable
- `vercel.json` — config Vercel (cleanUrls + headers SW)

## Important : déployer à la RACINE d'un domaine
L'app utilise des chemins absolus (`/app`, `/sw.js`, `/manifest.webmanifest`, `/assets`)
et un scope de service worker `/`. Elle doit donc être servie à la racine d'un domaine
ou sous-domaine dédié — **pas** sous un sous-chemin (`/coaching`) d'un site existant.

Recommandé : nouveau projet Vercel + sous-domaine, ex. `coaching.tayafitness.com`.

## Déploiement (3 options)
1. **Drag & drop** : sur vercel.com → New Project → glisser le dossier `taya-online/`.
2. **CLI** : depuis le dossier, `vercel --prod`.
3. **Git** : pousser le dossier dans un repo connecté à un nouveau projet Vercel.

## Après déploiement — 1 réglage
Ajouter l'origine finale (ex. `https://coaching.tayafitness.com`) à la liste
`ALLOWED_ORIGINS` de l'edge function `stripe-checkout`, sinon le checkout sera bloqué par CORS.
(Me le dire et je le fais.)

## Backend déjà en place
- Formules online dans `subscription_plans` (mode `online`, 79/129/199 €)
- `stripe-checkout` v12 : plans `online_essentiel | online_transformation | online_premium`
- Tables membres : `suivi_poids`, `workout_logs` (RLS : chaque user ne voit que ses données)
- Accès au contenu programme conditionné à un abonnement actif (RLS `programme_exercises`)
