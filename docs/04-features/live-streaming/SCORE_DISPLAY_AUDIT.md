# Score Display Audit - Live Stream Overlay vs Game Viewer

## 🔍 Issue Summary
**Problem**: Live Stream overlay shows scores as `0 - 0` while Game Viewer displays correct live scores.

**Status**: Quarter, team names, team fouls, and game clock are working correctly. Only scores are incorrect.

---

## 📊 Source of Truth Analysis

### 1. **Game Viewer (Play-by-Play Feed) - ✅ WORKING**

**Location**: `src/hooks/useGameViewerV2.ts`

**How It Gets Scores**:
- **Lines 681-703**: Calculates scores dynamically from `game_stats` table
- **Function**: `calculateScoresFromStats(gameStats, teamAId, teamBId)`
- **Logic**:
  ```typescript
  stats.forEach(stat => {
    if (stat.modifier === 'made') {
      const points = stat.stat_value || 0;
      if (statWithOpponent.is_opponent_stat) {
        awayScore += points; // Coach mode opponent
      } else if (stat.team_id === teamAId) {
        homeScore += points; // Team A
      } else if (stat.team_id === teamBId) {
        awayScore += points; // Team B
      }
    }
  });
  ```
- **Lines 718-719**: Uses calculated scores, NOT database columns:
  ```typescript
  home_score: calculatedScores.homeScore,  // ✅ Calculated from stats
  away_score: calculatedScores.awayScore // ✅ Calculated from stats
  ```

**Key Insight**: Game Viewer **DOES NOT** use `games.home_score` or `games.away_score` columns. It calculates from `game_stats` table.

---

### 2. **Live Stream Overlay (OrganizerLiveStream) - ❌ NOT WORKING**

**Location**: `src/components/OrganizerLiveStream.tsx`

**How It Gets Scores**:
- **Initial Fetch (Lines 170-171)**: Reads from `games` table:
  ```typescript
  home_score: game.home_score || 0,  // ❌ From games table
  away_score: game.away_score || 0   // ❌ From games table
  ```
- **Realtime Subscription (Lines 350-351)**: Updates from `games` table:
  ```typescript
  home_score: payload.new.home_score || 0,  // ❌ From games table
  away_score: payload.new.away_score || 0   // ❌ From games table
  ```

**Key Problem**: Live Stream overlay **TRUSTS** `games.home_score` and `games.away_score` columns, which may be:
- `0` if triggers haven't run
- `0` if triggers are broken
- `0` if scores were never initialized
- Out of sync with actual `game_stats`

---

## 🗄️ Database Schema Analysis

### Database Triggers (Should Update `games` Table)

**Migration Files Found**:
1. `004_backend_fixes_applied.sql` - Initial trigger (recalculates on INSERT/DELETE)
2. `020_optimize_trigger_lock_contention.sql` - Optimized incremental trigger (on UPDATE)
3. `019_optimize_score_triggers_incremental.sql` - Incremental updates

**Trigger Logic**:
- Updates `games.home_score` and `games.away_score` when `game_stats` are inserted/updated/deleted
- Uses incremental calculation (adds/subtracts points instead of recalculating)

**Potential Issues**:
1. Triggers may not be active in production
2. Triggers may have bugs (coach mode `is_opponent_stat` handling)
3. Triggers may not fire on initial stat insert
4. Race conditions between trigger execution and Realtime subscription

---

## 🔄 Data Flow Comparison

### Game Viewer Flow (✅ Correct)
```
game_stats INSERT/UPDATE
    ↓
useGameViewerV2 fetches ALL game_stats
    ↓
calculateScoresFromStats() iterates through stats
    ↓
Sums points where modifier = 'made'
    ↓
Displays calculated scores (always accurate)
```

### Live Stream Flow (❌ Incorrect)
```
game_stats INSERT/UPDATE
    ↓
Database trigger updates games.home_score/away_score
    ↓
Supabase Realtime sends games UPDATE event
    ↓
OrganizerLiveStream receives payload.new.home_score/away_score
    ↓
Displays scores from games table (may be 0 or stale)
```

---

## 🎯 Root Cause

**The Live Stream overlay is reading from the wrong source**:
- ✅ **Game Viewer**: Calculates from `game_stats` (source of truth)
- ❌ **Live Stream**: Reads from `games.home_score/away_score` (may be stale/0)

**Why `games` columns may be 0**:
1. Database triggers may not be active
2. Triggers may not handle coach mode (`is_opponent_stat`) correctly
3. Initial game creation may not initialize scores
4. Trigger execution may lag behind stat inserts

---

## ✅ Recommended Solution

**Match Game Viewer Pattern**: Calculate scores from `game_stats` instead of trusting `games` columns.

### Implementation Approach

1. **Fetch `game_stats` for selected game** (same as Game Viewer)
2. **Calculate scores using `calculateScoresFromStats()`** (same logic as Game Viewer)
3. **Subscribe to `game_stats` table changes** (not just `games` table)
4. **Recalculate scores on every stat INSERT/UPDATE/DELETE**

### Benefits
- ✅ Always accurate (matches Game Viewer)
- ✅ Works even if triggers are broken
- ✅ Handles coach mode correctly (`is_opponent_stat`)
- ✅ Single source of truth (`game_stats` table)

---

## 📋 Files to Modify (When Implementing)

1. **`src/components/OrganizerLiveStream.tsx`**
   - Add `game_stats` fetching in `fetchLiveGames()`
   - Add `calculateScoresFromStats()` function (copy from `useGameViewerV2.ts`)
   - Subscribe to `game_stats` Realtime changes
   - Calculate scores on stat changes

2. **No changes needed to**:
   - `src/hooks/useGameViewerV2.ts` (source of truth - working correctly)
   - Database triggers (can keep them, but don't rely on them for overlay)

---

## 🔍 Verification Checklist

Before implementing fix, verify:
- [ ] Are database triggers active? (Check Supabase dashboard)
- [ ] Do triggers handle coach mode (`is_opponent_stat`)?
- [ ] Are `games.home_score/away_score` columns being updated in production?
- [ ] Is there a race condition between trigger and Realtime?

---

## 📝 Summary

**Issue**: Live Stream overlay reads scores from `games` table columns, which may be 0 or stale.

**Solution**: Calculate scores from `game_stats` table (same as Game Viewer) instead of trusting `games` columns.

**Source of Truth**: `game_stats` table is the authoritative source for scores. The `games.home_score/away_score` columns are derived/denormalized data that may not always be accurate.

