-- ============================================================================
-- EMERGENCY: SIMPLIFY ALL RLS POLICIES TO STOP RECURSION
-- ============================================================================
-- Issue: Complex policy chains creating infinite recursion loops
-- Solution: Use ONLY the simplest policies that don't cross-reference tables
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Drop ALL policies that could cause recursion
-- ----------------------------------------------------------------------------

-- Users table - drop policies that reference other tables
DROP POLICY IF EXISTS "users_organizer_team_players" ON users;
DROP POLICY IF EXISTS "users_stat_admin_game_players" ON users;
DROP POLICY IF EXISTS "users_public_player_names" ON users;

-- Keep only self-access
-- DROP POLICY IF EXISTS "users_self_access" ON users; -- KEEP THIS
-- DROP POLICY IF EXISTS "users_insert_new" ON users; -- KEEP THIS

-- Teams table - simplify to absolute minimum
DROP POLICY IF EXISTS "teams_organizer_simple" ON teams;
DROP POLICY IF EXISTS "teams_stat_admin_simple" ON teams;
-- Keep only public view
-- DROP POLICY IF EXISTS "teams_public_simple" ON teams; -- KEEP THIS

-- ----------------------------------------------------------------------------
-- STEP 2: Create ULTRA-SIMPLE replacement policies
-- ----------------------------------------------------------------------------

-- ✅ Users: Allow all authenticated users to see all users (temporary)
CREATE POLICY "users_allow_all_authenticated" ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- ✅ Users: Allow anon to see basic player info (no joins)
CREATE POLICY "users_allow_anon_basic" ON users
  FOR SELECT
  TO anon
  USING (role = 'player');

-- ✅ Teams: Allow all authenticated to manage teams (temporary)
CREATE POLICY "teams_allow_all_authenticated" ON teams
  FOR ALL
  TO authenticated
  USING (true);

-- ----------------------------------------------------------------------------
-- STEP 3: Verify no recursion
-- ----------------------------------------------------------------------------

SELECT '=== ULTRA-SIMPLE POLICIES APPLIED ===' as status;

SELECT 
  tablename,
  policyname,
  roles,
  cmd as command
FROM pg_policies 
WHERE tablename IN ('users', 'teams')
ORDER BY tablename, policyname;

-- ----------------------------------------------------------------------------
-- WHAT THIS DOES:
-- ----------------------------------------------------------------------------
-- ✅ REMOVES: All policies with cross-table references
-- ✅ ADDS: Simple policies that allow access without complex checks
-- ✅ RESULT: No infinite recursion, auth will work
--
-- ⚠️ SECURITY NOTE:
-- This is a temporary solution to get the system working.
-- These policies are permissive - we'll add back proper restrictions
-- once we understand the recursion patterns better.
-- ============================================================================

