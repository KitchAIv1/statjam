-- ============================================================================
-- TOURNAMENT DIVISIONS SUPPORT
-- ============================================================================
-- Purpose: Add support for tournament divisions (groupings) to enable
--          division-based brackets and championship phases
-- Issue: Teams and tournaments don't have division columns
-- Solution: Add division columns to teams and tournaments tables
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Add division column to teams table
-- ----------------------------------------------------------------------------

-- Add division column to teams (nullable - teams can exist without divisions)
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS division TEXT;

-- Add comment for clarity
COMMENT ON COLUMN teams.division IS 'Division name (e.g., "A", "B", "C" or custom names). NULL if tournament does not use divisions.';

-- ----------------------------------------------------------------------------
-- STEP 2: Add division configuration columns to tournaments table
-- ----------------------------------------------------------------------------

-- Add has_divisions flag (default false - most tournaments don't use divisions)
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS has_divisions BOOLEAN DEFAULT FALSE NOT NULL;

-- Add division_count (number of divisions, nullable if has_divisions is false)
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS division_count INTEGER;

-- Add division_names (JSONB array for custom division names, nullable)
-- Example: ["Division A", "Division B", "Division C"] or ["East", "West"]
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS division_names JSONB;

-- Add comments for clarity
COMMENT ON COLUMN tournaments.has_divisions IS 'Whether this tournament uses divisions (groupings). Default: false.';
COMMENT ON COLUMN tournaments.division_count IS 'Number of divisions in this tournament. NULL if has_divisions is false.';
COMMENT ON COLUMN tournaments.division_names IS 'Custom division names as JSON array. NULL if using default names (A, B, C, etc.).';

-- ----------------------------------------------------------------------------
-- STEP 3: Add index for division queries (performance optimization)
-- ----------------------------------------------------------------------------

-- Index for filtering teams by division within a tournament
CREATE INDEX IF NOT EXISTS idx_teams_tournament_division 
ON teams(tournament_id, division) 
WHERE division IS NOT NULL;

-- ----------------------------------------------------------------------------
-- STEP 4: Add constraint to ensure division_count matches division_names length
-- ----------------------------------------------------------------------------

-- Note: This is a soft constraint (application-level validation recommended)
-- Database-level constraint would require a function/trigger which is more complex
-- For now, we rely on application-level validation

-- ----------------------------------------------------------------------------
-- VERIFICATION QUERIES
-- ----------------------------------------------------------------------------

-- Verify teams.division column exists
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'teams' AND column_name = 'division';

-- Verify tournaments division columns exist
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns 
-- WHERE table_name = 'tournaments' 
-- AND column_name IN ('has_divisions', 'division_count', 'division_names');

-- Verify index exists
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'teams' AND indexname = 'idx_teams_tournament_division';

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- DROP INDEX IF EXISTS idx_teams_tournament_division;
-- ALTER TABLE tournaments DROP COLUMN IF EXISTS division_names;
-- ALTER TABLE tournaments DROP COLUMN IF EXISTS division_count;
-- ALTER TABLE tournaments DROP COLUMN IF EXISTS has_divisions;
-- ALTER TABLE teams DROP COLUMN IF EXISTS division;

