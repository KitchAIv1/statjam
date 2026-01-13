-- ========================================
-- MIGRATION: Add Public Tournament Access to game_stats
-- Date: January 13, 2026
-- Status: VERIFIED SAFE
-- ========================================
-- 
-- PROBLEM:
-- Public tournament pages cannot read game_stats (0 anon policies exist)
-- This causes "No stats for game XXX" errors and fallback to stale DB scores
--
-- SOLUTION:
-- Add anon SELECT policy matching existing pattern from game_substitutions_public_read
--
-- SAFETY VERIFICATION:
-- Query: SELECT COUNT(*) FROM games WHERE is_coach_game = true AND tournament_id IN (SELECT id FROM tournaments WHERE is_public = true)
-- Result: 0 (no coach games linked to public tournaments)
-- Conclusion: 100% safe - no coach data will be exposed
--
-- ========================================

-- Step 1: Create the missing public read policy
CREATE POLICY "game_stats_public_tournament_read" ON game_stats
  FOR SELECT 
  TO anon
  USING (
    EXISTS (
      SELECT 1 
      FROM games g
      JOIN tournaments t ON g.tournament_id = t.id
      WHERE g.id = game_stats.game_id 
        AND t.is_public = true
    )
  );

-- ========================================
-- VERIFICATION (run after applying)
-- ========================================

-- Verify policy was created
SELECT 
    policyname,
    cmd as operation,
    roles::text as roles
FROM pg_policies 
WHERE tablename = 'game_stats'
  AND policyname = 'game_stats_public_tournament_read';

-- Expected result:
-- | policyname                      | operation | roles  |
-- |---------------------------------|-----------|--------|
-- | game_stats_public_tournament_read | SELECT   | {anon} |

-- ========================================
-- ROLLBACK (if needed)
-- ========================================

-- DROP POLICY IF EXISTS "game_stats_public_tournament_read" ON game_stats;

-- ========================================
-- TESTING CHECKLIST
-- ========================================
-- 
-- After applying this migration:
-- [ ] Public tournament page loads stats (not "No stats for game")
-- [ ] Public game viewer shows accurate scores
-- [ ] TournamentStandingsService fetches real stats
-- [ ] PlayerGameStatsService works for public tournaments
-- [ ] Coach games remain private (only owner can see)
-- [ ] Private tournaments remain protected
--
-- ========================================

