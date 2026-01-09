-- ============================================================
-- GAME TRANSFER AUDIT - Verify before transferring games to coach profile
-- Games: 38d7f2a4-ac51-4cf1-b3a9-72e8dcf3ec82, ddf6af58-7cc3-4f1e-a353-8971fd4088cb
-- Target Coach: wardterence02@gmail.com
-- ============================================================

-- STEP 1: Get the coach's user ID and teams
SELECT 
  u.id AS coach_user_id,
  u.email,
  u.name AS coach_name,
  t.id AS team_id,
  t.name AS team_name,
  t.coach_id
FROM users u
LEFT JOIN teams t ON t.coach_id = u.id
WHERE u.email = 'wardterence02@gmail.com';

-- STEP 2: Get details of the two games to be transferred
SELECT 
  g.id AS game_id,
  g.team_a_id,
  g.team_b_id,
  g.home_score,
  g.away_score,
  g.status,
  g.opponent_name,
  g.is_coach_game,
  ta.name AS team_a_name,
  tb.name AS team_b_name,
  g.created_at
FROM games g
LEFT JOIN teams ta ON g.team_a_id = ta.id
LEFT JOIN teams tb ON g.team_b_id = tb.id
WHERE g.id IN (
  '38d7f2a4-ac51-4cf1-b3a9-72e8dcf3ec82',
  'ddf6af58-7cc3-4f1e-a353-8971fd4088cb'
);

-- STEP 3: Get the CURRENT teams that own these games
SELECT DISTINCT
  g.id AS game_id,
  g.team_a_id,
  t.name AS current_team_name,
  t.coach_id AS current_coach_id,
  u.email AS current_coach_email
FROM games g
LEFT JOIN teams t ON g.team_a_id = t.id
LEFT JOIN users u ON t.coach_id = u.id
WHERE g.id IN (
  '38d7f2a4-ac51-4cf1-b3a9-72e8dcf3ec82',
  'ddf6af58-7cc3-4f1e-a353-8971fd4088cb'
);

-- STEP 4: Get custom players used in these games (from game_stats)
SELECT DISTINCT
  gs.game_id,
  gs.custom_player_id,
  cp.name AS player_name,
  cp.team_id AS player_team_id,
  t.name AS player_team_name
FROM game_stats gs
LEFT JOIN custom_players cp ON gs.custom_player_id = cp.id
LEFT JOIN teams t ON cp.team_id = t.id
WHERE gs.game_id IN (
  '38d7f2a4-ac51-4cf1-b3a9-72e8dcf3ec82',
  'ddf6af58-7cc3-4f1e-a353-8971fd4088cb'
)
AND gs.custom_player_id IS NOT NULL
AND gs.is_opponent_stat = FALSE
ORDER BY gs.game_id, cp.name;

-- STEP 5: Get the TARGET coach's team roster (custom players)
SELECT 
  cp.id AS custom_player_id,
  cp.name AS player_name,
  cp.jersey_number,
  cp.team_id,
  t.name AS team_name
FROM custom_players cp
JOIN teams t ON cp.team_id = t.id
WHERE t.coach_id = (
  SELECT id FROM users WHERE email = 'wardterence02@gmail.com'
)
ORDER BY cp.name;

-- STEP 6: COMPARE - Find matching player names between source and target
WITH source_players AS (
  SELECT DISTINCT
    cp.name AS player_name,
    cp.id AS source_player_id,
    gs.game_id
  FROM game_stats gs
  JOIN custom_players cp ON gs.custom_player_id = cp.id
  WHERE gs.game_id IN (
    '38d7f2a4-ac51-4cf1-b3a9-72e8dcf3ec82',
    'ddf6af58-7cc3-4f1e-a353-8971fd4088cb'
  )
  AND gs.is_opponent_stat = FALSE
),
target_players AS (
  SELECT 
    cp.name AS player_name,
    cp.id AS target_player_id
  FROM custom_players cp
  JOIN teams t ON cp.team_id = t.id
  WHERE t.coach_id = (
    SELECT id FROM users WHERE email = 'wardterence02@gmail.com'
  )
)
SELECT 
  sp.game_id,
  sp.player_name AS source_player_name,
  sp.source_player_id,
  tp.player_name AS target_player_name,
  tp.target_player_id,
  CASE 
    WHEN tp.target_player_id IS NOT NULL THEN '✅ MATCH'
    ELSE '❌ NO MATCH'
  END AS match_status
FROM source_players sp
LEFT JOIN target_players tp ON LOWER(TRIM(sp.player_name)) = LOWER(TRIM(tp.player_name))
ORDER BY sp.game_id, sp.player_name;

-- STEP 7: Count stats per game to understand impact
SELECT 
  game_id,
  COUNT(*) AS total_stats,
  COUNT(DISTINCT custom_player_id) AS unique_players,
  SUM(CASE WHEN is_opponent_stat = FALSE THEN 1 ELSE 0 END) AS team_stats,
  SUM(CASE WHEN is_opponent_stat = TRUE THEN 1 ELSE 0 END) AS opponent_stats
FROM game_stats
WHERE game_id IN (
  '38d7f2a4-ac51-4cf1-b3a9-72e8dcf3ec82',
  'ddf6af58-7cc3-4f1e-a353-8971fd4088cb'
)
GROUP BY game_id;

