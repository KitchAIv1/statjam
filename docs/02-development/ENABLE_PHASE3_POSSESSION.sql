-- ============================================================================
-- ENABLE PHASE 3: POSSESSION TRACKING AUTOMATION
-- ============================================================================
-- Purpose: Enable possession automation for tournaments
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- OPTION 1: Enable for ALL tournaments (Global)
-- ============================================================================
UPDATE tournaments
SET automation_settings = jsonb_set(
  jsonb_set(
    COALESCE(automation_settings, '{}'::jsonb),
    '{possession,enabled}',
    'true'::jsonb
  ),
  '{possession,autoFlip}',
  'true'::jsonb
)
WHERE automation_settings IS NOT NULL;

-- Also enable for tournaments without automation_settings
UPDATE tournaments
SET automation_settings = '{
  "clock": {"enabled": true, "autoStart": false, "autoPause": true, "autoReset": true},
  "possession": {"enabled": true, "persistState": true, "jumpBallArrow": true}
}'::jsonb
WHERE automation_settings IS NULL;

-- ============================================================================
-- OPTION 2: Enable for SPECIFIC tournament (Recommended for testing)
-- ============================================================================
-- Replace 'YOUR_TOURNAMENT_ID' with actual tournament ID
UPDATE tournaments
SET automation_settings = jsonb_set(
  jsonb_set(
    COALESCE(automation_settings, '{}'::jsonb),
    '{possession,enabled}',
    'true'::jsonb
  ),
  '{possession,autoFlip}',
  'true'::jsonb
)
WHERE id = 'YOUR_TOURNAMENT_ID';

-- ============================================================================
-- OPTION 3: Enable for Coach Games (System Tournament)
-- ============================================================================
UPDATE tournaments
SET automation_settings = jsonb_set(
  COALESCE(automation_settings, '{}'::jsonb),
  '{possession}',
  '{"enabled": true, "persistState": true, "jumpBallArrow": true}'::jsonb
)
WHERE name = 'Coach Games (System)';

-- ============================================================================
-- VERIFICATION: Check automation settings
-- ============================================================================
SELECT 
  id,
  name,
  automation_settings->'possession' as possession_settings,
  automation_settings->'clock' as clock_settings
FROM tournaments
WHERE automation_settings IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- EXPECTED OUTPUT:
-- ============================================================================
-- possession_settings should show:
-- {
--   "enabled": true,
--   "persistState": true,
--   "jumpBallArrow": true
-- }

