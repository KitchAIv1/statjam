-- ============================================================================
-- Migration 031: Add Admin UPDATE/DELETE Policy for game_stats
-- ============================================================================
-- ISSUE: Admins cannot edit stats in QC Review because there's no RLS policy
-- granting UPDATE permission to users with role = 'admin'
--
-- SOLUTION: Add UPDATE and DELETE policies for admin users
-- ============================================================================

-- Phase 1: Drop if exists (idempotent)
DROP POLICY IF EXISTS "game_stats_admin_update" ON game_stats;
DROP POLICY IF EXISTS "game_stats_admin_delete" ON game_stats;

-- Phase 2: Add UPDATE policy for admins
CREATE POLICY "game_stats_admin_update" ON game_stats
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Phase 3: Add DELETE policy for admins
CREATE POLICY "game_stats_admin_delete" ON game_stats
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Phase 4: Verify
SELECT 
    policyname,
    cmd as command
FROM pg_policies 
WHERE tablename = 'game_stats'
AND policyname LIKE 'game_stats_admin%'
ORDER BY policyname;

-- ============================================================================
-- NOTE: This migration adds 2 new RLS policies:
-- 1. game_stats_admin_update - Admins can update any stat
-- 2. game_stats_admin_delete - Admins can delete any stat
-- 
-- These are needed for the QC Review feature where admins review and edit
-- stats tracked by stat admins before approving clip generation.
-- ============================================================================

