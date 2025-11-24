# Trigger Lock Contention Fix - Database Timeout Resolution

**Date**: January 2025  
**Status**: 🔧 FIX IDENTIFIED  
**Priority**: 🔴 CRITICAL - Resolves code 57014 timeouts

---

## 🎯 Executive Summary

**Root Cause**: Multiple triggers updating the same `games` table row simultaneously cause lock contention, leading to database timeouts (code 57014).

**Solution**: Combine all `games` table updates into a single UPDATE statement per trigger, eliminating lock contention.

---

## 🔍 Root Cause Analysis

### Verification Results

✅ **Trigger Functions**: All 3 score triggers are optimized (incremental, not SUM)  
✅ **Indexes**: Good indexes on `games` table  
⚠️ **Lock Contention**: **IDENTIFIED**

### The Problem

When a stat is inserted into `game_stats`, **3 triggers fire**:

1. **`update_game_scores()`** ✅ Fast (incremental)
   - Updates `games.home_score` and `games.away_score`
   - Locks `games` row

2. **`increment_team_fouls()`** ⚠️ **LOCK CONTENTION**
   - Updates `games.team_a_fouls` and `games.team_b_fouls`
   - Tries to lock the **same `games` row**
   - **Two separate UPDATE statements** (one for team A, one for team B)

3. **`update_player_stats()`** ❓ Unknown (needs verification)
   - May also update tables, causing additional contention

### Lock Contention Sequence

```
Stat INSERT → Trigger 1 (update_game_scores) → Locks games row → Updates scores
           → Trigger 2 (increment_team_fouls) → Waits for lock → Updates fouls
           → Trigger 3 (update_player_stats) → May wait/contend
```

**Result**: Even though triggers are sequential, multiple UPDATEs on the same row cause:
- Lock wait times
- Database statement timeouts (code 57014)
- Failed stat recordings

---

## ✅ Solution

### Migration: `020_optimize_trigger_lock_contention.sql`

**Strategy**: Combine all `games` table updates into **single UPDATE statements** per trigger.

### Key Changes

1. **New Combined Function**: `update_game_scores_and_fouls()`
   - Handles **both scores AND fouls** in one UPDATE
   - Single lock acquisition = no contention

2. **Single UPDATE Statement**:
   ```sql
   UPDATE games
   SET 
     home_score = CASE WHEN ... THEN home_score + points ELSE home_score END,
     away_score = CASE WHEN ... THEN away_score + points ELSE away_score END,
     team_a_fouls = CASE WHEN ... THEN team_a_fouls + 1 ELSE team_a_fouls END,
     team_b_fouls = CASE WHEN ... THEN team_b_fouls + 1 ELSE team_b_fouls END,
     updated_at = NOW()
   WHERE id = NEW.game_id;
   ```

3. **Three Combined Triggers**:
   - INSERT: `game_stats_update_scores_and_fouls`
   - DELETE: `game_stats_delete_update_scores_and_fouls`
   - UPDATE: `game_stats_update_update_scores_and_fouls`

4. **Old Triggers Removed**:
   - `game_stats_update_scores` (old)
   - `increment_team_fouls_trigger` (old)
   - Old functions dropped

---

## 📊 Expected Impact

### Before Fix
- **3 triggers** fire per stat insert
- **2-3 separate UPDATEs** on `games` table
- **Lock contention** between triggers
- **Timeouts** (code 57014) on concurrent writes
- **Failed stat recordings**

### After Fix
- **1 trigger** fires per stat insert
- **1 single UPDATE** on `games` table
- **No lock contention** (single lock acquisition)
- **No timeouts** (faster execution)
- **Reliable stat recordings**

---

## 🧪 Testing Checklist

After applying migration:

- [ ] Verify new triggers exist (3 combined triggers)
- [ ] Verify old triggers removed (score + foul triggers)
- [ ] Test stat recording (made shot)
- [ ] Test stat recording (foul)
- [ ] Test stat recording (made shot + assist sequence)
- [ ] Test stat deletion
- [ ] Test stat update/edit
- [ ] Monitor for timeouts (code 57014)
- [ ] Verify scores update correctly
- [ ] Verify fouls increment correctly

---

## ⚠️ Important Notes

1. **`update_player_stats()`**: Still needs verification
   - If it also updates `games` table, may need to include in combined trigger
   - Run `VERIFY_OTHER_TRIGGERS.sql` to check

2. **Rollback Plan**: Migration includes cleanup of old functions
   - If issues occur, can rollback by restoring old triggers
   - See `019_optimize_score_triggers_incremental.sql` for reference

3. **Performance**: Single UPDATE is faster than multiple UPDATEs
   - Reduces database round trips
   - Reduces lock acquisition overhead

---

## 📝 Related Files

- **Migration**: `docs/05-database/migrations/020_optimize_trigger_lock_contention.sql`
- **Verification**: `docs/05-database/migrations/VERIFY_TRIGGER_TIMEOUT_ISSUE.sql`
- **Quick Check**: `docs/05-database/migrations/QUICK_VERIFY_TRIGGERS.sql`
- **Other Triggers**: `docs/05-database/migrations/VERIFY_OTHER_TRIGGERS.sql`

---

## 🚀 Next Steps

1. ✅ **Verification Complete** - Root cause identified
2. ⏳ **Apply Migration** - Run `020_optimize_trigger_lock_contention.sql` in Supabase
3. ⏳ **Test** - Verify no timeouts occur
4. ⏳ **Monitor** - Check logs for code 57014 errors
5. ⏳ **Verify `update_player_stats()`** - Check if it needs optimization

