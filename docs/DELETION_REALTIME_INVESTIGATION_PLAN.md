# Deletion Real-Time Investigation Plan

## ✅ RESOLVED - November 2024

**Status**: Issue has been resolved. Team Tabs now update deletions in real-time.

**Solution**: Modified subscription handlers in `useTeamStats.ts` and `useTeamStatsOptimized.ts` to refresh on `games` table UPDATE events, which signal trigger completion after stat deletions.

---

## Problem (Historical)
- ✅ Play-by-play feed updates deletions correctly in real-time
- ❌ Team Tabs do NOT update deletions in real-time (requires manual refresh) - **FIXED**
- ✅ Both use same deletion engine (`StatEditService.deleteStat()`)
- ✅ Both use same subscription system (`gameSubscriptionManager`)

## Investigation Steps

### Step 1: Verify Subscription Events Are Being Received

**What to check:**
- Are `games` table UPDATE events being received by team tabs?
- Are `game_stats` DELETE events being received?
- What is the exact payload structure?

**How to verify:**
1. Open browser DevTools → Console
2. Delete a foul stat
3. Look for these logs:
   - `🔔 useTeamStats: Real-time update received: games Object`
   - `🔔 useTeamStats: Real-time update received: game_stats Object`
   - `🔄 useTeamStats: Update detected, refreshing team data`

**Expected:**
- Should see BOTH `games` and `game_stats` events
- Should see refresh log for each event

**If missing:**
- Subscription not set up correctly
- Events not being broadcast
- Condition check failing

---

### Step 2: Verify `fetchTeamData` Is Executing

**What to check:**
- Is `fetchTeamData(true)` actually being called?
- Is it completing successfully?
- What data is being returned?

**How to verify:**
1. Look for these logs after deletion:
   - `🏀 useTeamStats: Fetching team data for game: ... team: ...`
   - `🚀 useTeamStats: Starting parallel data fetch...`
   - `✅ useTeamStats: Parallel fetch complete`
   - `✅ useTeamStats: Team data updated successfully`

**Expected:**
- Should see fetch logs immediately after event received
- Should see completion logs
- Should see updated team fouls in the returned data

**If missing:**
- `fetchTeamData` not being called (subscription handler issue)
- `fetchTeamData` failing silently
- State not updating

---

### Step 3: Check Timing of `games` Table Query

**What to check:**
- When does `TeamStatsService.aggregateTeamStats` query the `games` table?
- Is it querying BEFORE or AFTER the trigger completes?
- What team fouls value is returned?

**How to verify:**
1. Add detailed logging to `TeamStatsService.aggregateTeamStats`:
   ```typescript
   // Before games table query
   console.log('⏰ TeamStatsService: About to query games table for team fouls');
   
   // After games table query
   console.log('⏰ TeamStatsService: Games table query completed', {
     teamFouls,
     gameData: gameData[0]
   });
   ```

2. Delete a foul stat
3. Check timestamps:
   - When DELETE event received
   - When `games` table query executed
   - When trigger UPDATE event received

**Expected:**
- `games` table query should execute AFTER trigger completes
- Team fouls should be decremented

**If wrong:**
- Race condition: Query executing before trigger completes
- Need to add delay or wait for `games` UPDATE event

---

### Step 4: Check Multiple Hook Instances

**What to check:**
- Are multiple `useTeamStats` instances running?
- Are they conflicting with each other?
- Which instance is actually updating the UI?

**How to verify:**
1. Check game viewer page:
   - `teamAPrefetch` (prefetch instance)
   - `teamBPrefetch` (prefetch instance)
   - Actual tab instances (Team A tab, Team B tab)

2. Add instance identifier to logs:
   ```typescript
   console.log(`🔔 useTeamStats[${teamId}]: Real-time update received:`, table);
   ```

3. Check if all instances receive events
4. Check which instance's state is displayed in UI

**Expected:**
- All instances should receive events
- Only the active tab instance should update UI
- Prefetch instances shouldn't interfere

**If wrong:**
- Multiple instances causing conflicts
- Wrong instance updating UI
- Need to ensure only active tab subscribes

---

### Step 5: Compare with Working Play-by-Play Feed

**What to check:**
- What's different between play-by-play feed and team tabs?
- Why does one work and the other doesn't?

**Key Differences:**

| Aspect | Play-by-Play Feed | Team Tabs |
|--------|------------------|-----------|
| Hook | `useGameViewerV2` | `useTeamStats` |
| Data Fetch | `fetchGameData()` | `fetchTeamData()` |
| Service | Direct `game_stats` query | `TeamStatsService.aggregateTeamStats()` |
| Queries | Single query | Two queries (game_stats + games) |
| Team Fouls | Calculated from `game_stats` | Fetched from `games` table |
| Timing | No timing issues | Potential race condition |

**Critical Difference:**
- Play-by-play: Only queries `game_stats` (deleted stat is gone ✅)
- Team tabs: Queries `game_stats` AND `games` table separately
- The `games` table query might execute BEFORE trigger completes

---

## Most Likely Root Cause

**Timing/Race Condition in `TeamStatsService.aggregateTeamStats`:**

