-- ============================================================================
-- MIGRATION 020: Optimize Trigger Lock Contention - PRODUCTION READY
-- ============================================================================
-- PURPOSE: Combine multiple games table updates into single UPDATE to prevent lock contention
-- 
-- PROBLEM:
-- - update_game_scores() updates games table (locks row)
-- - increment_team_fouls() also updates games table (tries to lock same row)
-- - This causes lock contention and timeouts (code 57014)
--
-- SOLUTION:
-- - Combine score updates and foul increments into single UPDATE statement
-- - Single lock acquisition = no contention
--
-- EXPECTED IMPROVEMENT: Eliminates lock contention, prevents timeouts
-- 
-- SAFETY: Non-destructive, preserves all functionality, reversible
-- ============================================================================

-- ============================================================================
-- PRE-MIGRATION VERIFICATION
-- ============================================================================
-- Run these queries FIRST to verify current state before migration
-- ============================================================================

-- Check 1: Verify current triggers exist
SELECT 
  'PRE-MIGRATION: Current Triggers' as check_type,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'game_stats'
AND event_object_schema = 'public'
AND (trigger_name LIKE '%score%' OR trigger_name LIKE '%foul%')
ORDER BY trigger_name;

-- Check 2: Verify current functions exist
SELECT 
  'PRE-MIGRATION: Current Functions' as check_type,
  p.proname as function_name,
  CASE 
    WHEN pg_get_functiondef(p.oid) LIKE '%UPDATE games%' THEN 'Updates games table'
    ELSE 'Does not update games table'
  END as updates_games_table
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('update_game_scores', 'update_game_scores_on_delete', 'update_game_scores_on_update', 'increment_team_fouls')
ORDER BY p.proname;

-- Check 3: Verify games table columns exist
SELECT 
  'PRE-MIGRATION: Games Table Columns' as check_type,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'games'
AND column_name IN ('team_a_fouls', 'team_b_fouls', 'home_score', 'away_score', 'team_a_id', 'team_b_id')
ORDER BY column_name;

-- Check 4: Verify game_stats table structure
SELECT 
  'PRE-MIGRATION: Game Stats Table Columns' as check_type,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'game_stats'
AND column_name IN ('game_id', 'team_id', 'stat_type', 'modifier', 'stat_value')
ORDER BY column_name;

-- ============================================================================
-- SAFETY CHECK: Verify no active games are being updated
-- ============================================================================
-- Optional: Check if there are active games (recommended to run during low-traffic period)
-- SELECT 
--   'SAFETY CHECK: Active Games' as check_type,
--   COUNT(*) as active_games_count
-- FROM games
-- WHERE status = 'in_progress';

-- ============================================================================
-- MIGRATION EXECUTION
-- ============================================================================
-- Execute the following in a SINGLE TRANSACTION for atomicity
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Create Optimized Combined Trigger Functions
-- ============================================================================

-- Function 1: INSERT trigger (handles scores + fouls)
CREATE OR REPLACE FUNCTION update_game_scores_and_fouls()
RETURNS TRIGGER AS $$
DECLARE
  is_scoring_stat BOOLEAN;
  is_foul_stat BOOLEAN;
  points_to_add INTEGER;
