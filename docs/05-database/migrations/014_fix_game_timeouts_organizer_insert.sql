-- ============================================================================
-- MIGRATION 014: Fix game_timeouts RLS - Add Organizer INSERT Policy
-- ============================================================================
-- Purpose: Allow organizers to insert timeouts for games in their tournaments
-- Date: November 14, 2025
-- Backend Team: Please execute this migration in Supabase
-- ============================================================================
--
-- ISSUE: Organizers getting 403 error when trying to INSERT into game_timeouts
-- ERROR: "new row violates row-level security policy for table \"game_timeouts\""
-- 
-- ROOT CAUSE: Only stat_admin INSERT policy exists, but organizers also need
-- to record timeouts for games in their tournaments
--
-- SOLUTION: Add organizer INSERT policy matching the SELECT policy pattern
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Check current policies on game_timeouts
-- ----------------------------------------------------------------------------

SELECT 
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_clause,
    with_check
FROM pg_policies 
WHERE tablename = 'game_timeouts'
AND cmd = 'INSERT'
ORDER BY policyname;

-- ----------------------------------------------------------------------------
-- STEP 2: Add INSERT policy for organizers
-- ----------------------------------------------------------------------------
-- Organizers can insert timeouts for games in their tournaments
CREATE POLICY "game_timeouts_organizer_insert" ON game_timeouts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    game_id IN (
      SELECT id FROM games WHERE tournament_id IN (
        SELECT id FROM tournaments WHERE organizer_id = auth.uid()
      )
    )
  );

-- ----------------------------------------------------------------------------
-- STEP 3: Verify the policy was created
-- ----------------------------------------------------------------------------

SELECT 
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_clause,
    with_check
FROM pg_policies 
WHERE tablename = 'game_timeouts'
AND policyname = 'game_timeouts_organizer_insert';

-- ----------------------------------------------------------------------------
-- VERIFICATION
-- ----------------------------------------------------------------------------
-- After migration, organizers should be able to:
-- 1. Insert timeouts for games in their tournaments
-- 2. View timeouts for games in their tournaments (already working via SELECT policy)
--
-- Expected policies on game_timeouts:
-- - game_timeouts_stat_admin_insert (stat admins)
-- - game_timeouts_organizer_insert (organizers) ← NEW
-- - game_timeouts_public_view (public SELECT)
-- ============================================================================

