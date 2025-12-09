-- ============================================================================
-- FIX: TOURNAMENT LEADERS CONSTRAINT + RE-COMPUTE
-- 
-- ISSUE: Unique constraint on (tournament_id, player_id) prevents per-phase rows
-- FIX: Change constraint to include game_phase column
-- ============================================================================

-- ============================================================================
-- STEP 1: CHECK CURRENT CONSTRAINT
-- ============================================================================

-- View the existing constraint
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'tournament_leaders'::regclass
  AND contype = 'u';

-- ============================================================================
-- STEP 2: DROP OLD CONSTRAINT, ADD NEW ONE
-- ============================================================================

-- Drop the old constraint that only allows 1 row per player
ALTER TABLE tournament_leaders 
DROP CONSTRAINT IF EXISTS tournament_leaders_tournament_id_player_id_key;

-- Add new constraint that allows 1 row per player PER PHASE
ALTER TABLE tournament_leaders 
ADD CONSTRAINT tournament_leaders_tournament_player_phase_key 
UNIQUE (tournament_id, player_id, game_phase);

-- ============================================================================
-- STEP 3: VERIFY CONSTRAINT CHANGE
-- ============================================================================

SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'tournament_leaders'::regclass
  AND contype = 'u';

-- Expected: tournament_leaders_tournament_player_phase_key UNIQUE (tournament_id, player_id, game_phase)

-- ============================================================================
-- STEP 4: NOW RUN THE RE-COMPUTE FUNCTION
-- ============================================================================

SELECT * FROM recompute_tournament_leaders('c2fa28fa-ec92-40b4-a0db-0a94b68db103');

-- ============================================================================
-- STEP 5: VERIFY RESULTS
-- ============================================================================

-- 5A. Check phase distribution
SELECT 
    game_phase,
    COUNT(*) as row_count,
    SUM(games_played) as total_games_tracked
FROM tournament_leaders
WHERE tournament_id = 'c2fa28fa-ec92-40b4-a0db-0a94b68db103'
GROUP BY game_phase
ORDER BY game_phase;

-- 5B. Verify Finals data exists
SELECT 
    player_name,
    game_phase,
    games_played,
    total_points
FROM tournament_leaders
WHERE tournament_id = 'c2fa28fa-ec92-40b4-a0db-0a94b68db103'
  AND game_phase = 'finals'
ORDER BY total_points DESC
LIMIT 10;

-- 5C. Check a specific player across all phases
SELECT 
    player_name,
    game_phase,
    games_played,
    total_points
FROM tournament_leaders
WHERE tournament_id = 'c2fa28fa-ec92-40b4-a0db-0a94b68db103'
  AND player_name = 'Fisto Bizima'
ORDER BY 
    CASE game_phase 
        WHEN 'regular' THEN 1 
        WHEN 'playoffs' THEN 2 
        WHEN 'finals' THEN 3 
        WHEN 'all' THEN 4 
    END;

-- 5D. Top scorers per phase (fixed query)
(
    SELECT 'Regular Season' as phase, player_name, total_points 
    FROM tournament_leaders 
    WHERE tournament_id = 'c2fa28fa-ec92-40b4-a0db-0a94b68db103' AND game_phase = 'regular'
    ORDER BY total_points DESC LIMIT 3
)
UNION ALL
(
    SELECT 'Finals' as phase, player_name, total_points 
    FROM tournament_leaders 
    WHERE tournament_id = 'c2fa28fa-ec92-40b4-a0db-0a94b68db103' AND game_phase = 'finals'
    ORDER BY total_points DESC LIMIT 3
)
UNION ALL
(
    SELECT 'All Games' as phase, player_name, total_points 
    FROM tournament_leaders 
    WHERE tournament_id = 'c2fa28fa-ec92-40b4-a0db-0a94b68db103' AND game_phase = 'all'
    ORDER BY total_points DESC LIMIT 3
);

