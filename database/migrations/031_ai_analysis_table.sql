-- ============================================================================
-- MIGRATION 031: AI Analysis Table
-- ============================================================================
-- Purpose: Create table to store AI-generated game analysis
-- Date: January 14, 2025
-- Backend Team: Please execute this migration in Supabase
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- STEP 1: Create ai_analysis table
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  analysis_data JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT now(),
  generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  version INTEGER DEFAULT 1,
  
  -- Ensure one analysis per game (latest version)
  UNIQUE(game_id)
);

-- Add helpful comments
COMMENT ON TABLE ai_analysis IS 'Stores AI-generated game analysis from GPT-4';
COMMENT ON COLUMN ai_analysis.analysis_data IS 'Complete AI analysis JSON structure';
COMMENT ON COLUMN ai_analysis.version IS 'Analysis version (for future schema changes)';

-- ----------------------------------------------------------------------------
-- STEP 2: Create indexes for efficient querying
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_ai_analysis_game_id ON ai_analysis(game_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_generated_at ON ai_analysis(generated_at DESC);

-- ----------------------------------------------------------------------------
-- STEP 3: RLS Policies
-- ----------------------------------------------------------------------------

ALTER TABLE ai_analysis ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "ai_analysis_admin_all" ON ai_analysis
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Coaches can view their own game analyses
CREATE POLICY "ai_analysis_coach_read" ON ai_analysis
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games
      WHERE games.id = ai_analysis.game_id
        AND games.is_coach_game = true
        AND games.stat_admin_id = auth.uid()
    )
  );

-- Stat admins can view analyses for games they're assigned to
CREATE POLICY "ai_analysis_stat_admin_read" ON ai_analysis
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games
      WHERE games.id = ai_analysis.game_id
        AND games.stat_admin_id = auth.uid()
    )
  );

-- Organizers can view analyses for their tournament games
CREATE POLICY "ai_analysis_organizer_read" ON ai_analysis
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN tournaments t ON g.tournament_id = t.id
      WHERE g.id = ai_analysis.game_id
        AND t.organizer_id = auth.uid()
    )
  );

COMMIT;
