-- ============================================================
-- VERIFY CURRENT AI ANALYSIS RPC OUTPUT
-- Game: b7f9757a-4205-4784-ade4-296e2817d55a
-- 
-- PURPOSE: Verify existing RPC structure before adding new metrics
-- ============================================================

-- 1. FULL RPC OUTPUT (Pretty Printed)
SELECT 
  '=== FULL RPC OUTPUT ===' AS section;

SELECT jsonb_pretty(get_ai_analysis_data('b7f9757a-4205-4784-ade4-296e2817d55a'::uuid)) AS full_output;

-- 2. GAME OBJECT STRUCTURE
SELECT 
  '=== GAME OBJECT ===' AS section;

SELECT jsonb_pretty(
  get_ai_analysis_data('b7f9757a-4205-4784-ade4-296e2817d55a'::uuid)->'game'
) AS game_object;

-- 3. TEAM_TOTALS STRUCTURE (What we have)
SELECT 
  '=== TEAM_TOTALS (Current) ===' AS section;

SELECT jsonb_pretty(
  get_ai_analysis_data('b7f9757a-4205-4784-ade4-296e2817d55a'::uuid)->'team_totals'
) AS team_totals;

-- 4. OPPONENT_TOTALS STRUCTURE (What we have)
SELECT 
  '=== OPPONENT_TOTALS (Current) ===' AS section;

SELECT jsonb_pretty(
  get_ai_analysis_data('b7f9757a-4205-4784-ade4-296e2817d55a'::uuid)->'opponent_totals'
) AS opponent_totals;

-- 5. QUARTERS STRUCTURE
SELECT 
  '=== QUARTERS (Current) ===' AS section;

SELECT jsonb_pretty(
  get_ai_analysis_data('b7f9757a-4205-4784-ade4-296e2817d55a'::uuid)->'quarters'
) AS quarters;

-- 6. PLAYERS STRUCTURE (Top 4)
SELECT 
  '=== PLAYERS (Current - Top 4) ===' AS section;

SELECT jsonb_pretty(
  get_ai_analysis_data('b7f9757a-4205-4784-ade4-296e2817d55a'::uuid)->'players'
) AS players;

-- 7. CHECK ALL TOP-LEVEL KEYS
SELECT 
  '=== TOP-LEVEL KEYS ===' AS section;

SELECT jsonb_object_keys(get_ai_analysis_data('b7f9757a-4205-4784-ade4-296e2817d55a'::uuid)) AS top_level_keys;

-- ============================================================
-- GAP ANALYSIS: What's MISSING from team_totals
-- ============================================================

SELECT 
  '=== GAP: team_totals is MISSING these fields ===' AS section;

-- Current team_totals has: rebounds, steals, blocks, turnovers, ft_made, ft_attempted, ft_percentage
-- MISSING: assists, fouls, fg_made, fg_attempted, fg_percentage, three_made, three_attempted, three_percentage, points

WITH current_totals AS (
  SELECT get_ai_analysis_data('b7f9757a-4205-4784-ade4-296e2817d55a'::uuid)->'team_totals' AS tt
)
SELECT 
  CASE WHEN tt ? 'assists' THEN '✅' ELSE '❌' END || ' assists' AS field_status,
  CASE WHEN tt ? 'fouls' THEN '✅' ELSE '❌' END || ' fouls',
  CASE WHEN tt ? 'points' THEN '✅' ELSE '❌' END || ' points',
  CASE WHEN tt ? 'fg_made' THEN '✅' ELSE '❌' END || ' fg_made',
  CASE WHEN tt ? 'fg_attempted' THEN '✅' ELSE '❌' END || ' fg_attempted',
  CASE WHEN tt ? 'fg_percentage' THEN '✅' ELSE '❌' END || ' fg_percentage',
  CASE WHEN tt ? 'three_made' THEN '✅' ELSE '❌' END || ' three_made',
  CASE WHEN tt ? 'three_attempted' THEN '✅' ELSE '❌' END || ' three_attempted',
  CASE WHEN tt ? 'three_percentage' THEN '✅' ELSE '❌' END || ' three_percentage'
FROM current_totals;

-- ============================================================
-- VERIFY: What fields EXIST in team_totals
-- ============================================================

