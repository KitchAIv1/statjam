-- ============================================================================
-- QUICK VERIFICATION: Trigger Optimization Status
-- ============================================================================
-- Run this first for immediate results
-- ============================================================================

-- Check 1: Are triggers using incremental logic? (CRITICAL)
SELECT 
  p.proname as function_name,
  CASE 
    WHEN pg_get_functiondef(p.oid) LIKE '%SUM(stat_value)%' THEN '❌ FAILED - Uses SUM (SLOW - CAUSES TIMEOUTS)'
    WHEN p.proname = 'update_game_scores' AND pg_get_functiondef(p.oid) LIKE '%+ NEW.stat_value%' THEN '✅ INCREMENTAL (FAST)'
    WHEN p.proname = 'update_game_scores_on_delete' AND pg_get_functiondef(p.oid) LIKE '%- OLD.stat_value%' THEN '✅ INCREMENTAL (FAST)'
    WHEN p.proname = 'update_game_scores_on_update' AND pg_get_functiondef(p.oid) LIKE '%- old_points + new_points%' THEN '✅ INCREMENTAL (FAST)'
    ELSE '⚠️ UNKNOWN - Check manually'
  END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('update_game_scores', 'update_game_scores_on_delete', 'update_game_scores_on_update')
ORDER BY p.proname;

-- Check 2: What triggers are active?
SELECT 
  trigger_name,
  event_manipulation as event,
  action_timing as timing
FROM information_schema.triggers
WHERE event_object_table = 'game_stats'
AND event_object_schema = 'public'
ORDER BY trigger_name;

-- Check 3: Database timeout setting
SELECT 
  name,
  setting,
  unit,
  CASE 
    WHEN name = 'statement_timeout' AND setting::int = 0 THEN '⚠️ NO TIMEOUT'
    WHEN name = 'statement_timeout' AND setting::int < 10000 THEN '⚠️ VERY SHORT (< 10s)'
    ELSE '✅ OK'
  END as assessment
FROM pg_settings
WHERE name = 'statement_timeout';

-- Check 4: Other operations updating games table?
SELECT DISTINCT
  p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND pg_get_functiondef(p.oid) LIKE '%UPDATE games%'
AND p.proname NOT LIKE 'pg_%'
ORDER BY p.proname;

