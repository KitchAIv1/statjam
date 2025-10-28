# Phase 2 Clock Automation Testing Guide

## Overview
This guide helps you test the Phase 2 Clock Automation features that are already implemented but disabled by default.

## Prerequisites
- ✅ Phase 1 migrations applied (ruleset configuration)
- ✅ Phase 2 code deployed (`ClockEngine` implemented)
- ✅ Active tournament with games

---

## Step 1: Enable Clock Automation for Test Tournament

### Find Your Tournament ID
```sql
-- List your tournaments
SELECT id, name, ruleset, automation_settings
FROM tournaments
WHERE organizer_id = auth.uid()
ORDER BY created_at DESC
LIMIT 5;
```

### Enable Clock Automation
```sql
-- Replace 'YOUR_TOURNAMENT_ID' with actual tournament ID
UPDATE tournaments 
SET automation_settings = '{
  "clock": {
    "enabled": true,
    "autoPause": true,
    "autoReset": true,
    "ftMode": false,
    "madeBasketStop": false
  },
  "possession": {
    "enabled": false,
    "autoFlip": false,
    "persistState": false,
    "jumpBallArrow": false
  },
  "sequences": {
    "enabled": false,
    "promptAssists": false,
    "promptRebounds": false,
    "promptBlocks": false,
    "linkEvents": false,
    "freeThrowSequence": false
  },
  "fouls": {
    "enabled": false,
    "bonusFreeThrows": false,
    "foulOutEnforcement": false,
    "technicalEjection": false
  },
  "undo": {
    "enabled": false,
    "maxHistorySize": 50
  }
}'::jsonb
WHERE id = 'YOUR_TOURNAMENT_ID';
```

### Verify the Update
```sql
SELECT 
  id,
  name,
  ruleset,
  automation_settings->'clock'->>'enabled' as clock_enabled,
  automation_settings->'clock'->>'autoPause' as auto_pause,
  automation_settings->'clock'->>'autoReset' as auto_reset
FROM tournaments
WHERE id = 'YOUR_TOURNAMENT_ID';
```

---

## Step 2: Test Clock Automation Features

### Test Case 1: Auto-Pause on Foul
**Expected Behavior**: Clock should auto-pause when a foul is recorded

1. Start a game in the stat tracker
2. Start the game clock
3. Record a foul (any type)
4. **VERIFY**: 
   - ✅ Game clock should pause automatically
   - ✅ Console log: `🕐 Clock automation: [{ action: 'pause_game_clock', reason: 'foul' }]`

### Test Case 2: Shot Clock Reset on Made Shot ⚠️ **FIXED**
**Expected Behavior**: Shot clock should reset to 24s (NBA) after made shot

1. Record a made field goal (2PT or 3PT)
2. **VERIFY**:
   - ✅ Shot clock resets to 24 seconds (NBA) or 30s (NCAA)
   - ✅ Console log: `🕐 Clock automation: [{ action: 'reset_shot_clock', value: 24 }]`

**Note**: This was fixed in commit `df4e8f0` - event mapping now correctly converts `field_goal`/`three_pointer` → `made_shot`

### Test Case 3: Shot Clock Reset on Defensive Rebound ⚠️ **FIXED**
**Expected Behavior**: Shot clock should reset to full on defensive rebound

1. Record a missed shot
2. Record a defensive rebound
3. **VERIFY**:
   - ✅ Shot clock resets to 24s (NBA) or 30s (NCAA)
   - ✅ Console log shows reset action: `🕐 Clock automation: [{ action: 'reset_shot_clock', value: 24 }]`

**Note**: This was fixed in commit `df4e8f0` - rebounds now correctly map to `missed_shot` with `reboundType: 'defensive'`

### Test Case 4: Shot Clock Reset to 14s on Offensive Rebound (NBA only) ⚠️ **FIXED**
**Expected Behavior**: Shot clock should reset to 14s on offensive rebound if < 14s remaining

1. Let shot clock run down to < 14 seconds
2. Record a missed shot
3. Record an offensive rebound
4. **VERIFY**:
   - ✅ Shot clock resets to 14 seconds (NBA rule)
   - ✅ Console log: `🕐 Clock automation: [{ action: 'reset_shot_clock', value: 14 }]`

**Note**: This was fixed in commit `df4e8f0` - rebounds now correctly map to `missed_shot` with `reboundType: 'offensive'`

### Test Case 5: Auto-Pause on Timeout
**Expected Behavior**: Both clocks should pause on timeout

1. Call a timeout
2. **VERIFY**:
   - ✅ Game clock pauses
   - ✅ Shot clock pauses
   - ✅ Console log shows pause actions

### Test Case 6: Auto-Pause on Violation
**Expected Behavior**: Clocks should pause on violations

1. Record a turnover (violation type)
2. **VERIFY**:
   - ✅ Game clock pauses
   - ✅ Console log shows pause action

