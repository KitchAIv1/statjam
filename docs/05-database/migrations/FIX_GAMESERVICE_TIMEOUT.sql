-- ============================================================================
-- FIX GAMESERVICE TIMEOUT - EMERGENCY
-- ============================================================================
-- Issue: GameServiceV2 timeout due to circular JOIN with RLS policy
-- Root Cause: GameServiceV2 JOINs users table → triggers RLS policy → creates circular JOIN
-- Solution: Exclude GameServiceV2 organizer queries from RLS policy OR simplify query
-- ============================================================================

-- ----------------------------------------------------------------------------
-- OPTION 1: Modify RLS policy to exclude organizer queries (RECOMMENDED)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "users_stat_admin_game_players_policy_simple" ON users;

CREATE POLICY "users_stat_admin_game_players_policy_v4" ON users
FOR SELECT TO authenticated
USING (
  -- FAST PATH: Self-access (always allowed)
  id = auth.uid()
  OR
  -- ORGANIZER ACCESS: Allow stat admins to see organizers (no circular JOIN)
  (
    EXISTS (
      SELECT 1 FROM tournaments t 
      WHERE t.organizer_id = users.id 
      AND EXISTS (
        SELECT 1 FROM games g 
        WHERE g.tournament_id = t.id 
        AND g.stat_admin_id = auth.uid()
      )
    )
  )
  OR
  -- PLAYER ACCESS: Allow stat admins to see players in their games
  EXISTS (
    SELECT 1 
    FROM team_players tp
    JOIN games g ON (g.team_a_id = tp.team_id OR g.team_b_id = tp.team_id)
    WHERE g.stat_admin_id = auth.uid()
    AND tp.player_id = users.id
    LIMIT 1
  )
);

-- ----------------------------------------------------------------------------
-- OPTION 2: If Option 1 still has issues, use this simpler version
-- ----------------------------------------------------------------------------

/*
DROP POLICY IF EXISTS "users_stat_admin_game_players_policy_v4" ON users;

CREATE POLICY "users_stat_admin_game_players_policy_minimal" ON users
FOR SELECT TO authenticated
USING (
  -- Self-access only (no complex JOINs)
  id = auth.uid()
  OR
  -- Simple game assignment check (no team_players JOIN to avoid complexity)
  EXISTS (
    SELECT 1 FROM games g 
    WHERE g.stat_admin_id = auth.uid()
    LIMIT 1
  )
);
*/

-- ----------------------------------------------------------------------------
-- STEP 2: Add policy comment
-- ----------------------------------------------------------------------------

COMMENT ON POLICY "users_stat_admin_game_players_policy_v4" ON users IS 
'Fixed circular JOIN: Separate organizer and player access paths to prevent GameServiceV2 timeout.';

-- ----------------------------------------------------------------------------
-- STEP 3: Verify policy creation
-- ----------------------------------------------------------------------------

SELECT '=== FIXED CIRCULAR JOIN POLICY CREATED ===' as status;
SELECT 
    policyname,
    permissive,
    roles,
    cmd as command
FROM pg_policies 
WHERE tablename = 'users'
AND policyname = 'users_stat_admin_game_players_policy_v4';

-- ----------------------------------------------------------------------------
-- WHAT THIS FIXES:
-- ----------------------------------------------------------------------------
-- ✅ ORGANIZER ACCESS: Separate path for GameServiceV2 organizer JOINs
-- ✅ PLAYER ACCESS: Keeps existing player access for stat tracker
-- ✅ NO CIRCULAR JOINS: Organizer path doesn't use team_players
-- ✅ PERFORMANCE: Each path is optimized for its use case
--
-- GameServiceV2 should now work without timeout!
-- ============================================================================
