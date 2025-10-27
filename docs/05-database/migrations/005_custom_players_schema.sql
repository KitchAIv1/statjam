-- ============================================================================
-- CUSTOM PLAYERS SCHEMA MIGRATION
-- ============================================================================
-- Purpose: Add support for team-specific custom players (no StatJam account)
-- Context: Coach teams need ability to add players without requiring StatJam signup
-- ============================================================================

-- Phase 1: Create custom_players table
CREATE TABLE IF NOT EXISTS custom_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Player details
  name VARCHAR(255) NOT NULL,
  jersey_number INTEGER,
  position VARCHAR(10), -- PG, SG, SF, PF, C
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT custom_players_jersey_unique_per_team 
    UNIQUE(team_id, jersey_number),
  CONSTRAINT custom_players_valid_jersey 
    CHECK (jersey_number IS NULL OR (jersey_number >= 0 AND jersey_number <= 99)),
  CONSTRAINT custom_players_valid_position 
    CHECK (position IS NULL OR position IN ('PG', 'SG', 'SF', 'PF', 'C'))
);

-- Phase 2: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_custom_players_team_id ON custom_players(team_id);
CREATE INDEX IF NOT EXISTS idx_custom_players_coach_id ON custom_players(coach_id);
CREATE INDEX IF NOT EXISTS idx_custom_players_name ON custom_players(name);

-- Phase 3: Add RLS policies
ALTER TABLE custom_players ENABLE ROW LEVEL SECURITY;

-- Policy 1: Coaches can manage their own team's custom players
CREATE POLICY "custom_players_coach_access"
ON custom_players
FOR ALL
TO authenticated
USING (coach_id = auth.uid())
WITH CHECK (coach_id = auth.uid());

-- Policy 2: Stat admins can view custom players for games they're managing
CREATE POLICY "custom_players_stat_admin_access"
ON custom_players
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM games g
    WHERE g.stat_admin_id = auth.uid()
    AND (g.team_a_id = team_id OR g.team_b_id = team_id)
  )
);

-- Policy 3: Allow anonymous read for public team visibility (tournaments)
CREATE POLICY "custom_players_public_read"
ON custom_players
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM teams t
    WHERE t.id = team_id
    AND t.visibility = 'public'
  )
);

-- Phase 4: Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_custom_players_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER custom_players_updated_at_trigger
  BEFORE UPDATE ON custom_players
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_players_updated_at();

-- Phase 5: Update team_players table to support custom players
-- Add optional reference to custom_players
ALTER TABLE team_players 
ADD COLUMN IF NOT EXISTS custom_player_id UUID REFERENCES custom_players(id) ON DELETE CASCADE;

-- Update constraint to allow either player_id OR custom_player_id (but not both)
ALTER TABLE team_players 
DROP CONSTRAINT IF EXISTS team_players_player_required;

ALTER TABLE team_players 
ADD CONSTRAINT team_players_player_required 
CHECK (
  (player_id IS NOT NULL AND custom_player_id IS NULL) OR
  (player_id IS NULL AND custom_player_id IS NOT NULL)
);

-- Phase 6: Add index for custom player lookups
CREATE INDEX IF NOT EXISTS idx_team_players_custom_player_id ON team_players(custom_player_id);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify table structure
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'custom_players' 
ORDER BY ordinal_position;

-- Verify constraints
SELECT 
  constraint_name, 
  constraint_type,
  table_name
FROM information_schema.table_constraints 
WHERE table_name = 'custom_players';

-- Verify RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'custom_players';

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================

-- To rollback this migration:
-- DROP TRIGGER IF EXISTS custom_players_updated_at_trigger ON custom_players;
-- DROP FUNCTION IF EXISTS update_custom_players_updated_at();
-- ALTER TABLE team_players DROP COLUMN IF EXISTS custom_player_id;
-- ALTER TABLE team_players DROP CONSTRAINT IF EXISTS team_players_player_required;
-- DROP TABLE IF EXISTS custom_players;
