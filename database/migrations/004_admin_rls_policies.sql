-- ============================================================================
-- ADMIN RLS POLICIES
-- ============================================================================
-- Purpose: Enable admin access to all users for management and support
-- Date: November 6, 2025
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- ADMIN RLS POLICIES FOR USERS TABLE
-- ----------------------------------------------------------------------------

-- Policy 1: Admin can read all users
CREATE POLICY IF NOT EXISTS "users_admin_read_all" ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy 2: Admin can update any user
CREATE POLICY IF NOT EXISTS "users_admin_update_all" ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ----------------------------------------------------------------------------
-- VERIFICATION
-- ----------------------------------------------------------------------------

SELECT '✅ Admin RLS policies created successfully' as status;

-- List all admin policies
SELECT 
  policyname,
  cmd as command,
  roles
FROM pg_policies 
WHERE tablename = 'users'
AND policyname LIKE '%admin%'
ORDER BY policyname;

COMMIT;

