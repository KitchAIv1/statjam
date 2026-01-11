-- =====================================================
-- AUDIT DATABASE INDEXES - StatJam
-- Run in Supabase SQL Editor
-- =====================================================

-- 1. LIST ALL EXISTING INDEXES
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 2. CRITICAL TABLES - CHECK FOREIGN KEY INDEXES
-- These are the most important for query performance

-- game_stats (most queried table)
SELECT 'game_stats' as table_name, indexname, indexdef 
FROM pg_indexes WHERE tablename = 'game_stats';

-- game_substitutions
SELECT 'game_substitutions' as table_name, indexname, indexdef 
FROM pg_indexes WHERE tablename = 'game_substitutions';

-- games
SELECT 'games' as table_name, indexname, indexdef 
FROM pg_indexes WHERE tablename = 'games';

-- teams
SELECT 'teams' as table_name, indexname, indexdef 
FROM pg_indexes WHERE tablename = 'teams';

-- team_players
SELECT 'team_players' as table_name, indexname, indexdef 
FROM pg_indexes WHERE tablename = 'team_players';

-- generated_clips
SELECT 'generated_clips' as table_name, indexname, indexdef 
FROM pg_indexes WHERE tablename = 'generated_clips';

-- =====================================================
-- 3. RECOMMENDED INDEXES (check if these exist)
-- =====================================================

-- Check for game_stats indexes (CRITICAL for tracker performance)
SELECT 
    'game_stats.game_id' as recommended_index,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'game_stats' 
        AND indexdef LIKE '%game_id%'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

SELECT 
    'game_stats.player_id' as recommended_index,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'game_stats' 
        AND indexdef LIKE '%player_id%'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

SELECT 
    'game_stats.custom_player_id' as recommended_index,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'game_stats' 
        AND indexdef LIKE '%custom_player_id%'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

SELECT 
    'game_stats.team_id' as recommended_index,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'game_stats' 
        AND indexdef LIKE '%team_id%'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

SELECT 
    'game_stats.stat_type' as recommended_index,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'game_stats' 
        AND indexdef LIKE '%stat_type%'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check for game_substitutions indexes
SELECT 
    'game_substitutions.game_id' as recommended_index,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'game_substitutions' 
        AND indexdef LIKE '%game_id%'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check for games indexes
SELECT 
    'games.tournament_id' as recommended_index,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'games' 
        AND indexdef LIKE '%tournament_id%'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

SELECT 
    'games.team_a_id' as recommended_index,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'games' 
        AND indexdef LIKE '%team_a_id%'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

SELECT 
    'games.stat_admin_id' as recommended_index,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'games' 
        AND indexdef LIKE '%stat_admin_id%'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check for team_players indexes
SELECT 
    'team_players.team_id' as recommended_index,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'team_players' 
        AND indexdef LIKE '%team_id%'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

SELECT 
    'team_players.player_id' as recommended_index,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'team_players' 
        AND indexdef LIKE '%player_id%'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check for generated_clips indexes
SELECT 
    'generated_clips.game_id' as recommended_index,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'generated_clips' 
        AND indexdef LIKE '%game_id%'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

SELECT 
    'generated_clips.stat_event_id' as recommended_index,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'generated_clips' 
        AND indexdef LIKE '%stat_event_id%'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- =====================================================
-- 4. COMPOSITE INDEX CHECK (for common query patterns)
-- =====================================================

SELECT 
    'game_stats(game_id, team_id)' as composite_index,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'game_stats' 
        AND indexdef LIKE '%game_id%' 
        AND indexdef LIKE '%team_id%'
    ) THEN '✅ EXISTS' ELSE '⚠️ CONSIDER ADDING' END as status;

SELECT 
    'game_stats(game_id, is_opponent_stat)' as composite_index,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'game_stats' 
        AND indexdef LIKE '%game_id%' 
        AND indexdef LIKE '%is_opponent_stat%'
    ) THEN '✅ EXISTS' ELSE '⚠️ CONSIDER ADDING' END as status;

-- =====================================================
-- 5. CREATE MISSING INDEXES (COPY & RUN IF NEEDED)
-- =====================================================
/*
-- Uncomment and run if missing:

-- game_stats indexes
CREATE INDEX IF NOT EXISTS idx_game_stats_game_id ON game_stats(game_id);
CREATE INDEX IF NOT EXISTS idx_game_stats_team_id ON game_stats(team_id);
CREATE INDEX IF NOT EXISTS idx_game_stats_player_id ON game_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_game_stats_custom_player_id ON game_stats(custom_player_id);
CREATE INDEX IF NOT EXISTS idx_game_stats_stat_type ON game_stats(stat_type);
CREATE INDEX IF NOT EXISTS idx_game_stats_game_team ON game_stats(game_id, team_id);
CREATE INDEX IF NOT EXISTS idx_game_stats_game_opponent ON game_stats(game_id, is_opponent_stat);

-- game_substitutions indexes
CREATE INDEX IF NOT EXISTS idx_game_substitutions_game_id ON game_substitutions(game_id);

-- games indexes
CREATE INDEX IF NOT EXISTS idx_games_tournament_id ON games(tournament_id);
CREATE INDEX IF NOT EXISTS idx_games_team_a_id ON games(team_a_id);
CREATE INDEX IF NOT EXISTS idx_games_team_b_id ON games(team_b_id);
CREATE INDEX IF NOT EXISTS idx_games_stat_admin_id ON games(stat_admin_id);

-- team_players indexes
CREATE INDEX IF NOT EXISTS idx_team_players_team_id ON team_players(team_id);
CREATE INDEX IF NOT EXISTS idx_team_players_player_id ON team_players(player_id);

-- generated_clips indexes
CREATE INDEX IF NOT EXISTS idx_generated_clips_game_id ON generated_clips(game_id);
CREATE INDEX IF NOT EXISTS idx_generated_clips_stat_event_id ON generated_clips(stat_event_id);
*/

