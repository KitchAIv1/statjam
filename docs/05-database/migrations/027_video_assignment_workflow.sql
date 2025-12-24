-- =============================================================================
-- Migration 027: Video Assignment Workflow
-- =============================================================================
-- Purpose: Add columns to game_videos for stat admin assignment workflow
-- Feature: Admin assigns uploaded videos to stat admins for tracking
-- SAFE: Only adds new nullable columns, no existing data affected
-- =============================================================================

-- =============================================================================
-- ADD ASSIGNMENT COLUMNS TO game_videos
-- =============================================================================
-- These columns track the assignment of videos to stat admins

-- Assigned stat admin (the internal personnel who will track this video)
ALTER TABLE game_videos 
ADD COLUMN IF NOT EXISTS assigned_stat_admin_id UUID REFERENCES users(id);

-- Assignment status workflow
ALTER TABLE game_videos 
ADD COLUMN IF NOT EXISTS assignment_status TEXT DEFAULT 'pending' 
CHECK (assignment_status IN (
  'pending',      -- Uploaded, waiting for admin to assign
  'assigned',     -- Assigned to a stat admin, not yet started
  'in_progress',  -- Stat admin has started tracking
  'completed',    -- Tracking finished, stats delivered
  'cancelled'     -- Video tracking cancelled
));

-- Timestamp when video was assigned to stat admin
ALTER TABLE game_videos 
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

-- Due date (typically 24 hours from assignment for turnaround)
ALTER TABLE game_videos 
ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ;

-- Timestamp when tracking was completed
ALTER TABLE game_videos 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- =============================================================================
-- INDEXES FOR EFFICIENT QUERYING
-- =============================================================================

-- Index for admin queue: find all pending/assigned videos
CREATE INDEX IF NOT EXISTS idx_game_videos_assignment_status 
ON game_videos(assignment_status) 
WHERE assignment_status IN ('pending', 'assigned', 'in_progress');

-- Index for stat admin dashboard: find videos assigned to specific admin
CREATE INDEX IF NOT EXISTS idx_game_videos_assigned_stat_admin 
ON game_videos(assigned_stat_admin_id) 
WHERE assigned_stat_admin_id IS NOT NULL;

-- =============================================================================
-- RLS POLICIES FOR VIDEO ASSIGNMENT
-- =============================================================================
-- Stat admins can view and update videos assigned to them

-- Allow stat admins to view videos assigned to them
DROP POLICY IF EXISTS "stat_admins_view_assigned_videos" ON game_videos;
CREATE POLICY "stat_admins_view_assigned_videos" ON game_videos
FOR SELECT
TO authenticated
USING (
  assigned_stat_admin_id = auth.uid()
  OR uploaded_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'organizer')
  )
);

-- Allow stat admins to update videos assigned to them (for status updates)
DROP POLICY IF EXISTS "stat_admins_update_assigned_videos" ON game_videos;
CREATE POLICY "stat_admins_update_assigned_videos" ON game_videos
FOR UPDATE
TO authenticated
USING (
  assigned_stat_admin_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- =============================================================================
-- VERIFICATION QUERIES (run after migration)
-- =============================================================================
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'game_videos' 
-- AND column_name IN ('assigned_stat_admin_id', 'assignment_status', 'assigned_at', 'due_at', 'completed_at');

-- =============================================================================
-- ROLLBACK (if needed)
-- =============================================================================
-- ALTER TABLE game_videos DROP COLUMN IF EXISTS assigned_stat_admin_id;
-- ALTER TABLE game_videos DROP COLUMN IF EXISTS assignment_status;
-- ALTER TABLE game_videos DROP COLUMN IF EXISTS assigned_at;
-- ALTER TABLE game_videos DROP COLUMN IF EXISTS due_at;
-- ALTER TABLE game_videos DROP COLUMN IF EXISTS completed_at;
-- DROP INDEX IF EXISTS idx_game_videos_assignment_status;
-- DROP INDEX IF EXISTS idx_game_videos_assigned_stat_admin;
-- DROP POLICY IF EXISTS "stat_admins_view_assigned_videos" ON game_videos;
-- DROP POLICY IF EXISTS "stat_admins_update_assigned_videos" ON game_videos;

