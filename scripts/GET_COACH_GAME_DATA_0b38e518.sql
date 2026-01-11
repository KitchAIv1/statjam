-- =======================================-- 5. Stat breakdown by quarter (for detailed analysis)
SELECT 
  quarter,
  COUNT(CASE WHEN stat_type = 'field_goal' AND modifier = 'made' THEN 1 END) as fg_made,
  COUNT(CASE WHEN stat_type = 'three_pointer' AND modifier = 'made' THEN 1 END) as three_made,
  COUNT(CASE WHEN stat_type = 'free_throw' AND modifier = 'made' THEN 1 END) as ft_made,
  COUNT(CASE WHEN stat_type = 'rebound' THEN 1 END) as rebounds,
  COUNT(CASE WHEN stat_type = 'assist' THEN 1 END) as assists,
  COUNT(CASE WHEN stat_type = 'steal' THEN 1 END) as steals,
  COUNT(CASE WHEN stat_type = 'turnover' THEN 1 END) as turnovers
FROM game_stats
WHERE game_id = '0b38e518-974e-4fdb-9bca-153d5b3cc788'
GROUP BY quarter
ORDER BY quarter;====
-- Get COACH Game Data for AI Analysis: 0b38e518-974e-4fdb-9bca-153d5b3cc788
-- Coach games track MY TEAM stats only - opponent score is entered manually
-- ===========================================

-- 1. Game Details (Coach Mode)
SELECT 
  g.id,
  g.status,
  g.home_score as my_team_score,
  g.away_score as opponent_score,
  g.quarter,
  g.is_coach_game,
  g.opponent_name,
  ta.name as my_team_name,
  g.created_at
FROM games g
LEFT JOIN teams ta ON g.team_a_id = ta.id
WHERE g.id = '0b38e518-974e-4fdb-9bca-153d5b3cc788';

-- 2. My Team Player Stats (the only stats tracked in coach mode)
-- custom_players uses 'name', users uses 'name'
SELECT 
  COALESCE(cp.name, u.name, 'Unknown') as player_name,
  COUNT(CASE WHEN stat_type = 'field_goal' AND modifier = 'made' THEN 1 END) as fg_made,
  COUNT(CASE WHEN stat_type = 'field_goal' AND modifier = 'missed' THEN 1 END) as fg_missed,
  COUNT(CASE WHEN stat_type = 'three_pointer' AND modifier = 'made' THEN 1 END) as three_made,
  COUNT(CASE WHEN stat_type = 'three_pointer' AND modifier = 'missed' THEN 1 END) as three_missed,
  COUNT(CASE WHEN stat_type = 'free_throw' AND modifier = 'made' THEN 1 END) as ft_made,
  COUNT(CASE WHEN stat_type = 'free_throw' AND modifier = 'missed' THEN 1 END) as ft_missed,
  COUNT(CASE WHEN stat_type = 'rebound' THEN 1 END) as rebounds,
  COUNT(CASE WHEN stat_type = 'assist' THEN 1 END) as assists,
  COUNT(CASE WHEN stat_type = 'steal' THEN 1 END) as steals,
  COUNT(CASE WHEN stat_type = 'block' THEN 1 END) as blocks,
  COUNT(CASE WHEN stat_type = 'turnover' THEN 1 END) as turnovers,
  COUNT(CASE WHEN stat_type = 'foul' THEN 1 END) as fouls,
  -- Points calculation
  (COUNT(CASE WHEN stat_type = 'field_goal' AND modifier = 'made' THEN 1 END) * 2 +
   COUNT(CASE WHEN stat_type = 'three_pointer' AND modifier = 'made' THEN 1 END) * 3 +
   COUNT(CASE WHEN stat_type = 'free_throw' AND modifier = 'made' THEN 1 END)) as points
FROM game_stats gs
LEFT JOIN custom_players cp ON gs.custom_player_id = cp.id
LEFT JOIN users u ON gs.player_id = u.id
WHERE gs.game_id = '0b38e518-974e-4fdb-9bca-153d5b3cc788'
GROUP BY COALESCE(cp.name, u.name, 'Unknown')
ORDER BY points DESC;

-- 3. My Team Totals
SELECT 
  'MY_TEAM_TOTALS' as section,
  COUNT(CASE WHEN stat_type = 'field_goal' AND modifier = 'made' THEN 1 END) as fg_made,
  COUNT(CASE WHEN stat_type = 'field_goal' AND modifier = 'missed' THEN 1 END) as fg_missed,
  COUNT(CASE WHEN stat_type = 'three_pointer' AND modifier = 'made' THEN 1 END) as three_made,
  COUNT(CASE WHEN stat_type = 'three_pointer' AND modifier = 'missed' THEN 1 END) as three_missed,
  COUNT(CASE WHEN stat_type = 'free_throw' AND modifier = 'made' THEN 1 END) as ft_made,
  COUNT(CASE WHEN stat_type = 'free_throw' AND modifier = 'missed' THEN 1 END) as ft_missed,
  COUNT(CASE WHEN stat_type = 'rebound' THEN 1 END) as rebounds,
  COUNT(CASE WHEN stat_type = 'assist' THEN 1 END) as assists,
  COUNT(CASE WHEN stat_type = 'steal' THEN 1 END) as steals,
  COUNT(CASE WHEN stat_type = 'block' THEN 1 END) as blocks,
  COUNT(CASE WHEN stat_type = 'turnover' THEN 1 END) as turnovers,
  COUNT(CASE WHEN stat_type = 'foul' THEN 1 END) as fouls,
  -- Total points
  (COUNT(CASE WHEN stat_type = 'field_goal' AND modifier = 'made' THEN 1 END) * 2 +
   COUNT(CASE WHEN stat_type = 'three_pointer' AND modifier = 'made' THEN 1 END) * 3 +
   COUNT(CASE WHEN stat_type = 'free_throw' AND modifier = 'made' THEN 1 END)) as total_points
FROM game_stats
WHERE game_id = '0b38e518-974e-4fdb-9bca-153d5b3cc788';

-- 4. Quarter-by-Quarter (My Team only - opponent score from game record)
SELECT 
  quarter,
  (SUM(CASE WHEN stat_type = 'field_goal' AND modifier = 'made' THEN 2 ELSE 0 END) +
   SUM(CASE WHEN stat_type = 'three_pointer' AND modifier = 'made' THEN 3 ELSE 0 END) +
   SUM(CASE WHEN stat_type = 'free_throw' AND modifier = 'made' THEN 1 ELSE 0 END)) as my_team_qtr_score,
  COUNT(*) as total_actions
FROM game_stats
WHERE game_id = '0b38e518-974e-4fdb-9bca-153d5b3cc788'
GROUP BY quarter
ORDER BY quarter;



