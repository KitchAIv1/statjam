-- ============================================================================
-- VERIFY TIMEOUT STATE - Database Verification Queries
-- ============================================================================
-- Purpose: Check if timeout tracking is working correctly in the database
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Check current timeout values in games table
-- ----------------------------------------------------------------------------
SELECT 
    id,
    team_a_id,
    team_b_id,
    team_a_timeouts_remaining,
    team_b_timeouts_remaining,
    status,
    quarter,
    created_at
FROM games
WHERE id = 'YOUR_GAME_ID_HERE'  -- Replace with actual game ID
ORDER BY created_at DESC
LIMIT 5;

-- ----------------------------------------------------------------------------
-- 2. Count recorded timeouts per team for a specific game
-- ----------------------------------------------------------------------------
SELECT 
    team_id,
    COUNT(*) as total_timeouts_used,
    COUNT(CASE WHEN timeout_type = 'full' THEN 1 END) as full_timeouts,
    COUNT(CASE WHEN timeout_type = '30_second' THEN 1 END) as short_timeouts,
    MIN(created_at) as first_timeout,
    MAX(created_at) as last_timeout
FROM game_timeouts
WHERE game_id = 'YOUR_GAME_ID_HERE'  -- Replace with actual game ID
GROUP BY team_id
ORDER BY team_id;

-- ----------------------------------------------------------------------------
-- 3. Verify timeout count matches expected (should be 5 - count of used timeouts)
-- ----------------------------------------------------------------------------
SELECT 
    g.id as game_id,
    g.team_a_id,
    g.team_b_id,
    g.team_a_timeouts_remaining as db_team_a_timeouts,
    g.team_b_timeouts_remaining as db_team_b_timeouts,
    (5 - COUNT(CASE WHEN gt.team_id = g.team_a_id THEN 1 END)) as calculated_team_a_timeouts,
    (5 - COUNT(CASE WHEN gt.team_id = g.team_b_id THEN 1 END)) as calculated_team_b_timeouts,
    COUNT(CASE WHEN gt.team_id = g.team_a_id THEN 1 END) as team_a_timeouts_used,
    COUNT(CASE WHEN gt.team_id = g.team_b_id THEN 1 END) as team_b_timeouts_used
FROM games g
LEFT JOIN game_timeouts gt ON gt.game_id = g.id
WHERE g.id = 'YOUR_GAME_ID_HERE'  -- Replace with actual game ID
GROUP BY g.id, g.team_a_id, g.team_b_id, g.team_a_timeouts_remaining, g.team_b_timeouts_remaining;

-- ----------------------------------------------------------------------------
-- 4. List all timeout events for a game (chronological order)
-- ----------------------------------------------------------------------------
SELECT 
    id,
    game_id,
    team_id,
    quarter,
    game_clock_minutes,
    game_clock_seconds,
    timeout_type,
    duration_seconds,
    created_at
FROM game_timeouts
WHERE game_id = 'YOUR_GAME_ID_HERE'  -- Replace with actual game ID
ORDER BY created_at ASC;

-- ----------------------------------------------------------------------------
-- 5. Check for any NULL or invalid timeout values
-- ----------------------------------------------------------------------------
SELECT 
    id,
    team_a_id,
    team_b_id,
    team_a_timeouts_remaining,
    team_b_timeouts_remaining,
    CASE 
        WHEN team_a_timeouts_remaining IS NULL THEN 'NULL'
        WHEN team_a_timeouts_remaining < 0 THEN 'NEGATIVE'
        WHEN team_a_timeouts_remaining > 5 THEN 'OVER_LIMIT'
        ELSE 'OK'
    END as team_a_status,
    CASE 
        WHEN team_b_timeouts_remaining IS NULL THEN 'NULL'
        WHEN team_b_timeouts_remaining < 0 THEN 'NEGATIVE'
        WHEN team_b_timeouts_remaining > 5 THEN 'OVER_LIMIT'
        ELSE 'OK'
    END as team_b_status
FROM games
WHERE id = 'YOUR_GAME_ID_HERE'  -- Replace with actual game ID;

-- ----------------------------------------------------------------------------
-- 6. Quick check: Get most recent game with timeout data
-- ----------------------------------------------------------------------------
SELECT 
    g.id,
    g.team_a_id,
    g.team_b_id,
    g.team_a_timeouts_remaining,
    g.team_b_timeouts_remaining,
    g.status,
    COUNT(gt.id) as total_timeouts_recorded
FROM games g
LEFT JOIN game_timeouts gt ON gt.game_id = g.id
WHERE g.status IN ('in_progress', 'completed')
GROUP BY g.id, g.team_a_id, g.team_b_id, g.team_a_timeouts_remaining, g.team_b_timeouts_remaining, g.status
ORDER BY g.created_at DESC
LIMIT 10;

