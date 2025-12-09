-- ============================================================================
-- TRANSFER REGULAR GAMES TO PLAYOFFS
-- 
-- PURPOSE: Update game_phase from 'regular' to 'playoffs' for a tournament
-- TOURNAMENT: c2fa28fa-ec92-40b4-a0db-0a94b68db103
-- ============================================================================

-- ============================================================================
-- STEP 1: PREVIEW - Check current game phases (DO NOT SKIP)
-- ============================================================================

SELECT 
    game_phase,
    COUNT(*) as game_count,
    STRING_AGG(id::text, ', ' ORDER BY start_time) as game_ids
FROM games
WHERE tournament_id = 'c2fa28fa-ec92-40b4-a0db-0a94b68db103'
GROUP BY game_phase
ORDER BY game_phase;

-- ============================================================================
-- STEP 2: PREVIEW - See which games will be affected
-- ============================================================================

SELECT 
    id,
    game_phase,
    status,
    home_score,
    away_score,
    start_time
FROM games
WHERE tournament_id = 'c2fa28fa-ec92-40b4-a0db-0a94b68db103'
  AND game_phase = 'regular'
ORDER BY start_time;

-- ============================================================================
-- STEP 3: EXECUTE - Transfer regular games to playoffs
-- ============================================================================

-- ⚠️ ONLY RUN THIS AFTER VERIFYING STEP 1 & 2

UPDATE games
SET game_phase = 'playoffs'
WHERE tournament_id = 'c2fa28fa-ec92-40b4-a0db-0a94b68db103'
  AND game_phase = 'regular';

-- ============================================================================
-- STEP 4: VERIFY - Confirm the update
-- ============================================================================

SELECT 
    game_phase,
    COUNT(*) as game_count
FROM games
WHERE tournament_id = 'c2fa28fa-ec92-40b4-a0db-0a94b68db103'
GROUP BY game_phase
ORDER BY game_phase;

-- ============================================================================
-- STEP 5: RE-COMPUTE TOURNAMENT LEADERS (REQUIRED)
-- ============================================================================

-- After changing game phases, you MUST re-compute tournament_leaders
-- to reflect the new phase breakdown

SELECT * FROM recompute_tournament_leaders('c2fa28fa-ec92-40b4-a0db-0a94b68db103');

-- ============================================================================
-- STEP 6: VERIFY LEADERS - Confirm leaders are updated
-- ============================================================================

SELECT 
    game_phase,
    COUNT(*) as player_count,
    SUM(games_played) as total_games_tracked
FROM tournament_leaders
WHERE tournament_id = 'c2fa28fa-ec92-40b4-a0db-0a94b68db103'
GROUP BY game_phase
ORDER BY game_phase;

-- ============================================================================
-- ROLLBACK (IF NEEDED) - Transfer back to regular
-- ============================================================================

-- If you need to undo, run this:
/*
UPDATE games
SET game_phase = 'regular'
WHERE tournament_id = 'c2fa28fa-ec92-40b4-a0db-0a94b68db103'
  AND game_phase = 'playoffs';

-- Then re-compute leaders again
SELECT * FROM recompute_tournament_leaders('c2fa28fa-ec92-40b4-a0db-0a94b68db103');
*/

