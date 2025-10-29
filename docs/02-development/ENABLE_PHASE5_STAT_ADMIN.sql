-- ============================================================================
-- ENABLE PHASE 5: FREE THROW SEQUENCES
-- ============================================================================
-- Purpose: Enable automated free throw tracking for tournaments
-- Phase: 5 (Final Phase - Automation Complete!)
-- Date: 2025-10-29
-- ============================================================================

-- ============================================================================
-- STEP 1: Check Current Settings
-- ============================================================================

SELECT 
  id,
  name,
  automation_settings->'sequences'->'freeThrowSequence' as free_throw_enabled,
  automation_settings->'sequences' as all_sequence_settings
FROM tournaments
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- STEP 2: Enable Phase 5 for Specific Tournament
-- ============================================================================

-- Replace 'YOUR_TOURNAMENT_ID' with actual tournament ID
UPDATE tournaments
SET automation_settings = jsonb_set(
  COALESCE(automation_settings, '{}'::jsonb),
  '{sequences,freeThrowSequence}',
  'true'::jsonb
)
WHERE id = 'YOUR_TOURNAMENT_ID';

-- ============================================================================
-- STEP 3: Enable Phase 5 for ALL Active Tournaments (Use with caution!)
-- ============================================================================

-- Uncomment to enable for all active tournaments
/*
UPDATE tournaments
SET automation_settings = jsonb_set(
  COALESCE(automation_settings, '{}'::jsonb),
  '{sequences,freeThrowSequence}',
  'true'::jsonb
)
WHERE status = 'active';
*/

-- ============================================================================
-- STEP 4: Verify Settings
-- ============================================================================

SELECT 
  id,
  name,
  automation_settings->'sequences' as sequence_settings
FROM tournaments
WHERE id = 'YOUR_TOURNAMENT_ID';

-- Expected output:
-- {
--   "enabled": true,
--   "promptAssists": true,
--   "promptRebounds": true,
--   "promptBlocks": true,
--   "linkEvents": true,
--   "freeThrowSequence": true  <-- Should be true
-- }

-- ============================================================================
-- STEP 5: Complete Automation Settings (All Phases Enabled)
-- ============================================================================

-- This enables ALL automation features (Phases 1-5)
UPDATE tournaments
SET automation_settings = '{
  "clock": {
    "enabled": true,
    "autoPause": true,
    "autoReset": true,
    "ftMode": true,
    "madeBasketStop": true
  },
  "possession": {
    "enabled": true,
    "autoFlip": true,
    "persistState": true,
    "jumpBallArrow": true
  },
  "sequences": {
    "enabled": true,
    "promptAssists": true,
    "promptRebounds": true,
    "promptBlocks": true,
    "linkEvents": true,
    "freeThrowSequence": true
  },
  "fouls": {
    "enabled": false,
    "bonusFreeThrows": false,
    "foulOutEnforcement": false,
    "technicalEjection": false
  },
  "undo": {
    "enabled": false,
    "maxHistorySize": 50
  }
}'::jsonb
WHERE id = 'YOUR_TOURNAMENT_ID';

-- ============================================================================
-- STEP 6: Test Query - Find Recent Free Throws
-- ============================================================================

-- Check if free throws are being recorded correctly
SELECT 
  gs.id,
  gs.stat_type,
  gs.modifier,
  gs.sequence_id,
  gs.linked_event_id,
  gs.created_at,
  u.name as player_name
FROM game_stats gs
LEFT JOIN users u ON gs.player_id = u.id
WHERE gs.stat_type = 'free_throw'
  AND gs.game_id = 'YOUR_GAME_ID'
ORDER BY gs.created_at DESC
LIMIT 20;

-- ============================================================================
-- STEP 7: Test Query - Find Free Throw Sequences
-- ============================================================================

-- Find complete free throw sequences with linked events
SELECT 
  gs.sequence_id,
  COUNT(*) as total_shots,
  SUM(CASE WHEN gs.modifier = 'made' THEN 1 ELSE 0 END) as made,
  SUM(CASE WHEN gs.modifier = 'missed' THEN 1 ELSE 0 END) as missed,
  MIN(gs.created_at) as sequence_start,
  MAX(gs.created_at) as sequence_end
FROM game_stats gs
WHERE gs.stat_type = 'free_throw'
  AND gs.game_id = 'YOUR_GAME_ID'
  AND gs.sequence_id IS NOT NULL
GROUP BY gs.sequence_id
ORDER BY sequence_start DESC;

-- ============================================================================
-- STEP 8: Rollback (Disable Phase 5)
-- ============================================================================

-- If you need to disable Phase 5
/*
UPDATE tournaments
SET automation_settings = jsonb_set(
  automation_settings,
  '{sequences,freeThrowSequence}',
  'false'::jsonb
)
WHERE id = 'YOUR_TOURNAMENT_ID';
*/

-- ============================================================================
-- NOTES
-- ============================================================================

-- Phase 5 Features:
-- ✅ Automatic free throw sequence detection
-- ✅ 1-and-1 logic (stops if first shot missed)
-- ✅ 2-shot and 3-shot fouls
-- ✅ Technical fouls (1 shot)
-- ✅ Flagrant fouls (2 shots)
-- ✅ Rebound prompt after missed last shot
-- ✅ Event linking with sequence_id
-- ✅ Shot clock disabled during FT sequence

-- Dependencies:
-- - Phase 4 must be enabled (promptRebounds: true)
-- - Phase 2 must be enabled (ftMode: true for clock behavior)
-- - game_stats table must have sequence_id and linked_event_id columns

-- Testing:
-- 1. Record a shooting foul
-- 2. FT modal should appear
-- 3. Record free throws (Made/Missed)
-- 4. Verify all FTs in database with same sequence_id
-- 5. If last shot missed, rebound prompt should appear
-- 6. Verify shot clock disabled during sequence

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================

