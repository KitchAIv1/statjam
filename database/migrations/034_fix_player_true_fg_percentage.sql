-- =========================================================================
-- Migration 034: Fix Player True FG Percentage
-- =========================================================================
-- 
-- ISSUE: The player shooting stats show fg_percentage as 2PT only, but the
--        AI reports it as "FG%" which is misleading. Box scores show TOTAL
--        field goal percentage (2PT + 3PT combined).
--
-- EXAMPLE (Ward Jr):
--   - 2PT: 2/4 = 50% (what RPC returned)
--   - 3PT: 1/7 = 14.3%
--   - TOTAL FG: 3/11 = 27.3% (what box score shows)
--   - AI said "50% FG" which is WRONG
--
-- FIX: Add true_fg_made, true_fg_attempted, true_fg_percentage to player
--      shooting stats that combines 2PT and 3PT (standard box score FG%).
--
-- RUN THIS IN: Supabase SQL Editor
-- =========================================================================

CREATE OR REPLACE FUNCTION public.get_ai_analysis_data(p_game_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  WITH 
  -- =========================================================================
  -- STEP 1: BASE GAME DATA (UNCHANGED)
  -- =========================================================================
  game_base AS (
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
      CASE 
        WHEN g.home_score > g.away_score THEN g.team_a_id
        WHEN g.away_score > g.home_score THEN g.team_b_id
        ELSE NULL
      END AS winner_team_id,
      ABS(g.home_score - g.away_score) AS margin
    FROM games g
    LEFT JOIN teams t_a ON g.team_a_id = t_a.id
    LEFT JOIN teams t_b ON g.team_b_id = t_b.id
    WHERE g.id = p_game_id
  ),

  -- =========================================================================
  -- STEP 2: QUARTER-BY-QUARTER SCORING (UNCHANGED)
  -- =========================================================================
  quarter_scoring AS (
    SELECT 
      gs.quarter,
      gs.team_id,
      SUM(CASE 
        WHEN gs.stat_type IN ('field_goal', 'two_pointer') AND gs.modifier = 'made' THEN 2
        WHEN gs.stat_type = 'three_pointer' AND gs.modifier = 'made' THEN 3
        WHEN gs.stat_type = 'free_throw' AND gs.modifier = 'made' THEN 1
        ELSE 0
      END) AS quarter_points
    FROM game_stats gs
    CROSS JOIN game_base gb
    WHERE gs.game_id = p_game_id
      AND (gs.is_opponent_stat = FALSE OR gs.is_opponent_stat IS NULL)
      AND gs.team_id = gb.team_a_id
    GROUP BY gs.quarter, gs.team_id
    
    UNION ALL
    
    SELECT 
      gs.quarter,
      gb.team_b_id AS team_id,
      SUM(CASE 
        WHEN gs.stat_type IN ('field_goal', 'two_pointer') AND gs.modifier = 'made' THEN 2
        WHEN gs.stat_type = 'three_pointer' AND gs.modifier = 'made' THEN 3
        WHEN gs.stat_type = 'free_throw' AND gs.modifier = 'made' THEN 1
        ELSE 0
      END) AS quarter_points
    FROM game_stats gs
    CROSS JOIN game_base gb
    WHERE gs.game_id = p_game_id
      AND ((gs.is_opponent_stat = TRUE AND gb.is_coach_game = TRUE) OR 
           (gs.is_opponent_stat = FALSE AND gs.team_id = gb.team_b_id AND gb.is_coach_game = FALSE))
    GROUP BY gs.quarter, gb.team_b_id
  ),

  quarter_by_team AS (
    SELECT 
      qs.quarter,
      qs.team_id,
      COALESCE(SUM(qs.quarter_points), 0) AS points
    FROM quarter_scoring qs
    GROUP BY qs.quarter, qs.team_id
  ),

  quarter_summary AS (
    SELECT 
      COALESCE(q1.quarter, q2.quarter) AS quarter,
      COALESCE(q1.points, 0) AS team_a_points,
      COALESCE(q2.points, 0) AS team_b_points,
      COALESCE(q1.points, 0) - COALESCE(q2.points, 0) AS margin
    FROM (SELECT quarter, points FROM quarter_by_team qbt, game_base gb WHERE qbt.team_id = gb.team_a_id) q1
    FULL OUTER JOIN (SELECT quarter, points FROM quarter_by_team qbt, game_base gb WHERE qbt.team_id = gb.team_b_id) q2
      ON q1.quarter = q2.quarter
    ORDER BY quarter
  ),

  -- =========================================================================
  -- STEP 3: TEAM TOTALS - ENHANCED (Added missing fields)
  -- =========================================================================
  team_stats AS (
    SELECT 
      gs.team_id,
      -- EXISTING fields
      COUNT(*) FILTER (WHERE gs.stat_type = 'rebound') AS total_rebounds,
      COUNT(*) FILTER (WHERE gs.stat_type = 'steal') AS total_steals,
      COUNT(*) FILTER (WHERE gs.stat_type = 'block') AS total_blocks,
      COUNT(*) FILTER (WHERE gs.stat_type = 'turnover') AS total_turnovers,
      COUNT(*) FILTER (WHERE gs.stat_type = 'free_throw' AND gs.modifier = 'made') AS ft_made,
      COUNT(*) FILTER (WHERE gs.stat_type = 'free_throw') AS ft_attempted,
      -- NEW fields (to match opponent_totals)
      COUNT(*) FILTER (WHERE gs.stat_type = 'assist') AS total_assists,
      COUNT(*) FILTER (WHERE gs.stat_type IN ('foul', 'personal_foul')) AS total_fouls,
      COUNT(*) FILTER (WHERE gs.stat_type = 'rebound' AND gs.modifier = 'offensive') AS offensive_rebounds,
      COUNT(*) FILTER (WHERE gs.stat_type = 'rebound' AND gs.modifier = 'defensive') AS defensive_rebounds,
      -- Shooting stats - 2PT only
      COUNT(*) FILTER (WHERE gs.stat_type IN ('field_goal', 'two_pointer') AND gs.modifier = 'made') AS two_pt_made,
      COUNT(*) FILTER (WHERE gs.stat_type IN ('field_goal', 'two_pointer')) AS two_pt_attempted,
      -- Shooting stats - 3PT only
      COUNT(*) FILTER (WHERE gs.stat_type = 'three_pointer' AND gs.modifier = 'made') AS three_made,
      COUNT(*) FILTER (WHERE gs.stat_type = 'three_pointer') AS three_attempted,
      -- Points calculation
      SUM(CASE 
        WHEN gs.stat_type IN ('field_goal', 'two_pointer') AND gs.modifier = 'made' THEN 2
        WHEN gs.stat_type = 'three_pointer' AND gs.modifier = 'made' THEN 3
        WHEN gs.stat_type = 'free_throw' AND gs.modifier = 'made' THEN 1
        ELSE 0
      END) AS total_points
    FROM game_stats gs
    CROSS JOIN game_base gb
    WHERE gs.game_id = p_game_id
      AND (gs.is_opponent_stat = FALSE OR gs.is_opponent_stat IS NULL)
      AND gs.team_id = gb.team_a_id
    GROUP BY gs.team_id
  ),

  -- =========================================================================
  -- STEP 3B: OPPONENT TOTALS (UNCHANGED - already complete)
  -- =========================================================================
  opponent_stats AS (
    SELECT 
      COUNT(*) FILTER (WHERE gs.stat_type = 'rebound') AS total_rebounds,
      COUNT(*) FILTER (WHERE gs.stat_type = 'rebound' AND gs.modifier = 'offensive') AS offensive_rebounds,
      COUNT(*) FILTER (WHERE gs.stat_type = 'rebound' AND gs.modifier = 'defensive') AS defensive_rebounds,
      COUNT(*) FILTER (WHERE gs.stat_type = 'steal') AS total_steals,
      COUNT(*) FILTER (WHERE gs.stat_type = 'block') AS total_blocks,
      COUNT(*) FILTER (WHERE gs.stat_type = 'turnover') AS total_turnovers,
      COUNT(*) FILTER (WHERE gs.stat_type = 'assist') AS total_assists,
      COUNT(*) FILTER (WHERE gs.stat_type IN ('foul', 'personal_foul')) AS total_fouls,
      COUNT(*) FILTER (WHERE gs.stat_type = 'free_throw' AND gs.modifier = 'made') AS ft_made,
      COUNT(*) FILTER (WHERE gs.stat_type = 'free_throw') AS ft_attempted,
      COUNT(*) FILTER (WHERE gs.stat_type IN ('field_goal', 'two_pointer') AND gs.modifier = 'made') AS fg_made,
      COUNT(*) FILTER (WHERE gs.stat_type IN ('field_goal', 'two_pointer')) AS fg_attempted,
      COUNT(*) FILTER (WHERE gs.stat_type = 'three_pointer' AND gs.modifier = 'made') AS three_made,
      COUNT(*) FILTER (WHERE gs.stat_type = 'three_pointer') AS three_attempted,
      SUM(CASE 
        WHEN gs.stat_type IN ('field_goal', 'two_pointer') AND gs.modifier = 'made' THEN 2
        WHEN gs.stat_type = 'three_pointer' AND gs.modifier = 'made' THEN 3
        WHEN gs.stat_type = 'free_throw' AND gs.modifier = 'made' THEN 1
        ELSE 0
      END) AS total_points
    FROM game_stats gs
    CROSS JOIN game_base gb
    WHERE gs.game_id = p_game_id
      AND ((gs.is_opponent_stat = TRUE AND gb.is_coach_game = TRUE) OR 
           (gs.is_opponent_stat = FALSE AND gs.team_id = gb.team_b_id AND gb.is_coach_game = FALSE))
  ),

  -- =========================================================================
  -- STEP 4: PLAYER STATS WITH IMPACT SCORES (FIXED - true FG%)
  -- =========================================================================
  player_stats_raw AS (
    SELECT 
      COALESCE(gs.player_id::text, gs.custom_player_id::text) AS player_id,
      COALESCE(u.name, cp.name) AS player_name,
      COALESCE(cp.jersey_number, 0) AS jersey_number,
      gs.team_id,
      -- Basic stats
      SUM(CASE WHEN gs.stat_type IN ('field_goal', 'two_pointer') AND gs.modifier = 'made' THEN 2
               WHEN gs.stat_type = 'three_pointer' AND gs.modifier = 'made' THEN 3
               WHEN gs.stat_type = 'free_throw' AND gs.modifier = 'made' THEN 1
               ELSE 0 END) AS points,
      COUNT(*) FILTER (WHERE gs.stat_type = 'rebound') AS rebounds,
      COUNT(*) FILTER (WHERE gs.stat_type = 'assist') AS assists,
      COUNT(*) FILTER (WHERE gs.stat_type = 'steal') AS steals,
      COUNT(*) FILTER (WHERE gs.stat_type = 'block') AS blocks,
      COUNT(*) FILTER (WHERE gs.stat_type = 'turnover') AS turnovers,
      COUNT(*) FILTER (WHERE gs.stat_type IN ('foul', 'personal_foul')) AS fouls,
      -- 2PT shooting stats (labeled clearly)
      COUNT(*) FILTER (WHERE gs.stat_type IN ('field_goal', 'two_pointer') AND gs.modifier = 'made') AS two_pt_made,
      COUNT(*) FILTER (WHERE gs.stat_type IN ('field_goal', 'two_pointer')) AS two_pt_attempted,
      -- 3PT shooting stats
      COUNT(*) FILTER (WHERE gs.stat_type = 'three_pointer' AND gs.modifier = 'made') AS three_made,
      COUNT(*) FILTER (WHERE gs.stat_type = 'three_pointer') AS three_attempted,
      -- FT shooting stats
      COUNT(*) FILTER (WHERE gs.stat_type = 'free_throw' AND gs.modifier = 'made') AS ft_made,
      COUNT(*) FILTER (WHERE gs.stat_type = 'free_throw') AS ft_attempted
    FROM game_stats gs
    CROSS JOIN game_base gb
    LEFT JOIN users u ON gs.player_id = u.id
    LEFT JOIN custom_players cp ON gs.custom_player_id = cp.id
    WHERE gs.game_id = p_game_id
      AND (gs.is_opponent_stat = FALSE OR gs.is_opponent_stat IS NULL)
      AND gs.team_id = gb.team_a_id
      AND (gs.player_id IS NOT NULL OR gs.custom_player_id IS NOT NULL)
    GROUP BY COALESCE(gs.player_id::text, gs.custom_player_id::text), 
             COALESCE(u.name, cp.name), 
             COALESCE(cp.jersey_number, 0), 
             gs.team_id
  ),

  player_stats_with_impact AS (
    SELECT 
      *,
      -- Impact score calculation
      ROUND(
        (points * 1.0) + 
        (rebounds * 0.8) + 
        (assists * 0.7) + 
        (steals * 1.2) + 
        (blocks * 1.1) - 
        (turnovers * 1.0),
        1
      ) AS impact_score,
      -- ✅ TRUE FG% (2PT + 3PT combined) - THIS IS WHAT BOX SCORES SHOW
      (two_pt_made + three_made) AS true_fg_made,
      (two_pt_attempted + three_attempted) AS true_fg_attempted,
      CASE WHEN (two_pt_attempted + three_attempted) > 0 
        THEN ROUND(((two_pt_made + three_made)::numeric / (two_pt_attempted + three_attempted)) * 100, 1) 
        ELSE 0 END AS true_fg_percentage,
      -- 2PT percentage (labeled clearly)
      CASE WHEN two_pt_attempted > 0 
        THEN ROUND((two_pt_made::numeric / two_pt_attempted) * 100, 1) 
        ELSE 0 END AS two_pt_percentage,
      -- 3PT percentage
      CASE WHEN three_attempted > 0 
        THEN ROUND((three_made::numeric / three_attempted) * 100, 1) 
        ELSE 0 END AS three_percentage,
      -- FT percentage
      CASE WHEN ft_attempted > 0 
        THEN ROUND((ft_made::numeric / ft_attempted) * 100, 1) 
        ELSE 0 END AS ft_percentage,
      -- Player rank by impact
      ROW_NUMBER() OVER (ORDER BY 
        (points * 1.0) + (rebounds * 0.8) + (assists * 0.7) + (steals * 1.2) + (blocks * 1.1) - (turnovers * 1.0)
        DESC
      ) AS player_rank
    FROM player_stats_raw
  ),

  -- =========================================================================
  -- STEP 5: PLAYER QUARTER-BY-QUARTER POINTS (UNCHANGED)
  -- =========================================================================
  player_quarter_points AS (
    SELECT 
      COALESCE(gs.player_id::text, gs.custom_player_id::text) AS player_id,
      gs.quarter,
      SUM(CASE 
        WHEN gs.stat_type IN ('field_goal', 'two_pointer') AND gs.modifier = 'made' THEN 2
        WHEN gs.stat_type = 'three_pointer' AND gs.modifier = 'made' THEN 3
        WHEN gs.stat_type = 'free_throw' AND gs.modifier = 'made' THEN 1
        ELSE 0
      END) AS quarter_points
    FROM game_stats gs
    CROSS JOIN game_base gb
    WHERE gs.game_id = p_game_id
      AND (gs.is_opponent_stat = FALSE OR gs.is_opponent_stat IS NULL)
      AND gs.team_id = gb.team_a_id
      AND (gs.player_id IS NOT NULL OR gs.custom_player_id IS NOT NULL)
    GROUP BY COALESCE(gs.player_id::text, gs.custom_player_id::text), gs.quarter
  ),

  -- =========================================================================
  -- STEP 6: TOTAL STATS COUNT (UNCHANGED)
  -- =========================================================================
  total_stats AS (
    SELECT COUNT(*) AS total_count
    FROM game_stats
    WHERE game_id = p_game_id
  )

  SELECT jsonb_build_object(
    -- =====================================================================
    -- EXISTING OBJECTS (UNCHANGED STRUCTURE)
    -- =====================================================================
    'game',
    jsonb_build_object(
      'id', gb.game_id,
      'team_a', jsonb_build_object('id', gb.team_a_id, 'name', gb.team_a_name),
      'team_b', jsonb_build_object('id', gb.team_b_id, 'name', gb.team_b_name),
      'home_score', gb.home_score,
      'away_score', gb.away_score,
      'margin', gb.margin,
      'winner_team_id', gb.winner_team_id,
      'is_coach_game', gb.is_coach_game,
      'total_stats', ts.total_count
    ),
    'quarters',
    (SELECT jsonb_agg(
      jsonb_build_object(
        'quarter', quarter,
        'team_points', team_a_points,
        'opp_points', team_b_points,
        'margin', margin
      ) ORDER BY quarter
    ) FROM quarter_summary),
    
    -- =====================================================================
    -- TEAM_TOTALS - ENHANCED with TRUE FG%
    -- =====================================================================
    'team_totals',
    (SELECT jsonb_build_object(
      'rebounds', COALESCE(SUM(total_rebounds), 0),
      'steals', COALESCE(SUM(total_steals), 0),
      'blocks', COALESCE(SUM(total_blocks), 0),
      'turnovers', COALESCE(SUM(total_turnovers), 0),
      'ft_made', COALESCE(SUM(ft_made), 0),
      'ft_attempted', COALESCE(SUM(ft_attempted), 0),
      'ft_percentage', CASE 
        WHEN COALESCE(SUM(ft_attempted), 0) > 0 
        THEN ROUND((COALESCE(SUM(ft_made), 0)::numeric / SUM(ft_attempted)) * 100, 1)
        ELSE 0
      END,
      'points', COALESCE(SUM(total_points), 0),
      'assists', COALESCE(SUM(total_assists), 0),
      'fouls', COALESCE(SUM(total_fouls), 0),
      'offensive_rebounds', COALESCE(SUM(offensive_rebounds), 0),
      'defensive_rebounds', COALESCE(SUM(defensive_rebounds), 0),
      -- 2PT stats (labeled clearly)
      'two_pt_made', COALESCE(SUM(two_pt_made), 0),
      'two_pt_attempted', COALESCE(SUM(two_pt_attempted), 0),
      'two_pt_percentage', CASE 
        WHEN COALESCE(SUM(two_pt_attempted), 0) > 0 
        THEN ROUND((COALESCE(SUM(two_pt_made), 0)::numeric / SUM(two_pt_attempted)) * 100, 1)
        ELSE 0
      END,
      -- 3PT stats
      'three_made', COALESCE(SUM(three_made), 0),
      'three_attempted', COALESCE(SUM(three_attempted), 0),
      'three_percentage', CASE 
        WHEN COALESCE(SUM(three_attempted), 0) > 0 
        THEN ROUND((COALESCE(SUM(three_made), 0)::numeric / SUM(three_attempted)) * 100, 1)
        ELSE 0
      END,
      -- ✅ TRUE FG% (2PT + 3PT combined) - STANDARD BOX SCORE FG%
      'true_fg_made', COALESCE(SUM(two_pt_made), 0) + COALESCE(SUM(three_made), 0),
      'true_fg_attempted', COALESCE(SUM(two_pt_attempted), 0) + COALESCE(SUM(three_attempted), 0),
      'true_fg_percentage', CASE 
        WHEN (COALESCE(SUM(two_pt_attempted), 0) + COALESCE(SUM(three_attempted), 0)) > 0 
        THEN ROUND(((COALESCE(SUM(two_pt_made), 0) + COALESCE(SUM(three_made), 0))::numeric / 
          (SUM(two_pt_attempted) + SUM(three_attempted))) * 100, 1)
        ELSE 0
      END
    ) FROM team_stats),
    
    -- =====================================================================
    -- OPPONENT_TOTALS - ENHANCED with TRUE FG%
    -- =====================================================================
    'opponent_totals',
    (SELECT jsonb_build_object(
      'points', COALESCE(total_points, 0),
      'rebounds', COALESCE(total_rebounds, 0),
      'offensive_rebounds', COALESCE(offensive_rebounds, 0),
      'defensive_rebounds', COALESCE(defensive_rebounds, 0),
      'assists', COALESCE(total_assists, 0),
      'steals', COALESCE(total_steals, 0),
      'blocks', COALESCE(total_blocks, 0),
      'turnovers', COALESCE(total_turnovers, 0),
      'fouls', COALESCE(total_fouls, 0),
      -- 2PT stats
      'two_pt_made', COALESCE(fg_made, 0),
      'two_pt_attempted', COALESCE(fg_attempted, 0),
      'two_pt_percentage', CASE 
        WHEN COALESCE(fg_attempted, 0) > 0 
        THEN ROUND((COALESCE(fg_made, 0)::numeric / fg_attempted) * 100, 1)
        ELSE 0
      END,
      -- 3PT stats
      'three_made', COALESCE(three_made, 0),
      'three_attempted', COALESCE(three_attempted, 0),
      'three_percentage', CASE 
        WHEN COALESCE(three_attempted, 0) > 0 
        THEN ROUND((COALESCE(three_made, 0)::numeric / three_attempted) * 100, 1)
        ELSE 0
      END,
      -- ✅ TRUE FG% (2PT + 3PT combined)
      'true_fg_made', COALESCE(fg_made, 0) + COALESCE(three_made, 0),
      'true_fg_attempted', COALESCE(fg_attempted, 0) + COALESCE(three_attempted, 0),
      'true_fg_percentage', CASE 
        WHEN (COALESCE(fg_attempted, 0) + COALESCE(three_attempted, 0)) > 0 
        THEN ROUND(((COALESCE(fg_made, 0) + COALESCE(three_made, 0))::numeric / 
          (fg_attempted + three_attempted)) * 100, 1)
        ELSE 0
      END,
      -- FT stats
      'ft_made', COALESCE(ft_made, 0),
      'ft_attempted', COALESCE(ft_attempted, 0),
      'ft_percentage', CASE 
        WHEN COALESCE(ft_attempted, 0) > 0 
        THEN ROUND((COALESCE(ft_made, 0)::numeric / ft_attempted) * 100, 1)
        ELSE 0
      END
    ) FROM opponent_stats),
    
    -- =====================================================================
    -- PLAYERS - TOP 4 (FIXED - now includes true FG%)
    -- =====================================================================
    'players',
    (SELECT jsonb_agg(
      jsonb_build_object(
        'player_id', player_id,
        'name', player_name,
        'jersey_number', jersey_number,
        'points', points,
        'rebounds', rebounds,
        'assists', assists,
        'steals', steals,
        'blocks', blocks,
        'turnovers', turnovers,
        'fouls', fouls,
        'impact_score', impact_score,
        'shooting', jsonb_build_object(
          -- ✅ TRUE FG% (what box scores show) - USE THIS FOR "FG%"
          'fg_made', true_fg_made,
          'fg_attempted', true_fg_attempted,
          'fg_percentage', true_fg_percentage,
          -- 2PT stats (labeled clearly)
          'two_pt_made', two_pt_made,
          'two_pt_attempted', two_pt_attempted,
          'two_pt_percentage', two_pt_percentage,
          -- 3PT stats
          'three_made', three_made,
          'three_attempted', three_attempted,
          'three_percentage', three_percentage,
          -- FT stats
          'ft_made', ft_made,
          'ft_attempted', ft_attempted,
          'ft_percentage', ft_percentage
        ),
        'quarter_points', (
          SELECT jsonb_object_agg(quarter::text, quarter_points)
          FROM player_quarter_points pqp
          WHERE pqp.player_id = pswi.player_id
        )
      )
    ) FROM (
      SELECT * FROM player_stats_with_impact 
      ORDER BY impact_score DESC 
      LIMIT 4
    ) pswi),
    
    -- =====================================================================
    -- BENCH PLAYERS (FIXED - now includes true FG%)
    -- =====================================================================
    'bench_players',
    (SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'player_id', player_id,
        'name', player_name,
        'jersey_number', jersey_number,
        'points', points,
        'rebounds', rebounds,
        'assists', assists,
        'turnovers', turnovers,
        'impact_score', impact_score,
        'shooting', jsonb_build_object(
          'fg_made', true_fg_made,
          'fg_attempted', true_fg_attempted,
          'fg_percentage', true_fg_percentage,
          'three_made', three_made,
          'three_attempted', three_attempted,
          'three_percentage', three_percentage
        )
      )
    ), '[]'::jsonb) FROM (
      SELECT * FROM player_stats_with_impact 
      ORDER BY impact_score DESC 
      OFFSET 4
    ) bench),
    
    -- =====================================================================
    -- SHOOTING COMPARISON (UNCHANGED - already uses true FG%)
    -- =====================================================================
    'shooting_comparison',
    (SELECT jsonb_build_object(
      'team_three_made', COALESCE(ts.three_made, 0),
      'team_three_attempted', COALESCE(ts.three_attempted, 0),
      'team_three_pct', CASE WHEN COALESCE(ts.three_attempted, 0) > 0 
        THEN ROUND((COALESCE(ts.three_made, 0)::numeric / ts.three_attempted) * 100, 1) ELSE 0 END,
      'opp_three_made', COALESCE(os.three_made, 0),
      'opp_three_attempted', COALESCE(os.three_attempted, 0),
      'opp_three_pct', CASE WHEN COALESCE(os.three_attempted, 0) > 0 
        THEN ROUND((COALESCE(os.three_made, 0)::numeric / os.three_attempted) * 100, 1) ELSE 0 END,
      'three_point_differential', (COALESCE(ts.three_made, 0) * 3) - (COALESCE(os.three_made, 0) * 3),
      'three_made_differential', COALESCE(ts.three_made, 0) - COALESCE(os.three_made, 0),
      -- True FG% (all field goals including 3PT)
      'team_true_fg_made', COALESCE(ts.two_pt_made, 0) + COALESCE(ts.three_made, 0),
      'team_true_fg_attempted', COALESCE(ts.two_pt_attempted, 0) + COALESCE(ts.three_attempted, 0),
      'team_true_fg_pct', CASE WHEN (COALESCE(ts.two_pt_attempted, 0) + COALESCE(ts.three_attempted, 0)) > 0 
        THEN ROUND(((COALESCE(ts.two_pt_made, 0) + COALESCE(ts.three_made, 0))::numeric / 
          (ts.two_pt_attempted + ts.three_attempted)) * 100, 1) ELSE 0 END,
      'opp_true_fg_made', COALESCE(os.fg_made, 0) + COALESCE(os.three_made, 0),
      'opp_true_fg_attempted', COALESCE(os.fg_attempted, 0) + COALESCE(os.three_attempted, 0),
      'opp_true_fg_pct', CASE WHEN (COALESCE(os.fg_attempted, 0) + COALESCE(os.three_attempted, 0)) > 0 
        THEN ROUND(((COALESCE(os.fg_made, 0) + COALESCE(os.three_made, 0))::numeric / 
          (os.fg_attempted + os.three_attempted)) * 100, 1) ELSE 0 END
    ) FROM team_stats ts, opponent_stats os),
    
    -- =====================================================================
    -- EFFICIENCY METRICS (UNCHANGED)
    -- =====================================================================
    'efficiency_metrics',
    (SELECT jsonb_build_object(
      'team_assists', COALESCE(ts.total_assists, 0),
      'team_turnovers', COALESCE(ts.total_turnovers, 0),
      'team_ast_to_ratio', CASE WHEN COALESCE(ts.total_turnovers, 0) > 0 
        THEN ROUND(COALESCE(ts.total_assists, 0)::numeric / ts.total_turnovers, 2) ELSE 0 END,
      'opp_assists', COALESCE(os.total_assists, 0),
      'opp_turnovers', COALESCE(os.total_turnovers, 0),
      'opp_ast_to_ratio', CASE WHEN COALESCE(os.total_turnovers, 0) > 0 
        THEN ROUND(COALESCE(os.total_assists, 0)::numeric / os.total_turnovers, 2) ELSE 0 END,
      'team_steals', COALESCE(ts.total_steals, 0),
      'opp_steals', COALESCE(os.total_steals, 0),
      'steals_caused_turnovers_pct', CASE WHEN COALESCE(ts.total_turnovers, 0) > 0 
        THEN ROUND((COALESCE(os.total_steals, 0)::numeric / ts.total_turnovers) * 100, 1) ELSE 0 END,
      'steals_forced_turnovers_pct', CASE WHEN COALESCE(os.total_turnovers, 0) > 0 
        THEN ROUND((COALESCE(ts.total_steals, 0)::numeric / os.total_turnovers) * 100, 1) ELSE 0 END,
      'rebound_differential', COALESCE(ts.total_rebounds, 0) - COALESCE(os.total_rebounds, 0),
      'offensive_rebound_differential', COALESCE(ts.offensive_rebounds, 0) - COALESCE(os.offensive_rebounds, 0),
      'defensive_rebound_differential', COALESCE(ts.defensive_rebounds, 0) - COALESCE(os.defensive_rebounds, 0)
    ) FROM team_stats ts, opponent_stats os)
    
  ) INTO v_result
  FROM game_base gb
  CROSS JOIN total_stats ts
  WHERE gb.game_id = p_game_id;

  RETURN v_result;
END;
$function$;

-- =========================================================================
-- VERIFICATION: Test the function with Ward Jr's stats
-- Expected for Ward Jr: 
--   - true_fg_made: 3 (2 two-pointers + 1 three-pointer)
--   - true_fg_attempted: 11 (4 two-pointers + 7 three-pointers)
--   - true_fg_percentage: 27.3% (3/11)
-- =========================================================================
-- After running the above, test with:
-- SELECT get_ai_analysis_data('b7f9757a-4205-4784-ade4-296e2817d55a');
