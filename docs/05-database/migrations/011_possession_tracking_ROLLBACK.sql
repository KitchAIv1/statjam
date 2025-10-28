-- ============================================================================
-- ROLLBACK: 011_possession_tracking.sql
-- Purpose: Clean rollback of possession tracking migration
-- Run this BEFORE re-running the migration if you encounter errors
-- ============================================================================

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_update_possession_duration ON game_possessions;
DROP TRIGGER IF EXISTS trigger_update_possession_changed_at ON games;

-- Drop functions (specify parameter types for overloaded functions)
DROP FUNCTION IF EXISTS update_possession_duration();
DROP FUNCTION IF EXISTS update_possession_changed_at();
DROP FUNCTION IF EXISTS calculate_possession_duration(INT, INT, INT, INT, INT, INT);
DROP FUNCTION IF EXISTS get_current_possession(UUID);
DROP FUNCTION IF EXISTS get_possession_stats(UUID) CASCADE;

-- Drop policies
DROP POLICY IF EXISTS game_possessions_public_read ON game_possessions;
DROP POLICY IF EXISTS game_possessions_stat_admin_write ON game_possessions;
DROP POLICY IF EXISTS game_possessions_coach_write ON game_possessions;
DROP POLICY IF EXISTS game_possessions_organizer_read ON game_possessions;

-- Drop table
DROP TABLE IF EXISTS game_possessions CASCADE;

-- Remove columns from games
ALTER TABLE games 
  DROP COLUMN IF EXISTS current_possession_team_id,
  DROP COLUMN IF EXISTS jump_ball_arrow_team_id,
  DROP COLUMN IF EXISTS possession_changed_at;

-- Confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Rollback complete - possession tracking removed';
END $$;

