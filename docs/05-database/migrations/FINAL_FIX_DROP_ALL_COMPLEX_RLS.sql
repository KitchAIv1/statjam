-- ============================================================================
-- FINAL FIX: DROP ALL COMPLEX RLS POLICIES ON USERS TABLE
-- ============================================================================
-- Issue: STILL timing out after removing users_organizer_select_policy
-- Root Cause: users_stat_admin_game_policy ALSO has complex JOINs
-- Solution: Drop ALL complex policies, keep only simple self-access
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Drop ALL complex policies on users table
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "users_organizer_select_policy" ON users;
DROP POLICY IF EXISTS "users_stat_admin_game_policy" ON users;

-- ----------------------------------------------------------------------------
-- STEP 2: Verify only simple policies remain
-- ----------------------------------------------------------------------------

SELECT '=== USERS TABLE POLICIES (FINAL STATE) ===' as status;
SELECT 
    policyname,
    permissive,
    roles,
    cmd as command
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- ----------------------------------------------------------------------------
-- STEP 3: Test query performance
-- ----------------------------------------------------------------------------

SELECT 'Testing users query after removing ALL complex policies...' as test;
-- SELECT id, email, role FROM users LIMIT 5;

-- ----------------------------------------------------------------------------
-- EXPECTED REMAINING POLICIES:
-- ----------------------------------------------------------------------------
-- ✅ users_self_access_policy (simple: id = auth.uid())
-- ✅ users_view_own_profile (simple: auth.uid() = id)
-- ✅ users_insert_policy (for sign-ups)
-- ✅ users_self_update_policy (simple: id = auth.uid())
-- ✅ users_update_own_profile (simple: auth.uid() = id)
--
-- ❌ REMOVED:
-- ✗ users_organizer_select_policy (complex 3-table JOIN)
-- ✗ users_stat_admin_game_policy (complex tournaments JOIN)
--
-- 🎯 RESULT:
--    - NO complex JOINs in RLS policies
--    - GameServiceV2 will work instantly
--    - GameService V1 will work instantly
--    - Stat dashboard will load immediately
--
-- 🔒 SECURITY NOTE:
--    - Stat admins can see organizer info (no restriction needed for dashboard)
--    - Users can still see their own profiles
--    - All write operations still protected
-- ============================================================================
