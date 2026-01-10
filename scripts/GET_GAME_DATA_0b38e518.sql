-- ===========================================
-- Get Game Data for AI Analysis: 0b38e518-974e-4fdb-9bca-153d5b3cc788
-- ===========================================

-- 1. Game Details
SELECT 
  g.id,
  g.status,
  g.home_score,
  g.away_score,
  g.quarter,
  g.is_coach_game,
  g.opponent_name,
  ta.name as team_a_name,
  tb.name as team_b_name,
  g.created_at
FROM games g
LEFT JOIN teams ta ON g.team_a_id = ta.id
LEFT JOIN teams tb ON g.team_b_id = tb.id
WHERE g.id = '0b38e518-974e-4fdb-9bca-153d5b3cc788';

-- 2. Calculate Score from game_stats (source of truth)
SELECT 
  'CALCULATED SCORE' as section,
  SUM(CASE 
    WHEN team_id = (SELECT team_a_id FROM games WHERE id = '0b38e518-974e-4fdb-9bca-153d5b3cc788')
    THEN 
      CASE 
        WHEN stat_type = 'field_goal' AND modifier = 'made' THEN 2
        WHEN stat_type = 'three_pointer' AND modifier = 'made' THEN 3
        WHEN stat_type = 'free_throw' AND modifier = 'made' THEN 1
        ELSE 0
      END
    ELSE 0
  END) as team_a_score,
  SUM(CASE 
    WHEN team_id != (SELECT team_a_id FROM games WHERE id = '0b38e518-974e-4fdb-9bca-153d5b3cc788')
    THEN 
      CASE 
        WHEN stat_type = 'field_goal' AND modifier = 'made' THEN 2
        WHEN stat_type = 'three_pointer' AND modifier = 'made' THEN 3
        WHEN stat_type = 'free_throw' AND modifier = 'made' THEN 1
        ELSE 0
      END
    ELSE 0
  END) as team_b_score
FROM game_stats
WHERE game_id = '0b38e518-974e-4fdb-9bca-153d5b3cc788';

-- 3. Quarter-by-Quarter Scores
SELECT 
  quarter,
  SUM(CASE 
    WHEN team_id = (SELECT team_a_id FROM games WHERE id = '0b38e518-974e-4fdb-9bca-153d5b3cc788')
    THEN 
      CASE 
        WHEN stat_type = 'field_goal' AND modifier = 'made' THEN 2
        WHEN stat_type = 'three_pointer' AND modifier = 'made' THEN 3
        WHEN stat_type = 'free_throw' AND modifier = 'made' THEN 1
        ELSE 0
      END
    ELSE 0
  END) as team_a_qtr_score,
  SUM(CASE 
    WHEN team_id != (SELECT team_a_id FROM games WHERE id = '0b38e518-974e-4fdb-9bca-153d5b3cc788')
    THEN 
      CASE 
        WHEN stat_type = 'field_goal' AND modifier = 'made' THEN 2
        WHEN stat_type = 'three_pointer' AND modifier = 'made' THEN 3
        WHEN stat_type = 'free_throw' AND modifier = 'made' THEN 1
        ELSE 0
      END
    ELSE 0
  END) as team_b_qtr_score
FROM game_stats
WHERE game_id = '0b38e518-974e-4fdb-9bca-153d5b3cc788'
GROUP BY quarter
ORDER BY quarter;

-- 4. Team A Player Stats
SELECT 
  COALESCE(cp.display_name, u.display_name, 'Unknown') as player_name,
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
  (COUNT(CASE WHEN stat_type = 'field_goal' AND modifier = 'made' THEN 1 END) * 2 +
   COUNT(CASE WHEN stat_type = 'three_pointer' AND modifier = 'made' THEN 1 END) * 3 +
   COUNT(CASE WHEN stat_type = 'free_throw' AND modifier = 'made' THEN 1 END)) as points
FROM game_stats gs
LEFT JOIN custom_players cp ON gs.custom_player_id = cp.id
LEFT JOIN users u ON gs.player_id = u.id
WHERE gs.game_id = '0b38e518-974e-4fdb-9bca-153d5b3cc788'
  AND gs.team_id = (SELECT team_a_id FROM games WHERE id = '0b38e518-974e-4fdb-9bca-153d5b3cc788')
GROUP BY COALESCE(cp.display_name, u.display_name, 'Unknown')
ORDER BY points DESC;

-- 5. Team B (Opponent) Player Stats
SELECT 
  COALESCE(cp.display_name, u.display_name, 'Unknown') as player_name,
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
  (COUNT(CASE WHEN stat_type = 'field_goal' AND modifier = 'made' THEN 1 END) * 2 +
   COUNT(CASE WHEN stat_type = 'three_pointer' AND modifier = 'made' THEN 1 END) * 3 +
   COUNT(CASE WHEN stat_type = 'free_throw' AND modifier = 'made' THEN 1 END)) as points
FROM game_stats gs
LEFT JOIN custom_players cp ON gs.custom_player_id = cp.id
LEFT JOIN users u ON gs.player_id = u.id
WHERE gs.game_id = '0b38e518-974e-4fdb-9bca-153d5b3cc788'
  AND gs.team_id != (SELECT team_a_id FROM games WHERE id = '0b38e518-974e-4fdb-9bca-153d5b3cc788')
GROUP BY COALESCE(cp.display_name, u.display_name, 'Unknown')
ORDER BY points DESC;

-- 6. Team Totals
SELECT 
  'TEAM_A' as team,
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
  COUNT(CASE WHEN stat_type = 'foul' THEN 1 END) as fouls
FROM game_stats
WHERE game_id = '0b38e518-974e-4fdb-9bca-153d5b3cc788'
  AND team_id = (SELECT team_a_id FROM games WHERE id = '0b38e518-974e-4fdb-9bca-153d5b3cc788')
UNION ALL
SELECT 
  'TEAM_B' as team,
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
  COUNT(CASE WHEN stat_type = 'foul' THEN 1 END) as fouls
FROM game_stats
WHERE game_id = '0b38e518-974e-4fdb-9bca-153d5b3cc788'
  AND team_id != (SELECT team_a_id FROM games WHERE id = '0b38e518-974e-4fdb-9bca-153d5b3cc788');

