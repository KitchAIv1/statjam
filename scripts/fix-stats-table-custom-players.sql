-- Fix the 'stats' table to support custom players
-- This table has a different structure than 'game_stats' (uses match_id instead of game_id)

-- Phase 1: Add custom_player_id column to stats table
ALTER TABLE stats 
ADD COLUMN IF NOT EXISTS custom_player_id UUID REFERENCES custom_players(id) ON DELETE CASCADE;

-- Phase 2: Make player_id nullable (since we can have either player_id OR custom_player_id)
ALTER TABLE stats 
ALTER COLUMN player_id DROP NOT NULL;

-- Phase 3: Add constraint to ensure either player_id OR custom_player_id is set (but not both)
-- First, check if constraint exists and drop it
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'stats_player_required' 
    AND conrelid = 'stats'::regclass
  ) THEN
    ALTER TABLE stats DROP CONSTRAINT stats_player_required;
    RAISE NOTICE 'Dropped existing stats_player_required constraint';
  END IF;
END $$;

-- Now add the updated constraint
ALTER TABLE stats 
ADD CONSTRAINT stats_player_required 
CHECK (
  (player_id IS NOT NULL AND custom_player_id IS NULL) OR 
  (player_id IS NULL AND custom_player_id IS NOT NULL)
);

-- Phase 4: Add index for custom_player_id for performance
CREATE INDEX IF NOT EXISTS idx_stats_custom_player_id 
ON stats(custom_player_id);

-- Phase 5: Add RLS policies for custom player stats (if not already exist)
DROP POLICY IF EXISTS "stats_custom_player_coach_read" ON stats;
DROP POLICY IF EXISTS "stats_custom_player_coach_insert" ON stats;
DROP POLICY IF EXISTS "stats_custom_player_stat_admin_read" ON stats;

-- Allow coaches to read stats for their custom players
CREATE POLICY "stats_custom_player_coach_read" ON stats
  FOR SELECT TO authenticated
  USING (
    custom_player_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM custom_players cp
      WHERE cp.id = stats.custom_player_id 
      AND cp.coach_id = auth.uid()
    )
  );

-- Allow coaches to insert stats for their custom players
CREATE POLICY "stats_custom_player_coach_insert" ON stats
  FOR INSERT TO authenticated
  WITH CHECK (
    custom_player_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM custom_players cp
      WHERE cp.id = stats.custom_player_id 
      AND cp.coach_id = auth.uid()
    )
  );

-- Allow stat admins to read custom player stats for their matches
CREATE POLICY "stats_custom_player_stat_admin_read" ON stats
  FOR SELECT TO authenticated
  USING (
    custom_player_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM games g
      WHERE g.id = stats.match_id 
      AND g.stat_admin_id = auth.uid()
    )
  );

COMMIT;