When a foul is deleted:
1. DELETE from `game_stats` → WebSocket fires DELETE event
2. Team tabs receive DELETE event → Call `fetchTeamData(true)`
3. `fetchTeamData` → Calls `TeamStatsService.aggregateTeamStats()`
4. `aggregateTeamStats` → Queries `game_stats` (deleted stat is gone ✅)
5. `aggregateTeamStats` → Queries `games` table for team fouls ⚠️
6. **PROBLEM**: Query #5 might execute BEFORE trigger completes
7. Database trigger → Updates `games.team_a_fouls` (AFTER query #5)
8. WebSocket fires `games` UPDATE event (AFTER query #5)

**Result:** Team tabs get stale team fouls because they queried `games` table too early.

---

## Proposed Solutions

### Solution 1: Wait for `games` Table UPDATE Event (Recommended)

Instead of querying `games` table immediately, wait for the UPDATE event:

```typescript
// In useTeamStats subscription handler
if (table === 'game_stats') {
  // For DELETE events, wait for games table UPDATE (trigger completion signal)
  const isDeleteEvent = payload?.old && !payload?.new;
  if (isDeleteEvent) {
    // Don't refresh immediately - wait for games table UPDATE
    console.log('⏳ useTeamStats: DELETE detected, waiting for games table UPDATE...');
    return; // Let games UPDATE handler refresh
  }
  // For INSERT events, refresh immediately
  void fetchTeamData(true);
}

if (table === 'games') {
  // This is the trigger completion signal - refresh now
  console.log('✅ useTeamStats: Games table UPDATE (trigger completed), refreshing...');
  void fetchTeamData(true);
}
```

**Pros:**
- Ensures trigger completes before refresh
- Uses trigger completion signal (`games` UPDATE)
- Simple and reliable

**Cons:**
- Requires DELETE detection logic

---

### Solution 2: Add Delay Before `games` Table Query

Add a small delay in `aggregateTeamStats` before querying `games` table:

```typescript
// In TeamStatsService.aggregateTeamStats
// ... aggregate game_stats first ...

// Add delay before games table query (for DELETE events)
await new Promise(resolve => setTimeout(resolve, 300));

// Now query games table
const gameData = await this.makeAuthenticatedRequest<any>('games', {
  'select': 'team_a_id,team_b_id,team_a_fouls,team_b_fouls',
  'id': `eq.${gameId}`
});
```

**Pros:**
- Simple fix
- Ensures trigger completes

**Cons:**
- Adds delay to all queries (not just DELETE)
- Not elegant

---

### Solution 3: Query `games` Table After `game_stats` Aggregation Completes

Restructure `aggregateTeamStats` to query `games` table last, with a small delay:

```typescript
// 1. Aggregate game_stats first
const stats = await this.makeRequest('game_stats', {...});

// 2. Process stats aggregation
// ... calculate field goals, etc ...

// 3. Small delay to ensure trigger completes (for DELETE events)
await new Promise(resolve => setTimeout(resolve, 200));

// 4. Query games table LAST (after trigger completes)
const gameData = await this.makeAuthenticatedRequest<any>('games', {...});
```

**Pros:**
- Ensures trigger completes before query
- Only adds delay for DELETE scenarios

**Cons:**
- Still adds delay

---

### Solution 4: Use `games` Table UPDATE Event as Refresh Signal (Best)

Modify subscription handler to ONLY refresh on `games` table UPDATE events (not `game_stats` DELETE):

```typescript
// Only refresh on games table updates (trigger completion signal)
if (table === 'games') {
  console.log('🔄 useTeamStats: Games table update - refreshing team data');
  void fetchTeamData(true);
}

// For game_stats INSERT events, refresh immediately
if (table === 'game_stats' && payload?.new) {
  console.log('🔄 useTeamStats: New stat added - refreshing team data');
  void fetchTeamData(true);
}

// For game_stats DELETE events, DON'T refresh - wait for games UPDATE
// (The games UPDATE event will trigger refresh after trigger completes)
```

**Pros:**
- Uses trigger completion signal
- No delays needed
- Most reliable

**Cons:**
- Requires understanding of event flow

---

## ✅ Solution Implemented

**Solution 4: Use `games` Table UPDATE Event as Refresh Signal**

**Implementation:**
- Modified `useTeamStats.ts` subscription handler to refresh immediately on `games` table UPDATE events
- Modified `useTeamStatsOptimized.ts` subscription handler to refresh immediately on `games` table UPDATE events
- Removed DELETE-specific handling and delays
- Simplified logic to match working play-by-play feed approach

**Key Changes:**
```typescript
// In useTeamStats.ts and useTeamStatsOptimized.ts
const unsubscribe = gameSubscriptionManager.subscribe(gameId, (table: string, payload: any) => {
  // ✅ CRITICAL: Always refresh on games table UPDATE (trigger completion signal)
  if (table === 'games') {
    void fetchTeamData(true);
    return;
  }
  
  // Refresh for stats/substitution INSERT events (new stats added)
  if (table === 'game_stats' || table === 'game_substitutions') {
    const isInsertEvent = payload?.new && !payload?.old;
    if (isInsertEvent) {
      void fetchTeamData(true);
    }
    // For DELETE events, don't refresh - wait for games UPDATE (trigger completion)
  }
});
```

**Files Modified:**
- `src/hooks/useTeamStats.ts`
- `src/hooks/useTeamStatsOptimized.ts`
- `src/hooks/useGameViewerV2.ts` (cleanup)
- `src/hooks/useTracker.ts` (cleanup)
- `src/lib/services/teamStatsService.ts` (cleanup)

**Testing:**
- ✅ Verified in local dev environment
- ✅ Team Tabs now update deletions in real-time
- ✅ Matches play-by-play feed behavior

---

## Debugging Checklist (Completed)

- [x] Verify subscription events are received (console logs)
- [x] Verify `fetchTeamData` is executing (console logs)
- [x] Check timing of `games` table query (add timestamps)
- [x] Compare team fouls before/after deletion
- [x] Check if multiple hook instances are interfering
- [x] Verify trigger is completing successfully (database logs)
- [x] Test with Solution 4 implementation

