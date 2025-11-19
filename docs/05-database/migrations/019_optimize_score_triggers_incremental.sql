-- ============================================================================
-- MIGRATION: Optimize Score Update Triggers (Incremental Updates)
-- ============================================================================
-- PURPOSE: Replace expensive SUM queries with fast incremental arithmetic
-- 
-- CHANGES:
-- 1. INSERT trigger: Add points directly instead of recalculating
-- 2. DELETE trigger: Subtract points directly instead of recalculating  
-- 3. UPDATE trigger: NEW - Handle stat edits with incremental changes
--
-- EXPECTED IMPROVEMENT: 80-90% faster (100-500ms → 10-50ms per stat)
-- ============================================================================

-- STEP 1: Show current triggers for context
SELECT 
  'BEFORE OPTIMIZATION' as status,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'game_stats'
AND trigger_name LIKE '%score%'
ORDER BY trigger_name;

-- ============================================================================
-- STEP 2: Optimize INSERT Trigger Function
-- ============================================================================
-- Changes: SUM query → Simple addition
-- Only updates if modifier = 'made' AND stat_value > 0

CREATE OR REPLACE FUNCTION update_game_scores()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update scores for made shots (scoring stats)
  IF NEW.modifier = 'made' AND NEW.stat_value > 0 THEN
    UPDATE games
    SET 
      home_score = CASE 
        WHEN NEW.team_id = games.team_a_id 
        THEN home_score + NEW.stat_value 
        ELSE home_score 
      END,
      away_score = CASE 
        WHEN NEW.team_id = games.team_b_id 
        THEN away_score + NEW.stat_value 
        ELSE away_score 
      END,
      updated_at = NOW()
    WHERE id = NEW.game_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 3: Optimize DELETE Trigger Function
-- ============================================================================
-- Changes: SUM query → Simple subtraction
-- Only updates if modifier = 'made' AND stat_value > 0

CREATE OR REPLACE FUNCTION update_game_scores_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrement scores when made shots are deleted
  IF OLD.modifier = 'made' AND OLD.stat_value > 0 THEN
    UPDATE games
    SET 
      home_score = CASE 
        WHEN OLD.team_id = games.team_a_id 
        THEN GREATEST(0, home_score - OLD.stat_value)
        ELSE home_score 
      END,
      away_score = CASE 
        WHEN OLD.team_id = games.team_b_id 
        THEN GREATEST(0, away_score - OLD.stat_value)
        ELSE away_score 
      END,
      updated_at = NOW()
    WHERE id = OLD.game_id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 4: Create UPDATE Trigger Function (NEW - Fixes Missing Trigger)
-- ============================================================================
-- Purpose: Handle stat edits (missed→made, 2PT→3PT, team changes, etc.)

CREATE OR REPLACE FUNCTION update_game_scores_on_update()
RETURNS TRIGGER AS $$
DECLARE
  old_points INTEGER := 0;
  new_points INTEGER := 0;
  old_team_id UUID;
  new_team_id UUID;
BEGIN
  -- Get old values (if was a made shot)
  IF OLD.modifier = 'made' AND OLD.stat_value > 0 THEN
    old_points := OLD.stat_value;
    old_team_id := OLD.team_id;
  END IF;
  
  -- Get new values (if is now a made shot)
  IF NEW.modifier = 'made' AND NEW.stat_value > 0 THEN
    new_points := NEW.stat_value;
    new_team_id := NEW.team_id;
  END IF;
  
  -- Only update if there's a scoring change
  IF old_points != new_points OR old_team_id != new_team_id THEN
    UPDATE games
    SET 
      -- Handle team A score changes
      home_score = CASE
        -- Both old and new are team A (value changed: 2PT→3PT, etc.)
        WHEN old_team_id = team_a_id AND new_team_id = team_a_id 
        THEN home_score - old_points + new_points
        -- Old was team A, new is team B (team changed)
        WHEN old_team_id = team_a_id AND new_team_id = team_b_id 
        THEN home_score - old_points
        -- Old was team B, new is team A (team changed)
        WHEN old_team_id = team_b_id AND new_team_id = team_a_id 
        THEN home_score + new_points
        -- Old was team A scoring, new is not scoring (made→missed)
        WHEN old_team_id = team_a_id AND new_points = 0 
        THEN home_score - old_points
        -- Old was not scoring, new is team A scoring (missed→made)
        WHEN new_team_id = team_a_id AND old_points = 0 
        THEN home_score + new_points
        ELSE home_score
      END,
      -- Handle team B score changes (same logic)
      away_score = CASE
        WHEN old_team_id = team_b_id AND new_team_id = team_b_id 
        THEN away_score - old_points + new_points
        WHEN old_team_id = team_b_id AND new_team_id = team_a_id 
        THEN away_score - old_points
        WHEN old_team_id = team_a_id AND new_team_id = team_b_id 
        THEN away_score + new_points
        WHEN old_team_id = team_b_id AND new_points = 0 
        THEN away_score - old_points
        WHEN new_team_id = team_b_id AND old_points = 0 
        THEN away_score + new_points
        ELSE away_score
      END,
      updated_at = NOW()
    WHERE id = NEW.game_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 5: Recreate Triggers
-- ============================================================================

-- Drop existing triggers
DROP TRIGGER IF EXISTS game_stats_update_scores ON game_stats;
DROP TRIGGER IF EXISTS game_stats_delete_update_scores ON game_stats;
DROP TRIGGER IF EXISTS game_stats_update_update_scores ON game_stats;

-- Create optimized INSERT trigger
CREATE TRIGGER game_stats_update_scores
  AFTER INSERT ON game_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_game_scores();

-- Create optimized DELETE trigger
CREATE TRIGGER game_stats_delete_update_scores
  AFTER DELETE ON game_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_game_scores_on_delete();

-- Create NEW UPDATE trigger
CREATE TRIGGER game_stats_update_update_scores
  AFTER UPDATE ON game_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_game_scores_on_update();

-- ============================================================================
-- STEP 6: Verify Triggers
-- ============================================================================

SELECT 
  'AFTER OPTIMIZATION' as status,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'game_stats'
AND trigger_name LIKE '%score%'
ORDER BY trigger_name;

-- ============================================================================
-- STEP 7: Test Query (Optional - Verify Current Scores)
-- ============================================================================
-- Uncomment to test a specific game's scores
-- SELECT 
--   id,
--   home_score,
--   away_score,
--   (SELECT COUNT(*) FROM game_stats WHERE game_id = games.id AND modifier = 'made' AND team_id = team_a_id) as team_a_made_shots,
--   (SELECT COUNT(*) FROM game_stats WHERE game_id = games.id AND modifier = 'made' AND team_id = team_b_id) as team_b_made_shots
-- FROM games
-- WHERE id = 'YOUR_GAME_ID_HERE'
-- LIMIT 1;

