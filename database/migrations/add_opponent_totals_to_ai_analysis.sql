-- ============================================================================
-- MIGRATION: Add opponent_totals to get_ai_analysis_data RPC
-- 
-- PURPOSE: Provide accurate opponent statistics for AI analysis
-- FIX: AI was hallucinating opponent rebounds (showed 30, actual 25)
-- 
-- Run this in Supabase SQL Editor
-- ============================================================================

DROP FUNCTION IF EXISTS get_ai_analysis_data(UUID);

CREATE OR REPLACE FUNCTION get_ai_analysis_data(p_game_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_result JSONB;
BEGIN
  WITH 
  -- =========================================================================
  -- STEP 1: BASE GAME DATA
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
  -- STEP 2: QUARTER-BY-QUARTER SCORING
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
  -- STEP 3: TEAM TOTALS (FOR WINNING FACTORS)
  -- =========================================================================
  team_stats AS (
    SELECT 
      gs.team_id,
      COUNT(*) FILTER (WHERE gs.stat_type = 'rebound') AS total_rebounds,
      COUNT(*) FILTER (WHERE gs.stat_type = 'steal') AS total_steals,
      COUNT(*) FILTER (WHERE gs.stat_type = 'block') AS total_blocks,
      COUNT(*) FILTER (WHERE gs.stat_type = 'turnover') AS total_turnovers,
      COUNT(*) FILTER (WHERE gs.stat_type = 'free_throw' AND gs.modifier = 'made') AS ft_made,
      COUNT(*) FILTER (WHERE gs.stat_type = 'free_throw') AS ft_attempted
    FROM game_stats gs
    CROSS JOIN game_base gb
    WHERE gs.game_id = p_game_id
      AND (gs.is_opponent_stat = FALSE OR gs.is_opponent_stat IS NULL)
      AND gs.team_id = gb.team_a_id
    GROUP BY gs.team_id
  ),

  -- =========================================================================
  -- STEP 3B: OPPONENT TOTALS (FOR AI ACCURACY)
  -- =========================================================================
  opponent_stats AS (
    SELECT 
      COUNT(*) FILTER (WHERE gs.stat_type = 'rebound') AS total_rebounds,
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
  -- STEP 4: PLAYER STATS WITH IMPACT SCORES
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
      -- Shooting stats
      COUNT(*) FILTER (WHERE gs.stat_type IN ('field_goal', 'two_pointer') AND gs.modifier = 'made') AS fg_made,
      COUNT(*) FILTER (WHERE gs.stat_type IN ('field_goal', 'two_pointer')) AS fg_attempted,
      COUNT(*) FILTER (WHERE gs.stat_type = 'three_pointer' AND gs.modifier = 'made') AS three_made,
      COUNT(*) FILTER (WHERE gs.stat_type = 'three_pointer') AS three_attempted,
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
      ROUND(
        (points * 1.0) + 
        (rebounds * 0.8) + 
        (assists * 0.7) + 
        (steals * 1.2) + 
        (blocks * 1.1) - 
        (turnovers * 1.0),
        1
      ) AS impact_score,
      CASE WHEN fg_attempted > 0 THEN ROUND((fg_made::numeric / fg_attempted) * 100, 1) ELSE 0 END AS fg_percentage,
      CASE WHEN three_attempted > 0 THEN ROUND((three_made::numeric / three_attempted) * 100, 1) ELSE 0 END AS three_percentage,
      CASE WHEN ft_attempted > 0 THEN ROUND((ft_made::numeric / ft_attempted) * 100, 1) ELSE 0 END AS ft_percentage,
      CASE WHEN (fg_attempted - three_attempted) > 0 
        THEN ROUND(((fg_made - three_made)::numeric / (fg_attempted - three_attempted)) * 100, 1) 
        ELSE 0 END AS two_percentage
    FROM player_stats_raw
  ),

  -- =========================================================================
  -- STEP 5: PLAYER QUARTER-BY-QUARTER POINTS
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
  -- STEP 6: TOTAL STATS COUNT (FOR HEADER)
  -- =========================================================================
  total_stats AS (
    SELECT COUNT(*) AS total_count
    FROM game_stats
    WHERE game_id = p_game_id
  )

  SELECT jsonb_build_object(
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
      END
    ) FROM team_stats),
    'opponent_totals',
    (SELECT jsonb_build_object(
      'points', COALESCE(total_points, 0),
      'rebounds', COALESCE(total_rebounds, 0),
      'assists', COALESCE(total_assists, 0),
      'steals', COALESCE(total_steals, 0),
      'blocks', COALESCE(total_blocks, 0),
      'turnovers', COALESCE(total_turnovers, 0),
      'fouls', COALESCE(total_fouls, 0),
      'fg_made', COALESCE(fg_made, 0),
      'fg_attempted', COALESCE(fg_attempted, 0),
      'fg_percentage', CASE 
        WHEN COALESCE(fg_attempted, 0) > 0 
        THEN ROUND((COALESCE(fg_made, 0)::numeric / fg_attempted) * 100, 1)
        ELSE 0
      END,
      'three_made', COALESCE(three_made, 0),
      'three_attempted', COALESCE(three_attempted, 0),
      'three_percentage', CASE 
        WHEN COALESCE(three_attempted, 0) > 0 
        THEN ROUND((COALESCE(three_made, 0)::numeric / three_attempted) * 100, 1)
        ELSE 0
      END,
      'ft_made', COALESCE(ft_made, 0),
      'ft_attempted', COALESCE(ft_attempted, 0),
      'ft_percentage', CASE 
        WHEN COALESCE(ft_attempted, 0) > 0 
        THEN ROUND((COALESCE(ft_made, 0)::numeric / ft_attempted) * 100, 1)
        ELSE 0
      END
    ) FROM opponent_stats),
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
          'fg_made', fg_made,
          'fg_attempted', fg_attempted,
          'fg_percentage', fg_percentage,
          'three_made', three_made,
          'three_attempted', three_attempted,
          'three_percentage', three_percentage,
          'ft_made', ft_made,
          'ft_attempted', ft_attempted,
          'ft_percentage', ft_percentage,
          'two_percentage', two_percentage
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
    ) pswi)
  ) INTO v_result
  FROM game_base gb
  CROSS JOIN total_stats ts
  WHERE gb.game_id = p_game_id;

  RETURN v_result;
END;
$$;

-- Verification query (run after deploying to test):
-- SELECT get_ai_analysis_data('0d1f2b04-e463-4ae9-b5fa-8a63c9bab491')::jsonb->'opponent_totals';
-- Expected: {"points": 42, "rebounds": 25, "assists": 7, "steals": 16, "blocks": 8, ...}
