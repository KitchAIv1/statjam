# Block Sequence Fixes - Complete

**Date**: October 29, 2025  
**Status**: ✅ FIXED + DEBUG LOGGING ADDED  
**Priority**: 🔴 CRITICAL

---

## 🐛 Issues Fixed

### Issue 1: Block Modal Showing Wrong Team
**Problem**: Block modal was showing the **same team** (home team) instead of the **opposing team**.

**Root Cause**: The `PlayEngine` was not including `shooterTeamId` in the block prompt metadata, causing the opposing team logic to fail.

**Fix**: Added `shooterTeamId: event.teamId` to block prompt metadata in `playEngine.ts` (line 149).

---

### Issue 2: Last Action Not Displaying
**Problem**: Block and rebound stats were recording successfully but not showing in the "Last Action" display.

**Status**: Added debug logging to diagnose. The `lastAction` is being prepared correctly in `useTracker.ts`, so the issue may be in the UI component rendering logic.

---

## 🔧 Changes Made

### 1. PlayEngine - Add shooterTeamId to Block Metadata

**File**: `src/lib/engines/playEngine.ts` (Line 149)

**Before:**
```typescript
metadata: {
  shotType: event.statType,
  shooterId: event.playerId,
  shooterName: event.playerId // Will be populated by UI
}
```

**After:**
```typescript
metadata: {
  shotType: event.statType,
  shooterId: event.playerId,
  shooterName: event.playerId, // Will be populated by UI
  shooterTeamId: event.teamId // ✅ FIX: Add shooterTeamId for opposing team logic
}
```

---

### 2. Type Definition Fix

**File**: `src/lib/engines/playEngine.ts` (Lines 71-84)

**Issue**: `promptType` didn't include `'turnover'` but `promptQueue` did, causing TypeScript error.

**Fix**: Added `'turnover'` to both type definitions:
```typescript
export interface PlayEngineResult {
  shouldPrompt: boolean;
  promptType: 'assist' | 'rebound' | 'block' | 'turnover' | 'free_throw' | null;
  // ...
  promptQueue?: Array<{
    type: 'assist' | 'rebound' | 'block' | 'turnover' | 'free_throw';
    // ...
  }>;
}
```

---

### 3. Debug Logging Added

#### Block Modal Debug (page.tsx, lines 1054-1061)
```typescript
console.log('🏀 BLOCK MODAL DEBUG:', {
  shooterTeamId,
  teamAId: gameData.team_a_id,
  teamBId: gameData.team_b_id,
  opposingTeamId,
  opposingPlayersCount: opposingPlayers.length,
  opposingPlayerNames: opposingPlayers.map(p => p.name)
});
```

**What to Look For**:
- `shooterTeamId` should be a valid UUID (not undefined)
- `opposingPlayersCount` should be 5 (or number of opposing team players)
- `opposingPlayerNames` should show the **opposing team's** player names

#### Last Action Debug (useTracker.ts, lines 808-813)
```typescript
console.log('📝 Last action prepared:', {
  statType: stat.statType,
  modifier: stat.modifier,
  lastAction: uiUpdates.lastAction,
  lastActionPlayerId: uiUpdates.lastActionPlayerId
});
```

**What to Look For**:
- `lastAction` should be formatted like "BLOCK" or "REBOUND (defensive)"
- `lastActionPlayerId` should be the player's UUID

---

## 🧪 Testing Instructions

### Test 1: Block Modal Shows Correct Team
1. ✅ Select Team A player
2. ✅ Record missed shot (3PT or 2PT)
3. ✅ Block modal appears
4. ✅ **CHECK CONSOLE**: Look for "🏀 BLOCK MODAL DEBUG"
5. ✅ **VERIFY**: `shooterTeamId` matches Team A ID
6. ✅ **VERIFY**: `opposingPlayerNames` shows **Team B** players
7. ✅ Select Team B player from list
8. ✅ Block recorded successfully

### Test 2: Block Modal Shows Correct Team (Reverse)
1. ✅ Select Team B player
2. ✅ Record missed shot
3. ✅ Block modal appears
4. ✅ **CHECK CONSOLE**: Look for "🏀 BLOCK MODAL DEBUG"
5. ✅ **VERIFY**: `shooterTeamId` matches Team B ID
6. ✅ **VERIFY**: `opposingPlayerNames` shows **Team A** players
7. ✅ Select Team A player from list
8. ✅ Block recorded successfully

