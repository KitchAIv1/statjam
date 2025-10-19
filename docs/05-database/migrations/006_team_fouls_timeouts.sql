-- ============================================================================
-- MIGRATION 006: Team Fouls & Timeouts Tracking
-- ============================================================================
-- Purpose: Add team fouls tracking and timeout management to games table
-- Date: October 19, 2025
-- Backend Team: Please execute this migration in Supabase
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Add team fouls and timeouts columns to games table
-- ----------------------------------------------------------------------------

ALTER TABLE games 
ADD COLUMN IF NOT EXISTS team_a_fouls INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS team_b_fouls INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS team_a_timeouts_remaining INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS team_b_timeouts_remaining INTEGER DEFAULT 7;

-- ----------------------------------------------------------------------------
-- STEP 2: Create game_timeouts table for timeout history
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS game_timeouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  quarter INTEGER NOT NULL,
  game_clock_minutes INTEGER NOT NULL,
  game_clock_seconds INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster timeout queries
CREATE INDEX IF NOT EXISTS idx_game_timeouts_game ON game_timeouts(game_id);
CREATE INDEX IF NOT EXISTS idx_game_timeouts_team ON game_timeouts(team_id);

-- ----------------------------------------------------------------------------
-- STEP 3: Create trigger to auto-increment team fouls
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION increment_team_fouls()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment for foul stats
  IF NEW.stat_type = 'foul' THEN
    -- Increment team A fouls if this is a team A player foul
    UPDATE games
    SET team_a_fouls = team_a_fouls + 1
    WHERE id = NEW.game_id AND team_a_id = NEW.team_id;
    
    -- Increment team B fouls if this is a team B player foul
    UPDATE games
    SET team_b_fouls = team_b_fouls + 1
    WHERE id = NEW.game_id AND team_b_id = NEW.team_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS increment_team_fouls_trigger ON game_stats;

CREATE TRIGGER increment_team_fouls_trigger
AFTER INSERT ON game_stats
FOR EACH ROW
EXECUTE FUNCTION increment_team_fouls();

-- ----------------------------------------------------------------------------
-- STEP 4: Add RLS policies for game_timeouts table
-- ----------------------------------------------------------------------------

-- Enable RLS
ALTER TABLE game_timeouts ENABLE ROW LEVEL SECURITY;

-- Stat admins can insert timeouts for their assigned games
CREATE POLICY "game_timeouts_stat_admin_insert" ON game_timeouts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    game_id IN (
      SELECT id FROM games WHERE stat_admin_id = auth.uid()
    )
  );

-- Anyone can view timeouts for games they can access
CREATE POLICY "game_timeouts_public_view" ON game_timeouts
  FOR SELECT
  TO anon, authenticated
  USING (
    game_id IN (
      SELECT id FROM games WHERE tournament_id IN (
        SELECT id FROM tournaments WHERE is_public = true
      )
    )
    OR
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

-- ----------------------------------------------------------------------------
-- VERIFICATION QUERIES (Run after migration)
-- ----------------------------------------------------------------------------

-- Check if columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'games'
AND column_name IN ('team_a_fouls', 'team_b_fouls', 'team_a_timeouts_remaining', 'team_b_timeouts_remaining');

-- Check if game_timeouts table exists
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'game_timeouts';

-- Check if trigger exists
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'increment_team_fouls_trigger';

-- ----------------------------------------------------------------------------
-- ROLLBACK (If needed)
-- ----------------------------------------------------------------------------

-- To rollback this migration, run:
/*
DROP TRIGGER IF EXISTS increment_team_fouls_trigger ON game_stats;
DROP FUNCTION IF EXISTS increment_team_fouls();
DROP TABLE IF EXISTS game_timeouts;
ALTER TABLE games DROP COLUMN IF EXISTS team_a_fouls;
ALTER TABLE games DROP COLUMN IF EXISTS team_b_fouls;
ALTER TABLE games DROP COLUMN IF EXISTS team_a_timeouts_remaining;
ALTER TABLE games DROP COLUMN IF EXISTS team_b_timeouts_remaining;
*/

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

