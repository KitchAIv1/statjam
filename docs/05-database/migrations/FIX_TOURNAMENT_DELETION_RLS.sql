-- ============================================================================
-- FIX: Tournament Deletion RLS Policy
-- ============================================================================
-- Issue: Organizers cannot delete tournaments with substitutions
-- Root Cause: game_substitutions table only allows stat_admin DELETE, not organizers
-- Solution: Add organizer DELETE policy for tournament deletion scenarios
-- Date: October 21, 2025
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PROBLEM ANALYSIS
-- ----------------------------------------------------------------------------
-- Current RLS policies on game_substitutions:
-- 1. game_substitutions_stat_admin_manage (FOR ALL) - Only stat admins can DELETE
-- 2. game_substitutions_organizer_read (FOR SELECT) - Organizers can only READ
-- 3. game_substitutions_public_read (FOR SELECT) - Public can only READ
--
-- MISSING: Organizers cannot DELETE substitutions when deleting tournaments
-- ERROR: "update or delete on table games violates foreign key constraint game_substitutions_game_id_fkey"

-- ----------------------------------------------------------------------------
-- SOLUTION: Add Organizer DELETE Policy
-- ----------------------------------------------------------------------------

-- Check current policies before making changes
SELECT 
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_clause,
    with_check
FROM pg_policies 
WHERE tablename = 'game_substitutions'
ORDER BY policyname;

-- Add policy to allow organizers to DELETE substitutions in their tournaments
-- This is needed for tournament deletion cascade
CREATE POLICY "game_substitutions_organizer_delete"
ON public.game_substitutions FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.games g
    JOIN public.tournaments t ON g.tournament_id = t.id
    WHERE g.id = game_substitutions.game_id 
    AND t.organizer_id = auth.uid()
  )
);

-- ----------------------------------------------------------------------------
-- VERIFICATION
-- ----------------------------------------------------------------------------

-- Verify the new policy was created
SELECT 
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_clause
FROM pg_policies 
WHERE tablename = 'game_substitutions'
AND policyname = 'game_substitutions_organizer_delete';

-- Test query to verify organizer can now see substitutions for deletion
-- (Run this as an organizer user to test)
-- SELECT id, game_id FROM game_substitutions 
-- WHERE game_id IN (
--   SELECT g.id FROM games g 
--   JOIN tournaments t ON g.tournament_id = t.id 
--   WHERE t.organizer_id = auth.uid()
-- );

-- ----------------------------------------------------------------------------
-- EXPECTED RESULT
-- ----------------------------------------------------------------------------
-- After applying this migration:
-- 1. Organizers can DELETE substitutions in their tournaments
-- 2. Tournament deletion will succeed (substitutions deleted first)
-- 3. Foreign key constraint errors resolved
-- 4. Stat admins retain full management permissions
-- 5. Public users still have read-only access

SELECT 'Tournament deletion RLS fix applied successfully' as status;
