-- ===========================================
-- FIX: Change Q4 stats to Q3 for game 0b38e518-974e-4fdb-9bca-153d5b3cc788
-- ===========================================

-- 1. PREVIEW: Count of stats to be updated
SELECT 
  'PREVIEW: Stats to update' as section,
  COUNT(*) as total_q4_stats
FROM game_stats
WHERE game_id = '0b38e518-974e-4fdb-9bca-153d5b3cc788'
  AND quarter = 4;

-- 2. PREVIEW: Show stats that will be changed
SELECT 
  id,
  stat_type,
  modifier,
  quarter as current_quarter,
  3 as new_quarter,
  game_time_minutes,
  game_time_seconds,
  created_at
FROM game_stats
WHERE game_id = '0b38e518-974e-4fdb-9bca-153d5b3cc788'
  AND quarter = 4
ORDER BY created_at;

-- ===========================================
-- 3. EXECUTE: Update game_stats quarter from 4 to 3
-- ===========================================
UPDATE game_stats
SET quarter = 3
WHERE game_id = '0b38e518-974e-4fdb-9bca-153d5b3cc788'
  AND quarter = 4;

-- ===========================================
-- 4. EXECUTE: Update game_substitutions quarter from 4 to 3 (if any)
-- ===========================================
UPDATE game_substitutions
SET quarter = 3
WHERE game_id = '0b38e518-974e-4fdb-9bca-153d5b3cc788'
  AND quarter = 4;

-- 5. VERIFY: Confirm no Q4 stats remain
SELECT 
  'VERIFICATION' as section,
  quarter,
  COUNT(*) as stat_count
FROM game_stats
WHERE game_id = '0b38e518-974e-4fdb-9bca-153d5b3cc788'
GROUP BY quarter
ORDER BY quarter;

-- 6. VERIFY: Confirm substitutions
SELECT 
  'SUBSTITUTIONS' as section,
  quarter,
  COUNT(*) as sub_count
FROM game_substitutions
WHERE game_id = '0b38e518-974e-4fdb-9bca-153d5b3cc788'
GROUP BY quarter
ORDER BY quarter;

