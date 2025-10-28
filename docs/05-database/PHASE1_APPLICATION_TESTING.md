# Phase 1 Application Testing Guide
**Date**: October 28, 2025  
**Purpose**: Test Phase 1 implementation in the live application  
**Prerequisites**: Migrations 008, 009, 010 applied successfully

---

## Testing Checklist

### ✅ Step 1: Database Verification (SQL)

Run the verification script in Supabase SQL Editor:
- File: `docs/05-database/PHASE1_MIGRATION_VERIFICATION.sql`
- Expected: All 7 tests should pass
- Time: ~2 minutes

**Quick Check**:
```sql
-- Verify all 3 migrations applied
SELECT 
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='game_stats' AND column_name='sequence_id') as migration_008,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='game_possessions') as migration_009,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='tournaments' AND column_name='ruleset') as migration_010;
```

Expected: All 3 columns return `true`

---

## ✅ Step 2: Application Testing (No Code Push Yet)

### Test 2A: Create New Tournament (Ruleset Selector)

1. **Navigate**: `/dashboard/create-tournament`
2. **Fill Basic Info**: Name, description, venue, country
3. **Go to Step 2**: Tournament Setup
4. **Verify**: You should see a new "Game Rules" section with 3 options:
   - ✅ NBA (12 min quarters, 24s shot clock)
   - ✅ FIBA (10 min quarters, 24s shot clock)
   - ✅ NCAA (20 min halves, 30s shot clock)
5. **Select**: Choose "NBA" (default)
6. **Note**: Should see message "💡 All automation features are OFF by default"
7. **Complete**: Fill remaining fields and create tournament
8. **Expected**: Tournament created successfully with `ruleset='NBA'`

**Verification Query**:
```sql
SELECT 
  name, 
  ruleset, 
  automation_settings->'clock'->>'enabled' as automation_enabled
FROM tournaments
ORDER BY created_at DESC
LIMIT 1;
```

Expected:
- `ruleset` = `'NBA'`
- `automation_enabled` = `'false'`

---

### Test 2B: Open Existing Game in Stat Tracker

1. **Navigate**: Go to any existing game
2. **Click**: "Track Stats" or open tracker
3. **Open Browser Console**: Check for Phase 1 logs
4. **Expected Logs**:
   ```
   🎯 Phase 1: Loading ruleset and automation flags...
   ✅ Phase 1: Loaded ruleset: NBA
   ✅ Phase 1: Loaded automation flags: {...}
   ✅ Phase 1: All automation flags are OFF (expected behavior)
   ```
5. **Verify**: Tracker loads normally, no errors
6. **Test**: Record a stat (2PT, 3PT, etc.)
7. **Expected**: Stat records successfully (uses NULL/defaults for new columns)

**Verification Query**:
```sql
SELECT 
  stat_type,
  modifier,
  sequence_id,
  linked_event_id,
  event_metadata
FROM game_stats
ORDER BY created_at DESC
LIMIT 5;
```

Expected:
- `sequence_id` = `NULL`
- `linked_event_id` = `NULL`
- `event_metadata` = `{}`

---

### Test 2C: Verify Existing Tournaments Still Work

1. **Navigate**: `/dashboard` (Organizer Dashboard)
2. **Verify**: All existing tournaments display correctly
3. **Click**: On an existing tournament
4. **Verify**: Tournament details load, no errors
5. **Check**: Games, teams, schedule all work normally

**Expected**: No breaking changes, everything works as before

---

### Test 2D: Verify Live Viewer Still Works

1. **Navigate**: Go to any live/completed game
2. **Click**: "View Live" or open game viewer
3. **Verify**: 
   - ✅ Scoreboard displays correctly
   - ✅ Team Stats Tab loads
   - ✅ Play-by-Play Feed works
   - ✅ No errors in console
4. **Expected**: Live viewer works exactly as before

---

## ✅ Step 3: Push Code to Production

### Before Pushing

- [x] Database migrations applied
- [x] SQL verification tests passed
- [x] New tournament creation tested
- [x] Existing tracker tested
- [x] Live viewer tested
- [x] No errors in console

### Push Command

```bash
cd /Users/willis/SJAM.v1/statjam
git push origin feature/dual-engine-phase1-foundation
```

---

## ✅ Step 4: Post-Deployment Verification

### Test 4A: Monitor Production Logs

1. **Open**: Production application
2. **Open**: Browser Console (F12)
3. **Navigate**: To stat tracker for any game
4. **Check Logs**: Should see Phase 1 initialization logs
5. **Expected**:
   ```
   🎯 Phase 1: Loading ruleset and automation flags...
   ✅ Phase 1: Loaded ruleset: NBA
   ✅ Phase 1: All automation flags are OFF (expected behavior)
   ```

