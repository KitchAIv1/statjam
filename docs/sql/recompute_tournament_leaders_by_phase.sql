-- ============================================================================
-- TOURNAMENT LEADERS - RE-COMPUTE WITH GAME PHASE BREAKDOWN
-- 
-- PURPOSE: Populate tournament_leaders with per-phase rows (regular, playoffs, finals)
--          so the frontend can filter leaderboards by game phase.
--
-- SAFETY: This only affects the tournament_leaders table.
--         Does NOT modify: games, game_stats, users, custom_players, teams, or any other table.
--
-- USAGE:
--   1. Run Section 1 to create the function
--   2. Run Section 2 to execute for a specific tournament
--   3. Run Section 3 to verify results
-- ============================================================================

-- ============================================================================
-- SECTION 1: CREATE THE RE-COMPUTE FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION recompute_tournament_leaders(p_tournament_id UUID)
RETURNS TABLE(
    phase TEXT,
    players_inserted INT
) AS $$
DECLARE
    v_regular_count INT := 0;
    v_playoffs_count INT := 0;
    v_finals_count INT := 0;
    v_all_count INT := 0;
BEGIN
    -- Step 1: Delete existing rows for this tournament
    DELETE FROM tournament_leaders WHERE tournament_id = p_tournament_id;
    
    -- Step 2: Insert rows for each game_phase (regular, playoffs, finals)
    -- This CTE calculates stats per player per phase
    WITH game_phases AS (
        SELECT DISTINCT game_phase 
        FROM games 
        WHERE tournament_id = p_tournament_id 
          AND status = 'completed'
          AND game_phase IS NOT NULL
    ),
    player_stats_by_phase AS (
        SELECT 
            g.tournament_id,
            COALESCE(gs.player_id, gs.custom_player_id) AS player_id,
            gs.custom_player_id IS NOT NULL AS is_custom_player,
            gs.team_id,
            g.game_phase,
            gs.game_id,
            gs.stat_type,
            gs.stat_value,
            gs.modifier
        FROM game_stats gs
        INNER JOIN games g ON gs.game_id = g.id
        WHERE g.tournament_id = p_tournament_id
          AND g.status = 'completed'
          AND g.game_phase IS NOT NULL
          AND (gs.player_id IS NOT NULL OR gs.custom_player_id IS NOT NULL)
    ),
    aggregated_stats AS (
        SELECT 
            ps.tournament_id,
            ps.player_id,
            ps.is_custom_player,
            ps.team_id,
            ps.game_phase,
            COUNT(DISTINCT ps.game_id) AS games_played,
            -- Points calculation
            SUM(CASE 
                WHEN ps.stat_type IN ('field_goal', 'two_pointer') AND ps.modifier = 'made' THEN 2
                WHEN ps.stat_type = 'three_pointer' AND ps.modifier = 'made' THEN 3
                WHEN ps.stat_type = 'free_throw' AND ps.modifier = 'made' THEN 1
                ELSE 0 
            END) AS total_points,
            -- Rebounds
            SUM(CASE WHEN ps.stat_type = 'rebound' THEN COALESCE(ps.stat_value, 1) ELSE 0 END) AS total_rebounds,
            -- Assists
            SUM(CASE WHEN ps.stat_type = 'assist' THEN COALESCE(ps.stat_value, 1) ELSE 0 END) AS total_assists,
            -- Steals
            SUM(CASE WHEN ps.stat_type = 'steal' THEN COALESCE(ps.stat_value, 1) ELSE 0 END) AS total_steals,
            -- Blocks
            SUM(CASE WHEN ps.stat_type = 'block' THEN COALESCE(ps.stat_value, 1) ELSE 0 END) AS total_blocks,
            -- Turnovers
            SUM(CASE WHEN ps.stat_type = 'turnover' THEN COALESCE(ps.stat_value, 1) ELSE 0 END) AS total_turnovers,
            -- Field Goals
            SUM(CASE WHEN ps.stat_type IN ('field_goal', 'two_pointer', 'three_pointer') AND ps.modifier = 'made' THEN 1 ELSE 0 END) AS field_goals_made,
            SUM(CASE WHEN ps.stat_type IN ('field_goal', 'two_pointer', 'three_pointer') AND ps.modifier IN ('made', 'missed') THEN 1 ELSE 0 END) AS field_goals_attempted,
            -- Three Pointers
            SUM(CASE WHEN ps.stat_type = 'three_pointer' AND ps.modifier = 'made' THEN 1 ELSE 0 END) AS three_pointers_made,
            SUM(CASE WHEN ps.stat_type = 'three_pointer' AND ps.modifier IN ('made', 'missed') THEN 1 ELSE 0 END) AS three_pointers_attempted,
            -- Free Throws
            SUM(CASE WHEN ps.stat_type = 'free_throw' AND ps.modifier = 'made' THEN 1 ELSE 0 END) AS free_throws_made,
            SUM(CASE WHEN ps.stat_type = 'free_throw' AND ps.modifier IN ('made', 'missed') THEN 1 ELSE 0 END) AS free_throws_attempted
        FROM player_stats_by_phase ps
        GROUP BY ps.tournament_id, ps.player_id, ps.is_custom_player, ps.team_id, ps.game_phase
    )
    -- Insert per-phase rows
    INSERT INTO tournament_leaders (
        tournament_id, player_id, player_name, team_id, team_name,
        profile_photo_url, is_custom_player, game_phase, games_played,
        total_points, total_rebounds, total_assists, total_steals, total_blocks, total_turnovers,
        field_goals_made, field_goals_attempted, three_pointers_made, three_pointers_attempted,
        free_throws_made, free_throws_attempted, updated_at
    )
    SELECT 
        agg.tournament_id,
        agg.player_id,
        COALESCE(u.name, cp.name, 'Unknown Player') AS player_name,
        agg.team_id,
        COALESCE(t.name, 'Unknown Team') AS team_name,
        COALESCE(u.profile_photo_url, cp.profile_photo_url) AS profile_photo_url,
        agg.is_custom_player,
        agg.game_phase,
        agg.games_played,
        agg.total_points,
        agg.total_rebounds,
        agg.total_assists,
        agg.total_steals,
        agg.total_blocks,
        agg.total_turnovers,
        agg.field_goals_made,
        agg.field_goals_attempted,
        agg.three_pointers_made,
        agg.three_pointers_attempted,
        agg.free_throws_made,
        agg.free_throws_attempted,
        NOW()
    FROM aggregated_stats agg
    LEFT JOIN users u ON agg.player_id = u.id AND NOT agg.is_custom_player
    LEFT JOIN custom_players cp ON agg.player_id = cp.id AND agg.is_custom_player
    LEFT JOIN teams t ON agg.team_id = t.id;

    -- Get counts per phase
    SELECT COUNT(*) INTO v_regular_count FROM tournament_leaders WHERE tournament_id = p_tournament_id AND game_phase = 'regular';
    SELECT COUNT(*) INTO v_playoffs_count FROM tournament_leaders WHERE tournament_id = p_tournament_id AND game_phase = 'playoffs';
    SELECT COUNT(*) INTO v_finals_count FROM tournament_leaders WHERE tournament_id = p_tournament_id AND game_phase = 'finals';

    -- Step 3: Insert aggregated 'all' rows (sum of all phases per player)
    INSERT INTO tournament_leaders (
        tournament_id, player_id, player_name, team_id, team_name,
        profile_photo_url, is_custom_player, game_phase, games_played,
        total_points, total_rebounds, total_assists, total_steals, total_blocks, total_turnovers,
        field_goals_made, field_goals_attempted, three_pointers_made, three_pointers_attempted,
        free_throws_made, free_throws_attempted, updated_at
    )
    SELECT 
        tournament_id,
        player_id,
        player_name,
        team_id,
        team_name,
        profile_photo_url,
        is_custom_player,
        'all' AS game_phase,
        SUM(games_played) AS games_played,
        SUM(total_points) AS total_points,
        SUM(total_rebounds) AS total_rebounds,
        SUM(total_assists) AS total_assists,
        SUM(total_steals) AS total_steals,
        SUM(total_blocks) AS total_blocks,
        SUM(total_turnovers) AS total_turnovers,
        SUM(field_goals_made) AS field_goals_made,
        SUM(field_goals_attempted) AS field_goals_attempted,
        SUM(three_pointers_made) AS three_pointers_made,
        SUM(three_pointers_attempted) AS three_pointers_attempted,
        SUM(free_throws_made) AS free_throws_made,
        SUM(free_throws_attempted) AS free_throws_attempted,
        NOW()
    FROM tournament_leaders
    WHERE tournament_id = p_tournament_id
      AND game_phase != 'all'
    GROUP BY tournament_id, player_id, player_name, team_id, team_name, profile_photo_url, is_custom_player;

    SELECT COUNT(*) INTO v_all_count FROM tournament_leaders WHERE tournament_id = p_tournament_id AND game_phase = 'all';

    -- Return summary
    RETURN QUERY SELECT 'regular'::TEXT, v_regular_count;
    RETURN QUERY SELECT 'playoffs'::TEXT, v_playoffs_count;
    RETURN QUERY SELECT 'finals'::TEXT, v_finals_count;
    RETURN QUERY SELECT 'all'::TEXT, v_all_count;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comment
