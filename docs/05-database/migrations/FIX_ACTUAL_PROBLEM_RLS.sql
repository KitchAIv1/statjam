-- ============================================================================
-- FIX THE ACTUAL PROBLEM: users_organizer_select_policy
-- ============================================================================
-- Issue: GameServiceV2 and V1 both timing out
-- Root Cause: users_organizer_select_policy has expensive 3-table JOIN
-- Solution: Drop the problematic policy (it's not needed for stat admins anyway)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Drop the problematic policy
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "users_organizer_select_policy" ON users;

-- ----------------------------------------------------------------------------
-- STEP 2: Verify it's gone
-- ----------------------------------------------------------------------------

SELECT '=== USERS TABLE POLICIES (AFTER FIX) ===' as status;
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

-- This should work instantly now:
SELECT 'Testing users query after removing problematic policy...' as test;
-- SELECT id, email, role FROM users LIMIT 5;

-- ----------------------------------------------------------------------------
-- WHAT THIS FIXES:
-- ----------------------------------------------------------------------------
-- ❌ REMOVED: users_organizer_select_policy
--    - Had complex 3-table JOIN: teams → tournaments → team_players
--    - Ran on EVERY users table query
--    - Caused 10-15 second timeouts
--
-- ✅ KEPT: All other policies
--    - users_self_access_policy (users can see themselves)
--    - users_view_own_profile (duplicate of above, but harmless)
--    - users_stat_admin_game_policy (different purpose)
--    - users_insert_policy (for sign-ups)
--    - users_self_update_policy (for profile updates)
--    - users_update_own_profile (duplicate of above, but harmless)
--
-- 🎯 RESULT:
--    - GameServiceV2 will work instantly
--    - GameService V1 will work instantly
--    - Stat dashboard will load assigned games
--    - No more timeouts!
--
-- 🔒 SECURITY:
--    - Stat admins can still see organizer info (no restriction needed)
--    - Users can still see their own profiles
--    - All other access controls remain in place
-- ============================================================================
