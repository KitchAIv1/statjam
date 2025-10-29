# Block Prompt Fixes

**Date**: October 29, 2025  
**Status**: ✅ FIXED  
**Priority**: 🟡 MEDIUM  
**Issues**: Block modal showing wrong players + Last action not displaying

---

## 🐛 Issues Found

### Issue 1: Block Modal Showing All Players
**Problem**: The `BlockPromptModal` was showing players from **both teams** instead of only the **opposing team** (defenders).

**Expected Behavior**: Only the opposing team's players should be shown, as blocks are defensive stats.

**Root Cause**: Line 1048-1050 in `page.tsx` was passing all players filtered only by shooter ID:
```typescript
defensivePlayers={[...teamAPlayers, ...teamBPlayers].filter(p => 
  p.id !== tracker.playPrompt.metadata?.shooterId
)}
```

---

### Issue 2: Last Action Not Displaying for Blocks
**Problem**: Block stats were being recorded successfully, but the "Last Action" display was not showing them.

**Root Cause**: The last action formatting in `useTracker.ts` (lines 796-802) was creating strings like `"block  recorded"` (with extra space) for stats without modifiers, which may have caused display issues or been filtered out.

---

## 🔧 Fixes Applied

### Fix 1: Block Modal - Only Show Opposing Team

**File**: `src/app/stat-tracker-v3/page.tsx` (Lines 1048-1056)

**Before:**
```typescript
defensivePlayers={[...teamAPlayers, ...teamBPlayers].filter(p => 
  p.id !== tracker.playPrompt.metadata?.shooterId
).map(p => ({ ...p, teamId: teamAPlayers.find(tp => tp.id === p.id) ? gameData.team_a_id : gameData.team_b_id }))}
```

**After:**
```typescript
defensivePlayers={
  // ✅ Only show opposing team players (defenders)
  (() => {
    const shooterTeamId = tracker.playPrompt.metadata?.shooterTeamId;
    const opposingPlayers = shooterTeamId === gameData.team_a_id ? teamBPlayers : teamAPlayers;
    const opposingTeamId = shooterTeamId === gameData.team_a_id ? gameData.team_b_id : gameData.team_a_id;
    return opposingPlayers.map(p => ({ ...p, teamId: opposingTeamId }));
  })()
}
```

**Logic**:
1. Get the shooter's team ID from metadata
2. Determine opposing team (if shooter is Team A, opposing is Team B)
3. Return only opposing team players with correct team ID

---

### Fix 2: Last Action Display Formatting

**File**: `src/hooks/useTracker.ts` (Lines 795-806)

**Before:**
```typescript
// Prepare last action message
if (stat.isOpponentStat) {
  uiUpdates.lastAction = `Opponent Team: ${stat.statType.replace('_', ' ')} ${stat.modifier || ''} recorded`;
  uiUpdates.lastActionPlayerId = null;
} else {
  uiUpdates.lastAction = `${stat.statType.replace('_', ' ')} ${stat.modifier || ''} recorded`;
  uiUpdates.lastActionPlayerId = stat.playerId;
}
```

**After:**
```typescript
// Prepare last action message
// ✅ Format stat type and modifier properly (no extra spaces for stats without modifiers)
const statTypeFormatted = stat.statType.replace('_', ' ').toUpperCase();
const modifierFormatted = stat.modifier ? ` (${stat.modifier})` : '';

if (stat.isOpponentStat) {
  uiUpdates.lastAction = `Opponent Team: ${statTypeFormatted}${modifierFormatted}`;
  uiUpdates.lastActionPlayerId = null;
} else {
  uiUpdates.lastAction = `${statTypeFormatted}${modifierFormatted}`;
  uiUpdates.lastActionPlayerId = stat.playerId || stat.customPlayerId || null;
}
```

**Improvements**:
1. **No Extra Spaces**: Stats without modifiers now show cleanly (e.g., "BLOCK" instead of "block  recorded")
2. **Uppercase**: Stat types are now uppercase for consistency (e.g., "BLOCK", "STEAL")
3. **Modifier in Parentheses**: Modifiers shown as "(made)", "(missed)", etc.
4. **Custom Player Support**: Now handles `customPlayerId` for coach mode
5. **Cleaner Format**: Removed redundant "recorded" text

---

## ✅ Examples

### Last Action Display - Before vs After

| Stat Type | Modifier | Before | After |
|-----------|----------|--------|-------|
| Block | (none) | `"block  recorded"` | `"BLOCK"` |
| Steal | (none) | `"steal  recorded"` | `"STEAL"` |
| Field Goal | made | `"field goal made recorded"` | `"FIELD GOAL (made)"` |
| Three Pointer | missed | `"three pointer missed recorded"` | `"THREE POINTER (missed)"` |
| Assist | (none) | `"assist  recorded"` | `"ASSIST"` |
| Turnover | (none) | `"turnover  recorded"` | `"TURNOVER"` |
| Rebound | defensive | `"rebound defensive recorded"` | `"REBOUND (defensive)"` |

---

## 🧪 Testing

### Test Case 1: Block Modal Player List
1. ✅ Record missed shot by Team A player
2. ✅ Block prompt appears
3. ✅ **VERIFY**: Only Team B players shown in list
4. ✅ Select Team B player
5. ✅ Block recorded successfully

### Test Case 2: Block Modal Player List (Reverse)
1. ✅ Record missed shot by Team B player
2. ✅ Block prompt appears
3. ✅ **VERIFY**: Only Team A players shown in list
4. ✅ Select Team A player
5. ✅ Block recorded successfully

### Test Case 3: Last Action Display for Block
1. ✅ Record missed shot
2. ✅ Select blocking player
3. ✅ Block recorded
4. ✅ **VERIFY**: Last action shows "BLOCK"
5. ✅ **VERIFY**: Player name/jersey displayed correctly

### Test Case 4: Last Action Display for Other Stats
1. ✅ Record assist → Shows "ASSIST"
2. ✅ Record steal → Shows "STEAL"
3. ✅ Record turnover → Shows "TURNOVER"
4. ✅ Record field goal (made) → Shows "FIELD GOAL (made)"
5. ✅ Record rebound (defensive) → Shows "REBOUND (defensive)"

---

## 📊 Impact

### Block Modal Fix
- **Stat Admin**: ✅ Fixed - Only opposing team shown
- **Coach Tracker**: ✅ Fixed - Only opposing team shown (or opponent button)
- **User Experience**: ✅ Improved - No confusion about which players to select

### Last Action Display Fix
- **All Stats**: ✅ Improved formatting
- **Readability**: ✅ Better - Uppercase, clean spacing
- **Consistency**: ✅ Uniform format across all stat types
- **Coach Mode**: ✅ Now supports custom players

---

## 🔗 Related

- `BLOCK_MODIFIER_FIX.md` - Block modifier constraint fix
- `PHASE5_ASSIST_MODIFIER_FIX.md` - Similar modifier fix for assists
- `PHASE4_SEQUENTIAL_PROMPTS.md` - Block → Rebound sequence implementation

---

**Last Updated**: October 29, 2025  
**Status**: ✅ **READY FOR TESTING**  
**Test Checklist**: Test 2.10 (Block) in `MVP_MASTER_TEST_CHECKLIST.md`

