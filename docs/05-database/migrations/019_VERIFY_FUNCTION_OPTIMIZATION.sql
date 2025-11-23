-- ============================================================================
-- COMPREHENSIVE FUNCTION VERIFICATION: Check All Three Optimized Functions
-- ============================================================================
-- This query properly detects incremental logic in all three functions
-- ============================================================================

SELECT 
  p.proname as function_name,
  CASE 
    -- INSERT function: Should use "home_score + NEW.stat_value"
    WHEN p.proname = 'update_game_scores' THEN
      CASE 
        WHEN pg_get_functiondef(p.oid) LIKE '%home_score + NEW.stat_value%' THEN 'INCREMENTAL ✅'
        WHEN pg_get_functiondef(p.oid) LIKE '%SUM(stat_value)%' THEN 'SUM (OLD) ❌'
        ELSE 'UNKNOWN - Check manually'
      END
    -- DELETE function: Should use "home_score - OLD.stat_value"
    WHEN p.proname = 'update_game_scores_on_delete' THEN
      CASE 
        WHEN pg_get_functiondef(p.oid) LIKE '%home_score - OLD.stat_value%' THEN 'INCREMENTAL ✅'
        WHEN pg_get_functiondef(p.oid) LIKE '%GREATEST(0, home_score - OLD.stat_value)%' THEN 'INCREMENTAL ✅ (with safety)'
        WHEN pg_get_functiondef(p.oid) LIKE '%SUM(stat_value)%' THEN 'SUM (OLD) ❌'
        ELSE 'UNKNOWN - Check manually'
      END
    -- UPDATE function: Should use "home_score - old_points + new_points"
    WHEN p.proname = 'update_game_scores_on_update' THEN
      CASE 
        WHEN pg_get_functiondef(p.oid) LIKE '%home_score - old_points + new_points%' THEN 'INCREMENTAL ✅'
        WHEN pg_get_functiondef(p.oid) LIKE '%home_score + new_points%' AND pg_get_functiondef(p.oid) LIKE '%home_score - old_points%' THEN 'INCREMENTAL ✅'
        WHEN pg_get_functiondef(p.oid) LIKE '%SUM(stat_value)%' THEN 'SUM (OLD) ❌'
        ELSE 'UNKNOWN - Check manually'
      END
    ELSE 'UNKNOWN FUNCTION'
  END as logic_type,
  CASE 
    WHEN pg_get_functiondef(p.oid) LIKE '%SUM(stat_value)%' THEN '❌ FAILED - Still using SUM'
    WHEN pg_get_functiondef(p.oid) LIKE '%SUM(%' THEN '⚠️ WARNING - Contains SUM (may be in comments)'
    ELSE '✅ OK - No SUM queries detected'
  END as sum_check
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('update_game_scores', 'update_game_scores_on_delete', 'update_game_scores_on_update')
ORDER BY 
  CASE p.proname
    WHEN 'update_game_scores' THEN 1
    WHEN 'update_game_scores_on_delete' THEN 2
    WHEN 'update_game_scores_on_update' THEN 3
  END;

-- ============================================================================
-- ALTERNATIVE: Simple Pattern Check (Easier to Read)
-- ============================================================================
-- This checks for the key incremental patterns without complex CASE logic

SELECT 
  p.proname as function_name,
  CASE 
    WHEN pg_get_functiondef(p.oid) LIKE '%SUM(stat_value)%' THEN '❌ FAILED - Uses SUM'
    WHEN p.proname = 'update_game_scores' AND pg_get_functiondef(p.oid) LIKE '%+ NEW.stat_value%' THEN '✅ INCREMENTAL'
    WHEN p.proname = 'update_game_scores_on_delete' AND pg_get_functiondef(p.oid) LIKE '%- OLD.stat_value%' THEN '✅ INCREMENTAL'
    WHEN p.proname = 'update_game_scores_on_update' AND pg_get_functiondef(p.oid) LIKE '%- old_points + new_points%' THEN '✅ INCREMENTAL'
    ELSE '⚠️ UNKNOWN - Manual check needed'
  END as optimization_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('update_game_scores', 'update_game_scores_on_delete', 'update_game_scores_on_update')
ORDER BY p.proname;

