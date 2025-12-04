# Migration 021 Test Checklist - Verify Live Stat Tracking

**Migration:** `021_add_game_phase.sql`  
**Date:** December 4, 2024  
**Purpose:** Verify that adding `game_phase` column didn't break live stat tracking

---

## ✅ Pre-Test Verification

**Column Status:** ✅ Confirmed
```json
{
  "column_name": "game_phase",
  "data_type": "text",
  "is_nullable": "YES",
  "column_default": "'regular'::text"
}
```

**Expected:** Column exists, nullable, has default value ✅

---

## 🧪 Test Checklist

### 1. **Stat Recording (Critical)**

**Test:** Record a stat during a live game

**Steps:**
1. Start a game (or use existing in-progress game)
2. Record a stat (2PT made, 3PT made, assist, rebound, etc.)
3. Verify stat appears in play-by-play feed
4. Check browser console for errors

**Expected Results:**
- ✅ Stat inserts successfully into `game_stats` table
- ✅ Stat appears in play-by-play immediately
- ✅ No database errors in console
- ✅ No trigger errors

**SQL Verification:**
```sql
-- Check most recent stat was recorded
SELECT id, game_id, stat_type, stat_value, created_at
FROM game_stats
ORDER BY created_at DESC
LIMIT 1;
```

---

### 2. **Score Updates (Critical)**

**Test:** Verify scores update when stats are recorded

**Steps:**
1. Record a 2PT made (should add 2 points)
2. Record a 3PT made (should add 3 points)
3. Check game scores update correctly

**Expected Results:**
- ✅ `home_score` or `away_score` updates correctly
- ✅ Score matches sum of points in `game_stats`
- ✅ Score updates within 1-2 seconds

**SQL Verification:**
```sql
-- Check game scores match calculated scores
SELECT 
  g.id,
  g.home_score as db_home_score,
  g.away_score as db_away_score,
  (SELECT COALESCE(SUM(stat_value), 0) 
   FROM game_stats 
   WHERE game_id = g.id AND team_id = g.team_a_id AND modifier = 'made') as calculated_home_score,
  (SELECT COALESCE(SUM(stat_value), 0) 
   FROM game_stats 
   WHERE game_id = g.id AND team_id = g.team_b_id AND modifier = 'made') as calculated_away_score
FROM games g
WHERE g.status = 'in_progress'
LIMIT 1;
```

**Expected:** `db_home_score` ≈ `calculated_home_score`, `db_away_score` ≈ `calculated_away_score`

---

### 3. **Team Fouls Updates (Critical)**

**Test:** Verify team fouls increment when fouls are recorded

**Steps:**
1. Record a foul for Team A
2. Check `team_a_fouls` increments
3. Record a foul for Team B
4. Check `team_b_fouls` increments

**Expected Results:**
- ✅ `team_a_fouls` increments by 1
- ✅ `team_b_fouls` increments by 1
- ✅ Fouls update within 1-2 seconds

**SQL Verification:**
```sql
-- Check team fouls match foul count
SELECT 
  g.id,
  g.team_a_fouls as db_team_a_fouls,
  g.team_b_fouls as db_team_b_fouls,
  (SELECT COUNT(*) 
   FROM game_stats 
   WHERE game_id = g.id AND team_id = g.team_a_id AND stat_type = 'foul') as calculated_team_a_fouls,
  (SELECT COUNT(*) 
   FROM game_stats 
   WHERE game_id = g.id AND team_id = g.team_b_id AND stat_type = 'foul') as calculated_team_b_fouls
FROM games g
WHERE g.status = 'in_progress'
LIMIT 1;
```

**Expected:** `db_team_a_fouls` = `calculated_team_a_fouls`, `db_team_b_fouls` = `calculated_team_b_fouls`

---

### 4. **Trigger Execution (Critical)**

**Test:** Verify triggers still fire correctly

**Steps:**
1. Record a stat
2. Check trigger logs (if enabled)
3. Verify `updated_at` timestamp changes

**Expected Results:**
- ✅ Triggers fire without errors
- ✅ `games.updated_at` updates on stat insert
- ✅ No trigger lock contention errors

**SQL Verification:**
```sql
-- Check triggers are active
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'games'
ORDER BY trigger_name;
```

**Expected:** All triggers present (e.g., `game_stats_update_scores`, `update_games_updated_at`)

---

### 5. **Real-Time Updates (Critical)**

**Test:** Verify WebSocket/real-time subscriptions still work

**Steps:**
1. Open game viewer in browser
2. Record a stat in another tab/window
3. Verify stat appears in real-time in game viewer

