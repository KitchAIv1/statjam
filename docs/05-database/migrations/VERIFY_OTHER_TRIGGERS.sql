-- ============================================================================
-- VERIFY OTHER TRIGGERS: Check increment_team_fouls and update_player_stats
-- ============================================================================
-- Purpose: Check if these triggers are causing lock contention
-- ============================================================================

-- Check 1: What does increment_team_fouls do?
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as full_function_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'increment_team_fouls';

-- Check 2: What does update_player_stats do?
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as full_function_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'update_player_stats';

-- Check 3: Do these functions UPDATE games table?
SELECT 
  p.proname as function_name,
  CASE 
    WHEN pg_get_functiondef(p.oid) LIKE '%UPDATE games%' THEN '⚠️ YES - Updates games table (LOCK CONTENTION RISK)'
    ELSE '✅ NO - Does not update games table'
  END as updates_games_table
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('increment_team_fouls', 'update_player_stats')
ORDER BY p.proname;

