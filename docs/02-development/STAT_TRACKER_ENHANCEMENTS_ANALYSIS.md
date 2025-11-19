# Stat Tracker Enhancements - Analysis & Implementation Plan

**Date:** January 2025  
**Status:** 📋 ANALYSIS COMPLETE  
**Priority:** MEDIUM  
**Type:** Feature Add-Ons (Non-Breaking)

---

## 🎯 Overview

Three enhancement requests for the Stat Tracker V3:

1. **SUB Button Always Available** - Make substitution button always visible like edit stat button
2. **BLOCK Button Auto Sequence** - Reuse missed shot modal and rebound modal after manual BLOCK button click
3. **Turnover Tracking Enhancement** - Track "who turned the ball over" which becomes team turnover

---

## 📋 Requirement 1: SUB Button Always Available

### **Current State**

**Location**: `src/components/tracker-v3/DesktopStatGridV3.tsx` (line 170-178)  
**Location**: `src/components/tracker-v3/mobile/MobileStatGridV3.tsx` (line 151-159)

```typescript
{ 
  id: 'sub', 
  label: 'SUB', 
  icon: RotateCcw, 
  onClick: onSubstitution,
  variant: 'outline' as const,
  disabled: !onSubstitution,  // ❌ Currently disabled if handler not provided
  color: 'gray'
}
```

**Issue**: SUB button is disabled when `onSubstitution` is not provided, unlike the edit stat button which is always available.

### **Edit Stat Button Pattern** (Reference)

**Location**: `src/components/tracker-v3/DesktopStatGridV3.tsx` (line 286-292, 301-307)

```typescript
{/* ✅ Edit button always visible, even when no last action */}
<button
  onClick={() => setShowStatEditModal(true)}
  className="w-10 h-10 flex items-center justify-center rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 hover:scale-110 active:scale-95 transition-all duration-200"
  title="Edit Game Stats"
>
  <Edit className="w-5 h-5" />
</button>
```

**Key**: Edit button is always visible, no conditional disabling.

### **Proposed Solution**

**Complexity**: ⚡ **LOW** - Simple prop/state change

**Changes Required**:
1. Remove `disabled: !onSubstitution` from SUB button definition
2. Ensure `onSubstitution` handler is always provided (already handled in `page.tsx`)
3. Add null check in handler if needed (defensive programming)

**Files to Modify**:
- `src/components/tracker-v3/DesktopStatGridV3.tsx` (line 176)
- `src/components/tracker-v3/mobile/MobileStatGridV3.tsx` (line 157)

**Impact**: ✅ **ZERO** - No other components affected. SUB button will always be clickable.

---

## 📋 Requirement 2: BLOCK Button Auto Sequence

### **Current State**

**BLOCK Button Location**: `src/components/tracker-v3/DesktopStatGridV3.tsx` (line 140)

```typescript
{ id: 'blk', label: 'BLK', statType: 'block', modifier: undefined }
```

**Current Flow**:
1. User clicks BLOCK button manually
2. Block stat is recorded immediately
3. **No follow-up prompts** (missed shot modal, rebound modal)

**Auto Sequence Flow** (After Missed Shot):
1. User records missed shot (2PT/3PT)
2. `PlayEngine.analyzeEvent()` detects missed shot
3. **Rebound prompt modal appears** (block removed from auto-sequence)
4. User selects rebounder → rebound recorded

**Note**: Blocks were removed from auto-sequence after missed shots (see `MISSED_SHOT_SEQUENCE_MAP.md`), but can still be recorded manually.

### **Proposed Enhancement**

**Objective**: After clicking BLOCK button manually, trigger missed shot modal → rebound modal sequence.

**Complexity**: ⚡ **MEDIUM** - Requires PlayEngine integration

### **Analysis**

#### **Current PlayEngine Logic**

**File**: `src/lib/engines/playEngine.ts` (lines 140-178)

