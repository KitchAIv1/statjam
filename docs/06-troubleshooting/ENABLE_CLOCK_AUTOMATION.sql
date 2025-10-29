-- ✅ ENABLE CLOCK AUTOMATION FOR YOUR TOURNAMENT
-- This enables the clock automation that was working before

-- Step 1: Find your tournament ID
-- (You can see it in the logs: tournament_id = 5171021b-0925-49dc-af62-5ddfbe56726e)

-- Step 2: Enable clock automation for this tournament
UPDATE tournaments
SET automation_flags = jsonb_set(
  COALESCE(automation_flags, '{}'::jsonb),
  '{clock,enabled}',
  'true'::jsonb
)
WHERE id = '5171021b-0925-49dc-af62-5ddfbe56726e';

-- Step 3: Verify the update
SELECT 
  id,
  name,
  automation_flags
FROM tournaments
WHERE id = '5171021b-0925-49dc-af62-5ddfbe56726e';

-- ✅ EXPECTED RESULT:
-- automation_flags should show:
-- {
--   "clock": {
--     "enabled": true,
--     "autoStart": true,
--     "autoPause": true
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
-- SET automation_flags = jsonb_set(
--   COALESCE(automation_flags, '{}'::jsonb),
--   '{clock,enabled}',
--   'true'::jsonb
-- )
-- WHERE automation_flags IS NOT NULL 
--    OR automation_flags->>'clock' IS NOT NULL;

