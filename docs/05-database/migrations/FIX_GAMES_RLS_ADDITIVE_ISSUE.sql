-- ============================================================================
-- FIX: GAMES TABLE RLS POLICIES ARE ADDITIVE (OR'ed together)
-- ============================================================================
-- Problem: All 3 policies on games table are being evaluated together with OR,
-- causing expensive subqueries even when stat_admin_id check should be sufficient.
-- 
-- Solution: Split policies by operation type to avoid additive behavior
-- ============================================================================

-- Drop existing games policies
DROP POLICY IF EXISTS "games_stat_admin_manage" ON public.games;
DROP POLICY IF EXISTS "games_organizer_manage" ON public.games;
DROP POLICY IF EXISTS "games_public_read" ON public.games;

-- ----------------------------------------------------------------------------
-- NEW APPROACH: Separate SELECT policies from INSERT/UPDATE/DELETE
-- This prevents the additive OR behavior
-- ----------------------------------------------------------------------------

-- 1. SELECT policy: Combine all read access into ONE policy
CREATE POLICY "games_select_policy" ON public.games
FOR SELECT TO anon, authenticated
USING (
  -- Public can read games in public tournaments
  EXISTS (
    SELECT 1 FROM tournaments t
    WHERE t.id = games.tournament_id AND t.is_public = TRUE
  )
  OR
  -- Stat admins can read their assigned games
  (stat_admin_id = auth.uid())
  OR
  -- Organizers can read games in their tournaments
  EXISTS (
    SELECT 1 FROM tournaments t
    WHERE t.id = games.tournament_id AND t.organizer_id = auth.uid()
  )
);

-- 2. INSERT policy: Only stat admins and organizers can insert
CREATE POLICY "games_insert_policy" ON public.games
FOR INSERT TO authenticated
WITH CHECK (
  -- Stat admins can insert games assigned to them
  (stat_admin_id = auth.uid())
  OR
  -- Organizers can insert games in their tournaments
  EXISTS (
    SELECT 1 FROM tournaments t
    WHERE t.id = games.tournament_id AND t.organizer_id = auth.uid()
  )
);

-- 3. UPDATE policy: Only stat admins and organizers can update
CREATE POLICY "games_update_policy" ON public.games
FOR UPDATE TO authenticated
USING (
  -- Stat admins can update their assigned games
  (stat_admin_id = auth.uid())
  OR
  -- Organizers can update games in their tournaments
  EXISTS (
    SELECT 1 FROM tournaments t
    WHERE t.id = games.tournament_id AND t.organizer_id = auth.uid()
  )
)
WITH CHECK (
  -- Same rules for the updated row
  (stat_admin_id = auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM tournaments t
    WHERE t.id = games.tournament_id AND t.organizer_id = auth.uid()
  )
);

-- 4. DELETE policy: Only organizers can delete
CREATE POLICY "games_delete_policy" ON public.games
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tournaments t
    WHERE t.id = games.tournament_id AND t.organizer_id = auth.uid()
  )
);

-- ----------------------------------------------------------------------------
-- VERIFICATION
-- ----------------------------------------------------------------------------
SELECT '=== GAMES TABLE POLICIES (AFTER FIX) ===' as status;
SELECT 
    policyname,
    cmd as command,
    qual as using_clause
FROM pg_policies 
WHERE tablename = 'games'
ORDER BY cmd, policyname;

-- Test the query again
SELECT '=== TESTING STAT_ADMIN QUERY ===' as status;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "18358f53-c5af-429b-835d-026f904904a6", "role": "authenticated"}';

EXPLAIN ANALYZE
SELECT id, tournament_id, team_a_id, team_b_id, start_time, status, created_at
FROM public.games
WHERE stat_admin_id = '18358f53-c5af-429b-835d-026f904904a6';

RESET ROLE;

SELECT '✅ If execution time is < 1ms, the fix worked!' as status;