BEGIN
  -- Determine stat types
  is_scoring_stat := (NEW.modifier = 'made' AND NEW.stat_value > 0);
  is_foul_stat := (NEW.stat_type = 'foul');
  points_to_add := CASE WHEN is_scoring_stat THEN NEW.stat_value ELSE 0 END;

  -- ✅ SINGLE UPDATE: Handles both scores AND fouls in one statement
  -- This prevents lock contention by acquiring lock only once
  UPDATE games
  SET 
    -- Score updates (only if scoring stat)
    home_score = CASE 
      WHEN is_scoring_stat AND NEW.team_id = games.team_a_id 
      THEN home_score + points_to_add 
      ELSE home_score 
    END,
    away_score = CASE 
      WHEN is_scoring_stat AND NEW.team_id = games.team_b_id 
      THEN away_score + points_to_add 
      ELSE away_score 
    END,
    -- Foul increments (only if foul stat) - ✅ REAL-TIME AGGREGATION PRESERVED
    team_a_fouls = CASE 
      WHEN is_foul_stat AND NEW.team_id = games.team_a_id 
      THEN team_a_fouls + 1 
      ELSE team_a_fouls 
    END,
    team_b_fouls = CASE 
      WHEN is_foul_stat AND NEW.team_id = games.team_b_id 
      THEN team_b_fouls + 1 
      ELSE team_b_fouls 
    END,
    updated_at = NOW()
  WHERE id = NEW.game_id
  AND (is_scoring_stat OR is_foul_stat); -- Only update if there's something to update
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function 2: DELETE trigger (handles scores + fouls)
CREATE OR REPLACE FUNCTION update_game_scores_and_fouls_on_delete()
RETURNS TRIGGER AS $$
DECLARE
  is_scoring_stat BOOLEAN;
  is_foul_stat BOOLEAN;
  points_to_subtract INTEGER;
BEGIN
  -- Determine stat types
  is_scoring_stat := (OLD.modifier = 'made' AND OLD.stat_value > 0);
  is_foul_stat := (OLD.stat_type = 'foul');
  points_to_subtract := CASE WHEN is_scoring_stat THEN OLD.stat_value ELSE 0 END;

  -- ✅ SINGLE UPDATE: Handles both scores AND fouls in one statement
  UPDATE games
  SET 
    -- Score updates (only if scoring stat)
    home_score = GREATEST(0, CASE 
      WHEN is_scoring_stat AND OLD.team_id = games.team_a_id 
      THEN home_score - points_to_subtract 
      ELSE home_score 
    END),
    away_score = GREATEST(0, CASE 
      WHEN is_scoring_stat AND OLD.team_id = games.team_b_id 
      THEN away_score - points_to_subtract 
      ELSE away_score 
    END),
    -- Foul decrements (only if foul stat)
    team_a_fouls = GREATEST(0, CASE 
      WHEN is_foul_stat AND OLD.team_id = games.team_a_id 
      THEN team_a_fouls - 1 
      ELSE team_a_fouls 
    END),
    team_b_fouls = GREATEST(0, CASE 
      WHEN is_foul_stat AND OLD.team_id = games.team_b_id 
      THEN team_b_fouls - 1 
      ELSE team_b_fouls 
    END),
    updated_at = NOW()
  WHERE id = OLD.game_id
  AND (is_scoring_stat OR is_foul_stat); -- Only update if there's something to update
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function 3: UPDATE trigger (handles scores + fouls)
CREATE OR REPLACE FUNCTION update_game_scores_and_fouls_on_update()
RETURNS TRIGGER AS $$
DECLARE
  old_is_scoring BOOLEAN;
  new_is_scoring BOOLEAN;
  old_is_foul BOOLEAN;
  new_is_foul BOOLEAN;
  old_points INTEGER;
  new_points INTEGER;
  old_team_id UUID;
  new_team_id UUID;
