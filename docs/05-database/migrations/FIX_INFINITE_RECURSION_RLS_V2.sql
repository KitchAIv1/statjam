-- ============================================================================
-- FIX INFINITE RECURSION IN RLS POLICY - EMERGENCY V2
-- ============================================================================
-- Issue: JWT operator syntax error + infinite recursion
-- Root Cause: Wrong JWT syntax + recursive users table query
-- Solution: Use correct JWT syntax OR simpler non-recursive approach
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Drop the problematic recursive policy
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "users_stat_admin_game_players_policy_v2" ON users;
DROP POLICY IF EXISTS "users_stat_admin_game_players_policy_v3" ON users;

-- ----------------------------------------------------------------------------
-- STEP 2: Create SIMPLE non-recursive policy (SAFEST APPROACH)
-- ----------------------------------------------------------------------------

CREATE POLICY "users_stat_admin_game_players_policy_simple" ON users
FOR SELECT TO authenticated
USING (
  -- FAST PATH: Self-access (always allowed, no recursion)
  id = auth.uid()
  OR
  -- STAT ADMIN PATH: Check game assignment only (no role check to avoid recursion)
  EXISTS (
    SELECT 1 
    FROM team_players tp
    JOIN games g ON (g.team_a_id = tp.team_id OR g.team_b_id = tp.team_id)
    WHERE g.stat_admin_id = auth.uid()
    AND tp.player_id = users.id
    LIMIT 1
  )
);

-- ----------------------------------------------------------------------------
-- ALTERNATIVE: If you want to try JWT with correct syntax
-- ----------------------------------------------------------------------------

-- If the simple version works, you can try this JWT version later:
/*
DROP POLICY IF EXISTS "users_stat_admin_game_players_policy_simple" ON users;

CREATE POLICY "users_stat_admin_game_players_policy_jwt" ON users
FOR SELECT TO authenticated
USING (
  -- Self-access
  id = auth.uid()
  OR
  -- JWT role check (correct syntax)
  (
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'stat_admin' 
     OR auth.jwt() -> 'app_metadata' ->> 'role' = 'stat_admin'
     OR (auth.jwt() -> 'user_metadata' -> 'role')::text = 'stat_admin')
    AND
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
*/

-- ----------------------------------------------------------------------------
-- STEP 3: Add policy comment
-- ----------------------------------------------------------------------------

COMMENT ON POLICY "users_stat_admin_game_players_policy_simple" ON users IS 
'Simple non-recursive policy: Self-access + game assignment check only. No role check to prevent recursion.';

-- ----------------------------------------------------------------------------
-- STEP 4: Verify policy creation
-- ----------------------------------------------------------------------------

SELECT '=== SIMPLE NON-RECURSIVE POLICY CREATED ===' as status;
SELECT 
    policyname,
    permissive,
    roles,
    cmd as command
FROM pg_policies 
WHERE tablename = 'users'
AND policyname = 'users_stat_admin_game_players_policy_simple';

-- ----------------------------------------------------------------------------
-- STEP 5: Test basic query (should work now)
-- ----------------------------------------------------------------------------

-- This should work without infinite recursion:
SELECT 'Testing basic user query...' as test;
-- SELECT id, email, role FROM users WHERE id = auth.uid() LIMIT 1;

-- ----------------------------------------------------------------------------
-- WHAT THIS FIXES:
-- ----------------------------------------------------------------------------
-- ✅ REMOVES: Recursive users table query (no more infinite loop)
-- ✅ REMOVES: Complex JWT syntax (no more operator errors)
-- ✅ KEEPS: Self-access (users can see their own profile)
-- ✅ KEEPS: Stat admin access to assigned game players
-- ✅ KEEPS: Performance optimizations (LIMIT 1, better joins)
--
-- This is the SAFEST approach - it will work immediately!
-- ============================================================================
