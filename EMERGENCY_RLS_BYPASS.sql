-- ============================================================================
-- EMERGENCY RLS BYPASS - TEMPORARY DEBUGGING
-- ============================================================================
-- Purpose: Temporarily disable RLS on games to confirm it's the root cause
-- WARNING: This is for debugging only - will re-enable with proper policies
-- ============================================================================

-- STEP 1: Disable RLS temporarily on games table
ALTER TABLE games DISABLE ROW LEVEL SECURITY;

-- STEP 2: Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'games';

-- STEP 3: Test anon access (should work now)
SET ROLE anon;
SELECT COUNT(*) as games_accessible FROM games;
SELECT id, status FROM games WHERE status IN ('live', 'in_progress') LIMIT 3;
RESET ROLE;

SELECT 'RLS TEMPORARILY DISABLED ON GAMES - TEST THE HOMEPAGE NOW' as status;

-- ============================================================================
-- ROLLBACK PLAN (run after testing)
-- ============================================================================
/*
-- Re-enable RLS
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Add the correct policy for anon users
CREATE POLICY "games_anon_public_only" ON games
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM tournaments t 
      WHERE t.id = games.tournament_id 
      AND t.is_public = true
    )
  );
*/