COMMENT ON FUNCTION recompute_tournament_leaders(UUID) IS 
'Re-computes tournament_leaders table with per-phase breakdown (regular, playoffs, finals, all). 
Safe to run multiple times - deletes and re-inserts data for the specified tournament only.';

-- ============================================================================
-- SECTION 2: EXECUTE FOR SPECIFIC TOURNAMENT
-- ============================================================================

-- Run this for the tournament that needs fixing:
SELECT * FROM recompute_tournament_leaders('c2fa28fa-ec92-40b4-a0db-0a94b68db103');

-- ============================================================================
-- SECTION 3: VERIFY RESULTS
-- ============================================================================

-- 3A. Check phase distribution after re-compute
SELECT 
    game_phase,
    COUNT(*) as row_count,
    SUM(games_played) as total_games_tracked
FROM tournament_leaders
WHERE tournament_id = 'c2fa28fa-ec92-40b4-a0db-0a94b68db103'
GROUP BY game_phase
ORDER BY game_phase;

-- 3B. Verify Finals data now exists
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

-- 3C. Compare 'all' totals (should match sum of phases)
SELECT 
    player_name,
    game_phase,
    games_played,
    total_points
FROM tournament_leaders
WHERE tournament_id = 'c2fa28fa-ec92-40b4-a0db-0a94b68db103'
  AND player_name = 'Fisto Bizima'
