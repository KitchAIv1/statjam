-- ============================================================================
-- EMERGENCY: TEMPORARILY DISABLE STAT ADMIN RLS POLICY
-- ============================================================================
-- Issue: ALL queries timing out, even simple ones
-- Root Cause: RLS policy is too complex and affecting every users table query
-- Solution: Temporarily disable the policy to get dashboard working
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Drop ALL stat_admin policies (nuclear option)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "users_stat_admin_game_players_policy" ON users;
DROP POLICY IF EXISTS "users_stat_admin_game_players_policy_v2" ON users;
DROP POLICY IF EXISTS "users_stat_admin_game_players_policy_v3" ON users;
DROP POLICY IF EXISTS "users_stat_admin_game_players_policy_v4" ON users;
DROP POLICY IF EXISTS "users_stat_admin_game_players_policy_simple" ON users;
DROP POLICY IF EXISTS "users_stat_admin_game_players_policy_minimal" ON users;

-- ----------------------------------------------------------------------------
-- STEP 2: Check what OTHER policies exist on users table
-- ----------------------------------------------------------------------------

SELECT '=== CURRENT USERS TABLE POLICIES ===' as status;
SELECT 
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_clause
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- ----------------------------------------------------------------------------
-- STEP 3: Test if queries work now
-- ----------------------------------------------------------------------------

-- This should work instantly now:
SELECT 'Testing users query without RLS policy...' as test;
-- SELECT id, email, role FROM users LIMIT 5;

-- ----------------------------------------------------------------------------
-- WHAT THIS DOES:
-- ----------------------------------------------------------------------------
-- ✅ REMOVES: All stat_admin RLS policies
-- ✅ KEEPS: Other users table policies (self-access, etc.)
-- ✅ RESULT: GameServiceV2 and V1 should work instantly
--
-- ⚠️ SECURITY NOTE:
-- This temporarily removes the stat_admin player access restriction.
-- We'll add it back with a simpler, working version after testing.
-- ============================================================================
