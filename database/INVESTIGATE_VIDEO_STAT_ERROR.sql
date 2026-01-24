-- ============================================================================
-- INVESTIGATE VIDEO STAT TRACKING ERROR
-- Game ID: 130288f0-0170-41a1-9f87-d99826ca9997
-- Issue: Foreign key violation when recording stats for organizer tournament
-- with coach-created team players
-- ============================================================================

-- STEP 1: Check game details
-- ============================================================================
SELECT 
    g.id as game_id,
    g.is_coach_game,
    g.team_a_id,
    g.team_b_id,
    g.tournament_id,
    ta.name as team_a_name,
    ta.coach_id as team_a_coach_id,
    ta.tournament_id as team_a_tournament_id,
    tb.name as team_b_name,
    tb.coach_id as team_b_coach_id,
    tb.tournament_id as team_b_tournament_id,
    t.name as tournament_name
FROM games g
LEFT JOIN teams ta ON g.team_a_id = ta.id
LEFT JOIN teams tb ON g.team_b_id = tb.id
LEFT JOIN tournaments t ON g.tournament_id = t.id
WHERE g.id = '130288f0-0170-41a1-9f87-d99826ca9997';

-- STEP 2: Check team_players for both teams
-- ============================================================================
-- This shows if players are from users table (player_id) or custom_players (custom_player_id)
SELECT 
    tp.team_id,
    t.name as team_name,
    tp.player_id,
    tp.custom_player_id,
    CASE 
        WHEN tp.player_id IS NOT NULL THEN 'Regular Player (users table)'
        WHEN tp.custom_player_id IS NOT NULL THEN 'Custom Player (custom_players table)'
        ELSE 'INVALID - No player ID'
    END as player_type,
    u.name as regular_player_name,
    cp.name as custom_player_name
FROM team_players tp
JOIN teams t ON tp.team_id = t.id
LEFT JOIN users u ON tp.player_id = u.id
LEFT JOIN custom_players cp ON tp.custom_player_id = cp.id
WHERE tp.team_id IN (
    SELECT team_a_id FROM games WHERE id = '130288f0-0170-41a1-9f87-d99826ca9997'
    UNION
    SELECT team_b_id FROM games WHERE id = '130288f0-0170-41a1-9f87-d99826ca9997'
)
ORDER BY tp.team_id, tp.player_id NULLS LAST, tp.custom_player_id NULLS LAST;

-- STEP 3: Check recent game_stats to see what's being recorded
-- ============================================================================
SELECT 
    gs.id,
    gs.player_id,
    gs.custom_player_id,
    gs.is_opponent_stat,
    gs.stat_type,
    gs.modifier,
    gs.created_at,
    CASE 
        WHEN gs.player_id IS NOT NULL THEN 'Regular Player'
        WHEN gs.custom_player_id IS NOT NULL THEN 'Custom Player'
        WHEN gs.is_opponent_stat = true THEN 'Opponent Stat'
        ELSE 'INVALID - No player'
    END as stat_player_type,
    u.name as regular_player_name,
    cp.name as custom_player_name
FROM game_stats gs
LEFT JOIN users u ON gs.player_id = u.id
LEFT JOIN custom_players cp ON gs.custom_player_id = cp.id
WHERE gs.game_id = '130288f0-0170-41a1-9f87-d99826ca9997'
ORDER BY gs.created_at DESC
LIMIT 20;

-- STEP 4: Check for failed inserts (stats with invalid player_id)
-- ============================================================================
-- This will show if any stats have player_id that doesn't exist in users table
SELECT 
    gs.id,
    gs.player_id,
    gs.custom_player_id,
    gs.stat_type,
    gs.created_at,
    CASE 
        WHEN gs.player_id IS NOT NULL AND u.id IS NULL THEN '❌ INVALID: player_id not in users table'
        WHEN gs.custom_player_id IS NOT NULL AND cp.id IS NULL THEN '❌ INVALID: custom_player_id not in custom_players table'
        ELSE '✅ Valid'
    END as validation_status
FROM game_stats gs
LEFT JOIN users u ON gs.player_id = u.id
LEFT JOIN custom_players cp ON gs.custom_player_id = cp.id
WHERE gs.game_id = '130288f0-0170-41a1-9f87-d99826ca9997'
AND (
    (gs.player_id IS NOT NULL AND u.id IS NULL)
    OR (gs.custom_player_id IS NOT NULL AND cp.id IS NULL)
)
ORDER BY gs.created_at DESC;

-- STEP 5: Summary - Count players by type for each team
-- ============================================================================
SELECT 
    t.id as team_id,
    t.name as team_name,
    t.coach_id,
    COUNT(CASE WHEN tp.player_id IS NOT NULL THEN 1 END) as regular_players_count,
    COUNT(CASE WHEN tp.custom_player_id IS NOT NULL THEN 1 END) as custom_players_count,
    COUNT(*) as total_players
FROM teams t
LEFT JOIN team_players tp ON t.id = tp.team_id
WHERE t.id IN (
    SELECT team_a_id FROM games WHERE id = '130288f0-0170-41a1-9f87-d99826ca9997'
    UNION
    SELECT team_b_id FROM games WHERE id = '130288f0-0170-41a1-9f87-d99826ca9997'
)
GROUP BY t.id, t.name, t.coach_id;
