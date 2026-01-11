-- ============================================================
-- AUDIT TEAM SEASON DATA FOR CLEANUP
-- Team ID: 2c1f31f4-b4e7-44c8-aa03-37524718c317
-- Purpose: Identify redundant players and opponent stats to clean up
-- ============================================================

-- ============================================================
-- STEP 1: List ALL seasons for this team
-- ============================================================
SELECT 
  s.id AS season_id,
  s.name AS season_name,
  s.status,
  s.wins,
  s.losses,
  s.total_points_for,
  s.total_points_against,
  s.created_at
FROM seasons s
WHERE s.team_id = '2c1f31f4-b4e7-44c8-aa03-37524718c317'
ORDER BY s.created_at DESC;

-- ============================================================
-- STEP 2: List ALL games linked to seasons for this team
-- ============================================================
SELECT 
  sg.season_id,
  s.name AS season_name,
  sg.game_id,
  g.opponent_name,
  g.home_score,
  g.away_score,
  g.status AS game_status,
  g.is_coach_game,
  g.created_at AS game_created_at
FROM season_games sg
JOIN seasons s ON sg.season_id = s.id
JOIN games g ON sg.game_id = g.id
WHERE s.team_id = '2c1f31f4-b4e7-44c8-aa03-37524718c317'
ORDER BY s.name, g.created_at;

-- ============================================================
-- STEP 3: List ALL games for this team (regardless of season)
-- ============================================================
SELECT 
  g.id AS game_id,
  g.opponent_name,
  g.home_score,
  g.away_score,
  g.status,
  g.is_coach_game,
  g.created_at,
  CASE WHEN sg.game_id IS NOT NULL THEN '✅ In Season' ELSE '❌ Not in Season' END AS in_season
FROM games g
LEFT JOIN season_games sg ON g.id = sg.game_id
WHERE g.team_a_id = '2c1f31f4-b4e7-44c8-aa03-37524718c317'
   OR g.stat_admin_id IN (
     SELECT coach_id FROM teams WHERE id = '2c1f31f4-b4e7-44c8-aa03-37524718c317'
   )
ORDER BY g.created_at DESC;

-- ============================================================
-- STEP 4: List ALL custom players for this team
-- ============================================================
SELECT 
  cp.id AS custom_player_id,
  cp.name AS player_name,
  cp.jersey_number,
  cp.team_id,
  cp.coach_id,
  cp.created_at
FROM custom_players cp
WHERE cp.team_id = '2c1f31f4-b4e7-44c8-aa03-37524718c317'
ORDER BY cp.name;

-- ============================================================
-- STEP 5: Find ALL unique players in game_stats for season games
-- This shows who appears in player stats (including potential duplicates/opponents)
-- ============================================================
SELECT 
  COALESCE(cp.name, u.name, 'UNKNOWN') AS player_name,
  gs.custom_player_id,
  gs.player_id,
  gs.is_opponent_stat,
  cp.team_id AS custom_player_team_id,
  COUNT(*) AS stat_count,
  SUM(CASE WHEN gs.stat_type = 'field_goal' AND gs.modifier = 'made' THEN 2 ELSE 0 END) +
  SUM(CASE WHEN gs.stat_type = 'three_pointer' AND gs.modifier = 'made' THEN 3 ELSE 0 END) +
  SUM(CASE WHEN gs.stat_type = 'free_throw' AND gs.modifier = 'made' THEN 1 ELSE 0 END) AS total_points
FROM game_stats gs
JOIN season_games sg ON gs.game_id = sg.game_id
JOIN seasons s ON sg.season_id = s.id
LEFT JOIN custom_players cp ON gs.custom_player_id = cp.id
LEFT JOIN users u ON gs.player_id = u.id
WHERE s.team_id = '2c1f31f4-b4e7-44c8-aa03-37524718c317'
GROUP BY 
  COALESCE(cp.name, u.name, 'UNKNOWN'),
  gs.custom_player_id,
  gs.player_id,
  gs.is_opponent_stat,
  cp.team_id
ORDER BY player_name;

