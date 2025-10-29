-- ============================================================================
-- ENABLE PHASE 4: Play Sequences & Event Linking for Stat Admin Games
-- ============================================================================
-- Purpose: Enable Phase 4 automation (assist/rebound/block/turnover prompts)
--          for tournaments tracked by stat admin
-- Date: October 28, 2025
-- ============================================================================

-- STEP 1: Check current automation settings for your tournaments
-- ============================================================================
SELECT 
  id,
  name,
  organizer_id,
  ruleset,
  automation_settings
FROM tournaments
WHERE id IN (
  SELECT DISTINCT tournament_id 
  FROM games 
  WHERE status != 'completed'
)
ORDER BY created_at DESC;

-- ============================================================================
-- STEP 2: Enable Phase 4 for a SPECIFIC tournament
-- ============================================================================
-- Replace 'YOUR-TOURNAMENT-ID' with the actual tournament ID from Step 1

UPDATE tournaments
SET automation_settings = jsonb_set(
  COALESCE(automation_settings, '{}'::jsonb),
  '{sequences}',
  '{
    "enabled": true,
    "promptAssists": true,
    "promptRebounds": true,
    "promptBlocks": true,
    "linkEvents": true,
    "freeThrowSequence": true
  }'::jsonb
)
WHERE id = 'YOUR-TOURNAMENT-ID';

-- ============================================================================
-- STEP 3: Enable Phase 4 for ALL active tournaments (use with caution!)
-- ============================================================================
-- This will enable Phase 4 for all tournaments with active games
-- Only run this if you want to enable it globally

/*
UPDATE tournaments
SET automation_settings = jsonb_set(
  COALESCE(automation_settings, '{}'::jsonb),
  '{sequences}',
  '{
    "enabled": true,
    "promptAssists": true,
    "promptRebounds": true,
    "promptBlocks": true,
    "linkEvents": true,
    "freeThrowSequence": true
  }'::jsonb
)
WHERE id IN (
  SELECT DISTINCT tournament_id 
  FROM games 
  WHERE status != 'completed'
  AND tournament_id IS NOT NULL
);
*/

-- ============================================================================
-- STEP 4: Verify Phase 4 is enabled
-- ============================================================================
SELECT 
  id,
  name,
  automation_settings->'sequences' as phase4_settings
FROM tournaments
WHERE automation_settings->'sequences'->>'enabled' = 'true';

-- ============================================================================
-- STEP 5: Check what automation is enabled for each phase
-- ============================================================================
SELECT 
  id,
  name,
  -- Phase 2: Clock Automation
  automation_settings->'clock'->>'enabled' as phase2_clock,
  -- Phase 3: Possession Tracking
  automation_settings->'possession'->>'enabled' as phase3_possession,
  -- Phase 4: Play Sequences
  automation_settings->'sequences'->>'enabled' as phase4_sequences
FROM tournaments
WHERE id IN (
  SELECT DISTINCT tournament_id 
  FROM games 
  WHERE status != 'completed'
)
ORDER BY created_at DESC;

-- ============================================================================
-- ROLLBACK: Disable Phase 4 for a tournament
-- ============================================================================
/*
UPDATE tournaments
SET automation_settings = jsonb_set(
  automation_settings,
  '{sequences,enabled}',
  'false'::jsonb
)
WHERE id = 'YOUR-TOURNAMENT-ID';
*/

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. Phase 4 modals will appear AFTER you enable automation and refresh the tracker
-- 2. Existing games will pick up the new settings on next page load
-- 3. Coach games automatically have Phase 4 enabled (COACH_AUTOMATION_FLAGS)
-- 4. Stat admin games need manual enablement via this SQL
-- 5. You can enable/disable individual prompts:
--    - promptAssists: true/false
--    - promptRebounds: true/false
--    - promptBlocks: true/false
-- 6. linkEvents: true ensures events are linked via sequence_id
-- 7. freeThrowSequence: true (ready for Phase 5, not yet implemented)
-- ============================================================================

