-- FIX BROKEN SCORE TRIGGER
-- The update_game_scores() function incorrectly uses stat_value > 0 instead of modifier = 'made'
-- This causes missed shots and non-scoring stats to be counted as points

-- 1. Drop the existing broken function
DROP FUNCTION IF EXISTS update_game_scores() CASCADE;

-- 2. Create the corrected function
CREATE OR REPLACE FUNCTION update_game_scores()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate total scores from all game_stats for this game
  -- ✅ FIXED: Only count stats with modifier = 'made' (not stat_value > 0)
  UPDATE games
  SET 
    home_score = (
      SELECT COALESCE(SUM(stat_value), 0)
      FROM game_stats
      WHERE game_id = COALESCE(NEW.game_id, OLD.game_id)
      AND team_id = games.team_a_id
      AND modifier = 'made'  -- ✅ FIXED: Only count made shots
    ),
    away_score = (
      SELECT COALESCE(SUM(stat_value), 0)
      FROM game_stats
      WHERE game_id = COALESCE(NEW.game_id, OLD.game_id)
      AND team_id = games.team_b_id
      AND modifier = 'made'  -- ✅ FIXED: Only count made shots
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.game_id, OLD.game_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 3. Recreate the triggers
DROP TRIGGER IF EXISTS game_stats_update_scores ON game_stats;
DROP TRIGGER IF EXISTS game_stats_delete_update_scores ON game_stats;

CREATE TRIGGER game_stats_update_scores
  AFTER INSERT ON game_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_game_scores();

CREATE TRIGGER game_stats_delete_update_scores
  AFTER DELETE ON game_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_game_scores();

-- 4. Fix the current game's scores immediately
UPDATE games
SET 
  home_score = (
    SELECT COALESCE(SUM(stat_value), 0)
    FROM game_stats
    WHERE game_id = '66744655-4e6e-4c75-a999-06abd5818647'
    AND team_id = games.team_a_id
    AND modifier = 'made'
  ),
  away_score = (
    SELECT COALESCE(SUM(stat_value), 0)
    FROM game_stats
    WHERE game_id = '66744655-4e6e-4c75-a999-06abd5818647'
    AND team_id = games.team_b_id
    AND modifier = 'made'
  ),
  updated_at = NOW()
WHERE id = '66744655-4e6e-4c75-a999-06abd5818647';

-- 5. Verify the fix
SELECT 
  'AFTER FIX' as status,
  id,
  home_score,
  away_score,
  updated_at
FROM games 
WHERE id = '66744655-4e6e-4c75-a999-06abd5818647';
