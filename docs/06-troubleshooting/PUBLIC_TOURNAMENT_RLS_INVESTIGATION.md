# 🔍 Public Tournament RLS Investigation

**Date**: January 13, 2026  
**Status**: 🟡 AWAITING DB MIGRATION  
**Priority**: CRITICAL - Money-making feature broken

---

## 📋 Problem Statement

The public tournament page (`/tournament/[id]`) which was working perfectly in November 2025 is now broken. Users see:

```
⚠️ TournamentLeadersService: Pre-computed table query failed, using fallback
❌ PlayerGameStatsService: Error fetching game_stats
⚠️ RLS may be filtering games. Missing game IDs
⚠️ TournamentStandingsService: No stats for game XXX, using DB scores (10/10 games!)
```

---

## 🔍 Root Cause Analysis

### Timeline of Changes

| Date | Commit | Change | Impact |
|------|--------|--------|--------|
| Nov 14, 2025 | `c12918a` | Tournament tabs optimization | ✅ Working |
| Nov 2025 | `354da76` | Fix player stats RLS for local dev | ✅ Working |
| Dec 17, 2025 | `11a5dd8` | Coach mode game viewer enhancements | ⚠️ Coach-specific |
| Jan 2026 | Coach RLS Optimization | Modified `game_stats` RLS policies | ❌ May have broken public |
| Jan 12, 2026 | `f339036` | Fix public game viewer (API route bypass) | ✅ Game viewer fixed |

### Services Affected

| Service | Uses API Route? | RLS Bypassed? | Status |
|---------|-----------------|---------------|--------|
| `useGameViewerV2.ts` | ✅ Yes | ✅ Yes | ✅ Fixed |
| `PlayerGameStatsService.ts` | ❌ No | ❌ No | ❌ Broken |
| `TournamentStandingsService.ts` | ❌ No | ❌ No | ❌ Broken |
| `TournamentLeadersService.ts` | ❌ No | ❌ No | ✅ Code bug fixed |

### The Issue

1. **Public tournament pages** run as **unauthenticated (anon)** users
2. `PlayerGameStatsService` queries `game_stats` directly via Supabase client
3. RLS policies we added for Coach mode are `TO authenticated` only
4. No `anon` role policies exist for public tournament access

---

## 📊 RLS Policy Audit Results

**Run Script**: `scripts/AUDIT_PUBLIC_TOURNAMENT_RLS.sql`  
**Audit Date**: January 13, 2026

### game_stats Table - THE PROBLEM ❌

| Policy Name | Operation | Roles | Access Type |
|-------------|-----------|-------|-------------|
| game_stats_admin_delete | DELETE | authenticated | 🔐 AUTH ONLY |
| game_stats_admin_update | UPDATE | authenticated | 🔐 AUTH ONLY |
| game_stats_coach_delete | DELETE | authenticated | 🔐 AUTH ONLY |
| game_stats_coach_opponent_insert | INSERT | authenticated | 🔐 AUTH ONLY |
| game_stats_coach_regular_player_insert | INSERT | authenticated | 🔐 AUTH ONLY |
| game_stats_coach_select | SELECT | authenticated | 🔐 AUTH ONLY |
| game_stats_coach_update | UPDATE | authenticated | 🔐 AUTH ONLY |
| game_stats_custom_player_coach_insert | INSERT | authenticated | 🔐 AUTH ONLY |
| game_stats_custom_player_coach_read | SELECT | authenticated | 🔐 AUTH ONLY |
| game_stats_custom_player_stat_admin_read | SELECT | authenticated | 🔐 AUTH ONLY |
| game_stats_organizer_read | SELECT | authenticated | 🔐 AUTH ONLY |
| game_stats_player_read_self | SELECT | authenticated | 🔐 AUTH ONLY |
| game_stats_stat_admin_insert | INSERT | authenticated | 🔐 AUTH ONLY |
| game_stats_stat_admin_manage | ALL | authenticated | 🔐 AUTH ONLY |
| game_stats_video_stat_admin_delete | DELETE | authenticated | 🔐 AUTH ONLY |
| game_stats_video_stat_admin_insert | INSERT | authenticated | 🔐 AUTH ONLY |
| game_stats_video_stat_admin_select | SELECT | authenticated | 🔐 AUTH ONLY |
| game_stats_video_stat_admin_update | UPDATE | authenticated | 🔐 AUTH ONLY |

**TOTAL: 18 policies, ZERO anon access** ❌

### games Table ✅

| Policy Name | Operation | Roles | Access Type |
|-------------|-----------|-------|-------------|
| games_select_policy | SELECT | anon,authenticated | ✅ ANON ACCESS |
| games_coach_public_view | SELECT | anon,authenticated | ✅ ANON ACCESS |

**ANON SELECT Policies**: 2 ✅

### tournaments Table ✅

| Policy Name | Operation | Roles | Access Type |
|-------------|-----------|-------|-------------|
| tournaments_public_read | SELECT | anon,authenticated | ✅ ANON ACCESS |

**ANON SELECT Policies**: 1 ✅

### teams Table ✅

