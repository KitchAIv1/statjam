# Tournament Page Performance Optimizations

This document describes performance optimizations implemented on the public tournament page (tournament leaders, prefetch, and related data fetching).

---

## Optimization 1: Custom Players Batch Query (tournamentLeadersService.ts)

**Problem:** The `custom_players` table was queried individually per player in a loop — an N+1 pattern producing 93 individual queries for a tournament with 93 players.

**Fix:** Replaced `.map(id => query({ id: eq.${id} }))` pattern with a single batch query using PostgREST `in.()` filter. The same fix was applied to `users` (regular players) in the same function.

**Result:** N individual queries → 2 batch queries regardless of player count.

**File:** `src/lib/services/tournamentLeadersService.ts`

---

## Optimization 2: In-Flight Guard (useTournamentLeaders.ts)

**Problem:** Multiple hook instances mounting simultaneously (OverviewTab + LeadersTab + prefetch) all started fetching before any single one completed and set the cache — a race condition producing 8–10× duplicate full fetches on cold load.

**Fix:** Added `fetchingRef = useRef<Set<string>>` to track in-flight cache keys. If a fetch for a given key is already in progress, subsequent calls return early. The key is removed in a `finally` block on completion.

**Result:** Only one fetch per unique cache key runs at a time regardless of concurrent hook instances.

**File:** `src/hooks/useTournamentLeaders.ts`

---

## Optimization 3: Prefetch Delay (TournamentPageShell.tsx)

**Problem:** The leaders prefetch `useEffect` fired 4 phases × 5 categories = 20 parallel `getTournamentPlayerLeaders` calls simultaneously on page load, competing directly with the initial render's data needs and potentially triggering 1,320 individual `game_stats` queries.

**Fix:** Wrapped the prefetch block in a `setTimeout` of 3000ms with cleanup `return () => clearTimeout(timer)` so prefetching begins after the initial render has settled.

**Result:** Initial page load only fetches what's visible (e.g. points/all); remaining combinations warm quietly in the background.

**File:** `src/components/tournament/TournamentPageShell.tsx`

---

## PostgREST 1000-Row Limit Consideration

**Why `game_stats` is fetched per-game rather than batched:** Across many games (e.g. 66 games × ~60 rows), total rows can exceed the default PostgREST page size (e.g. 3918 rows across 66 games). A single batched `game_stats` query would exceed the default 1000-row limit without explicit range headers.

**Implication:** The `hybridSupabaseService.query` method has no built-in row limit override. Per-game queries for `game_stats` are intentional and should **not** be "optimized" into a single batch without first adding `Prefer: count=none` and range header support (e.g. `Range: 0-9999`) scoped to that specific query. See `useTournamentMatchups` and the hybrid service for the pattern of per-query optional headers when batching is introduced.
