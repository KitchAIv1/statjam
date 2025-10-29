-- ✅ ENABLE CLOCK AUTOMATION FOR YOUR TOURNAMENT
-- This enables the clock automation that was working before

-- Step 1: Find your tournament ID
-- (You can see it in the logs: tournament_id = 5171021b-0925-49dc-af62-5ddfbe56726e)

-- Step 2: Enable clock automation for this tournament
UPDATE tournaments
SET automation_settings = jsonb_set(
  COALESCE(automation_settings, '{}'::jsonb),
  '{clock,enabled}',
  'true'::jsonb
)
WHERE id = '5171021b-0925-49dc-af62-5ddfbe56726e';

-- Step 3: Verify the update
SELECT 
  id,
  name,
  automation_settings
FROM tournaments
WHERE id = '5171021b-0925-49dc-af62-5ddfbe56726e';

-- ✅ EXPECTED RESULT:
-- automation_settings should show:
-- {
--   "clock": {
--     "enabled": true,
--     "autoPause": true,
--     "autoReset": true,
--     "ftMode": true
--   },
--   "possession": {
--     "enabled": true,
--     ...
--   },
--   "sequences": {
--     "enabled": true,
--     ...
--   }
-- }

-- ===================================================================
-- 🚀 ENABLE FOR ALL TOURNAMENTS (OPTIONAL)
-- If you want ALL tournaments to have clock automation enabled:
-- ===================================================================

-- UPDATE tournaments
-- SET automation_settings = jsonb_set(
--   COALESCE(automation_settings, '{}'::jsonb),
--   '{clock,enabled}',
--   'true'::jsonb
-- )
-- WHERE automation_settings IS NOT NULL 
--    OR automation_settings->>'clock' IS NOT NULL;

