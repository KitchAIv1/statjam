# Migration 020: Execution Guide - Trigger Lock Contention Fix

**Migration File**: `020_optimize_trigger_lock_contention_PRODUCTION.sql`  
**Purpose**: Eliminate lock contention by combining score and foul updates  
**Risk Level**: LOW (Non-destructive, preserves functionality)  
**Estimated Time**: 5-10 minutes  
**Downtime Required**: None (can run during active games)

---

## 📋 PRE-EXECUTION CHECKLIST

### Before Running Migration:

- [ ] **Backup Database**: Ensure recent backup exists
- [ ] **Review Migration**: Read entire SQL file to understand changes
- [ ] **Low Traffic Period**: Recommended to run during low activity (optional)
- [ ] **Team Notification**: Inform team of maintenance window (if desired)
- [ ] **Access Ready**: Ensure database admin access is available

---

## 🚀 EXECUTION STEPS

### Step 1: Pre-Migration Verification

**Run these queries FIRST** to verify current state:

```sql
-- Check current triggers
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'game_stats'
AND event_object_schema = 'public'
AND (trigger_name LIKE '%score%' OR trigger_name LIKE '%foul%')
ORDER BY trigger_name;

-- Check current functions
SELECT 
  p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('update_game_scores', 'increment_team_fouls')
ORDER BY p.proname;
```

**Expected Results**:
- Should see triggers: `game_stats_update_scores`, `increment_team_fouls_trigger`
- Should see functions: `update_game_scores()`, `increment_team_fouls()`

**If these don't exist**, migration may have already been applied or system is in unexpected state.

---

### Step 2: Execute Migration

**Method 1: Supabase Dashboard (Recommended)**

1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `020_optimize_trigger_lock_contention_PRODUCTION.sql`
3. Paste into SQL Editor
4. Click "Run" or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)
5. Wait for completion (should complete in < 10 seconds)

**Method 2: psql Command Line**

```bash
psql -h [your-host] -U [your-user] -d [your-database] -f 020_optimize_trigger_lock_contention_PRODUCTION.sql
```

**Method 3: Supabase CLI**

```bash
supabase db execute -f 020_optimize_trigger_lock_contention_PRODUCTION.sql
```

---

### Step 3: Verify Migration Success

**Run these queries AFTER migration**:

```sql
-- Verify new triggers exist (should return 3 rows)
SELECT 
  trigger_name,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'game_stats'
AND event_object_schema = 'public'
AND trigger_name LIKE '%scores_and_fouls%'
ORDER BY trigger_name;

-- Verify old triggers are gone (should return 0 rows)
SELECT 
  trigger_name
FROM information_schema.triggers
WHERE event_object_table = 'game_stats'
AND event_object_schema = 'public'
AND (trigger_name = 'game_stats_update_scores' OR trigger_name = 'increment_team_fouls_trigger');

-- Verify new functions exist (should return 3 rows)
SELECT 
  p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('update_game_scores_and_fouls', 'update_game_scores_and_fouls_on_delete', 'update_game_scores_and_fouls_on_update')
ORDER BY p.proname;
```

**Expected Results**:
- ✅ 3 new triggers: `game_stats_update_scores_and_fouls`, `game_stats_delete_update_scores_and_fouls`, `game_stats_update_update_scores_and_fouls`
- ✅ 0 old triggers: `game_stats_update_scores` and `increment_team_fouls_trigger` removed
- ✅ 3 new functions exist
- ✅ 0 old functions remain

---

### Step 4: Functional Testing

**Test in Application**:

1. **Test Score Update**:
   - Record a made shot (2PT or 3PT)
   - Verify score increments correctly
   - Check `games.home_score` or `games.away_score` in database

2. **Test Foul Aggregation**:
   - Record a foul for a player
   - Verify `games.team_a_fouls` or `games.team_b_fouls` increments by 1
   - **CRITICAL**: Verify foul count updates IMMEDIATELY (real-time)

