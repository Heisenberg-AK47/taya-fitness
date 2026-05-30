-- ============================================================
-- UPDATE_VIDEOS.SQL — Assignation des vidéos YouTube aux modules
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

-- "Gym session full body" → Module Full Body (Transformation Corps, ordre 5)
update modules set
  video_url = 'https://www.youtube.com/watch?v=KsdpZBf45eA',
  video_gratuite = true   -- teaser gratuit visible par tous
where ordre = 5
  and programme_id = (select id from programmes where slug = 'transformation-corps-mental');

-- "Le Corps a soif… même en dormant !" → Module Nutrition (Transformation Corps, ordre 6)
update modules set
  video_url = 'https://www.youtube.com/watch?v=j7q-UDlhCfM',
  video_gratuite = false
where ordre = 6
  and programme_id = (select id from programmes where slug = 'transformation-corps-mental');

-- "Bûcheron sur les genoux avec haltère" → Module Upper Body (Transformation Corps, ordre 7)
update modules set
  video_url = 'https://www.youtube.com/watch?v=roq32NAEHUM',
  video_gratuite = false
where ordre = 7
  and programme_id = (select id from programmes where slug = 'transformation-corps-mental');

-- "Coach sportif femmes enceinte et post partum" → Bilan médical (Post-Partum, ordre 1)
update modules set
  video_url = 'https://www.youtube.com/watch?v=4bnzCEQc-Ho',
  video_gratuite = true   -- teaser gratuit pour attirer les mamans
where ordre = 1
  and programme_id = (select id from programmes where slug = 'remise-forme-post-partum');