```typescript
// ✅ MISSED SHOT SEQUENCE: Rebound prompt (blocks removed from auto-sequence)
const isMissedShot = this.shouldPromptRebound(event) || this.shouldPromptBlock(event);

if (isMissedShot) {
  const sequenceId = uuidv4();
  const promptQueue = [];
  
  // Rebound prompt (required, appears immediately after missed shot)
  if (flags.promptRebounds && this.shouldPromptRebound(event)) {
    promptQueue.push({
      type: 'rebound',
      sequenceId: sequenceId,
      metadata: {
        shotType: event.statType,
        shooterId: this.getPlayerIdentifier(event),
        shooterTeamId: event.teamId
      }
    });
  }
  
  // Set result with queue
  if (promptQueue.length > 0) {
    result.shouldPrompt = true;
    result.promptType = promptQueue[0].type; // 'rebound'
    result.sequenceId = sequenceId;
    result.metadata = promptQueue[0].metadata;
    result.promptQueue = promptQueue;
  }
}
```

**Key Methods**:
- `shouldPromptRebound(event)` - Checks if event is a missed shot
- `shouldPromptBlock(event)` - Checks if event is a missed shot (for block detection)

#### **Proposed Flow**

```
1. User clicks BLOCK button manually
   ↓
2. Record block stat (as currently done)
   ↓
3. PlayEngine.analyzeEvent() with block event
   ↓
4. PlayEngine detects: "Block occurred → shot was missed"
   ↓
5. Trigger missed shot modal (ShotMadeMissedModal)
   ├─→ User selects shot type (2PT/3PT) and confirms missed
   └─→ Continue to rebound prompt
   ↓
6. Rebound prompt modal appears (ReboundPromptModal)
   ├─→ User selects rebounder → rebound recorded
   └─→ Sequence complete
```

### **Implementation Plan**

#### **Step 1: Modify Block Recording Handler**

**File**: `src/app/stat-tracker-v3/page.tsx` (around line 443)

**Current**:
```typescript
const handleStatRecord = async (statType: string, modifier?: string) => {
  // ... record stat immediately
  await tracker.recordStat({...});
};
```

**Proposed**:
```typescript
const handleStatRecord = async (statType: string, modifier?: string) => {
  // ... record stat
  await tracker.recordStat({...});
  
  // ✅ NEW: If block, trigger missed shot sequence
  if (statType === 'block') {
    // Trigger missed shot modal → rebound sequence
    // This will be handled by PlayEngine after block is recorded
  }
};
```

#### **Step 2: Extend PlayEngine for Block Events**

**File**: `src/lib/engines/playEngine.ts`

**Add new method**:
```typescript
/**
 * Analyze block event and determine if missed shot sequence should be triggered
 */
static analyzeBlockEvent(
  event: GameEvent,
  flags: PlaySequenceFlags
): PlayEngineResult {
  // Block occurred → shot was missed → prompt for shot type and rebound
  const sequenceId = uuidv4();
  const promptQueue: Array<{
    type: 'assist' | 'rebound' | 'block' | 'turnover';
    sequenceId: string;
    metadata: Record<string, any>;
  }> = [];
  
  // Step 1: Prompt for missed shot type (2PT or 3PT)
  // This will be handled by ShotMadeMissedModal
  
  // Step 2: Rebound prompt (required)
  if (flags.promptRebounds) {
    promptQueue.push({
      type: 'rebound',
      sequenceId: sequenceId,
      metadata: {
        shotType: 'unknown', // Will be determined by missed shot modal
        blockerId: this.getPlayerIdentifier(event),
        blockerTeamId: event.teamId
      }
    });
  }
  
  return {
    shouldPrompt: promptQueue.length > 0,
    promptType: 'missed_shot', // New prompt type
    sequenceId: sequenceId,
    metadata: {
      blockerId: this.getPlayerIdentifier(event),
      blockerTeamId: event.teamId
    },
    promptQueue: promptQueue,
    actions: ['Prompt missed shot type and rebound after block']
  };
}
```

#### **Step 3: Integrate Missed Shot Modal**

**File**: `src/app/stat-tracker-v3/page.tsx` (around line 120)

**Current**: `showShotMadeMissedModal` state exists but is only used for shot buttons.

**Proposed**: Trigger modal after block is recorded if automation is enabled.

#### **Step 4: Reuse Existing Modals**

**Modals to Reuse**:
1. `ShotMadeMissedModal` - Already exists, used for 2PT/3PT buttons
2. `ReboundPromptModal` - Already exists, used in auto-sequence

**Complexity Assessment**:
- ✅ **LOW-MEDIUM** - Reusing existing modals
- ✅ **No new components needed**
- ⚠️ **Requires PlayEngine extension**
- ⚠️ **Requires state management for block → missed shot → rebound flow**

