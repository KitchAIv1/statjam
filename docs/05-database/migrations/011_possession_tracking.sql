-- ============================================================================
-- Migration: 011_possession_tracking.sql
-- Purpose: Add possession tracking for Phase 3 automation
-- Date: October 28, 2025
-- Phase: 3 (Possession Automation)
-- ============================================================================

-- ============================================================================
-- PART 1: POSSESSION HISTORY TABLE
-- ============================================================================

-- Create game_possessions table to track possession changes
CREATE TABLE IF NOT EXISTS game_possessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Possession timing
  start_quarter INT NOT NULL CHECK (start_quarter BETWEEN 1 AND 8),
  start_time_minutes INT NOT NULL CHECK (start_time_minutes >= 0),
  start_time_seconds INT NOT NULL CHECK (start_time_seconds >= 0 AND start_time_seconds < 60),
  
  end_quarter INT CHECK (end_quarter BETWEEN 1 AND 8),
  end_time_minutes INT CHECK (end_time_minutes >= 0),
  end_time_seconds INT CHECK (end_time_seconds >= 0 AND end_time_seconds < 60),
  
  -- Possession metadata
  end_reason TEXT CHECK (end_reason IN (
    'made_shot',           -- Possession ended with made basket
    'turnover',            -- Possession ended with turnover
    'steal',               -- Possession ended with steal
    'defensive_rebound',   -- Possession ended with defensive rebound
    'violation',           -- Possession ended with violation
    'foul',                -- Possession ended with foul (sometimes)
    'timeout',             -- Possession paused for timeout
    'quarter_end',         -- Possession ended at quarter end
    'game_end',            -- Possession ended at game end
    'jump_ball'            -- Possession ended with jump ball
  )),
  
  -- Duration calculation (in seconds) - calculated manually, not generated
  duration_seconds INT,
  
  -- Audit fields
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance (duration_seconds index will be added after trigger is created)
CREATE INDEX IF NOT EXISTS idx_game_possessions_game_id ON game_possessions(game_id);
CREATE INDEX IF NOT EXISTS idx_game_possessions_team_id ON game_possessions(team_id);
CREATE INDEX IF NOT EXISTS idx_game_possessions_game_team ON game_possessions(game_id, team_id);
CREATE INDEX IF NOT EXISTS idx_game_possessions_created_at ON game_possessions(created_at);

-- Comments for documentation
COMMENT ON TABLE game_possessions IS 'Tracks possession changes throughout the game for analytics';
COMMENT ON COLUMN game_possessions.end_reason IS 'Why the possession ended (for analytics)';

-- ============================================================================
-- PART 2: ADD POSSESSION COLUMNS TO GAMES TABLE
-- ============================================================================

-- Add current possession tracking to games table
ALTER TABLE games 
  ADD COLUMN IF NOT EXISTS current_possession_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS jump_ball_arrow_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS possession_changed_at TIMESTAMP;

-- Indexes for possession queries
CREATE INDEX IF NOT EXISTS idx_games_current_possession ON games(current_possession_team_id);
CREATE INDEX IF NOT EXISTS idx_games_jump_ball_arrow ON games(jump_ball_arrow_team_id);

-- Comments
COMMENT ON COLUMN games.current_possession_team_id IS 'Team that currently has possession (NULL if unknown)';
COMMENT ON COLUMN games.jump_ball_arrow_team_id IS 'Team that gets next jump ball (alternating possession)';
COMMENT ON COLUMN games.possession_changed_at IS 'Timestamp of last possession change';

-- ============================================================================
-- PART 3: RLS POLICIES FOR GAME_POSSESSIONS
-- ============================================================================

-- Enable RLS
ALTER TABLE game_possessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS game_possessions_public_read ON game_possessions;
DROP POLICY IF EXISTS game_possessions_stat_admin_write ON game_possessions;
DROP POLICY IF EXISTS game_possessions_coach_write ON game_possessions;
DROP POLICY IF EXISTS game_possessions_organizer_read ON game_possessions;

-- Policy 1: Public read access (for live viewers)
CREATE POLICY game_possessions_public_read ON game_possessions
  FOR SELECT
  USING (true);

-- Policy 2: Stat admins can insert/update possessions for their games
CREATE POLICY game_possessions_stat_admin_write ON game_possessions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM games g
      WHERE g.id = game_possessions.game_id
      AND g.stat_admin_id = auth.uid()
    )
  );

-- Policy 3: Coaches can insert/update possessions for their games
CREATE POLICY game_possessions_coach_write ON game_possessions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN teams t ON (g.team_a_id = t.id OR g.team_b_id = t.id)
      WHERE g.id = game_possessions.game_id
      AND t.coach_id = auth.uid()
    )
  );

-- Policy 4: Organizers can read possessions for their tournament games
CREATE POLICY game_possessions_organizer_read ON game_possessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN tournaments tour ON g.tournament_id = tour.id
      WHERE g.id = game_possessions.game_id
      AND tour.organizer_id = auth.uid()
    )
  );

