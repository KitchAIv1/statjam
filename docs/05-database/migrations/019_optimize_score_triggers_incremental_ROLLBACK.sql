-- ============================================================================
-- ROLLBACK: Revert to Original SUM-Based Score Triggers
-- ============================================================================
-- PURPOSE: Rollback incremental optimization if issues occur
-- 
-- WARNING: This will restore the slower SUM-based calculation
-- ============================================================================

-- STEP 1: Drop optimized triggers
DROP TRIGGER IF EXISTS game_stats_update_scores ON game_stats;
DROP TRIGGER IF EXISTS game_stats_delete_update_scores ON game_stats;
DROP TRIGGER IF EXISTS game_stats_update_update_scores ON game_stats;

-- STEP 2: Restore original INSERT/DELETE trigger function (SUM-based)
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
      AND modifier = 'made'
    ),
    away_score = (
      SELECT COALESCE(SUM(stat_value), 0)
      FROM game_stats
      WHERE game_id = COALESCE(NEW.game_id, OLD.game_id)
      AND team_id = games.team_b_id
      AND modifier = 'made'
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.game_id, OLD.game_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- STEP 3: Drop UPDATE trigger function (remove it)
DROP FUNCTION IF EXISTS update_game_scores_on_update() CASCADE;
DROP FUNCTION IF EXISTS update_game_scores_on_delete() CASCADE;

-- STEP 4: Recreate original triggers (INSERT and DELETE only)
CREATE TRIGGER game_stats_update_scores
  AFTER INSERT ON game_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_game_scores();

CREATE TRIGGER game_stats_delete_update_scores
  AFTER DELETE ON game_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_game_scores();

-- STEP 5: Verify rollback
SELECT 
  'ROLLBACK COMPLETE' as status,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'game_stats'
AND trigger_name LIKE '%score%'
ORDER BY trigger_name;

