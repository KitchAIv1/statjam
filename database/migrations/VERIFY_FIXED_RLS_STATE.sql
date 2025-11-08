-- ============================================================================
-- VERIFY FIXED RLS STATE - Run AFTER applying fix
-- ============================================================================
-- Purpose: Confirm users table RLS policies are working correctly
-- Date: November 7, 2025
-- Run these tests with different user roles to verify the fix
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TEST 1: Verify all 4 policies exist
-- ----------------------------------------------------------------------------
SELECT 
  policyname as policy_name,
  cmd as command_type,
  CASE 
    WHEN policyname LIKE '%admin%' THEN 'Admin policy'
    WHEN policyname LIKE '%own%' THEN 'Self-access policy'
    ELSE 'Other'
  END as policy_category
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- Expected output (4 policies):
-- ✅ users_admin_read_all (SELECT) - Admin policy
-- ✅ users_admin_update_all (UPDATE) - Admin policy
-- ✅ users_read_own_profile (SELECT) - Self-access policy
-- ✅ users_update_own_profile (UPDATE) - Self-access policy

-- ----------------------------------------------------------------------------
-- TEST 2: Player can read own profile
-- ----------------------------------------------------------------------------
-- Login as a PLAYER user and run this:
SELECT 
  id,
  name,
  email,
  role,
  premium_status,
  created_at,
  '✅ Player self-read SUCCESS' as test_result
FROM users 
WHERE id = auth.uid();

-- Expected: ✅ Returns exactly 1 row (your own profile)
-- If fails: Self-access policy not working

-- ----------------------------------------------------------------------------
-- TEST 3: Coach can read own profile
-- ----------------------------------------------------------------------------
-- Login as a COACH user and run this:
SELECT 
  id,
  name,
  email,
  role,
  created_at,
  '✅ Coach self-read SUCCESS' as test_result
FROM users 
WHERE id = auth.uid();

-- Expected: ✅ Returns exactly 1 row (your own profile)
-- If fails: Self-access policy not working

-- ----------------------------------------------------------------------------
-- TEST 4: Organizer can read own profile
-- ----------------------------------------------------------------------------
-- Login as an ORGANIZER user and run this:
SELECT 
  id,
  name,
  email,
  role,
  created_at,
  '✅ Organizer self-read SUCCESS' as test_result
FROM users 
WHERE id = auth.uid();

-- Expected: ✅ Returns exactly 1 row (your own profile)
-- If fails: Self-access policy not working

-- ----------------------------------------------------------------------------
-- TEST 5: Admin can read ALL users
-- ----------------------------------------------------------------------------
-- Login as an ADMIN user and run this:
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN role = 'player' THEN 1 END) as players,
  COUNT(CASE WHEN role = 'coach' THEN 1 END) as coaches,
  COUNT(CASE WHEN role = 'organizer' THEN 1 END) as organizers,
  COUNT(CASE WHEN role = 'stat_admin' THEN 1 END) as stat_admins,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
  '✅ Admin read-all SUCCESS' as test_result
FROM users;

-- Expected: ✅ Returns counts for all users in database
-- If fails: Admin policy not working or JWT role not set

-- ----------------------------------------------------------------------------
-- TEST 6: Player CANNOT read other users
-- ----------------------------------------------------------------------------
-- Login as a PLAYER user and run this:
SELECT 
  id,
  name,
  email
FROM users 
WHERE id != auth.uid()
LIMIT 5;

-- Expected: ✅ Returns 0 rows (blocked by RLS)
-- If returns data: Security breach - policies too permissive

-- ----------------------------------------------------------------------------
-- TEST 7: Player can update own profile
-- ----------------------------------------------------------------------------
-- Login as a PLAYER user and run this:
UPDATE users 
SET name = name -- No-op update to test permission
WHERE id = auth.uid()
RETURNING 
  id,
  name,
  '✅ Player self-update SUCCESS' as test_result;

-- Expected: ✅ Returns 1 row (your updated profile)
-- If fails: Self-update policy not working

-- ----------------------------------------------------------------------------
-- TEST 8: Player CANNOT update other users
-- ----------------------------------------------------------------------------
-- Login as a PLAYER user and run this:
UPDATE users 
SET name = 'HACKED'
WHERE id != auth.uid()
RETURNING id, name;

-- Expected: ✅ Returns 0 rows (blocked by RLS)
-- If returns data: Security breach - policies too permissive

-- ----------------------------------------------------------------------------
-- TEST 9: Admin can update any user
-- ----------------------------------------------------------------------------
-- Login as an ADMIN user and run this:
UPDATE users 
SET name = name -- No-op update to test permission
WHERE role = 'player'
LIMIT 1
RETURNING 
  id,
  name,
  role,
  '✅ Admin update-all SUCCESS' as test_result;

-- Expected: ✅ Returns 1 row (updated player profile)
-- If fails: Admin update policy not working

-- ----------------------------------------------------------------------------
-- TEST 10: Check JWT metadata contains role
-- ----------------------------------------------------------------------------
SELECT 
  auth.uid() as user_id,
  auth.jwt() -> 'user_metadata' ->> 'role' as role_from_jwt,
  (SELECT role FROM users WHERE id = auth.uid()) as role_from_db,
  CASE 
    WHEN (auth.jwt() -> 'user_metadata' ->> 'role') = (SELECT role FROM users WHERE id = auth.uid())
    THEN '✅ JWT role matches DB role'
    ELSE '❌ JWT role mismatch - need to sync'
  END as jwt_status;

-- Expected: ✅ JWT role matches DB role
-- If mismatch: Run script to sync role to JWT metadata

-- ============================================================================
-- FRONTEND VERIFICATION
-- ============================================================================
-- After SQL tests pass, verify in the app:

-- 1. Player Dashboard (/dashboard/player)
--    - Profile name, photo, stats should load
--    - Edit profile should work
--    - No errors in console

-- 2. Coach Dashboard (/dashboard/coach)
--    - Teams, games should load
--    - Create team should work
--    - No errors in console

-- 3. Organizer Dashboard (/dashboard)
--    - Tournaments, teams should load
--    - Create tournament should work
--    - No errors in console

-- 4. Admin Dashboard (/admin/dashboard)
--    - User list should load
--    - User stats should display
--    - No errors in console

-- ============================================================================
-- SUCCESS CRITERIA
-- ============================================================================
-- ✅ All 10 SQL tests pass
-- ✅ All 4 frontend dashboards load correctly
-- ✅ No console errors related to user data
-- ✅ Players/coaches/organizers can read/update own profile
-- ✅ Admins can read/update all users
-- ✅ Non-admins cannot read/update other users

SELECT '✅ Verification complete. Check results above.' as final_status;

