-- ============================================================================
-- FIX ALL TIMEOUT COUNTS - Comprehensive Database Fix
-- ============================================================================
-- Purpose: Fix timeout counts for ALL games based on actual timeout usage
-- This corrects games with incorrect timeout values (>5 or out of sync)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Preview what will be fixed (RUN THIS FIRST)
-- ----------------------------------------------------------------------------
SELECT 
  g.id as game_id,
  g.team_a_id,
  g.team_b_id,
  g.team_a_timeouts_remaining as current_team_a,
  g.team_b_timeouts_remaining as current_team_b,
  COUNT(CASE WHEN gt.team_id = g.team_a_id THEN 1 END) as team_a_used,
  COUNT(CASE WHEN gt.team_id = g.team_b_id THEN 1 END) as team_b_used,
  (5 - COUNT(CASE WHEN gt.team_id = g.team_a_id THEN 1 END)) as correct_team_a,
  (5 - COUNT(CASE WHEN gt.team_id = g.team_b_id THEN 1 END)) as correct_team_b,
  CASE 
    WHEN g.team_a_timeouts_remaining != (5 - COUNT(CASE WHEN gt.team_id = g.team_a_id THEN 1 END))
      OR g.team_b_timeouts_remaining != (5 - COUNT(CASE WHEN gt.team_id = g.team_b_id THEN 1 END))
      OR g.team_a_timeouts_remaining > 5
      OR g.team_b_timeouts_remaining > 5
    THEN 'NEEDS FIX'
    ELSE 'OK'
  END as status
FROM games g
LEFT JOIN game_timeouts gt ON gt.game_id = g.id
WHERE g.status IN ('in_progress', 'completed', 'scheduled')
GROUP BY g.id, g.team_a_id, g.team_b_id, g.team_a_timeouts_remaining, g.team_b_timeouts_remaining
ORDER BY status DESC, g.created_at DESC;

-- ----------------------------------------------------------------------------
-- STEP 2: Fix timeout counts for ALL games
-- ----------------------------------------------------------------------------
-- ⚠️ This will update ALL games to have correct timeout counts ⚠️
-- ⚠️ Based on actual timeout usage from game_timeouts table ⚠️
UPDATE games
SET 
  team_a_timeouts_remaining = GREATEST(0, LEAST(5, 
    COALESCE((
      SELECT 5 - COUNT(*)
      FROM game_timeouts
      WHERE game_timeouts.game_id = games.id 
        AND game_timeouts.team_id = games.team_a_id
    ), 5)  -- Default to 5 if no timeouts used
  )),
  team_b_timeouts_remaining = GREATEST(0, LEAST(5, 
    COALESCE((
      SELECT 5 - COUNT(*)
      FROM game_timeouts
      WHERE game_timeouts.game_id = games.id 
        AND game_timeouts.team_id = games.team_b_id
    ), 5)  -- Default to 5 if no timeouts used
  ))
WHERE status IN ('in_progress', 'completed', 'scheduled');

-- ----------------------------------------------------------------------------
-- STEP 3: Verify the fix worked
-- ----------------------------------------------------------------------------
SELECT 
  g.id as game_id,
  g.team_a_id,
  g.team_b_id,
  g.team_a_timeouts_remaining,
  g.team_b_timeouts_remaining,
  COUNT(CASE WHEN gt.team_id = g.team_a_id THEN 1 END) as team_a_used,
  COUNT(CASE WHEN gt.team_id = g.team_b_id THEN 1 END) as team_b_used,
  (5 - COUNT(CASE WHEN gt.team_id = g.team_a_id THEN 1 END)) as calculated_team_a,
  (5 - COUNT(CASE WHEN gt.team_id = g.team_b_id THEN 1 END)) as calculated_team_b,
  CASE 
    WHEN g.team_a_timeouts_remaining = (5 - COUNT(CASE WHEN gt.team_id = g.team_a_id THEN 1 END))
      AND g.team_b_timeouts_remaining = (5 - COUNT(CASE WHEN gt.team_id = g.team_b_id THEN 1 END))
      AND g.team_a_timeouts_remaining <= 5
      AND g.team_b_timeouts_remaining <= 5
    THEN '✅ CORRECT'
    ELSE '❌ STILL WRONG'
  END as verification
FROM games g
LEFT JOIN game_timeouts gt ON gt.game_id = g.id
WHERE g.status IN ('in_progress', 'completed', 'scheduled')
GROUP BY g.id, g.team_a_id, g.team_b_id, g.team_a_timeouts_remaining, g.team_b_timeouts_remaining
ORDER BY verification, g.created_at DESC;

-- ----------------------------------------------------------------------------
-- STEP 4: Check database default value (should be 5, not 7)
-- ----------------------------------------------------------------------------
SELECT 
  column_name,
  column_default,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'games'
  AND column_name IN ('team_a_timeouts_remaining', 'team_b_timeouts_remaining');

-- ----------------------------------------------------------------------------
-- STEP 5: Fix default value if it's wrong (should be 5, not 7)
-- ----------------------------------------------------------------------------
-- ⚠️ Only run this if Step 4 shows default is 7 instead of 5 ⚠️
/*
ALTER TABLE games 
  ALTER COLUMN team_a_timeouts_remaining SET DEFAULT 5,
  ALTER COLUMN team_b_timeouts_remaining SET DEFAULT 5;
*/

