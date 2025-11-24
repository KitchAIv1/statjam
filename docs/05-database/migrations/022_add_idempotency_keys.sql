-- ============================================================================
-- IDEMPOTENCY KEYS MIGRATION
-- ============================================================================
-- Purpose: Add idempotency keys to game_stats table to prevent duplicate writes
-- Issue: Retry logic and network failures can cause duplicate stat recordings
-- Solution: Add unique idempotency_key column to detect and prevent duplicates
-- ============================================================================
-- Date: November 2024
-- Risk Level: 🟡 MEDIUM (requires rollback plan)
-- ============================================================================

BEGIN;

-- Step 1: Add idempotency_key column (nullable initially to allow existing rows)
ALTER TABLE game_stats 
ADD COLUMN IF NOT EXISTS idempotency_key UUID;

-- Step 2: Create unique index on idempotency_key (allows NULL values)
-- Note: PostgreSQL unique indexes allow multiple NULL values, which is what we want
CREATE UNIQUE INDEX IF NOT EXISTS idx_game_stats_idempotency_key 
ON game_stats(idempotency_key) 
WHERE idempotency_key IS NOT NULL;

-- Step 3: Add index for performance (idempotency_key lookups)
-- This index helps with duplicate detection queries
CREATE INDEX IF NOT EXISTS idx_game_stats_idempotency_key_lookup 
ON game_stats(idempotency_key);

-- Step 4: Add comment for documentation
COMMENT ON COLUMN game_stats.idempotency_key IS 
'Unique key generated client-side before write to prevent duplicate stat recordings on retry or network failure. NULL for legacy records.';

-- Verification: Check that column was added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'game_stats' 
    AND column_name = 'idempotency_key'
  ) THEN
    RAISE EXCEPTION 'idempotency_key column was not created';
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================
-- To rollback this migration, run:
--
-- BEGIN;
-- DROP INDEX IF EXISTS idx_game_stats_idempotency_key_lookup;
-- DROP INDEX IF EXISTS idx_game_stats_idempotency_key;
-- ALTER TABLE game_stats DROP COLUMN IF EXISTS idempotency_key;
-- COMMIT;
-- ============================================================================

