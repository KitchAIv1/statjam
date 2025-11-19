-- FIX: ORGANIZER DISCONNECT COACH TEAMS RLS POLICY
-- Purpose: Allow organizers to disconnect coach teams (set tournament_id to NULL)
-- Date: January 2025
-- Issue: teams_organizer_update WITH CHECK fails when tournament_id is set to NULL
-- Solution: Modify WITH CHECK to allow NULL tournament_id for disconnect operations

-- ----------------------------------------------------------------------------
-- STEP 1: Check existing teams policies for context
-- ----------------------------------------------------------------------------

SELECT '=== CURRENT TEAMS POLICIES (BEFORE FIX) ===' as status;
SELECT 
    policyname,
    cmd as operation,
    roles,
    qual as using_clause,
    with_check as with_check_clause
FROM pg_policies 
WHERE tablename = 'teams'
AND (policyname LIKE '%organizer%' OR policyname LIKE '%coach%')
ORDER BY 
    CASE cmd
        WHEN 'ALL' THEN 1
        WHEN 'UPDATE' THEN 2
        WHEN 'DELETE' THEN 3
        ELSE 4
    END,
    policyname;

-- ----------------------------------------------------------------------------
-- STEP 2: Drop existing teams_organizer_update policy
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "teams_organizer_update" ON teams;

-- ----------------------------------------------------------------------------
-- STEP 3: Create updated policy that allows disconnect (tournament_id = NULL)
-- ----------------------------------------------------------------------------

-- Policy for UPDATE operations (allows disconnect coach teams)
-- USING: Checks if team is currently in organizer's tournament (before update)
-- WITH CHECK: Allows team to remain in tournament OR be set to NULL (disconnect)
CREATE POLICY "teams_organizer_update"
ON public.teams 
FOR UPDATE
TO authenticated
USING (
  -- Allow update if team is currently in a tournament owned by the organizer
  EXISTS (
    SELECT 1 FROM public.tournaments t
    WHERE t.id = teams.tournament_id 
    AND t.organizer_id = auth.uid()
  )
)
WITH CHECK (
  -- Allow update if:
  -- 1. Team remains in organizer's tournament (normal update), OR
  -- 2. tournament_id is NULL (disconnect operation)
  teams.tournament_id IS NULL 
  OR EXISTS (
    SELECT 1 FROM public.tournaments t
    WHERE t.id = teams.tournament_id 
    AND t.organizer_id = auth.uid()
  )
);

-- ----------------------------------------------------------------------------
-- STEP 4: Verify updated policy structure
-- ----------------------------------------------------------------------------

SELECT '=== UPDATED TEAMS_ORGANIZER_UPDATE POLICY ===' as status;
SELECT 
    policyname,
    cmd as operation,
    roles,
    qual as using_clause,
    with_check as with_check_clause,
    CASE 
        WHEN with_check LIKE '%tournament_id IS NULL%' THEN '✅ Allows NULL (disconnect)'
        ELSE '⚠️ Review needed'
    END as policy_check
FROM pg_policies 
WHERE tablename = 'teams' 
AND policyname = 'teams_organizer_update';

-- ----------------------------------------------------------------------------
-- STEP 5: Verify all organizer policies are correct
-- ----------------------------------------------------------------------------

SELECT '=== ALL ORGANIZER TEAMS POLICIES (AFTER FIX) ===' as status;
SELECT 
    policyname,
    cmd as operation,
    roles,
    CASE 
        WHEN policyname = 'teams_organizer_select' THEN '✅ Organizer SELECT'
        WHEN policyname = 'teams_organizer_insert' THEN '✅ Organizer INSERT'
        WHEN policyname = 'teams_organizer_update' THEN '✅ Organizer UPDATE (allows disconnect)'
        WHEN policyname = 'teams_organizer_delete_only' THEN '✅ Organizer DELETE (organizer teams only)'
        ELSE 'Other policy'
    END as policy_status
FROM pg_policies 
WHERE tablename = 'teams'
AND policyname LIKE '%organizer%'
ORDER BY 
    CASE cmd
        WHEN 'SELECT' THEN 1
        WHEN 'INSERT' THEN 2
        WHEN 'UPDATE' THEN 3
        WHEN 'DELETE' THEN 4
        ELSE 5
    END;

-- ----------------------------------------------------------------------------
-- NOTES
-- ----------------------------------------------------------------------------

-- ✅ USING clause: Checks OLD row (before update) - team must be in organizer's tournament
-- ✅ WITH CHECK clause: Checks NEW row (after update) - allows NULL or staying in tournament
-- ✅ This allows organizers to disconnect coach teams while preventing unauthorized NULL sets
-- ✅ Security: Only teams that were originally in organizer's tournament can be disconnected
-- ✅ The policy ensures:
--    - Organizers can only disconnect teams from their own tournaments
--    - After disconnect, tournament_id becomes NULL (team is no longer in tournament)
--    - Coach still owns the team (coach_id remains unchanged)