### Test 4B: Create Production Tournament

1. **Create**: New tournament in production
2. **Select**: FIBA ruleset (to test non-default)
3. **Verify**: Tournament created successfully
4. **Query**:
   ```sql
   SELECT name, ruleset 
   FROM tournaments 
   WHERE ruleset = 'FIBA'
   ORDER BY created_at DESC 
   LIMIT 1;
   ```
5. **Expected**: Tournament has `ruleset='FIBA'`

### Test 4C: Record Stats in Production

1. **Open**: Any game in stat tracker
2. **Record**: Multiple stats (2PT, 3PT, rebounds, etc.)
3. **Verify**: All stats record successfully
4. **Check**: Live viewer updates correctly
5. **Expected**: No errors, normal behavior

---

## ✅ Step 5: Regression Testing

### Critical Paths to Test

#### Path 1: Full Tournament Flow
1. Create tournament (with ruleset selection)
2. Add teams
3. Add players to teams
4. Create schedule
5. Start game
6. Track stats
7. View live game
8. Complete game

**Expected**: All steps work normally

#### Path 2: Coach Dashboard
1. Login as coach
2. Create team
3. Add players (custom + regular)
4. Launch Quick Track
5. Record stats (coach team + opponent)
6. Verify stats display

**Expected**: Coach functionality unchanged

#### Path 3: Player Dashboard
1. Login as player
2. View "My Stats"
3. Check game history
4. View player card

**Expected**: Player dashboard unchanged

---

## Troubleshooting

### Issue: "Column does not exist" error

**Cause**: Migrations not applied or not fully propagated

**Fix**:
1. Re-run migrations in Supabase SQL Editor
2. Wait 30 seconds for propagation
3. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)

### Issue: "All automation flags are enabled" warning

**Cause**: Tournament has non-default automation settings

**Fix**:
```sql
-- Reset automation flags to defaults
UPDATE tournaments
SET automation_settings = '{
  "clock": {"enabled": false, "autoPause": false, "autoReset": false, "ftMode": false, "madeBasketStop": false},
  "possession": {"enabled": false, "autoFlip": false, "persistState": false, "jumpBallArrow": false},
  "sequences": {"enabled": false, "promptAssists": false, "promptRebounds": false, "promptBlocks": false, "linkEvents": false, "freeThrowSequence": false},
  "fouls": {"enabled": false, "bonusFreeThrows": false, "foulOutEnforcement": false, "technicalEjection": false},
  "undo": {"enabled": false, "maxHistorySize": 50}
}'::jsonb
WHERE id = 'tournament-id-here';
```

### Issue: Tracker not loading ruleset

**Cause**: Tournament has no `tournament_id` (coach games)

**Expected Behavior**: Fallback to NBA ruleset

**Verify**:
```
⚠️ Phase 1: No tournament_id found, using default NBA ruleset
```

This is normal for coach games.

### Issue: INSERT fails with "null value" error

**Cause**: Migration 010 not applied (missing defaults)

**Fix**: Re-run migration 010

---

## Success Criteria

### ✅ Phase 1 is successful if:

1. **Database**:
   - [x] All 3 migrations applied
   - [x] All verification tests pass
   - [x] Existing data has correct defaults

2. **Application**:
   - [x] New tournaments can select ruleset
   - [x] Existing tournaments work unchanged
   - [x] Stat tracker loads ruleset
   - [x] Stats record successfully
   - [x] Live viewer works normally

3. **Logs**:
   - [x] Phase 1 initialization logs appear
   - [x] "All automation flags are OFF" message
   - [x] No errors in console

4. **Behavior**:
   - [x] No behavior changes (automation OFF)
   - [x] No breaking changes
   - [x] No performance degradation

---

## Next Steps After Phase 1

Once Phase 1 is verified successful:

1. **Phase 2**: Implement ClockEngine (auto-pause, auto-reset)
2. **Phase 3**: Implement PossessionEngine (auto-flip)
3. **Phase 4**: Implement PlayEngine (prompts, sequences)
4. **Phase 5**: Implement CommandEngine (undo/redo)

Each phase will be behind feature flags and can be enabled per tournament.

---

## Support

If you encounter any issues:

1. Check browser console for error messages
2. Run SQL verification queries
3. Check Supabase logs for database errors
4. Verify migrations applied correctly
5. Hard refresh browser to clear cache

**All Phase 1 features are designed to be non-breaking and safe.**

---

**Document Version**: 1.0  
**Last Updated**: October 28, 2025  
**Status**: READY FOR TESTING

