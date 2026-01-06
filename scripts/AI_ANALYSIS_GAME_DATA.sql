-- ============================================================
-- AI ANALYSIS DATA EXTRACTION
-- Game: 34ef2b6b-ad6d-4c58-8326-916e9a7c4e98
-- ============================================================

-- 1. GAME INFO
SELECT 
  g.id,
  g.opponent_name,
  g.home_score,
  g.away_score,
  g.status,
  g.quarter,
  t.name AS team_name,
  g.is_coach_game
FROM games g
LEFT JOIN teams t ON g.team_a_id = t.id
WHERE g.id = '34ef2b6b-ad6d-4c58-8326-916e9a7c4e98';

-- 2. TEAM STATS SUMMARY (Your Team)
SELECT 
  'Your Team' AS team,
  -- Shooting
  COUNT(*) FILTER (WHERE stat_type = 'field_goal' AND modifier = 'made') AS fg_made,
  COUNT(*) FILTER (WHERE stat_type = 'field_goal') AS fg_attempts,
  COUNT(*) FILTER (WHERE stat_type = 'three_pointer' AND modifier = 'made') AS three_made,
  COUNT(*) FILTER (WHERE stat_type = 'three_pointer') AS three_attempts,
  COUNT(*) FILTER (WHERE stat_type = 'free_throw' AND modifier = 'made') AS ft_made,
  COUNT(*) FILTER (WHERE stat_type = 'free_throw') AS ft_attempts,
  -- Other stats
  COUNT(*) FILTER (WHERE stat_type = 'rebound') AS total_rebounds,
  COUNT(*) FILTER (WHERE stat_type = 'rebound' AND modifier = 'offensive') AS offensive_rebounds,
  COUNT(*) FILTER (WHERE stat_type = 'rebound' AND modifier = 'defensive') AS defensive_rebounds,
  COUNT(*) FILTER (WHERE stat_type = 'assist') AS assists,
  COUNT(*) FILTER (WHERE stat_type = 'steal') AS steals,
  COUNT(*) FILTER (WHERE stat_type = 'block') AS blocks,
  COUNT(*) FILTER (WHERE stat_type = 'turnover') AS turnovers,
  COUNT(*) FILTER (WHERE stat_type = 'foul') AS fouls
FROM game_stats
WHERE game_id = '34ef2b6b-ad6d-4c58-8326-916e9a7c4e98'
  AND (is_opponent_stat = false OR is_opponent_stat IS NULL);

-- 3. OPPONENT STATS SUMMARY
SELECT 
  'Opponent' AS team,
  COUNT(*) FILTER (WHERE stat_type = 'field_goal' AND modifier = 'made') AS fg_made,
  COUNT(*) FILTER (WHERE stat_type = 'field_goal') AS fg_attempts,
  COUNT(*) FILTER (WHERE stat_type = 'three_pointer' AND modifier = 'made') AS three_made,
  COUNT(*) FILTER (WHERE stat_type = 'three_pointer') AS three_attempts,
  COUNT(*) FILTER (WHERE stat_type = 'free_throw' AND modifier = 'made') AS ft_made,
  COUNT(*) FILTER (WHERE stat_type = 'free_throw') AS ft_attempts,
  COUNT(*) FILTER (WHERE stat_type = 'rebound') AS total_rebounds,
  COUNT(*) FILTER (WHERE stat_type = 'rebound' AND modifier = 'offensive') AS offensive_rebounds,
  COUNT(*) FILTER (WHERE stat_type = 'rebound' AND modifier = 'defensive') AS defensive_rebounds,
  COUNT(*) FILTER (WHERE stat_type = 'assist') AS assists,
  COUNT(*) FILTER (WHERE stat_type = 'steal') AS steals,
  COUNT(*) FILTER (WHERE stat_type = 'block') AS blocks,
  COUNT(*) FILTER (WHERE stat_type = 'turnover') AS turnovers,
  COUNT(*) FILTER (WHERE stat_type = 'foul') AS fouls
FROM game_stats
WHERE game_id = '34ef2b6b-ad6d-4c58-8326-916e9a7c4e98'
  AND is_opponent_stat = true;

