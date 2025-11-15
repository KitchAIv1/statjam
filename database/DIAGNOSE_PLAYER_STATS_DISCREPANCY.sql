-- ============================================================================
-- DIAGNOSE PLAYER STATS DISCREPANCY (Local vs Production)
-- ============================================================================
-- Purpose: Investigate why production shows different stats than local dev
-- Player: Red Jameson Jr. (0e0530d5-ca39-466c-8f66-e3e08c69b4f9)
-- Issue: Production shows 2 games, local shows 16 games
-- ============================================================================

-- STEP 1: Count total game_stats records for this player
-- ============================================================================
SELECT 
    COUNT(*) as total_stats_records,
    COUNT(DISTINCT game_id) as unique_game_ids
FROM game_stats
WHERE player_id = '0e0530d5-ca39-466c-8f66-e3e08c69b4f9';

-- Expected: Should match the number of games the player has stats for
-- If this is 16, but production only shows 2 games, RLS is filtering games


-- STEP 2: Get all unique game IDs where player has stats
-- ============================================================================
SELECT DISTINCT game_id
FROM game_stats
WHERE player_id = '0e0530d5-ca39-466c-8f66-e3e08c69b4f9'
ORDER BY game_id;

-- This shows ALL game IDs the player has stats for


-- STEP 3: Check which games are accessible (simulating RLS)
-- ============================================================================
-- Check if player is on teams in these games
SELECT 
    g.id as game_id,
    g.status,
    g.tournament_id,
    tp.team_id as player_team_id,
    CASE 
        WHEN tp.team_id = g.team_a_id THEN 'Team A'
        WHEN tp.team_id = g.team_b_id THEN 'Team B'
        ELSE 'Not on either team'
    END as player_team_position
FROM games g
LEFT JOIN team_players tp ON (
    tp.player_id = '0e0530d5-ca39-466c-8f66-e3e08c69b4f9'
    AND (tp.team_id = g.team_a_id OR tp.team_id = g.team_b_id)
)
WHERE g.id IN (
    SELECT DISTINCT game_id 
    FROM game_stats 
    WHERE player_id = '0e0530d5-ca39-466c-8f66-e3e08c69b4f9'
)
ORDER BY g.created_at DESC;

-- This shows which games the player is actually on a team for
-- Games where player_team_id IS NULL might be filtered by RLS


-- STEP 4: Check RLS policies on games table
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'games'
AND schemaname = 'public'
ORDER BY policyname;

-- This shows what RLS policies exist for the games table
-- Look for policies that might restrict player access


-- STEP 5: Check if games are in tournaments player is part of
-- ============================================================================
SELECT 
    g.id as game_id,
    g.tournament_id,
    g.status,
    t.name as tournament_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM team_players tp
            JOIN teams t2 ON tp.team_id = t2.id
            WHERE tp.player_id = '0e0530d5-ca39-466c-8f66-e3e08c69b4f9'
            AND t2.tournament_id = g.tournament_id
        ) THEN 'Player in tournament'
        ELSE 'Player NOT in tournament'
    END as tournament_access
FROM games g
LEFT JOIN tournaments t ON g.tournament_id = t.id
WHERE g.id IN (
    SELECT DISTINCT game_id 
    FROM game_stats 
    WHERE player_id = '0e0530d5-ca39-466c-8f66-e3e08c69b4f9'
)
ORDER BY g.created_at DESC;

-- This shows if the player is part of tournaments for these games
-- RLS might only allow access to games in tournaments the player is part of


-- STEP 6: Compare stats count vs games count
-- ============================================================================
SELECT 
    'Stats Records' as source,
    COUNT(*) as count
FROM game_stats
WHERE player_id = '0e0530d5-ca39-466c-8f66-e3e08c69b4f9'

UNION ALL

SELECT 
    'Unique Game IDs (from stats)' as source,
    COUNT(DISTINCT game_id) as count
FROM game_stats
WHERE player_id = '0e0530d5-ca39-466c-8f66-e3e08c69b4f9'

UNION ALL

SELECT 
    'Accessible Games (via RLS)' as source,
    COUNT(*) as count
FROM games
WHERE id IN (
    SELECT DISTINCT game_id 
    FROM game_stats 
    WHERE player_id = '0e0530d5-ca39-466c-8f66-e3e08c69b4f9'
)
AND (
    -- Player is on team A or B
    EXISTS (
        SELECT 1 FROM team_players tp
        WHERE tp.player_id = '0e0530d5-ca39-466c-8f66-e3e08c69b4f9'
        AND (tp.team_id = team_a_id OR tp.team_id = team_b_id)
    )
    OR
    -- Game is in tournament player is part of
    EXISTS (
        SELECT 1 FROM team_players tp
        JOIN teams t ON tp.team_id = t.id
        WHERE tp.player_id = '0e0530d5-ca39-466c-8f66-e3e08c69b4f9'
        AND t.tournament_id = games.tournament_id
    )
    OR
    -- Public games (if RLS allows)
    is_public = true
);

-- This compares the counts to identify the discrepancy


-- ============================================================================
-- DIAGNOSIS GUIDE
-- ============================================================================
-- 
-- ISSUE: RLS policies are filtering games
--   SOLUTION: Update RLS policy to allow players to read games where they have stats
--   SQL FIX:
--   CREATE POLICY IF NOT EXISTS "Players can read games they have stats for"
--   ON games FOR SELECT
--   TO authenticated
--   USING (
--     -- Player is on a team in this game
--     EXISTS (
--       SELECT 1 FROM team_players tp
--       WHERE tp.player_id = auth.uid()
--       AND (tp.team_id = team_a_id OR tp.team_id = team_b_id)
--     )
--     OR
--     -- Player has stats for this game
--     EXISTS (
--       SELECT 1 FROM game_stats gs
--       WHERE gs.game_id = id
--       AND gs.player_id = auth.uid()
--     )
--     OR
--     -- Game is in tournament player is part of
--     EXISTS (
--       SELECT 1 FROM team_players tp
--       JOIN teams t ON tp.team_id = t.id
--       WHERE tp.player_id = auth.uid()
--       AND t.tournament_id = tournament_id
--     )
--   );
--
-- ============================================================================

