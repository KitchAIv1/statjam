-- ============================================================================
-- COMPREHENSIVE VERIFICATION: Trigger Timeout Issue Diagnosis
-- ============================================================================
-- Purpose: Verify trigger optimization status and identify lock contention sources
-- Date: January 2025
-- ============================================================================

-- ============================================================================
-- STEP 1: Verify Trigger Functions Are Optimized (Incremental Logic)
-- ============================================================================

SELECT 
  p.proname as function_name,
  CASE 
    WHEN pg_get_functiondef(p.oid) LIKE '%SUM(stat_value)%' THEN '❌ FAILED - Uses SUM (SLOW)'
    WHEN p.proname = 'update_game_scores' AND pg_get_functiondef(p.oid) LIKE '%+ NEW.stat_value%' THEN '✅ INCREMENTAL (FAST)'
    WHEN p.proname = 'update_game_scores_on_delete' AND pg_get_functiondef(p.oid) LIKE '%- OLD.stat_value%' THEN '✅ INCREMENTAL (FAST)'
    WHEN p.proname = 'update_game_scores_on_update' AND pg_get_functiondef(p.oid) LIKE '%- old_points + new_points%' THEN '✅ INCREMENTAL (FAST)'
    ELSE '⚠️ UNKNOWN - Manual check needed'
  END as optimization_status,
  CASE 
    WHEN pg_get_functiondef(p.oid) LIKE '%SUM(%' THEN '⚠️ WARNING - Contains SUM (may be slow)'
    ELSE '✅ OK - No SUM queries'
  END as performance_check
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('update_game_scores', 'update_game_scores_on_delete', 'update_game_scores_on_update')
ORDER BY p.proname;

-- ============================================================================
-- STEP 2: Check Active Triggers on game_stats Table
-- ============================================================================

SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement,
  action_orientation
FROM information_schema.triggers
WHERE event_object_table = 'game_stats'
AND event_object_schema = 'public'
ORDER BY trigger_name;

-- ============================================================================
-- STEP 3: Check for Other Triggers/Operations Updating games Table
-- ============================================================================

-- Check triggers on games table
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement,
  action_orientation
FROM information_schema.triggers
WHERE event_object_table = 'games'
AND event_object_schema = 'public'
ORDER BY trigger_name;

-- Check for functions that update games table
SELECT DISTINCT
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND pg_get_functiondef(p.oid) LIKE '%UPDATE games%'
AND p.proname NOT LIKE 'pg_%'
ORDER BY p.proname;

-- ============================================================================
-- STEP 4: Check Database Statement Timeout Settings
-- ============================================================================

-- Check current statement timeout (in milliseconds)
SELECT 
  name,
  setting,
  unit,
  CASE 
    WHEN name = 'statement_timeout' AND setting::int = 0 THEN '⚠️ NO TIMEOUT (unlimited)'
    WHEN name = 'statement_timeout' AND setting::int < 10000 THEN '⚠️ VERY SHORT (< 10s)'
    WHEN name = 'statement_timeout' AND setting::int BETWEEN 10000 AND 30000 THEN '✅ REASONABLE (10-30s)'
    WHEN name = 'statement_timeout' AND setting::int > 30000 THEN '✅ GENEROUS (> 30s)'
    ELSE '✅ OK'
  END as timeout_assessment
FROM pg_settings
WHERE name IN ('statement_timeout', 'lock_timeout', 'idle_in_transaction_session_timeout')
ORDER BY name;

-- ============================================================================
-- STEP 5: Check for Indexes on games Table (Affects UPDATE Performance)
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'games'
ORDER BY indexname;

-- ============================================================================
-- STEP 6: Check Current Lock Activity (Run During Active Game)
-- ============================================================================
-- ⚠️ Run this DURING an active game when timeouts occur
-- This shows what locks are being held/waited on

SELECT 
  l.locktype,
  l.database,
  l.relation::regclass as table_name,
  l.page,
  l.tuple,
  l.virtualxid,
  l.transactionid,
  l.mode,
  l.granted,
  a.query,
  a.state,
  a.wait_event_type,
  a.wait_event
FROM pg_locks l
LEFT JOIN pg_stat_activity a ON l.pid = a.pid
WHERE l.relation::regclass::text = 'games'
OR l.relation::regclass::text = 'game_stats'
ORDER BY l.granted, l.mode;

-- ============================================================================
-- STEP 7: Check Recent Trigger Execution Times (If Available)
-- ============================================================================
-- Note: This requires pg_stat_statements extension to be enabled

SELECT 
  schemaname,
  funcname,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_user_functions
WHERE funcname IN ('update_game_scores', 'update_game_scores_on_delete', 'update_game_scores_on_update')
ORDER BY mean_exec_time DESC;



-- ============================================================================
-- SUMMARY: Expected Results
-- ============================================================================
-- ✅ STEP 1: All functions should show "✅ INCREMENTAL (FAST)"
-- ✅ STEP 2: Should show 3 triggers (INSERT, DELETE, UPDATE)
-- ✅ STEP 3: Should show minimal triggers/functions updating games table
-- ✅ STEP 4: statement_timeout should be reasonable (10-30s)
-- ✅ STEP 5: Should show index on games.id (PRIMARY KEY)
-- ⚠️ STEP 6: Run during timeout to see lock contention
-- ⚠️ STEP 7: Requires extension - may not be available
-- ✅ STEP 8: Function code should show incremental arithmetic (not SUM)
-- ============================================================================

