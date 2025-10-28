-- ============================================================================
-- Phase 1 Migration Verification Script
-- Purpose: Verify all 3 migrations were applied successfully
-- Run in: Supabase SQL Editor
-- Expected: All queries should return expected results
-- ============================================================================

-- ============================================================================
-- TEST 1: Verify Migration 008 (Event Linking)
-- ============================================================================

-- Check if new columns exist in game_stats
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'game_stats'
  AND column_name IN ('sequence_id', 'linked_event_id', 'event_metadata')
ORDER BY column_name;

-- Expected Results:
-- sequence_id       | uuid  | YES | NULL
-- linked_event_id   | uuid  | YES | NULL
-- event_metadata    | jsonb | YES | '{}'::jsonb

-- Check if indexes were created
SELECT 
  indexname, 
  indexdef
FROM pg_indexes
WHERE tablename = 'game_stats'
  AND indexname IN ('idx_game_stats_sequence_id', 'idx_game_stats_linked_event_id');

-- Expected: 2 indexes found

-- Test: Check existing game_stats have NULL/default values
SELECT 
  id,
  stat_type,
  sequence_id,
  linked_event_id,
  event_metadata
FROM game_stats
LIMIT 5;

-- Expected: 
-- sequence_id = NULL
-- linked_event_id = NULL
-- event_metadata = {}

-- ============================================================================
-- TEST 2: Verify Migration 009 (Possession Tracking)
-- ============================================================================

-- Check if game_possessions table exists
SELECT 
  table_name, 
  table_type
FROM information_schema.tables
WHERE table_name = 'game_possessions';

-- Expected: 1 row (table exists)

-- Check table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'game_possessions'
ORDER BY ordinal_position;

-- Expected columns:
-- id, game_id, team_id, start_quarter, start_time_seconds,
-- end_quarter, end_time_seconds, end_reason, created_at, updated_at

-- Check if indexes were created
SELECT 
  indexname, 
  indexdef
FROM pg_indexes
WHERE tablename = 'game_possessions';

-- Expected: 3 indexes (game_id, team_id, game_team composite)

-- Check if RLS is enabled
SELECT 
  tablename, 
  rowsecurity
FROM pg_tables
WHERE tablename = 'game_possessions';

-- Expected: rowsecurity = true

-- Check RLS policies
SELECT 
  policyname, 
  cmd, 
  qual
FROM pg_policies
WHERE tablename = 'game_possessions'
ORDER BY policyname;

-- Expected: 4 policies (public_read, stat_admin_write, organizer_write, coach_write)

-- Test: Table should be empty (no data yet)
SELECT COUNT(*) as possession_count
FROM game_possessions;

-- Expected: 0 (table is empty until Phase 3)

-- ============================================================================
-- TEST 3: Verify Migration 010 (Ruleset Configuration)
-- ============================================================================

-- Check if new columns exist in tournaments
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'tournaments'
  AND column_name IN ('ruleset', 'ruleset_config', 'automation_settings')
ORDER BY column_name;

-- Expected:
-- ruleset              | text  | YES | 'NBA'::text
-- ruleset_config       | jsonb | YES | '{}'::jsonb
-- automation_settings  | jsonb | YES | '{...all flags false...}'::jsonb

-- Check if new columns exist in games
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'games'
  AND column_name IN ('possession_arrow', 'current_possession')
ORDER BY column_name;

-- Expected:
-- possession_arrow     | uuid | YES | NULL
-- current_possession   | uuid | YES | NULL

-- Check if indexes were created
SELECT 
  indexname, 
  indexdef
FROM pg_indexes
WHERE tablename IN ('tournaments', 'games')
  AND indexname IN ('idx_tournaments_ruleset', 'idx_games_possession_arrow', 'idx_games_current_possession');

-- Expected: 3 indexes

-- ============================================================================
-- TEST 4: Verify Existing Tournaments Got Defaults
-- ============================================================================

-- Check existing tournaments have correct defaults
SELECT 
  id,
  name,
  ruleset,
  ruleset_config,
  automation_settings->>'clock' as clock_settings,
  automation_settings->'clock'->>'enabled' as clock_enabled,
  automation_settings->'possession'->>'enabled' as possession_enabled,
  automation_settings->'sequences'->>'enabled' as sequences_enabled,
  automation_settings->'fouls'->>'enabled' as fouls_enabled,
  automation_settings->'undo'->>'enabled' as undo_enabled
FROM tournaments
ORDER BY created_at DESC
LIMIT 5;

-- Expected for ALL tournaments:
-- ruleset = 'NBA'
-- ruleset_config = {}
-- clock_enabled = 'false'
-- possession_enabled = 'false'
-- sequences_enabled = 'false'
-- fouls_enabled = 'false'
-- undo_enabled = 'false'

