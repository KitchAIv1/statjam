-- ============================================================================
-- GAME SUMMARY ANALYTICS - STANDALONE QUERY VERSION
-- ============================================================================
-- Version: 1.0.0
-- Date: December 18, 2025
-- Purpose: Run this query directly to test game summary analytics
-- 
-- USAGE: Replace game ID in queries below, or use the function call
-- ============================================================================

-- ============================================================================
-- QUICK START: Get the final JSON output (run this after deploying function)
-- ============================================================================
SELECT get_game_summary_analytics('38d7f2a4-ac51-4cf1-b3a9-72e8dcf3ec82');

-- ============================================================================
-- DEBUGGING QUERIES: Run each step to verify data
-- ============================================================================

-- ============================================================================
-- STEP 1: Verify base game data exists
-- ============================================================================
SELECT 
  g.id AS game_id,
  g.home_score,
  g.away_score,
  g.team_a_id,
  g.team_b_id,
  g.is_coach_game,
  g.opponent_name,
  g.status,
  t_a.name AS team_a_name,
  CASE 
    WHEN g.is_coach_game THEN COALESCE(g.opponent_name, 'Opponent')
    ELSE t_b.name
  END AS team_b_name,
  ABS(g.home_score - g.away_score) AS score_diff,
  CASE 
    WHEN g.home_score > g.away_score THEN 'home'
    WHEN g.away_score > g.home_score THEN 'away'
    ELSE 'tie'
  END AS winner_side
FROM games g
LEFT JOIN teams t_a ON g.team_a_id = t_a.id
LEFT JOIN teams t_b ON g.team_b_id = t_b.id
WHERE g.id = '38d7f2a4-ac51-4cf1-b3a9-72e8dcf3ec82';

-- ============================================================================
-- STEP 2: Verify team stats aggregation
-- ============================================================================
SELECT 
  gs.team_id,
  t.name AS team_name,
  -- Shooting
  COUNT(*) FILTER (WHERE gs.stat_type IN ('field_goal', 'two_pointer') AND gs.modifier = 'made') AS fg_made,
  COUNT(*) FILTER (WHERE gs.stat_type IN ('field_goal', 'two_pointer')) AS fg_attempted,
  COUNT(*) FILTER (WHERE gs.stat_type IN ('three_pointer', '3_pointer') AND gs.modifier = 'made') AS three_made,
  COUNT(*) FILTER (WHERE gs.stat_type IN ('three_pointer', '3_pointer')) AS three_attempted,
  COUNT(*) FILTER (WHERE gs.stat_type = 'free_throw' AND gs.modifier = 'made') AS ft_made,
  COUNT(*) FILTER (WHERE gs.stat_type = 'free_throw') AS ft_attempted,
  -- Other
  COUNT(*) FILTER (WHERE gs.stat_type = 'rebound') AS total_rebounds,
  COUNT(*) FILTER (WHERE gs.stat_type = 'rebound' AND gs.modifier = 'offensive') AS off_rebounds,
  COUNT(*) FILTER (WHERE gs.stat_type = 'assist') AS assists,
  COUNT(*) FILTER (WHERE gs.stat_type = 'steal') AS steals,
  COUNT(*) FILTER (WHERE gs.stat_type = 'block') AS blocks,
  COUNT(*) FILTER (WHERE gs.stat_type = 'turnover') AS turnovers,
  -- Points
  SUM(CASE WHEN gs.modifier = 'made' THEN COALESCE(gs.stat_value, 0) ELSE 0 END) AS points
FROM game_stats gs
LEFT JOIN teams t ON gs.team_id = t.id
WHERE gs.game_id = '38d7f2a4-ac51-4cf1-b3a9-72e8dcf3ec82'
  AND gs.is_opponent_stat = FALSE
GROUP BY gs.team_id, t.name
ORDER BY points DESC;

-- ============================================================================
-- STEP 3: Player impact scores (top 10 for debugging)
-- ============================================================================
SELECT 
  COALESCE(u.name, cp.name, 'Unknown') AS player_name,
  t.name AS team_name,
  SUM(CASE WHEN gs.modifier = 'made' THEN COALESCE(gs.stat_value, 0) ELSE 0 END) AS points,
  COUNT(*) FILTER (WHERE gs.stat_type = 'rebound') AS rebounds,
  COUNT(*) FILTER (WHERE gs.stat_type = 'assist') AS assists,
  COUNT(*) FILTER (WHERE gs.stat_type = 'steal') AS steals,
  COUNT(*) FILTER (WHERE gs.stat_type = 'block') AS blocks,
  COUNT(*) FILTER (WHERE gs.stat_type = 'turnover') AS turnovers,
  -- Impact score formula
  ROUND(
    SUM(CASE WHEN gs.modifier = 'made' THEN COALESCE(gs.stat_value, 0) ELSE 0 END) * 1.0 +
    COUNT(*) FILTER (WHERE gs.stat_type = 'rebound') * 0.8 +
    COUNT(*) FILTER (WHERE gs.stat_type = 'assist') * 0.7 +
    COUNT(*) FILTER (WHERE gs.stat_type = 'steal') * 1.2 +
    COUNT(*) FILTER (WHERE gs.stat_type = 'block') * 1.1 -
    COUNT(*) FILTER (WHERE gs.stat_type = 'turnover') * 1.0,
    2
  ) AS impact_score
FROM game_stats gs
LEFT JOIN users u ON gs.player_id = u.id
LEFT JOIN custom_players cp ON gs.custom_player_id = cp.id
LEFT JOIN teams t ON gs.team_id = t.id
WHERE gs.game_id = '38d7f2a4-ac51-4cf1-b3a9-72e8dcf3ec82'
  AND gs.is_opponent_stat = FALSE
  AND (gs.player_id IS NOT NULL OR gs.custom_player_id IS NOT NULL)
GROUP BY COALESCE(u.name, cp.name, 'Unknown'), t.name
ORDER BY impact_score DESC
LIMIT 10;

-- ============================================================================
-- STEP 4: Quarter-by-quarter scoring breakdown
-- ============================================================================
SELECT 
  gs.quarter,
  gs.team_id,
  t.name AS team_name,
  SUM(CASE WHEN gs.modifier = 'made' THEN COALESCE(gs.stat_value, 0) ELSE 0 END) AS quarter_points
FROM game_stats gs
LEFT JOIN teams t ON gs.team_id = t.id
WHERE gs.game_id = '38d7f2a4-ac51-4cf1-b3a9-72e8dcf3ec82'
  AND gs.is_opponent_stat = FALSE
  AND gs.modifier = 'made'
GROUP BY gs.quarter, gs.team_id, t.name
ORDER BY gs.quarter, quarter_points DESC;

-- ============================================================================
-- STEP 5: Stat type distribution (for debugging)
-- ============================================================================
SELECT 
  gs.stat_type,
  gs.modifier,
  COUNT(*) AS count,
  SUM(gs.stat_value) AS total_value
FROM game_stats gs
WHERE gs.game_id = '38d7f2a4-ac51-4cf1-b3a9-72e8dcf3ec82'
GROUP BY gs.stat_type, gs.modifier
ORDER BY count DESC;
