-- ============================================================
-- ADD_VIDEOS.SQL — Ajout vidéos aux modules
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

-- 1. Ajouter les colonnes vidéo à la table modules
alter table modules
  add column if not exists video_url     text,    -- URL YouTube (ex: https://youtu.be/xxx)
  add column if not exists video_gratuite boolean default false; -- true = visible sans achat (teaser)

-- 2. Supprimer l'ancienne policy de lecture modules (trop permissive pour les vidéos)
drop policy if exists "Lecture modules publics" on modules;

-- 3. Policy : lecture des infos de base (titre, description, durée) → tout le monde si programme actif
--    MAIS video_url masquée côté RLS → on laisse Supabase renvoyer la ligne,
--    le filtrage de video_url se fait côté JS selon le statut d'achat.
--    (Supabase ne supporte pas le masquage de colonnes par RLS, donc on contrôle côté applicatif)
create policy "Lecture modules publics" on modules
  for select using (
    exists (
      select 1 from programmes p
      where p.id = modules.programme_id and p.actif = true
    )
  );

-- 4. Fonction sécurisée : retourne les modules avec video_url uniquement si l'utilisateur a acheté
-- Cette fonction tourne avec les droits du système (SECURITY DEFINER)
create or replace function get_modules_with_access(p_programme_id uuid)
returns table (
  id              uuid,
  programme_id    uuid,
  titre           text,
  ordre           int,
  duree_minutes   int,
  description     text,
  video_url       text,
  video_gratuite  boolean
)
language plpgsql
security definer
as $$
declare
  v_has_access boolean := false;
begin
  -- Vérifie si l'utilisateur a un achat actif pour ce programme
  if auth.uid() is not null then
    select exists(
      select 1 from achats
      where user_id = auth.uid()
        and programme_id = p_programme_id
        and statut = 'active'
    ) into v_has_access;
  end if;

  return query
    select
      m.id,
      m.programme_id,
      m.titre,
      m.ordre,
      m.duree_minutes,
      m.description,
      case
        when v_has_access = true then m.video_url        -- acheteur → URL complète
        when m.video_gratuite = true then m.video_url    -- teaser gratuit → URL complète
        else null                                         -- non acheteur → null
      end as video_url,
      m.video_gratuite
    from modules m
    where m.programme_id = p_programme_id
    order by m.ordre;
end;
$$;

-- Autoriser les utilisateurs authentifiés et anonymes à appeler cette fonction
grant execute on function get_modules_with_access(uuid) to anon, authenticated;
