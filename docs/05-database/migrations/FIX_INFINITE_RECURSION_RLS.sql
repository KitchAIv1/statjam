-- ============================================================================
-- FIX INFINITE RECURSION IN RLS POLICY - EMERGENCY
-- ============================================================================
-- Issue: "infinite recursion detected in policy for relation 'users'"
-- Root Cause: Policy queries users table from within users table policy
-- Solution: Remove recursive users table check, use auth.jwt() instead
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Drop the problematic recursive policy
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "users_stat_admin_game_players_policy_v2" ON users;

-- ----------------------------------------------------------------------------
-- STEP 2: Create NON-RECURSIVE optimized policy
-- ----------------------------------------------------------------------------

CREATE POLICY "users_stat_admin_game_players_policy_v3" ON users
FOR SELECT TO authenticated
USING (
  -- FAST PATH: Self-access (no recursion)
  id = auth.uid()
  OR
  -- STAT ADMIN PATH: Use JWT role claim instead of users table query
  (
    -- Check JWT for stat_admin role (no recursion!)
    (auth.jwt() ->> 'user_metadata' ->> 'role' = 'stat_admin' 
     OR auth.jwt() ->> 'app_metadata' ->> 'role' = 'stat_admin')
    AND
    -- Simplified query with better join order (no users table recursion)
    EXISTS (
      SELECT 1 
      FROM team_players tp
      JOIN games g ON (g.team_a_id = tp.team_id OR g.team_b_id = tp.team_id)
      WHERE g.stat_admin_id = auth.uid()
      AND tp.player_id = users.id
      LIMIT 1
    )
  )
);

-- ----------------------------------------------------------------------------
-- ALTERNATIVE: If JWT doesn't have role, use simpler approach
-- ----------------------------------------------------------------------------

-- If the above doesn't work, use this simpler version:
/*
DROP POLICY IF EXISTS "users_stat_admin_game_players_policy_v3" ON users;

CREATE POLICY "users_stat_admin_game_players_policy_simple" ON users
FOR SELECT TO authenticated
USING (
  -- Self-access always allowed
  id = auth.uid()
  OR
  -- Stat admin access: Only check game assignment (no role check to avoid recursion)
  EXISTS (
    SELECT 1 
    FROM team_players tp
    JOIN games g ON (g.team_a_id = tp.team_id OR g.team_b_id = tp.team_id)
    WHERE g.stat_admin_id = auth.uid()
    AND tp.player_id = users.id
    LIMIT 1
  )
);
*/

-- ----------------------------------------------------------------------------
-- STEP 3: Add policy comment
-- ----------------------------------------------------------------------------

COMMENT ON POLICY "users_stat_admin_game_players_policy_v3" ON users IS 
'Non-recursive policy: Uses JWT role claim instead of users table query to prevent infinite recursion.';

-- ----------------------------------------------------------------------------
-- STEP 4: Verify policy creation
-- ----------------------------------------------------------------------------

SELECT '=== NON-RECURSIVE POLICY CREATED ===' as status;
SELECT 
    policyname,
    permissive,
    roles,
    cmd as command
FROM pg_policies 
WHERE tablename = 'users'
AND policyname = 'users_stat_admin_game_players_policy_v3';

-- ----------------------------------------------------------------------------
-- WHAT WAS FIXED:
-- ----------------------------------------------------------------------------
-- ❌ OLD (RECURSIVE): EXISTS (SELECT 1 FROM users WHERE role = 'stat_admin')
-- ✅ NEW (NO RECURSION): auth.jwt() ->> 'user_metadata' ->> 'role' = 'stat_admin'
--
-- This prevents the infinite loop by using JWT claims instead of querying
-- the same table the policy is protecting.
-- ============================================================================
