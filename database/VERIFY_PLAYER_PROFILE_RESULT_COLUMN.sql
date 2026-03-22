-- ============================================================================
-- VERIFY: Public player profile RESULT / finalScore vs game_stats
-- ============================================================================
-- Run in Supabase SQL Editor (or psql). Prefer a role that sees all rows
-- (service role) so results are not affected by RLS — same as auditing data.
--
-- Context:
-- - PlayerGameStatsService buckets team points only when:
--     is_opponent_stat -> team B, OR team_id = team_a_id, OR team_id = team_b_id
--   Rows with team_id NULL (and not opponent) add NOTHING → UI can show N/A 0-0
--   while the player still has PTS from their own stat rows.
-- - games.home_score / away_score are updated by trigger ONLY when team_id
--   matches team_a or team_b (see migration 036). NULL team_id → scores stay 0.
--
-- Scoring types aligned with TournamentStandingsService (stat_value sum):
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) SANITY: How often are home_score/away_score zero for completed games?
-- ---------------------------------------------------------------------------
SELECT
  COUNT(*) FILTER (WHERE g.status = 'completed' AND COALESCE(g.is_coach_game, false) = false)
    AS completed_non_coach_games,
  COUNT(*) FILTER (
    WHERE g.status = 'completed'
      AND COALESCE(g.is_coach_game, false) = false
      AND COALESCE(g.home_score, 0) = 0
      AND COALESCE(g.away_score, 0) = 0
  ) AS completed_with_both_scores_zero
FROM games g;


-- ---------------------------------------------------------------------------
-- 2a) PER-GAME: home_score/away_score are 0 but game_stats have points
--     (COMMON if trigger never ran, two_pointer-only rows, or backfill gap.)
--     This is NOT the same as the UI bug unless 2b also returns rows.
-- ---------------------------------------------------------------------------
WITH scoring AS (
  SELECT
    gs.game_id,
    gs.team_id,
    gs.is_opponent_stat,
    gs.stat_type,
    gs.modifier,
    COALESCE(gs.stat_value, 0) AS pts
  FROM game_stats gs
  WHERE gs.modifier = 'made'
    AND gs.stat_type IN (
      'field_goal',
      'two_pointer',
      'three_pointer',
      '3_pointer',
      'free_throw'
    )
),
fixed AS (
  -- Team totals: opponent scoring -> team B only; else team_id vs team_a / team_b
  -- (matches TournamentStandingsService + PlayerGameStatsService)
  SELECT
    g.id AS game_id,
    g.team_a_id,
    g.team_b_id,
    g.status,
    COALESCE(g.is_coach_game, false) AS is_coach_game,
    COALESCE(g.home_score, 0) AS db_home,
    COALESCE(g.away_score, 0) AS db_away,
    SUM(
      CASE
        WHEN s.is_opponent_stat THEN 0
        WHEN s.team_id IS NOT NULL AND s.team_id = g.team_a_id THEN s.pts
        ELSE 0
      END
    ) AS calc_team_a,
    SUM(
      CASE
        WHEN s.is_opponent_stat THEN s.pts
        WHEN s.team_id IS NOT NULL AND s.team_id = g.team_b_id THEN s.pts
        ELSE 0
      END
    ) AS calc_team_b
  FROM games g
  LEFT JOIN scoring s ON s.game_id = g.id
  WHERE g.status = 'completed'
    AND COALESCE(g.is_coach_game, false) = false
  GROUP BY g.id, g.team_a_id, g.team_b_id, g.status, g.is_coach_game, g.home_score, g.away_score
),
orphan AS (
  SELECT
    s.game_id,
    SUM(s.pts) AS orphan_scoring_points,
    COUNT(*) AS orphan_row_count
  FROM scoring s
  INNER JOIN games g ON g.id = s.game_id
  WHERE g.status = 'completed'
    AND COALESCE(g.is_coach_game, false) = false
    AND NOT s.is_opponent_stat
    AND s.team_id IS NULL
  GROUP BY s.game_id
),
totals AS (
  SELECT
    s.game_id,
    SUM(s.pts) AS all_scoring_points
  FROM scoring s
  INNER JOIN games g ON g.id = s.game_id
  WHERE g.status = 'completed'
    AND COALESCE(g.is_coach_game, false) = false
  GROUP BY s.game_id
)
SELECT
  f.game_id,
  f.calc_team_a,
  f.calc_team_b,
  f.db_home AS games_home_score,
  f.db_away AS games_away_score,
  COALESCE(o.orphan_scoring_points, 0) AS orphan_scoring_points,
  COALESCE(o.orphan_row_count, 0) AS orphan_row_count,
  COALESCE(t.all_scoring_points, 0) AS total_scoring_points_in_stats