### Test Case 7: Steal - Clock Reset and Pause ⚠️ **NEW**
**Expected Behavior**: Steals should pause clocks and reset shot clock (change of possession)

1. Record a steal
2. **VERIFY**:
   - ✅ Game clock pauses
   - ✅ Shot clock resets to 24s (NBA)
   - ✅ Console log: `🕐 Clock automation: [{ action: 'pause_game_clock' }, { action: 'reset_shot_clock', value: 24 }]`

**Note**: This was added in commit `df4e8f0` - steals now correctly map to `turnover` events

---

## Step 3: Monitor Console Logs

### Key Logs to Watch For

**Initialization:**
```
✅ Phase 1: Loaded ruleset: NBA
✅ Phase 1: Loaded automation flags: { clock: { enabled: true, ... } }
```

**Clock Automation Triggered:**
```
🕐 Clock automation: [
  { action: 'pause_game_clock', reason: 'foul' },
  { action: 'reset_shot_clock', value: 24 }
]
```

**Clock State Updates:**
```
⏰ Clock state updated: { gameClockMinutes: 10, gameClockSeconds: 0, shotClockSeconds: 24, ... }
```

---

## Step 4: Verify Database Persistence

### Check Game Stats
```sql
-- Verify stats are being recorded correctly
SELECT 
  stat_type,
  stat_value,
  modifier,
  quarter,
  game_time_minutes,
  game_time_seconds,
  created_at
FROM game_stats
WHERE game_id = 'YOUR_GAME_ID'
ORDER BY created_at DESC
LIMIT 10;
```

### Check Clock State (if persisted)
```sql
-- Check if clock state is being saved (Phase 2+)
SELECT 
  meta_json->'clock_state' as clock_state
FROM games
WHERE id = 'YOUR_GAME_ID';
```

---

## Step 5: Test Different Rulesets

### NBA Ruleset
- Shot clock: 24 seconds
- Offensive rebound: 14s reset if < 14s remaining
- Last 2 min: Clock stops on made baskets (not enabled in this phase)

### FIBA Ruleset
- Shot clock: 24 seconds
- Offensive rebound: 14s reset if < 14s remaining
- No last 2 min rule

### NCAA Ruleset
- Shot clock: 30 seconds
- Offensive rebound: 20s reset if < 20s remaining
- No last 2 min rule

---

## Troubleshooting

### Issue: No Automation Happening

**Check 1: Verify automation_settings**
```sql
SELECT automation_settings FROM tournaments WHERE id = 'YOUR_TOURNAMENT_ID';
```
Should show `"enabled": true` for clock automation.

**Check 2: Check console for errors**
Look for:
- `❌ ClockEngine error:`
- `⚠️ Automation disabled:`

**Check 3: Verify ruleset is loaded**
```sql
SELECT ruleset FROM tournaments WHERE id = 'YOUR_TOURNAMENT_ID';
```
Should be 'NBA', 'FIBA', or 'NCAA' (not NULL).

### Issue: Wrong Shot Clock Values

**Check ruleset configuration:**
```sql
SELECT 
  ruleset,
  ruleset_config
FROM tournaments
WHERE id = 'YOUR_TOURNAMENT_ID';
```

### Issue: Clock Not Pausing

**Check if autoPause is enabled:**
```sql
SELECT 
  automation_settings->'clock'->>'autoPause' as auto_pause_enabled
FROM tournaments
WHERE id = 'YOUR_TOURNAMENT_ID';
```

---

## Disable Automation After Testing

```sql
-- Disable clock automation
UPDATE tournaments 
SET automation_settings = jsonb_set(
  automation_settings,
  '{clock,enabled}',
  'false'::jsonb
)
WHERE id = 'YOUR_TOURNAMENT_ID';
```

---

## Success Criteria

Phase 2 is working correctly if:
- ✅ Clock auto-pauses on fouls, timeouts, violations, steals
- ✅ Shot clock resets on made shots (field goals, 3-pointers)
- ✅ Shot clock resets correctly on defensive rebounds
- ✅ Shot clock resets correctly on offensive rebounds (NBA: 14s if < 14s)
- ✅ Shot clock resets on steals (change of possession)
- ✅ All ruleset-specific behaviors work (NBA/FIBA/NCAA)
- ✅ No errors in console
- ✅ Stats continue to save correctly to database
- ✅ Manual clock controls still work
- ✅ Disabling automation returns to manual mode

**Status**: ✅ All issues fixed in commit `df4e8f0` - ready for comprehensive testing

---

## Next Steps

After successful Phase 2 testing:
1. Document any bugs found
2. Proceed to Phase 3: Possession Tracking
3. Consider adding UI toggle for automation flags
4. Plan beta tournament with automation enabled

---

## Notes

- **All automation is OFF by default** - safe for production
- **Per-tournament control** - enable only for test tournaments
- **Manual override always works** - users can still manually control clocks
- **Gradual rollout** - enable features one phase at a time