**Expected Results:**
- ✅ Stat appears in play-by-play feed immediately
- ✅ Score updates in real-time
- ✅ No WebSocket connection errors
- ✅ No subscription errors

**Browser Console Check:**
- ✅ No WebSocket errors
- ✅ No subscription errors
- ✅ No database query errors

---

### 6. **Stat Deletion (Important)**

**Test:** Verify stat deletion still works

**Steps:**
1. Record a stat
2. Delete the stat (undo)
3. Verify score/fouls decrement correctly

**Expected Results:**
- ✅ Stat deletes successfully
- ✅ Score decrements correctly
- ✅ Fouls decrement correctly (if foul was deleted)
- ✅ Play-by-play updates immediately

**SQL Verification:**
```sql
-- After deleting a stat, verify scores updated
SELECT 
  g.id,
  g.home_score,
  g.away_score,
  (SELECT COALESCE(SUM(stat_value), 0) 
   FROM game_stats 
   WHERE game_id = g.id AND team_id = g.team_a_id AND modifier = 'made') as calculated_home_score
FROM games g
WHERE g.id = '<your-game-id>';
```

**Expected:** Scores match calculated values

---

### 7. **Multiple Concurrent Stats (Important)**

**Test:** Record multiple stats quickly

**Steps:**
1. Record 5-10 stats in quick succession
2. Verify all stats are recorded
3. Verify scores update correctly
4. Check for any lock contention errors

**Expected Results:**
- ✅ All stats recorded successfully
- ✅ Scores accurate after all stats
- ✅ No database timeout errors
- ✅ No lock contention errors

---

### 8. **Game Phase Column (Verification)**

**Test:** Verify `game_phase` column doesn't interfere

**Steps:**
1. Check existing games have `game_phase` set
2. Create a new game
3. Verify `game_phase` defaults to 'regular'

**SQL Verification:**
```sql
-- Check game_phase values
SELECT 
  id,
  status,
  game_phase,
  created_at
FROM games
ORDER BY created_at DESC
LIMIT 5;
```

**Expected:**
- ✅ All existing games have `game_phase = 'regular'` or NULL (will be set to 'regular')
- ✅ New games have `game_phase = 'regular'` by default

---

## 🚨 Critical Failure Indicators

**If you see any of these, STOP and investigate:**

1. ❌ Stats not recording (INSERT fails)
2. ❌ Scores not updating after stat insert
3. ❌ Database timeout errors (code 57014)
4. ❌ Trigger errors in logs
5. ❌ Lock contention errors
6. ❌ WebSocket connection failures
7. ❌ Real-time updates not working

---

## ✅ Success Criteria

**All tests must pass:**

- ✅ Stats record successfully
- ✅ Scores update correctly
- ✅ Team fouls update correctly
- ✅ Triggers fire without errors
- ✅ Real-time updates work
- ✅ Stat deletion works
- ✅ No database errors
- ✅ No performance degradation

---

## 📝 Test Results Template

```
Test Date: ___________
Tester: ___________
Game ID: ___________

[ ] 1. Stat Recording - PASS / FAIL
[ ] 2. Score Updates - PASS / FAIL
[ ] 3. Team Fouls Updates - PASS / FAIL
[ ] 4. Trigger Execution - PASS / FAIL
[ ] 5. Real-Time Updates - PASS / FAIL
[ ] 6. Stat Deletion - PASS / FAIL
[ ] 7. Multiple Concurrent Stats - PASS / FAIL
[ ] 8. Game Phase Column - PASS / FAIL

Overall Result: ✅ PASS / ❌ FAIL

Notes:
_________________________________________________
_________________________________________________
```

---

## 🔧 Quick SQL Health Check

Run this to verify everything is working:

```sql
-- Comprehensive health check
SELECT 
  'Games with game_phase' as check_type,
  COUNT(*) as count,
  COUNT(CASE WHEN game_phase IS NULL THEN 1 END) as null_count
FROM games
UNION ALL
SELECT 
  'Recent stats (last hour)' as check_type,
  COUNT(*) as count,
  0 as null_count
FROM game_stats
WHERE created_at > NOW() - INTERVAL '1 hour'
UNION ALL
SELECT 
  'Active games' as check_type,
  COUNT(*) as count,
  0 as null_count
FROM games
WHERE status = 'in_progress';
```

**Expected:**
- ✅ All games have `game_phase` (or NULL which will be set to 'regular')
- ✅ Recent stats are being recorded
- ✅ Active games exist (if any)

---

*Test checklist created: December 4, 2024*

