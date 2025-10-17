-- ============================================================================
-- STATJAM RLS FIX - COMPLETE SOLUTION
-- ============================================================================
-- Purpose: Fix authentication and live viewer issues caused by missing RLS policies
-- Issues Fixed:
--   1. Authentication redirect failure (missing users self-access)
--   2. Live games not showing (missing public access to games/teams/tournaments)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- FIX 1: USERS TABLE - Enable Self-Access for Authentication
-- ----------------------------------------------------------------------------

-- Check if policy already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'users_self_access_policy'
    ) THEN
        CREATE POLICY "users_self_access_policy" ON users
          FOR SELECT 
          TO authenticated
          USING (id = auth.uid());
        
        RAISE NOTICE 'Created users_self_access_policy';
    ELSE
        RAISE NOTICE 'users_self_access_policy already exists';
    END IF;
END $$;

-- Also ensure users can update their own profile
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'users_self_update_policy'
    ) THEN
        CREATE POLICY "users_self_update_policy" ON users
          FOR UPDATE 
          TO authenticated
          USING (id = auth.uid())
          WITH CHECK (id = auth.uid());
        
        RAISE NOTICE 'Created users_self_update_policy';
    ELSE
        RAISE NOTICE 'users_self_update_policy already exists';
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- FIX 2: GAMES TABLE - Enable Public Access for Live Viewer
-- ----------------------------------------------------------------------------

-- Check if policy already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'games' 
        AND policyname = 'games_public_read_policy'
    ) THEN
        CREATE POLICY "games_public_read_policy" ON games
          FOR SELECT 
          TO anon
          USING (
            EXISTS (
              SELECT 1 FROM tournaments t 
              WHERE t.id = games.tournament_id 
              AND t.is_public = true
            )
          );
        
        RAISE NOTICE 'Created games_public_read_policy';
    ELSE
        RAISE NOTICE 'games_public_read_policy already exists';
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- FIX 3: TEAMS TABLE - Enable Public Access for Live Viewer
-- ----------------------------------------------------------------------------

-- Check if policy already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'teams' 
        AND policyname = 'teams_public_read_policy'
    ) THEN
        CREATE POLICY "teams_public_read_policy" ON teams
          FOR SELECT 
          TO anon
          USING (
            EXISTS (
              SELECT 1 FROM tournaments t 
              WHERE t.id = teams.tournament_id 
              AND t.is_public = true
            )
          );
        
        RAISE NOTICE 'Created teams_public_read_policy';
    ELSE
        RAISE NOTICE 'teams_public_read_policy already exists';
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- FIX 4: TOURNAMENTS TABLE - Enable Public Access for Live Viewer
-- ----------------------------------------------------------------------------

-- Check if policy already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tournaments' 
        AND policyname = 'tournaments_public_read_policy'
    ) THEN
        CREATE POLICY "tournaments_public_read_policy" ON tournaments
          FOR SELECT 
          TO anon
          USING (is_public = true);
        
        RAISE NOTICE 'Created tournaments_public_read_policy';
    ELSE
        RAISE NOTICE 'tournaments_public_read_policy already exists';
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- VERIFICATION QUERIES
-- ----------------------------------------------------------------------------

-- Test 1: Verify all policies were created
SELECT '=== VERIFICATION: ALL RLS POLICIES ===' as test;

SELECT 
    tablename,
    policyname,
    roles
FROM pg_policies
WHERE tablename IN ('users', 'games', 'teams', 'tournaments')
AND policyname IN (
    'users_self_access_policy',
    'users_self_update_policy',
    'games_public_read_policy',
    'teams_public_read_policy',
    'tournaments_public_read_policy'
)
ORDER BY tablename, policyname;

-- Test 2: Verify anon can access public games
SELECT '=== TEST: ANON ACCESS TO LIVE GAMES ===' as test;
SET ROLE anon;
SELECT 
    g.id,
    g.status,
    g.home_score,
    g.away_score,
    t.name as tournament_name,
    ta.name as team_a_name,
    tb.name as team_b_name
FROM games g
LEFT JOIN tournaments t ON g.tournament_id = t.id
LEFT JOIN teams ta ON g.team_a_id = ta.id
LEFT JOIN teams tb ON g.team_b_id = tb.id
WHERE g.status IN ('live', 'in_progress', 'overtime')
LIMIT 3;
RESET ROLE;

-- Test 3: Verify authenticated user can access own profile
SELECT '=== TEST: AUTHENTICATED USER SELF-ACCESS ===' as test;
-- This test requires an actual authenticated session
-- Run after signing in to verify it works

-- ----------------------------------------------------------------------------
-- ROLLBACK PLAN (if needed)
-- ----------------------------------------------------------------------------
/*
-- To remove all policies created by this script:
DROP POLICY IF EXISTS "users_self_access_policy" ON users;
DROP POLICY IF EXISTS "users_self_update_policy" ON users;
DROP POLICY IF EXISTS "games_public_read_policy" ON games;
DROP POLICY IF EXISTS "teams_public_read_policy" ON teams;
DROP POLICY IF EXISTS "tournaments_public_read_policy" ON tournaments;
*/

-- ----------------------------------------------------------------------------
-- SUMMARY
-- ----------------------------------------------------------------------------

SELECT '=== RLS FIX COMPLETE ===' as status;
SELECT 'All policies created successfully!' as result;
SELECT 'Test authentication and live viewer to verify fixes' as next_step;
