-- ============================================================================
-- GAME STATS CUSTOM PLAYERS SUPPORT MIGRATION
-- ============================================================================
-- Purpose: Allow custom players to record stats in game_stats table
-- Issue: game_stats.player_id has FK constraint to users.id, but custom players are in custom_players.id
-- Solution: Add custom_player_id column and modify constraints
-- ============================================================================

-- Phase 1: Add custom_player_id column to game_stats
ALTER TABLE game_stats 
ADD COLUMN IF NOT EXISTS custom_player_id UUID REFERENCES custom_players(id) ON DELETE CASCADE;

-- Phase 2: Make player_id nullable (since we can have either player_id OR custom_player_id)
ALTER TABLE game_stats 
ALTER COLUMN player_id DROP NOT NULL;

-- Phase 3: Add constraint to ensure either player_id OR custom_player_id is set (but not both)
ALTER TABLE game_stats 
DROP CONSTRAINT IF EXISTS game_stats_player_required;

ALTER TABLE game_stats 
ADD CONSTRAINT game_stats_player_required 
CHECK (
  (player_id IS NOT NULL AND custom_player_id IS NULL) OR 
  (player_id IS NULL AND custom_player_id IS NOT NULL)
);

-- Phase 4: Add index for custom_player_id for performance
CREATE INDEX IF NOT EXISTS idx_game_stats_custom_player_id 
ON game_stats(custom_player_id);

-- Phase 5: Add RLS policies for custom player stats
-- Allow coaches to read stats for their custom players
CREATE POLICY "game_stats_custom_player_coach_read" ON game_stats
  FOR SELECT TO authenticated
  USING (
    custom_player_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM custom_players cp
      WHERE cp.id = game_stats.custom_player_id 
      AND cp.coach_id = auth.uid()
    )
  );

-- Allow coaches to insert stats for their custom players
CREATE POLICY "game_stats_custom_player_coach_insert" ON game_stats
  FOR INSERT TO authenticated
  WITH CHECK (
    custom_player_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM custom_players cp
      WHERE cp.id = game_stats.custom_player_id 
      AND cp.coach_id = auth.uid()
    )
  );

-- Allow stat admins to read custom player stats for their games
CREATE POLICY "game_stats_custom_player_stat_admin_read" ON game_stats
  FOR SELECT TO authenticated
  USING (
    custom_player_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM games g
      WHERE g.id = game_stats.game_id 
      AND g.stat_admin_id = auth.uid()
    )
  );

-- Phase 6: Create helper function to get player name (regular or custom)
CREATE OR REPLACE FUNCTION get_player_name(
  p_player_id UUID DEFAULT NULL,
  p_custom_player_id UUID DEFAULT NULL
) RETURNS TEXT AS $$
BEGIN
  IF p_player_id IS NOT NULL THEN
    RETURN (SELECT name FROM users WHERE id = p_player_id);
  ELSIF p_custom_player_id IS NOT NULL THEN
    RETURN (SELECT name FROM custom_players WHERE id = p_custom_player_id);
  ELSE
    RETURN 'Unknown Player';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Phase 7: Test the schema (optional - can be removed in production)
-- This will verify the constraint works correctly
DO $$
BEGIN
  -- Test that we can't insert with both player_id and custom_player_id
  BEGIN
    INSERT INTO game_stats (game_id, player_id, custom_player_id, team_id, stat_type, quarter, game_time_minutes, game_time_seconds)
    VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'field_goal', 1, 10, 30);
    RAISE EXCEPTION 'Test failed: Should not allow both player_id and custom_player_id';
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE 'Test passed: Constraint correctly prevents both player_id and custom_player_id';
  END;
  
  -- Test that we can't insert with neither player_id nor custom_player_id
  BEGIN
    INSERT INTO game_stats (game_id, team_id, stat_type, quarter, game_time_minutes, game_time_seconds)
    VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'field_goal', 1, 10, 30);
    RAISE EXCEPTION 'Test failed: Should not allow neither player_id nor custom_player_id';
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE 'Test passed: Constraint correctly requires either player_id or custom_player_id';
  END;
END $$;

COMMIT;
