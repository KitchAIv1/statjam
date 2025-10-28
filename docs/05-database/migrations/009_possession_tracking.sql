-- ============================================================================
-- Migration: 009_possession_tracking.sql
-- Purpose: Create game_possessions table for possession history tracking
-- Phase: 1 (Foundation)
-- Breaking Changes: NONE (new table, doesn't affect existing functionality)
-- Rollback: Not needed (table can remain unused)
-- ============================================================================

-- ✅ ADDITIVE: New table for possession history
CREATE TABLE IF NOT EXISTS game_possessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  start_quarter INT NOT NULL CHECK (start_quarter BETWEEN 1 AND 8),
  start_time_seconds INT NOT NULL CHECK (start_time_seconds >= 0),
  end_quarter INT CHECK (end_quarter BETWEEN 1 AND 8),
  end_time_seconds INT CHECK (end_time_seconds >= 0),
  end_reason TEXT CHECK (end_reason IN (
    'made_shot', 'turnover', 'steal', 'defensive_rebound', 
    'violation', 'foul', 'timeout', 'quarter_end', 'game_end'
  )),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_possessions_game_id ON game_possessions(game_id);
CREATE INDEX IF NOT EXISTS idx_game_possessions_team_id ON game_possessions(team_id);
CREATE INDEX IF NOT EXISTS idx_game_possessions_game_team ON game_possessions(game_id, team_id);

-- Comments
COMMENT ON TABLE game_possessions IS 'Tracks possession history for analytics and auto-flip functionality';
COMMENT ON COLUMN game_possessions.start_quarter IS 'Quarter when possession started (1-4 regulation, 5+ overtime)';
COMMENT ON COLUMN game_possessions.start_time_seconds IS 'Game clock seconds remaining when possession started';
COMMENT ON COLUMN game_possessions.end_quarter IS 'Quarter when possession ended (null if still active)';
COMMENT ON COLUMN game_possessions.end_time_seconds IS 'Game clock seconds remaining when possession ended';
COMMENT ON COLUMN game_possessions.end_reason IS 'Why possession ended: made_shot, turnover, steal, defensive_rebound, violation, foul, timeout, quarter_end, game_end';

-- ✅ RLS POLICIES: Permissive - public read, admin/organizer/coach write
ALTER TABLE game_possessions ENABLE ROW LEVEL SECURITY;

-- Public read access (for live viewer)
CREATE POLICY game_possessions_public_read ON game_possessions
  FOR SELECT USING (true);

-- Stat admin can write all possessions
CREATE POLICY game_possessions_stat_admin_write ON game_possessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'stat_admin'
    )
  );

-- Organizer can write possessions for their tournament games
CREATE POLICY game_possessions_organizer_write ON game_possessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM games
      JOIN tournaments ON tournaments.id = games.tournament_id
      WHERE games.id = game_possessions.game_id
      AND tournaments.organizer_id = auth.uid()
    )
  );

-- Coach can write possessions for their games
CREATE POLICY game_possessions_coach_write ON game_possessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM games
      JOIN teams ON teams.id = games.team_a_id OR teams.id = games.team_b_id
      WHERE games.id = game_possessions.game_id
      AND teams.coach_id = auth.uid()
    )
  );

-- ✅ VERIFICATION
DO $$
BEGIN
  RAISE NOTICE 'Migration 009: game_possessions table created successfully';
  RAISE NOTICE 'RLS policies applied for public read, admin/organizer/coach write';
  RAISE NOTICE 'No impact on existing games or game_stats';
END $$;

