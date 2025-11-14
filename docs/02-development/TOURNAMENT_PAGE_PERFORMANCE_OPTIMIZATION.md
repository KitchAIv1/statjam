# 🏟️ Tournament Page Performance Optimization

**Date:** November 14, 2025  
**Scope:** Public tournament profile (`TournamentPageShell`)  
**Status:** ✅ Shipped to `main`

---

## 🎯 Objective

Eliminate stutter and slow loads across the 10 public tournament tabs by:
- Reducing redundant Supabase queries (N+1 patterns)
- Adding cache-first data flows to prevent UI flashes
- Keeping UI components within `.cursorrules` limits while preserving separation of concerns

---

## 🧠 Architecture Summary

| Layer | Files | Purpose |
| --- | --- | --- |
| Hooks | `useScheduleData`, `useTournamentLeaders`, `useTournamentStandings`, `useTournamentTeams` | Cache-aware data loading with batching |
| Services | `TeamService.getBatchTeamInfo`, optimized `TournamentLeadersService` | Business logic + batched queries |
| Components | Updated `ScheduleTab`, `LeadersTab`, `StandingsTab`, `OverviewTab`, `LiveGamesTab`, `TeamsTab`, `PlayersTab` | UI-only, consume hooks |
| Utilities | `cache.ts` | Added cache keys for schedule, leaders, standings, teams |

All hooks stay < 100 lines, components < 200 lines, services handle business logic.

---

## ⚙️ Key Improvements

1. **Batch Team Fetching**
   - Added `TeamService.getBatchTeamInfo(teamIds[])`
   - Used by Schedule + Live tabs to collapse 41 queries → 2 queries

2. **Batched Leader Stats**
   - `TournamentLeadersService` issues a single `in.(...)` query for `game_stats`
   - Fallback loop handles edge cases gracefully

3. **Cache-First Hooks**
   - `useScheduleData`, `useTournamentLeaders`, `useTournamentStandings`, `useTournamentTeams`
   - Hooks check cache before toggling `loading` to prevent skeleton flashes

4. **Tab Synchronization**
   - `TournamentHero`, `TournamentPrimaryNav`, `TournamentPageShell` now share a single `activePhase`/`activeTab`
   - Scrollable tabs auto-scroll to the active trigger and support drag gestures on mobile

5. **UI Responsiveness**
   - `overflow-x-auto`, `scrollbar-hide`, and cursor states for horizontal tab strips
   - Adjusted spacing (`mb-3 sm:mb-4`, `mt-0`) to keep tabs visible on mobile

---

## 📊 Performance Snapshot

| Tab | Before | After | Notes |
| --- | --- | --- | --- |
| Schedule | 1 tournament query + 2 team queries per game | 1 tournament query + 1 batch team query | ~10x faster |
| Leaders | Tournament query + 1 `game_stats` query per game | Single batched `game_stats` query | ~20x faster, no infinite loops |
| Standings | Single pass, no cache | Cache-first hook | Instant reloads |
| Live Games | Per-game team lookups | Batch team info reuse | Stops repeated Supabase traffic |
| Teams | Immediate `loading=true` | Cache-first hook | Eliminates skeleton flash |
| Players | Same as Teams | Cache-first hook + memoized roster flattening | Seamless tab switching |

---

## 🧩 Hook Details

### `useScheduleData(tournamentId)`
- Fetches games, batches team info, caches result for 5 minutes.
- Returns `{ games, loading, error, refetch }`.

### `useTournamentLeaders(tournamentId, category, minGames)`
- Cache key includes category + min games.
- TTL: 2 minutes (leaders should stay fresh during live play).

### `useTournamentStandings(tournamentId)`
- Wraps `TournamentStandingsService` with cache-first loading.
- TTL: 3 minutes (standings update after completed games).

### `useTournamentTeams(tournamentId)`
- Prevents UI flicker by checking cache before toggling loading.
- TTL: 10 minutes (rosters change infrequently).

