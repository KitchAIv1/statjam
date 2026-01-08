-- ============================================================
-- TOURNAMENT GAME DATA EXTRACTION: 7f743a36-8814-4932-b116-4ce22ab3afb9
-- Magicians vs Spartans - Sports Article Data
-- ============================================================

-- STEP 1: Get Game Details (Tournament game - both teams have IDs)
SELECT 
  g.id,
  g.home_score,
  g.away_score,
  g.status,
  g.quarter,
  g.created_at,
  ta.name AS team_a_name,
  tb.name AS team_b_name,
  t.name AS tournament_name
FROM games g
LEFT JOIN teams ta ON g.team_a_id = ta.id
LEFT JOIN teams tb ON g.team_b_id = tb.id
LEFT JOIN tournaments t ON g.tournament_id = t.id
WHERE g.id = '7f743a36-8814-4932-b116-4ce22ab3afb9';

-- STEP 2: Get Team A (Magicians) Stats
SELECT 
  stat_type,
  modifier,
  COUNT(*) AS count
FROM game_stats
WHERE game_id = '7f743a36-8814-4932-b116-4ce22ab3afb9'
  AND is_opponent_stat = FALSE
GROUP BY stat_type, modifier
ORDER BY stat_type, modifier;

-- STEP 3: Get Team B (Spartans) Stats
SELECT 
  stat_type,
  modifier,
  COUNT(*) AS count
FROM game_stats
WHERE game_id = '7f743a36-8814-4932-b116-4ce22ab3afb9'
  AND is_opponent_stat = TRUE
GROUP BY stat_type, modifier
ORDER BY stat_type, modifier;

-- STEP 4: Get Player Stats for Team A (Magicians) - with team info
SELECT 
  COALESCE(u.name, cp.name) AS player_name,
  'Magicians' AS team,
  SUM(CASE WHEN gs.stat_type = 'field_goal' AND gs.modifier = 'made' THEN 1 ELSE 0 END) AS fg_made,
  SUM(CASE WHEN gs.stat_type = 'field_goal' AND gs.modifier = 'missed' THEN 1 ELSE 0 END) AS fg_missed,
  SUM(CASE WHEN gs.stat_type = 'three_pointer' AND gs.modifier = 'made' THEN 1 ELSE 0 END) AS three_made,
  SUM(CASE WHEN gs.stat_type = 'three_pointer' AND gs.modifier = 'missed' THEN 1 ELSE 0 END) AS three_missed,
  SUM(CASE WHEN gs.stat_type = 'free_throw' AND gs.modifier = 'made' THEN 1 ELSE 0 END) AS ft_made,
  SUM(CASE WHEN gs.stat_type = 'free_throw' AND gs.modifier = 'missed' THEN 1 ELSE 0 END) AS ft_missed,
  SUM(CASE WHEN gs.stat_type = 'rebound' THEN 1 ELSE 0 END) AS rebounds,
  SUM(CASE WHEN gs.stat_type = 'assist' THEN 1 ELSE 0 END) AS assists,
  SUM(CASE WHEN gs.stat_type = 'steal' THEN 1 ELSE 0 END) AS steals,
  SUM(CASE WHEN gs.stat_type = 'block' THEN 1 ELSE 0 END) AS blocks,
  SUM(CASE WHEN gs.stat_type = 'turnover' THEN 1 ELSE 0 END) AS turnovers,
  SUM(CASE WHEN gs.stat_type = 'foul' THEN 1 ELSE 0 END) AS fouls,
  SUM(CASE WHEN gs.stat_type = 'field_goal' AND gs.modifier = 'made' THEN 2
           WHEN gs.stat_type = 'three_pointer' AND gs.modifier = 'made' THEN 3
           WHEN gs.stat_type = 'free_throw' AND gs.modifier = 'made' THEN 1 ELSE 0 END) AS points
FROM game_stats gs
LEFT JOIN users u ON gs.player_id = u.id
LEFT JOIN custom_players cp ON gs.custom_player_id = cp.id
WHERE gs.game_id = '7f743a36-8814-4932-b116-4ce22ab3afb9'
  AND gs.is_opponent_stat = FALSE
GROUP BY player_name
ORDER BY points DESC;

