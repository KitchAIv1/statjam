-- ============================================================================
-- FIX TEAM_PLAYERS TABLE STRUCTURE AND RLS POLICIES
-- ============================================================================
-- Purpose: Fix missing id column and add proper RLS policies for coach access
-- Date: October 27, 2025
-- Issue: team_players.id column missing + RLS policy violations for coaches
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PHASE 1: ENSURE TEAM_PLAYERS TABLE HAS PROPER STRUCTURE
-- ----------------------------------------------------------------------------

-- Check if team_players table exists, if not create it
CREATE TABLE IF NOT EXISTS team_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    player_id UUID REFERENCES users(id) ON DELETE CASCADE,
    custom_player_id UUID REFERENCES custom_players(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all required columns exist (in case table exists but columns are missing)
ALTER TABLE team_players ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid();
ALTER TABLE team_players ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE CASCADE;
ALTER TABLE team_players ADD COLUMN IF NOT EXISTS player_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE team_players ADD COLUMN IF NOT EXISTS custom_player_id UUID REFERENCES custom_players(id) ON DELETE CASCADE;
ALTER TABLE team_players ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE team_players ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Ensure proper constraint (either player_id OR custom_player_id, not both)
ALTER TABLE team_players DROP CONSTRAINT IF EXISTS team_players_player_required;
ALTER TABLE team_players ADD CONSTRAINT team_players_player_required 
CHECK (
  (player_id IS NOT NULL AND custom_player_id IS NULL) OR
  (player_id IS NULL AND custom_player_id IS NOT NULL)
);

-- ----------------------------------------------------------------------------
-- PHASE 2: CREATE PROPER INDEXES FOR PERFORMANCE
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_team_players_id ON team_players(id);
CREATE INDEX IF NOT EXISTS idx_team_players_team_id ON team_players(team_id);
CREATE INDEX IF NOT EXISTS idx_team_players_player_id ON team_players(player_id);
CREATE INDEX IF NOT EXISTS idx_team_players_custom_player_id ON team_players(custom_player_id);
CREATE INDEX IF NOT EXISTS idx_team_players_created_at ON team_players(created_at);

-- ----------------------------------------------------------------------------
-- PHASE 3: ENABLE RLS AND DROP ALL EXISTING POLICIES
-- ----------------------------------------------------------------------------

-- Enable RLS
ALTER TABLE team_players ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing team_players policies to start clean
DROP POLICY IF EXISTS "team_players_coach_access" ON team_players;
DROP POLICY IF EXISTS "team_players_coach_insert" ON team_players;
DROP POLICY IF EXISTS "team_players_authenticated_read" ON team_players;
DROP POLICY IF EXISTS "team_players_organizer_manage" ON team_players;
DROP POLICY IF EXISTS "team_players_organizer_access" ON team_players;
DROP POLICY IF EXISTS "team_players_public_read" ON team_players;
DROP POLICY IF EXISTS "team_players_public_read_ultra_simple" ON team_players;
DROP POLICY IF EXISTS "team_players_organizer_ultra_simple" ON team_players;
DROP POLICY IF EXISTS "team_players_player_ultra_simple" ON team_players;
DROP POLICY IF EXISTS "team_players_public_read_minimal" ON team_players;
DROP POLICY IF EXISTS "team_players_stat_admin_view" ON team_players;
DROP POLICY IF EXISTS "team_players_player_view" ON team_players;
DROP POLICY IF EXISTS "team_players_public_view" ON team_players;
DROP POLICY IF EXISTS "team_players_public_read_policy" ON team_players;
DROP POLICY IF EXISTS "Organizers can manage team players" ON team_players;
DROP POLICY IF EXISTS "Public can view team players" ON team_players;
DROP POLICY IF EXISTS "team_players_organizer_policy" ON team_players;
DROP POLICY IF EXISTS "team_players_player_read_self" ON team_players;
DROP POLICY IF EXISTS "team_players_authenticated_read_all" ON team_players;

-- ----------------------------------------------------------------------------
-- PHASE 4: CREATE COMPREHENSIVE RLS POLICIES
-- ----------------------------------------------------------------------------

-- 1. COACH ACCESS - Coaches can fully manage their team rosters
CREATE POLICY "team_players_coach_full_access" ON team_players
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams t 
      WHERE t.id = team_players.team_id 
      AND t.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams t 
      WHERE t.id = team_players.team_id 
      AND t.coach_id = auth.uid()
    )
  );

