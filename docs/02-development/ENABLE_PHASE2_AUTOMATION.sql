-- ============================================================================
-- ENABLE PHASE 2 CLOCK AUTOMATION FOR TESTING
-- ============================================================================
-- Purpose: Enable clock automation for a specific tournament to test Phase 2
-- Usage: Replace 'YOUR_TOURNAMENT_ID' with your actual tournament ID
-- ============================================================================

-- STEP 1: Find your tournament ID
-- Run this first to get your tournament ID
SELECT 
  id,
  name,
  ruleset,
  created_at,
  automation_settings->'clock'->>'enabled' as clock_automation_enabled
FROM tournaments
WHERE organizer_id = auth.uid()
ORDER BY created_at DESC
LIMIT 10;

-- STEP 2: Enable clock automation for testing
-- Copy the tournament ID from Step 1 and replace below
UPDATE tournaments 
SET automation_settings = '{
  "clock": {
    "enabled": true,
    "autoPause": true,
    "autoReset": true,
    "ftMode": false,
    "madeBasketStop": false
  },
  "possession": {
    "enabled": false,
    "autoFlip": false,
    "persistState": false,
    "jumpBallArrow": false
  },
  "sequences": {
    "enabled": false,
    "promptAssists": false,
    "promptRebounds": false,
    "promptBlocks": false,
    "linkEvents": false,
    "freeThrowSequence": false
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
WHERE id = 'YOUR_TOURNAMENT_ID';  -- ← REPLACE THIS

-- STEP 3: Verify the update
SELECT 
  id,
  name,
  ruleset,
  automation_settings->'clock'->>'enabled' as clock_enabled,
  automation_settings->'clock'->>'autoPause' as auto_pause,
  automation_settings->'clock'->>'autoReset' as auto_reset,
  automation_settings
FROM tournaments
WHERE id = 'YOUR_TOURNAMENT_ID';  -- ← REPLACE THIS

-- ============================================================================
-- QUICK ENABLE FOR ALL YOUR TOURNAMENTS (USE WITH CAUTION)
-- ============================================================================
-- Uncomment below to enable for ALL your tournaments
-- WARNING: This affects all your tournaments!

/*
UPDATE tournaments 
SET automation_settings = '{
  "clock": {
    "enabled": true,
    "autoPause": true,
    "autoReset": true,
    "ftMode": false,
    "madeBasketStop": false
  },
  "possession": {
    "enabled": false,
    "autoFlip": false,
    "persistState": false,
    "jumpBallArrow": false
  },
  "sequences": {
    "enabled": false,
    "promptAssists": false,
    "promptRebounds": false,
    "promptBlocks": false,
    "linkEvents": false,
    "freeThrowSequence": false
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
WHERE organizer_id = auth.uid();
*/

-- ============================================================================
-- DISABLE AUTOMATION (After Testing)
-- ============================================================================
-- Run this to turn automation back OFF

/*
UPDATE tournaments 
SET automation_settings = jsonb_set(
  COALESCE(automation_settings, '{}'::jsonb),
  '{clock,enabled}',
  'false'::jsonb
)
WHERE id = 'YOUR_TOURNAMENT_ID';  -- ← REPLACE THIS
*/

