-- ============================================================
-- AI ANALYSIS DATA COLLECTION
-- Game: 70d61fd3-2f21-4b8d-8754-01ce5838094f
-- ============================================================

-- STEP 1: Game info and final score
SELECT 
  g.id,
  g.home_score,
  g.away_score,
  g.opponent_name,
  g.status,
  t.name as coach_team_name
FROM games g
LEFT JOIN teams t ON g.team_a_id = t.id
WHERE g.id = '70d61fd3-2f21-4b8d-8754-01ce5838094f';

-- STEP 2: Team stats summary (Coach Team)
SELECT 
  stat_type,
  modifier,
  COUNT(*) as count
FROM game_stats
WHERE game_id = '70d61fd3-2f21-4b8d-8754-01ce5838094f'
  AND is_opponent_stat = false
GROUP BY stat_type, modifier
ORDER BY stat_type, modifier;

-- STEP 3: Opponent stats summary
SELECT 
  stat_type,
  modifier,
  COUNT(*) as count
FROM game_stats
WHERE game_id = '70d61fd3-2f21-4b8d-8754-01ce5838094f'
  AND is_opponent_stat = true
GROUP BY stat_type, modifier
ORDER BY stat_type, modifier;

-- STEP 4: Player breakdown (Coach team)
SELECT 
  COALESCE(cp.name, u.name, 'Unknown') as player_name,
  COUNT(*) FILTER (WHERE gs.stat_type = 'field_goal' AND gs.modifier = 'made') as fg_made,
  COUNT(*) FILTER (WHERE gs.stat_type = 'field_goal' AND gs.modifier = 'missed') as fg_missed,
  COUNT(*) FILTER (WHERE gs.stat_type = 'three_pointer' AND gs.modifier = 'made') as three_made,
  COUNT(*) FILTER (WHERE gs.stat_type = 'three_pointer' AND gs.modifier = 'missed') as three_missed,
  COUNT(*) FILTER (WHERE gs.stat_type = 'free_throw' AND gs.modifier = 'made') as ft_made,
  COUNT(*) FILTER (WHERE gs.stat_type = 'free_throw' AND gs.modifier = 'missed') as ft_missed,
  COUNT(*) FILTER (WHERE gs.stat_type = 'rebound') as rebounds,
  COUNT(*) FILTER (WHERE gs.stat_type = 'assist') as assists,
  COUNT(*) FILTER (WHERE gs.stat_type = 'steal') as steals,
  COUNT(*) FILTER (WHERE gs.stat_type = 'block') as blocks,
  COUNT(*) FILTER (WHERE gs.stat_type = 'turnover') as turnovers,
  COUNT(*) FILTER (WHERE gs.stat_type = 'foul') as fouls,
  -- Calculate points
  (COUNT(*) FILTER (WHERE gs.stat_type = 'field_goal' AND gs.modifier = 'made') * 2) +
  (COUNT(*) FILTER (WHERE gs.stat_type = 'three_pointer' AND gs.modifier = 'made') * 3) +
  (COUNT(*) FILTER (WHERE gs.stat_type = 'free_throw' AND gs.modifier = 'made') * 1) as points
FROM game_stats gs
LEFT JOIN custom_players cp ON gs.custom_player_id = cp.id
LEFT JOIN users u ON gs.player_id = u.id
WHERE gs.game_id = '70d61fd3-2f21-4b8d-8754-01ce5838094f'
  AND gs.is_opponent_stat = false
GROUP BY COALESCE(cp.name, u.name, 'Unknown')
ORDER BY points DESC;

-- STEP 5: Quarter breakdown
SELECT 
  quarter,
  SUM(CASE 
    WHEN NOT is_opponent_stat AND stat_type = 'field_goal' AND modifier = 'made' THEN 2
    WHEN NOT is_opponent_stat AND stat_type = 'three_pointer' AND modifier = 'made' THEN 3
    WHEN NOT is_opponent_stat AND stat_type = 'free_throw' AND modifier = 'made' THEN 1
    ELSE 0
  END) as team_points,
  SUM(CASE 
    WHEN is_opponent_stat AND stat_type = 'field_goal' AND modifier = 'made' THEN 2
    WHEN is_opponent_stat AND stat_type = 'three_pointer' AND modifier = 'made' THEN 3
    WHEN is_opponent_stat AND stat_type = 'free_throw' AND modifier = 'made' THEN 1
    ELSE 0
  END) as opponent_points
FROM game_stats
WHERE game_id = '70d61fd3-2f21-4b8d-8754-01ce5838094f'
GROUP BY quarter
ORDER BY quarter;

