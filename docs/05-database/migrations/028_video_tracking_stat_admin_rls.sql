-- ============================================================================
-- VIDEO TRACKING STAT ADMIN RLS POLICY MIGRATION
-- ============================================================================
-- Purpose: Allow stat admins to insert stats for games where they are assigned
--          via video tracking (game_videos.assigned_stat_admin_id)
--
-- Issue: Coach games have games.stat_admin_id = NULL, but video tracking
--        assigns stat admins via game_videos.assigned_stat_admin_id
--
-- Solution: Add RLS policies that check video assignment for coach games
-- ============================================================================

-- Phase 1: Check current policies on game_stats
SELECT 
    policyname,
    cmd as command,
    qual as using_clause,
    with_check
FROM pg_policies 
WHERE tablename = 'game_stats'
ORDER BY policyname;

-- Phase 2: Drop existing policies that might conflict
DROP POLICY IF EXISTS "game_stats_video_stat_admin_insert" ON game_stats;
DROP POLICY IF EXISTS "game_stats_video_stat_admin_access" ON game_stats;
DROP POLICY IF EXISTS "game_stats_assigned_stat_admin_insert" ON game_stats;

-- Phase 3: Add INSERT policy for stat admins assigned via video tracking
-- This allows stat admins to insert stats when:
-- 1. They are assigned to the game's video (game_videos.assigned_stat_admin_id)
CREATE POLICY "game_stats_video_stat_admin_insert" ON game_stats
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_videos gv
      WHERE gv.game_id = game_stats.game_id 
      AND gv.assigned_stat_admin_id = auth.uid()
    )
  );

-- Phase 4: Add SELECT policy for stat admins assigned via video tracking
CREATE POLICY "game_stats_video_stat_admin_select" ON game_stats
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM game_videos gv
      WHERE gv.game_id = game_stats.game_id 
      AND gv.assigned_stat_admin_id = auth.uid()
    )
  );

-- Phase 5: Add UPDATE policy for stat admins assigned via video tracking
CREATE POLICY "game_stats_video_stat_admin_update" ON game_stats
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM game_videos gv
      WHERE gv.game_id = game_stats.game_id 
      AND gv.assigned_stat_admin_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_videos gv
      WHERE gv.game_id = game_stats.game_id 
      AND gv.assigned_stat_admin_id = auth.uid()
    )
  );

-- Phase 6: Add DELETE policy for stat admins assigned via video tracking
CREATE POLICY "game_stats_video_stat_admin_delete" ON game_stats
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM game_videos gv
      WHERE gv.game_id = game_stats.game_id 
      AND gv.assigned_stat_admin_id = auth.uid()
    )
  );

-- Phase 7: Verify the policies were created
SELECT 
    policyname,
    cmd as command,
    with_check
FROM pg_policies 
WHERE tablename = 'game_stats'
AND policyname LIKE 'game_stats_video%'
ORDER BY policyname;

-- ============================================================================
-- NOTE: This migration adds 4 new RLS policies for video-based stat tracking:
-- 1. game_stats_video_stat_admin_insert - INSERT for assigned video trackers
-- 2. game_stats_video_stat_admin_select - SELECT for assigned video trackers
-- 3. game_stats_video_stat_admin_update - UPDATE for assigned video trackers
-- 4. game_stats_video_stat_admin_delete - DELETE for assigned video trackers
--
-- These policies work alongside existing policies that check games.stat_admin_id
-- Now stat admins can track stats if:
-- - They are assigned directly to the game (games.stat_admin_id = auth.uid())
-- - OR they are assigned to track the game's video (game_videos.assigned_stat_admin_id)
-- ============================================================================

