# Phase 2 Clock Automation - Event Mapping Fix

## Issue Summary
Clock automation was only working for fouls, timeouts, and turnovers. Made shots, rebounds, and steals were not triggering automation.

## Root Cause
**Incorrect event type mapping** in `useTracker.ts` (line 723):

The code was passing raw `stat.statType` values to `ClockEngine`, but:
- `stat.statType` uses values like: `'field_goal'`, `'three_pointer'`, `'rebound'`, `'steal'`
- `ClockEngine` expects values like: `'made_shot'`, `'missed_shot'`, `'turnover'`

**Result**: ClockEngine didn't recognize the events and did nothing.

---

## Fix Applied

### File: `src/hooks/useTracker.ts` (lines 722-743)

**Before:**
```typescript
const clockEvent = {
  type: stat.statType as 'foul' | 'made_shot' | ...,  // ❌ Wrong!
  modifier: stat.modifier,
  reboundType: undefined
};
```

**After:**
```typescript
// ✅ Map stat types to ClockEngine event types
let eventType: 'foul' | 'made_shot' | 'missed_shot' | 'turnover' | 'timeout' | 'free_throw' | 'substitution';
let reboundType: 'offensive' | 'defensive' | undefined = undefined;

// Map scoring stats to made_shot/missed_shot
if (stat.statType === 'field_goal' || stat.statType === 'three_pointer') {
  eventType = stat.modifier === 'made' ? 'made_shot' : 'missed_shot';
}
// Map rebounds as missed_shot with reboundType
else if (stat.statType === 'rebound') {
  eventType = 'missed_shot';
  reboundType = stat.modifier as 'offensive' | 'defensive';
}
// Map steals as turnovers (should reset shot clock)
else if (stat.statType === 'steal') {
  eventType = 'turnover';
}
// Pass through other stats as-is
else {
  eventType = stat.statType as 'foul' | 'turnover' | 'timeout' | 'free_throw' | 'substitution';
}

const clockEvent = {
  type: eventType,
  modifier: stat.modifier,
  ballLocation: undefined,
  reboundType: reboundType
};
```

---

## Mapping Table

| Stat Type | Modifier | ClockEngine Event | Rebound Type | Expected Behavior |
|-----------|----------|-------------------|--------------|-------------------|
| `field_goal` | `made` | `made_shot` | - | Clock continues, reset shot clock to 24s |
| `field_goal` | `missed` | `missed_shot` | - | No action (wait for rebound) |
| `three_pointer` | `made` | `made_shot` | - | Clock continues, reset shot clock to 24s |
| `three_pointer` | `missed` | `missed_shot` | - | No action (wait for rebound) |
| `free_throw` | `made` | `free_throw` | - | No action (FT mode) |
| `rebound` | `offensive` | `missed_shot` | `offensive` | Reset to 14s (NBA) if < 14s |
| `rebound` | `defensive` | `missed_shot` | `defensive` | Reset to 24s (NBA) |
| `steal` | - | `steal` | - | **Clock continues** (live ball), reset shot clock ✅ |
| `foul` | any | `foul` | - | Pause clocks **immediately** ✅ |
| `timeout` | any | `timeout` | - | Pause clocks |
| `turnover` | `steal`/`bad_pass`/`lost_ball` | `turnover` | - | **Clock continues** (live ball), reset shot clock ✅ |
| `turnover` | `traveling`/violation | `turnover` | - | **Pause clocks** (dead ball), reset shot clock ✅ |

---

## Test Results (Expected After Fix)

### ✅ Should Now Work:

1. **Made Field Goal / 3-Pointer**
   - ✅ Shot clock resets to 24s (NBA)
   - Console: `🕐 Clock automation: [{ action: 'reset_shot_clock', value: 24 }]`

2. **Defensive Rebound**
   - ✅ Shot clock resets to 24s (NBA)
   - Console: `🕐 Clock automation: [{ action: 'reset_shot_clock', value: 24 }]`

3. **Offensive Rebound**
   - ✅ Shot clock resets to 14s (NBA) if current < 14s
   - ✅ Otherwise keeps current value
   - Console: `🕐 Clock automation: [{ action: 'reset_shot_clock', value: 14 }]`

4. **Steal** ✅ **CORRECTED**
   - ✅ Clock **CONTINUES** (live ball event)
   - ✅ Shot clock resets to 24s
   - Console: `🕐 ClockEngine: Steal detected - clock CONTINUES (live ball)`
   - Console: `🕐 Clock automation: ['Shot clock reset to 24s']`

### ✅ Already Working:

5. **Foul**
   - ✅ Clocks pause
   - Console: `🕐 Clock automation: [{ action: 'pause_game_clock' }]`

6. **Timeout**
   - ✅ Clocks pause
   - Console: `🕐 Clock automation: [{ action: 'pause_game_clock' }]`

---

## Testing Instructions

1. **Refresh the stat tracker page** (clear cache: Cmd+Shift+R)
2. **Test each scenario** from the table above
3. **Watch console logs** for `🕐 Clock automation:` messages
4. **Verify shot clock values** match expected behavior

---

## Success Criteria

Phase 2 is fully working if:
- ✅ Made shots reset shot clock to 24s
- ✅ Defensive rebounds reset shot clock to 24s
- ✅ Offensive rebounds reset to 14s (NBA) when appropriate
- ✅ Steals pause clocks and reset shot clock
- ✅ Fouls pause clocks
- ✅ Timeouts pause clocks
- ✅ Console logs show automation actions
- ✅ No errors in console

---

## Notes

- **Steals are mapped to turnovers** because they have the same clock behavior (change of possession)
- **Rebounds must be recorded separately** after missed shots for automation to work
- **ClockEngine is pure** - no side effects, just returns new state
- **Manual controls still work** - automation can be overridden

---

## Next Steps

After successful testing:
1. Document any remaining issues
2. Consider adding UI indicators for automation (e.g., "Auto-paused" badge)
3. Proceed to Phase 3: Possession Tracking
4. Plan beta tournament with full automation enabled

