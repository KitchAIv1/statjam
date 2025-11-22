# Rebound Modal Timing Issue - Analysis & Fix

**Date**: November 21, 2025  
**Issue**: Rebound modal appears quickly and disappears before user can select player  
**Status**: 🔍 INVESTIGATED → ✅ FIXED

---

## Problem Description

After recording a missed shot in the block sequence (`BlockedShotSelectionModal`), the rebound modal appears but disappears immediately before the user can interact with it.

---

## Root Cause Analysis

### Current Flow (BROKEN)

```
1. BlockedShotSelectionModal.onSelect() called
   ↓
2. tracker.recordStat({ statType: shotType, modifier: 'missed' })
   ↓
3. Inside recordStat():
   ├─→ Database write (async)
   ├─→ PlayEngine.analyzeEvent() detects missed shot
   └─→ setPlayPrompt({ type: 'rebound', ... }) ✅ SETS REBOUND PROMPT
   ↓
4. recordStat() completes (await resolves)
   ↓
5. tracker.clearPlayPrompt() ❌ IMMEDIATELY CLEARS THE REBOUND PROMPT!
   ↓
6. Rebound modal disappears before user can interact
```

### The Race Condition

**Location**: `src/app/stat-tracker-v3/page.tsx` line 1343

```typescript
await tracker.recordStat({
  // ... missed shot data
});

// ❌ PROBLEM: This clears the rebound prompt that was just set inside recordStat()
tracker.clearPlayPrompt();
```

**What Happens**:
1. `recordStat()` executes PlayEngine analysis INSIDE its execution
2. PlayEngine sets rebound prompt via `setPlayPrompt()`
3. `recordStat()` completes (await resolves)
4. **IMMEDIATELY** after, `clearPlayPrompt()` is called
5. This clears the rebound prompt that was just set
6. Modal disappears before user can interact

---

## Solution

### Fix: Don't Clear Prompt After Recording Missed Shot

The PlayEngine automatically sets the rebound prompt when it detects a missed shot. We should NOT clear the prompt after recording - let the rebound prompt replace the `missed_shot_type` prompt automatically.

**Before (BROKEN)**:
```typescript
await tracker.recordStat({
  statType: shotType,
  modifier: 'missed'
});

tracker.clearPlayPrompt(); // ❌ Clears rebound prompt!
```

**After (FIXED)**:
```typescript
await tracker.recordStat({
  statType: shotType,
  modifier: 'missed'
  // No sequenceId - PlayEngine creates new sequence
});

// ✅ DON'T clear prompt - PlayEngine sets rebound prompt automatically
// The rebound prompt will replace the missed_shot_type prompt
```

### Why This Works

1. `recordStat()` detects missed shot via PlayEngine
2. PlayEngine sets rebound prompt (`setPlayPrompt({ type: 'rebound', ... })`)
3. React re-renders with new prompt type
4. `BlockedShotSelectionModal` closes (because `type !== 'missed_shot_type'`)
5. `ReboundPromptModal` opens (because `type === 'rebound'`)
6. User can interact with rebound modal ✅

---

## Implementation

### File: `src/app/stat-tracker-v3/page.tsx`

**Change**: Remove `tracker.clearPlayPrompt()` call after recording missed shot

```typescript
// ✅ BLOCK SEQUENCE: Record missed shot (this will trigger rebound prompt via PlayEngine)
await tracker.recordStat({
  gameId: gameData.id,
  playerId: isShooterCustom ? undefined : shooterId,
  customPlayerId: isShooterCustom ? shooterId : undefined,
  teamId: shooterTeamId,
  statType: shotType,
  modifier: 'missed'
  // ✅ Note: No sequenceId - PlayEngine will create new sequence for rebound prompt
});

// ✅ FIX: Don't clear prompt - PlayEngine sets rebound prompt automatically
// The rebound prompt will replace the missed_shot_type prompt via React re-render
```

---

## Testing

### Test Case 1: Block → Missed Shot → Rebound Sequence

**Steps**:
1. Record a block stat
2. `BlockedShotSelectionModal` appears ✅
3. Select shooter and shot type
4. Missed shot is recorded
5. `ReboundPromptModal` appears ✅
6. Modal stays open until user selects rebounder ✅
7. Rebound is recorded ✅

**Expected Result**: Rebound modal stays open and user can select rebounder

**Actual Result**: ✅ FIXED - Modal stays open

---

## Related Code

### PlayEngine Analysis (Inside recordStat)

**File**: `src/hooks/useTracker.ts` lines 1127-1192

```typescript
// PlayEngine detects missed shot
const playResult = PlayEngine.analyzeEvent(gameEvent, automationFlags.sequences);

if (playResult.shouldPrompt && playResult.promptType === 'rebound') {
  setPlayPrompt({
    isOpen: true,
    type: 'rebound',
    sequenceId: playResult.sequenceId,
    metadata: playResult.metadata
  });
}
```

### Modal Rendering Logic

**File**: `src/app/stat-tracker-v3/page.tsx` lines 1173-1243

```typescript
{/* Blocked Shot Selection Modal */}
{tracker.playPrompt.isOpen && tracker.playPrompt.type === 'missed_shot_type' && (
  <BlockedShotSelectionModal ... />
)}

{/* Rebound Prompt Modal */}
{tracker.playPrompt.isOpen && tracker.playPrompt.type === 'rebound' && (
  <ReboundPromptModal ... />
)}
```

**How It Works**:
- When `type` changes from `'missed_shot_type'` to `'rebound'`, React re-renders
- `BlockedShotSelectionModal` condition becomes false → closes
- `ReboundPromptModal` condition becomes true → opens
- No manual clearing needed ✅

---

## Conclusion

**Root Cause**: `clearPlayPrompt()` was called immediately after `recordStat()`, clearing the rebound prompt that PlayEngine had just set.

**Solution**: Remove `clearPlayPrompt()` call. Let PlayEngine set the rebound prompt, and React will handle the modal transition automatically.

**Status**: ✅ FIXED

---

**End of Analysis**

