-- ============================================================================
-- VERIFICATION QUERIES: Check Current Trigger State Before Migration
-- ============================================================================
-- Run these queries in Supabase SQL Editor to verify current state
-- ============================================================================

-- ============================================================================
-- QUERY 1: Check All Triggers on game_stats Table
-- ============================================================================
SELECT 
  trigger_name,
  event_manipulation,  -- INSERT, UPDATE, DELETE
  action_timing,        -- BEFORE, AFTER
  action_statement     -- Function name
FROM information_schema.triggers
WHERE event_object_table = 'game_stats'
ORDER BY trigger_name, event_manipulation;

-- ============================================================================
-- QUERY 2: Check All Score-Related Functions
-- ============================================================================
SELECT 
  routine_name,
  routine_type,  -- FUNCTION or PROCEDURE
  data_type      -- Return type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%score%'
ORDER BY routine_name;

-- ============================================================================
-- QUERY 3: Check if UPDATE Trigger Exists (Should be MISSING)
-- ============================================================================
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as update_trigger_status,
  COUNT(*) as trigger_count
FROM information_schema.triggers
WHERE event_object_table = 'game_stats'
AND event_manipulation = 'UPDATE'
AND trigger_name LIKE '%score%';

-- ============================================================================
-- QUERY 4: Get Current Trigger Function Code (if accessible)
-- ============================================================================
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('update_game_scores', 'update_game_scores_on_delete', 'update_game_scores_on_update')
ORDER BY p.proname;

-- ============================================================================
-- QUERY 5: Check Current Score Calculation Logic (Sample Game)
-- ============================================================================
-- Replace 'YOUR_GAME_ID' with an actual game ID to test
SELECT 
  g.id as game_id,
  g.home_score as db_home_score,
  g.away_score as db_away_score,
  -- Calculate what score SHOULD be from game_stats
  (
    SELECT COALESCE(SUM(stat_value), 0)
    FROM game_stats
    WHERE game_id = g.id
    AND team_id = g.team_a_id
    AND modifier = 'made'
  ) as calculated_home_score,
  (
    SELECT COALESCE(SUM(stat_value), 0)
    FROM game_stats
    WHERE game_id = g.id
    AND team_id = g.team_b_id
    AND modifier = 'made'
  ) as calculated_away_score,
  -- Check if scores match (should be TRUE if triggers working)
  (
    SELECT COALESCE(SUM(stat_value), 0)
    FROM game_stats
    WHERE game_id = g.id
    AND team_id = g.team_a_id
    AND modifier = 'made'
  ) = g.home_score as home_score_matches,
  (
    SELECT COALESCE(SUM(stat_value), 0)
    FROM game_stats
    WHERE game_id = g.id
    AND team_id = g.team_b_id
    AND modifier = 'made'
  ) = g.away_score as away_score_matches
FROM games g
WHERE g.status = 'in_progress'
LIMIT 5;

-- ============================================================================
-- QUERY 6: Count Stats Per Game (to estimate performance impact)
-- ============================================================================
SELECT 
  game_id,
  COUNT(*) as total_stats,
  COUNT(*) FILTER (WHERE modifier = 'made') as made_shots,
  COUNT(*) FILTER (WHERE modifier = 'missed') as missed_shots
FROM game_stats
GROUP BY game_id
ORDER BY total_stats DESC
LIMIT 10;

-- ============================================================================
-- QUERY 7: Check for Any Other Triggers That Might Conflict
-- ============================================================================
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'game_stats'
ORDER BY trigger_name;

-- ============================================================================
-- QUERY 8: Verify update_player_stats Trigger (Separate, Should Not Conflict)
-- ============================================================================
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'game_stats'
AND trigger_name LIKE '%player%'
ORDER BY trigger_name;

