-- ============================================================================
-- MIGRATION: Add Game Phase Labels (REGULAR, PLAYOFFS, FINALS)
-- Date: December 4, 2024
-- Description: Adds game_phase column to games table for manual phase labeling
--              until bracket system is fully implemented
-- ============================================================================
-- SAFETY NOTES:
-- ✅ Uses IF NOT EXISTS to prevent errors if column already exists
-- ✅ Adds column WITH DEFAULT to avoid UPDATE on existing rows (faster, safer)
-- ✅ CHECK constraint ensures data integrity
-- ✅ No impact on existing triggers (they don't reference game_phase)
-- ✅ Transaction wrapped for atomicity (rollback on error)
-- ============================================================================

BEGIN;

-- Step 1: Add game_phase column WITH DEFAULT value
-- This is safer than ADD COLUMN + UPDATE because:
-- 1. PostgreSQL sets default for existing rows automatically (no UPDATE needed)
-- 2. Faster execution (no table scan)
-- 3. Less locking (no row-level locks on existing data)
ALTER TABLE games
ADD COLUMN IF NOT EXISTS game_phase TEXT 
  DEFAULT 'regular' 
  CHECK (game_phase IN ('regular', 'playoffs', 'finals'));

-- Step 2: Update any NULL values (safety net - should be none if DEFAULT worked)
-- This handles edge cases where DEFAULT might not apply
UPDATE games
SET game_phase = 'regular'
WHERE game_phase IS NULL;

-- Step 3: Add comment for documentation
COMMENT ON COLUMN games.game_phase IS 
'Game phase label: regular (regular season/pool play), playoffs (playoff/elimination games), finals (championship game). Manual assignment until bracket system is implemented.';

-- Step 4: Add index for filtering (optional but recommended for performance)
CREATE INDEX IF NOT EXISTS idx_games_game_phase 
ON games(game_phase);

-- Step 5: Verify the change
-- Note: check_clause is verified separately in safety verification section below
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'games'
  AND column_name = 'game_phase';

-- ✅ EXPECTED RESULT:
-- column_name: game_phase
-- data_type: text
-- is_nullable: YES (nullable allowed, but has default)
-- column_default: 'regular'

-- ============================================================================
-- SAFETY VERIFICATION
-- ============================================================================
-- Run these queries to verify migration safety:

-- 1. Verify column was added successfully
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'games' AND column_name = 'game_phase';

-- 2. Verify no NULL values exist (all should be 'regular' by default)
-- SELECT COUNT(*) as null_count FROM games WHERE game_phase IS NULL;
-- Expected: 0

-- 3. Verify CHECK constraint is active
-- SELECT constraint_name, check_clause
-- FROM information_schema.check_constraints
-- WHERE constraint_name LIKE '%game_phase%';

-- 4. Verify triggers are unaffected (they don't reference game_phase)
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE event_object_table = 'games';
-- Expected: Existing triggers remain unchanged

COMMIT;

-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================
-- BEGIN;
-- DROP INDEX IF EXISTS idx_games_game_phase;
-- ALTER TABLE games DROP COLUMN IF EXISTS game_phase;
-- COMMIT;