ORDER BY game_phase;

-- 3D. Top scorers for each phase
SELECT 'Regular Season' as phase, player_name, total_points 
FROM tournament_leaders 
WHERE tournament_id = 'c2fa28fa-ec92-40b4-a0db-0a94b68db103' AND game_phase = 'regular'
ORDER BY total_points DESC LIMIT 3

UNION ALL

SELECT 'Finals' as phase, player_name, total_points 
FROM tournament_leaders 
WHERE tournament_id = 'c2fa28fa-ec92-40b4-a0db-0a94b68db103' AND game_phase = 'finals'
ORDER BY total_points DESC LIMIT 3

UNION ALL

SELECT 'All Games' as phase, player_name, total_points 
FROM tournament_leaders 
WHERE tournament_id = 'c2fa28fa-ec92-40b4-a0db-0a94b68db103' AND game_phase = 'all'
ORDER BY total_points DESC LIMIT 3;

-- ============================================================================
-- SECTION 4: OPTIONAL - RUN FOR ALL TOURNAMENTS
-- ============================================================================

-- Uncomment to run for ALL tournaments with completed games:
/*
DO $$
DECLARE
    t_record RECORD;
    result RECORD;
BEGIN
    FOR t_record IN 
        SELECT DISTINCT tournament_id 
        FROM games 
        WHERE status = 'completed'
    LOOP
        RAISE NOTICE 'Processing tournament: %', t_record.tournament_id;
        FOR result IN SELECT * FROM recompute_tournament_leaders(t_record.tournament_id) LOOP
            RAISE NOTICE '  % phase: % players', result.phase, result.players_inserted;
        END LOOP;
    END LOOP;
END $$;
*/

-- ============================================================================
-- SECTION 5: CLEANUP (if needed)
-- ============================================================================

-- To drop the function (only if you need to remove it):
-- DROP FUNCTION IF EXISTS recompute_tournament_leaders(UUID);