### **Files to Modify**

1. `src/lib/engines/playEngine.ts` - Add `analyzeBlockEvent()` method
2. `src/app/stat-tracker-v3/page.tsx` - Integrate block → missed shot → rebound flow
3. `src/hooks/useTracker.ts` - Handle block event analysis (if needed)

**Impact**: ✅ **MINIMAL** - Only affects block button flow, no other components impacted.

---

## 📋 Requirement 3: STEAL → Turnover Modal Fix

### **Current State**

**Issue**: In regular mode (non-coach), when STEAL stat is clicked, turnover is auto-generated WITHOUT showing the TurnoverPromptModal.

**Steal Recording**: `src/components/tracker-v3/DesktopStatGridV3.tsx` (line 139)

```typescript
{ id: 'stl', label: 'STL', statType: 'steal', modifier: undefined }
```

**Current Flow (Regular Mode)**:
**File**: `src/hooks/useTracker.ts` (lines 1220-1243)

```typescript
// ✅ REGULAR MODE: Full auto-generation
const opponentTeamId = stat.teamId === teamAId ? teamBId : teamAId;

// Generate turnover event
const turnoverEvent = PlayEngine.generateTurnoverForSteal(
  gameEvent,
  opponentTeamId
);

// Record turnover immediately (no prompt needed) ❌ PROBLEM
setTimeout(async () => {
  await recordStat({
    statType: 'turnover',
    modifier: 'steal',
    // ... auto-generated without user input
  });
}, 100);
```

**Current Flow (Coach Mode)** - ✅ **CORRECT**:
**File**: `src/hooks/useTracker.ts` (lines 1197-1212)

```typescript
// ✅ COACH MODE: Show turnover prompt for opponent steals
if (isCoachMode) {
  if (stat.isOpponentStat) {
    // Opponent stole from home team
    // → Show turnover prompt to select which home player lost possession
    setPlayPrompt({
      isOpen: true,
      type: 'turnover',
      sequenceId: playResult.sequenceId || null,
      metadata: {
        stealerId: stat.playerId,
        stealerName: 'Opponent Team',
        stealerTeamId: stat.teamId,
        homeTeamId: teamAId
      }
    });
  }
}
```

**Turnover Prompt Modal**: `src/app/stat-tracker-v3/page.tsx` (lines 1222-1274)

```typescript
{tracker.playPrompt.isOpen && tracker.playPrompt.type === 'turnover' && (
  <TurnoverPromptModal
    onSelectPlayer={async (playerId) => {
      // Record turnover stat linked to the steal
      await tracker.recordStat({
        statType: 'turnover',
        modifier: 'steal',
        // ...
      });
    }}
    homePlayers={/* Players from opposite team */}
    stealerName={tracker.playPrompt.metadata?.stealerName || 'Unknown'}
  />
)}
```

### **Problem**

**Regular mode auto-generates turnover without user input**:
- ❌ No way to select "who turned the ball over"
- ❌ Team turnover tracking is inaccurate
- ❌ Inconsistent with coach mode behavior

### **Proposed Fix**

**Objective**: Make regular mode show TurnoverPromptModal (same as coach mode) so tracker can select "who turned the ball over".

**Complexity**: ⚡ **LOW** - Simple change to reuse existing modal

### **Analysis**

#### **Current Behavior**

1. **Coach Mode** (✅ Correct):
   - Steal recorded → TurnoverPromptModal appears → User selects player → Turnover recorded

2. **Regular Mode** (❌ Incorrect):
   - Steal recorded → Turnover auto-generated → No modal → No user input

#### **Proposed Behavior**

**Both Modes** (✅ Consistent):
```
1. User clicks STEAL button
   ↓
2. Steal stat recorded
   ↓
3. TurnoverPromptModal appears (ALWAYS)
   ├─→ Shows players from opposite team (who lost the ball)
   ├─→ Shows stealer's name
   └─→ User selects player who turned it over
   ↓
4. Turnover recorded with modifier 'steal'
   ├─→ Linked to steal via sequenceId
   └─→ Team turnover tracked correctly
```

### **Implementation Plan**

#### **Step 1: Fix Regular Mode Flow**

**File**: `src/hooks/useTracker.ts` (lines 1220-1243)

