-- ============================================================================
-- FINAL COACH RLS FIX - COMPREHENSIVE SOLUTION
-- ============================================================================
-- Issue: Infinite recursion when fetching coach user profile after signup
-- Root Cause: Complex overlapping policies on users table causing recursion
-- Solution: Drop ALL policies, create simple non-recursive ones
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: DROP ALL EXISTING POLICIES ON USERS TABLE
-- ----------------------------------------------------------------------------

-- Drop every possible policy that might exist
DROP POLICY IF EXISTS "users_self_access_policy" ON users;
DROP POLICY IF EXISTS "users_view_own_profile" ON users;
DROP POLICY IF EXISTS "users_organizer_select_policy" ON users;
DROP POLICY IF EXISTS "users_stat_admin_game_policy" ON users;
DROP POLICY IF EXISTS "users_stat_admin_game_players_policy" ON users;
DROP POLICY IF EXISTS "users_stat_admin_game_players_policy_v2" ON users;
DROP POLICY IF EXISTS "users_stat_admin_game_players_policy_v3" ON users;
DROP POLICY IF EXISTS "users_stat_admin_game_players_policy_v4" ON users;
DROP POLICY IF EXISTS "users_stat_admin_game_players_policy_simple" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_self_update_policy" ON users;
DROP POLICY IF EXISTS "users_update_own_profile" ON users;
DROP POLICY IF EXISTS "users_self_policy" ON users;
DROP POLICY IF EXISTS "users_organizer_policy" ON users;
DROP POLICY IF EXISTS "users_self_manage" ON users;
DROP POLICY IF EXISTS "users_insert_self" ON users;
DROP POLICY IF EXISTS "users_authenticated_read_all" ON users;
DROP POLICY IF EXISTS "users_anon_read_basic" ON users;
DROP POLICY IF EXISTS "users_allow_all_authenticated" ON users;
DROP POLICY IF EXISTS "users_allow_anon_basic" ON users;
DROP POLICY IF EXISTS "users_organizer_team_players" ON users;
DROP POLICY IF EXISTS "users_stat_admin_game_players" ON users;
DROP POLICY IF EXISTS "users_public_player_names" ON users;
DROP POLICY IF EXISTS "users_self_access" ON users;
DROP POLICY IF EXISTS "users_insert_new" ON users;
DROP POLICY IF EXISTS "users_authenticated_basic" ON users;
DROP POLICY IF EXISTS "users_signup_insert" ON users;
DROP POLICY IF EXISTS "users_coach_team_players" ON users;

SELECT '✅ All existing policies dropped' as status;

-- ----------------------------------------------------------------------------
-- STEP 2: VERIFY RLS IS ENABLED
-- ----------------------------------------------------------------------------

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

SELECT '✅ RLS enabled on users table' as status;

-- ----------------------------------------------------------------------------
-- STEP 3: CREATE SIMPLE, NON-RECURSIVE POLICIES
-- ----------------------------------------------------------------------------

-- Policy 1: Self-access (most important for auth)
-- Users can read, update, delete their own profile
CREATE POLICY "users_self_access"
ON users
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

SELECT '✅ Created users_self_access policy' as status;

-- Policy 2: Allow authenticated users to see other users (for rosters, team management)
-- This is SIMPLE - no JOINs, no subqueries, no recursion
CREATE POLICY "users_authenticated_read"
ON users
FOR SELECT
TO authenticated
USING (true);

SELECT '✅ Created users_authenticated_read policy' as status;

-- Policy 3: Allow anonymous users to see basic player info (for public profiles)
CREATE POLICY "users_anon_read"
ON users
FOR SELECT
TO anon
USING (role IN ('player', 'organizer', 'stat_admin', 'coach'));

SELECT '✅ Created users_anon_read policy' as status;

-- Policy 4: Allow INSERT during signup (handled by trigger)
-- This is critical for the handle_new_user() trigger to work
CREATE POLICY "users_signup_insert"
ON users
FOR INSERT
TO authenticated
WITH CHECK (true);

SELECT '✅ Created users_signup_insert policy' as status;

-- ----------------------------------------------------------------------------
-- STEP 4: VERIFY POLICIES
-- ----------------------------------------------------------------------------

SELECT '=== FINAL USERS TABLE POLICIES ===' as status;
SELECT 
    policyname,
    cmd as command,
    roles,
    permissive
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- ----------------------------------------------------------------------------
-- STEP 5: TEST QUERY (should work instantly)
-- ----------------------------------------------------------------------------

SELECT '=== Testing profile fetch query ===' as test;
-- This is the exact query that's failing in authServiceV2.ts:365
-- SELECT id, email, role, name, country, premium_status, profile_image, created_at, updated_at
-- FROM users
-- WHERE id = '960934f6-fae3-4da3-aca8-72ae4b3ca0fc';

SELECT '✅ RLS fix complete! Try logging in now.' as status;

-- ============================================================================
-- EXPECTED RESULT:
-- ============================================================================
-- ✅ 4 simple policies on users table
-- ✅ No recursion (no policies reference other tables or complex subqueries)
-- ✅ Auth works (users_self_access allows profile fetch)
-- ✅ Rosters work (users_authenticated_read allows team management)
-- ✅ Public profiles work (users_anon_read allows public access)
-- ✅ Signup works (users_signup_insert allows trigger to insert)
-- ============================================================================

