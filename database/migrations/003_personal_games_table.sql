-- Personal Games Table Migration
-- Date: October 21, 2025
-- Description: Adds personal_games table for player-only stat tracking (pickup games, practices, scrimmages)

-- Start transaction
BEGIN;

-- ============================================================================
-- 1. CREATE PERSONAL GAMES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS personal_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Game metadata
  game_date DATE NOT NULL DEFAULT CURRENT_DATE,
  location TEXT,
  opponent TEXT,
  
  -- Basic stats
  points INTEGER DEFAULT 0 CHECK (points >= 0),
  rebounds INTEGER DEFAULT 0 CHECK (rebounds >= 0),
  assists INTEGER DEFAULT 0 CHECK (assists >= 0),
  steals INTEGER DEFAULT 0 CHECK (steals >= 0),
  blocks INTEGER DEFAULT 0 CHECK (blocks >= 0),
  turnovers INTEGER DEFAULT 0 CHECK (turnovers >= 0),
  fouls INTEGER DEFAULT 0 CHECK (fouls >= 0 AND fouls <= 6),
  
  -- Shooting stats
  fg_made INTEGER DEFAULT 0 CHECK (fg_made >= 0),
  fg_attempted INTEGER DEFAULT 0 CHECK (fg_attempted >= 0),
  three_pt_made INTEGER DEFAULT 0 CHECK (three_pt_made >= 0),
  three_pt_attempted INTEGER DEFAULT 0 CHECK (three_pt_attempted >= 0),
  ft_made INTEGER DEFAULT 0 CHECK (ft_made >= 0),
  ft_attempted INTEGER DEFAULT 0 CHECK (ft_attempted >= 0),
  
  -- Privacy and metadata
  is_public BOOLEAN DEFAULT FALSE,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Validation constraints
  CONSTRAINT valid_fg_ratio CHECK (fg_made <= fg_attempted),
  CONSTRAINT valid_3pt_ratio CHECK (three_pt_made <= three_pt_attempted),
  CONSTRAINT valid_ft_ratio CHECK (ft_made <= ft_attempted),
  CONSTRAINT valid_game_date CHECK (game_date <= CURRENT_DATE),
  CONSTRAINT reasonable_stats CHECK (
    points <= 200 AND 
    rebounds <= 50 AND 
    assists <= 50 AND 
    steals <= 25 AND 
    blocks <= 25 AND
    turnovers <= 30 AND
    fg_attempted <= 100 AND
    three_pt_attempted <= 50 AND
    ft_attempted <= 50
  )
);

-- Add update trigger for timestamps
CREATE OR REPLACE FUNCTION update_personal_games_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_personal_games_timestamp
    BEFORE UPDATE ON personal_games
    FOR EACH ROW EXECUTE FUNCTION update_personal_games_timestamp();

-- ============================================================================
-- 2. CREATE PERFORMANCE INDEXES
-- ============================================================================

-- Primary indexes for queries
CREATE INDEX IF NOT EXISTS idx_personal_games_player_id ON personal_games(player_id);
CREATE INDEX IF NOT EXISTS idx_personal_games_date ON personal_games(game_date DESC);
CREATE INDEX IF NOT EXISTS idx_personal_games_player_date ON personal_games(player_id, game_date DESC);
CREATE INDEX IF NOT EXISTS idx_personal_games_public ON personal_games(is_public, player_id) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_personal_games_created_at ON personal_games(created_at DESC);

-- Composite index for pagination
CREATE INDEX IF NOT EXISTS idx_personal_games_pagination ON personal_games(player_id, created_at DESC, id);

-- ============================================================================
-- 3. SETUP ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on personal_games table
ALTER TABLE personal_games ENABLE ROW LEVEL SECURITY;

-- Policy: Players can only access their own personal games
CREATE POLICY "players_own_personal_games" ON personal_games
  FOR ALL TO authenticated
  USING (player_id = auth.uid())
  WITH CHECK (player_id = auth.uid());

-- Policy: Public read access for public games (for future sharing features)
CREATE POLICY "public_read_public_games" ON personal_games
  FOR SELECT TO anon, authenticated
  USING (is_public = true);

