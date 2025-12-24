-- ============================================================================
-- GAME DUPLICATION SCRIPT
-- ============================================================================
-- Purpose: Duplicate game 38d7f2a4-ac51-4cf1-b3a9-72e8dcf3ec82 
--          to coach tyrone803@gmail.com's team "winslow still"
-- 
-- IMPORTANT: Run the verification section first before running the duplication!
-- ============================================================================

-- ============================================================================
-- STEP 1: VERIFICATION QUERIES (Run these first to confirm data)
-- ============================================================================

-- 1A: Verify the source game exists and get its details
SELECT 
    g.id AS game_id,
    g.tournament_id,
    g.status,
    g.start_time,
    g.home_score,
    g.away_score,
    g.is_coach_game,
    g.opponent_name,
    g.stat_admin_id,
    ta.name AS team_a_name,
    tb.name AS team_b_name,
    (SELECT COUNT(*) FROM game_stats WHERE game_id = g.id) AS stat_count,
    (SELECT COUNT(*) FROM game_substitutions WHERE game_id = g.id) AS substitution_count
FROM games g
LEFT JOIN teams ta ON g.team_a_id = ta.id
LEFT JOIN teams tb ON g.team_b_id = tb.id
WHERE g.id = '38d7f2a4-ac51-4cf1-b3a9-72e8dcf3ec82';

-- 1B: Find the target coach by email
SELECT 
    u.id AS user_id,
    u.email,
    u.name AS user_name,
    u.role
FROM users u
WHERE u.email = 'tyrone803@gmail.com';

-- 1C: Find the team named "winslow still" (case-insensitive) for this coach
SELECT 
    t.id AS team_id,
    t.name AS team_name,
    t.coach_id,
    t.tournament_id,
    t.is_official_team,
    t.created_at,
    u.email AS coach_email,
    (SELECT COUNT(*) FROM team_players WHERE team_id = t.id) AS player_count
FROM teams t
JOIN users u ON t.coach_id = u.id
WHERE u.email = 'tyrone803@gmail.com'
  AND LOWER(t.name) LIKE '%winslow%';

-- 1D: If above returns no rows, let's see ALL teams for this coach
SELECT 
    t.id AS team_id,
    t.name AS team_name,
    t.coach_id,
    t.created_at
FROM teams t
JOIN users u ON t.coach_id = u.id
WHERE u.email = 'tyrone803@gmail.com'
ORDER BY t.created_at DESC;

-- 1E: If coach not found, check if email exists with different case
SELECT 
    u.id AS user_id,
    u.email,
    u.name AS user_name,
    u.role
FROM users u
WHERE LOWER(u.email) LIKE '%wardterence%';

-- ============================================================================
-- STEP 2: DUPLICATION (Run after verification confirms correct data)
-- ============================================================================
-- This uses a transaction to ensure all-or-nothing execution

DO $$
DECLARE
    v_source_game_id UUID := '38d7f2a4-ac51-4cf1-b3a9-72e8dcf3ec82';
    v_coach_email TEXT := 'tyrone803@gmail.com';
    v_target_team_name TEXT := '%winslow%'; -- Case-insensitive partial match
    
    v_coach_id UUID;
    v_target_team_id UUID;
    v_target_tournament_id UUID;
    v_new_game_id UUID;
    
    v_source_game RECORD;
    v_stats_copied INT := 0;
    v_subs_copied INT := 0;
