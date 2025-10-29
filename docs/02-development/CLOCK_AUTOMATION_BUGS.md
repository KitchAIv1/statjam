# Clock Automation Bugs - Steal, Turnover, and Foul Timing

**Date**: October 29, 2025  
**Status**: 🔴 **CRITICAL BUGS IDENTIFIED**  
**Priority**: 🔴 **HIGH - MUST FIX BEFORE COMMIT**

---

## 🐛 Issues Reported

### Issue 1: Steal - Clock Stops (Should Continue Running)
**Current Behavior**: When clicking steal stat, the game clock **STOPS**  
**Expected Behavior**: Game clock should **CONTINUE RUNNING** (steals happen during live play)  
**NBA Rule**: Steals occur during active play - clock keeps running

### Issue 2: Turnover - Clock Stops (Need to Verify)
**Current Behavior**: When clicking turnover, the game clock **STOPS**  
**Expected Behavior**: Depends on turnover type:
- **Live ball turnover** (bad pass, lost ball, steal): Clock **CONTINUES**
- **Dead ball turnover** (traveling, double dribble, violation): Clock **PAUSES**

### Issue 3: Foul - Clock Timing
**Current Behavior**: Clock stops **AFTER** the foul sequence (after FT modal)  
**Expected Behavior**: Clock should stop **IMMEDIATELY** when foul is committed (before FT modal)  
**NBA Rule**: Clock stops the moment the whistle blows

---

## 📋 NBA Rules Reference

### Clock Behavior for Different Events

| Event | Clock Behavior | Shot Clock Behavior | Rationale |
|-------|---------------|---------------------|-----------|
| **Steal** | ✅ **CONTINUES** | Reset to 24s | Live ball, play continues |
| **Turnover (Live)** | ✅ **CONTINUES** | Reset to 24s | Bad pass, lost ball - play continues |
| **Turnover (Dead)** | ❌ **PAUSES** | Reset to 24s | Violation - whistle stops play |
| **Foul** | ❌ **PAUSES** | Pauses | Whistle stops play immediately |
| **Timeout** | ❌ **PAUSES** | Pauses | Dead ball situation |
| **Made Shot** | ✅ **CONTINUES** | Reset to 24s | Play continues (except last 2 min) |

---

## 🔍 Root Cause Analysis

### Current Implementation (From Documentation)

**File**: `src/lib/engines/clockEngine.ts`

**From `PHASE2_EVENT_MAPPING_FIX.md`**:
```typescript
// Map steals as turnovers (should reset shot clock)
else if (stat.statType === 'steal') {
  eventType = 'turnover';
}
```

**From `PHASE2_TESTING_GUIDE.md`**:
```yaml
Test Case 7: Steal - Clock Reset and Pause
Expected Behavior: Steals should pause clocks and reset shot clock
1. Record a steal
2. VERIFY:
   - ✅ Game clock pauses  # ❌ THIS IS WRONG!
   - ✅ Shot clock resets to 24s
```

**From `PHASE2_EVENT_MAPPING_FIX.md` - Mapping Table**:
```
| steal | - | turnover | - | Pause clocks, reset shot clock |
| turnover | any | turnover | - | Pause clocks |
```

### ❌ **THE BUG**: Incorrect NBA Rule Implementation

**Current Logic**:
- Steal → Maps to `turnover` event
- Turnover → Pauses game clock
- **Result**: Steal pauses game clock ❌

**Correct Logic**:
- Steal → Live ball turnover → Clock **continues**
- Only dead ball turnovers should pause clock

---

## 🔧 Required Fixes

### Fix 1: Steal - Clock Should Continue

**Change Required**: `src/lib/engines/clockEngine.ts`

**Current**:
```typescript
case 'turnover':
  return {
    gameClock: { shouldPause: true },  // ❌ WRONG for steals
    shotClock: { shouldReset: true, resetTo: rules.shotClockSeconds }
  };
```

**Proposed Fix**:
```typescript
case 'turnover':
  // ✅ Distinguish between live ball and dead ball turnovers
  const isLiveBallTurnover = event.modifier === 'steal' || 
                              event.modifier === 'bad_pass' || 
                              event.modifier === 'lost_ball';
  
  return {
    gameClock: { 
      shouldPause: !isLiveBallTurnover  // Only pause for dead ball turnovers
    },
    shotClock: { 
      shouldReset: true, 
      resetTo: rules.shotClockSeconds 
    }
  };
```

### Fix 2: Steal - Separate Event Type

**Alternative Approach**: Create separate `steal` event type

**Change Required**: `src/hooks/useTracker.ts`

**Current**:
```typescript
// Map steals as turnovers
else if (stat.statType === 'steal') {
  eventType = 'turnover';
}
```

**Proposed Fix**:
```typescript
// Keep steals as separate event type (don't map to turnover)
else if (stat.statType === 'steal') {
  eventType = 'steal';  // ✅ Separate event type
}
```

**Then in `clockEngine.ts`**:
```typescript
case 'steal':
  return {
    gameClock: { shouldPause: false },  // ✅ Clock continues
    shotClock: { shouldReset: true, resetTo: rules.shotClockSeconds }
  };
```

### Fix 3: Turnover - Distinguish Live vs Dead Ball

**Change Required**: Add `modifier` tracking for turnovers

