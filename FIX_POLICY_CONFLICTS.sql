-- ============================================================================
-- FIX RLS POLICY CONFLICTS - REMOVE DUPLICATES AND CONFLICTING POLICIES
-- ============================================================================
-- Issue: Multiple conflicting policies blocking anon access to games
-- Solution: Keep only the necessary policies, remove duplicates and conflicts
-- ============================================================================

-- ----------------------------------------------------------------------------
-- REMOVE DUPLICATE POLICY
-- ----------------------------------------------------------------------------

-- Remove the duplicate "public_view_games" policy (same as games_public_read_policy)
DROP POLICY IF EXISTS "public_view_games" ON games;

-- ----------------------------------------------------------------------------
-- FIX PLAYER POLICY - EXCLUDE ANON USERS
-- ----------------------------------------------------------------------------

-- The games_player_policy is blocking anon users because auth.uid() is null
-- Modify it to only apply to authenticated users
DROP POLICY IF EXISTS "games_player_policy" ON games;

-- Recreate player policy for authenticated users only
CREATE POLICY "games_player_policy" ON games
  FOR SELECT
  TO authenticated  -- Only authenticated users, not anon
  USING (
    (team_a_id IN ( 
      SELECT team_players.team_id
      FROM team_players
      WHERE (team_players.player_id = auth.uid())
    )) OR (team_b_id IN ( 
      SELECT team_players.team_id
      FROM team_players
      WHERE (team_players.player_id = auth.uid())
    ))
  );

-- ----------------------------------------------------------------------------
-- ENSURE CLEAN ANON ACCESS
-- ----------------------------------------------------------------------------

-- Now anon users only have games_public_read_policy (public tournaments)
-- This should work for the live viewer

-- ----------------------------------------------------------------------------
-- VERIFICATION
-- ----------------------------------------------------------------------------

-- Check remaining policies
SELECT 
  'REMAINING GAMES POLICIES' as section,
  policyname,
  roles,
  cmd,
  qual as using_clause
FROM pg_policies 
WHERE tablename = 'games'
ORDER BY policyname;

-- Test anon access again
SELECT 'TESTING ANON ACCESS AFTER FIX' as test;
SET ROLE anon;
SELECT COUNT(*) as games_accessible_to_anon FROM games LIMIT 1;
RESET ROLE;

SELECT 'POLICY CONFLICTS RESOLVED' as status;
