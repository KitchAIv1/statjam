-- ============================================================================
-- VIDEO TRACKING GAMES TABLE UPDATE RLS POLICY MIGRATION
-- ============================================================================
-- Purpose: Allow stat admins to UPDATE games table (clock fields) when assigned
--          via video tracking (game_videos.assigned_stat_admin_id)
--
-- Issue: Video tracking needs to update games.quarter, games.game_clock_minutes,
--        games.game_clock_seconds for accurate player minutes calculation.
--        For coach games, games.stat_admin_id = coach_id, not the video tracker.
--
-- Solution: Add RLS policy that checks video assignment for games UPDATE
-- ============================================================================

-- Phase 1: Check current policies on games table
SELECT 
    policyname,
    cmd as command,
    qual as using_clause
FROM pg_policies 
WHERE tablename = 'games'
ORDER BY policyname;

-- Phase 2: Drop existing video-related policies if they exist
DROP POLICY IF EXISTS "games_video_stat_admin_update" ON games;
DROP POLICY IF EXISTS "games_video_stat_admin_select" ON games;

-- Phase 3: Add SELECT policy for stat admins assigned via video tracking
-- (Needed for UPDATE to work - must be able to select the row first)
CREATE POLICY "games_video_stat_admin_select" ON games
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM game_videos gv
      WHERE gv.game_id = games.id 
      AND gv.assigned_stat_admin_id = auth.uid()
    )
  );

-- Phase 4: Add UPDATE policy for stat admins assigned via video tracking
-- This allows stat admins to update game clock fields when:
-- 1. They are assigned to the game's video (game_videos.assigned_stat_admin_id)
CREATE POLICY "games_video_stat_admin_update" ON games
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM game_videos gv
      WHERE gv.game_id = games.id 
      AND gv.assigned_stat_admin_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_videos gv
      WHERE gv.game_id = games.id 
      AND gv.assigned_stat_admin_id = auth.uid()
    )
  );

-- Phase 5: Verify the policies were created
SELECT 
    policyname,
    cmd as command
FROM pg_policies 
WHERE tablename = 'games'
AND policyname LIKE 'games_video%'
ORDER BY policyname;

-- ============================================================================
-- NOTE: This migration adds 2 new RLS policies for video-based game updates:
-- 1. games_video_stat_admin_select - SELECT for assigned video trackers
-- 2. games_video_stat_admin_update - UPDATE for assigned video trackers
--
-- These policies work alongside existing policies that check games.stat_admin_id
-- Now stat admins can update game clock if:
-- - They are assigned directly to the game (games.stat_admin_id = auth.uid())
-- - OR they are assigned to track the game's video (game_videos.assigned_stat_admin_id)
--
-- This enables accurate player minutes calculation for video-tracked games
-- by allowing updates to: quarter, game_clock_minutes, game_clock_seconds
-- ============================================================================