**Turnover Types**:
- **Live Ball** (clock continues): `steal`, `bad_pass`, `lost_ball`
- **Dead Ball** (clock pauses): `traveling`, `double_dribble`, `3_seconds`, `5_seconds`, `8_seconds`, `backcourt`, `offensive_goaltending`

### Fix 4: Foul - Immediate Clock Pause

**Change Required**: `src/app/stat-tracker-v3/page.tsx` - `handleFoulRecord`

**Current Flow**:
1. User clicks "FOUL"
2. Foul type modal appears
3. Victim selection modal appears
4. FT modal appears
5. **Clock pauses somewhere in this flow** ❌

**Correct Flow**:
1. User clicks "FOUL"
2. **Clock pauses IMMEDIATELY** ✅
3. Foul type modal appears
4. Victim selection modal appears
5. FT modal appears

**Implementation**:
```typescript
const handleFoulRecord = async (foulType: 'personal' | 'technical') => {
  if (!selectedPlayer || !gameData) return;
  
  // ✅ PAUSE CLOCK IMMEDIATELY
  tracker.stopClock();
  
  // Get fouler player name
  const foulerData = [...teamAPlayers, ...teamBPlayers].find(p => p.id === selectedPlayer);
  const foulerName = foulerData?.name || 'Player';
  
  // Store fouler info and show foul type modal
  setFoulerPlayerId(selectedPlayer);
  setFoulerPlayerName(foulerName);
  setShowFoulTypeModal(true);
};
```

---

## 🧪 Testing Plan

### Test 1: Steal - Clock Continues
1. Start game clock (running)
2. Record a steal
3. **VERIFY**:
   - ✅ Game clock **CONTINUES RUNNING**
   - ✅ Shot clock resets to 24s
   - ✅ Possession flips
   - ✅ Last action displays "STEAL"

### Test 2: Turnover (Dead Ball) - Clock Pauses
1. Start game clock (running)
2. Record a turnover (traveling/violation)
3. **VERIFY**:
   - ✅ Game clock **PAUSES**
   - ✅ Shot clock resets to 24s
   - ✅ Possession flips

### Test 3: Foul - Immediate Pause
1. Start game clock (running)
2. Click "FOUL" button
3. **VERIFY**:
   - ✅ Game clock **PAUSES IMMEDIATELY** (before modal)
   - ✅ Foul type modal appears
   - ✅ Clock remains paused throughout sequence

### Test 4: Made Shot - Clock Continues
1. Start game clock (running)
2. Record made field goal
3. **VERIFY**:
   - ✅ Game clock **CONTINUES RUNNING**
   - ✅ Shot clock resets to 24s
   - ✅ Possession flips

---

## 📊 Impact Analysis

### Current State (BROKEN):
- ❌ Steals pause clock (incorrect NBA rule)
- ❌ All turnovers pause clock (should distinguish live vs dead)
- ❌ Fouls pause clock late (should be immediate)
- ❌ Game flow feels unnatural
- ❌ Not production-ready

### After Fix:
- ✅ Steals keep clock running (correct NBA rule)
- ✅ Live ball turnovers keep clock running
- ✅ Dead ball turnovers pause clock
- ✅ Fouls pause clock immediately
- ✅ Natural game flow
- ✅ Production-ready

---

## 🎯 Recommended Approach

### Option 1: Separate Event Types (RECOMMENDED)
**Pros**:
- Clear separation of concerns
- Easier to understand
- More maintainable
- Allows for future event-specific logic

**Cons**:
- Requires more code changes
- Need to update ClockEngine to handle new event types

### Option 2: Modifier-Based Logic
**Pros**:
- Minimal code changes
- Uses existing modifier system

**Cons**:
- Less clear
- Harder to maintain
- Modifiers might not always be set correctly

---

## 🚀 Implementation Steps

1. **Step 1**: Fix steal event mapping
   - Create separate `steal` event type in ClockEngine
   - Update `useTracker.ts` to not map steal to turnover
   - Set `shouldPause: false` for steal events

2. **Step 2**: Fix turnover event logic
   - Add modifier-based logic to distinguish live vs dead ball
   - Update ClockEngine to handle different turnover types

3. **Step 3**: Fix foul timing
   - Add `tracker.stopClock()` call in `handleFoulRecord`
   - Ensure clock pauses before any modals appear

4. **Step 4**: Update documentation
   - Fix `PHASE2_TESTING_GUIDE.md` (Test Case 7 is wrong)
   - Update `PHASE2_EVENT_MAPPING_FIX.md` mapping table
   - Update `STAT_TRACKING_ENGINE_AUDIT.md`

5. **Step 5**: Test all scenarios
   - Run full test suite
   - Verify clock behavior for all event types
   - Confirm NBA rule compliance

---

## 📝 Files to Modify

1. `src/lib/engines/clockEngine.ts` - Add steal event type, fix turnover logic
2. `src/hooks/useTracker.ts` - Update event type mapping
3. `src/app/stat-tracker-v3/page.tsx` - Add immediate clock pause for fouls
4. `docs/02-development/PHASE2_TESTING_GUIDE.md` - Fix Test Case 7
5. `docs/02-development/PHASE2_EVENT_MAPPING_FIX.md` - Update mapping table

---

## ⚠️ Breaking Changes

**None** - These are bug fixes that align behavior with NBA rules. No API changes required.

---

**Status**: ✅ **FIXES IMPLEMENTED**  
**Date Completed**: October 29, 2025  
**Testing**: Ready for user testing

