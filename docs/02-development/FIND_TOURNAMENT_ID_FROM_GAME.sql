-- ============================================================================
-- FIND TOURNAMENT ID FROM GAME ID
-- ============================================================================
-- Purpose: Get tournament ID from the game ID in your logs
-- Game ID from logs: b36cd88c-4b7d-46c8-8796-24cb7da44a06
-- ============================================================================

-- Find tournament ID from game ID
SELECT 
  g.id as game_id,
  g.tournament_id,
  t.name as tournament_name,
  t.ruleset,
  t.automation_settings->'clock'->>'enabled' as clock_automation_enabled,
  t.automation_settings
FROM games g
JOIN tournaments t ON g.tournament_id = t.id
WHERE g.id = 'b36cd88c-4b7d-46c8-8796-24cb7da44a06';

-- ============================================================================
-- NOW ENABLE AUTOMATION FOR THIS TOURNAMENT
-- ============================================================================
-- Copy the tournament_id from above and use it below

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
WHERE id = (
  SELECT tournament_id 
  FROM games 
  WHERE id = 'b36cd88c-4b7d-46c8-8796-24cb7da44a06'
);

-- ============================================================================
-- VERIFY THE UPDATE
-- ============================================================================
SELECT 
  t.id as tournament_id,
  t.name as tournament_name,
  t.ruleset,
  t.automation_settings->'clock'->>'enabled' as clock_enabled,
  t.automation_settings->'clock'->>'autoPause' as auto_pause,
  t.automation_settings->'clock'->>'autoReset' as auto_reset
FROM tournaments t
WHERE t.id = (
  SELECT tournament_id 
  FROM games 
  WHERE id = 'b36cd88c-4b7d-46c8-8796-24cb7da44a06'
);