**Current**:
```typescript
} else {
  // ✅ REGULAR MODE: Full auto-generation
  const opponentTeamId = stat.teamId === teamAId ? teamBId : teamAId;
  const turnoverEvent = PlayEngine.generateTurnoverForSteal(...);
  // Auto-record turnover ❌
}
```

**Proposed**:
```typescript
} else {
  // ✅ REGULAR MODE: Show turnover prompt modal (same as coach mode)
  const stealerData = [...teamAPlayers, ...teamBPlayers].find(
    p => p.id === (stat.playerId || stat.customPlayerId)
  );
  const stealerName = stealerData?.name || 'Unknown';
  
  setPlayPrompt({
    isOpen: true,
    type: 'turnover',
    sequenceId: playResult.sequenceId || null,
    primaryEventId: null,
    metadata: {
      stealerId: stat.playerId || stat.customPlayerId,
      stealerName: stealerName,
      stealerTeamId: stat.teamId
    }
  });
}
```

#### **Step 2: Get Stealer Name**

**File**: `src/hooks/useTracker.ts`

**Need**: Access to `teamAPlayers` and `teamBPlayers` to get stealer's name.

**Options**:
1. Pass players as props to `useTracker` (already available via `initialGameData`)
2. Fetch player name from database
3. Use metadata from `playResult` (if available)

**Best Approach**: Use `playResult.metadata` which already has stealer info, or fetch from game data.

#### **Step 3: Verify Modal Integration**

**File**: `src/app/stat-tracker-v3/page.tsx` (lines 1222-1274)

**Current**: Modal already handles regular mode correctly.

**Verification**: Ensure `homePlayers` prop correctly shows opposite team players.

### **Files to Modify**

1. `src/hooks/useTracker.ts` (line 1220-1243) - Change regular mode to show modal instead of auto-generate
2. **No other files needed** - Modal already exists and works correctly

**Impact**: ✅ **MINIMAL** - Only affects regular mode steal flow, coach mode unchanged, modal already exists.

---

## 📊 Summary

| Requirement | Complexity | Files Modified | Impact | Risk |
|------------|------------|----------------|--------|------|
| **1. SUB Always Available** | ⚡ LOW | 2 | ✅ ZERO | ✅ NONE |
| **2. BLOCK Auto Sequence** | ⚡ MEDIUM | 3-4 | ✅ MINIMAL | ⚠️ LOW |
| **3. STEAL → Turnover Modal** | ⚡ LOW | 1 | ✅ MINIMAL | ✅ NONE |

---

## ✅ Implementation Checklist

### **Requirement 1: SUB Button**
- [ ] Remove `disabled: !onSubstitution` from DesktopStatGridV3
- [ ] Remove `disabled: !onSubstitution` from MobileStatGridV3
- [ ] Test SUB button always clickable
- [ ] Verify no regressions

### **Requirement 2: BLOCK Auto Sequence**
- [ ] Add `analyzeBlockEvent()` to PlayEngine
- [ ] Integrate block → missed shot modal flow
- [ ] Integrate missed shot → rebound modal flow
- [ ] Test full sequence: BLOCK → Missed Shot → Rebound
- [ ] Verify existing block recording still works
- [ ] Verify no impact on other stat flows

### **Requirement 3: STEAL → Turnover Modal Fix**
- [ ] Change regular mode to show TurnoverPromptModal (instead of auto-generate)
- [ ] Get stealer name for modal display
- [ ] Test steal → turnover modal flow in regular mode
- [ ] Verify coach mode still works correctly
- [ ] Verify team turnover tracking is accurate

---

## 🎯 Success Criteria

1. ✅ SUB button always visible and clickable (like edit stat button)
2. ✅ BLOCK button triggers missed shot → rebound sequence
3. ✅ STEAL button always shows TurnoverPromptModal (both regular and coach mode)
4. ✅ Tracker can select "who turned the ball over" → team turnover tracked accurately
5. ✅ No regressions in existing functionality
6. ✅ All components remain under 200 lines (`.cursorrules` compliance)

---

## 📝 Notes

- All enhancements are **add-ons** - no breaking changes
- Reusing existing modals and components where possible
- Following existing patterns (steal → turnover flow as reference)
- Maintaining `.cursorrules` compliance

