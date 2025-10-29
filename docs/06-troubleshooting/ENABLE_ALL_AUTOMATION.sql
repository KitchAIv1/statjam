-- ✅ ENABLE ALL AUTOMATION FOR ALL TOURNAMENTS
-- This ensures ALL tournaments have full automation enabled by default

-- Step 1: Enable automation for ALL existing tournaments
UPDATE tournaments
SET automation_settings = jsonb_build_object(
  'clock', jsonb_build_object(
    'enabled', true,
    'autoPause', true,
    'autoReset', true,
    'ftMode', true,
    'madeBasketStop', false
  ),
  'possession', jsonb_build_object(
    'enabled', true,
    'autoFlip', true,
    'persistState', true,
    'jumpBallArrow', false
  ),
  'sequences', jsonb_build_object(
    'enabled', true,
    'promptAssists', true,
    'promptRebounds', true,
    'promptBlocks', true,
    'linkEvents', true,
    'freeThrowSequence', true
  ),
  'fouls', jsonb_build_object(
    'enabled', false,
    'bonusFreeThrows', false,
    'foulOutEnforcement', false,
    'technicalEjection', false
  ),
  'undo', jsonb_build_object(
    'enabled', false,
    'maxHistorySize', 50
  )
)
WHERE automation_settings IS NULL 
   OR automation_settings->>'clock' IS NULL
   OR automation_settings->'clock'->>'enabled' IS NULL
   OR automation_settings->'clock'->>'enabled' = 'false';

-- Step 2: Verify ALL tournaments now have automation enabled
SELECT 
  id,
  name,
  automation_settings->'clock'->>'enabled' as clock_enabled,
  automation_settings->'possession'->>'enabled' as possession_enabled,
  automation_settings->'sequences'->>'enabled' as sequences_enabled
FROM tournaments
ORDER BY created_at DESC
LIMIT 20;

-- ✅ EXPECTED RESULT:
-- All tournaments should show:
-- clock_enabled: true
-- possession_enabled: true  
-- sequences_enabled: true

-- ===================================================================
-- 🔍 CHECK SPECIFIC TOURNAMENT
-- ===================================================================
SELECT 
  id,
  name,
  automation_settings
FROM tournaments
WHERE id = '5171021b-0925-49dc-af62-5ddfbe56726e';

