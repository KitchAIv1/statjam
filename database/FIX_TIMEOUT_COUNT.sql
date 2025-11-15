-- ============================================================================
-- FIX TIMEOUT COUNT - Manual Correction Query
-- ============================================================================
-- Purpose: Fix timeout counts based on actual timeout usage
-- Use this if the database is out of sync with actual timeout events
-- ============================================================================

-- Replace 'YOUR_GAME_ID_HERE' with your actual game ID
-- Replace 'c0be73bf-22b8-444e-ae5e-c1a987083535' with your game ID

-- ----------------------------------------------------------------------------
-- STEP 1: Calculate correct timeout counts from game_timeouts table
-- ----------------------------------------------------------------------------
WITH timeout_counts AS (
  SELECT 
    game_id,
    team_id,
    COUNT(*) as timeouts_used
  FROM game_timeouts
  WHERE game_id = 'c0be73bf-22b8-444e-ae5e-c1a987083535'  -- Replace with your game ID
  GROUP BY game_id, team_id
),
game_teams AS (
  SELECT 
    id as game_id,
    team_a_id,
    team_b_id
  FROM games
  WHERE id = 'c0be73bf-22b8-444e-ae5e-c1a987083535'  -- Replace with your game ID
)
SELECT 
  gt.game_id,
  gt.team_a_id,
  gt.team_b_id,
  COALESCE(ta.timeouts_used, 0) as team_a_timeouts_used,
  COALESCE(tb.timeouts_used, 0) as team_b_timeouts_used,
  (5 - COALESCE(ta.timeouts_used, 0)) as correct_team_a_timeouts,
  (5 - COALESCE(tb.timeouts_used, 0)) as correct_team_b_timeouts
FROM game_teams gt
LEFT JOIN timeout_counts ta ON ta.game_id = gt.game_id AND ta.team_id = gt.team_a_id
LEFT JOIN timeout_counts tb ON tb.game_id = gt.game_id AND tb.team_id = gt.team_b_id;

-- ----------------------------------------------------------------------------
-- STEP 2: Update the games table with correct timeout counts
-- ----------------------------------------------------------------------------
-- ⚠️ UNCOMMENT AND RUN THIS AFTER VERIFYING STEP 1 RESULTS ⚠️
/*
UPDATE games
SET 
  team_a_timeouts_remaining = (
    SELECT 5 - COUNT(*)
    FROM game_timeouts
    WHERE game_timeouts.game_id = games.id 
      AND game_timeouts.team_id = games.team_a_id
  ),
  team_b_timeouts_remaining = (
    SELECT 5 - COUNT(*)
    FROM game_timeouts
    WHERE game_timeouts.game_id = games.id 
      AND game_timeouts.team_id = games.team_b_id
  )
WHERE id = 'c0be73bf-22b8-444e-ae5e-c1a987083535';  -- Replace with your game ID
*/

-- ----------------------------------------------------------------------------
-- STEP 3: Verify the fix worked
-- ----------------------------------------------------------------------------
SELECT 
  g.id,
  g.team_a_id,
  g.team_b_id,
  g.team_a_timeouts_remaining,
  g.team_b_timeouts_remaining,
  COUNT(CASE WHEN gt.team_id = g.team_a_id THEN 1 END) as team_a_timeouts_used,
  COUNT(CASE WHEN gt.team_id = g.team_b_id THEN 1 END) as team_b_timeouts_used,
  (5 - COUNT(CASE WHEN gt.team_id = g.team_a_id THEN 1 END)) as calculated_team_a,
  (5 - COUNT(CASE WHEN gt.team_id = g.team_b_id THEN 1 END)) as calculated_team_b
FROM games g
LEFT JOIN game_timeouts gt ON gt.game_id = g.id
WHERE g.id = 'c0be73bf-22b8-444e-ae5e-c1a987083535'  -- Replace with your game ID
GROUP BY g.id, g.team_a_id, g.team_b_id, g.team_a_timeouts_remaining, g.team_b_timeouts_remaining;

-- ----------------------------------------------------------------------------
-- STEP 4: Fix ALL games with incorrect timeout counts
-- ----------------------------------------------------------------------------
-- ⚠️ USE WITH CAUTION - This will update ALL games ⚠️
/*
UPDATE games
SET 
  team_a_timeouts_remaining = GREATEST(0, LEAST(5, 
    COALESCE((
      SELECT 5 - COUNT(*)
      FROM game_timeouts
      WHERE game_timeouts.game_id = games.id 
        AND game_timeouts.team_id = games.team_a_id
    ), 5)
  )),
  team_b_timeouts_remaining = GREATEST(0, LEAST(5, 
    COALESCE((
      SELECT 5 - COUNT(*)
      FROM game_timeouts
      WHERE game_timeouts.game_id = games.id 
        AND game_timeouts.team_id = games.team_b_id
    ), 5)
  ))
WHERE team_a_timeouts_remaining IS NULL 
   OR team_b_timeouts_remaining IS NULL
   OR team_a_timeouts_remaining > 5
   OR team_b_timeouts_remaining > 5;
*/