-- Policy: Service role full access (for admin/analytics)
CREATE POLICY "service_role_full_access_personal_games" ON personal_games
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 4. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate field goal percentage
CREATE OR REPLACE FUNCTION calculate_fg_percentage(made INTEGER, attempted INTEGER)
RETURNS NUMERIC(4,1) AS $$
BEGIN
  IF attempted = 0 THEN
    RETURN 0.0;
  END IF;
  RETURN ROUND((made::NUMERIC / attempted::NUMERIC) * 100, 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate effective field goal percentage
CREATE OR REPLACE FUNCTION calculate_efg_percentage(fg_made INTEGER, fg_attempted INTEGER, three_pt_made INTEGER)
RETURNS NUMERIC(4,1) AS $$
BEGIN
  IF fg_attempted = 0 THEN
    RETURN 0.0;
  END IF;
  RETURN ROUND(((fg_made + (0.5 * three_pt_made))::NUMERIC / fg_attempted::NUMERIC) * 100, 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 5. CREATE ANALYTICS VIEW
-- ============================================================================

-- View for player personal game statistics
CREATE OR REPLACE VIEW player_personal_stats AS
SELECT 
  player_id,
  u.email as player_email,
  
  -- Game counts
  COUNT(*) as games_played,
  COUNT(*) FILTER (WHERE game_date >= CURRENT_DATE - INTERVAL '30 days') as games_last_30_days,
  
  -- Averages
  ROUND(AVG(points), 1) as avg_points,
  ROUND(AVG(rebounds), 1) as avg_rebounds,
  ROUND(AVG(assists), 1) as avg_assists,
  ROUND(AVG(steals), 1) as avg_steals,
  ROUND(AVG(blocks), 1) as avg_blocks,
  ROUND(AVG(turnovers), 1) as avg_turnovers,
  
  -- Shooting percentages
  calculate_fg_percentage(SUM(fg_made), SUM(fg_attempted)) as fg_percentage,
  calculate_fg_percentage(SUM(three_pt_made), SUM(three_pt_attempted)) as three_pt_percentage,
  calculate_fg_percentage(SUM(ft_made), SUM(ft_attempted)) as ft_percentage,
  calculate_efg_percentage(SUM(fg_made), SUM(fg_attempted), SUM(three_pt_made)) as efg_percentage,
  
  -- Totals
  SUM(points) as total_points,
  SUM(rebounds) as total_rebounds,
  SUM(assists) as total_assists,
  SUM(steals) as total_steals,
  SUM(blocks) as total_blocks,
  
  -- Career highs
  MAX(points) as career_high_points,
  MAX(rebounds) as career_high_rebounds,
  MAX(assists) as career_high_assists,
  MAX(steals) as career_high_steals,
  MAX(blocks) as career_high_blocks,
  
  -- Date range
  MIN(game_date) as first_game_date,
  MAX(game_date) as last_game_date,
  MAX(created_at) as last_updated
  
FROM personal_games pg
JOIN users u ON pg.player_id = u.id
GROUP BY player_id, u.email;

-- ============================================================================
-- 6. SETUP RATE LIMITING TABLE (Optional)
-- ============================================================================

-- Table to track daily game creation limits
CREATE TABLE IF NOT EXISTS personal_games_rate_limit (
  player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  games_created INTEGER DEFAULT 0,
  PRIMARY KEY (player_id, date)
);

-- Index for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_rate_limit_player_date ON personal_games_rate_limit(player_id, date);

-- Function to check and increment rate limit
CREATE OR REPLACE FUNCTION check_personal_games_rate_limit(p_player_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
BEGIN
  -- Get current count for today
  SELECT COALESCE(games_created, 0) INTO current_count
  FROM personal_games_rate_limit
  WHERE player_id = p_player_id AND date = CURRENT_DATE;
  
  -- Check if limit exceeded
  IF current_count >= p_limit THEN
    RETURN FALSE;
  END IF;
  
  -- Increment counter
  INSERT INTO personal_games_rate_limit (player_id, date, games_created)
  VALUES (p_player_id, CURRENT_DATE, 1)
  ON CONFLICT (player_id, date)
  DO UPDATE SET games_created = personal_games_rate_limit.games_created + 1;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Commit all changes
COMMIT;

-- ============================================================================
-- MIGRATION VERIFICATION
-- ============================================================================

DO $$
BEGIN
  -- Check if personal_games table exists
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'personal_games') THEN
    RAISE EXCEPTION 'Migration failed: personal_games table not created';
  END IF;
  
  -- Check if rate limit table exists
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'personal_games_rate_limit') THEN
    RAISE EXCEPTION 'Migration failed: personal_games_rate_limit table not created';
  END IF;
  
  -- Check if view exists
  IF NOT EXISTS (SELECT FROM information_schema.views WHERE table_name = 'player_personal_stats') THEN
    RAISE EXCEPTION 'Migration failed: player_personal_stats view not created';
  END IF;
  
  -- Check if functions exist
  IF NOT EXISTS (SELECT FROM information_schema.routines WHERE routine_name = 'calculate_fg_percentage') THEN
    RAISE EXCEPTION 'Migration failed: calculate_fg_percentage function not created';
  END IF;
  
  RAISE NOTICE 'Personal Games Migration completed successfully!';
  RAISE NOTICE 'Created tables: personal_games, personal_games_rate_limit';
  RAISE NOTICE 'Created view: player_personal_stats';
  RAISE NOTICE 'Created functions: calculate_fg_percentage, calculate_efg_percentage, check_personal_games_rate_limit';
  RAISE NOTICE 'RLS policies enabled for player-only access';
END $$;
