# Player profile RESULT / finalScore — implementation plan

## Problem

Public player game log showed **`N/A 0-0`** (or wrong finals) while **PTS and other columns were correct**.

## Root cause (verified)

- **SQL (service role):** Team totals from `game_stats` match real scores; no orphan `team_id` pattern; **`games.home_score` / `away_score`** are **0** for most completed games.
- **Tournament Overview “Recent Matchups”** loads `game_stats` **per game** (avoids PostgREST **~1000 row default limit**).
- **`PlayerGameStatsService`** used **one** `.in('game_id', allIds)` on `game_stats` → response **truncated** when total rows across games exceeded the limit → team sums incomplete → **`0-0`** and **`N/A`**.

RLS was not the differentiator vs Overview (both use similar client access); **query shape** was.

## Goals

- Keep **batched** architecture (no N parallel per-game stat fetches from the player dashboard path).
- Match **scoring rules** used on public tournament Overview (`useTournamentMatchups`).
- Stay safe if chunk size or limits change.

## Implementation

1. **`lib/utils/teamScoresFromGameStats.ts`**
   - Pure helper: given rows for one game + `team_a_id` / `team_b_id`, compute **team A / team B** points.
   - Same rules as `useTournamentMatchups.calculateScoresFromBatchedStats`: `modifier === 'made'`, `stat_value`, `is_opponent_stat` → team B, else `team_id` vs A/B.
   - **`GAME_STATS_IN_CHUNK_GAME_COUNT = 6`**, **`POSTGREST_MAX_ROWS_PER_REQUEST = 1000`**.

2. **`PlayerGameStatsService.getPlayerGameStats`**
   - **Chunked** `.in('game_id', chunk)` **and** **range pagination** per chunk: `.order('id').range(0,999)`, then 1000–1999, until a page returns &lt;1000 rows.
   - Reason: a **single** response is still capped at ~1000 rows even inside a small game-id chunk (e.g. 6 heavy games → &gt;1000 stats). Without pagination, only the “first page” of stats counted → **mixed correct / `N/A 0-0` rows** in the game log.
   - Keep **`games` / `team_players` / `game_substitutions`** in existing `Promise.all` (only `game_stats` uses chunk + pagination).

3. **Cache bust**
   - **`player_game_stats:v3:`** / **`custom_player_game_stats:v3:`** after pagination fix.

## Testing (after deploy)

1. Open a **public player profile** that previously showed **`N/A 0-0`** with real PTS → **RESULT** should show **`W/L` + correct `finalScore`** (match tournament Overview for same `game_id`).
2. Spot-check **completed** game where DB scores are **0** — profile should still show correct margin from stats.
3. Player with **many games** (≥30) — ensure no regression; network tab should show **multiple** `game_stats` requests (chunk count), not one giant truncated response.

## References

- `src/hooks/useTournamentMatchups.ts` — Overview scoring + per-game fetch comment.
- `database/VERIFY_PLAYER_PROFILE_RESULT_COLUMN.sql` — SQL verification scripts.
