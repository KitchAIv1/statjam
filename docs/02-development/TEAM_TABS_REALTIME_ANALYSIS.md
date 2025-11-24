# Team Tabs Real-Time Analysis - Score Section vs OVER Section

## 🔍 **Question**
Are the team tabs used in the Score section (when clicking on tabs) the same as the OVER team tabs where stats are real-time and WebSocket-based? Currently, the Score section requires a refresh to show the latest data.

---

## 📊 **Analysis Results**

### **Answer: NO, they are NOT the same**

The Score section and OVER section use **different components and hooks** with **different data fetching strategies**.

---

## 🎯 **Score Section (Tracker Interface)**

### **Component Chain:**
```
TopScoreboardV3 (click team name/score)
  ↓
TeamStatsModal
  ↓
TeamStatsTabLight
  ↓
useTeamStatsOptimized ❌ NO WebSocket subscriptions
```

### **Hook Used: `useTeamStatsOptimized`**
**Location:** `src/hooks/useTeamStatsOptimized.ts`

**Features:**
- ✅ Cache-first loading (prevents loading flash)
- ✅ Parallel data fetching (team stats + player stats)
- ✅ **WebSocket subscriptions** (added November 2024)
- ✅ **Real-time updates** via `gameSubscriptionManager`
- ✅ Automatically refreshes on `games`, `game_stats`, or `game_substitutions` changes
- ✅ Silent updates (no loading spinner on refresh)

**Code Evidence:**
```typescript
// useTeamStatsOptimized.ts - Lines 105-107
useEffect(() => {
  loadTeamStats(); // Only runs on mount
}, [loadTeamStats]);

// ❌ NO subscription setup - no real-time updates
```

---

## 🎯 **OVER Section (Game Viewer)**

### **Component Chain:**
```
GameViewerPage (team tabs)
  ↓
TeamStatsTab
  ↓
useTeamStats ✅ HAS WebSocket subscriptions
```

### **Hook Used: `useTeamStats`**
**Location:** `src/hooks/useTeamStats.ts`

**Features:**
- ✅ Parallel data fetching (team stats + player stats)
- ✅ **WebSocket subscriptions** (lines 133-151)
- ✅ **Real-time updates** via `gameSubscriptionManager`
- ✅ Automatically refreshes on `game_stats` or `game_substitutions` changes
- ✅ Silent updates (no loading spinner on refresh)

**Code Evidence:**
```typescript
// useTeamStats.ts - Lines 119-143
useEffect(() => {
  if (!gameId || !teamId) return;

  // ✅ REAL-TIME SUBSCRIPTION
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

  return unsubscribe;
}, [gameId, teamId, fetchTeamData]);
```

---

## 📋 **Comparison Table**

| Feature | Score Section (`useTeamStatsOptimized`) | OVER Section (`useTeamStats`) |
|---------|----------------------------------------|-------------------------------|
| **Component** | `TeamStatsTabLight` | `TeamStatsTab` |
| **Hook** | `useTeamStatsOptimized` | `useTeamStats` |
| **Cache-First** | ✅ Yes | ❌ No |
| **WebSocket Subscriptions** | ✅ **YES** (added Nov 2024) | ✅ **YES** |
| **Real-Time Updates** | ✅ **YES** (added Nov 2024) | ✅ **YES** |
| **Auto-Refresh** | ✅ **Automatic** (added Nov 2024) | ✅ Automatic |
| **Loading Flash Prevention** | ✅ Yes (cache-first) | ❌ No |
| **Use Case** | Edit Stats Modal, Scoreboard Modal | Live Game Viewer |

---

## ✅ **RESOLVED - November 2024**

**Status:** Issue has been resolved. Both Score section and OVER section team tabs now have real-time updates.

**Solution:** Added WebSocket subscriptions to `useTeamStatsOptimized` to match `useTeamStats` behavior. Both hooks now refresh on `games` table UPDATE events (trigger completion signal) and `game_stats`/`game_substitutions` INSERT events.

**Implementation:** Modified `useTeamStatsOptimized.ts` to include real-time subscription setup, matching the pattern used in `useTeamStats.ts`. Both hooks now handle deletions correctly by waiting for `games` table UPDATE events.

---

## ✅ **Solution Options**

### **Option 1: Add WebSocket Subscriptions to `useTeamStatsOptimized`** ⭐ RECOMMENDED
**Complexity:** LOW-MEDIUM  
**Safety:** SAFE

**Changes:**
- Add subscription setup similar to `useTeamStats`
- Keep cache-first loading for initial load
- Add real-time updates for subsequent changes
- Best of both worlds: fast initial load + real-time updates

**Pros:**
- ✅ Maintains cache-first loading (no flash)
- ✅ Adds real-time updates
- ✅ Minimal code changes
- ✅ Backward compatible

**Cons:**
- ⚠️ Slightly more complex hook logic

---

### **Option 2: Switch `TeamStatsTabLight` to Use `useTeamStats`**
**Complexity:** LOW  
**Safety:** MEDIUM

**Changes:**
- Replace `useTeamStatsOptimized` with `useTeamStats` in `TeamStatsTabLight`
- Remove cache-first behavior (may cause loading flash)

**Pros:**
- ✅ Simple change
- ✅ Real-time updates immediately

**Cons:**
- ❌ Loses cache-first loading (may cause loading flash)
- ❌ Different behavior from Edit Stats Modal

---

### **Option 3: Create Unified Hook**
**Complexity:** MEDIUM  
**Safety:** MEDIUM

**Changes:**
- Create new `useTeamStatsUnified` hook
- Supports both cache-first and real-time modes
- Replace both hooks with unified version

**Pros:**
- ✅ Single source of truth
- ✅ Configurable behavior

**Cons:**
- ⚠️ More refactoring required
- ⚠️ Risk of breaking existing functionality

---

## 🎯 **Recommendation**

**Option 1: Add WebSocket Subscriptions to `useTeamStatsOptimized`**

**Rationale:**
- Maintains existing cache-first behavior (no loading flash)
- Adds real-time updates (fixes the issue)
- Minimal code changes
- Safe and backward compatible
- Best user experience

**Implementation Steps:**
1. Add subscription setup to `useTeamStatsOptimized.ts` (similar to `useTeamStats.ts` lines 133-151)
2. Call `loadTeamStats(true)` on `game_stats` or `game_substitutions` updates
3. Ensure cache is invalidated/updated on real-time updates
4. Test that both initial load (cache-first) and real-time updates work correctly

---

## 📝 **Files to Modify**

1. **`src/hooks/useTeamStatsOptimized.ts`**
   - Add `useEffect` for WebSocket subscription setup
   - Import `gameSubscriptionManager`
   - Add subscription callback to refresh data on stats/substitution changes
   - Ensure cache is updated on real-time refresh

---

## ✅ **Expected Outcome**

After implementation:
- ✅ Score section team tabs update in real-time (no manual refresh needed)
- ✅ Cache-first loading still works (no loading flash)
- ✅ Consistent behavior with OVER section team tabs
- ✅ Better user experience

---

## 🧪 **Testing Checklist**

- [ ] Score section team tabs update automatically when stats change
- [ ] Score section team tabs update automatically when substitutions occur
- [ ] Initial load still uses cache (no loading flash)
- [ ] Real-time updates don't show loading spinner (silent updates)
- [ ] Edit Stats Modal still works correctly (cache-first behavior preserved)
- [ ] No console errors or performance issues

