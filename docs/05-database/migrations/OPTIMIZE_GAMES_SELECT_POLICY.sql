-- ============================================================================
-- OPTIMIZE: Games SELECT policy for short-circuit evaluation
-- ============================================================================
-- Current: 0.138ms (works but evaluates all 3 conditions)
-- Goal: < 0.05ms by putting stat_admin check FIRST for short-circuit
-- ============================================================================

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "games_select_policy" ON public.games;

-- Recreate with optimized order (stat_admin check first for short-circuit)
CREATE POLICY "games_select_policy" ON public.games
FOR SELECT TO anon, authenticated
USING (
  -- ✅ OPTIMIZATION: Put simplest checks FIRST for short-circuit evaluation
  -- 1. Stat admins (NO join, instant check)
  (stat_admin_id = auth.uid())
  OR
  -- 2. Public tournaments (1 simple join)
  EXISTS (
    SELECT 1 FROM tournaments t
    WHERE t.id = games.tournament_id AND t.is_public = TRUE
  )
  OR
  -- 3. Organizers (1 join with user check)
  EXISTS (
    SELECT 1 FROM tournaments t
    WHERE t.id = games.tournament_id AND t.organizer_id = auth.uid()
  )
);

-- Verify
SELECT '=== OPTIMIZED GAMES SELECT POLICY ===' as status;
SELECT 
    policyname,
    cmd,
    qual as using_clause
FROM pg_policies 
WHERE tablename = 'games'
AND policyname = 'games_select_policy';

-- Test again
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "18358f53-c5af-429b-835d-026f904904a6", "role": "authenticated"}';

EXPLAIN ANALYZE
SELECT id, tournament_id, team_a_id, team_b_id, start_time, status, created_at
FROM public.games
WHERE stat_admin_id = '18358f53-c5af-429b-835d-026f904904a6';

RESET ROLE;

SELECT '✅ Execution time should be even faster now!' as status;

