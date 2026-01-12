-- ========================================
-- Extract Live Game Data and Stats
-- Game ID: f3a49110-9c1f-4692-98e3-f745d0ee2751
-- Coach: natecoffield@gmail.com
-- Opponent: Dublin Coffman 
-- Team: Lady Monarchs
-- Status: in_progress
-- ========================================

-- 1. GAME DETAILS
SELECT 
  g.id,
  g.status,
  g.is_coach_game,
  g.opponent_name,
  g.home_score as my_team_score,
  g.away_score as opponent_score,
  g.quarter as current_quarter,
  g.periods_per_game,
  g.quarter_length_minutes,
  g.game_clock_minutes,
  g.game_clock_seconds,
  g.is_clock_running,
  g.team_a_fouls,
  g.team_b_fouls,
  ta.name as my_team_name,
  ta.id as my_team_id,
  g.start_time,
  g.created_at,
  g.updated_at
FROM games g
LEFT JOIN teams ta ON g.team_a_id = ta.id
WHERE g.id = 'f3a49110-9c1f-4692-98e3-f745d0ee2751';

-- 2. PLAYER STATS (Individual Player Breakdown)
SELECT 
  COALESCE(cp.name, u.name, 'Unknown') as player_name,
  COALESCE(cp.id::text, u.id::text, 'Unknown') as player_id,
  CASE WHEN cp.id IS NOT NULL THEN 'custom_player' ELSE 'registered_player' END as player_type,
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
   COUNT(CASE WHEN stat_type = 'free_throw' AND modifier = 'made' THEN 1 END)) as points,
  -- Field goal percentage
  CASE 
    WHEN COUNT(CASE WHEN stat_type = 'field_goal' THEN 1 END) > 0 
    THEN ROUND(
      COUNT(CASE WHEN stat_type = 'field_goal' AND modifier = 'made' THEN 1 END)::NUMERIC / 
      COUNT(CASE WHEN stat_type = 'field_goal' THEN 1 END)::NUMERIC * 100, 
      1
    )
    ELSE 0 
  END as fg_percentage,
  -- Three-point percentage
  CASE 
    WHEN COUNT(CASE WHEN stat_type = 'three_pointer' THEN 1 END) > 0 
    THEN ROUND(
      COUNT(CASE WHEN stat_type = 'three_pointer' AND modifier = 'made' THEN 1 END)::NUMERIC / 
      COUNT(CASE WHEN stat_type = 'three_pointer' THEN 1 END)::NUMERIC * 100, 
      1
    )
    ELSE 0 
  END as three_percentage,
  -- Free throw percentage
  CASE 
    WHEN COUNT(CASE WHEN stat_type = 'free_throw' THEN 1 END) > 0 
    THEN ROUND(
      COUNT(CASE WHEN stat_type = 'free_throw' AND modifier = 'made' THEN 1 END)::NUMERIC / 
      COUNT(CASE WHEN stat_type = 'free_throw' THEN 1 END)::NUMERIC * 100, 
      1
    )
    ELSE 0 
  END as ft_percentage
FROM game_stats gs
LEFT JOIN custom_players cp ON gs.custom_player_id = cp.id
LEFT JOIN users u ON gs.player_id = u.id
WHERE gs.game_id = 'f3a49110-9c1f-4692-98e3-f745d0ee2751'
  AND (gs.is_opponent_stat = false OR gs.is_opponent_stat IS NULL)
GROUP BY COALESCE(cp.name, u.name, 'Unknown'), COALESCE(cp.id, u.id), cp.id, u.id
ORDER BY points DESC, player_name;

-- 3. TEAM TOTALS
SELECT 
  'TEAM_TOTALS' as section,
  COUNT(CASE WHEN stat_type = 'field_goal' AND modifier = 'made' THEN 1 END) as fg_made,
  COUNT(CASE WHEN stat_type = 'field_goal' AND modifier = 'missed' THEN 1 END) as fg_missed,
  COUNT(CASE WHEN stat_type = 'field_goal' THEN 1 END) as fg_attempted,
  COUNT(CASE WHEN stat_type = 'three_pointer' AND modifier = 'made' THEN 1 END) as three_made,
  COUNT(CASE WHEN stat_type = 'three_pointer' AND modifier = 'missed' THEN 1 END) as three_missed,
  COUNT(CASE WHEN stat_type = 'three_pointer' THEN 1 END) as three_attempted,
  COUNT(CASE WHEN stat_type = 'free_throw' AND modifier = 'made' THEN 1 END) as ft_made,
  COUNT(CASE WHEN stat_type = 'free_throw' AND modifier = 'missed' THEN 1 END) as ft_missed,
  COUNT(CASE WHEN stat_type = 'free_throw' THEN 1 END) as ft_attempted,
  COUNT(CASE WHEN stat_type = 'rebound' THEN 1 END) as rebounds,
  COUNT(CASE WHEN stat_type = 'assist' THEN 1 END) as assists,
  COUNT(CASE WHEN stat_type = 'steal' THEN 1 END) as steals,
  COUNT(CASE WHEN stat_type = 'block' THEN 1 END) as blocks,
  COUNT(CASE WHEN stat_type = 'turnover' THEN 1 END) as turnovers,
  COUNT(CASE WHEN stat_type = 'foul' THEN 1 END) as fouls,
  -- Total points
  (COUNT(CASE WHEN stat_type = 'field_goal' AND modifier = 'made' THEN 1 END) * 2 +
   COUNT(CASE WHEN stat_type = 'three_pointer' AND modifier = 'made' THEN 1 END) * 3 +
   COUNT(CASE WHEN stat_type = 'free_throw' AND modifier = 'made' THEN 1 END)) as total_points,
  -- Shooting percentages
  CASE 
    WHEN COUNT(CASE WHEN stat_type = 'field_goal' THEN 1 END) > 0 
    THEN ROUND(
      COUNT(CASE WHEN stat_type = 'field_goal' AND modifier = 'made' THEN 1 END)::NUMERIC / 
      COUNT(CASE WHEN stat_type = 'field_goal' THEN 1 END)::NUMERIC * 100, 
      1
    )
    ELSE 0 
  END as fg_percentage,
  CASE 
    WHEN COUNT(CASE WHEN stat_type = 'three_pointer' THEN 1 END) > 0 
    THEN ROUND(
      COUNT(CASE WHEN stat_type = 'three_pointer' AND modifier = 'made' THEN 1 END)::NUMERIC / 
      COUNT(CASE WHEN stat_type = 'three_pointer' THEN 1 END)::NUMERIC * 100, 
      1
    )
    ELSE 0 
  END as three_percentage,
  CASE 
    WHEN COUNT(CASE WHEN stat_type = 'free_throw' THEN 1 END) > 0 
    THEN ROUND(
      COUNT(CASE WHEN stat_type = 'free_throw' AND modifier = 'made' THEN 1 END)::NUMERIC / 
      COUNT(CASE WHEN stat_type = 'free_throw' THEN 1 END)::NUMERIC * 100, 
      1
    )
    ELSE 0 
  END as ft_percentage,
  COUNT(*) as total_stat_events
