-- =====================================================
-- INDEX + TABLE STATS — paste full result sets for audit
-- Run in Supabase SQL Editor (postgres or service role).
-- =====================================================

-- ---------------------------------------------------------------------------
-- A) Hot tables: every index definition (what actually exists)
-- ---------------------------------------------------------------------------
SELECT
  pi.schemaname,
  pi.tablename,
  pi.indexname,
  pi.indexdef
FROM pg_indexes pi
WHERE pi.schemaname = 'public'
  AND pi.tablename = ANY (ARRAY[
    'games',
    'game_stats',
    'teams',
    'team_players',
    'custom_players',
    'users',
    'tournaments',
    'game_substitutions',
    'game_videos',
    'generated_clips'
  ])
ORDER BY pi.tablename, pi.indexname;

-- ---------------------------------------------------------------------------
-- B) Index usage since stats reset (find dead / rarely used indexes)
--     idx_scan = times planner chose this index
-- ---------------------------------------------------------------------------
SELECT
  sui.schemaname,
  sui.relname      AS table_name,
  sui.indexrelname AS index_name,
  sui.idx_scan,
  sui.idx_tup_read,
  sui.idx_tup_fetch
FROM pg_stat_user_indexes sui
WHERE sui.schemaname = 'public'
  AND sui.relname = ANY (ARRAY[
    'games',
    'game_stats',
    'teams',
    'team_players',
    'custom_players',
    'users',
    'tournaments',
    'game_substitutions',
    'game_videos',
    'generated_clips'
  ])
ORDER BY sui.relname, sui.indexrelname;

-- ---------------------------------------------------------------------------
-- C) Table size + live row estimate (scale context)
-- ---------------------------------------------------------------------------
SELECT
  c.relname AS table_name,
  c.reltuples::bigint AS estimated_rows,
  pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size,
  pg_size_pretty(pg_relation_size(c.oid)) AS table_only
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname = ANY (ARRAY[
    'games',
    'game_stats',
    'teams',
    'team_players',
    'custom_players',
    'users',
    'tournaments',
    'game_substitutions',
    'game_videos',
    'generated_clips'
  ])
ORDER BY pg_total_relation_size(c.oid) DESC;

-- ---------------------------------------------------------------------------
-- D) Quick check: do we already have the “performance audit” targets?
-- ---------------------------------------------------------------------------
SELECT 'idx_games_updated_at OR games.updated_at in indexdef' AS check_for,
  EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'games'
      AND (indexname = 'idx_games_updated_at' OR indexdef ~* 'updated_at')
  ) AS present;

SELECT 'idx_game_stats_game_id_created_at OR composite (game_id, created_at)' AS check_for,
  EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'game_stats'
      AND (
        indexname = 'idx_game_stats_game_id_created_at'
        OR (indexdef ~* 'game_id' AND indexdef ~* 'created_at')
      )
  ) AS present;

-- ---------------------------------------------------------------------------
-- E) OPTIONAL — all public indexes (long); comment out A–D if you only want this once
-- ---------------------------------------------------------------------------
-- SELECT schemaname, tablename, indexname, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- ORDER BY tablename, indexname;
