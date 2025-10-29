-- ✅ ADD GAME-LEVEL AUTOMATION SETTINGS
-- This enables per-game automation overrides via Pre-Flight Check Modal
-- Safe to run: Column is nullable, no impact on existing games

-- Step 1: Add the column
ALTER TABLE games
ADD COLUMN IF NOT EXISTS automation_settings JSONB DEFAULT NULL;

-- Step 2: Add comment for documentation
COMMENT ON COLUMN games.automation_settings IS 
'Per-game automation overrides (set via Pre-Flight Check Modal). If NULL, uses tournament.automation_flags as default. Structure matches AutomationFlags interface: { clock: {...}, possession: {...}, sequences: {...}, fouls: {...}, undo: {...} }';

-- Step 3: Add index for faster queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_games_automation_settings 
ON games USING gin (automation_settings);

-- Step 4: Verify the change
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'games'
  AND column_name = 'automation_settings';

-- ✅ EXPECTED RESULT:
-- column_name: automation_settings
-- data_type: jsonb
-- is_nullable: YES
-- column_default: NULL

-- ===================================================================
-- 🔍 EXAMPLE: Query games with automation settings
-- ===================================================================

-- Find games with custom automation settings
SELECT 
  id,
  tournament_id,
  team_a_id,
  team_b_id,
  status,
  automation_settings->'clock'->>'enabled' as clock_enabled,
  automation_settings->'possession'->>'enabled' as possession_enabled,
  automation_settings->'sequences'->>'enabled' as sequences_enabled
FROM games
WHERE automation_settings IS NOT NULL
LIMIT 10;

-- ===================================================================
-- 🧪 TEST: Set automation settings for a game
-- ===================================================================

-- Example: Update a game with "Balanced" preset settings
-- UPDATE games
-- SET automation_settings = jsonb_build_object(
--   'clock', jsonb_build_object(
--     'enabled', true,
--     'autoPause', true,
--     'autoReset', true,
--     'ftMode', true,
--     'madeBasketStop', false
--   ),
--   'possession', jsonb_build_object(
--     'enabled', true,
--     'autoFlip', true,
--     'persistState', true,
--     'jumpBallArrow', false
--   ),
--   'sequences', jsonb_build_object(
--     'enabled', true,
--     'promptAssists', true,
--     'promptRebounds', true,
--     'promptBlocks', true,
--     'linkEvents', true,
--     'freeThrowSequence', true
--   ),
--   'fouls', jsonb_build_object(
--     'enabled', false,
--     'bonusFreeThrows', false,
--     'foulOutEnforcement', false,
--     'technicalEjection', false
--   ),
--   'undo', jsonb_build_object(
--     'enabled', false,
--     'maxHistorySize', 50
--   )
-- )
-- WHERE id = 'YOUR_GAME_ID_HERE';

