-- ============================================================================
-- VERIFY CURRENT RLS STATE - Run BEFORE applying fix
-- ============================================================================
-- Purpose: Diagnose the current broken state of users table RLS policies
-- Date: November 7, 2025
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Check if RLS is enabled on users table
-- ----------------------------------------------------------------------------
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'users';

-- Expected: rls_enabled = true
-- If false, RLS is not enabled at all (different problem)

-- ----------------------------------------------------------------------------
-- STEP 2: List ALL current policies on users table
-- ----------------------------------------------------------------------------
SELECT 
  policyname as policy_name,
  cmd as command_type,
  qual as using_expression,
  with_check as with_check_expression,
  roles
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- Expected output:
-- 1. users_admin_read_all (SELECT) - BROKEN (recursive)
-- 2. users_admin_update_all (UPDATE) - BROKEN (recursive)
-- Missing: users_read_own_profile
-- Missing: users_update_own_profile

-- ----------------------------------------------------------------------------
-- STEP 3: Test if current user can read their own profile
-- ----------------------------------------------------------------------------
-- Run this as a PLAYER, COACH, or ORGANIZER user (NOT admin)
SELECT 
  id,
  name,
  email,
  role,
  created_at
FROM users 
WHERE id = auth.uid();

-- Expected: ❌ FAILS with error or returns nothing (infinite recursion)
-- This confirms the bug

-- ----------------------------------------------------------------------------
-- STEP 4: Check auth.uid() is working
-- ----------------------------------------------------------------------------
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role;

-- Expected: Returns your user ID and 'authenticated'
-- If this fails, auth system is broken (different problem)

-- ----------------------------------------------------------------------------
-- STEP 5: Test admin policy recursion (if you have admin access)
-- ----------------------------------------------------------------------------
-- Run this as an ADMIN user
SELECT 
  id,
  name,
  role
FROM users 
LIMIT 5;

-- Expected: ❌ FAILS or times out (infinite recursion in policy check)

-- ----------------------------------------------------------------------------
-- STEP 6: Check if user_metadata contains role
-- ----------------------------------------------------------------------------
SELECT 
  auth.jwt() -> 'user_metadata' as user_metadata,
  auth.jwt() -> 'user_metadata' ->> 'role' as role_from_jwt
FROM users
WHERE id = auth.uid()
LIMIT 1;

-- Expected: Shows if role is stored in JWT metadata
-- If role_from_jwt is NULL, we need to sync role to JWT

-- ----------------------------------------------------------------------------
-- STEP 7: Count total policies on users table
-- ----------------------------------------------------------------------------
SELECT 
  COUNT(*) as total_policies,
  COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as select_policies,
  COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) as update_policies,
  COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as insert_policies,
  COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) as delete_policies
FROM pg_policies 
WHERE tablename = 'users';

-- Expected: 
-- total_policies = 2 (only admin policies)
-- select_policies = 1 (admin read)
-- update_policies = 1 (admin update)
-- insert_policies = 0
-- delete_policies = 0

-- ----------------------------------------------------------------------------
-- DIAGNOSIS SUMMARY
-- ----------------------------------------------------------------------------
-- If STEP 3 fails: RLS policies are blocking user self-access (THE BUG)
-- If STEP 5 fails: Admin policies have infinite recursion (THE BUG)
-- If STEP 6 shows NULL role: Need to sync role to JWT metadata
-- If STEP 2 shows only 2 policies: Missing self-access policies (THE BUG)

-- ============================================================================
-- NEXT STEPS
-- ============================================================================
-- 1. If STEP 3 fails → Apply fix in 005_fix_users_rls_policies.sql
-- 2. If STEP 6 shows NULL → Run sync script to update JWT metadata
-- 3. After fix, run VERIFY_FIXED_RLS_STATE.sql to confirm

SELECT '✅ Verification queries complete. Review results above.' as status;