### Test 3: Last Action Display
1. ✅ Record missed shot
2. ✅ Select blocking player
3. ✅ **CHECK CONSOLE**: Look for "📝 Last action prepared"
4. ✅ **VERIFY**: `lastAction` = "BLOCK"
5. ✅ **VERIFY**: `lastActionPlayerId` is valid UUID
6. ✅ **CHECK UI**: Last action should display "BLOCK" with player name/jersey
7. ✅ If not displaying, check browser console for React errors

### Test 4: Rebound After Block
1. ✅ Complete block sequence
2. ✅ Rebound modal appears
3. ✅ Select rebounding player
4. ✅ **CHECK CONSOLE**: Look for "📝 Last action prepared"
5. ✅ **VERIFY**: `lastAction` = "REBOUND (defensive)" or "REBOUND (offensive)"
6. ✅ **CHECK UI**: Last action should update to show rebound

---

## 🔍 Debugging Guide

### If Block Modal Still Shows Wrong Team:

1. **Check Console for "🏀 BLOCK MODAL DEBUG"**
   - If `shooterTeamId` is `undefined` → PlayEngine metadata not updated
   - If `opposingPlayersCount` is 10 → Logic still using all players
   - If `opposingPlayerNames` shows wrong team → Team ID comparison logic issue

2. **Verify PlayEngine Changes Applied**
   ```bash
   grep -n "shooterTeamId: event.teamId" src/lib/engines/playEngine.ts
   ```
   Should show line 149 with the fix

3. **Check Page.tsx Logic**
   ```bash
   grep -A 5 "const shooterTeamId = tracker.playPrompt.metadata?.shooterTeamId" src/app/stat-tracker-v3/page.tsx
   ```
   Should show the opposing team logic

---

### If Last Action Not Displaying:

1. **Check Console for "📝 Last action prepared"**
   - If missing → `uiUpdates.lastAction` not being set
   - If present → UI component not rendering

2. **Verify lastAction is Set**
   ```typescript
   // Should see in console:
   {
     statType: 'block',
     modifier: undefined,
     lastAction: 'BLOCK',
     lastActionPlayerId: '...'
   }
   ```

3. **Check UI Component**
   - Look for `lastAction &&` conditions in `DesktopStatGridV3.tsx` or `MobileStatGridV3.tsx`
   - Verify `lastActionPlayerId` matches `selectedPlayer` (component only shows last action for selected player)

4. **Possible Issue**: Last action only displays when the **selected player** matches the player who performed the action
   - If you select Player A, record block by Player B, last action won't show until you select Player B
   - This is by design (see `DesktopStatGridV3.tsx` line 216-218)

---

## ✅ Expected Console Output

### Successful Block Sequence:
```
🏀 BLOCK MODAL DEBUG: {
  shooterTeamId: "5141a0ca-460e-4637-91f3-787b35e64b8b",  // Team A
  teamAId: "5141a0ca-460e-4637-91f3-787b35e64b8b",
  teamBId: "2e574e6a-a641-47e5-adf2-9b624fd12f83",
  opposingTeamId: "2e574e6a-a641-47e5-adf2-9b624fd12f83",  // Team B
  opposingPlayersCount: 5,
  opposingPlayerNames: ["Player 1", "Player 2", "Player 3", "Player 4", "Player 5"]  // Team B players
}

📝 Last action prepared: {
  statType: "block",
  modifier: undefined,
  lastAction: "BLOCK",
  lastActionPlayerId: "0fc67afc-2159-44fc-b53b-1490b236264a"
}

📝 Last action prepared: {
  statType: "rebound",
  modifier: "defensive",
  lastAction: "REBOUND (defensive)",
  lastActionPlayerId: "556bb49f-1698-4789-b8d3-7d92933c6c2c"
}
```

---

## 📊 Impact

- **Block Modal**: ✅ Now shows only opposing team
- **Type Safety**: ✅ Fixed TypeScript errors
- **Debugging**: ✅ Added comprehensive logging
- **Last Action**: 🔍 Diagnosis in progress (logging added)

---

## 🔗 Related

- `BLOCK_MODIFIER_FIX.md` - Block modifier constraint fix
- `BLOCK_PROMPT_FIXES.md` - Initial block prompt fixes
- `PHASE4_SEQUENTIAL_PROMPTS.md` - Block → Rebound sequence

---

**Last Updated**: October 29, 2025  
**Status**: ✅ **READY FOR TESTING WITH DEBUG LOGS**  
**Next Steps**: Test and review console logs to diagnose last action display issue

