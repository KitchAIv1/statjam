# Phase 3: Possession Tracking Integration Plan

## 🎯 **OBJECTIVE**
Integrate `PossessionEngine` into `useTracker` hook and add UI indicators for current possession.

---

## 📋 **INTEGRATION POINTS**

### 1. **State Management** (`useTracker.ts`)
**Location**: Lines 77-124 (state declarations)

**Add**:
```typescript
// Possession State
const [possession, setPossession] = useState({
  currentTeamId: teamAId, // Default: Team A starts with possession
  possessionArrow: teamAId, // Jump ball arrow (alternating possession)
  lastChangeReason: null as string | null,
  lastChangeTimestamp: null as string | null
});
```

**Return Interface**: Lines 14-75
```typescript
// Add to UseTrackerReturn interface:
possession: {
  currentTeamId: string;
  possessionArrow: string;
  lastChangeReason: string | null;
  lastChangeTimestamp: string | null;
};
```

---

### 2. **Possession Processing** (`recordStat` function)
**Location**: Lines 682-900 (recordStat function)

**Integration Point**: After clock automation (line 825), before database write (line 827)

**Add**:
```typescript
// ✅ PHASE 3: Process possession automation
if (ruleset && automationFlags.possession?.enabled) {
  const { PossessionEngine } = await import('@/lib/engines/possessionEngine');
  
  // Map stat types to PossessionEngine event types
  let possessionEventType: 'made_shot' | 'turnover' | 'steal' | 'defensive_rebound' | 'offensive_rebound' | 'violation' | 'jump_ball';
  
  if (stat.statType === 'field_goal' || stat.statType === 'three_pointer') {
    if (stat.modifier === 'made') {
      possessionEventType = 'made_shot';
    }
  } else if (stat.statType === 'turnover') {
    possessionEventType = 'turnover';
  } else if (stat.statType === 'steal') {
    possessionEventType = 'steal';
  } else if (stat.statType === 'rebound') {
    possessionEventType = stat.modifier === 'offensive' ? 'offensive_rebound' : 'defensive_rebound';
  }
  
  // Only process if we have a valid possession event
  if (possessionEventType) {
    const possessionResult = PossessionEngine.processEvent(
      {
        currentPossession: possession.currentTeamId,
        possessionArrow: possession.possessionArrow,
        quarter: quarter,
        gameClockSeconds: clock.secondsRemaining
      },
      {
        type: possessionEventType,
        teamId: stat.teamId,
        playerId: stat.playerId,
        opponentTeamId: stat.teamId === teamAId ? teamBId : teamAId
      },
      automationFlags.possession
    );
    
    // Apply possession state changes immediately
    if (possessionResult.actions.length > 0) {
      console.log('🏀 Possession automation:', possessionResult.actions);
      
      setPossession({
        currentTeamId: possessionResult.newState.currentPossession,
        possessionArrow: possessionResult.newState.possessionArrow,
        lastChangeReason: possessionResult.newState.endReason || null,
        lastChangeTimestamp: new Date().toISOString()
      });
      
      // Persist to database if enabled
      if (possessionResult.newState.shouldPersist) {
        // Will be handled in database write section
      }
    }
  }
}
```

---

### 3. **Database Persistence** (GameServiceV3)
**Location**: `src/lib/services/gameServiceV3.ts`

**Add Method**:
```typescript
static async recordPossessionChange(data: {
  gameId: string;
  teamId: string;
  startQuarter: number;
  startTimeMinutes: number;
  startTimeSeconds: number;
  endQuarter?: number;
  endTimeMinutes?: number;
  endTimeSeconds?: number;
  endReason?: string;
}): Promise<void> {
  // Insert into game_possessions table
  // Update games.current_possession_team_id
}
```

---

### 4. **UI Components**

#### A. **Possession Indicator Badge** (New Component)
**File**: `src/components/tracker-v3/PossessionIndicator.tsx`
- Display current possession team
- Show possession arrow for jump balls
- Animate on possession change

#### B. **Integration Points**:
1. **Desktop Layout** (`stat-tracker-v3/page.tsx`):
   - Add badge next to team name in scoreboard
   
2. **Mobile Layout** (`MobileLayoutV3.tsx`):
   - Add badge in compact scoreboard

---

## 🔄 **EXECUTION ORDER**

### Step 1: Update `useTracker.ts`
1. ✅ Add possession state
2. ✅ Add possession to return interface
3. ✅ Integrate PossessionEngine in recordStat
4. ✅ Add possession initialization on game load

### Step 2: Update `GameServiceV3.ts`
1. ✅ Add `recordPossessionChange` method
2. ✅ Add `updateCurrentPossession` method
3. ✅ Add `getPossessionHistory` method (for analytics)

### Step 3: Create UI Components
1. ✅ Create `PossessionIndicator.tsx`
2. ✅ Add to desktop layout
3. ✅ Add to mobile layout

### Step 4: Testing
1. ✅ Test with Stat Admin interface
2. ✅ Test with Coach Tracker interface
3. ✅ Verify database persistence
4. ✅ Verify possession arrow alternation

---

## 🎨 **UI DESIGN SPECS**

### Possession Indicator Badge
```
┌─────────────────────────┐
│  ⚫ TEAM A POSSESSION   │
└─────────────────────────┘

Colors:
- Active possession: Orange gradient
- Inactive: Gray
- Animation: Pulse on change (0.3s)

Size:
- Desktop: px-3 py-1.5 text-sm
- Mobile: px-2 py-1 text-xs

Position:
- Desktop: Next to team name in scoreboard
- Mobile: Below team name in compact view
```

---

## ✅ **SUCCESS CRITERIA**

1. ✅ Possession auto-flips on made shots, turnovers, steals, defensive rebounds
2. ✅ Possession persists on offensive rebounds
3. ✅ Possession arrow alternates on jump balls
4. ✅ UI badge updates instantly (optimistic UI)
5. ✅ Database records possession history
6. ✅ Works for both Stat Admin and Coach Tracker
7. ✅ No performance degradation (< 50ms processing time)

---

## 🚨 **EDGE CASES TO HANDLE**

1. **Game Start**: Team A gets initial possession
2. **Quarter Start**: Possession continues from previous quarter
3. **Jump Ball**: Use alternating possession arrow
4. **Timeout**: Possession doesn't change
5. **Foul**: Possession may or may not change (depends on foul type)
6. **Coach Mode**: Handle opponent team possession correctly

---

## 📊 **PERFORMANCE TARGETS**

- Possession processing: < 5ms
- UI update: < 10ms (optimistic)
- Database write: < 100ms (non-blocking)
- Total impact on stat recording: < 20ms

---

**Status**: Ready for implementation
**Estimated Time**: 45-60 minutes
**Risk Level**: LOW (additive, non-breaking)

