-- ============================================================================
-- VERIFY: Fisto Bizima Games Count Issue
-- Expected: Regular(2) + Finals(1) = All(3), but showing 6
-- ============================================================================

-- 1. What's stored in tournament_leaders for Fisto?
SELECT 
    player_name, 
    game_phase, 
    games_played, 
    total_points
FROM tournament_leaders
WHERE tournament_id = 'c2fa28fa-ec92-40b4-a0db-0a94b68db103'
  AND player_name = 'Fisto Bizima'
ORDER BY game_phase;

-- 2. How many actual games did Fisto play in? (from raw game_stats)
SELECT DISTINCT 
    g.id as game_id,
    g.game_phase,
    g.status
FROM games g
JOIN game_stats gs ON gs.game_id = g.id
WHERE g.tournament_id = 'c2fa28fa-ec92-40b4-a0db-0a94b68db103'
  AND g.status = 'completed'
  AND (gs.player_id = 'bed5ff8a-2e59-4365-b722-f50d85765e2e' 
       OR gs.custom_player_id = 'bed5ff8a-2e59-4365-b722-f50d85765e2e');

-- 3. Check if there are duplicate rows per phase
SELECT 
    player_id,
    player_name,
    game_phase,
    COUNT(*) as row_count
FROM tournament_leaders
WHERE tournament_id = 'c2fa28fa-ec92-40b4-a0db-0a94b68db103'
  AND player_name = 'Fisto Bizima'
GROUP BY player_id, player_name, game_phase;

-- 4. Check current constraint on table
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'tournament_leaders'::regclass
  AND contype = 'u';

-- 5. Total row count for Fisto (should be 3-4 rows: regular, finals, all, maybe playoffs)
SELECT COUNT(*) as total_rows_for_fisto
FROM tournament_leaders
WHERE tournament_id = 'c2fa28fa-ec92-40b4-a0db-0a94b68db103'
  AND player_name = 'Fisto Bizima';