| Policy Name | Operation | Roles | Access Type |
|-------------|-----------|-------|-------------|
| teams_public_read | SELECT | anon,authenticated | ✅ ANON ACCESS |
| teams_coach_game_public_view | SELECT | anon,authenticated | ✅ ANON ACCESS |
| teams_public_coach_view | SELECT | anon,authenticated | ✅ ANON ACCESS |

**ANON SELECT Policies**: 3 ✅

### Summary

| Table | Total Policies | ANON SELECT | Public Can Read? |
|-------|---------------|-------------|------------------|
| **game_stats** | **18** | **0** | ❌ **NO** |
| games | 10 | 2 | ✅ YES |
| tournaments | 3 | 1 | ✅ YES |
| teams | 10 | 3 | ✅ YES |
| users | 5 | 1 | ✅ YES |
| game_substitutions | 8 | 2 | ✅ YES |

---

## 🛠️ Solution: Add Missing RLS Policy

### Safety Verification ✅

**Query Run**:
```sql
SELECT COUNT(*) FROM games 
WHERE is_coach_game = true 
  AND tournament_id IN (SELECT id FROM tournaments WHERE is_public = true);
```

**Result**: `0` - No coach games linked to public tournaments

**Conclusion**: 100% safe to implement

### Migration File

**Path**: `docs/05-database/migrations/ADD_GAME_STATS_PUBLIC_READ.sql`

```sql
CREATE POLICY "game_stats_public_tournament_read" ON game_stats
  FOR SELECT 
  TO anon
  USING (
    EXISTS (
      SELECT 1 
      FROM games g
      JOIN tournaments t ON g.tournament_id = t.id
      WHERE g.id = game_stats.game_id 
        AND t.is_public = true
    )
  );
```

### Why This Is Safe

| Factor | Status |
|--------|--------|
| Read-only (SELECT only) | ✅ |
| Scoped to public tournaments | ✅ |
| Follows existing pattern (game_substitutions_public_read) | ✅ |
| Coach games protected (0 linked to public tournaments) | ✅ |
| No modification to existing policies | ✅ |
| PostgreSQL RLS is additive (OR logic) | ✅ |

---

## ✅ Fixes Applied

### 1. TournamentLeadersService Code Bug
- **Date**: January 13, 2026
- **File**: `src/lib/services/tournamentLeadersService.ts`
- **Issue**: `processedRows` variable undefined, should be `rows`
- **Fix**: Changed line 152 from `processedRows` to `rows`
- **Status**: ✅ FIXED - Leaders tab working

### 2. Public Game Viewer
- **Date**: January 12, 2026 (commit f339036)
- **File**: `src/hooks/useGameViewerV2.ts`
- **Issue**: Direct REST calls blocked by RLS for anon users
- **Fix**: Use `/api/game-viewer/[gameId]` route with service role
- **Status**: ✅ FIXED - Game viewer working

### 3. PlayerGameStatsService (PENDING)
- **Issue**: Direct Supabase queries blocked by RLS for anon users
- **Fix**: TBD based on audit results
- **Status**: ❌ PENDING

### 4. TournamentStandingsService (PENDING)
- **Issue**: Direct Supabase queries blocked by RLS for anon users
- **Fix**: TBD based on audit results
- **Status**: ❌ PENDING

---

## 📝 Documentation References

- `docs/02-development/TOURNAMENT_PAGE_PERFORMANCE_OPTIMIZATION.md` - Nov 2025 working state
- `docs/02-development/COACH_TRACKING_RLS_OPTIMIZATION.md` - Jan 2026 RLS changes
- `docs/05-database/RLS_POLICIES.md` - Historical RLS issues and fixes

---

## ⚠️ Key Differences: Coach vs Tournament

| Aspect | Coach Mode | Tournament Mode |
|--------|-----------|-----------------|
| User Role | `authenticated` | `anon` (public pages) |
| Player Type | `custom_player_id` | `player_id` |
| Access Check | `coach_id = auth.uid()` | `tournament.is_public = true` |
| RLS Pattern | Owner-based | Public-flag based |

**CRITICAL**: Coach and Tournament RLS policies should be **completely isolated** and not interfere with each other.

---

## 📋 Next Steps

1. [x] Create audit script (`AUDIT_PUBLIC_TOURNAMENT_RLS.sql`)
2. [x] Run audit in Supabase SQL Editor
3. [x] Document results in this file
4. [x] Verify safety (0 coach games in public tournaments)
5. [x] Create migration SQL (`ADD_GAME_STATS_PUBLIC_READ.sql`)
6. [ ] **BACKEND TEAM**: Apply migration in Supabase
7. [ ] Test public tournament page (stats should load)
8. [ ] Test public game viewer
9. [ ] Test coach features (no regression)

---

## 📁 Files Created/Modified

| File | Purpose |
|------|---------|
| `scripts/AUDIT_PUBLIC_TOURNAMENT_RLS.sql` | Audit script for RLS policies |
| `docs/05-database/migrations/ADD_GAME_STATS_PUBLIC_READ.sql` | Migration to add missing policy |
| `docs/06-troubleshooting/PUBLIC_TOURNAMENT_RLS_INVESTIGATION.md` | This investigation doc |
| `src/lib/services/tournamentLeadersService.ts` | Fixed `processedRows` bug |

---

**Last Updated**: January 13, 2026

