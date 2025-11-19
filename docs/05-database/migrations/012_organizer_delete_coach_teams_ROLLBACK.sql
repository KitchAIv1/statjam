-- ROLLBACK: ORGANIZER DELETE COACH TEAMS RLS POLICY
-- Purpose: Revert migration 012 - Restore original policy behavior
-- Date: January 2025
-- Issue: Migration 012 incorrectly allowed organizers to DELETE coach teams
-- Solution: Restore policy to only allow DELETE of organizer-created teams
--           Organizers can still UPDATE (disconnect) coach teams

-- STEP 1: Drop the incorrect policies from migration 012
DROP POLICY IF EXISTS "teams_organizer_manage" ON teams;
DROP POLICY IF EXISTS "teams_organizer_tournament_access" ON teams;

-- STEP 2: Restore original policy that restricts DELETE to organizer teams
-- Create policies for SELECT/INSERT/UPDATE (NOT DELETE)
-- PostgreSQL doesn't support "ALL except DELETE", so we need separate policies

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

-- STEP 3: Add separate DELETE policy that only allows organizer team deletion
-- Drop any existing DELETE-specific policy
DROP POLICY IF EXISTS "teams_organizer_delete_only" ON teams;

-- Create DELETE policy that ONLY allows deletion of organizer-created teams
-- This prevents organizers from deleting coach teams
CREATE POLICY "teams_organizer_delete_only"
ON public.teams 
FOR DELETE
TO authenticated
USING (
  -- Only allow DELETE if:
  -- 1. Team is in organizer's tournament
  -- 2. Team is organizer-created (coach_id IS NULL)
  EXISTS (
    SELECT 1 FROM public.tournaments t
    WHERE t.id = teams.tournament_id 
    AND t.organizer_id = auth.uid()
  )
  AND coach_id IS NULL
);

-- STEP 4: Verify policies are correctly set
SELECT 
    policyname,
    cmd as operation,
    CASE 
        WHEN policyname LIKE 'teams_organizer_select' THEN '✅ Organizer SELECT'
        WHEN policyname LIKE 'teams_organizer_insert' THEN '✅ Organizer INSERT'
        WHEN policyname LIKE 'teams_organizer_update' THEN '✅ Organizer UPDATE'
        WHEN policyname = 'teams_organizer_delete_only' AND cmd = 'DELETE' THEN '✅ Organizer DELETE (organizer teams only)'
        WHEN policyname = 'teams_coach_access' THEN '✅ Coach manage (all operations)'
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

-- VERIFICATION TEST
-- Test 1: Verify organizer can UPDATE coach team (disconnect)
-- This should work - UPDATE is allowed by teams_organizer_update
-- UPDATE teams SET tournament_id = NULL 
-- WHERE id = 'COACH_TEAM_ID' 
-- AND EXISTS (SELECT 1 FROM tournaments WHERE id = teams.tournament_id AND organizer_id = auth.uid());

-- Test 2: Verify organizer CANNOT DELETE coach team
-- This should fail - DELETE requires coach_id IS NULL
-- DELETE FROM teams 
-- WHERE id = 'COACH_TEAM_ID' 
-- AND coach_id IS NOT NULL;
-- Expected: RLS policy blocks this

-- Test 3: Verify organizer CAN DELETE organizer team
-- This should work - DELETE allowed for coach_id IS NULL
-- DELETE FROM teams 
-- WHERE id = 'ORGANIZER_TEAM_ID' 
-- AND coach_id IS NULL
-- AND EXISTS (SELECT 1 FROM tournaments WHERE id = teams.tournament_id AND organizer_id = auth.uid());
-- Expected: RLS policy allows this

-- NOTES
-- 1. teams_organizer_select/insert/update allow SELECT/INSERT/UPDATE for all teams in tournaments
-- 2. teams_organizer_delete_only restricts DELETE to organizer teams only (coach_id IS NULL)
-- 3. teams_coach_access allows coaches to DELETE their own teams
-- 4. PostgreSQL RLS uses OR logic - coach can delete via teams_coach_access
-- 5. Organizer can UPDATE coach team (set tournament_id = NULL) but cannot DELETE it

