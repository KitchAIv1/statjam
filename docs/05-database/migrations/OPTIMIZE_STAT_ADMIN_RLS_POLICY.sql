-- ============================================================================
-- OPTIMIZE STAT ADMIN RLS POLICY - FIX DATABASE TIMEOUT
-- ============================================================================
-- Issue: Complex RLS policy causing 15+ second query timeouts
-- Root Cause: EXISTS with 3 JOINs applied to every users table query
-- Solution: Optimize the policy with better indexing and simpler logic
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Drop the problematic policy
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "users_stat_admin_game_players_policy" ON users;

-- ----------------------------------------------------------------------------
-- STEP 2: Create optimized indexes for better performance
-- ----------------------------------------------------------------------------

-- Index for games.stat_admin_id (most selective filter)
CREATE INDEX IF NOT EXISTS idx_games_stat_admin_id ON games(stat_admin_id) 
WHERE stat_admin_id IS NOT NULL;

-- Index for team_players.player_id (direct lookup)
CREATE INDEX IF NOT EXISTS idx_team_players_player_id ON team_players(player_id);

-- Composite index for games team lookups
CREATE INDEX IF NOT EXISTS idx_games_teams ON games(team_a_id, team_b_id, stat_admin_id) 
WHERE stat_admin_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- STEP 3: Create optimized RLS policy with better query plan
-- ----------------------------------------------------------------------------

CREATE POLICY "users_stat_admin_game_players_policy_v2" ON users
FOR SELECT TO authenticated
USING (
  -- OPTIMIZATION 1: Check if user is requesting their own record first (fastest path)
  id = auth.uid()
  OR
  -- OPTIMIZATION 2: Only run expensive check for stat_admin role
  (
    -- First verify the requesting user is a stat_admin (avoid expensive query for other roles)
    EXISTS (
      SELECT 1 FROM users requesting_user 
      WHERE requesting_user.id = auth.uid() 
      AND requesting_user.role = 'stat_admin'
    )
    AND
    -- OPTIMIZATION 3: Simplified query with better join order
    EXISTS (
      SELECT 1 
      FROM team_players tp
      JOIN games g ON (g.team_a_id = tp.team_id OR g.team_b_id = tp.team_id)
      WHERE g.stat_admin_id = auth.uid()
      AND tp.player_id = users.id
      LIMIT 1  -- OPTIMIZATION 4: Stop at first match
    )
  )
);

-- ----------------------------------------------------------------------------
-- STEP 4: Add policy comment for future reference
-- ----------------------------------------------------------------------------

COMMENT ON POLICY "users_stat_admin_game_players_policy_v2" ON users IS 
'Optimized policy: Allows stat_admins to read players in their assigned games. 
Includes performance optimizations: role check first, better indexes, LIMIT 1.';

-- ----------------------------------------------------------------------------
-- STEP 5: Verify the policy was created
-- ----------------------------------------------------------------------------

SELECT '=== OPTIMIZED POLICY CREATED ===' as status;
SELECT 
    policyname,
    permissive,
    roles,
    cmd as command
FROM pg_policies 
WHERE tablename = 'users'
AND policyname = 'users_stat_admin_game_players_policy_v2';

-- ----------------------------------------------------------------------------
-- STEP 6: Test query performance (run this manually to verify)
-- ----------------------------------------------------------------------------

-- This should now be fast (< 1 second)
/*
EXPLAIN ANALYZE
SELECT u.id, u.email, u.name, u.role
FROM users u
WHERE u.role = 'player'
LIMIT 10;
*/

-- ----------------------------------------------------------------------------
-- PERFORMANCE IMPROVEMENTS MADE:
-- ----------------------------------------------------------------------------
-- 1. Added self-access check first (fastest path for own profile)
-- 2. Role check before expensive query (skip for non-stat_admins)
-- 3. Better join order (team_players → games instead of games → teams → team_players)
-- 4. Added LIMIT 1 to stop at first match
-- 5. Created targeted indexes for the query pattern
-- 6. Removed unnecessary team join (not needed for permission check)
-- 
-- Expected performance: < 1 second instead of 15+ seconds
-- ============================================================================
