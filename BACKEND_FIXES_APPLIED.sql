-- ============================================================================
-- STATJAM BACKEND FIXES - Supabase Real-Time & Score Sync
-- ============================================================================
-- Date: October 17, 2025
-- Branch: feature/system-recovery-audit-2025
-- Reference: BACKEND_COORDINATION_REQUIRED.md
--
-- These fixes enable real-time subscriptions and automatic score updates
-- ============================================================================

-- ----------------------------------------------------------------------------
-- FIX 1: Enable Realtime Replication
-- ----------------------------------------------------------------------------
-- Add game_stats and game_substitutions tables to realtime publication
-- This allows Supabase to broadcast INSERT events to subscribers

ALTER PUBLICATION supabase_realtime ADD TABLE game_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE game_substitutions;

-- ----------------------------------------------------------------------------
-- FIX 2: Add Public RLS Policies for Real-Time
-- ----------------------------------------------------------------------------
-- Real-time subscriptions require SELECT permission
-- These policies allow unauthenticated viewers to receive broadcasts
-- for public tournaments only

-- Enable public viewing of game_stats for public tournaments
CREATE POLICY "game_stats_public_realtime" 
  ON game_stats FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN tournaments t ON g.tournament_id = t.id
      WHERE g.id = game_stats.game_id
      AND t.is_public = true
    )
  );

-- Enable public viewing of game_substitutions for public tournaments
CREATE POLICY "game_substitutions_public_realtime" 
  ON game_substitutions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN tournaments t ON g.tournament_id = t.id
      WHERE g.id = game_substitutions.game_id
      AND t.is_public = true
    )
  );

-- ----------------------------------------------------------------------------
-- FIX 3: Auto-Update Game Scores (Database Trigger)
-- ----------------------------------------------------------------------------
-- Automatically updates games.home_score and games.away_score
-- when stats are recorded in game_stats table
-- This ensures single source of truth and eliminates score desync

-- Function to recalculate and update game scores
CREATE OR REPLACE FUNCTION update_game_scores()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate total scores from all game_stats for this game
  UPDATE games
  SET 
    home_score = (
      SELECT COALESCE(SUM(stat_value), 0)
      FROM game_stats
      WHERE game_id = NEW.game_id
      AND team_id = games.team_a_id
      AND stat_value > 0
    ),
    away_score = (
      SELECT COALESCE(SUM(stat_value), 0)
      FROM game_stats
      WHERE game_id = NEW.game_id
      AND team_id = games.team_b_id
      AND stat_value > 0
    ),
    updated_at = NOW()
  WHERE id = NEW.game_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on INSERT to game_stats
CREATE TRIGGER game_stats_update_scores
  AFTER INSERT ON game_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_game_scores();

-- Also trigger on DELETE (in case stats are removed)
CREATE TRIGGER game_stats_delete_update_scores
  AFTER DELETE ON game_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_game_scores();

-- ----------------------------------------------------------------------------
-- FIX 4: OPTIONAL - Player Locking (Database Level)
-- ----------------------------------------------------------------------------
-- Prevents players from being assigned to multiple teams in same tournament
-- NOTE: Check for existing duplicates before applying!

-- Function to check player-team assignment
CREATE OR REPLACE FUNCTION check_player_team_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if player is already assigned to another team in this tournament
  IF EXISTS (
    SELECT 1
    FROM team_players tp
    JOIN teams t ON tp.team_id = t.id
    JOIN teams new_team ON new_team.id = NEW.team_id
    WHERE tp.player_id = NEW.player_id
    AND t.tournament_id = new_team.tournament_id
    AND tp.team_id != NEW.team_id
  ) THEN
    RAISE EXCEPTION 'Player is already assigned to another team in this tournament';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce one-team-per-tournament rule
CREATE TRIGGER enforce_one_team_per_tournament
  BEFORE INSERT ON team_players
  FOR EACH ROW
  EXECUTE FUNCTION check_player_team_assignment();

-- ============================================================================
-- TESTING QUERIES
-- ============================================================================

-- Verify realtime publication includes new tables
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- Verify RLS policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('game_stats', 'game_substitutions')
ORDER BY tablename, policyname;

-- Test score sync (after recording a stat)
SELECT 
  g.id as game_id,
  g.home_score as db_home_score,
  g.away_score as db_away_score,
  (SELECT COALESCE(SUM(stat_value), 0) 
   FROM game_stats 
   WHERE game_id = g.id AND team_id = g.team_a_id AND stat_value > 0) as calculated_home,
  (SELECT COALESCE(SUM(stat_value), 0) 
   FROM game_stats 
   WHERE game_id = g.id AND team_id = g.team_b_id AND stat_value > 0) as calculated_away
FROM games g
WHERE g.status IN ('in_progress', 'live', 'overtime')
LIMIT 5;

-- Check for duplicate player assignments (before adding constraint)
SELECT 
  tp.player_id,
  u.email,
  t.tournament_id,
  array_agg(DISTINCT tp.team_id) as team_ids,
  COUNT(DISTINCT tp.team_id) as team_count
FROM team_players tp
JOIN teams t ON tp.team_id = t.id
JOIN users u ON tp.player_id = u.id
GROUP BY tp.player_id, u.email, t.tournament_id
HAVING COUNT(DISTINCT tp.team_id) > 1;

-- ============================================================================
-- ROLLBACK PLAN (if issues occur)
-- ============================================================================

/*
-- Rollback Realtime Publication
ALTER PUBLICATION supabase_realtime DROP TABLE game_stats;
ALTER PUBLICATION supabase_realtime DROP TABLE game_substitutions;

-- Rollback RLS Policies
DROP POLICY IF EXISTS "game_stats_public_realtime" ON game_stats;
DROP POLICY IF EXISTS "game_substitutions_public_realtime" ON game_substitutions;

-- Rollback Score Trigger
DROP TRIGGER IF EXISTS game_stats_update_scores ON game_stats;
DROP TRIGGER IF EXISTS game_stats_delete_update_scores ON game_stats;
DROP FUNCTION IF EXISTS update_game_scores();

-- Rollback Player Locking
DROP TRIGGER IF EXISTS enforce_one_team_per_tournament ON team_players;
DROP FUNCTION IF EXISTS check_player_team_assignment();
*/

-- ============================================================================
-- END OF BACKEND FIXES
-- ============================================================================

