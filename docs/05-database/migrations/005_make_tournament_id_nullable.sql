-- ============================================================================
-- MAKE TOURNAMENT_ID NULLABLE FOR COACH TEAMS
-- ============================================================================
-- Purpose: Allow coach teams to exist independently without tournaments
-- Issue: tournament_id has NOT NULL constraint preventing coach team creation
-- Solution: Make tournament_id nullable and update RLS policies
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Make tournament_id nullable in teams table
-- ----------------------------------------------------------------------------

-- Remove NOT NULL constraint from tournament_id
ALTER TABLE teams ALTER COLUMN tournament_id DROP NOT NULL;

-- Verify the change
-- Expected: tournament_id should now allow NULL values

-- ----------------------------------------------------------------------------
-- STEP 2: Update RLS policies to handle NULL tournament_id
-- ----------------------------------------------------------------------------

-- Drop existing teams policies that assume tournament_id is always present
DROP POLICY IF EXISTS "teams_organizer_simple" ON teams;
DROP POLICY IF EXISTS "teams_public_simple" ON teams;
DROP POLICY IF EXISTS "teams_stat_admin_simple" ON teams;

-- Create new policies that handle both tournament teams and coach teams
-- ✅ POLICY 1: Organizers manage teams in their tournaments
CREATE POLICY "teams_organizer_tournament_access" ON teams
  FOR ALL
  TO authenticated
  USING (
    tournament_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM tournaments 
      WHERE tournaments.id = teams.tournament_id 
      AND tournaments.organizer_id = auth.uid()
    )
  )
  WITH CHECK (
    tournament_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM tournaments 
      WHERE tournaments.id = teams.tournament_id 
      AND tournaments.organizer_id = auth.uid()
    )
  );

-- ✅ POLICY 2: Coaches manage their own teams (independent of tournaments)
CREATE POLICY "teams_coach_access" ON teams
  FOR ALL
  TO authenticated
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- ✅ POLICY 3: Public can view teams in public tournaments OR public coach teams
CREATE POLICY "teams_public_read" ON teams
  FOR SELECT
  TO anon, authenticated
  USING (
    -- Tournament teams: must be in public tournament
    (tournament_id IS NOT NULL AND 
     EXISTS (SELECT 1 FROM tournaments WHERE id = teams.tournament_id AND is_public = true))
    OR
    -- Coach teams: must have public visibility
    (coach_id IS NOT NULL AND visibility = 'public')
  );

-- ✅ POLICY 4: Authenticated users can read all teams (for stat admin lookups)
CREATE POLICY "teams_authenticated_read_all" ON teams
  FOR SELECT
  TO authenticated
  USING (true);

-- ----------------------------------------------------------------------------
-- STEP 3: Update indexes for coach team queries
-- ----------------------------------------------------------------------------

-- Ensure indexes exist for coach team queries
CREATE INDEX IF NOT EXISTS idx_teams_coach_id ON teams(coach_id) WHERE coach_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_teams_visibility ON teams(visibility) WHERE coach_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- VERIFICATION QUERIES
-- ----------------------------------------------------------------------------

-- Test 1: Check that tournament_id can now be NULL
-- SELECT column_name, is_nullable FROM information_schema.columns 
-- WHERE table_name = 'teams' AND column_name = 'tournament_id';
-- Expected: is_nullable = 'YES'

-- Test 2: Verify coach teams can be created
-- INSERT INTO teams (name, coach_id, tournament_id, visibility) 
-- VALUES ('Test Coach Team', 'some-coach-uuid', NULL, 'private');
-- Expected: Should succeed without constraint violation

-- Test 3: Verify RLS policies work for both types
-- SET ROLE authenticated;
-- SELECT * FROM teams WHERE coach_id = auth.uid(); -- Should show coach teams
-- SELECT * FROM teams WHERE tournament_id IS NOT NULL; -- Should show tournament teams
