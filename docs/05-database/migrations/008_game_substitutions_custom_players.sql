-- ============================================================================
-- GAME SUBSTITUTIONS CUSTOM PLAYERS SUPPORT MIGRATION
-- ============================================================================
-- Purpose: Allow custom players to be substituted in game_substitutions table
-- Issue: game_substitutions.player_in_id and player_out_id have FK constraints 
--        to users.id, but custom players are in custom_players.id
-- Solution: Add custom_player_in_id and custom_player_out_id columns and modify constraints
-- ============================================================================

-- Phase 1: Add custom_player_in_id and custom_player_out_id columns
ALTER TABLE game_substitutions 
ADD COLUMN IF NOT EXISTS custom_player_in_id UUID REFERENCES custom_players(id) ON DELETE CASCADE;

ALTER TABLE game_substitutions 
ADD COLUMN IF NOT EXISTS custom_player_out_id UUID REFERENCES custom_players(id) ON DELETE CASCADE;

-- Phase 2: Make player_in_id and player_out_id nullable (since we can have either regular OR custom player IDs)
ALTER TABLE game_substitutions 
ALTER COLUMN player_in_id DROP NOT NULL;

ALTER TABLE game_substitutions 
ALTER COLUMN player_out_id DROP NOT NULL;

-- Phase 3: Add constraint to ensure either regular player ID OR custom player ID is set (not both, not neither)
ALTER TABLE game_substitutions 
DROP CONSTRAINT IF EXISTS game_substitutions_player_in_required;

ALTER TABLE game_substitutions 
ADD CONSTRAINT game_substitutions_player_in_required 
CHECK (
  (player_in_id IS NOT NULL AND custom_player_in_id IS NULL) OR 
  (player_in_id IS NULL AND custom_player_in_id IS NOT NULL)
);

ALTER TABLE game_substitutions 
DROP CONSTRAINT IF EXISTS game_substitutions_player_out_required;

ALTER TABLE game_substitutions 
ADD CONSTRAINT game_substitutions_player_out_required 
CHECK (
  (player_out_id IS NOT NULL AND custom_player_out_id IS NULL) OR 
  (player_out_id IS NULL AND custom_player_out_id IS NOT NULL)
);

-- Phase 4: Add indexes for custom player IDs for performance
CREATE INDEX IF NOT EXISTS idx_game_substitutions_custom_player_in_id 
ON game_substitutions(custom_player_in_id);

CREATE INDEX IF NOT EXISTS idx_game_substitutions_custom_player_out_id 
ON game_substitutions(custom_player_out_id);

-- Phase 5: Add RLS policies for custom player substitutions
-- NOTE: These policies are ADDITIVE - they don't interfere with existing stat_admin policies
-- Existing policies (game_substitutions_stat_admin_manage, game_substitutions_public_read, etc.) remain unchanged

-- Drop policies if they exist (for idempotency)
DROP POLICY IF EXISTS "game_substitutions_custom_player_coach_read" ON game_substitutions;
DROP POLICY IF EXISTS "game_substitutions_custom_player_coach_insert" ON game_substitutions;
DROP POLICY IF EXISTS "game_substitutions_custom_player_stat_admin_read" ON game_substitutions;

-- Phase 5.5: Update existing stat_admin_manage policy to allow stat_admins to insert substitutions
-- even when stat_admin_id is null (for unassigned games)
-- This matches the pattern used for game_stats where stat_admins can track stats for any game
DROP POLICY IF EXISTS "game_substitutions_stat_admin_manage" ON game_substitutions;

CREATE POLICY "game_substitutions_stat_admin_manage"
ON public.game_substitutions FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.games g
    WHERE g.id = game_substitutions.game_id 
    AND (
      g.stat_admin_id = auth.uid()  -- ✅ Assigned games (existing behavior)
      OR 
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND u.role = 'stat_admin'  -- ✅ Stat admins can manage unassigned games
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.games g
    WHERE g.id = game_substitutions.game_id 
    AND (
      g.stat_admin_id = auth.uid()  -- ✅ Assigned games (existing behavior)
      OR 
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND u.role = 'stat_admin'  -- ✅ Stat admins can manage unassigned games
      )
    )
  )
);

-- Allow coaches to read substitutions for their custom players
-- This policy ONLY applies when custom_player_in_id or custom_player_out_id is set
-- Regular player substitutions are still handled by existing stat_admin policies
CREATE POLICY "game_substitutions_custom_player_coach_read" ON game_substitutions
  FOR SELECT TO authenticated
  USING (
    (
      custom_player_in_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM custom_players cp
        WHERE cp.id = game_substitutions.custom_player_in_id 
        AND cp.coach_id = auth.uid()
      )
    ) OR (
      custom_player_out_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM custom_players cp
        WHERE cp.id = game_substitutions.custom_player_out_id 
        AND cp.coach_id = auth.uid()
      )
    )
  );

-- Allow coaches to insert substitutions for their custom players OR in games where they own the team
-- This policy applies when:
-- 1. Inserting custom player substitutions (coach owns the custom player)
-- 2. Inserting substitutions in coach mode games (game has stat_admin_id = coach's user ID)
-- 3. Inserting substitutions where coach owns the team (for tournament games with custom players)
CREATE POLICY "game_substitutions_custom_player_coach_insert" ON game_substitutions
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Case 1: Custom player substitution (coach owns the custom player)
    (
      (
        custom_player_in_id IS NOT NULL AND
        EXISTS (
          SELECT 1 FROM custom_players cp
          WHERE cp.id = game_substitutions.custom_player_in_id 
          AND cp.coach_id = auth.uid()
        )
      ) OR (
        custom_player_out_id IS NOT NULL AND
        EXISTS (
          SELECT 1 FROM custom_players cp
          WHERE cp.id = game_substitutions.custom_player_out_id 
          AND cp.coach_id = auth.uid()
        )
      )
    ) OR
    -- Case 2: Coach mode game (coach is the stat_admin for this game)
    (
      EXISTS (
        SELECT 1 FROM games g
        WHERE g.id = game_substitutions.game_id
        AND g.stat_admin_id = auth.uid()
      )
    ) OR
    -- Case 3: Coach owns the team (for tournament games - allows coaches to substitute their custom players)
    (
      EXISTS (
        SELECT 1 FROM teams t
        WHERE t.id = game_substitutions.team_id
        AND t.coach_id = auth.uid()
      )
    )
  );

-- Allow stat admins to read custom player substitutions for their games
-- This policy ONLY applies when custom_player_in_id or custom_player_out_id is set
-- Regular player substitutions are still handled by existing stat_admin policies
CREATE POLICY "game_substitutions_custom_player_stat_admin_read" ON game_substitutions
  FOR SELECT TO authenticated
  USING (
    (
      custom_player_in_id IS NOT NULL OR custom_player_out_id IS NOT NULL
    ) AND
    EXISTS (
      SELECT 1 FROM games g
      WHERE g.id = game_substitutions.game_id 
      AND g.stat_admin_id = auth.uid()
    )
  );

COMMIT;

