-- ============================================================================
-- VERIFICATION: Check game_phase Column Status
-- Date: December 4, 2024
-- Purpose: Verify if game_phase column exists and what values games have
-- ============================================================================

-- Step 1: Check if column exists in schema
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'games'
  AND column_name = 'game_phase';

-- Expected Result if column EXISTS:
-- column_name: game_phase
-- data_type: text
-- is_nullable: YES
-- column_default: 'regular'::text
-- character_maximum_length: NULL

-- Expected Result if column DOES NOT EXIST:
-- (0 rows returned)

-- ============================================================================

-- Step 2: Check CHECK constraint if column exists
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%game_phase%';

-- Expected Result if constraint EXISTS:
-- constraint_name: games_game_phase_check (or similar)
-- check_clause: ((game_phase)::text = ANY ((ARRAY['regular'::character varying, 'playoffs'::character varying, 'finals'::character varying])::text[]))

-- ============================================================================

-- Step 3: Check index if column exists
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'games'
  AND indexname LIKE '%game_phase%';

-- Expected Result if index EXISTS:
-- indexname: idx_games_game_phase
-- indexdef: CREATE INDEX idx_games_game_phase ON public.games USING btree (game_phase)

-- ============================================================================

-- Step 4: Sample game_phase values from games (if column exists)
-- Run this ONLY if column exists (Step 1 returned results)
SELECT 
  id,
  tournament_id,
  status,
  game_phase,
  created_at,
  start_time
FROM games
ORDER BY created_at DESC
LIMIT 20;

-- Expected Results:
-- If migration NOT run: Error "column games.game_phase does not exist"
-- If migration run: All games should have game_phase = 'regular' (default)

-- ============================================================================

-- Step 5: Count games by phase (if column exists)
SELECT 
  game_phase,
  COUNT(*) as game_count,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
  COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_count,
  COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_count
FROM games
GROUP BY game_phase
ORDER BY game_phase;

-- Expected Results:
-- game_phase: regular | game_count: [total] | completed_count: X | in_progress_count: Y | scheduled_count: Z
-- (All games should be 'regular' by default if migration was run)

-- ============================================================================

-- Step 6: Check for NULL values (should be none if migration was run correctly)
SELECT 
  COUNT(*) as null_count
FROM games
WHERE game_phase IS NULL;

-- Expected Result:
-- null_count: 0 (if migration was run correctly)

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- If Step 1 returns 0 rows: Column does NOT exist - migration needs to be run
-- If Step 1 returns 1 row: Column EXISTS - check Steps 2-6 for details
-- If Step 6 returns null_count > 0: Migration may have issues - all should be 'regular'

