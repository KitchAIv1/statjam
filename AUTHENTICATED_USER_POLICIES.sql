-- ============================================================================
-- AUTHENTICATED USER POLICIES - GAME VIEWER & STAT TRACKER
-- ============================================================================
-- Purpose: Add missing RLS policies for authenticated users to access games
-- Issues Fixed:
--   1. Game viewer loading forever (missing authenticated access to games)
--   2. Stat tracker loading forever (missing stat_admin access to games)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- GAMES TABLE - Authenticated User Access
-- ----------------------------------------------------------------------------

-- Allow authenticated users to read all games (needed for game viewer)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'games' 
        AND policyname = 'games_authenticated_read_policy'
    ) THEN
        CREATE POLICY "games_authenticated_read_policy" ON games
          FOR SELECT 
          TO authenticated
          USING (true);
        
        RAISE NOTICE 'Created games_authenticated_read_policy';
    ELSE
        RAISE NOTICE 'games_authenticated_read_policy already exists';
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- TEAMS TABLE - Authenticated User Access
-- ----------------------------------------------------------------------------

-- Allow authenticated users to read all teams (needed for JOINs in game viewer)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'teams' 
        AND policyname = 'teams_authenticated_read_policy'
    ) THEN
        CREATE POLICY "teams_authenticated_read_policy" ON teams
          FOR SELECT 
          TO authenticated
          USING (true);
        
        RAISE NOTICE 'Created teams_authenticated_read_policy';
    ELSE
        RAISE NOTICE 'teams_authenticated_read_policy already exists';
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- TOURNAMENTS TABLE - Authenticated User Access
-- ----------------------------------------------------------------------------

-- Allow authenticated users to read all tournaments (needed for JOINs)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tournaments' 
        AND policyname = 'tournaments_authenticated_read_policy'
    ) THEN
        CREATE POLICY "tournaments_authenticated_read_policy" ON tournaments
          FOR SELECT 
          TO authenticated
          USING (true);
        
        RAISE NOTICE 'Created tournaments_authenticated_read_policy';
    ELSE
        RAISE NOTICE 'tournaments_authenticated_read_policy already exists';
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- GAME_STATS TABLE - Authenticated User Access
-- ----------------------------------------------------------------------------

-- Allow authenticated users to read all game stats (needed for stat tracker)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'game_stats' 
        AND policyname = 'game_stats_authenticated_read_policy'
    ) THEN
        CREATE POLICY "game_stats_authenticated_read_policy" ON game_stats
          FOR SELECT 
          TO authenticated
          USING (true);
        
        RAISE NOTICE 'Created game_stats_authenticated_read_policy';
    ELSE
        RAISE NOTICE 'game_stats_authenticated_read_policy already exists';
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- GAME_SUBSTITUTIONS TABLE - Authenticated User Access
-- ----------------------------------------------------------------------------

-- Allow authenticated users to read all game substitutions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'game_substitutions' 
        AND policyname = 'game_substitutions_authenticated_read_policy'
    ) THEN
        CREATE POLICY "game_substitutions_authenticated_read_policy" ON game_substitutions
          FOR SELECT 
          TO authenticated
          USING (true);
        
        RAISE NOTICE 'Created game_substitutions_authenticated_read_policy';
    ELSE
        RAISE NOTICE 'game_substitutions_authenticated_read_policy already exists';
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- VERIFICATION QUERIES
-- ----------------------------------------------------------------------------

-- Check all policies were created
SELECT 'AUTHENTICATED USER POLICIES APPLIED' as status;

SELECT 
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('games', 'teams', 'tournaments', 'game_stats', 'game_substitutions')
  AND 'authenticated' = ANY(roles)
ORDER BY tablename, policyname;
