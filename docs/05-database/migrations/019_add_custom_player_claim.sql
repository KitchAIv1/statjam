-- ============================================================================
-- CUSTOM PLAYER CLAIM FEATURE MIGRATION
-- ============================================================================
-- Purpose: Enable custom players to claim their profiles as full StatJam accounts
-- Flow: Coach generates claim link → Player clicks → Creates/links account → Claims data
-- ============================================================================

-- Phase 1: Add claim fields to custom_players table
ALTER TABLE custom_players 
ADD COLUMN IF NOT EXISTS claim_token VARCHAR(32) UNIQUE;

ALTER TABLE custom_players 
ADD COLUMN IF NOT EXISTS claim_token_expires_at TIMESTAMPTZ;

ALTER TABLE custom_players 
ADD COLUMN IF NOT EXISTS claimed_by_user_id UUID REFERENCES users(id);

ALTER TABLE custom_players 
ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

-- Phase 2: Add index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_custom_players_claim_token 
ON custom_players(claim_token) 
WHERE claim_token IS NOT NULL;

-- Phase 3: Add index for claimed user lookup
CREATE INDEX IF NOT EXISTS idx_custom_players_claimed_by 
ON custom_players(claimed_by_user_id) 
WHERE claimed_by_user_id IS NOT NULL;

-- Phase 4: Add constraint - can only be claimed once
ALTER TABLE custom_players 
ADD CONSTRAINT custom_players_single_claim 
CHECK (
  (claimed_by_user_id IS NULL AND claimed_at IS NULL) OR
  (claimed_by_user_id IS NOT NULL AND claimed_at IS NOT NULL)
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify new columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'custom_players' 
AND column_name IN ('claim_token', 'claim_token_expires_at', 'claimed_by_user_id', 'claimed_at');

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================
-- ALTER TABLE custom_players DROP CONSTRAINT IF EXISTS custom_players_single_claim;
-- DROP INDEX IF EXISTS idx_custom_players_claimed_by;
-- DROP INDEX IF EXISTS idx_custom_players_claim_token;
-- ALTER TABLE custom_players DROP COLUMN IF EXISTS claimed_at;
-- ALTER TABLE custom_players DROP COLUMN IF EXISTS claimed_by_user_id;
-- ALTER TABLE custom_players DROP COLUMN IF EXISTS claim_token_expires_at;
-- ALTER TABLE custom_players DROP COLUMN IF EXISTS claim_token;