FROM fixed f
LEFT JOIN orphan o ON o.game_id = f.game_id
LEFT JOIN totals t ON t.game_id = f.game_id
WHERE
  (f.db_home = 0 AND f.db_away = 0 AND COALESCE(t.all_scoring_points, 0) > 0)
ORDER BY f.game_id
LIMIT 100;


-- ---------------------------------------------------------------------------
-- 2b) TRUE "N/A 0-0" DATA SIGNATURE: bucket totals 0-0 but scoring stats exist
--     If this returns NO rows (service role) but UI still shows 0-0, suspect:
--     RLS trimming the client bulk game_stats fetch, or stale client cache.
-- ---------------------------------------------------------------------------
WITH scoring AS (
  SELECT
    gs.game_id,
    gs.team_id,
    gs.is_opponent_stat,
    COALESCE(gs.stat_value, 0) AS pts
  FROM game_stats gs
  WHERE gs.modifier = 'made'
    AND gs.stat_type IN (
      'field_goal',
      'two_pointer',
      'three_pointer',
      '3_pointer',
      'free_throw'
    )
),
fixed AS (
  SELECT
    g.id AS game_id,
    SUM(
      CASE
        WHEN s.is_opponent_stat THEN 0
        WHEN s.team_id IS NOT NULL AND s.team_id = g.team_a_id THEN s.pts
        ELSE 0
      END
    ) AS calc_team_a,
    SUM(
      CASE
        WHEN s.is_opponent_stat THEN s.pts
        WHEN s.team_id IS NOT NULL AND s.team_id = g.team_b_id THEN s.pts
        ELSE 0
      END
    ) AS calc_team_b
  FROM games g
  LEFT JOIN scoring s ON s.game_id = g.id
  WHERE g.status = 'completed'
    AND COALESCE(g.is_coach_game, false) = false
  GROUP BY g.id
),
totals AS (
  SELECT s.game_id, SUM(s.pts) AS all_scoring_points
  FROM scoring s
  INNER JOIN games g ON g.id = s.game_id
  WHERE g.status = 'completed'
    AND COALESCE(g.is_coach_game, false) = false
  GROUP BY s.game_id
)
SELECT
  f.game_id,
  f.calc_team_a,
  f.calc_team_b,
  COALESCE(t.all_scoring_points, 0) AS total_scoring_points_in_stats
FROM fixed f
LEFT JOIN totals t ON t.game_id = f.game_id
WHERE
  f.calc_team_a = 0
  AND f.calc_team_b = 0
  AND COALESCE(t.all_scoring_points, 0) > 0
ORDER BY f.game_id;


-- ---------------------------------------------------------------------------
-- 3) AGGREGATE COUNTS (full picture without row dump)
-- ---------------------------------------------------------------------------
WITH scoring AS (
  SELECT
    gs.game_id,
    gs.team_id,
    gs.is_opponent_stat,
    COALESCE(gs.stat_value, 0) AS pts
  FROM game_stats gs
  WHERE gs.modifier = 'made'
    AND gs.stat_type IN (
      'field_goal',
      'two_pointer',
      'three_pointer',
      '3_pointer',
      'free_throw'
    )
),
fixed AS (
  SELECT
    g.id AS game_id,
    SUM(
      CASE
        WHEN s.is_opponent_stat THEN 0
        WHEN s.team_id IS NOT NULL AND s.team_id = g.team_a_id THEN s.pts
        ELSE 0
      END
    ) AS calc_team_a,
    SUM(
      CASE
        WHEN s.is_opponent_stat THEN s.pts
        WHEN s.team_id IS NOT NULL AND s.team_id = g.team_b_id THEN s.pts
        ELSE 0
      END
    ) AS calc_team_b
  FROM games g
  LEFT JOIN scoring s ON s.game_id = g.id
  WHERE g.status = 'completed'
    AND COALESCE(g.is_coach_game, false) = false
  GROUP BY g.id
),
totals AS (
  SELECT s.game_id, SUM(s.pts) AS all_scoring_points
  FROM scoring s
  INNER JOIN games g ON g.id = s.game_id
  WHERE g.status = 'completed'
    AND COALESCE(g.is_coach_game, false) = false
  GROUP BY s.game_id
),
orphan AS (
  SELECT s.game_id, SUM(s.pts) AS orphan_pts
  FROM scoring s
  INNER JOIN games g ON g.id = s.game_id
  WHERE g.status = 'completed'
    AND COALESCE(g.is_coach_game, false) = false
    AND NOT s.is_opponent_stat
    AND s.team_id IS NULL
  GROUP BY s.game_id
)
SELECT
  COUNT(*) AS completed_non_coach_games,
  COUNT(*) FILTER (
    WHERE COALESCE(t.all_scoring_points, 0) > 0
      AND f.calc_team_a = 0
      AND f.calc_team_b = 0
  ) AS games_with_stats_points_but_bucket_0_0,
  COUNT(*) FILTER (WHERE COALESCE(o.orphan_pts, 0) > 0) AS games_with_orphan_scoring_rows,
  COUNT(*) FILTER (
    WHERE COALESCE(t.all_scoring_points, 0) > 0
      AND COALESCE(o.orphan_pts, 0) = 0
      AND f.calc_team_a = 0
      AND f.calc_team_b = 0
  ) AS bucket_0_0_without_null_team_id_orphans