-- 4. TOP PLAYERS (by impact: points + rebounds + assists + steals + blocks - turnovers)
SELECT 
  cp.name AS player_name,
  cp.jersey_number,
  -- Points calculation
  (COUNT(*) FILTER (WHERE gs.stat_type = 'field_goal' AND gs.modifier = 'made') * 2 +
   COUNT(*) FILTER (WHERE gs.stat_type = 'three_pointer' AND gs.modifier = 'made') * 3 +
   COUNT(*) FILTER (WHERE gs.stat_type = 'free_throw' AND gs.modifier = 'made')) AS points,
  COUNT(*) FILTER (WHERE gs.stat_type = 'rebound') AS rebounds,
  COUNT(*) FILTER (WHERE gs.stat_type = 'assist') AS assists,
  COUNT(*) FILTER (WHERE gs.stat_type = 'steal') AS steals,
  COUNT(*) FILTER (WHERE gs.stat_type = 'block') AS blocks,
  COUNT(*) FILTER (WHERE gs.stat_type = 'turnover') AS turnovers,
  COUNT(*) FILTER (WHERE gs.stat_type = 'foul') AS fouls,
  -- Impact score
  (COUNT(*) FILTER (WHERE gs.stat_type = 'field_goal' AND gs.modifier = 'made') * 2 +
   COUNT(*) FILTER (WHERE gs.stat_type = 'three_pointer' AND gs.modifier = 'made') * 3 +
   COUNT(*) FILTER (WHERE gs.stat_type = 'free_throw' AND gs.modifier = 'made') +
   COUNT(*) FILTER (WHERE gs.stat_type = 'rebound') * 1.2 +
   COUNT(*) FILTER (WHERE gs.stat_type = 'assist') * 1.5 +
   COUNT(*) FILTER (WHERE gs.stat_type = 'steal') * 2 +
   COUNT(*) FILTER (WHERE gs.stat_type = 'block') * 2 -
   COUNT(*) FILTER (WHERE gs.stat_type = 'turnover') * 1.5) AS impact_score
FROM game_stats gs
JOIN custom_players cp ON gs.custom_player_id = cp.id
WHERE gs.game_id = '34ef2b6b-ad6d-4c58-8326-916e9a7c4e98'
  AND (gs.is_opponent_stat = false OR gs.is_opponent_stat IS NULL)
GROUP BY cp.id, cp.name, cp.jersey_number
ORDER BY impact_score DESC
LIMIT 5;

-- 5. QUARTER BY QUARTER SCORING
SELECT 
  quarter,
  -- Your team points
  (COUNT(*) FILTER (WHERE stat_type = 'field_goal' AND modifier = 'made' AND (is_opponent_stat = false OR is_opponent_stat IS NULL)) * 2 +
   COUNT(*) FILTER (WHERE stat_type = 'three_pointer' AND modifier = 'made' AND (is_opponent_stat = false OR is_opponent_stat IS NULL)) * 3 +
   COUNT(*) FILTER (WHERE stat_type = 'free_throw' AND modifier = 'made' AND (is_opponent_stat = false OR is_opponent_stat IS NULL))) AS your_team_points,
  -- Opponent points
  (COUNT(*) FILTER (WHERE stat_type = 'field_goal' AND modifier = 'made' AND is_opponent_stat = true) * 2 +
   COUNT(*) FILTER (WHERE stat_type = 'three_pointer' AND modifier = 'made' AND is_opponent_stat = true) * 3 +
   COUNT(*) FILTER (WHERE stat_type = 'free_throw' AND modifier = 'made' AND is_opponent_stat = true)) AS opponent_points
FROM game_stats
WHERE game_id = '34ef2b6b-ad6d-4c58-8326-916e9a7c4e98'
GROUP BY quarter
ORDER BY quarter;

-- 6. TOTAL STATS COUNT
SELECT COUNT(*) AS total_stats
FROM game_stats
WHERE game_id = '34ef2b6b-ad6d-4c58-8326-916e9a7c4e98';