---

## 🔌 Service Updates

1. `TeamService.getBatchTeamInfo(teamIds: string[])`
   - Raw Supabase select using `in.(...)`.
   - Returns `Map<teamId, { id, name, logo }>` for O(1) lookups.

2. `TournamentLeadersService.getTournamentPlayerLeaders`
   - Batched `game_stats` query with fallback loop.
   - Added debug logs for monitoring query paths.

3. `cache.ts`
   - Added keys + TTLs for schedule, leaders, standings, teams.
   - Ensures consistent invalidation naming.

---

## ✅ Testing & QA Notes

1. **Navigation Assurance**
   - Switching `Upcoming`, `Live`, `Finals` chips instantly updates main tabs.
   - Horizontal scroll works with trackpad drag + touch gestures.

2. **Data Freshness**
   - `refetch(true)` bypasses cache for manual refresh flows.
   - Live tab logs confirm no infinite effect loops (`filteredGameIds` stabilized).

3. **Mobile Checks**
   - iPhone 14 + Chrome dev tools: tabs remain visible, `LIVE` button always clickable.
   - TAB bar never overlaps the right rail or card grid.

---

## 📌 Follow-Up Actions

1. **Cache Invalidation Hooks**
   - After roster edits or tournament seeding changes, call `cache.delete(CacheKeys.tournamentTeams(id))`.

2. **Potential Enhancements**
   - Prefetch `useTournamentTeams` when hitting Overview tab for even faster first loads.
   - Add metrics logging around cache hits/misses inside `cache.ts`.

3. **Docs & Onboarding**
   - Link this doc in future PRs touching tournament tabs.
   - Update PRD if new tabs or data sources are introduced.

---

**Maintainer:** Frontend Platform Team  
**Last Updated:** November 14, 2025  
**Related Commit:** `perf: optimize tournament tabs with batching, caching, and cache-first loading`
# 🏟️ Tournament Page Performance Optimization

**Date:** November 14, 2025  
**Scope:** Public tournament profile (TournamentPageShell)  
**Status:** ✅ Shipped to `main`

---

## 🎯 Objective

Eliminate the stutter and slow loads across the 10 public tournament tabs by:
- Reducing redundant Supabase queries (N+1 patterns)
- Adding cache-first data flows to prevent visual flashes
- Keeping UI components under `.cursorrules` limits while enforcing separation of concerns

---

## 🧠 Architecture Summary

| Layer | Files | Purpose |
| --- | --- | --- |
| Hooks | `useScheduleData`, `useTournamentLeaders`, `useTournamentStandings`, `useTournamentTeams` | Cache-aware data loading with batching |
| Services | `TeamService.getBatchTeamInfo`, optimized `TournamentLeadersService` | Business logic + batched queries |
| Components | Updated `ScheduleTab`, `LeadersTab`, `StandingsTab`, `OverviewTab`, `LiveGamesTab`, `TeamsTab`, `PlayersTab` | UI-only, consume hooks |
| Utilities | `cache.ts` | Added `tournamentSchedule`, `tournamentLeaders`, `tournamentStandings`, `tournamentTeams` keys + TTLs |

All new hooks stay < 100 lines, components stay < 200 lines, services handle all business logic per `.cursorrules`.

---

## ⚙️ Key Changes

1. **Batch Team Fetching**
   - Added `TeamService.getBatchTeamInfo(teamIds[])`
   - Used by Schedule + Live tabs to collapse 41 queries → 2 queries

2. **Batched Leader Stats**
   - `TournamentLeadersService` now issues a single `in.(...)` query for `game_stats`
   - Fallback gracefully retries per game if the batch call fails

3. **Cache-First Hooks**
   - `useScheduleData`, `useTournamentLeaders`, `useTournamentStandings`, `useTournamentTeams`
   - Hooks check cache before toggling `loading` to prevent skeleton flashes