-- ============================================================
-- STEP 6: Identify OPPONENT STATS (is_opponent_stat = true)
-- These should NOT appear in player leaderboard
-- ============================================================
SELECT 
  'OPPONENT STATS' AS section,
  gs.game_id,
  g.opponent_name,
  gs.stat_type,
  gs.modifier,
  gs.is_opponent_stat,
  COUNT(*) AS count
FROM game_stats gs
JOIN season_games sg ON gs.game_id = sg.game_id
JOIN seasons s ON sg.season_id = s.id
JOIN games g ON gs.game_id = g.id
WHERE s.team_id = '2c1f31f4-b4e7-44c8-aa03-37524718c317'
  AND gs.is_opponent_stat = true
GROUP BY gs.game_id, g.opponent_name, gs.stat_type, gs.modifier, gs.is_opponent_stat
ORDER BY g.opponent_name, gs.stat_type;

-- ============================================================
-- STEP 7: Find players NOT in this team's custom_players
-- (Potential duplicates from transferred games)
-- ============================================================
SELECT 
  'ORPHAN/FOREIGN PLAYERS' AS section,
  COALESCE(cp.name, u.name, 'UNKNOWN') AS player_name,
  gs.custom_player_id,
  gs.player_id,
  cp.team_id AS actual_team_id,
  gs.is_opponent_stat,
  COUNT(*) AS stat_count
FROM game_stats gs
JOIN season_games sg ON gs.game_id = sg.game_id
JOIN seasons s ON sg.season_id = s.id
LEFT JOIN custom_players cp ON gs.custom_player_id = cp.id
LEFT JOIN users u ON gs.player_id = u.id
WHERE s.team_id = '2c1f31f4-b4e7-44c8-aa03-37524718c317'
  AND gs.is_opponent_stat = false
  AND (
    -- Custom player from different team
    (gs.custom_player_id IS NOT NULL AND cp.team_id != '2c1f31f4-b4e7-44c8-aa03-37524718c317')
    -- Or custom player doesn't exist anymore
    OR (gs.custom_player_id IS NOT NULL AND cp.id IS NULL)
  )
GROUP BY 
  COALESCE(cp.name, u.name, 'UNKNOWN'),
  gs.custom_player_id,
  gs.player_id,
  cp.team_id,
  gs.is_opponent_stat
ORDER BY player_name;

-- ============================================================
-- STEP 8: Look specifically for "THORTON" variations
-- ============================================================
SELECT 
  'THORTON SEARCH' AS section,
  cp.id AS custom_player_id,
  cp.name,
  cp.team_id,
  cp.jersey_number,
  (SELECT COUNT(*) FROM game_stats WHERE custom_player_id = cp.id) AS stat_count
FROM custom_players cp
WHERE LOWER(cp.name) LIKE '%thorton%'
   OR LOWER(cp.name) LIKE '%thornton%'
ORDER BY cp.name;

-- ============================================================
-- STEP 9: Summary of what needs cleanup
-- ============================================================
SELECT 'CLEANUP SUMMARY' AS section;

-- Count opponent stats that need to be excluded
SELECT 
  'Opponent stats to exclude' AS metric,
  COUNT(*) AS count
FROM game_stats gs
JOIN season_games sg ON gs.game_id = sg.game_id
JOIN seasons s ON sg.season_id = s.id
WHERE s.team_id = '2c1f31f4-b4e7-44c8-aa03-37524718c317'
  AND gs.is_opponent_stat = true;

-- Count foreign/orphan player stats
SELECT 
  'Foreign/orphan player stats' AS metric,
  COUNT(*) AS count
FROM game_stats gs
JOIN season_games sg ON gs.game_id = sg.game_id
JOIN seasons s ON sg.season_id = s.id
LEFT JOIN custom_players cp ON gs.custom_player_id = cp.id
WHERE s.team_id = '2c1f31f4-b4e7-44c8-aa03-37524718c317'
  AND gs.is_opponent_stat = false
  AND gs.custom_player_id IS NOT NULL
  AND (cp.team_id != '2c1f31f4-b4e7-44c8-aa03-37524718c317' OR cp.id IS NULL);

