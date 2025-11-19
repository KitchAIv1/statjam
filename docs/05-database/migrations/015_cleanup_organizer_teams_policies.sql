-- CLEANUP: ORGANIZER TEAMS POLICIES
-- Purpose: Remove redundant policies and ensure correct structure
-- Date: January 2025
-- Issue: teams_organizer_manage still exists as ALL, teams_organizer_tournament_access not dropped

-- STEP 1: Drop all redundant organizer policies
DROP POLICY IF EXISTS "teams_organizer_manage" ON teams;
DROP POLICY IF EXISTS "teams_organizer_tournament_access" ON teams;

-- STEP 2: Drop separate policies if they exist (will recreate)
DROP POLICY IF EXISTS "teams_organizer_select" ON teams;
DROP POLICY IF EXISTS "teams_organizer_insert" ON teams;
DROP POLICY IF EXISTS "teams_organizer_update" ON teams;
DROP POLICY IF EXISTS "teams_organizer_delete_only" ON teams;

-- STEP 3: Create correct separate policies

-- Policy for SELECT operations
CREATE POLICY "teams_organizer_select"
ON public.teams 
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tournaments t
    WHERE t.id = teams.tournament_id 
    AND t.organizer_id = auth.uid()
  )
);

-- Policy for INSERT operations
CREATE POLICY "teams_organizer_insert"
ON public.teams 
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tournaments t
    WHERE t.id = teams.tournament_id 
    AND t.organizer_id = auth.uid()
  )
);

-- Policy for UPDATE operations (allows disconnect coach teams)
CREATE POLICY "teams_organizer_update"
ON public.teams 
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tournaments t
    WHERE t.id = teams.tournament_id 
    AND t.organizer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tournaments t
    WHERE t.id = teams.tournament_id 
    AND t.organizer_id = auth.uid()
  )
);

-- Policy for DELETE operations (organizer teams only)
CREATE POLICY "teams_organizer_delete_only"
ON public.teams 
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tournaments t
    WHERE t.id = teams.tournament_id 
    AND t.organizer_id = auth.uid()
  )
  AND coach_id IS NULL
);

-- STEP 4: Verify final policy structure
SELECT 
    policyname,
    cmd as operation,
    CASE 
        WHEN policyname = 'teams_organizer_select' THEN '✅ Organizer SELECT'
        WHEN policyname = 'teams_organizer_insert' THEN '✅ Organizer INSERT'
        WHEN policyname = 'teams_organizer_update' THEN '✅ Organizer UPDATE'
        WHEN policyname = 'teams_organizer_delete_only' THEN '✅ Organizer DELETE (organizer teams only)'
        WHEN policyname = 'teams_coach_access' THEN '✅ Coach manage (all operations)'
        WHEN policyname = 'teams_organizer_tournament_access' THEN '❌ Should be dropped'
        WHEN policyname = 'teams_organizer_manage' THEN '❌ Should be dropped'
        ELSE 'Other policy'
    END as policy_status
FROM pg_policies 
WHERE tablename = 'teams'
AND (policyname LIKE '%organizer%' OR policyname LIKE '%coach%')
ORDER BY 
    CASE cmd
        WHEN 'ALL' THEN 1
        WHEN 'DELETE' THEN 2
        ELSE 3
    END,
    policyname;

-- Expected result after cleanup:
-- ✅ teams_organizer_select (SELECT)
-- ✅ teams_organizer_insert (INSERT)
-- ✅ teams_organizer_update (UPDATE)
-- ✅ teams_organizer_delete_only (DELETE)
-- ✅ teams_coach_access (ALL)
-- ❌ teams_organizer_manage should NOT exist
-- ❌ teams_organizer_tournament_access should NOT exist

