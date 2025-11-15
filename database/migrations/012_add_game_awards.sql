-- ============================================================================
-- MIGRATION 012: Game Awards (Player of the Game & Hustle Player)
-- ============================================================================
-- Purpose: Add award tracking to games table for Player of the Game and Hustle Player
-- Date: January 15, 2025
-- Backend Team: Please execute this migration in Supabase
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- STEP 1: Add award columns to games table
-- ----------------------------------------------------------------------------

ALTER TABLE games 
ADD COLUMN IF NOT EXISTS player_of_the_game_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS hustle_player_of_the_game_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS awards_selected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS awards_selected_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add helpful comments
COMMENT ON COLUMN games.player_of_the_game_id IS 'Player selected as Player of the Game';
COMMENT ON COLUMN games.hustle_player_of_the_game_id IS 'Player selected as Hustle Player of the Game';
COMMENT ON COLUMN games.awards_selected_at IS 'Timestamp when awards were selected';
COMMENT ON COLUMN games.awards_selected_by IS 'User ID who selected the awards (stat_admin or organizer)';

-- ----------------------------------------------------------------------------
-- STEP 2: Create indexes for faster award queries
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_games_player_of_the_game ON games(player_of_the_game_id) WHERE player_of_the_game_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_games_hustle_player ON games(hustle_player_of_the_game_id) WHERE hustle_player_of_the_game_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_games_awards_selected_at ON games(awards_selected_at) WHERE awards_selected_at IS NOT NULL;

-- ----------------------------------------------------------------------------
-- STEP 3: Create game_awards_history table for analytics (optional)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS game_awards_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES users(id) ON DELETE SET NULL NOT NULL,
  award_type TEXT CHECK (award_type IN ('player_of_the_game', 'hustle_player')) NOT NULL,
  selected_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_auto_suggested BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one award type per game per player
  UNIQUE(game_id, player_id, award_type)
);

-- Create indexes for game_awards_history
CREATE INDEX IF NOT EXISTS idx_game_awards_history_game ON game_awards_history(game_id);
CREATE INDEX IF NOT EXISTS idx_game_awards_history_player ON game_awards_history(player_id);
CREATE INDEX IF NOT EXISTS idx_game_awards_history_type ON game_awards_history(award_type);

-- ----------------------------------------------------------------------------
-- STEP 4: Add RLS policies for game_awards_history
-- ----------------------------------------------------------------------------

ALTER TABLE game_awards_history ENABLE ROW LEVEL SECURITY;

-- Anyone can view awards (public data)
CREATE POLICY "game_awards_history_public_view" ON game_awards_history
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Stat admins and organizers can insert awards
CREATE POLICY "game_awards_history_stat_admin_insert" ON game_awards_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Stat admin for their assigned games
    game_id IN (
      SELECT id FROM games WHERE stat_admin_id = auth.uid()
    )
    OR
    -- Organizer for their tournament games
    game_id IN (
      SELECT id FROM games WHERE tournament_id IN (
        SELECT id FROM tournaments WHERE organizer_id = auth.uid()
      )
    )
  );

-- Stat admins and organizers can update awards
CREATE POLICY "game_awards_history_stat_admin_update" ON game_awards_history
  FOR UPDATE
  TO authenticated
  USING (
    game_id IN (
      SELECT id FROM games WHERE stat_admin_id = auth.uid()
    )
    OR
    game_id IN (
      SELECT id FROM games WHERE tournament_id IN (
        SELECT id FROM tournaments WHERE organizer_id = auth.uid()
      )
    )
  );

COMMIT;

-- ----------------------------------------------------------------------------
-- VERIFICATION QUERIES (Run after migration)
-- ----------------------------------------------------------------------------

-- Check columns were added
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'games' 
-- AND column_name IN ('player_of_the_game_id', 'hustle_player_of_the_game_id', 'awards_selected_at', 'awards_selected_by');

-- Check table was created
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'game_awards_history';

-- Check indexes were created
-- SELECT indexname FROM pg_indexes WHERE tablename IN ('games', 'game_awards_history') AND indexname LIKE '%award%';