FROM game_stats
WHERE game_id = 'f3a49110-9c1f-4692-98e3-f745d0ee2751'
  AND (is_opponent_stat = false OR is_opponent_stat IS NULL);

-- 4. QUARTER-BY-QUARTER BREAKDOWN
SELECT 
  quarter,
  COUNT(*) as total_events,
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
  -- Quarter points
  (SUM(CASE WHEN stat_type = 'field_goal' AND modifier = 'made' THEN 2 ELSE 0 END) +
   SUM(CASE WHEN stat_type = 'three_pointer' AND modifier = 'made' THEN 3 ELSE 0 END) +
   SUM(CASE WHEN stat_type = 'free_throw' AND modifier = 'made' THEN 1 ELSE 0 END)) as quarter_points
FROM game_stats
WHERE game_id = 'f3a49110-9c1f-4692-98e3-f745d0ee2751'
  AND (is_opponent_stat = false OR is_opponent_stat IS NULL)
GROUP BY quarter
ORDER BY quarter;

-- 5. SUBSTITUTIONS
SELECT 
  gs.id,
  gs.quarter,
  gs.game_clock_minutes,
  gs.game_clock_seconds,
  COALESCE(cp_out.name, u_out.name, 'Unknown') as player_out_name,
  COALESCE(cp_in.name, u_in.name, 'Unknown') as player_in_name,
  gs.created_at as substitution_time
FROM game_substitutions gs
LEFT JOIN custom_players cp_out ON gs.player_out_id = cp_out.id
LEFT JOIN users u_out ON gs.player_out_id = u_out.id
LEFT JOIN custom_players cp_in ON gs.player_in_id = cp_in.id
LEFT JOIN users u_in ON gs.player_in_id = u_in.id
WHERE gs.game_id = 'f3a49110-9c1f-4692-98e3-f745d0ee2751'
ORDER BY gs.quarter, gs.game_clock_minutes DESC, gs.game_clock_seconds DESC;

-- 6. RECENT STAT EVENTS (Last 20 events)
SELECT 
  gs.id,
  gs.quarter,
  gs.game_clock_minutes,
  gs.game_clock_seconds,
  gs.stat_type,
  gs.modifier,
  gs.stat_value,
  COALESCE(cp.name, u.name, 'Unknown') as player_name,
  gs.created_at
FROM game_stats gs
LEFT JOIN custom_players cp ON gs.custom_player_id = cp.id
LEFT JOIN users u ON gs.player_id = u.id
WHERE gs.game_id = 'f3a49110-9c1f-4692-98e3-f745d0ee2751'
  AND (gs.is_opponent_stat = false OR gs.is_opponent_stat IS NULL)
ORDER BY gs.created_at DESC
LIMIT 20;

-- 7. STAT BREAKDOWN BY TYPE
SELECT 
  stat_type,
  modifier,
  COUNT(*) as count,
  SUM(stat_value) as total_value
FROM game_stats
WHERE game_id = 'f3a49110-9c1f-4692-98e3-f745d0ee2751'
  AND (is_opponent_stat = false OR is_opponent_stat IS NULL)
GROUP BY stat_type, modifier
ORDER BY stat_type, modifier;

-- 8. GAME TIMELINE (All events in chronological order)
SELECT 
  gs.created_at,
  gs.quarter,
  LPAD(gs.game_clock_minutes::text, 2, '0') || ':' || LPAD(gs.game_clock_seconds::text, 2, '0') as game_time,
  gs.stat_type,
  gs.modifier,
  COALESCE(cp.name, u.name, 'Team') as player_name,
  gs.stat_value,
  CASE 
    WHEN gs.stat_type IN ('field_goal', 'three_pointer', 'free_throw') AND gs.modifier = 'made' 
    THEN CASE 
      WHEN gs.stat_type = 'three_pointer' THEN 3
      WHEN gs.stat_type = 'free_throw' THEN 1
      ELSE 2
    END
    ELSE 0
  END as points
FROM game_stats gs
LEFT JOIN custom_players cp ON gs.custom_player_id = cp.id
LEFT JOIN users u ON gs.player_id = u.id
WHERE gs.game_id = 'f3a49110-9c1f-4692-98e3-f745d0ee2751'
  AND (gs.is_opponent_stat = false OR gs.is_opponent_stat IS NULL)
ORDER BY gs.created_at ASC;

