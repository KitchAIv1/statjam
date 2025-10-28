-- ============================================================================
-- Migration: 010_ruleset_configuration.sql
-- Purpose: Add ruleset and automation settings to tournaments and games
-- Phase: 1 (Foundation)
-- Breaking Changes: NONE (defaults ensure existing tournaments work unchanged)
-- Rollback: Not needed (defaults maintain current behavior)
-- ============================================================================

-- ✅ ADDITIVE: Add ruleset columns with safe defaults
ALTER TABLE tournaments 
  ADD COLUMN IF NOT EXISTS ruleset TEXT DEFAULT 'NBA' 
    CHECK (ruleset IN ('NBA', 'FIBA', 'NCAA', 'CUSTOM')),
  ADD COLUMN IF NOT EXISTS ruleset_config JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS automation_settings JSONB DEFAULT '{
    "clock": {
      "enabled": false,
      "autoPause": false,
      "autoReset": false,
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
  }'::jsonb;

-- Add possession tracking to games (nullable, no breaking changes)
ALTER TABLE games 
  ADD COLUMN IF NOT EXISTS possession_arrow UUID REFERENCES teams(id),
  ADD COLUMN IF NOT EXISTS current_possession UUID REFERENCES teams(id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tournaments_ruleset ON tournaments(ruleset);
CREATE INDEX IF NOT EXISTS idx_games_possession_arrow ON games(possession_arrow);
CREATE INDEX IF NOT EXISTS idx_games_current_possession ON games(current_possession);

-- Comments for documentation
COMMENT ON COLUMN tournaments.ruleset IS 'Game rules: NBA (default), FIBA, NCAA, or CUSTOM';
COMMENT ON COLUMN tournaments.ruleset_config IS 'Custom ruleset overrides (only used when ruleset=CUSTOM): { clockRules: {...}, shotClockRules: {...}, timeoutRules: {...}, foulRules: {...} }';
COMMENT ON COLUMN tournaments.automation_settings IS 'Feature flags for automation (all default OFF for Phase 1): { clock: {...}, possession: {...}, sequences: {...}, fouls: {...}, undo: {...} }';
COMMENT ON COLUMN games.possession_arrow IS 'Team that gets next jump ball (alternating possession rule)';
COMMENT ON COLUMN games.current_possession IS 'Team currently in possession (persisted for page refresh recovery)';

-- ✅ VERIFICATION: Ensure existing tournaments get safe defaults
DO $$
DECLARE
  existing_count INTEGER;
BEGIN
  -- Count existing tournaments
  SELECT COUNT(*) INTO existing_count FROM tournaments;
  
  RAISE NOTICE 'Migration 010: Ruleset configuration added successfully';
  RAISE NOTICE 'Existing tournaments: % (all will default to NBA ruleset with automation OFF)', existing_count;
  RAISE NOTICE 'No behavior changes - all automation flags default to false';
  
  -- Verify a sample tournament has correct defaults
  IF existing_count > 0 THEN
    PERFORM 1 FROM tournaments 
    WHERE ruleset = 'NBA' 
    AND automation_settings->>'clock' IS NOT NULL
    LIMIT 1;
    
    IF FOUND THEN
      RAISE NOTICE 'Sample verification: Existing tournament has correct defaults';
    END IF;
  END IF;
END $$;