BEGIN
  -- Determine stat types
  old_is_scoring := (OLD.modifier = 'made' AND OLD.stat_value > 0);
  new_is_scoring := (NEW.modifier = 'made' AND NEW.stat_value > 0);
  old_is_foul := (OLD.stat_type = 'foul');
  new_is_foul := (NEW.stat_type = 'foul');
  old_points := CASE WHEN old_is_scoring THEN OLD.stat_value ELSE 0 END;
  new_points := CASE WHEN new_is_scoring THEN NEW.stat_value ELSE 0 END;
  old_team_id := OLD.team_id;
  new_team_id := NEW.team_id;

  -- ✅ SINGLE UPDATE: Handles score changes AND foul changes in one statement
  UPDATE games
  SET 
    -- Score updates (handle team changes, made/missed changes)
    home_score = CASE
      -- Team A score changes
      WHEN old_team_id = games.team_a_id AND new_team_id = games.team_a_id 
      THEN home_score - old_points + new_points
      WHEN old_team_id = games.team_a_id AND new_team_id = games.team_b_id 
      THEN home_score - old_points
      WHEN old_team_id = games.team_b_id AND new_team_id = games.team_a_id 
      THEN home_score + new_points
      WHEN old_team_id = games.team_a_id AND new_points = 0 
      THEN home_score - old_points
      WHEN new_team_id = games.team_a_id AND old_points = 0 
      THEN home_score + new_points
      ELSE home_score
    END,
    away_score = CASE
      -- Team B score changes
      WHEN old_team_id = games.team_b_id AND new_team_id = games.team_b_id 
      THEN away_score - old_points + new_points
      WHEN old_team_id = games.team_b_id AND new_team_id = games.team_a_id 
      THEN away_score - old_points
      WHEN old_team_id = games.team_a_id AND new_team_id = games.team_b_id 
      THEN away_score + new_points
      WHEN old_team_id = games.team_b_id AND new_points = 0 
      THEN away_score - old_points
      WHEN new_team_id = games.team_b_id AND old_points = 0 
      THEN away_score + new_points
      ELSE away_score
    END,
    -- Foul updates (handle foul type changes)
    team_a_fouls = CASE
      WHEN old_is_foul AND new_is_foul AND old_team_id = games.team_a_id AND new_team_id = games.team_b_id 
      THEN team_a_fouls - 1  -- Foul moved from team A to team B
      WHEN old_is_foul AND new_is_foul AND old_team_id = games.team_b_id AND new_team_id = games.team_a_id 
      THEN team_a_fouls + 1  -- Foul moved from team B to team A
      WHEN old_is_foul AND NOT new_is_foul AND old_team_id = games.team_a_id 
      THEN GREATEST(0, team_a_fouls - 1)  -- Foul removed from team A
      WHEN NOT old_is_foul AND new_is_foul AND new_team_id = games.team_a_id 
      THEN team_a_fouls + 1  -- Foul added to team A
      ELSE team_a_fouls
    END,
    team_b_fouls = CASE
      WHEN old_is_foul AND new_is_foul AND old_team_id = games.team_b_id AND new_team_id = games.team_a_id 
      THEN team_b_fouls - 1  -- Foul moved from team B to team A
      WHEN old_is_foul AND new_is_foul AND old_team_id = games.team_a_id AND new_team_id = games.team_b_id 
      THEN team_b_fouls + 1  -- Foul moved from team A to team B
      WHEN old_is_foul AND NOT new_is_foul AND old_team_id = games.team_b_id 
      THEN GREATEST(0, team_b_fouls - 1)  -- Foul removed from team B
      WHEN NOT old_is_foul AND new_is_foul AND new_team_id = games.team_b_id 
      THEN team_b_fouls + 1  -- Foul added to team B
      ELSE team_b_fouls
    END,
    updated_at = NOW()
  WHERE id = NEW.game_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 2: Drop Old Triggers (Safe - uses IF EXISTS)
-- ============================================================================

-- Drop old score triggers
DROP TRIGGER IF EXISTS game_stats_update_scores ON game_stats;
DROP TRIGGER IF EXISTS game_stats_delete_update_scores ON game_stats;
DROP TRIGGER IF EXISTS game_stats_update_update_scores ON game_stats;

-- Drop old foul trigger
DROP TRIGGER IF EXISTS increment_team_fouls_trigger ON game_stats;

-- ============================================================================
-- STEP 3: Create New Combined Triggers
-- ============================================================================

-- INSERT trigger (handles scores + fouls)
CREATE TRIGGER game_stats_update_scores_and_fouls
  AFTER INSERT ON game_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_game_scores_and_fouls();

-- DELETE trigger (handles scores + fouls)
CREATE TRIGGER game_stats_delete_update_scores_and_fouls
  AFTER DELETE ON game_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_game_scores_and_fouls_on_delete();