FROM fixed f
LEFT JOIN totals t ON t.game_id = f.game_id
LEFT JOIN orphan o ON o.game_id = f.game_id;


-- ---------------------------------------------------------------------------
-- 4) SAMPLE: Orphan scoring rows (NULL team_id, not opponent) — detail
-- ---------------------------------------------------------------------------
SELECT
  gs.id,
  gs.game_id,
  gs.player_id,
  gs.custom_player_id,
  gs.stat_type,
  gs.modifier,
  gs.stat_value,
  gs.is_opponent_stat,
  gs.team_id,
  g.team_a_id,
  g.team_b_id
FROM game_stats gs
JOIN games g ON g.id = gs.game_id
WHERE g.status = 'completed'
  AND COALESCE(g.is_coach_game, false) = false
  AND gs.modifier = 'made'
  AND gs.stat_type IN (
    'field_goal',
    'two_pointer',
    'three_pointer',
    '3_pointer',
    'free_throw'
  )
  AND NOT gs.is_opponent_stat
  AND gs.team_id IS NULL
ORDER BY gs.created_at DESC
LIMIT 50;


-- ---------------------------------------------------------------------------
-- 5) OPTIONAL: One player — compare their made scoring rows vs game bucket
--    Replace :player_uuid with a real users.id (or use custom_player path).
-- ---------------------------------------------------------------------------
/*
WITH player_games AS (
  SELECT DISTINCT gs.game_id
  FROM game_stats gs
  WHERE gs.player_id = '00000000-0000-0000-0000-000000000000'::uuid
    AND gs.modifier = 'made'
    AND gs.stat_type IN (
      'field_goal',
      'two_pointer',
      'three_pointer',
      '3_pointer',
      'free_throw'
    )
),
scoring AS (
  SELECT
    gs.game_id,
    gs.team_id,
    gs.is_opponent_stat,
    COALESCE(gs.stat_value, 0) AS pts
  FROM game_stats gs
  WHERE gs.modifier = 'made'
    AND gs.stat_type IN (
      'field_goal',
      'two_pointer',
      'three_pointer',
      '3_pointer',
      'free_throw'
    )
),
fixed AS (
  SELECT
    g.id AS game_id,
    SUM(
      CASE
        WHEN s.is_opponent_stat THEN 0
        WHEN s.team_id IS NOT NULL AND s.team_id = g.team_a_id THEN s.pts
        ELSE 0
      END
    ) AS calc_team_a,
    SUM(
      CASE
        WHEN s.is_opponent_stat THEN s.pts
        WHEN s.team_id IS NOT NULL AND s.team_id = g.team_b_id THEN s.pts
        ELSE 0
      END
    ) AS calc_team_b
  FROM games g
  INNER JOIN player_games pg ON pg.game_id = g.id
  LEFT JOIN scoring s ON s.game_id = g.id
  WHERE g.status = 'completed'
    AND COALESCE(g.is_coach_game, false) = false
  GROUP BY g.id
),
player_pts AS (
  SELECT
    gs.game_id,
    SUM(COALESCE(gs.stat_value, 0)) AS player_scoring_pts
  FROM game_stats gs
  INNER JOIN player_games pg ON pg.game_id = gs.game_id
  WHERE gs.player_id = '00000000-0000-0000-0000-000000000000'::uuid
    AND gs.modifier = 'made'
    AND gs.stat_type IN (
      'field_goal',
      'two_pointer',
      'three_pointer',
      '3_pointer',
      'free_throw'
    )
  GROUP BY gs.game_id
)
SELECT
  f.game_id,
  f.calc_team_a,
  f.calc_team_b,
  p.player_scoring_pts
FROM fixed f
JOIN player_pts p ON p.game_id = f.game_id
WHERE f.calc_team_a = 0 AND f.calc_team_b = 0 AND p.player_scoring_pts > 0;
*/
