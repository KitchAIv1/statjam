-- ============================================================================
-- DELETE AND REGENERATE AI ANALYSIS
-- Game: b7f9757a-4205-4784-ade4-296e2817d55a
-- 
-- PURPOSE: Delete cached AI analysis so it regenerates with enhanced metrics
-- 
-- RUN THIS AFTER: 032_ai_analysis_enhanced_metrics.sql migration is applied
-- ============================================================================

-- STEP 1: Verify existing analysis before deletion
SELECT 
  '=== BEFORE DELETION ===' AS step,
  id,
  game_id,
  generated_at,
  version
FROM ai_analysis
WHERE game_id = 'b7f9757a-4205-4784-ade4-296e2817d55a';

-- STEP 2: Delete the cached analysis
DELETE FROM ai_analysis
WHERE game_id = 'b7f9757a-4205-4784-ade4-296e2817d55a';

-- STEP 3: Confirm deletion
SELECT 
  '=== AFTER DELETION ===' AS step,
  CASE WHEN EXISTS (SELECT 1 FROM ai_analysis WHERE game_id = 'b7f9757a-4205-4784-ade4-296e2817d55a')
    THEN '❌ FAILED - Analysis still exists'
    ELSE '✅ SUCCESS - Analysis deleted, will regenerate on next view'
  END AS deletion_status;

-- STEP 4: Verify enhanced RPC output has new fields
SELECT 
  '=== VERIFY ENHANCED RPC ===' AS step;

-- Check top-level keys (should now include bench_players, shooting_comparison, efficiency_metrics)
SELECT jsonb_object_keys(get_ai_analysis_data('b7f9757a-4205-4784-ade4-296e2817d55a'::uuid)) AS top_level_keys;

-- STEP 5: Verify team_totals now has all fields
SELECT 
  '=== VERIFY team_totals ENHANCED ===' AS step;

SELECT jsonb_object_keys(
  get_ai_analysis_data('b7f9757a-4205-4784-ade4-296e2817d55a'::uuid)->'team_totals'
) AS team_totals_fields;

-- STEP 6: Preview new shooting_comparison object
SELECT 
  '=== NEW: shooting_comparison ===' AS step;

SELECT jsonb_pretty(
  get_ai_analysis_data('b7f9757a-4205-4784-ade4-296e2817d55a'::uuid)->'shooting_comparison'
) AS shooting_comparison;

-- STEP 7: Preview new efficiency_metrics object
SELECT 
  '=== NEW: efficiency_metrics ===' AS step;

SELECT jsonb_pretty(
  get_ai_analysis_data('b7f9757a-4205-4784-ade4-296e2817d55a'::uuid)->'efficiency_metrics'
) AS efficiency_metrics;

-- STEP 8: Preview new bench_players array
SELECT 
  '=== NEW: bench_players ===' AS step;

SELECT jsonb_pretty(
  get_ai_analysis_data('b7f9757a-4205-4784-ade4-296e2817d55a'::uuid)->'bench_players'
) AS bench_players;

-- ============================================================================
-- DONE - Now open the game in the app to trigger AI analysis regeneration
-- The new analysis will use the enhanced RPC data
-- ============================================================================

SELECT '=== COMPLETE - Open game in app to regenerate AI analysis ===' AS final_step;