SELECT 
  '=== team_totals EXISTING FIELDS ===' AS section;

SELECT jsonb_object_keys(
  get_ai_analysis_data('b7f9757a-4205-4784-ade4-296e2817d55a'::uuid)->'team_totals'
) AS existing_fields;

-- ============================================================
-- VERIFY: What fields EXIST in opponent_totals
-- ============================================================

SELECT 
  '=== opponent_totals EXISTING FIELDS ===' AS section;

SELECT jsonb_object_keys(
  get_ai_analysis_data('b7f9757a-4205-4784-ade4-296e2817d55a'::uuid)->'opponent_totals'
) AS existing_fields;

-- ============================================================
-- MANUAL CALCULATION: What team_totals SHOULD have
-- ============================================================

SELECT 
  '=== MANUAL CALCULATION: team_totals SHOULD HAVE ===' AS section;

SELECT 
  -- Points
  (COUNT(*) FILTER (WHERE stat_type IN ('field_goal', 'two_pointer') AND modifier = 'made') * 2 +
   COUNT(*) FILTER (WHERE stat_type = 'three_pointer' AND modifier = 'made') * 3 +
   COUNT(*) FILTER (WHERE stat_type = 'free_throw' AND modifier = 'made')) AS points,
  -- Shooting
  COUNT(*) FILTER (WHERE stat_type IN ('field_goal', 'two_pointer') AND modifier = 'made') AS two_pt_made,
  COUNT(*) FILTER (WHERE stat_type IN ('field_goal', 'two_pointer')) AS two_pt_attempted,
  COUNT(*) FILTER (WHERE stat_type = 'three_pointer' AND modifier = 'made') AS three_made,
  COUNT(*) FILTER (WHERE stat_type = 'three_pointer') AS three_attempted,
  -- Combined FG (2PT + 3PT)
  COUNT(*) FILTER (WHERE stat_type IN ('field_goal', 'two_pointer', 'three_pointer') AND modifier = 'made') AS total_fg_made,
  COUNT(*) FILTER (WHERE stat_type IN ('field_goal', 'two_pointer', 'three_pointer')) AS total_fg_attempted,
  -- Other stats
  COUNT(*) FILTER (WHERE stat_type = 'assist') AS assists,
  COUNT(*) FILTER (WHERE stat_type = 'rebound') AS rebounds,
  COUNT(*) FILTER (WHERE stat_type = 'steal') AS steals,
  COUNT(*) FILTER (WHERE stat_type = 'block') AS blocks,
  COUNT(*) FILTER (WHERE stat_type = 'turnover') AS turnovers,
  COUNT(*) FILTER (WHERE stat_type IN ('foul', 'personal_foul')) AS fouls,
  -- FT
  COUNT(*) FILTER (WHERE stat_type = 'free_throw' AND modifier = 'made') AS ft_made,
  COUNT(*) FILTER (WHERE stat_type = 'free_throw') AS ft_attempted
FROM game_stats
WHERE game_id = 'b7f9757a-4205-4784-ade4-296e2817d55a'
  AND (is_opponent_stat = false OR is_opponent_stat IS NULL);

-- ============================================================
-- CHECK: Does RPC have enhanced_metrics or shooting_comparison?
-- ============================================================

SELECT 
  '=== CHECK FOR ENHANCED METRICS (New fields we want to add) ===' AS section;

WITH rpc_output AS (
  SELECT get_ai_analysis_data('b7f9757a-4205-4784-ade4-296e2817d55a'::uuid) AS output
)
SELECT 
  CASE WHEN output ? 'shooting_comparison' THEN '✅ EXISTS' ELSE '❌ MISSING' END AS shooting_comparison,
  CASE WHEN output ? 'efficiency_metrics' THEN '✅ EXISTS' ELSE '❌ MISSING' END AS efficiency_metrics,
  CASE WHEN output ? 'bench_players' THEN '✅ EXISTS' ELSE '❌ MISSING' END AS bench_players,
  CASE WHEN output ? 'game_factors' THEN '✅ EXISTS' ELSE '❌ MISSING' END AS game_factors
FROM rpc_output;

-- ============================================================
-- END VERIFICATION
-- ============================================================

SELECT '=== VERIFICATION COMPLETE ===' AS section;