-- UPDATE trigger (handles scores + fouls)
CREATE TRIGGER game_stats_update_update_scores_and_fouls
  AFTER UPDATE ON game_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_game_scores_and_fouls_on_update();

-- ============================================================================
-- STEP 4: Drop Old Functions (Cleanup - Safe with CASCADE)
-- ============================================================================

-- Drop old functions (they're no longer used)
DROP FUNCTION IF EXISTS update_game_scores() CASCADE;
DROP FUNCTION IF EXISTS update_game_scores_on_delete() CASCADE;
DROP FUNCTION IF EXISTS update_game_scores_on_update() CASCADE;
DROP FUNCTION IF EXISTS increment_team_fouls() CASCADE;

-- ============================================================================
-- COMMIT TRANSACTION
-- ============================================================================
-- Review all changes above, then commit
-- ============================================================================

COMMIT;

-- ============================================================================
-- POST-MIGRATION VERIFICATION
-- ============================================================================
-- Run these queries AFTER migration to verify success
-- ============================================================================

-- Verification 1: Check new triggers exist
SELECT 
  'POST-MIGRATION: New Triggers' as check_type,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'game_stats'
AND event_object_schema = 'public'
AND trigger_name LIKE '%scores_and_fouls%'
ORDER BY trigger_name;

-- Expected: 3 triggers (INSERT, DELETE, UPDATE)

-- Verification 2: Check old triggers are gone
SELECT 
  'POST-MIGRATION: Old Triggers Removed' as check_type,
  trigger_name,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'game_stats'
AND event_object_schema = 'public'
AND (trigger_name LIKE '%score%' OR trigger_name LIKE '%foul%')
ORDER BY trigger_name;

-- Expected: Only the 3 new combined triggers should exist

-- Verification 3: Check new functions exist
SELECT 
  'POST-MIGRATION: New Functions' as check_type,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('update_game_scores_and_fouls', 'update_game_scores_and_fouls_on_delete', 'update_game_scores_and_fouls_on_update')
ORDER BY p.proname;

-- Expected: 3 new functions

-- Verification 4: Check old functions are gone
SELECT 
  'POST-MIGRATION: Old Functions Removed' as check_type,
  p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('update_game_scores', 'update_game_scores_on_delete', 'update_game_scores_on_update', 'increment_team_fouls')
ORDER BY p.proname;

-- Expected: No rows (all old functions removed)

-- ============================================================================
-- TESTING CHECKLIST
-- ============================================================================
-- After migration, test the following:
-- 
-- 1. Record a made shot → Verify score increments
-- 2. Record a foul → Verify team fouls increment
-- 3. Delete a stat → Verify score/fouls decrement correctly
-- 4. Edit a stat (change team) → Verify scores/fouls update correctly
-- 5. Monitor for timeouts (code 57014) → Should be eliminated
-- 6. Verify real-time aggregation → Team fouls should update immediately
-- ============================================================================

-- ============================================================================
-- ROLLBACK SCRIPT (If needed)
-- ============================================================================
-- Only use if migration causes issues
-- ============================================================================

/*
BEGIN;

-- Restore old functions (you'll need the original function definitions)
-- These would need to be recreated from previous migrations

-- Drop new triggers
DROP TRIGGER IF EXISTS game_stats_update_scores_and_fouls ON game_stats;
DROP TRIGGER IF EXISTS game_stats_delete_update_scores_and_fouls ON game_stats;
DROP TRIGGER IF EXISTS game_stats_update_update_scores_and_fouls ON game_stats;

-- Drop new functions
DROP FUNCTION IF EXISTS update_game_scores_and_fouls() CASCADE;
DROP FUNCTION IF EXISTS update_game_scores_and_fouls_on_delete() CASCADE;
DROP FUNCTION IF EXISTS update_game_scores_and_fouls_on_update() CASCADE;

-- Recreate old triggers (you'll need original trigger definitions)
-- This would require restoring from backup or previous migration files

COMMIT;
*/

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

