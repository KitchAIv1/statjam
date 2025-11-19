-- ============================================================================
-- ORGANIZER DELETE COACH TEAMS RLS POLICY
-- ============================================================================
-- Purpose: Allow organizers to delete coach-created teams in their tournaments
-- Date: January 2025
-- Issue: Organizers cannot delete coach teams even when they're in organizer's tournaments
-- Solution: Update RLS policy to allow organizer deletion of any team in their tournaments
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Verify current teams policies
-- ----------------------------------------------------------------------------

-- Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'teams'
ORDER BY policyname;

-- ----------------------------------------------------------------------------
-- STEP 2: Update teams_organizer_manage policy to include coach teams
-- ----------------------------------------------------------------------------

-- Drop existing organizer policies if they exist
-- Note: teams_organizer_tournament_access is redundant and will be cleaned up in migration 013
DROP POLICY IF EXISTS "teams_organizer_manage" ON teams;
DROP POLICY IF EXISTS "teams_organizer_tournament_access" ON teams;

-- Create updated policy that allows organizers to manage ALL teams in their tournaments
-- This includes both organizer-created teams AND coach-created teams
CREATE POLICY "teams_organizer_manage"
ON public.teams 
FOR ALL 
TO authenticated
USING (
  -- Allow if team is in a tournament owned by the organizer
  EXISTS (
    SELECT 1 FROM public.tournaments t
    WHERE t.id = teams.tournament_id 
    AND t.organizer_id = auth.uid()
  )
)
WITH CHECK (
  -- Same check for INSERT/UPDATE operations
  EXISTS (
    SELECT 1 FROM public.tournaments t
    WHERE t.id = teams.tournament_id 
    AND t.organizer_id = auth.uid()
  )
);

-- ----------------------------------------------------------------------------
-- STEP 3: Ensure coach policy still works (no conflicts)
-- ----------------------------------------------------------------------------

-- Verify coach policy exists (should already exist from previous migrations)
-- If not, create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'teams' 
    AND policyname = 'teams_coach_access'
  ) THEN
    CREATE POLICY "teams_coach_access" ON teams
      FOR ALL
      TO authenticated
      USING (coach_id = auth.uid())
      WITH CHECK (coach_id = auth.uid());
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- STEP 4: Verification queries
-- ----------------------------------------------------------------------------

-- Verify policies are correctly set
SELECT 
    policyname,
    cmd as operation,
    CASE 
        WHEN qual LIKE '%organizer_id%' THEN '✅ Organizer policy'
        WHEN qual LIKE '%coach_id%' THEN '✅ Coach policy'
        ELSE 'Other policy'
    END as policy_type
FROM pg_policies 
WHERE tablename = 'teams'
ORDER BY policyname;

-- Test query: Check if organizer can see teams in their tournaments (including coach teams)
-- Replace 'ORGANIZER_USER_ID' with actual organizer ID for testing
-- SELECT 
--     t.id,
--     t.name,
--     t.coach_id,
--     t.tournament_id,
--     tr.organizer_id,
--     CASE 
--         WHEN t.coach_id IS NOT NULL THEN 'Coach Team'
--         ELSE 'Organizer Team'
--     END as team_type
-- FROM teams t
-- JOIN tournaments tr ON t.tournament_id = tr.id
-- WHERE tr.organizer_id = 'ORGANIZER_USER_ID';

-- ----------------------------------------------------------------------------
-- NOTES
-- ----------------------------------------------------------------------------
-- 1. This policy allows organizers to DELETE coach teams in their tournaments
-- 2. Coach teams can still be managed by their coaches via teams_coach_access policy
-- 3. Both policies can coexist - PostgreSQL RLS uses OR logic
-- 4. No conflicts expected - policies check different conditions
-- 5. Cascading deletes will still apply (games, team_players, etc.)
--    - Service layer should validate active games before deletion
-- ============================================================================

