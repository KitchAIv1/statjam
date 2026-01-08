-- Check actual points from game stats
-- Game: ff743a36-8814-4932-b116-4ce22ab3afb9

-- 1. Game info
SELECT 
  id,
  home_score,
  away_score,
  team_a_id,
  team_b_id,
  is_coach_game,
  opponent_name,
  status
FROM games
WHERE id = 'ff743a36-8814-4932-b116-4ce22ab3afb9';

-- 2. Calculate actual points from game_stats
SELECT 
  CASE WHEN is_opponent_stat THEN 'Away/Opponent' ELSE 'Home/Team A' END as team,
  SUM(CASE WHEN stat_type = 'field_goal' AND modifier = 'made' THEN 2 ELSE 0 END) as fg_points,
  SUM(CASE WHEN stat_type = 'three_pointer' AND modifier = 'made' THEN 3 ELSE 0 END) as three_points,
  SUM(CASE WHEN stat_type = 'free_throw' AND modifier = 'made' THEN 1 ELSE 0 END) as ft_points,
  SUM(CASE WHEN stat_type = 'field_goal' AND modifier = 'made' THEN 2 ELSE 0 END) +
  SUM(CASE WHEN stat_type = 'three_pointer' AND modifier = 'made' THEN 3 ELSE 0 END) +
  SUM(CASE WHEN stat_type = 'free_throw' AND modifier = 'made' THEN 1 ELSE 0 END) as total_points
FROM game_stats
WHERE game_id = 'ff743a36-8814-4932-b116-4ce22ab3afb9'
GROUP BY is_opponent_stat
ORDER BY is_opponent_stat;

-- 3. Breakdown by team_id
SELECT 
  gs.team_id,
  t.name as team_name,
  SUM(CASE WHEN stat_type = 'field_goal' AND modifier = 'made' THEN 2 ELSE 0 END) as fg_points,
  SUM(CASE WHEN stat_type = 'three_pointer' AND modifier = 'made' THEN 3 ELSE 0 END) as three_points,
  SUM(CASE WHEN stat_type = 'free_throw' AND modifier = 'made' THEN 1 ELSE 0 END) as ft_points,
  SUM(CASE WHEN stat_type = 'field_goal' AND modifier = 'made' THEN 2 ELSE 0 END) +
  SUM(CASE WHEN stat_type = 'three_pointer' AND modifier = 'made' THEN 3 ELSE 0 END) +
  SUM(CASE WHEN stat_type = 'free_throw' AND modifier = 'made' THEN 1 ELSE 0 END) as total_points
FROM game_stats gs
LEFT JOIN teams t ON gs.team_id = t.id
WHERE gs.game_id = 'ff743a36-8814-4932-b116-4ce22ab3afb9'
GROUP BY gs.team_id, t.name
ORDER BY total_points DESC;

