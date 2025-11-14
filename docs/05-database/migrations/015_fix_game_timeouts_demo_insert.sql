-- ============================================================================
-- MIGRATION 015: Fix game_timeouts RLS - Add Demo Game Support for Stat Admins
-- ============================================================================
-- Purpose: Allow stat admins to insert timeouts for demo games
-- Date: November 14, 2025
-- Backend Team: Please execute this migration in Supabase
-- Dependencies: Migration 014 (organizer insert) must be completed first
-- ============================================================================
--
-- ISSUE: Stat admins getting 403 error when trying to INSERT timeouts for demo games
-- ERROR: "new row violates row-level security policy for table \"game_timeouts\""
-- 
-- ROOT CAUSE: Demo games don't have stat_admin_id assigned, so the existing RLS policy
-- blocks stat admins from inserting timeouts into demo games
--
-- SOLUTION: Update stat_admin INSERT policy to allow:
-- 1. Timeouts for games assigned to the stat admin (stat_admin_id = auth.uid())
-- 2. Timeouts for demo games (is_demo = true) by any stat admin
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
-- STEP 2: Drop existing stat_admin INSERT policy
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "game_timeouts_stat_admin_insert" ON game_timeouts;

-- ----------------------------------------------------------------------------
-- STEP 3: Recreate stat_admin INSERT policy with demo game support
-- ----------------------------------------------------------------------------
-- Stat admins can insert timeouts for:
-- 1. Games assigned to them (stat_admin_id = auth.uid())
-- 2. Demo games (is_demo = true) - accessible to all stat admins
CREATE POLICY "game_timeouts_stat_admin_insert" ON game_timeouts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    game_id IN (
      SELECT id FROM games 
      WHERE (
        stat_admin_id = auth.uid()  -- ✅ Assigned games (existing behavior)
        OR 
        is_demo = true              -- ✅ Demo games (NEW: accessible to all stat admins)
      )
    )
  );

-- ----------------------------------------------------------------------------
-- STEP 4: Verify the policy was created successfully
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
AND policyname = 'game_timeouts_stat_admin_insert';

-- ----------------------------------------------------------------------------
-- VERIFICATION
-- ----------------------------------------------------------------------------
-- After migration, stat admins should be able to:
-- 1. Insert timeouts for games assigned to them (existing behavior)
-- 2. Insert timeouts for demo games (NEW)
--
-- Expected policies on game_timeouts:
-- - game_timeouts_stat_admin_insert (stat admins + demo games) ← UPDATED
-- - game_timeouts_organizer_insert (organizers)
-- - game_timeouts_public_view (public SELECT)
-- ============================================================================

