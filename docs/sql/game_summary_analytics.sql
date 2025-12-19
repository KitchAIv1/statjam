-- ============================================================================
-- GAME SUMMARY ANALYTICS SQL LAYER
-- ============================================================================
-- Version: 1.0.0
-- Date: December 18, 2025
-- Purpose: Generate deterministic, structured game summary data for LLM consumption
-- 
-- USAGE:
--   SELECT * FROM get_game_summary_analytics('game_id_here');
--
-- OUTPUT: Single JSONB object containing:
--   - final_score, winner, game_type
--   - top_factors (max 3)
--   - key_players (max 3)
--   - momentum (1 event)
--   - opponent_note (1 note)
-- ============================================================================

-- ============================================================================
-- MAIN FUNCTION: get_game_summary_analytics
-- ============================================================================
-- Drop existing function to ensure clean replacement
DROP FUNCTION IF EXISTS get_game_summary_analytics(UUID);

CREATE OR REPLACE FUNCTION get_game_summary_analytics(p_game_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Execute the complete analytics query and return structured JSON
  WITH 
  -- =========================================================================
  -- STEP 1: BASE GAME DATA
  -- Fetch core game information and determine winner
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
      g.quarter_length_minutes,
      ABS(g.home_score - g.away_score) AS score_diff,
      CASE 
        WHEN g.home_score > g.away_score THEN g.team_a_id
        WHEN g.away_score > g.home_score THEN g.team_b_id
        ELSE NULL -- Tie
      END AS winner_team_id,
      CASE 
        WHEN g.home_score > g.away_score THEN 'home'
        WHEN g.away_score > g.home_score THEN 'away'
        ELSE 'tie'
      END AS winner_side,
      -- Team names (with coach mode fallback)
      t_a.name AS team_a_name,
      CASE 
        WHEN g.is_coach_game THEN COALESCE(g.opponent_name, 'Opponent')
        ELSE t_b.name
      END AS team_b_name
    FROM games g
    LEFT JOIN teams t_a ON g.team_a_id = t_a.id
    LEFT JOIN teams t_b ON g.team_b_id = t_b.id
    WHERE g.id = p_game_id
  ),

  -- =========================================================================
  -- STEP 2: GAME TYPE CLASSIFICATION
  -- Classify game based on final margin
  -- =========================================================================
  game_type AS (
    SELECT 
      game_id,
      score_diff,
      CASE 
        WHEN score_diff >= 15 THEN 'Dominant'
        WHEN score_diff >= 8 THEN 'Controlled'
        WHEN score_diff >= 4 THEN 'Competitive'
        ELSE 'Tight'
      END AS classification,
      CASE 
        WHEN score_diff >= 15 THEN 'One team controlled the game throughout'
        WHEN score_diff >= 8 THEN 'Winner maintained steady control'
        WHEN score_diff >= 4 THEN 'Both teams battled closely'
        ELSE 'Game decided in the final moments'
      END AS narrative_hint
    FROM game_base
  ),

  -- =========================================================================
  -- STEP 3: TEAM STAT AGGREGATION
  -- Aggregate all stats by team for differential calculation
  -- =========================================================================
  team_stats_raw AS (
    SELECT 
      gs.team_id,
      -- Shooting stats
      COUNT(*) FILTER (WHERE gs.stat_type IN ('field_goal', 'two_pointer') AND gs.modifier = 'made') AS fg_made,
      COUNT(*) FILTER (WHERE gs.stat_type IN ('field_goal', 'two_pointer')) AS fg_attempted,
      COUNT(*) FILTER (WHERE gs.stat_type IN ('three_pointer', '3_pointer') AND gs.modifier = 'made') AS three_made,
      COUNT(*) FILTER (WHERE gs.stat_type IN ('three_pointer', '3_pointer')) AS three_attempted,
      COUNT(*) FILTER (WHERE gs.stat_type = 'free_throw' AND gs.modifier = 'made') AS ft_made,
      COUNT(*) FILTER (WHERE gs.stat_type = 'free_throw') AS ft_attempted,
      -- Other stats
      COUNT(*) FILTER (WHERE gs.stat_type = 'rebound') AS total_rebounds,
      COUNT(*) FILTER (WHERE gs.stat_type = 'rebound' AND gs.modifier = 'offensive') AS offensive_rebounds,
      COUNT(*) FILTER (WHERE gs.stat_type = 'rebound' AND gs.modifier = 'defensive') AS defensive_rebounds,
      COUNT(*) FILTER (WHERE gs.stat_type = 'assist') AS assists,
      COUNT(*) FILTER (WHERE gs.stat_type = 'steal') AS steals,
      COUNT(*) FILTER (WHERE gs.stat_type = 'block') AS blocks,
      COUNT(*) FILTER (WHERE gs.stat_type = 'turnover') AS turnovers,
      COUNT(*) FILTER (WHERE gs.stat_type = 'foul') AS fouls,
      -- Points scored
      SUM(CASE 
        WHEN gs.modifier = 'made' THEN COALESCE(gs.stat_value, 0)
        ELSE 0
      END) AS points_scored
    FROM game_stats gs
    WHERE gs.game_id = p_game_id
      AND gs.is_opponent_stat = FALSE
    GROUP BY gs.team_id
  ),

  -- =========================================================================
  -- STEP 4: TEAM STAT DIFFERENTIALS
  -- Calculate differences between winner and opponent
  -- =========================================================================
  team_diffs AS (
    SELECT 
      gb.winner_team_id,
      gb.winner_side,
      -- Winner stats
      COALESCE(w.total_rebounds, 0) AS winner_rebounds,
      COALESCE(w.offensive_rebounds, 0) AS winner_off_rebounds,
      COALESCE(w.defensive_rebounds, 0) AS winner_def_rebounds,
      COALESCE(w.steals, 0) AS winner_steals,
      COALESCE(w.blocks, 0) AS winner_blocks,
      COALESCE(w.assists, 0) AS winner_assists,
      COALESCE(w.turnovers, 0) AS winner_turnovers,
      COALESCE(w.ft_attempted, 0) AS winner_ft_attempts,
      CASE WHEN COALESCE(w.fg_attempted, 0) > 0 
        THEN ROUND(100.0 * w.fg_made / w.fg_attempted, 1) 
        ELSE 0 
      END AS winner_fg_pct,
      -- Opponent stats
      COALESCE(o.total_rebounds, 0) AS opp_rebounds,
      COALESCE(o.offensive_rebounds, 0) AS opp_off_rebounds,
      COALESCE(o.defensive_rebounds, 0) AS opp_def_rebounds,
      COALESCE(o.steals, 0) AS opp_steals,
      COALESCE(o.blocks, 0) AS opp_blocks,
      COALESCE(o.assists, 0) AS opp_assists,
      COALESCE(o.turnovers, 0) AS opp_turnovers,
      COALESCE(o.ft_attempted, 0) AS opp_ft_attempts,
      CASE WHEN COALESCE(o.fg_attempted, 0) > 0 
        THEN ROUND(100.0 * o.fg_made / o.fg_attempted, 1) 
        ELSE 0 
      END AS opp_fg_pct,
      -- Differentials
      COALESCE(w.total_rebounds, 0) - COALESCE(o.total_rebounds, 0) AS rebound_diff,
      COALESCE(w.offensive_rebounds, 0) - COALESCE(o.offensive_rebounds, 0) AS off_rebound_diff,
      COALESCE(o.turnovers, 0) AS turnovers_forced, -- Opponent turnovers = our forced TOs
      COALESCE(w.steals, 0) + COALESCE(w.blocks, 0) AS winner_steals_blocks,
      COALESCE(w.ft_attempted, 0) - COALESCE(o.ft_attempted, 0) AS ft_attempt_diff
    FROM game_base gb
    LEFT JOIN team_stats_raw w ON w.team_id = gb.winner_team_id
    LEFT JOIN team_stats_raw o ON o.team_id != gb.winner_team_id 
      AND o.team_id IN (gb.team_a_id, gb.team_b_id)
  ),

  -- =========================================================================
  -- STEP 5: DECISIVE FACTOR SCORING
  -- Apply weighted multipliers and rank factors
  -- =========================================================================
  factor_scores AS (
    SELECT factor_name, raw_value, impact_score
    FROM team_diffs td,
    LATERAL (
      VALUES 
        ('Offensive Rebounds', td.off_rebound_diff, td.off_rebound_diff * 1.5),
        ('Turnovers Forced', td.turnovers_forced, td.turnovers_forced * 1.4),
        ('Rebounding Margin', td.rebound_diff, td.rebound_diff * 1.2),
        ('Steals & Blocks', td.winner_steals_blocks, td.winner_steals_blocks * 1.2),
        ('Free Throw Attempts', td.ft_attempt_diff, td.ft_attempt_diff * 1.1),
        ('Field Goal %', td.winner_fg_pct - td.opp_fg_pct, (td.winner_fg_pct - td.opp_fg_pct) * 1.0)
    ) AS factors(factor_name, raw_value, impact_score)
    WHERE raw_value > 0 -- Only positive differentials
  ),

  ranked_factors AS (
    SELECT 
      factor_name,
      raw_value,
      impact_score,
      ROW_NUMBER() OVER (ORDER BY impact_score DESC) AS factor_rank
    FROM factor_scores
  ),

  top_factors AS (
    SELECT 
      jsonb_agg(
        jsonb_build_object(
          'factor', factor_name,
          'value', raw_value,
          'impact_score', ROUND(impact_score::NUMERIC, 2)
        ) ORDER BY factor_rank
      ) AS factors_json
    FROM ranked_factors
    WHERE factor_rank <= 3
  ),

  -- =========================================================================
  -- STEP 6: PLAYER IMPACT INDEX
  -- Calculate impact score for each player and rank
  -- =========================================================================
  player_stats_raw AS (
    SELECT 
      COALESCE(gs.player_id, gs.custom_player_id) AS player_id,
      gs.custom_player_id IS NOT NULL AS is_custom_player,
      gs.team_id,
      -- Points (from made shots)
      SUM(CASE WHEN gs.modifier = 'made' THEN COALESCE(gs.stat_value, 0) ELSE 0 END) AS points,
      -- Counting stats
      COUNT(*) FILTER (WHERE gs.stat_type = 'rebound') AS rebounds,
      COUNT(*) FILTER (WHERE gs.stat_type = 'assist') AS assists,
      COUNT(*) FILTER (WHERE gs.stat_type = 'steal') AS steals,
      COUNT(*) FILTER (WHERE gs.stat_type = 'block') AS blocks,
      COUNT(*) FILTER (WHERE gs.stat_type = 'turnover') AS turnovers,
      COUNT(*) FILTER (WHERE gs.stat_type = 'foul') AS fouls
    FROM game_stats gs
    WHERE gs.game_id = p_game_id
      AND gs.is_opponent_stat = FALSE
      AND (gs.player_id IS NOT NULL OR gs.custom_player_id IS NOT NULL)
    GROUP BY 
      COALESCE(gs.player_id, gs.custom_player_id),
      gs.custom_player_id IS NOT NULL,
      gs.team_id
  ),

  player_impact AS (
    SELECT 
      ps.player_id,
      ps.is_custom_player,
      ps.team_id,
      ps.points,
      ps.rebounds,
      ps.assists,
      ps.steals,
      ps.blocks,
      ps.turnovers,
      -- Impact formula: PTS×1.0 + REB×0.8 + AST×0.7 + STL×1.2 + BLK×1.1 - TOV×1.0
      ROUND(
        (ps.points * 1.0) + 
        (ps.rebounds * 0.8) + 
        (ps.assists * 0.7) + 
        (ps.steals * 1.2) + 
        (ps.blocks * 1.1) - 
        (ps.turnovers * 1.0),
        2
      ) AS impact_score,
      -- Get player name (both tables use 'name')
      CASE 
        WHEN ps.is_custom_player THEN cp.name
        ELSE u.name
      END AS player_name,
      -- Team name for context
      CASE 
        WHEN ps.team_id = gb.team_a_id THEN gb.team_a_name
        ELSE gb.team_b_name
      END AS team_name,
      -- Is winner
      CASE 
        WHEN ps.team_id = gb.winner_team_id THEN TRUE
        ELSE FALSE
      END AS is_winner
    FROM player_stats_raw ps
    CROSS JOIN game_base gb
    LEFT JOIN users u ON ps.player_id = u.id AND NOT ps.is_custom_player
    LEFT JOIN custom_players cp ON ps.player_id = cp.id AND ps.is_custom_player
  ),

  ranked_players AS (
    SELECT 
      player_id,
      player_name,
      team_name,
      is_winner,
      points,
      rebounds,
      assists,
      steals,
      blocks,
      turnovers,
      impact_score,
      ROW_NUMBER() OVER (ORDER BY impact_score DESC) AS impact_rank
    FROM player_impact
    WHERE player_name IS NOT NULL
  ),

  top_players AS (
    SELECT 
      jsonb_agg(
        jsonb_build_object(
          'player_id', player_id,
          'name', player_name,
          'team', team_name,
          'is_winner', is_winner,
          'points', points,
          'rebounds', rebounds,
          'assists', assists,
          'steals', steals,
          'blocks', blocks,
          'turnovers', turnovers,
          'impact_score', impact_score,
          'rank', impact_rank
        ) ORDER BY impact_rank
      ) AS players_json
    FROM ranked_players
    WHERE impact_rank <= 3
  ),

  -- =========================================================================
  -- STEP 7: MOMENTUM / BREAKING POINT DETECTION
  -- Detect largest scoring runs by quarter
  -- =========================================================================
  quarter_scoring AS (
    SELECT 
      gs.quarter,
      gs.team_id,
      CASE 
        WHEN gs.team_id = gb.team_a_id THEN gb.team_a_name
        ELSE gb.team_b_name
      END AS team_name,
      CASE 
        WHEN gs.team_id = gb.winner_team_id THEN TRUE
        ELSE FALSE
      END AS is_winner,
      SUM(CASE WHEN gs.modifier = 'made' THEN COALESCE(gs.stat_value, 0) ELSE 0 END) AS quarter_points
    FROM game_stats gs
    CROSS JOIN game_base gb
    WHERE gs.game_id = p_game_id
      AND gs.is_opponent_stat = FALSE
      AND gs.modifier = 'made'
    GROUP BY gs.quarter, gs.team_id, gb.team_a_id, gb.team_b_id, gb.team_a_name, gb.team_b_name, gb.winner_team_id
  ),

  quarter_diffs AS (
    SELECT 
      q1.quarter,
      q1.team_name AS winner_team,
      q1.quarter_points AS winner_points,
      COALESCE(q2.quarter_points, 0) AS opp_points,
      q1.quarter_points - COALESCE(q2.quarter_points, 0) AS point_diff
    FROM quarter_scoring q1
    LEFT JOIN quarter_scoring q2 
      ON q1.quarter = q2.quarter 
      AND q1.team_id != q2.team_id
    WHERE q1.is_winner = TRUE
  ),

  best_quarter AS (
    SELECT 
      quarter,
      winner_team,
      winner_points,
      opp_points,
      point_diff
    FROM quarter_diffs
    ORDER BY point_diff DESC
    LIMIT 1
  ),

  momentum AS (
    SELECT 
      jsonb_build_object(
        'type', 'quarter_dominance',
        'quarter', bq.quarter,
        'team', bq.winner_team,
        'score_in_quarter', bq.winner_points,
        'opponent_score_in_quarter', bq.opp_points,
        'differential', bq.point_diff,
        'description', 
          CASE 
            WHEN bq.point_diff >= 10 THEN 'Dominant quarter performance'
            WHEN bq.point_diff >= 5 THEN 'Strong quarter showing'
            ELSE 'Key scoring stretch'
          END || ' in Q' || bq.quarter || ' (' || bq.winner_points || '-' || bq.opp_points || ')'
      ) AS momentum_json
    FROM best_quarter bq
  ),

  -- =========================================================================
  -- STEP 8: OPPONENT PERFORMANCE NOTE
  -- Generate one notable stat about the losing team
  -- =========================================================================
  opponent_note AS (
    SELECT 
      jsonb_build_object(
        'team', CASE 
          WHEN gb.winner_side = 'home' THEN gb.team_b_name
          ELSE gb.team_a_name
        END,
        'turnovers', COALESCE(td.opp_turnovers, 0),
        'fg_percentage', td.opp_fg_pct,
        'rebounds', td.opp_rebounds,
        'note', CASE 
          WHEN COALESCE(td.opp_turnovers, 0) >= 15 THEN 
            'High turnover count (' || td.opp_turnovers || ') proved costly'
          WHEN td.opp_fg_pct < 35 THEN 
            'Struggled from the field (' || td.opp_fg_pct || '% FG)'
          WHEN td.rebound_diff >= 10 THEN 
            'Outrebounded by ' || td.rebound_diff
          ELSE 
            'Competitive effort despite the loss'
        END
      ) AS opponent_json
    FROM game_base gb
    CROSS JOIN team_diffs td
    WHERE gb.winner_side != 'tie'
  )

  -- =========================================================================
  -- FINAL OUTPUT: Combine all CTEs into single JSON object
  -- =========================================================================
  SELECT jsonb_build_object(
    'game_id', gb.game_id,
    'final_score', jsonb_build_object(
      'home', gb.home_score,
      'away', gb.away_score,
      'home_team', gb.team_a_name,
      'away_team', gb.team_b_name
    ),
    'winner', jsonb_build_object(
      'team_id', gb.winner_team_id,
      'team_name', CASE 
        WHEN gb.winner_side = 'home' THEN gb.team_a_name
        WHEN gb.winner_side = 'away' THEN gb.team_b_name
        ELSE 'Tie'
      END,
      'side', gb.winner_side,
      'margin', gb.score_diff
    ),
    'game_type', jsonb_build_object(
      'classification', gt.classification,
      'margin', gb.score_diff,
      'narrative_hint', gt.narrative_hint
    ),
    'top_factors', COALESCE(tf.factors_json, '[]'::JSONB),
    'key_players', COALESCE(tp.players_json, '[]'::JSONB),
    'momentum', COALESCE(m.momentum_json, '{}'::JSONB),
    'opponent_note', COALESCE(o.opponent_json, '{}'::JSONB),
    'generated_at', NOW(),
    'version', '1.0.0'
  ) INTO v_result
  FROM game_base gb
  CROSS JOIN game_type gt
  LEFT JOIN top_factors tf ON TRUE
  LEFT JOIN top_players tp ON TRUE
  LEFT JOIN momentum m ON TRUE
  LEFT JOIN opponent_note o ON TRUE;

  RETURN v_result;
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS (adjust as needed for your RLS setup)
-- ============================================================================
-- GRANT EXECUTE ON FUNCTION get_game_summary_analytics(UUID) TO authenticated;
-- GRANT EXECUTE ON FUNCTION get_game_summary_analytics(UUID) TO anon;

