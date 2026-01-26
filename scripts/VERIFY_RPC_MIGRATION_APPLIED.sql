-- ============================================================
-- VERIFY RPC MIGRATION 032 WAS APPLIED
-- Game: b7f9757a-4205-4784-ade4-296e2817d55a
-- ============================================================

-- 1. CHECK IF FUNCTION EXISTS AND VERSION
SELECT 
  '=== FUNCTION EXISTS CHECK ===' AS section;

SELECT 
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS function_definition_preview
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'get_ai_analysis_data'
LIMIT 1;

-- 2. CHECK TOP-LEVEL KEYS (Should now have 8 keys)
SELECT 
  '=== TOP-LEVEL KEYS (Should be 8) ===' AS section;

SELECT jsonb_object_keys(get_ai_analysis_data('b7f9757a-4205-4784-ade4-296e2817d55a'::uuid)) AS top_level_keys;

-- 3. CHECK IF NEW OBJECTS EXIST
SELECT 
  '=== NEW OBJECTS CHECK ===' AS section;

WITH rpc_output AS (
  SELECT get_ai_analysis_data('b7f9757a-4205-4784-ade4-296e2817d55a'::uuid) AS output
)
SELECT 
  CASE WHEN output ? 'shooting_comparison' THEN '✅ shooting_comparison EXISTS' ELSE '❌ shooting_comparison MISSING' END AS shooting_comparison_check,
  CASE WHEN output ? 'efficiency_metrics' THEN '✅ efficiency_metrics EXISTS' ELSE '❌ efficiency_metrics MISSING' END AS efficiency_metrics_check,
  CASE WHEN output ? 'bench_players' THEN '✅ bench_players EXISTS' ELSE '❌ bench_players MISSING' END AS bench_players_check
FROM rpc_output;

-- 4. CHECK team_totals HAS NEW FIELDS
SELECT 
  '=== team_totals FIELDS (Should have 17+ fields) ===' AS section;

SELECT jsonb_object_keys(
  get_ai_analysis_data('b7f9757a-4205-4784-ade4-296e2817d55a'::uuid)->'team_totals'
) AS team_totals_fields;

-- 5. VERIFY shooting_comparison DATA
SELECT 
  '=== shooting_comparison DATA ===' AS section;

SELECT jsonb_pretty(
  get_ai_analysis_data('b7f9757a-4205-4784-ade4-296e2817d55a'::uuid)->'shooting_comparison'
) AS shooting_comparison;

-- 6. VERIFY efficiency_metrics DATA
SELECT 
  '=== efficiency_metrics DATA ===' AS section;

SELECT jsonb_pretty(
  get_ai_analysis_data('b7f9757a-4205-4784-ade4-296e2817d55a'::uuid)->'efficiency_metrics'
) AS efficiency_metrics;

-- 7. VERIFY bench_players DATA
SELECT 
  '=== bench_players DATA ===' AS section;

SELECT jsonb_pretty(
  get_ai_analysis_data('b7f9757a-4205-4784-ade4-296e2817d55a'::uuid)->'bench_players'
) AS bench_players;

-- 8. CHECK AI_ANALYSIS CACHE STATUS
SELECT 
  '=== AI_ANALYSIS CACHE STATUS ===' AS section;

SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM ai_analysis WHERE game_id = 'b7f9757a-4205-4784-ade4-296e2817d55a')
    THEN '⚠️ CACHED - Need to DELETE to regenerate'
    ELSE '✅ NOT CACHED - Will generate fresh on next request'
  END AS cache_status;

SELECT id, game_id, generated_at, version 
FROM ai_analysis 
WHERE game_id = 'b7f9757a-4205-4784-ade4-296e2817d55a';

-- ============================================================
SELECT '=== VERIFICATION COMPLETE ===' AS section;
