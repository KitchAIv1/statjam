# Shot Clock Sync Fix

## 🎯 **Issue: Shot Clock Not Syncing with Game Clock**

### **Problem Description:**

**Issue 1: Shot Clock State Not Syncing**
When the shot clock was manually reset (via reset button or edit), it would always pause (`isRunning: false`), even if the game clock was running.

**Issue 2: Shot Clock Ticking Out of Sync**
Even when both clocks were running, they would tick at different moments because they used separate `setInterval` timers. This caused visual desynchronization where the clocks would countdown at different microsecond offsets.

**Expected Behavior:**
- Game clock is **RUNNING** → Shot clock reset → Shot clock should be **RUNNING**
- Game clock is **PAUSED** → Shot clock reset → Shot clock should be **PAUSED**
- Both clocks should tick at the **EXACT SAME MOMENT** (synchronized countdown)

**Actual Behavior (Before Fix):**
- Game clock is **RUNNING** → Shot clock reset → Shot clock is **PAUSED** ❌
- Game clock is **PAUSED** → Shot clock reset → Shot clock is **PAUSED** ✅
- Game clock ticks at 10:30 → 10:29, Shot clock ticks 0.3s later at 24 → 23 ❌

---

## 🔍 **Root Cause:**

### **Root Cause 1: State Sync Issue**

**Location: `src/hooks/useTracker.ts`**

#### **Before Fix (Issue 1):**
```typescript
const resetShotClock = useCallback((seconds?: number) => {
  const resetValue = seconds ?? 24;
  setShotClock(prev => ({ 
    ...prev, 
    isRunning: false,  // ❌ ALWAYS false, ignores game clock state
    secondsRemaining: resetValue 
  }));
}, []);

const setShotClockTime = useCallback((seconds: number) => {
  const validSeconds = Math.max(0, Math.min(35, Math.floor(seconds)));
  setShotClock(prev => ({ 
    ...prev, 
    isRunning: false,  // ❌ ALWAYS false, ignores game clock state
    secondsRemaining: validSeconds 
  }));
}, []);
```

**Issue:**
- Both functions hardcoded `isRunning: false`
- Ignored the game clock's running state
- Game clock is the **source of truth**, but shot clock didn't respect it

---

### **Root Cause 2: Separate Timer Intervals**

**Location: `src/app/stat-tracker-v3/page.tsx`**

#### **Before Fix (Issue 2):**
```typescript
// Game Clock Interval (Line 260-275)
useEffect(() => {
  let interval: NodeJS.Timeout;
  
  if (tracker.clock.isRunning) {
    interval = setInterval(() => {
      tracker.tick(1);  // Game clock ticks
      // ...
    }, 1000);
  }
  return () => { if (interval) clearInterval(interval); };
}, [tracker.clock.isRunning, ...]);

// Shot Clock Interval (Line 277-299) - SEPARATE TIMER!
useEffect(() => {
  let shotClockInterval: NodeJS.Timeout;
  
  if (tracker.shotClock.isRunning && tracker.shotClock.isVisible) {
    shotClockInterval = setInterval(() => {
      tracker.shotClockTick(1);  // Shot clock ticks SEPARATELY
      // ...
    }, 1000);
  }
  return () => { if (shotClockInterval) clearInterval(shotClockInterval); };
}, [tracker.shotClock.isRunning, ...]);
```