-- STEP 4B: Get Player Stats for Team B (Spartans)
SELECT 
  COALESCE(u.name, cp.name) AS player_name,
  'Spartans' AS team,
  SUM(CASE WHEN gs.stat_type = 'field_goal' AND gs.modifier = 'made' THEN 1 ELSE 0 END) AS fg_made,
  SUM(CASE WHEN gs.stat_type = 'field_goal' AND gs.modifier = 'missed' THEN 1 ELSE 0 END) AS fg_missed,
  SUM(CASE WHEN gs.stat_type = 'three_pointer' AND gs.modifier = 'made' THEN 1 ELSE 0 END) AS three_made,
  SUM(CASE WHEN gs.stat_type = 'three_pointer' AND gs.modifier = 'missed' THEN 1 ELSE 0 END) AS three_missed,
  SUM(CASE WHEN gs.stat_type = 'free_throw' AND gs.modifier = 'made' THEN 1 ELSE 0 END) AS ft_made,
  SUM(CASE WHEN gs.stat_type = 'free_throw' AND gs.modifier = 'missed' THEN 1 ELSE 0 END) AS ft_missed,
  SUM(CASE WHEN gs.stat_type = 'rebound' THEN 1 ELSE 0 END) AS rebounds,
  SUM(CASE WHEN gs.stat_type = 'assist' THEN 1 ELSE 0 END) AS assists,
  SUM(CASE WHEN gs.stat_type = 'steal' THEN 1 ELSE 0 END) AS steals,
  SUM(CASE WHEN gs.stat_type = 'block' THEN 1 ELSE 0 END) AS blocks,
  SUM(CASE WHEN gs.stat_type = 'turnover' THEN 1 ELSE 0 END) AS turnovers,
  SUM(CASE WHEN gs.stat_type = 'foul' THEN 1 ELSE 0 END) AS fouls,
  SUM(CASE WHEN gs.stat_type = 'field_goal' AND gs.modifier = 'made' THEN 2
           WHEN gs.stat_type = 'three_pointer' AND gs.modifier = 'made' THEN 3
           WHEN gs.stat_type = 'free_throw' AND gs.modifier = 'made' THEN 1 ELSE 0 END) AS points
FROM game_stats gs
LEFT JOIN users u ON gs.player_id = u.id
LEFT JOIN custom_players cp ON gs.custom_player_id = cp.id
WHERE gs.game_id = '7f743a36-8814-4932-b116-4ce22ab3afb9'
  AND gs.is_opponent_stat = TRUE
GROUP BY player_name
ORDER BY points DESC;

-- STEP 5: Get Quarter Scores
SELECT 
  quarter,
  SUM(CASE WHEN is_opponent_stat = FALSE THEN 
    CASE WHEN stat_type = 'field_goal' AND modifier = 'made' THEN 2
         WHEN stat_type = 'three_pointer' AND modifier = 'made' THEN 3
         WHEN stat_type = 'free_throw' AND modifier = 'made' THEN 1 ELSE 0 END
    ELSE 0 END) AS magicians_points,
  SUM(CASE WHEN is_opponent_stat = TRUE THEN 
    CASE WHEN stat_type = 'field_goal' AND modifier = 'made' THEN 2
         WHEN stat_type = 'three_pointer' AND modifier = 'made' THEN 3
         WHEN stat_type = 'free_throw' AND modifier = 'made' THEN 1 ELSE 0 END
    ELSE 0 END) AS spartans_points
FROM game_stats
WHERE game_id = '7f743a36-8814-4932-b116-4ce22ab3afb9'
GROUP BY quarter
ORDER BY quarter;

-- STEP 6: Hustle Stats Leaders (Steals + Blocks + Rebounds)
SELECT 
  COALESCE(u.name, cp.name) AS player_name,
  CASE WHEN gs.is_opponent_stat = FALSE THEN 'Magicians' ELSE 'Spartans' END AS team,
  SUM(CASE WHEN gs.stat_type = 'steal' THEN 1 ELSE 0 END) AS steals,
  SUM(CASE WHEN gs.stat_type = 'block' THEN 1 ELSE 0 END) AS blocks,
  SUM(CASE WHEN gs.stat_type = 'rebound' THEN 1 ELSE 0 END) AS rebounds,
  SUM(CASE WHEN gs.stat_type IN ('steal', 'block', 'rebound') THEN 1 ELSE 0 END) AS hustle_total
FROM game_stats gs
LEFT JOIN users u ON gs.player_id = u.id
LEFT JOIN custom_players cp ON gs.custom_player_id = cp.id
WHERE gs.game_id = '7f743a36-8814-4932-b116-4ce22ab3afb9'
  AND gs.stat_type IN ('steal', 'block', 'rebound')
GROUP BY player_name, gs.is_opponent_stat
ORDER BY hustle_total DESC
LIMIT 5;

-- STEP 7: Leading Scorer of the Game
SELECT 
  COALESCE(u.name, cp.name) AS player_name,
  CASE WHEN gs.is_opponent_stat = FALSE THEN 'Magicians' ELSE 'Spartans' END AS team,
  SUM(CASE WHEN gs.stat_type = 'field_goal' AND gs.modifier = 'made' THEN 2
           WHEN gs.stat_type = 'three_pointer' AND gs.modifier = 'made' THEN 3
           WHEN gs.stat_type = 'free_throw' AND gs.modifier = 'made' THEN 1 ELSE 0 END) AS points
FROM game_stats gs
LEFT JOIN users u ON gs.player_id = u.id
LEFT JOIN custom_players cp ON gs.custom_player_id = cp.id
WHERE gs.game_id = '7f743a36-8814-4932-b116-4ce22ab3afb9'
GROUP BY player_name, gs.is_opponent_stat
ORDER BY points DESC
LIMIT 1;

