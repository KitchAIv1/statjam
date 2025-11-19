-- ============================================================================
-- POST-MIGRATION VERIFICATION: Test Incremental Score Updates
-- ============================================================================
-- Run these queries to verify the optimized triggers are working correctly
-- ============================================================================

-- ============================================================================
-- TEST 1: Verify Function Uses Incremental Logic (Not SUM)
-- ============================================================================
SELECT 
  p.proname as function_name,
  CASE 
    WHEN pg_get_functiondef(p.oid) LIKE '%home_score + NEW.stat_value%' THEN 'INCREMENTAL ✅'
    WHEN pg_get_functiondef(p.oid) LIKE '%SUM(stat_value)%' THEN 'SUM (OLD) ❌'
    ELSE 'UNKNOWN'
  END as logic_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'update_game_scores';

-- ============================================================================
-- TEST 2: Verify All Three Triggers Exist
-- ============================================================================
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  CASE 
    WHEN event_manipulation = 'UPDATE' THEN 'NEW ✅'
    ELSE 'EXISTS ✅'
  END as status
FROM information_schema.triggers
WHERE event_object_table = 'game_stats'
AND trigger_name LIKE '%score%'
ORDER BY 
  CASE event_manipulation
    WHEN 'INSERT' THEN 1
    WHEN 'UPDATE' THEN 2
    WHEN 'DELETE' THEN 3
  END;

-- ============================================================================
-- TEST 3: Manual Test - Insert a Test Stat and Verify Score Increments
-- ============================================================================
-- ⚠️ WARNING: This will create a test stat. Replace with your actual game_id and team_id
-- Uncomment and modify the game_id/team_id below to test:

/*
-- Step 3a: Get current score BEFORE insert
SELECT 
  id as game_id,
  home_score as before_home_score,
  away_score as before_away_score
FROM games
WHERE id = 'YOUR_GAME_ID_HERE';

-- Step 3b: Insert a test stat (2-point made shot)
INSERT INTO game_stats (
  game_id,
  team_id,
  player_id,
  stat_type,
  stat_value,
  modifier
) VALUES (
  'YOUR_GAME_ID_HERE',
  'YOUR_TEAM_ID_HERE',  -- Must match team_a_id or team_b_id
  'YOUR_PLAYER_ID_HERE',
  '2pt',
  2,
  'made'
);

-- Step 3c: Verify score incremented by exactly 2 points
SELECT 
  id as game_id,
  home_score as after_home_score,
  away_score as after_away_score,
  CASE 
    WHEN 'YOUR_TEAM_ID_HERE' = team_a_id THEN home_score
    WHEN 'YOUR_TEAM_ID_HERE' = team_b_id THEN away_score
  END as expected_score_increment
FROM games
WHERE id = 'YOUR_GAME_ID_HERE';

-- Step 3d: Clean up test stat
DELETE FROM game_stats
WHERE game_id = 'YOUR_GAME_ID_HERE'
AND stat_type = '2pt'
AND modifier = 'made'
AND created_at > NOW() - INTERVAL '1 minute';
*/

-- ============================================================================
-- TEST 4: Performance Check - Verify Scores Still Match Calculations
-- ============================================================================
-- This should still return TRUE for all games (scores should match)
SELECT 
  g.id as game_id,
  g.home_score as db_home_score,
  g.away_score as db_away_score,
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
  (
    SELECT COALESCE(SUM(stat_value), 0)
    FROM game_stats
    WHERE game_id = g.id
    AND team_id = g.team_a_id
    AND modifier = 'made'
  ) = g.home_score as home_matches,
  (
    SELECT COALESCE(SUM(stat_value), 0)
    FROM game_stats
    WHERE game_id = g.id
    AND team_id = g.team_b_id
    AND modifier = 'made'
  ) = g.away_score as away_matches
FROM games g
WHERE g.status IN ('in_progress', 'completed')
ORDER BY g.updated_at DESC
LIMIT 10;

-- ============================================================================
-- TEST 5: Check for Any Errors in Recent Game Updates
-- ============================================================================
-- If scores don't match, this will show which games need attention
SELECT 
  g.id as game_id,
  g.status,
  g.home_score as db_home,
  g.away_score as db_away,
  (
    SELECT COALESCE(SUM(stat_value), 0)
    FROM game_stats
    WHERE game_id = g.id AND team_id = g.team_a_id AND modifier = 'made'
  ) as calc_home,
  (
    SELECT COALESCE(SUM(stat_value), 0)
    FROM game_stats
    WHERE game_id = g.id AND team_id = g.team_b_id AND modifier = 'made'
  ) as calc_away,
  CASE 
    WHEN (
      SELECT COALESCE(SUM(stat_value), 0)
      FROM game_stats
      WHERE game_id = g.id AND team_id = g.team_a_id AND modifier = 'made'
    ) != g.home_score THEN 'HOME MISMATCH ⚠️'
    WHEN (
      SELECT COALESCE(SUM(stat_value), 0)
      FROM game_stats
      WHERE game_id = g.id AND team_id = g.team_b_id AND modifier = 'made'
    ) != g.away_score THEN 'AWAY MISMATCH ⚠️'
    ELSE 'OK ✅'
  END as status_check
FROM games g
WHERE g.status IN ('in_progress', 'completed')
AND (
  g.home_score != (
    SELECT COALESCE(SUM(stat_value), 0)
    FROM game_stats
    WHERE game_id = g.id AND team_id = g.team_a_id AND modifier = 'made'
  )
  OR g.away_score != (
    SELECT COALESCE(SUM(stat_value), 0)
    FROM game_stats
    WHERE game_id = g.id AND team_id = g.team_b_id AND modifier = 'made'
  )
)
ORDER BY g.updated_at DESC;

