# Shot Clock Violation - Implementation Complete

**Date**: October 29, 2025  
**Status**: ✅ **IMPLEMENTED - READY FOR TESTING**  
**Priority**: 🟡 MEDIUM (MVP Feature)

---

## 🎯 **Feature Overview**

Automatic detection and handling of shot clock violations when the shot clock reaches 0 during active play.

---

## 📦 **Components Created**

### 1. **ShotClockViolationModal.tsx** (NEW - 158 lines)
**Location**: `src/components/tracker-v3/modals/ShotClockViolationModal.tsx`

**Purpose**: Alert modal when shot clock reaches 0

**Features**:
- ✅ Animated alert with pulsing red design
- ✅ Displays team that committed violation
- ✅ NBA rule explanation
- ✅ Two action buttons: "Record Violation" or "Dismiss"
- ✅ Auto-dismiss after 10 seconds (configurable)
- ✅ Countdown timer display

**Props**:
```typescript
interface ShotClockViolationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordViolation: (teamId: string) => void;
  teamWithPossession: string;
  teamName: string;
  autoDismissSeconds?: number; // Default: 10s
}
```

---

### 2. **useShotClockViolation.ts** (NEW Custom Hook - 97 lines)
**Location**: `src/hooks/useShotClockViolation.ts`

**Purpose**: Detect shot clock violations and manage modal state

**Detection Logic**:
```typescript
// Violation detected when:
1. Previous tick: 1 second
2. Current tick: 0 seconds
3. Shot clock is running
4. Shot clock is visible (not disabled for FTs)
5. Team has possession (for attribution)
6. Not already triggered (prevent duplicates)
```

**Returns**:
```typescript
{
  showViolationModal: boolean;
  setShowViolationModal: (show: boolean) => void;
  violationTeamId: string | null;
}
```

---

### 3. **page.tsx Integration** (UPDATED - +35 lines)
**Location**: `src/app/stat-tracker-v3/page.tsx`

**Changes**:
1. **Imports** (Lines 32-33):
   - Added `ShotClockViolationModal`
   - Added `useShotClockViolation` hook

2. **Hook Usage** (Lines 126-142):
   - Integrated violation detection hook
   - Auto-pause game clock and shot clock on violation

3. **Modal Rendering** (Lines 1199-1233):
   - Render violation modal when triggered
   - Handle violation recording
   - Reset shot clock to 24s after violation

---

## 🔧 **How It Works**

### **Step 1: Detection**
```
Shot Clock: 3s → 2s → 1s → 0s
                         ↓
              🚨 VIOLATION DETECTED
```

**Hook Logic** (`useShotClockViolation.ts`):
- Monitors shot clock via `useEffect`
- Compares previous tick (1s) with current tick (0s)
- Triggers when conditions met

### **Step 2: Auto-Pause**
```
Violation Detected
      ↓
Game Clock: PAUSED
Shot Clock: PAUSED
      ↓
Modal Appears
```

**Callback** (`page.tsx` Lines 136-141):
```typescript
onViolationDetected: () => {
  console.log('🚨 Auto-pausing game clock due to shot clock violation');
  tracker.stopClock();
  tracker.stopShotClock();
}
```

### **Step 3: User Action**
```
Modal Options:
1. "Record Violation" → Record turnover + reset shot clock
2. "Dismiss" → Close modal (if clock error)
3. Auto-dismiss after 10s → Close modal
```

### **Step 4: Violation Recording**
```typescript
await tracker.recordStat({
  gameId: gameIdParam,
  playerId: undefined, // Team turnover (unattributed)
  teamId: violationTeamId,
  statType: 'turnover',
  modifier: 'shot_clock_violation',
  isOpponentStat: coachMode && teamId !== gameData.team_a_id
});

// Reset shot clock for opponent
tracker.resetShotClock(24);
```

---

## 📊 **Database Schema**

**Table**: `game_stats`

