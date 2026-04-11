-- Performance index: games ordered by recent activity (Supabase index advisor).
--
-- You already have game_stats timeline coverage: idx_game_stats_game_created (game_id, created_at).
-- Do not duplicate that composite.
--
-- Safe to re-run: IF NOT EXISTS.
-- For very large tables, prefer CREATE INDEX CONCURRENTLY as a single statement in the SQL editor.

CREATE INDEX IF NOT EXISTS idx_games_updated_at
  ON public.games (updated_at DESC);
