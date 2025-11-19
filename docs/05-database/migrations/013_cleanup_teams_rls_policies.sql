-- ============================================================================
-- CLEANUP TEAMS RLS POLICIES - REMOVE REDUNDANCIES
-- ============================================================================
-- Purpose: Remove redundant teams RLS policies and consolidate to single policy
-- Date: January 2025
-- Issue: Multiple overlapping policies causing confusion and potential conflicts
-- Solution: Keep only essential policies, remove duplicates
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Identify redundant policies
-- ----------------------------------------------------------------------------

-- Current policies analysis:
-- 1. teams_organizer_manage - Main organizer policy (KEEP)
-- 2. teams_organizer_tournament_access - Redundant (REMOVE - same as teams_organizer_manage)
-- 3. teams_coach_access - Coach policy (KEEP)
-- 4. teams_organizer_coach_import - Import policy (KEEP - SELECT only)
-- 5. teams_public_read - Public read (KEEP)
-- 6. teams_public_coach_view - Public coach view (KEEP)
-- 7. teams_authenticated_read_all - Authenticated read (KEEP)

-- ----------------------------------------------------------------------------
-- STEP 2: Remove redundant organizer policy
-- ----------------------------------------------------------------------------

-- Drop redundant policy (teams_organizer_tournament_access is same as teams_organizer_manage)
-- teams_organizer_manage already covers all tournament teams (including NULL check via EXISTS)
DROP POLICY IF EXISTS "teams_organizer_tournament_access" ON teams;

-- ----------------------------------------------------------------------------
-- STEP 3: Verify teams_organizer_manage exists and is correct
-- ----------------------------------------------------------------------------

-- Ensure teams_organizer_manage exists (should exist from migration 012)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'teams' 
    AND policyname = 'teams_organizer_manage'
  ) THEN
    -- Create if missing (shouldn't happen, but safety check)
    CREATE POLICY "teams_organizer_manage"
    ON public.teams 
    FOR ALL 
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
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- STEP 4: Verify final policy structure
-- ----------------------------------------------------------------------------

-- Expected policies after cleanup:
-- 1. teams_organizer_manage (ALL operations for organizers)
-- 2. teams_coach_access (ALL operations for coaches)
-- 3. teams_organizer_coach_import (SELECT for organizers importing coach teams)
-- 4. teams_public_read (SELECT for public tournament teams)
-- 5. teams_public_coach_view (SELECT for public coach teams)
-- 6. teams_authenticated_read_all (SELECT for all authenticated users)

SELECT 
    policyname,
    cmd as operation,
    roles,
    CASE 
        WHEN policyname = 'teams_organizer_manage' THEN '✅ Main organizer policy'
        WHEN policyname = 'teams_coach_access' THEN '✅ Coach policy'
        WHEN policyname = 'teams_organizer_coach_import' THEN '✅ Import policy'
        WHEN policyname LIKE '%public%' THEN '✅ Public read policy'
        WHEN policyname LIKE '%authenticated%' THEN '✅ Authenticated read policy'
        ELSE '⚠️ Review needed'
    END as policy_status
FROM pg_policies 
WHERE tablename = 'teams'
ORDER BY 
    CASE 
        WHEN cmd = 'ALL' THEN 1
        WHEN cmd = 'SELECT' THEN 2
        ELSE 3
    END,
    policyname;

-- ----------------------------------------------------------------------------
-- STEP 5: Verify no conflicts
-- ----------------------------------------------------------------------------

-- Check for duplicate policies with same operation
SELECT 
    cmd,
    COUNT(*) as policy_count,
    array_agg(policyname) as policy_names
FROM pg_policies 
WHERE tablename = 'teams'
GROUP BY cmd
HAVING COUNT(*) > 1 AND cmd = 'ALL';

-- Expected: Should return 0 rows (no duplicate ALL policies)
-- If rows returned, investigate which policies overlap

-- ----------------------------------------------------------------------------
-- VERIFICATION CHECKLIST
-- ----------------------------------------------------------------------------

-- ✅ teams_organizer_manage should exist (ALL operations)
-- ✅ teams_coach_access should exist (ALL operations)
-- ✅ teams_organizer_tournament_access should NOT exist (removed)
-- ✅ No duplicate ALL policies
-- ✅ Read policies remain intact

-- ----------------------------------------------------------------------------
-- NOTES
-- ----------------------------------------------------------------------------
-- 1. teams_organizer_manage covers ALL teams in organizer's tournaments
--    - Includes organizer-created teams
--    - Includes coach-created teams in tournaments
--    - Works with NULL tournament_id check via EXISTS
-- 
-- 2. teams_organizer_tournament_access was redundant because:
--    - Same logic as teams_organizer_manage
--    - Extra tournament_id IS NOT NULL check is unnecessary (EXISTS handles NULL)
--    - Having both policies creates confusion
--
-- 3. PostgreSQL RLS uses OR logic - if ANY policy allows, operation succeeds
--    - teams_organizer_manage OR teams_coach_access = both can manage their teams
--    - No conflicts expected
--
-- 4. Policy priority (for reference):
--    - ALL policies take precedence over SELECT
--    - Multiple ALL policies = OR logic (any can allow)
--    - SELECT policies are additive (any can allow)
-- ============================================================================

