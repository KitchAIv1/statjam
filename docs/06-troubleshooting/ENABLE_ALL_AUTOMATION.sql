-- ✅ ENABLE ALL AUTOMATION FOR ALL TOURNAMENTS
-- This ensures ALL tournaments have full automation enabled by default

-- Step 1: Enable automation for ALL existing tournaments
UPDATE tournaments
SET automation_flags = jsonb_build_object(
  'clock', jsonb_build_object(
    'enabled', true,
    'autoStart', true,
    'autoPause', true,
    'autoReset', true
  ),
  'possession', jsonb_build_object(
    'enabled', true,
    'autoFlip', true,
    'persistState', true
  ),
  'sequences', jsonb_build_object(
    'enabled', true,
    'promptAssist', true,
    'promptRebound', true,
    'promptBlock', true,
    'promptTurnover', true,
    'autoLinkEvents', true
  )
)
WHERE automation_flags IS NULL 
   OR automation_flags->>'clock' IS NULL
   OR automation_flags->'clock'->>'enabled' IS NULL
   OR automation_flags->'clock'->>'enabled' = 'false';

-- Step 2: Verify ALL tournaments now have automation enabled
SELECT 
  id,
  name,
  automation_flags->'clock'->>'enabled' as clock_enabled,
  automation_flags->'possession'->>'enabled' as possession_enabled,
  automation_flags->'sequences'->>'enabled' as sequences_enabled
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
  automation_flags
FROM tournaments
WHERE id = '5171021b-0925-49dc-af62-5ddfbe56726e';

