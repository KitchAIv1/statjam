-- ============================================================================
-- FIX CUSTOM PLAYERS RLS ACCESS POLICIES
-- ============================================================================
-- Purpose: Add missing RLS policies to allow broader read access for custom players
-- Issue: Current policies only allow:
--   - Coach who created the player (custom_players_coach_access)
--   - Anonymous users for public teams (custom_players_public_read)
--   - Stat admins for their games (custom_players_stat_admin_access)
-- Missing: Organizers, authenticated users viewing public tournaments, etc.
-- ============================================================================

-- STEP 1: Show current policies for context
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'custom_players'
ORDER BY policyname;

-- STEP 2: Add policy for authenticated users to read custom players in public tournaments
-- This allows organizers, players, and other authenticated users to view custom players
-- in public tournament teams (similar to team_players_public_view)
CREATE POLICY "custom_players_authenticated_public_read"
ON custom_players
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM teams t
    LEFT JOIN tournaments tr ON tr.id = t.tournament_id
    WHERE t.id = custom_players.team_id
    AND (
      -- Public tournament teams
      (tr.id IS NOT NULL AND tr.is_public = true) OR
      -- Public coach teams
      (tr.id IS NULL AND t.visibility = 'public')
    )
  )
);

-- STEP 3: Add policy for organizers to read custom players in their tournament teams
-- This allows organizers to view custom players in teams belonging to their tournaments
CREATE POLICY "custom_players_organizer_read"
ON custom_players
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM teams t
    JOIN tournaments tr ON tr.id = t.tournament_id
    WHERE t.id = custom_players.team_id
    AND tr.organizer_id = auth.uid()
  )
);

-- STEP 4: Add policy for authenticated users to read custom players in teams they're on
-- This allows players to view custom players on their own teams
CREATE POLICY "custom_players_team_member_read"
ON custom_players
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_players tp
    WHERE tp.team_id = custom_players.team_id
    AND tp.player_id = auth.uid()
  )
);

-- STEP 5: Update public_read policy to also check tournament public status
-- The current policy only checks team visibility, but doesn't check tournament public status
-- This fixes the issue where custom players in public tournament teams aren't accessible
DROP POLICY IF EXISTS "custom_players_public_read" ON custom_players;

CREATE POLICY "custom_players_public_read"
ON custom_players
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM teams t
    LEFT JOIN tournaments tr ON tr.id = t.tournament_id
    WHERE t.id = custom_players.team_id
    AND (
      -- Public coach teams (no tournament)
      (t.tournament_id IS NULL AND t.visibility = 'public') OR
      -- Public tournament teams
      (t.tournament_id IS NOT NULL AND tr.is_public = true)
    )
  )
);

-- STEP 6: Verify all policies are in place
SELECT 
  policyname,
  roles,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_clause_status,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as with_check_status
FROM pg_policies 
WHERE tablename = 'custom_players'
ORDER BY policyname;

-- STEP 7: Test query - should now work for authenticated users viewing public tournament teams
-- This simulates what happens when an organizer or authenticated user views a custom player
SELECT 
  cp.id,
  cp.name,
  cp.jersey_number,
  cp.position,
  cp.team_id,
  t.name as team_name,
  t.visibility,
  tr.is_public as tournament_is_public
FROM custom_players cp
LEFT JOIN teams t ON t.id = cp.team_id
LEFT JOIN tournaments tr ON tr.id = t.tournament_id
WHERE (
  -- Public tournament teams
  (tr.id IS NOT NULL AND tr.is_public = true) OR
  -- Public coach teams
  (tr.id IS NULL AND t.visibility = 'public')
)
LIMIT 5;

