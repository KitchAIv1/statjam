-- ============================================================
-- FIX QUARTER: Change Q4 → Q3 for game 0b38e518-974e-4fdb-9bca-153d5b3cc788
-- ============================================================

-- STEP 1: PREVIEW - Check current Q4 stats
SELECT 
  quarter,
  COUNT(*) AS stat_count
FROM game_stats
WHERE game_id = '0b38e518-974e-4fdb-9bca-153d5b3cc788'
GROUP BY quarter
ORDER BY quarter;

-- STEP 2: UPDATE game_stats - Change Q4 to Q3
UPDATE game_stats
SET quarter = 3
WHERE game_id = '0b38e518-974e-4fdb-9bca-153d5b3cc788'
  AND quarter = 4;

-- STEP 3: UPDATE game_substitutions - Change Q4 to Q3 (if any)
UPDATE game_substitutions
SET quarter = 3
WHERE game_id = '0b38e518-974e-4fdb-9bca-153d5b3cc788'
  AND quarter = 4;

-- STEP 4: VERIFY - Check updated quarters
SELECT 
  quarter,
  COUNT(*) AS stat_count
FROM game_stats
WHERE game_id = '0b38e518-974e-4fdb-9bca-153d5b3cc788'
GROUP BY quarter
ORDER BY quarter;

