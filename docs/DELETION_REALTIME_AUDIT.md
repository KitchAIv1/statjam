# Deletion Real-Time Update Audit

## ✅ RESOLVED - November 2024

**Status**: Issue has been resolved. Team Tabs now update deletions in real-time.

**Root Cause**: Team Tabs were not subscribing to `games` table UPDATE events, which signal trigger completion after stat deletions.

**Solution**: Modified `useTeamStats.ts` and `useTeamStatsOptimized.ts` to refresh immediately on `games` table UPDATE events, matching the working play-by-play feed approach.

---

## Problem Statement (Historical)
- ✅ Play-by-play feed updates deletions correctly in real-time
- ❌ Team Tabs do NOT update deletions in real-time (requires manual refresh) - **FIXED**

## Root Cause Analysis

### How Play-by-Play Feed Works (WORKING)
**File**: `useGameViewerV2.ts` (lines 660-698)

```typescript
const unsubscribe = gameSubscriptionManager.subscribe(gameId, (table: string, payload: any) => {
  // Handle custom player photo updates
  if (table === 'custom_players' && payload.new) {
    // ... photo update logic
  } else {
    // ✅ SIMPLE: For ANY update (games, game_stats, game_substitutions), refresh ALL data
    void fetchGameData(true);
  }
});
```

**Why it works:**
- No special DELETE handling
- No delays
- Just refreshes everything immediately for ANY update
- `fetchGameData` re-fetches ALL stats from database, so deletions are automatically reflected

---

### How Team Tabs Work (NOT WORKING)
**File**: `useTeamStats.ts` (lines 138-179)

```typescript
const unsubscribe = gameSubscriptionManager.subscribe(gameId, (table: string, payload: any) => {
  // ✅ CRITICAL FIX: Always refresh on games table updates
  const isGamesTable = table === 'games' || payload?.table === 'games';
  if (isGamesTable) {
    console.log('🔄 useTeamStats: Games table update detected...');
    void fetchTeamData(true);
    return; // Early return
  }
  
  // Refresh if it's a stats-related update
  if (table === 'game_stats' || table === 'game_substitutions') {
    const isDeleteEvent = hasOldWithoutNew || eventTypeIsDelete;
    const delay = isDeleteEvent ? 200 : 0; // 200ms delay for DELETE
    
    setTimeout(() => {
      void fetchTeamData(true);
    }, delay);
  }
});
```

**The Problem:**
1. When a foul is deleted:
   - DELETE event fires → goes to `game_stats` handler → waits 200ms → refreshes
   - `games` table UPDATE fires (trigger completed) → should go to `games` handler → refresh immediately
   
2. **BUT**: The logs show `games` table updates ARE received but the refresh log is NOT appearing
   - This means `isGamesTable` condition is NOT matching
   - Possible reasons:
     a. `table` parameter is not 'games' (maybe undefined or different value)
     b. `payload?.table` is not 'games' (maybe different field name)
     c. Code path is not being executed (maybe early return or exception)

---

## Data Flow Analysis

### When Foul is Deleted:

**Step 1**: DELETE from `game_stats` table
- WebSocket fires DELETE event
- Payload: `{ eventType: 'DELETE', old: {...}, table: 'game_stats' }`
- `useTeamStats` receives: `table='game_stats'`, `payload.eventType='DELETE'`
- Goes to `game_stats` handler → waits 200ms → calls `fetchTeamData(true)`

**Step 2**: Database trigger executes
- `update_game_scores_and_fouls_on_delete()` runs
- Updates `games.team_a_fouls` or `games.team_b_fouls`
- This happens AFTER the DELETE completes

**Step 3**: `games` table UPDATE event fires
- WebSocket fires UPDATE event
- Payload: `{ eventType: 'UPDATE', new: {...team_a_fouls: X...}, old: {...}, table: 'games' }`
- `useTeamStats` receives: `table='games'`, `payload.eventType='UPDATE'`
- Should go to `games` handler → refresh immediately