**Violation Record** (Current Implementation):
```sql
{
  game_id: uuid,
  team_id: uuid,
  player_id: NULL,           -- Team turnover (unattributed)
  custom_player_id: NULL,
  stat_type: 'turnover',
  modifier: NULL,            -- ⚠️ TEMPORARY: NULL due to DB constraint
  stat_value: 1,
  quarter: current_quarter,
  game_time_minutes: current_minutes,
  game_time_seconds: current_seconds,
  metadata: {                -- ✅ Violation type preserved in metadata
    violationType: 'shot_clock_violation',
    autoRecorded: true,
    timestamp: '2025-10-29T...'
  }
}
```

### ⚠️ **Temporary Workarounds (2 Issues)**

#### **Issue 1: Modifier Constraint**
**Current DB Constraint**:
```sql
(stat_type = 'turnover' AND modifier IS NULL)
```

**Workaround**: 
- Record as generic turnover with `modifier: NULL`
- Store violation type in `metadata.violationType`

#### **Issue 2: Player Requirement Constraint**
**Current DB Constraint**:
```sql
(player_id IS NOT NULL AND custom_player_id IS NULL) OR 
(player_id IS NULL AND custom_player_id IS NOT NULL)
```

**Issue**: Team turnovers (unattributed) can't have both IDs as NULL.

**Workaround**:
- Use `user.id` as proxy `player_id` (same pattern as opponent stats)
- Store flags in metadata: `{ isTeamTurnover: true, proxyPlayerId: '...' }`
- Enables future cleanup when backend supports team-level stats

**Future Migration**: See `docs/05-database/migrations/FUTURE_shot_clock_violation_modifier.sql`

---

## 🎨 **UI/UX Flow**

### **Visual States**

#### **1. Normal (Shot Clock > 5s)**
```
┌─────────────┐
│ Shot Clock  │
│             │
│     24      │  ← Green text
│   Running   │
└─────────────┘
```

#### **2. Warning (Shot Clock ≤ 5s)**
```
┌─────────────┐
│ Shot Clock  │  ← Red border + glow
│             │
│     03      │  ← Red text + pulse
│ ⚠️ WARNING  │  ← Animated warning
└─────────────┘
```

#### **3. Violation (Shot Clock = 0)**
```
┌──────────────────────────┐
│ 🚨 SHOT CLOCK VIOLATION  │
│                          │
│         00               │  ← Huge pulsing red
│      Team A              │
│                          │
│ Failed to attempt shot   │
│                          │
│ [Record] [Dismiss]       │
│ Auto-dismiss in 10s      │
└──────────────────────────┘
```

---

## 🧪 **Testing Checklist**

### **Test 1: Basic Violation Detection**
- [ ] Start game clock and shot clock
- [ ] Let shot clock count down to 0
- [ ] **VERIFY**: Modal appears immediately at 0
- [ ] **VERIFY**: Game clock auto-pauses
- [ ] **VERIFY**: Shot clock auto-pauses
- [ ] **VERIFY**: Correct team name displayed

### **Test 2: Record Violation**
- [ ] Trigger violation (shot clock → 0)
- [ ] Click "Record Violation"
- [ ] **VERIFY**: Turnover recorded in database
- [ ] **VERIFY**: Modifier is `shot_clock_violation`
- [ ] **VERIFY**: Shot clock resets to 24s
- [ ] **VERIFY**: Possession flips to opponent
- [ ] **VERIFY**: Modal closes

### **Test 3: Dismiss Violation**
- [ ] Trigger violation
- [ ] Click "Dismiss"
- [ ] **VERIFY**: No turnover recorded
- [ ] **VERIFY**: Modal closes
- [ ] **VERIFY**: Clocks remain paused (manual restart needed)

### **Test 4: Auto-Dismiss**
- [ ] Trigger violation
- [ ] Wait 10 seconds without clicking
- [ ] **VERIFY**: Modal auto-dismisses
- [ ] **VERIFY**: No turnover recorded
- [ ] **VERIFY**: Countdown displays correctly

