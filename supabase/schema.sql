-- ============================================================
-- SCHEMA.SQL — Taya Fitness
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Table : profiles ────────────────────────────────────────
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz default now()
);

alter table profiles enable row level security;

create policy "Lecture profil perso" on profiles
  for select using (auth.uid() = id);

create policy "Mise à jour profil perso" on profiles
  for update using (auth.uid() = id);

create policy "Insertion profil perso" on profiles
  for insert with check (auth.uid() = id);

-- ── Table : programmes ───────────────────────────────────────
create table if not exists programmes (
  id                uuid primary key default uuid_generate_v4(),
  titre             text not null,
  slug              text unique not null,
  description       text,
  description_courte text,
  prix              numeric(10,2) not null,
  prix_promo        numeric(10,2),
  image_url         text,
  categorie         text,
  niveau            text check (niveau in ('debutant','intermediaire','avance')),
  duree_heures      int,
  nb_modules        int,
  actif             boolean default true,
  created_at        timestamptz default now()
);

alter table programmes enable row level security;

create policy "Lecture programmes publics" on programmes
  for select using (actif = true);

-- ── Table : modules ─────────────────────────────────────────
create table if not exists modules (
  id              uuid primary key default uuid_generate_v4(),
  programme_id    uuid references programmes(id) on delete cascade,
  titre           text not null,
  ordre           int default 1,
  duree_minutes   int,
  description     text,
  created_at      timestamptz default now()
);

alter table modules enable row level security;

create policy "Lecture modules publics" on modules
  for select using (
    exists (
      select 1 from programmes p
      where p.id = modules.programme_id and p.actif = true
    )
  );

-- ── Table : achats ───────────────────────────────────────────
create table if not exists achats (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references auth.users(id) on delete cascade,
  programme_id  uuid references programmes(id),
  montant       numeric(10,2),
  statut        text default 'pending' check (statut in ('pending','active','cancelled','refunded')),
  stripe_id     text,
  created_at    timestamptz default now()
);

alter table achats enable row level security;

create policy "Lecture mes achats" on achats
  for select using (auth.uid() = user_id);

create policy "Insertion achat" on achats
  for insert with check (auth.uid() = user_id);

-- ── Table : progression ──────────────────────────────────────
create table if not exists progression (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references auth.users(id) on delete cascade,
  module_id     uuid references modules(id) on delete cascade,
  termine       boolean default false,
  completed_at  timestamptz,
  created_at    timestamptz default now(),
  unique (user_id, module_id)
);

alter table progression enable row level security;

create policy "Lecture ma progression" on progression
  for select using (auth.uid() = user_id);

create policy "Mise à jour progression" on progression
  for all using (auth.uid() = user_id);

-- ── Table : reviews ─────────────────────────────────────────
create table if not exists reviews (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references auth.users(id) on delete cascade,
  programme_id  uuid references programmes(id) on delete cascade,
  note          int check (note between 1 and 5),
  commentaire   text,
  created_at    timestamptz default now(),
  unique (user_id, programme_id)
);

alter table reviews enable row level security;

create policy "Lecture avis publics" on reviews
  for select using (true);

create policy "Insertion avis (acheteur)" on reviews
  for insert with check (
    auth.uid() = user_id and
    exists (
      select 1 from achats a
      where a.user_id = auth.uid()
        and a.programme_id = reviews.programme_id
        and a.statut = 'active'
    )
  );

-- ── Table : contacts ────────────────────────────────────────
create table if not exists contacts (
  id          uuid primary key default uuid_generate_v4(),
  prenom      text,
  nom         text,
  email       text not null,
  tel         text,
  sujet       text,
  message     text,
  created_at  timestamptz default now()
);

alter table contacts enable row level security;

create policy "Insertion contact" on contacts
  for insert with check (true);

-- ── Table : newsletter ──────────────────────────────────────
create table if not exists newsletter (
  id         uuid primary key default uuid_generate_v4(),
  email      text unique not null,
  created_at timestamptz default now()
);

alter table newsletter enable row level security;

create policy "Insertion newsletter" on newsletter
  for insert with check (true);

-- ── Table : reservations ────────────────────────────────────
create table if not exists reservations (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade,
  date_heure  timestamptz not null,
  type        text default 'visio',
  statut      text default 'confirme',
  notes       text,
  created_at  timestamptz default now()
);

alter table reservations enable row level security;

create policy "Lecture mes réservations" on reservations
  for select using (auth.uid() = user_id);