4. **Tab Synchronization**
   - `TournamentHero`, `TournamentPrimaryNav`, and `TournamentPageShell` share a single `activePhase`/`activeTab` source of truth
   - Scrollable tabs auto-scroll to the active trigger and support drag gestures on mobile

5. **UI Responsiveness**
   - Added `overflow-x-auto`, `scrollbar-hide`, and cursor states for horizontal tab strips
   - Adjusted spacing (`mb-3 sm:mb-4`, `mt-0`) so tabs never collide with card stacks on mobile

---

## 📊 Performance Snapshot

| Tab | Before | After | Notes |
| --- | --- | --- | --- |
| Schedule | 1 tournament query + 2 team queries per game | 1 tournament query + 1 batch team query | ~10x faster, zero duplicate logo fetches |
| Leaders | Tournament query + 1 `game_stats` query per game | Single batched `game_stats` query | ~20x faster, prevents infinite loops |
| Standings | Single pass but no cache | Cache-first hook | Instant reloads, zero flashes |
| Live Games | Per-game team lookups inside loop | Batch team info reuse | Stops repeated Supabase traffic |
| Teams | Immediate `loading=true` even when cached | Cache-first hook | Eliminates 1-frame skeleton flash |
| Players | Same as Teams | Cache-first hook + memoized roster flattening | Seamless cross-tab back/forth |

---

## 🧩 Hook Details

### `useScheduleData(tournamentId)`
- Fetches games, batches team info, caches result for 5 minutes.
- Returns `{ games, loading, error, refetch }`.

### `useTournamentLeaders(tournamentId, category, minGames)`
- Cache key includes category + min games for accuracy.
- Default TTL: 2 minutes (leaders should stay fresh during live play).

### `useTournamentStandings(tournamentId)`
- Wraps existing `TournamentStandingsService`.
- Caches for 3 minutes; standings only change after completed games.

### `useTournamentTeams(tournamentId)`
- Prevents UI flicker by checking cache before toggling loading.
- TTL: 10 minutes (rosters change infrequently).

---

## 🔌 Service Updates

1. `TeamService.getBatchTeamInfo(teamIds: string[])`
   - Raw Supabase select using `in.(...)`.
   - Returns `Map<teamId, { id, name, logo }>` for O(1) lookups.

2. `TournamentLeadersService.getTournamentPlayerLeaders`
   - Batched `game_stats` query with fallback loop.
   - Added debug logs for monitoring query paths.

3. `cache.ts`
   - Added keys + TTLs for tournament schedule, leaders, standings, teams.
   - Ensures consistent invalidation naming.

---

## ✅ Testing & QA Notes

1. **Navigation Assurance**
   - Switch between `Upcoming`, `Live`, and `Finals` chips → correct tab surfaces instantly.
   - Horizontal scroll works with trackpad drag + touch gestures.

2. **Data Freshness**
   - Verified `refetch(true)` bypasses cache for manual refresh flows.
   - Live tab logs confirm no infinite effect loops (`filteredGameIds` stabilized).

3. **Mobile Checks**
   - iPhone 14 + Chrome dev tools: tabs remain visible, `LIVE` button always clickable.
   - TAB bar never overlaps the right rail or card grid.

---

## 📌 Follow-Up Actions

1. **Cache Invalidation Hooks**
   - After roster edits or tournament seeding changes, call `cache.delete(CacheKeys.tournamentTeams(id))`.

2. **Potential Enhancements**
   - Prefetch `useTournamentTeams` data when hitting Overview tab to make `Teams` / `Players` feel instant on first visit.
   - Add metrics logging around cache hits/misses to `cache.ts` for observability.

3. **Docs & Onboarding**
   - Point new contributors to this file when touching tournament tabs.
   - Update PRD if new tabs or data sources are introduced to keep parity.

---

**Maintainer:** Frontend Platform Team  
**Last Updated:** November 14, 2025  
**Related PR:** `perf: optimize tournament tabs with batching, caching, and cache-first loading`

