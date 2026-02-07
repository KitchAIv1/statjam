-- Migration: 036_live_scoring_trigger.sql
-- Purpose: Auto-update game scores when scoring stats are recorded
-- This ensures games.home_score and games.away_score are always in sync with game_stats
-- Single source of truth for live scoring

-- ============================================
-- FUNCTION: Calculate points from stat type
-- ============================================
CREATE OR REPLACE FUNCTION get_stat_points(stat_type TEXT, modifier TEXT)
RETURNS INTEGER AS $$
BEGIN
  IF modifier != 'made' THEN
    RETURN 0;
  END IF;
  
  CASE stat_type
    WHEN 'field_goal' THEN RETURN 2;
    WHEN 'three_pointer' THEN RETURN 3;
    WHEN 'free_throw' THEN RETURN 1;
    ELSE RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- FUNCTION: Update game score on stat insert
-- ============================================
CREATE OR REPLACE FUNCTION update_game_score_on_stat()
RETURNS TRIGGER AS $$
DECLARE
  points_scored INTEGER;
  game_record RECORD;
BEGIN
  -- Only process scoring stats (made shots)
  points_scored := get_stat_points(NEW.stat_type, NEW.modifier);
  
  IF points_scored = 0 THEN
    RETURN NEW;
  END IF;
  
  -- Get the game to determine which team's score to update
  SELECT team_a_id, team_b_id INTO game_record
  FROM games
  WHERE id = NEW.game_id;
  
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;
  
  -- Update the appropriate team's score
  IF NEW.team_id = game_record.team_a_id THEN
    UPDATE games
    SET home_score = home_score + points_scored,
        updated_at = NOW()
    WHERE id = NEW.game_id;
  ELSIF NEW.team_id = game_record.team_b_id THEN
    UPDATE games
    SET away_score = away_score + points_scored,
        updated_at = NOW()
    WHERE id = NEW.game_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Reverse game score on stat delete
-- ============================================
CREATE OR REPLACE FUNCTION reverse_game_score_on_stat_delete()
RETURNS TRIGGER AS $$
DECLARE
  points_scored INTEGER;
  game_record RECORD;
BEGIN
  -- Only process scoring stats (made shots)
  points_scored := get_stat_points(OLD.stat_type, OLD.modifier);
  
  IF points_scored = 0 THEN
    RETURN OLD;
  END IF;
  
  -- Get the game to determine which team's score to update
  SELECT team_a_id, team_b_id INTO game_record
  FROM games
  WHERE id = OLD.game_id;
  
  IF NOT FOUND THEN
    RETURN OLD;
  END IF;
  
  -- Reverse (subtract) the score
  IF OLD.team_id = game_record.team_a_id THEN
    UPDATE games
    SET home_score = GREATEST(0, home_score - points_scored),
        updated_at = NOW()
    WHERE id = OLD.game_id;
  ELSIF OLD.team_id = game_record.team_b_id THEN
    UPDATE games
    SET away_score = GREATEST(0, away_score - points_scored),
        updated_at = NOW()
    WHERE id = OLD.game_id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DROP existing triggers if they exist
-- ============================================
DROP TRIGGER IF EXISTS trigger_update_game_score_on_stat_insert ON game_stats;
DROP TRIGGER IF EXISTS trigger_reverse_game_score_on_stat_delete ON game_stats;

-- ============================================
-- CREATE triggers
-- ============================================
CREATE TRIGGER trigger_update_game_score_on_stat_insert
  AFTER INSERT ON game_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_game_score_on_stat();

CREATE TRIGGER trigger_reverse_game_score_on_stat_delete
  AFTER DELETE ON game_stats
  FOR EACH ROW
  EXECUTE FUNCTION reverse_game_score_on_stat_delete();

-- ============================================
-- COMMENT for documentation
-- ============================================
COMMENT ON FUNCTION update_game_score_on_stat() IS 
'Automatically updates games.home_score or games.away_score when a scoring stat is inserted into game_stats. Ensures single source of truth for live scoring.';

COMMENT ON FUNCTION reverse_game_score_on_stat_delete() IS 
'Automatically reverses (subtracts) the score when a scoring stat is deleted from game_stats. Handles undo operations.';