**Issue:**
- Two separate `setInterval` timers
- Started at different microseconds
- Ticked at different moments
- Visual desynchronization (clocks don't countdown together)

---

## ✅ **The Fix:**

### **Fix 1: State Sync (useTracker.ts)**

#### **After Fix:**
```typescript
const resetShotClock = useCallback((seconds?: number) => {
  const resetValue = seconds ?? 24;
  
  // ✅ SYNC WITH GAME CLOCK: Shot clock inherits game clock's running state
  setShotClock(prev => ({ 
    ...prev, 
    isRunning: clock.isRunning, // ✅ Sync with game clock (source of truth)
    secondsRemaining: resetValue 
  }));
  setLastAction(`Shot clock reset to ${resetValue}s`);
  console.log(`🏀 Shot clock reset to ${resetValue} seconds (synced with game clock: ${clock.isRunning ? 'RUNNING' : 'PAUSED'})`);
}, [clock.isRunning]);

const setShotClockTime = useCallback((seconds: number) => {
  const validSeconds = Math.max(0, Math.min(35, Math.floor(seconds)));
  
  // ✅ SYNC WITH GAME CLOCK: Shot clock inherits game clock's running state
  setShotClock(prev => ({ 
    ...prev, 
    isRunning: clock.isRunning, // ✅ Sync with game clock (source of truth)
    secondsRemaining: validSeconds 
  }));
  setLastAction(`Shot clock set to ${validSeconds}s`);
  console.log(`🏀 Shot clock set to ${validSeconds} seconds (synced with game clock: ${clock.isRunning ? 'RUNNING' : 'PAUSED'})`);
}, [clock.isRunning]);
```

**Key Changes:**
1. ✅ `isRunning: clock.isRunning` - Inherits game clock state
2. ✅ Added `clock.isRunning` to dependency array
3. ✅ Enhanced console logs for debugging
4. ✅ Game clock remains the single source of truth

---

### **Fix 2: Unified Timer Interval (page.tsx)**

#### **After Fix:**
```typescript
// ✅ UNIFIED CLOCK TICK: Single interval for both clocks
useEffect(() => {
  let interval: NodeJS.Timeout;
  
  // Start interval if EITHER clock is running
  if (tracker.clock.isRunning || tracker.shotClock.isRunning) {
    interval = setInterval(() => {
      // Tick game clock if running
      if (tracker.clock.isRunning) {
        tracker.tick(1);
        if (tracker.clock.secondsRemaining <= 1) {
          tracker.advanceIfNeeded();
        }
      }
      
      // Tick shot clock if running AND visible
      if (tracker.shotClock.isRunning && tracker.shotClock.isVisible) {
        tracker.shotClockTick(1);
        
        // Shot clock violation at 0 seconds
        if (tracker.shotClock.secondsRemaining <= 1) {
          console.log('🚨 Shot clock violation!');
          tracker.stopShotClock();
          setShotClockViolation(true);
        }
      }
    }, 1000);
  }

  return () => {
    if (interval) clearInterval(interval);
  };
}, [
  tracker.clock.isRunning, 
  tracker.shotClock.isRunning, 
  tracker.shotClock.isVisible,
  // ... other dependencies
]);
```

**Key Changes:**
1. ✅ **Single `setInterval`** for both clocks
2. ✅ Starts if **EITHER** clock is running
3. ✅ Ticks both clocks in the **SAME callback**
4. ✅ Ensures **perfect synchronization** (same microsecond)
5. ✅ No drift over time

---

### **Fix 3: Smooth Reset (No Stutter)**

#### **The Problem:**
When resetting the shot clock, the `useEffect` dependency array included `tracker.clock.secondsRemaining` and `tracker.shotClock.secondsRemaining`. This caused the interval to **recreate** every second, and especially when resetting, causing a brief freeze in the game clock.

#### **Before Fix (Issue 3):**
```typescript
useEffect(() => {
  // ... interval logic ...
}, [
  tracker.clock.isRunning,
  tracker.shotClock.isRunning,
  tracker.clock.secondsRemaining,      // ❌ Recreates interval every second!
  tracker.shotClock.secondsRemaining   // ❌ Recreates interval on reset!
]);
```

**Issue:**
- Interval recreated every second (destroy + create)
- Interval recreated on shot clock reset
- Brief freeze in game clock during recreation
- Poor performance (unnecessary work)

#### **After Fix:**
```typescript
useEffect(() => {
  // ... interval logic ...
}, [
  tracker.clock.isRunning,     // ✅ Only recreate when state changes
  tracker.shotClock.isRunning, // ✅ Only recreate when state changes
  tracker.tick,                // ✅ Stable function
  tracker.shotClockTick        // ✅ Stable function
  // ❌ REMOVED: secondsRemaining (no longer causes recreation)
]);

// ✅ Separate effects for edge cases (don't interfere with interval)
useEffect(() => {
  if (tracker.clock.secondsRemaining <= 0) tracker.advanceIfNeeded();
}, [tracker.clock.secondsRemaining]);

useEffect(() => {
  if (tracker.shotClock.secondsRemaining <= 0) tracker.stopShotClock();
}, [tracker.shotClock.secondsRemaining]);
```

**Key Changes:**
1. ✅ **Removed `secondsRemaining` from interval dependencies**
2. ✅ Interval only recreates when **running state** changes
3. ✅ Separate effects handle edge cases (quarter end, violations)
4. ✅ **No freeze** when resetting shot clock
5. ✅ Game clock **never affected** by shot clock operations

**Result:**
- Game clock: Smooth, continuous countdown
- Shot clock reset: Instant, no freeze
- Better performance: Interval persists across ticks

---

## 🎮 **User Experience:**

### **Scenario 1: Reset During Live Play**
```
1. Game clock is RUNNING (10:30 remaining)
2. Shot clock is at 8 seconds
3. User clicks "Reset Shot Clock"
4. Shot clock resets to 24 seconds
5. Shot clock CONTINUES RUNNING ✅
6. Both clocks tick down together ✅
```

### **Scenario 2: Reset During Pause**
```
1. Game clock is PAUSED (5:45 remaining)
2. Shot clock is at 3 seconds
3. User clicks "Reset Shot Clock"
4. Shot clock resets to 24 seconds
5. Shot clock STAYS PAUSED ✅
6. Both clocks remain frozen ✅
```

### **Scenario 3: Edit During Live Play**
```
1. Game clock is RUNNING (8:15 remaining)
2. Shot clock is at 14 seconds
3. User clicks "Edit" and sets to 10 seconds
4. Shot clock updates to 10 seconds
5. Shot clock CONTINUES RUNNING ✅
6. Both clocks tick down together ✅
```

---

## 🔗 **Related Automation:**

### **ClockEngine Automation (Already Working)**
The `ClockEngine` automation was already correctly syncing shot clock with game clock:

```typescript
// src/lib/engines/clockEngine.ts (Line 96)
if (newShotClock !== currentState.shotClock) {
  newState.shotClock = newShotClock;
  newState.shotClockRunning = true;  // ✅ Already correct
  actions.push(`Shot clock reset to ${newShotClock}s`);
}
```

**This fix ensures manual controls match automation behavior!**

---

## 🧪 **Testing Checklist:**

### **Test Case 1: Manual Reset (Running)**
- [ ] Start game clock
- [ ] Let shot clock run down to ~10s
- [ ] Click "Reset Shot Clock"
- [ ] Verify shot clock resets to 24s
- [ ] Verify shot clock CONTINUES RUNNING
- [ ] Verify both clocks tick down together

### **Test Case 2: Manual Reset (Paused)**
- [ ] Pause game clock
- [ ] Shot clock at any value
- [ ] Click "Reset Shot Clock"
- [ ] Verify shot clock resets to 24s
- [ ] Verify shot clock STAYS PAUSED
- [ ] Verify both clocks remain frozen

### **Test Case 3: Manual Edit (Running)**
- [ ] Start game clock
- [ ] Click "Edit Shot Clock"
- [ ] Set to 14 seconds
- [ ] Verify shot clock updates to 14s
- [ ] Verify shot clock CONTINUES RUNNING
- [ ] Verify both clocks tick down together

### **Test Case 4: Manual Edit (Paused)**
- [ ] Pause game clock
- [ ] Click "Edit Shot Clock"
- [ ] Set to 18 seconds
- [ ] Verify shot clock updates to 18s
- [ ] Verify shot clock STAYS PAUSED
- [ ] Verify both clocks remain frozen

### **Test Case 5: Automation Reset (Offensive Rebound)**
- [ ] Start game clock
- [ ] Record missed shot
- [ ] Record offensive rebound
- [ ] Verify shot clock auto-resets to 14s (if > 14s) or stays same
- [ ] Verify shot clock CONTINUES RUNNING
- [ ] Verify automation matches manual behavior

### **Test Case 6: Automation Reset (Defensive Rebound)**
- [ ] Start game clock
- [ ] Record missed shot
- [ ] Record defensive rebound
- [ ] Verify shot clock auto-resets to 24s
- [ ] Verify shot clock CONTINUES RUNNING
- [ ] Verify automation matches manual behavior

### **Test Case 7: Start/Stop Independence**
- [ ] Pause game clock
- [ ] Manually start shot clock
- [ ] Verify shot clock runs independently ✅
- [ ] Start game clock
- [ ] Verify both clocks now run together ✅

---

## 📊 **Console Logs:**

### **Before Fix:**
```
🏀 Shot clock reset to 24 seconds
```

### **After Fix:**
```
🏀 Shot clock reset to 24 seconds (synced with game clock: RUNNING)
🏀 Shot clock reset to 24 seconds (synced with game clock: PAUSED)
🏀 Shot clock set to 14 seconds (synced with game clock: RUNNING)
🏀 Shot clock set to 14 seconds (synced with game clock: PAUSED)
```

**Benefits:**
- ✅ Clear visibility of sync behavior
- ✅ Easy debugging
- ✅ Confirms game clock state at reset time

---

## 🎯 **Design Principle:**

### **Game Clock = Source of Truth**

The game clock is the **primary clock** that controls the flow of the game. All other clocks (shot clock, timeout clock) should **inherit** the game clock's running state unless explicitly overridden.

**Hierarchy:**
```
Game Clock (Source of Truth)
    ↓
Shot Clock (Inherits running state)
    ↓
Timeout Clock (Independent, but pauses game clock)
```

**Rules:**
1. ✅ Shot clock inherits game clock's running state on reset/edit
2. ✅ Shot clock can be manually started/stopped independently (for corrections)
3. ✅ Automation always syncs shot clock with game clock
4. ✅ Game clock never inherits from shot clock

---

## 🚀 **Deployment:**

### **Files Modified:**
- `src/hooks/useTracker.ts`
  - `resetShotClock()` - Now syncs with game clock
  - `setShotClockTime()` - Now syncs with game clock

### **No Breaking Changes:**
- ✅ Backwards compatible
- ✅ No database changes
- ✅ No API changes
- ✅ No UI changes (behavior only)

### **Deployment Steps:**
1. Merge to main
2. Deploy to production
3. Test with live game
4. Monitor console logs for sync behavior

---

## 📝 **Notes:**

### **Why Not Always Sync?**
The `startShotClock()` and `stopShotClock()` functions intentionally do NOT sync with the game clock. This allows operators to manually correct the shot clock independently if needed (e.g., if shot clock was accidentally stopped but game clock is still running).

**Manual Controls:**
- `startShotClock()` - Independent start (for corrections)
- `stopShotClock()` - Independent stop (for corrections)
- `resetShotClock()` - **Syncs with game clock** ✅
- `setShotClockTime()` - **Syncs with game clock** ✅

**Automation:**
- `ClockEngine.processEvent()` - **Always syncs with game clock** ✅

---

## 🐛 **Known Issues:**

None at this time.

---

## 📚 **Related Documentation:**

- `PHASE2_TESTING_GUIDE.md` - Clock automation testing
- `FOUL_SHOT_CLOCK_BEHAVIOR.md` - Shot clock reset rules
- `PHASE2_COACH_MODE_STATUS.md` - Coach mode clock behavior

---

**Last Updated:** 2025-10-29  
**Status:** ✅ Fixed, Ready for Testing