**Step 4**: `fetchTeamData` executes
- Calls `TeamStatsService.aggregateTeamStats(gameId, teamId)`
- This function:
  1. Aggregates stats from `game_stats` table (deleted stat is gone ✅)
  2. Fetches team fouls from `games` table (line 238-255)
  3. Returns team stats with updated foul count

---

## Bottleneck Identification

### Issue 1: Condition Not Matching
The `games` table UPDATE events are received but NOT triggering refresh. This suggests:
- The condition `isGamesTable` is evaluating to `false`
- Need to verify what `table` and `payload.table` actually contain

### Issue 2: Race Condition
Even if both handlers fire:
- DELETE handler: waits 200ms → refreshes
- `games` UPDATE handler: refreshes immediately
- Both might refresh, but the DELETE handler might refresh BEFORE trigger completes

### Issue 3: Data Fetching Bottleneck
`TeamStatsService.aggregateTeamStats` makes MULTIPLE HTTP requests:
1. Fetch all `game_stats` for team (aggregation)
2. Fetch `games` table for team fouls (separate request)

If the `games` table UPDATE handler fires but the DELETE handler's refresh is still pending, there could be a race condition where stale data is fetched.

---

## Solution Strategy

### Option 1: Simplify Like Play-by-Play Feed
Remove all special DELETE handling and delays. Just refresh immediately for ANY update:

```typescript
const unsubscribe = gameSubscriptionManager.subscribe(gameId, (table: string, payload: any) => {
  // Refresh for ANY update (games, game_stats, game_substitutions)
  if (table === 'games' || table === 'game_stats' || table === 'game_substitutions') {
    void fetchTeamData(true);
  }
});
```

**Pros**: Simple, works like play-by-play feed
**Cons**: Might cause extra refreshes

### Option 2: Fix Condition Matching
Add extensive logging to see why `games` table updates aren't matching:

```typescript
const unsubscribe = gameSubscriptionManager.subscribe(gameId, (table: string, payload: any) => {
  console.log('🔔 useTeamStats: Received update', {
    table,
    payloadTable: payload?.table,
    eventType: payload?.eventType,
    hasNew: !!payload?.new,
    hasOld: !!payload?.old
  });
  
  // More defensive check
  if (table === 'games' || payload?.table === 'games' || (payload?.new && payload?.old && !payload?.new.id)) {
    // Refresh
  }
});
```

### Option 3: Debounce Refreshes
Prevent multiple rapid refreshes:

```typescript
let refreshTimeout: NodeJS.Timeout | null = null;

const unsubscribe = gameSubscriptionManager.subscribe(gameId, (table: string, payload: any) => {
  // Clear any pending refresh
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
  }
  
  // Debounce refresh by 100ms
  refreshTimeout = setTimeout(() => {
    void fetchTeamData(true);
    refreshTimeout = null;
  }, 100);
});
```

---

## ✅ Solution Implemented

**Option 1 (Simplify)** - Matched the working play-by-play feed approach:

1. ✅ Removed all DELETE-specific handling
2. ✅ Removed delays
3. ✅ Refresh immediately on `games` table UPDATE events (trigger completion signal)
4. ✅ Let the database queries handle the correct state

**Implementation Details:**
- Modified `useTeamStats.ts` to refresh on `games` table UPDATE events
- Modified `useTeamStatsOptimized.ts` to refresh on `games` table UPDATE events
- Removed verbose debug logging
- Simplified subscription handler logic

**Files Changed:**
- `src/hooks/useTeamStats.ts`
- `src/hooks/useTeamStatsOptimized.ts`
- `src/hooks/useGameViewerV2.ts` (removed debug logs)
- `src/hooks/useTracker.ts` (removed debug logs)
- `src/lib/services/teamStatsService.ts` (removed verbose debug logs)

**Result**: Team Tabs now update deletions in real-time, matching the play-by-play feed behavior.

