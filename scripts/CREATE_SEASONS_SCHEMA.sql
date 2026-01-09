-- ============================================================================
-- SEASONS FEATURE - COMPLETE DATABASE SCHEMA
-- Purpose: Drop old tables and create fresh seasons schema
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ========================================
-- STEP 1: DROP OLD TABLES (if they exist)
-- ========================================

-- Drop dependent tables first (foreign key order matters)
DROP TABLE IF EXISTS season_games CASCADE;
DROP TABLE IF EXISTS seasons CASCADE;

-- Verify tables are dropped
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('seasons', 'season_games');
-- Should return 0 rows

-- ========================================
-- STEP 2: CREATE SEASONS TABLE
-- ========================================

CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Basic Info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logo TEXT,
  
  -- ESPN-like Context
  league_name VARCHAR(255),
  season_type VARCHAR(50) DEFAULT 'regular' CHECK (season_type IN ('regular', 'playoffs', 'preseason', 'summer', 'tournament')),
  season_year VARCHAR(20),
  conference VARCHAR(100),
  home_venue VARCHAR(255),
  
  -- Branding
  primary_color VARCHAR(7) DEFAULT '#FF6B00',
  secondary_color VARCHAR(7) DEFAULT '#1A1A1A',
  
  -- Dates & Status
  start_date DATE,
  end_date DATE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed')),
  is_public BOOLEAN DEFAULT false,
  
  -- Cached Stats (recalculated on game add/remove)
  total_games INT DEFAULT 0,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  points_for INT DEFAULT 0,
  points_against INT DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- STEP 3: CREATE SEASON_GAMES TABLE
-- ========================================

CREATE TABLE season_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  
  -- Game context within season
  is_home_game BOOLEAN DEFAULT true,
  game_notes TEXT,
  
  -- Timestamps
  added_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate game assignments
  UNIQUE(season_id, game_id)
);

-- ========================================
-- STEP 4: CREATE INDEXES
-- ========================================

CREATE INDEX idx_seasons_coach_id ON seasons(coach_id);
CREATE INDEX idx_seasons_team_id ON seasons(team_id);
CREATE INDEX idx_seasons_status ON seasons(status);
CREATE INDEX idx_seasons_is_public ON seasons(is_public);
CREATE INDEX idx_season_games_season_id ON season_games(season_id);
CREATE INDEX idx_season_games_game_id ON season_games(game_id);

-- ========================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- ========================================

ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_games ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 6: CREATE RLS POLICIES FOR SEASONS
-- ========================================

-- Coaches can view their own seasons
CREATE POLICY "seasons_select_own" ON seasons
  FOR SELECT USING (coach_id = auth.uid());

-- Public seasons viewable by anyone
CREATE POLICY "seasons_select_public" ON seasons
  FOR SELECT USING (is_public = true);

-- Coaches can insert their own seasons
CREATE POLICY "seasons_insert_own" ON seasons
  FOR INSERT WITH CHECK (coach_id = auth.uid());

-- Coaches can update their own seasons
CREATE POLICY "seasons_update_own" ON seasons
  FOR UPDATE USING (coach_id = auth.uid());

-- Coaches can delete their own seasons
CREATE POLICY "seasons_delete_own" ON seasons
  FOR DELETE USING (coach_id = auth.uid());

-- ========================================
-- STEP 7: CREATE RLS POLICIES FOR SEASON_GAMES
-- ========================================

-- Season games: owners can manage
CREATE POLICY "season_games_select_own" ON season_games
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM seasons 
      WHERE seasons.id = season_games.season_id 
      AND seasons.coach_id = auth.uid()
    )
  );

-- Public season games viewable
CREATE POLICY "season_games_select_public" ON season_games
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM seasons 
      WHERE seasons.id = season_games.season_id 
      AND seasons.is_public = true
    )
  );

-- Insert for season owners
CREATE POLICY "season_games_insert_own" ON season_games
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM seasons 
      WHERE seasons.id = season_games.season_id 
      AND seasons.coach_id = auth.uid()
    )
  );

-- Update for season owners
CREATE POLICY "season_games_update_own" ON season_games
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM seasons 
      WHERE seasons.id = season_games.season_id 
      AND seasons.coach_id = auth.uid()
    )
  );

-- Delete for season owners
CREATE POLICY "season_games_delete_own" ON season_games
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM seasons 
      WHERE seasons.id = season_games.season_id 
      AND seasons.coach_id = auth.uid()
    )
  );

-- ========================================
-- STEP 8: VERIFICATION
-- ========================================

-- Verify tables created
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('seasons', 'season_games')
ORDER BY table_name;

-- Verify RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('seasons', 'season_games');

-- Verify indexes created
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('seasons', 'season_games')
ORDER BY tablename, indexname;

-- Verify policies created
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('seasons', 'season_games')
ORDER BY tablename, policyname;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
-- If all verification queries return expected results:
-- ✅ seasons table: 18 columns
-- ✅ season_games table: 6 columns
-- ✅ RLS enabled on both tables
-- ✅ 6 indexes created
-- ✅ 10 policies created (5 per table)