create policy "Insertion réservation" on reservations
  for insert with check (auth.uid() = user_id);

-- ============================================================
-- SEED — 3 programmes de démonstration
-- ============================================================

insert into programmes (titre, slug, description_courte, description, prix, image_url, categorie, niveau, duree_heures, nb_modules, actif)
values
(
  'Transformation Corps & Mental',
  'transformation-corps-mental',
  'Un programme complet 12 semaines pour transformer ton corps et ta relation au sport. Entraînement + nutrition + développement personnel.',
  'Ce programme intensif de 12 semaines combine des séances de musculation progressive, un plan nutritionnel complet et des exercices de développement personnel. Idéal pour celles et ceux qui veulent une transformation durable.

Chaque semaine est organisée autour de 3 à 4 séances de 45-60 minutes, progressives en intensité. Le programme intègre des exercices au poids du corps et des exercices avec matériel.

La partie nutrition inclut un plan alimentaire complet avec calcul de macros, liste de courses hebdomadaire et 50 recettes saines.',
  99.00,
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
  'musculation',
  'intermediaire',
  36,
  12,
  true
),
(
  'Remise en Forme Post-Partum',
  'remise-forme-post-partum',
  'Programme spécialement conçu pour la reprise sportive après l''accouchement. Rééducation périnéale, renforcement doux et progressive.',
  'Ce programme dédié aux mamans accompagne la reprise sportive après l''accouchement en toute sécurité. Il commence par la rééducation périnéale et progresse vers un renforcement musculaire complet.

Durée : 8 semaines, 3 séances par semaine de 20 à 40 minutes. Convient à partir de 6 semaines après l''accouchement (après aval médical).

Inclut : exercices de rééducation périnéale, renforcement du plancher pelvien, abdominaux hypopressifs, et retour progressif au cardio.',
  79.00,
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
  'post-partum',
  'debutant',
  24,
  8,
  true
),
(
  'Perte de Poids Durable',
  'perte-de-poids-durable',
  'Perdre du poids sainement sans se priver. Une méthode progressive combinant cardio, renforcement et nutrition équilibrée.',
  'Ce programme de 10 semaines est conçu pour une perte de poids saine et durable, sans régimes restrictifs ni privations.

La méthode combine : cardio varié (HIIT, marche rapide, vélo), renforcement musculaire ciblé, et une approche nutritionnelle flexible basée sur la satiété et les macronutriments.

Objectif réaliste : 0,5 à 1 kg par semaine. Tout le matériel utilisé est accessible à domicile.',
  89.00,
  'https://images.unsplash.com/photo-1486218119243-13301429208a?w=800&q=80',
  'perte-de-poids',
  'debutant',
  30,
  10,
  true
);

-- Modules pour le 1er programme
insert into modules (programme_id, titre, ordre, duree_minutes, description)
select
  p.id,
  m.titre,
  m.ordre,
  m.duree_minutes,
  m.description
from programmes p
cross join (values
  ('Bilan initial & objectifs', 1, 30, 'Évaluation de ton niveau et définition de tes objectifs personnalisés'),
  ('Semaine 1 — Fondamentaux', 2, 45, 'Apprentissage des mouvements de base : squat, pompes, gainage'),
  ('Semaine 2 — Renforcement', 3, 50, 'Intensification progressive avec ajout de charges légères'),
  ('Semaine 3 — Cardio & Endurance', 4, 45, 'Intégration du cardio HIIT pour booster le métabolisme'),
  ('Semaine 4 — Full Body', 5, 55, 'Circuits full body pour brûler les graisses efficacement'),
  ('Nutrition — Les bases', 6, 40, 'Comprendre les macros, les bonnes portions et l''équilibre alimentaire'),
  ('Semaine 6 — Upper Body', 7, 50, 'Focus haut du corps : épaules, dos, biceps, triceps'),
  ('Semaine 7 — Lower Body', 8, 50, 'Focus bas du corps : fessiers, quadriceps, ischio-jambiers'),
  ('Semaine 8 — Core & Mobilité', 9, 45, 'Gainage profond, mobilité articulaire et prévention des blessures'),
  ('Mental & Motivation', 10, 30, 'Techniques de visualisation et routines de bien-être'),
  ('Semaine 11 — Intensification', 11, 60, 'Montée en charge pour des résultats maximaux'),
  ('Bilan final & Suite', 12, 30, 'Mesures finales, résultats et programme de maintenance')
) as m(titre, ordre, duree_minutes, description)
where p.slug = 'transformation-corps-mental';