3. **Test Stat Deletion**:
   - Delete a stat from stat editor
   - Verify score/fouls decrement correctly

4. **Test Stat Edit**:
   - Edit a stat (change team or type)
   - Verify scores/fouls update correctly

5. **Monitor for Errors**:
   - Watch for timeout errors (code 57014) → Should be eliminated
   - Check application logs for any trigger-related errors

---

## ⚠️ TROUBLESHOOTING

### Issue: Migration Fails with "Function Already Exists"

**Solution**: This is normal if migration was partially run. The `CREATE OR REPLACE FUNCTION` statements will handle this. Continue with migration.

### Issue: Old Triggers Still Exist After Migration

**Solution**: Manually drop them:
```sql
DROP TRIGGER IF EXISTS game_stats_update_scores ON game_stats;
DROP TRIGGER IF EXISTS increment_team_fouls_trigger ON game_stats;
```

### Issue: Team Fouls Not Incrementing

**Solution**: 
1. Verify new trigger exists: `game_stats_update_scores_and_fouls`
2. Check function code includes foul increment logic (lines 51-59)
3. Test with a simple foul insert:
```sql
INSERT INTO game_stats (game_id, team_id, stat_type, modifier, stat_value)
VALUES ('[test-game-id]', '[test-team-id]', 'foul', 'personal', 1);
```
4. Verify `team_a_fouls` or `team_b_fouls` increments

### Issue: Lock Contention Still Occurs

**Solution**:
1. Verify only ONE trigger fires per INSERT (check trigger count)
2. Verify combined function uses single UPDATE statement
3. Check for other triggers updating `games` table
4. Review application logs for concurrent write patterns

---

## 🔄 ROLLBACK PROCEDURE

**If migration causes issues**, rollback requires restoring old trigger functions.

**Option 1: Restore from Backup**
- Restore database from pre-migration backup

**Option 2: Manual Rollback** (Requires original function definitions)
- See rollback script in migration file (commented section)
- Requires original `update_game_scores()` and `increment_team_fouls()` function definitions from previous migrations

**Note**: Rollback is complex because old functions need to be recreated. Ensure backup exists before migration.

---

## ✅ SUCCESS CRITERIA

Migration is successful if:

- [x] 3 new combined triggers exist
- [x] 0 old triggers remain
- [x] 3 new functions exist
- [x] 0 old functions remain
- [x] Scores update correctly when stats recorded
- [x] Team fouls increment correctly when fouls recorded
- [x] No timeout errors (code 57014) occur
- [x] Real-time aggregation works (fouls update immediately)

---

## 📊 EXPECTED IMPROVEMENTS

After successful migration:

- ✅ **Lock Contention**: Eliminated (single UPDATE instead of multiple)
- ✅ **Performance**: Faster stat recording (one lock acquisition)
- ✅ **Reliability**: No more timeout errors (code 57014)
- ✅ **Functionality**: 100% preserved (scores and fouls still aggregate)

---

## 📝 POST-MIGRATION MONITORING

**Monitor for 24-48 hours**:

1. **Error Logs**: Check for any trigger-related errors
2. **Performance**: Monitor stat recording latency
3. **Data Integrity**: Spot-check scores and foul counts for accuracy
4. **User Reports**: Monitor for any user-reported issues

**If issues occur**: Refer to Rollback Procedure above.

---

## 🎯 SUMMARY

**Migration Type**: Database trigger optimization  
**Risk**: Low (non-destructive, preserves functionality)  
**Downtime**: None required  
**Rollback**: Possible but requires backup or manual function recreation  
**Testing**: Required (functional tests after migration)  

**Key Point**: This migration improves performance without changing functionality. Team fouls still aggregate in real-time, just more efficiently.

---

**Questions or Issues?** Refer to `FINAL_TRIGGER_LOCK_CONTENTION_AUDIT.md` for detailed technical analysis.