### **Test 5: Coach Mode**
- [ ] Test violation in coach mode
- [ ] **VERIFY**: Works for home team
- [ ] **VERIFY**: Works for opponent team
- [ ] **VERIFY**: `isOpponentStat` flag set correctly

### **Test 6: During Free Throws**
- [ ] Start FT sequence (shot clock disabled)
- [ ] **VERIFY**: No violation triggered during FTs
- [ ] **VERIFY**: Shot clock is hidden/disabled

### **Test 7: Multiple Violations**
- [ ] Trigger violation → Record
- [ ] Let shot clock run down again → Trigger again
- [ ] **VERIFY**: Second violation detected correctly
- [ ] **VERIFY**: No duplicate triggers

### **Test 8: Mobile View**
- [ ] Test on mobile device/viewport
- [ ] **VERIFY**: Modal displays correctly
- [ ] **VERIFY**: Buttons are tappable
- [ ] **VERIFY**: Text is readable

---

## 🔍 **Edge Cases Handled**

### **1. Shot Clock Disabled (Free Throws)**
```typescript
shotClockVisible: tracker.shotClock.isVisible
```
**Result**: No violation triggered during FTs ✅

### **2. No Possession Assigned**
```typescript
possessionTeamId: tracker.possession.currentTeamId
```
**Result**: Violation only triggers when possession is known ✅

### **3. Duplicate Detection**
```typescript
hasTriggered.current = false; // Reset when clock > 1s
hasTriggered.current = true;  // Set when violation detected
```
**Result**: Prevents multiple modals for same violation ✅

### **4. Clock Already Paused**
```typescript
shotClockRunning: tracker.shotClock.isRunning
```
**Result**: No violation if clock is already stopped ✅

---

## 📝 **Console Logs**

### **Detection**:
```
🚨 SHOT CLOCK VIOLATION DETECTED
🚨 Team with possession: [team_id]
🚨 Auto-pausing game clock due to shot clock violation
🏀 Shot clock stopped
🏀 Game clock stopped
```

### **Recording**:
```
🚨 Recording shot clock violation for team: [team_id]
🏀 Recording stat to database: { statType: 'turnover', modifier: 'shot_clock_violation', ... }
✅ Stat recorded successfully in database
🏀 Shot clock reset to 24 seconds
✅ Shot clock violation recorded and clock reset
```

---

## ✅ **Adherence to `.cursorrules`**

### **File Sizes**:
- ✅ `ShotClockViolationModal.tsx`: 158 lines (< 200 limit)
- ✅ `useShotClockViolation.ts`: 97 lines (< 100 hook limit)
- ✅ `page.tsx`: +35 lines (minimal addition)

### **Single Responsibility**:
- ✅ Modal: Only displays violation alert
- ✅ Hook: Only detects violations
- ✅ Page: Only integrates components

### **Modularity**:
- ✅ Reusable modal component
- ✅ Reusable hook
- ✅ No tight coupling

### **Naming**:
- ✅ PascalCase for components
- ✅ camelCase for functions/hooks
- ✅ Descriptive names

---

## 🚀 **Next Steps**

1. **Test locally** using the testing checklist
2. **Verify console logs** match expected output
3. **Test in both modes** (Stat Admin + Coach)
4. **Test edge cases** (FTs, no possession, etc.)
5. **Commit changes** once validated

---

## 📁 **Files Modified/Created**

### **Created**:
1. `src/components/tracker-v3/modals/ShotClockViolationModal.tsx` (158 lines)
2. `src/hooks/useShotClockViolation.ts` (97 lines)
3. `docs/02-development/SHOT_CLOCK_VIOLATION_IMPLEMENTATION.md` (this file)

### **Modified**:
1. `src/app/stat-tracker-v3/page.tsx` (+35 lines)

**Total New Code**: ~290 lines  
**Total Files**: 4

---

**Last Updated**: October 29, 2025  
**Status**: ✅ **READY FOR TESTING**  
**Test Checklist**: See section above