BEGIN
    -- ========================================
    -- VALIDATION: Find the coach
    -- ========================================
    SELECT id INTO v_coach_id
    FROM users
    WHERE email = v_coach_email;
    
    IF v_coach_id IS NULL THEN
        RAISE EXCEPTION 'Coach not found with email: %', v_coach_email;
    END IF;
    
    RAISE NOTICE '✅ Found coach: %', v_coach_id;
    
    -- ========================================
    -- VALIDATION: Find the target team
    -- ========================================
    SELECT t.id, t.tournament_id 
    INTO v_target_team_id, v_target_tournament_id
    FROM teams t
    WHERE t.coach_id = v_coach_id
      AND LOWER(t.name) LIKE v_target_team_name
    ORDER BY t.created_at DESC
    LIMIT 1;
    
    IF v_target_team_id IS NULL THEN
        RAISE EXCEPTION 'Team matching "winslow" not found for coach %', v_coach_email;
    END IF;
    
    RAISE NOTICE '✅ Found target team: %', v_target_team_id;
    
    -- ========================================
    -- VALIDATION: Get source game details
    -- ========================================
    SELECT * INTO v_source_game
    FROM games
    WHERE id = v_source_game_id;
    
    IF v_source_game IS NULL THEN
        RAISE EXCEPTION 'Source game not found: %', v_source_game_id;
    END IF;
    
    RAISE NOTICE '✅ Found source game: % (Status: %)', v_source_game_id, v_source_game.status;
    
    -- ========================================
    -- CREATE: Duplicate the game
    -- ========================================
    INSERT INTO games (
        tournament_id,
        team_a_id,
        team_b_id,
        stat_admin_id,
        status,
        start_time,
        end_time,
        venue,
        game_phase,
        quarter,
        quarter_length_minutes,
        game_clock_minutes,
        game_clock_seconds,
        is_clock_running,
        home_score,
        away_score,
        team_a_fouls,
        team_b_fouls,
        team_a_timeouts_remaining,
        team_b_timeouts_remaining,
        is_coach_game,
        opponent_name
    )
    VALUES (
        COALESCE(v_target_tournament_id, v_source_game.tournament_id), -- Use target team's tournament if exists
        v_target_team_id,  -- New team A is the target team
        v_source_game.team_b_id,  -- Keep original team B (opponent)
        v_coach_id,  -- New stat admin is the coach
        v_source_game.status,
        v_source_game.start_time,
        v_source_game.end_time,
        v_source_game.venue,
        v_source_game.game_phase,
        v_source_game.quarter,
        v_source_game.quarter_length_minutes,
        v_source_game.game_clock_minutes,
        v_source_game.game_clock_seconds,
        v_source_game.is_clock_running,
        v_source_game.home_score,
        v_source_game.away_score,
        v_source_game.team_a_fouls,
        v_source_game.team_b_fouls,
        v_source_game.team_a_timeouts_remaining,
        v_source_game.team_b_timeouts_remaining,
        COALESCE(v_source_game.is_coach_game, TRUE),  -- Mark as coach game
        v_source_game.opponent_name
    )
    RETURNING id INTO v_new_game_id;
    
    RAISE NOTICE '✅ Created new game: %', v_new_game_id;
    
    -- ========================================
    -- COPY: Game Stats
    -- ========================================
    INSERT INTO game_stats (
        game_id,
        player_id,
        custom_player_id,
        team_id,
        stat_type,
        stat_value,
        modifier,
        quarter,
        game_time_minutes,
        game_time_seconds,
        sequence_id
    )
    SELECT 
        v_new_game_id,  -- New game ID
        player_id,
        custom_player_id,
        CASE 
            WHEN team_id = v_source_game.team_a_id THEN v_target_team_id
            ELSE team_id
        END,  -- Remap team_a to target team
        stat_type,
        stat_value,
        modifier,
        quarter,
        game_time_minutes,
        game_time_seconds,
        sequence_id
    FROM game_stats
    WHERE game_id = v_source_game_id;
    
    GET DIAGNOSTICS v_stats_copied = ROW_COUNT;
    RAISE NOTICE '✅ Copied % game_stats records', v_stats_copied;
    
    -- ========================================
    -- COPY: Game Substitutions
    -- ========================================
    INSERT INTO game_substitutions (
        game_id,
        player_in_id,
        player_out_id,
        custom_player_in_id,
        custom_player_out_id,
        team_id,
        quarter,
        game_time_minutes,
        game_time_seconds
    )
    SELECT 
        v_new_game_id,  -- New game ID
        player_in_id,
        player_out_id,
        custom_player_in_id,
        custom_player_out_id,
        CASE 
            WHEN team_id = v_source_game.team_a_id THEN v_target_team_id
            ELSE team_id
        END,  -- Remap team_a to target team
        quarter,
        game_time_minutes,
        game_time_seconds
    FROM game_substitutions
    WHERE game_id = v_source_game_id;
    
    GET DIAGNOSTICS v_subs_copied = ROW_COUNT;
    RAISE NOTICE '✅ Copied % game_substitutions records', v_subs_copied;
    
    -- ========================================
    -- SUMMARY
    -- ========================================
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DUPLICATION COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Source Game ID: %', v_source_game_id;
    RAISE NOTICE 'New Game ID: %', v_new_game_id;
    RAISE NOTICE 'Target Team ID: %', v_target_team_id;
    RAISE NOTICE 'Coach ID: %', v_coach_id;
    RAISE NOTICE 'Stats Copied: %', v_stats_copied;
    RAISE NOTICE 'Substitutions Copied: %', v_subs_copied;
    RAISE NOTICE '========================================';
    
END $$;

-- ============================================================================
-- STEP 3: VERIFICATION AFTER DUPLICATION
-- ============================================================================
-- Run this after the duplication to verify the new game was created correctly

-- 3A: Find the newly created game
SELECT 
    g.id AS game_id,
    g.tournament_id,
    g.status,
    g.start_time,
    g.home_score,
    g.away_score,
    g.is_coach_game,
    g.stat_admin_id,
    ta.name AS team_a_name,
    tb.name AS team_b_name,
    u.email AS stat_admin_email,
    (SELECT COUNT(*) FROM game_stats WHERE game_id = g.id) AS stat_count,
    (SELECT COUNT(*) FROM game_substitutions WHERE game_id = g.id) AS substitution_count
FROM games g
LEFT JOIN teams ta ON g.team_a_id = ta.id
LEFT JOIN teams tb ON g.team_b_id = tb.id
LEFT JOIN users u ON g.stat_admin_id = u.id
WHERE g.stat_admin_id = (SELECT id FROM users WHERE email = 'tyrone803@gmail.com')
ORDER BY g.created_at DESC
LIMIT 5;

