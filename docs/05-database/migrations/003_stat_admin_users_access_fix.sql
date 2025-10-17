-- ============================================================================
-- STAT ADMIN USERS TABLE ACCESS FIX
-- ============================================================================
-- Issue: Stat admins cannot read player data from users table
-- Evidence: 
--   - team_players query returns 8 player IDs ✅
--   - users query returns 0 users ❌
-- Root Cause: users table RLS policies don't allow stat_admins to read player data
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SOLUTION: Add policy for stat_admins to read players in their assigned games
-- ----------------------------------------------------------------------------

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "users_stat_admin_game_players_policy" ON users;

-- Create new policy: Stat admins can read players in games they're assigned to
CREATE POLICY "users_stat_admin_game_players_policy" ON users
FOR SELECT TO authenticated
USING (
  -- Allow if the user is a stat_admin viewing players in their assigned games
  EXISTS (
    SELECT 1 
    FROM games g
    JOIN teams t ON (t.id = g.team_a_id OR t.id = g.team_b_id)
    JOIN team_players tp ON tp.team_id = t.id
    WHERE g.stat_admin_id = auth.uid()
    AND tp.player_id = users.id
  )
);

-- ----------------------------------------------------------------------------
-- VERIFICATION: Check if policy was created successfully
-- ----------------------------------------------------------------------------

SELECT '=== USERS TABLE POLICIES (AFTER FIX) ===' as status;
SELECT 
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_clause
FROM pg_policies 
WHERE tablename = 'users'
AND policyname LIKE '%stat_admin%'
ORDER BY policyname;

-- ----------------------------------------------------------------------------
-- TEST QUERY: Verify stat_admin can now read players
-- ----------------------------------------------------------------------------

-- This query simulates what TeamService.getTeamPlayers() does
-- Replace 'YOUR_STAT_ADMIN_ID' with actual stat_admin user ID
-- Replace 'YOUR_TEAM_ID' with actual team ID

/*
SELECT 
  u.id,
  u.email,
  u.name,
  u.role
FROM team_players tp
JOIN users u ON u.id = tp.player_id
JOIN teams t ON t.id = tp.team_id
JOIN games g ON (g.team_a_id = t.id OR g.team_b_id = t.id)
WHERE tp.team_id = 'YOUR_TEAM_ID'
AND g.stat_admin_id = 'YOUR_STAT_ADMIN_ID';
*/

-- Expected result: Should return all players in the team
-- If it returns 0 rows, the RLS policy is still blocking access

-- ----------------------------------------------------------------------------
-- NOTES
-- ----------------------------------------------------------------------------
-- This policy allows stat_admins to ONLY see:
--   1. Players in teams that are part of games they're assigned to
--   2. Only for games where they are the stat_admin
-- 
-- This maintains security while allowing necessary access for stat tracking
-- ============================================================================