-- ============================================================================
-- TEST 5: Verify Existing Games Have NULL Possession Fields
-- ============================================================================

SELECT 
  id,
  status,
  possession_arrow,
  current_possession
FROM games
ORDER BY created_at DESC
LIMIT 5;

-- Expected:
-- possession_arrow = NULL
-- current_possession = NULL

-- ============================================================================
-- TEST 6: Test INSERT Still Works (Critical!)
-- ============================================================================

-- Test: Insert a new game_stat WITHOUT new columns
-- This simulates existing code behavior
DO $$
DECLARE
  test_game_id UUID;
  test_team_id UUID;
  test_player_id UUID;
  inserted_stat_id UUID;
BEGIN
  -- Get a real game, team, and player from your database
  SELECT id INTO test_game_id FROM games LIMIT 1;
  SELECT id INTO test_team_id FROM teams LIMIT 1;
  SELECT id INTO test_player_id FROM users WHERE role = 'player' LIMIT 1;
  
  IF test_game_id IS NULL OR test_team_id IS NULL OR test_player_id IS NULL THEN
    RAISE NOTICE '⚠️ Skipping INSERT test - no game/team/player found';
  ELSE
    -- Insert WITHOUT new columns (simulates existing code)
    INSERT INTO game_stats (
      game_id,
      player_id,
      team_id,
      stat_type,
      modifier,
      quarter,
      game_time_minutes,
      game_time_seconds,
      stat_value
    ) VALUES (
      test_game_id,
      test_player_id,
      test_team_id,
      'field_goal',
      'made',
      1,
      10,
      30,
      2
    )
    RETURNING id INTO inserted_stat_id;
    
    -- Verify the insert worked and new columns have defaults
    RAISE NOTICE '✅ INSERT test passed - stat_id: %', inserted_stat_id;
    
    -- Check the inserted stat has correct defaults
    PERFORM 1 FROM game_stats 
    WHERE id = inserted_stat_id
      AND sequence_id IS NULL
      AND linked_event_id IS NULL
      AND event_metadata = '{}'::jsonb;
    
    IF FOUND THEN
      RAISE NOTICE '✅ New columns have correct defaults (NULL/empty JSON)';
    ELSE
      RAISE NOTICE '❌ New columns do NOT have correct defaults';
    END IF;
    
    -- Clean up test data
    DELETE FROM game_stats WHERE id = inserted_stat_id;
    RAISE NOTICE '✅ Test data cleaned up';
  END IF;
END $$;

-- Expected output:
-- ✅ INSERT test passed - stat_id: [uuid]
-- ✅ New columns have correct defaults (NULL/empty JSON)
-- ✅ Test data cleaned up

-- ============================================================================
-- TEST 7: Verify Automation Flags Structure
-- ============================================================================

-- Check automation_settings structure for a sample tournament
SELECT 
  id,
  name,
  jsonb_pretty(automation_settings) as automation_flags
FROM tournaments
LIMIT 1;

-- Expected JSON structure:
-- {
--   "clock": {
--     "enabled": false,
--     "autoPause": false,
--     "autoReset": false,
--     "ftMode": false,
--     "madeBasketStop": false
--   },
--   "possession": {
--     "enabled": false,
--     "autoFlip": false,
--     "persistState": false,
--     "jumpBallArrow": false
--   },
--   "sequences": {
--     "enabled": false,
--     "promptAssists": false,
--     "promptRebounds": false,
--     "promptBlocks": false,
--     "linkEvents": false,
--     "freeThrowSequence": false
--   },
--   "fouls": {
--     "enabled": false,
--     "bonusFreeThrows": false,
--     "foulOutEnforcement": false,
--     "technicalEjection": false
--   },
--   "undo": {
--     "enabled": false,
--     "maxHistorySize": 50
--   }
-- }

-- ============================================================================
-- SUMMARY: Expected Results
-- ============================================================================

-- ✅ Migration 008: 3 new columns in game_stats, 2 indexes, all existing stats have NULL/defaults
-- ✅ Migration 009: game_possessions table created, 3 indexes, 4 RLS policies, table is empty
-- ✅ Migration 010: 3 new columns in tournaments, 2 new columns in games, 3 indexes
-- ✅ All existing tournaments have ruleset='NBA' and automation flags OFF
-- ✅ All existing games have possession_arrow=NULL and current_possession=NULL
-- ✅ INSERT still works without new columns (uses defaults)
-- ✅ Automation flags have correct structure with all flags=false

-- If ALL tests pass: ✅ MIGRATIONS SUCCESSFUL - SAFE TO DEPLOY CODE

