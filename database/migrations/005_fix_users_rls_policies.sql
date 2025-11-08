-- ============================================================================
-- FIX USERS TABLE RLS POLICIES - Apply AFTER verifying current state
-- ============================================================================
-- Purpose: Fix infinite recursion in admin policies and add missing self-access
-- Date: November 7, 2025
-- Issue: Admin policies use recursive subquery causing infinite loop
-- Solution: Use JWT-based checks + add missing self-access policies
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- STEP 1: Remove broken recursive policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "users_admin_read_all" ON users;
DROP POLICY IF EXISTS "users_admin_update_all" ON users;

SELECT '✅ Dropped broken recursive admin policies' as status;

-- ----------------------------------------------------------------------------
-- STEP 2: Create non-recursive admin policies using JWT metadata
-- ----------------------------------------------------------------------------
-- These policies check role from JWT token, avoiding recursion

CREATE POLICY "users_admin_read_all" ON users
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "users_admin_update_all" ON users
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

SELECT '✅ Created non-recursive admin policies (JWT-based)' as status;

-- ----------------------------------------------------------------------------
-- STEP 3: Add missing self-access policies (CRITICAL)
-- ----------------------------------------------------------------------------
-- These policies were never created, causing all users to be blocked

CREATE POLICY "users_read_own_profile" ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "users_update_own_profile" ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

SELECT '✅ Created self-access policies for all users' as status;

-- ----------------------------------------------------------------------------
-- STEP 4: Verify new policies were created
-- ----------------------------------------------------------------------------
SELECT 
  policyname as policy_name,
  cmd as command_type,
  roles
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- Expected output:
-- 1. users_admin_read_all (SELECT) - authenticated
-- 2. users_admin_update_all (UPDATE) - authenticated
-- 3. users_read_own_profile (SELECT) - authenticated
-- 4. users_update_own_profile (UPDATE) - authenticated

-- ----------------------------------------------------------------------------
-- STEP 5: Test self-access (run as non-admin user)
-- ----------------------------------------------------------------------------
-- This should now work for players, coaches, organizers
SELECT 
  id,
  name,
  email,
  role,
  'Self-access test passed' as test_result
FROM users 
WHERE id = auth.uid();

-- Expected: ✅ Returns your own user row

COMMIT;

-- ============================================================================
-- POST-FIX VERIFICATION
-- ============================================================================
-- Run these queries AFTER applying this fix:

-- Test 1: Player can read own profile
-- SELECT id, name, email FROM users WHERE id = auth.uid();
-- Expected: ✅ Returns player's row

-- Test 2: Coach can read own profile  
-- SELECT id, name, email FROM users WHERE id = auth.uid();
-- Expected: ✅ Returns coach's row

-- Test 3: Admin can read all users
-- SELECT COUNT(*) FROM users;
-- Expected: ✅ Returns total user count

-- Test 4: Player cannot read other users
-- SELECT id, name FROM users WHERE id != auth.uid();
-- Expected: ✅ Returns empty (blocked by RLS)

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if something goes wrong)
-- ============================================================================
-- If fix causes issues, run this to revert:
/*
BEGIN;
DROP POLICY IF EXISTS "users_admin_read_all" ON users;
DROP POLICY IF EXISTS "users_admin_update_all" ON users;
DROP POLICY IF EXISTS "users_read_own_profile" ON users;
DROP POLICY IF EXISTS "users_update_own_profile" ON users;

-- EMERGENCY ONLY: Temporarily disable RLS
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
COMMIT;
*/

SELECT '✅ RLS policies fixed successfully. Run verification tests.' as final_status;