-- 2. ORGANIZER ACCESS - Organizers can manage their tournament team rosters
CREATE POLICY "team_players_organizer_full_access" ON team_players
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams t
      LEFT JOIN tournaments tr ON t.tournament_id = tr.id
      WHERE t.id = team_players.team_id 
      AND (
        -- Tournament teams owned by organizer
        (t.tournament_id IS NOT NULL AND tr.organizer_id = auth.uid()) OR
        -- Coach teams are not accessible to organizers (coach owns them)
        FALSE
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams t
      LEFT JOIN tournaments tr ON t.tournament_id = tr.id
      WHERE t.id = team_players.team_id 
      AND (
        -- Tournament teams owned by organizer
        (t.tournament_id IS NOT NULL AND tr.organizer_id = auth.uid()) OR
        -- Coach teams are not accessible to organizers (coach owns them)
        FALSE
      )
    )
  );

-- 3. PUBLIC READ ACCESS - Anyone can read public team rosters
CREATE POLICY "team_players_public_read_access" ON team_players
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams t
      LEFT JOIN tournaments tr ON t.tournament_id = tr.id
      WHERE t.id = team_players.team_id 
      AND (
        -- Coach teams with public visibility
        (t.tournament_id IS NULL AND t.visibility = 'public') OR  
        -- Tournament teams that are public
        (t.tournament_id IS NOT NULL AND tr.is_public = true)     
      )
    )
  );

-- 4. PLAYER SELF ACCESS - Players can read their own team assignments
CREATE POLICY "team_players_player_self_access" ON team_players
  FOR SELECT TO authenticated
  USING (player_id = auth.uid());

-- 5. STAT ADMIN ACCESS - Stat admins can read team rosters for games they manage
CREATE POLICY "team_players_stat_admin_access" ON team_players
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games g
      WHERE g.stat_admin_id = auth.uid()
      AND (g.team_a_id = team_players.team_id OR g.team_b_id = team_players.team_id)
    )
  );

-- 6. AUTHENTICATED READ ALL - Fallback for general authenticated access (needed for searches)
CREATE POLICY "team_players_authenticated_general_read" ON team_players
  FOR SELECT TO authenticated
  USING (true);

-- ----------------------------------------------------------------------------
-- PHASE 5: CREATE UPDATE TRIGGER FOR updated_at
-- ----------------------------------------------------------------------------

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_team_players_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS team_players_updated_at_trigger ON team_players;
CREATE TRIGGER team_players_updated_at_trigger
  BEFORE UPDATE ON team_players
  FOR EACH ROW
  EXECUTE FUNCTION update_team_players_updated_at();

-- ----------------------------------------------------------------------------
-- PHASE 6: VERIFICATION QUERIES
-- ----------------------------------------------------------------------------

-- Verify table structure
SELECT 'VERIFICATION: team_players table structure' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'team_players' 
ORDER BY ordinal_position;

-- Verify constraints
SELECT 'VERIFICATION: team_players constraints' as info;
SELECT 
  constraint_name, 
  constraint_type,
  table_name
FROM information_schema.table_constraints 
WHERE table_name = 'team_players';

-- Verify RLS policies
SELECT 'VERIFICATION: team_players RLS policies' as info;
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'team_players'
ORDER BY policyname;

-- Verify indexes
SELECT 'VERIFICATION: team_players indexes' as info;
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'team_players'
ORDER BY indexname;

-- Test basic operations (should not fail)
SELECT 'VERIFICATION: Basic query test' as info;
SELECT COUNT(*) as total_team_players FROM team_players;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

SELECT 'SUCCESS: team_players table structure and RLS policies fixed!' as result;
