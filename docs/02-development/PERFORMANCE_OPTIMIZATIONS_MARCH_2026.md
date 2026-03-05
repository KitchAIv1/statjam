# Performance Optimizations — March 2026

**Date**: March 2026  
**Status**: Completed  
**Purpose**: Single authoritative reference for the March 2026 performance work (index, RLS consolidation, refetch debounce).

---

## Overview

Three areas were optimized to reduce database load and RLS evaluation cost:

1. **Database index** — New composite index on `game_stats` for player-profile queries.
2. **RLS policy consolidation** — `game_stats` policies reduced from 20 to 17 (drop redundant, merge coach INSERT policies).
3. **Refetch cascade — Phase 1 debounce** — Two hooks that reacted immediately to Realtime now debounce at 300ms, clustering GETs and reducing N+1-style bursts.

Measured baseline before changes: authenticated `game_stats` queries 1,600–2,000ms average (vs 2–3ms for anon); 5–6 GETs within 300ms per stat write from independent hooks.

---

## Background — What The Audit Found

- **Authenticated game_stats query latency**: 1,600–2,000ms average (vs 2–3ms for anon). Root cause: RLS policy evaluation overhead — 20 policies, multiple subqueries per row.
- **Per-stat write cascade**: 5–6 GETs within 300ms from independent hooks each subscribing to `game_stats` (useGameOverlayData, useTeamRunAndMilestones, OrganizerLiveStream, useGameViewerV2, etc.). Each Realtime event triggered immediate fetches.
- **Missing composite index**: Queries filtering by `custom_player_id` with time ordering (`created_at DESC`) had no supporting index, slowing player profile and timeline queries.

---

## Changes Made

### 1. Database Index

**Index added:**

```sql
CREATE INDEX CONCURRENTLY idx_game_stats_custom_player_created
  ON game_stats(custom_player_id, created_at DESC);
```

**Purpose:** Speeds up player profile and timeline queries that filter by `custom_player_id` and order by `created_at DESC`.

**Applied:** March 2026 (Supabase, CONCURRENTLY).

---

### 2. RLS Policy Consolidation (20 → 17 policies)

**Dropped (redundant — fully covered by `game_stats_stat_admin_manage`):**

- **game_stats_stat_admin_insert** — INSERT-only policy; condition identical to `game_stats_stat_admin_manage` WITH CHECK. The ALL policy already allows INSERT for the same rows.
- **game_stats_custom_player_stat_admin_read** — SELECT for rows with `custom_player_id IS NOT NULL` where `games.stat_admin_id = auth.uid()`. Every such row is already allowed by `game_stats_stat_admin_manage` FOR ALL. Production data verification: 0 rows uncovered.

**Dropped and replaced (merged into one):**

- **game_stats_coach_opponent_insert** — INSERT where coach’s team is team_a and `is_opponent_stat = true`.
- **game_stats_coach_regular_player_insert** — INSERT where coach’s team is team_a and `is_opponent_stat = false` plus player/custom_player checks.

**Added:**

- **game_stats_coach_insert** — Single INSERT policy with combined WITH CHECK: same game/team EXISTS as before, and `(is_opponent_stat = true) OR (is_opponent_stat = false AND (player_id IS NOT NULL OR custom_player with coach check))`. Conditions are mutually exclusive; no new rows allowed. Virtual Opponent model keeps coach’s team as `team_a`, so the same subquery applies.

**Verification approach:** Production data queries run before applying: custom player coverage, demo games, coach game model, video contractor isolation. Post-migration policy count confirmed (17). Live smoke test: coach track, delete, opponent stat.

**Security:** Zero behavioral change. All roles verified against production data before applying.

---

### 3. Refetch Cascade — Phase 1 Debounce Fix

**File: `src/hooks/useTeamRunAndMilestones.ts`**

- **Change:** Added 300ms debounce to the Realtime `game_stats` handler (was immediate).
- **Before:** Stat write → immediate game_stats GET at T+0.
- **After:** Stat write → game_stats GET at T+300ms (clusters with useGameOverlayData’s existing 300ms debounce).

**File: `src/components/OrganizerLiveStream.tsx`**

- **Change:** Added 300ms debounce to the game_stats Realtime handler (was immediate).
- **Before:** Every stat write → immediate game_stats SELECT.
- **After:** Rapid stat writes coalesced into a single GET per 300ms window.

**Cascade timeline (simplified):**

| Time     | Before (example)                    | After (Phase 1)        |
|----------|-------------------------------------|-------------------------|
| T+0ms    | useTeamRunAndMilestones GET, OrganizerLiveStream GET, … | —                       |
| T+300ms  | useGameOverlayData GET, …           | Clustered GETs (e.g. overlay, run/milestones, organizer) |

Full cascade consolidation (shared data layer / single fetch, multiple consumers) is a future phase; this is Phase 1 debounce only.

---

## Verification Approach

- **pg_stat_statements:** Baseline of slow authenticated `game_stats` queries before changes.
- **RLS subquery index verification:** Confirmed supporting indexes exist for subqueries used in remaining policies.
- **Production data checks:** Custom player coverage (0 rows uncovered by dropping custom_player_stat_admin_read); demo games; coach game model (129 coach games); video contractor isolation.
- **Post-migration:** Policy count 17 confirmed on `game_stats`.
- **Live smoke test:** Coach track, delete, opponent stat flows exercised in production.

---

## What This Does NOT Fix (Future Work)

- **Full refetch cascade consolidation** — Shared data layer (Option A/B/C from audit): one fetch on Realtime, multiple consumers. Not in scope for March 2026.
- **Channel proliferation** — 17–19 channels per active game; consolidation would require architectural change.
- **Realtime WAL load** — Audit indicated ~73% of total DB time; would require channel consolidation and/or Realtime tuning.

---

## Reference

- **Migration:** DROP POLICY (and CREATE for `game_stats_coach_insert`) applied directly in Supabase, March 2026.
- **Index:** `CREATE INDEX CONCURRENTLY idx_game_stats_custom_player_created` applied March 2026.
- **Related docs:** [RLS_COMPLETE_DESIGN.md](../05-database/RLS_COMPLETE_DESIGN.md), [COACH_TRACKING_RLS_OPTIMIZATION.md](COACH_TRACKING_RLS_OPTIMIZATION.md), [SCALABILITY_AUDIT_REPORT.md](../01-project/SCALABILITY_AUDIT_REPORT.md).
