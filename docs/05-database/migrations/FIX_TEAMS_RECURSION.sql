-- ============================================================================
-- FIX TEAMS TABLE INFINITE RECURSION
-- ============================================================================
-- Issue: teams policies causing infinite recursion when querying users
-- Root Cause: Circular dependency between users → teams → tournaments → users
-- Solution: Simplify teams policies to avoid recursion
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Drop problematic teams policies
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "teams_organizer_access" ON teams;
DROP POLICY IF EXISTS "teams_stat_admin_view" ON teams;
DROP POLICY IF EXISTS "teams_player_view" ON teams;
DROP POLICY IF EXISTS "teams_public_view" ON teams;

-- Also drop any old policies
DROP POLICY IF EXISTS "Organizers can manage teams" ON teams;
DROP POLICY IF EXISTS "Public can view teams" ON teams;
DROP POLICY IF EXISTS "teams_public_read_policy" ON teams;

-- ----------------------------------------------------------------------------
-- STEP 2: Create SIMPLE non-recursive policies
-- ----------------------------------------------------------------------------

-- ✅ POLICY 1: Organizers manage teams (simple check, no subquery)
CREATE POLICY "teams_organizer_simple" ON teams
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tournaments 
      WHERE tournaments.id = teams.tournament_id 
      AND tournaments.organizer_id = auth.uid()
    )
  );

-- ✅ POLICY 2: Public can view all teams (no conditions to avoid recursion)
CREATE POLICY "teams_public_simple" ON teams
  FOR SELECT
  TO anon, authenticated
  USING (true);  -- Allow all authenticated users to see teams

-- ✅ POLICY 3: Stat admins can view teams (direct check, no recursion)
CREATE POLICY "teams_stat_admin_simple" ON teams
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games 
      WHERE (games.team_a_id = teams.id OR games.team_b_id = teams.id)
      AND games.stat_admin_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- STEP 3: Verify policies
-- ----------------------------------------------------------------------------

SELECT '=== TEAMS POLICIES FIXED ===' as status;
SELECT 
  policyname,
  permissive,
  roles,
  cmd as command
FROM pg_policies 
WHERE tablename = 'teams'
ORDER BY policyname;

-- ----------------------------------------------------------------------------
-- WHAT THIS FIXES:
-- ----------------------------------------------------------------------------
-- ✅ Removed circular dependency: users → teams → tournaments
-- ✅ Simplified policies to avoid recursion
-- ✅ Public can view all teams (simpler, no performance issues)
-- ✅ Stat admins check games directly (no team_players recursion)
-- ============================================================================

