# Score Revert Bug Audit - OrganizerLiveStream

## 🐛 Issue Description
**Symptom**: Scores revert to `0 - 0` after a few seconds of inactivity, then restore correctly when a new stat is tracked.

**Pattern**:
1. ✅ Stat tracking works → scores update correctly in real-time
2. ⏱️ After ~30 seconds of inactivity → scores revert to `0 - 0`
3. ✅ New stat tracked → scores restore correctly
4. 🔄 Cycle repeats

---

## 🔍 Root Cause Analysis

### Data Flow Map

```
┌─────────────────────────────────────────────────────────────┐
│ 1. INITIAL GAME SELECTION                                    │
└─────────────────────────────────────────────────────────────┘
   │
   ├─→ selectedGameId changes
   │
   ├─→ useEffect (line 361): Fetch game_stats
   │   └─→ setGameStats([...stats])
   │
   ├─→ useEffect (line 390): Calculate scores from stats
   │   └─→ setSelectedGame({ ...prev, home_score: X, away_score: Y })
   │
   └─→ useEffect (line 415): Subscribe to Realtime
       ├─→ Set selectedGame from games array (line 421-423) ⚠️ PROBLEM
       ├─→ Subscribe to game_stats changes
       └─→ Subscribe to games table changes
```

### The Problem: Race Condition & State Overwrites

#### Issue #1: Games Array Refresh Overwrites Scores
**Location**: Line 421-423
```typescript
// Set initial game data
const game = games.find(g => g.id === selectedGameId);
if (game) {
  setSelectedGame(game); // ⚠️ Overwrites calculated scores with 0-0!
}
```

**Why this happens**:
- `games` array is refreshed every 30 seconds (line 311)
- `games` array contains scores from `games.home_score || 0` (line 170-171)
- These scores are `0` because we don't calculate them in `mapGameToLiveGame()`
- When subscription useEffect re-runs (depends on `games` array), it resets `selectedGame` with 0 scores

#### Issue #2: Subscription useEffect Depends on `games` Array
**Location**: Line 497
```typescript
}, [selectedGameId, games]); // ⚠️ Re-runs when games array changes!
```

**Why this is bad**:
- `games` array refreshes every 30 seconds
- When `games` changes, subscription useEffect re-runs
- Re-running resets `selectedGame` from `games` array (line 421-423)
- This overwrites calculated scores with 0-0

#### Issue #3: Games Subscription Doesn't Preserve Scores
**Location**: Line 469-484
```typescript
setSelectedGame(prev => {
  if (!prev) return null;
  return {
    ...prev,
    // Clock and quarter
    quarter: payload.new.quarter || prev.quarter,
    // ... other fields
    // ⚠️ Scores are NOT updated, but prev scores might be lost if prev is null
  };
});
```

**Why this might cause issues**:
- If `prev` is somehow null or gets reset, scores are lost
- The spread operator `...prev` should preserve scores, but if `prev` was reset from `games` array, it has 0 scores

---

## 📊 State Management Flow

### Current Flow (BROKEN)
```
Time 0s:  Game selected
          ├─→ Fetch game_stats → setGameStats([stats])
          ├─→ Calculate scores → setSelectedGame({ scores: 10-8 })
          └─→ Subscribe → setSelectedGame({ scores: 0-0 }) ⚠️ OVERWRITES

Time 5s:  Stat tracked
          ├─→ game_stats Realtime → Refetch stats → setGameStats([...stats])
          ├─→ Calculate scores → setSelectedGame({ scores: 12-8 }) ✅

Time 30s: games array refreshes
          ├─→ setGames([...games]) (with 0 scores)
          ├─→ Subscription useEffect re-runs (depends on games)
          └─→ setSelectedGame({ scores: 0-0 }) ⚠️ OVERWRITES AGAIN

Time 35s: Stat tracked
          ├─→ game_stats Realtime → Refetch stats → setGameStats([...stats])
          └─→ Calculate scores → setSelectedGame({ scores: 14-8 }) ✅
```

### Expected Flow (FIXED)
```
Time 0s:  Game selected
          ├─→ Fetch game_stats → setGameStats([stats])
          ├─→ Calculate scores → setSelectedGame({ scores: 10-8 })
          └─→ Subscribe (ONCE, doesn't reset selectedGame)

Time 5s:  Stat tracked
          ├─→ game_stats Realtime → Refetch stats → setGameStats([...stats])
          └─→ Calculate scores → setSelectedGame({ scores: 12-8 }) ✅

Time 30s: games array refreshes
          ├─→ setGames([...games]) (with 0 scores)
          └─→ Subscription useEffect does NOT re-run (doesn't depend on games)

Time 35s: Stat tracked
          ├─→ game_stats Realtime → Refetch stats → setGameStats([...stats])
          └─→ Calculate scores → setSelectedGame({ scores: 14-8 }) ✅
```

---

## 🔧 Fix Strategy

### Fix #1: Remove `games` Dependency from Subscription
**Change**: Line 497
```typescript
// BEFORE
}, [selectedGameId, games]); // ⚠️ Re-runs when games changes

// AFTER
}, [selectedGameId]); // ✅ Only re-runs when game selection changes
```

### Fix #2: Only Set Initial Game Once
**Change**: Line 421-423
```typescript
// BEFORE
const game = games.find(g => g.id === selectedGameId);
if (game) {
  setSelectedGame(game); // ⚠️ Overwrites calculated scores
}

// AFTER
// Only set initial game if selectedGame is null (first time)
if (!selectedGame) {
  const game = games.find(g => g.id === selectedGameId);
  if (game) {
    setSelectedGame(game);
  }
}
```

### Fix #3: Preserve Scores in Games Subscription
**Change**: Line 469-484
```typescript
// BEFORE
setSelectedGame(prev => {
  if (!prev) return null;
  return {
    ...prev,
    // Scores not explicitly preserved
  };
});

// AFTER
setSelectedGame(prev => {
  if (!prev) return null;
  return {
    ...prev,
    // Explicitly preserve calculated scores
    home_score: prev.home_score, // ✅ Preserve calculated score
    away_score: prev.away_score, // ✅ Preserve calculated score
    // ... other fields
  };
});
```

---

## ✅ Recommended Solution

**Primary Fix**: Remove `games` from subscription dependency array
- Prevents subscription from re-running when games array refreshes
- Keeps calculated scores intact

**Secondary Fix**: Only set initial game if `selectedGame` is null
- Prevents overwriting calculated scores when subscription re-runs
- Only sets initial game data on first selection

**Tertiary Fix**: Explicitly preserve scores in games subscription
- Defense in depth - ensures scores are never lost
- Makes intent clear in code

---

## 🧪 Testing Checklist

After fix, verify:
- [ ] Scores persist after 30 seconds of inactivity
- [ ] Scores update correctly when stats are tracked
- [ ] Scores don't revert to 0-0
- [ ] Clock, quarter, fouls still update correctly
- [ ] Game selection still works
- [ ] No infinite loops or excessive re-renders

---

## 📝 Summary

**Root Cause**: Subscription useEffect depends on `games` array, causing it to re-run every 30 seconds and reset `selectedGame` with 0 scores from the `games` array.

**Fix**: Remove `games` from dependency array and only set initial game if `selectedGame` is null.

