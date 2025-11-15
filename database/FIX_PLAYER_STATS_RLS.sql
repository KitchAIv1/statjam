-- ============================================================================
-- FIX PLAYER STATS RLS - Allow players to see ALL games with their stats
-- ============================================================================
-- Purpose: Fix discrepancy where production shows fewer games than local dev
-- Issue: RLS policy filters out coach games from practice teams
-- Solution: Update RLS to allow players to see all games where they have stats
-- ============================================================================

-- STEP 1: Check current function definition
-- ============================================================================
SELECT 
    proname,
    prosrc
FROM pg_proc
WHERE proname = 'player_has_game_stats_official';

-- This shows the current function logic


-- STEP 2: Create updated function that allows ALL games with stats
-- ============================================================================
-- ✅ FIX: Allow players to see ALL games where they have stats
-- This matches local dev behavior and ensures consistency
CREATE OR REPLACE FUNCTION player_has_game_stats_official(
  p_player_id uuid, 
  p_game_id uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  -- ✅ FIX: Simply check if player has stats for this game
  -- Removed the official team filter to match local dev behavior
  SELECT EXISTS (
    SELECT 1 FROM game_stats gs
    WHERE gs.player_id = p_player_id 
    AND gs.game_id = p_game_id
  );
$$;

-- STEP 3: Verify the function was updated
-- ============================================================================
SELECT 
    proname,
    prosrc
FROM pg_proc
WHERE proname = 'player_has_game_stats_official';

-- Should show the simplified function that only checks game_stats existence


-- STEP 4: Test the function with the player's game IDs
-- ============================================================================
SELECT 
    g.id as game_id,
    g.status,
    player_has_game_stats_official('0e0530d5-ca39-466c-8f66-e3e08c69b4f9', g.id) as has_access
FROM games g
WHERE g.id IN (
    SELECT DISTINCT game_id 
    FROM game_stats 
    WHERE player_id = '0e0530d5-ca39-466c-8f66-e3e08c69b4f9'
)
ORDER BY g.created_at DESC;

-- Expected: All 18 games should return has_access = true


-- ============================================================================
-- ALTERNATIVE: If you want to keep official team filtering but make it optional
-- ============================================================================
-- Option A: Keep current behavior but allow override for player dashboard
-- This would require updating the frontend to use a different query path
--
-- Option B: Update RLS to allow both official AND games with stats
-- This is what we're doing above (simpler, matches local dev)
--
-- Option C: Mark coach teams as official (if that's the desired behavior)
-- UPDATE teams SET is_official_team = TRUE WHERE coach_id IS NOT NULL;
-- But this might not be desired if coaches want practice games excluded
--
-- ============================================================================
-- RECOMMENDATION
-- ============================================================================
-- The fix above (Option B) is recommended because:
-- 1. Matches local dev behavior (consistency)
-- 2. Players should see ALL their stats (transparency)
-- 3. If coaches want to exclude practice games, they can do so in their own analytics
-- 4. Simpler logic = fewer bugs
--
-- If you want to keep official team filtering for other purposes (like leaderboards),
-- you can add that filtering at the application level, not RLS level.
-- ============================================================================