-- ============================================================================
-- EXAMPLE USAGE
-- ============================================================================
-- SELECT get_game_summary_analytics('38d7f2a4-ac51-4cf1-b3a9-72e8dcf3ec82');
--
-- Example output:
-- {
--   "game_id": "38d7f2a4-ac51-4cf1-b3a9-72e8dcf3ec82",
--   "final_score": {"home": 72, "away": 65, "home_team": "Lakers", "away_team": "Celtics"},
--   "winner": {"team_id": "...", "team_name": "Lakers", "side": "home", "margin": 7},
--   "game_type": {"classification": "Competitive", "margin": 7, "narrative_hint": "Both teams battled closely"},
--   "top_factors": [
--     {"factor": "Offensive Rebounds", "value": 8, "impact_score": 12.0},
--     {"factor": "Turnovers Forced", "value": 6, "impact_score": 8.4},
--     {"factor": "Steals & Blocks", "value": 5, "impact_score": 6.0}
--   ],
--   "key_players": [
--     {"name": "LeBron James", "team": "Lakers", "points": 32, "rebounds": 8, "assists": 7, "impact_score": 45.2, "rank": 1},
--     {"name": "Jayson Tatum", "team": "Celtics", "points": 28, "rebounds": 6, "assists": 4, "impact_score": 38.4, "rank": 2},
--     {"name": "Anthony Davis", "team": "Lakers", "points": 24, "rebounds": 12, "assists": 2, "impact_score": 37.8, "rank": 3}
--   ],
--   "momentum": {
--     "type": "quarter_dominance",
--     "quarter": 3,
--     "team": "Lakers",
--     "score_in_quarter": 28,
--     "opponent_score_in_quarter": 18,
--     "differential": 10,
--     "description": "Dominant quarter performance in Q3 (28-18)"
--   },
--   "opponent_note": {
--     "team": "Celtics",
--     "turnovers": 12,
--     "fg_percentage": 42.5,
--     "rebounds": 38,
--     "note": "Competitive effort despite the loss"
--   },
--   "generated_at": "2025-12-18T12:00:00Z",
--   "version": "1.0.0"
-- }
-- ============================================================================

COMMENT ON FUNCTION get_game_summary_analytics(UUID) IS 
'Generates a structured JSON game summary for LLM consumption.
Returns: final_score, winner, game_type, top_factors (max 3), key_players (max 3), momentum (1), opponent_note (1).
All outputs are deterministic and repeatable for the same game_id.';
