-- ============================================================================
-- MANUAL TEAM_PLAYERS FIX - RUN THIS IN SUPABASE SQL EDITOR
-- ============================================================================
-- Purpose: Fix team_players table structure and RLS policies
-- Issue: Missing id column and RLS policy violations
-- Date: October 27, 2025
-- ============================================================================

-- Step 1: The team_players table already exists, so we'll just modify it
-- (Skipping CREATE TABLE since it exists)

-- Step 2: Check current table structure first
SELECT 'Current team_players structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'team_players' 
ORDER BY ordinal_position;

-- Step 3: Add missing columns if they don't exist (but don't add id if it exists)
DO $$ 
BEGIN
    -- Only add id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'team_players' AND column_name = 'id'
    ) THEN
        ALTER TABLE team_players ADD COLUMN id UUID DEFAULT gen_random_uuid();
        
        -- Make it primary key only if no primary key exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'team_players' AND constraint_type = 'PRIMARY KEY'
        ) THEN
            ALTER TABLE team_players ADD PRIMARY KEY (id);
        END IF;
    END IF;
    
    -- Add other columns if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'team_players' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE team_players ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'team_players' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE team_players ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;
END $$;

-- Step 4: Ensure proper constraint
ALTER TABLE team_players DROP CONSTRAINT IF EXISTS team_players_player_required;
ALTER TABLE team_players ADD CONSTRAINT team_players_player_required 
CHECK (
  (player_id IS NOT NULL AND custom_player_id IS NULL) OR
  (player_id IS NULL AND custom_player_id IS NOT NULL)
);

-- Step 5: Create indexes
CREATE INDEX IF NOT EXISTS idx_team_players_id ON team_players(id);
CREATE INDEX IF NOT EXISTS idx_team_players_team_id ON team_players(team_id);
CREATE INDEX IF NOT EXISTS idx_team_players_player_id ON team_players(player_id);
CREATE INDEX IF NOT EXISTS idx_team_players_custom_player_id ON team_players(custom_player_id);

-- Step 6: Enable RLS and drop existing policies
ALTER TABLE team_players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_players_coach_access" ON team_players;
DROP POLICY IF EXISTS "team_players_organizer_access" ON team_players;
DROP POLICY IF EXISTS "team_players_public_read" ON team_players;
DROP POLICY IF EXISTS "team_players_player_self" ON team_players;
DROP POLICY IF EXISTS "team_players_stat_admin" ON team_players;
DROP POLICY IF EXISTS "team_players_authenticated_read" ON team_players;

-- Step 7: Create comprehensive RLS policies

-- Coach can manage their team rosters
CREATE POLICY "team_players_coach_access" ON team_players
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

-- Organizers can manage their tournament team rosters
CREATE POLICY "team_players_organizer_access" ON team_players
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams t
      JOIN tournaments tr ON t.tournament_id = tr.id
      WHERE t.id = team_players.team_id 
      AND tr.organizer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams t
      JOIN tournaments tr ON t.tournament_id = tr.id
      WHERE t.id = team_players.team_id 
      AND tr.organizer_id = auth.uid()
    )
  );

-- Public read access for public teams
CREATE POLICY "team_players_public_read" ON team_players
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams t
      LEFT JOIN tournaments tr ON t.tournament_id = tr.id
      WHERE t.id = team_players.team_id 
      AND (
        (t.tournament_id IS NULL AND t.visibility = 'public') OR  
        (t.tournament_id IS NOT NULL AND tr.is_public = true)     
      )
    )
  );

-- Players can read their own assignments
CREATE POLICY "team_players_player_self" ON team_players
  FOR SELECT TO authenticated
  USING (player_id = auth.uid());

-- Stat admins can read rosters for their games
CREATE POLICY "team_players_stat_admin" ON team_players
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games g
      WHERE g.stat_admin_id = auth.uid()
      AND (g.team_a_id = team_players.team_id OR g.team_b_id = team_players.team_id)
    )
  );

-- General authenticated read (for searches)
CREATE POLICY "team_players_authenticated_read" ON team_players
  FOR SELECT TO authenticated
  USING (true);

-- Step 8: Create update trigger
CREATE OR REPLACE FUNCTION update_team_players_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS team_players_updated_at_trigger ON team_players;
CREATE TRIGGER team_players_updated_at_trigger
  BEFORE UPDATE ON team_players
  FOR EACH ROW
  EXECUTE FUNCTION update_team_players_updated_at();

-- Step 9: Verification queries
SELECT 'VERIFICATION: team_players table structure' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'team_players' 
ORDER BY ordinal_position;

SELECT 'VERIFICATION: team_players RLS policies' as info;
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd
FROM pg_policies 
WHERE tablename = 'team_players'
ORDER BY policyname;

SELECT 'SUCCESS: team_players fix completed!' as result;