-- ============================================================================
-- PART 4: TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Function to calculate possession duration
CREATE OR REPLACE FUNCTION calculate_possession_duration(
  p_start_quarter INT,
  p_start_minutes INT,
  p_start_seconds INT,
  p_end_quarter INT,
  p_end_minutes INT,
  p_end_seconds INT
) RETURNS INT AS $$
BEGIN
  -- Return NULL if possession hasn't ended
  IF p_end_quarter IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Calculate duration (game clock counts DOWN, so start - end)
  RETURN (
    ((p_start_quarter - 1) * 12 * 60 + p_start_minutes * 60 + p_start_seconds) -
    ((p_end_quarter - 1) * 12 * 60 + p_end_minutes * 60 + p_end_seconds)
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to auto-calculate duration on insert/update
CREATE OR REPLACE FUNCTION update_possession_duration()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate duration if end time is set
  IF NEW.end_quarter IS NOT NULL THEN
    NEW.duration_seconds = calculate_possession_duration(
      NEW.start_quarter,
      NEW.start_time_minutes,
      NEW.start_time_seconds,
      NEW.end_quarter,
      NEW.end_time_minutes,
      NEW.end_time_seconds
    );
  ELSE
    NEW.duration_seconds = NULL;
  END IF;
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate duration
DROP TRIGGER IF EXISTS trigger_update_possession_duration ON game_possessions;
CREATE TRIGGER trigger_update_possession_duration
  BEFORE INSERT OR UPDATE ON game_possessions
  FOR EACH ROW
  EXECUTE FUNCTION update_possession_duration();

-- Function to update possession timestamp
CREATE OR REPLACE FUNCTION update_possession_changed_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.possession_changed_at = NOW();
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on games table when possession changes
DROP TRIGGER IF EXISTS trigger_update_possession_changed_at ON games;
CREATE TRIGGER trigger_update_possession_changed_at
  BEFORE UPDATE OF current_possession_team_id ON games
  FOR EACH ROW
  WHEN (OLD.current_possession_team_id IS DISTINCT FROM NEW.current_possession_team_id)
  EXECUTE FUNCTION update_possession_changed_at();

-- ============================================================================
-- PART 5: HELPER FUNCTIONS
-- ============================================================================

-- Function to get current possession
CREATE OR REPLACE FUNCTION get_current_possession(p_game_id UUID)
RETURNS UUID AS $$
  SELECT current_possession_team_id 
  FROM games 
  WHERE id = p_game_id;
$$ LANGUAGE sql STABLE;

-- Function to get possession statistics for a game
-- Note: Using plpgsql instead of sql to defer column validation
CREATE OR REPLACE FUNCTION get_possession_stats(p_game_id UUID)
RETURNS TABLE(
  team_id UUID,
  team_name TEXT,
  total_possessions BIGINT,
  total_duration_seconds BIGINT,
  avg_possession_seconds NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gp.team_id,
    t.name as team_name,
    COUNT(*) as total_possessions,
    COALESCE(SUM(gp.duration_seconds), 0) as total_duration_seconds,
    ROUND(COALESCE(AVG(gp.duration_seconds), 0), 2) as avg_possession_seconds
  FROM game_possessions gp
  JOIN teams t ON gp.team_id = t.id
  WHERE gp.game_id = p_game_id
  GROUP BY gp.team_id, t.name
  ORDER BY total_possessions DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- PART 6: VALIDATION QUERIES
-- ============================================================================

-- Check if migration applied successfully
DO $$
BEGIN
  -- Check game_possessions table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'game_possessions'
  ) THEN
    RAISE EXCEPTION 'Migration failed: game_possessions table not created';
  END IF;
  
  -- Check possession columns added to games
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'games' 
    AND column_name = 'current_possession_team_id'
  ) THEN
    RAISE EXCEPTION 'Migration failed: current_possession_team_id column not added to games';
  END IF;
  
  -- Check RLS enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'game_possessions' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'Migration failed: RLS not enabled on game_possessions';
  END IF;
  
  RAISE NOTICE '✅ Migration 011_possession_tracking.sql completed successfully';
END $$;

-- ============================================================================
-- VERIFICATION QUERIES (Run these to verify migration)
-- ============================================================================

-- 1. Check table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'game_possessions'
ORDER BY ordinal_position;

-- 2. Check indexes
SELECT 
  indexname, 
  indexdef
FROM pg_indexes
WHERE tablename = 'game_possessions';

-- 3. Check RLS policies
SELECT 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies
WHERE tablename = 'game_possessions';

-- 4. Check games table columns
SELECT 
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_name = 'games'
  AND column_name IN ('current_possession_team_id', 'jump_ball_arrow_team_id', 'possession_changed_at');

-- ============================================================================
-- ROLLBACK (If needed - run these commands to undo migration)
-- ============================================================================

/*
-- Drop triggers
DROP TRIGGER IF EXISTS trigger_update_possession_duration ON game_possessions;
DROP TRIGGER IF EXISTS trigger_update_possession_changed_at ON games;

-- Drop functions
DROP FUNCTION IF EXISTS update_possession_duration();
DROP FUNCTION IF EXISTS update_possession_changed_at();
DROP FUNCTION IF EXISTS calculate_possession_duration(INT, INT, INT, INT, INT, INT);
DROP FUNCTION IF EXISTS get_current_possession(UUID);
DROP FUNCTION IF EXISTS get_possession_stats(UUID);

-- Drop table
DROP TABLE IF EXISTS game_possessions CASCADE;

-- Remove columns from games
ALTER TABLE games 
  DROP COLUMN IF EXISTS current_possession_team_id,
  DROP COLUMN IF EXISTS jump_ball_arrow_team_id,
  DROP COLUMN IF EXISTS possession_changed_at;
*/

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. This migration is ADDITIVE ONLY - no breaking changes
-- 2. Existing games will have NULL possession values (expected)
-- 3. New games will track possession automatically (when automation enabled)
-- 4. RLS policies ensure proper access control for all user roles
-- 5. Duration calculation uses TRIGGER for automatic updates (not GENERATED column for compatibility)
-- 6. Compatible with both Stat Admin and Coach tracker interfaces
-- 7. Jump ball arrow tracks alternating possession per NCAA/FIBA rules
-- 8. Possession history enables advanced analytics (possession time, efficiency)
-- 9. Trigger auto-calculates duration_seconds on INSERT/UPDATE

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

