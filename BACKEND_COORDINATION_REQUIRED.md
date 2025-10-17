# 🚨 BACKEND TEAM: URGENT ACTION REQUIRED

**Date**: October 17, 2025  
**Priority**: CRITICAL - System Partially Broken  
**Estimated Fix Time**: 15-30 minutes  

---

## 📋 TLDR: What's Broken

**Live game scores do NOT update in real-time**. The stat tracker records stats successfully, but the live viewer requires manual refresh. Real-time subscriptions are blocked by RLS policies.

---

## 🔧 REQUIRED BACKEND FIXES

### 1. Enable Realtime Replication for Stats Tables

**Location**: Supabase Dashboard → Database → Replication → Publications

**Action**: Add these tables to `supabase_realtime` publication:
- ✅ `games` (already working)
- ❌ `game_stats` (needs to be added)
- ❌ `game_substitutions` (needs to be added)

**SQL Command**:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE game_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE game_substitutions;
```

---

### 2. Add Public SELECT RLS Policies for Real-Time

**Problem**: Real-time subscriptions require SELECT permission. Currently, only authenticated stat admins can view `game_stats`, which blocks real-time broadcasts to live viewers (who might be unauthenticated).

**Solution**: Add public SELECT policies for tables in public tournaments.

```sql
-- Enable public viewing of game_stats for public tournaments
CREATE POLICY "game_stats_public_realtime" 
  ON game_stats FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN tournaments t ON g.tournament_id = t.id
      WHERE g.id = game_stats.game_id
      AND t.is_public = true
    )
  );

-- Enable public viewing of game_substitutions for public tournaments
CREATE POLICY "game_substitutions_public_realtime" 
  ON game_substitutions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN tournaments t ON g.tournament_id = t.id
      WHERE g.id = game_substitutions.game_id
      AND t.is_public = true
    )
  );
```

**Why This Is Safe**:
- Only SELECT permission (read-only)
- Only for public tournaments (is_public = true)
- INSERT/UPDATE/DELETE still protected by existing policies
- Stat admins still need authentication to record stats

---

### 3. Auto-Update Game Scores (Database Trigger)

**Problem**: When a stat is recorded in `game_stats`, the `games.home_score` and `games.away_score` fields are NOT automatically updated. This causes:
- Desync between stat totals and displayed scores
- Extra queries to calculate scores on-demand
- Potential confusion when debugging

**Solution**: Create a database trigger to auto-update scores.

```sql
-- Function to recalculate and update game scores
CREATE OR REPLACE FUNCTION update_game_scores()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate total scores from all game_stats for this game
  UPDATE games
  SET 
    home_score = (
      SELECT COALESCE(SUM(stat_value), 0)
      FROM game_stats
      WHERE game_id = NEW.game_id
      AND team_id = games.team_a_id
      AND stat_value > 0
    ),
    away_score = (
      SELECT COALESCE(SUM(stat_value), 0)
      FROM game_stats
      WHERE game_id = NEW.game_id
      AND team_id = games.team_b_id
      AND stat_value > 0
    ),
    updated_at = NOW()
  WHERE id = NEW.game_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on INSERT to game_stats
CREATE TRIGGER game_stats_update_scores
  AFTER INSERT ON game_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_game_scores();

-- Also trigger on DELETE (in case stats are removed)
CREATE TRIGGER game_stats_delete_update_scores
  AFTER DELETE ON game_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_game_scores();
```

**Benefits**:
- Single source of truth for scores (`games` table)
- Real-time subscriptions on `games` UPDATE will fire when scores change
- No need to query/sum `game_stats` on every page load
- Simpler frontend logic

---

### 4. (OPTIONAL) Add Player Locking Constraint

**Problem**: Players can currently be assigned to multiple teams in the same tournament. This violates the intended business logic.

**Solution**: Add a database constraint or trigger to enforce one-team-per-player-per-tournament.

```sql
-- Option A: Unique constraint (simplest, but rigid)
-- This prevents ANY duplicate player-tournament assignments
-- Problem: Requires dropping and recreating the table or using a composite unique constraint

-- Option B: Database trigger (more flexible)
CREATE OR REPLACE FUNCTION check_player_team_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if player is already assigned to another team in this tournament
  IF EXISTS (
    SELECT 1
    FROM team_players tp
    JOIN teams t ON tp.team_id = t.id
    JOIN teams new_team ON new_team.id = NEW.team_id
    WHERE tp.player_id = NEW.player_id
    AND t.tournament_id = new_team.tournament_id
    AND tp.team_id != NEW.team_id
  ) THEN
    RAISE EXCEPTION 'Player is already assigned to another team in this tournament';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_one_team_per_tournament
  BEFORE INSERT ON team_players
  FOR EACH ROW
  EXECUTE FUNCTION check_player_team_assignment();
```

**Note**: This is marked optional because it might break existing data. Run this query first to check:

```sql
-- Check for existing duplicate assignments
SELECT 
  tp.player_id,
  u.email,
  t.tournament_id,
  array_agg(DISTINCT tp.team_id) as team_ids,
  COUNT(DISTINCT tp.team_id) as team_count
FROM team_players tp
JOIN teams t ON tp.team_id = t.id
JOIN users u ON tp.player_id = u.id
GROUP BY tp.player_id, u.email, t.tournament_id
HAVING COUNT(DISTINCT tp.team_id) > 1;
```

If this returns results, you have duplicate assignments that need to be cleaned up before adding the constraint.

---

## 🧪 TESTING INSTRUCTIONS

After applying the fixes, test with these steps:

### Test Real-Time Subscriptions
1. Open two browser windows side-by-side
2. Window 1: Stat Tracker (logged in as stat admin)
3. Window 2: Live Game Viewer (any user or not logged in)
4. In Window 1: Record a 2-point shot
5. In Window 2: Verify score updates WITHOUT manual refresh
6. Check console logs:
   - Should see: `🔔 SubscriptionManager: New game_stats INSERT detected`
   - Should see: `🔔 V2 Feed: Subscription callback received`
   - Should NOT see: `❌ SubscriptionManager: Channel error`

### Test Score Sync
1. Before recording a stat:
   - Query: `SELECT home_score, away_score FROM games WHERE id = 'your-game-id'`
   - Note the scores
2. Record a 3-point shot
3. Query again: `SELECT home_score, away_score FROM games WHERE id = 'your-game-id'`
4. Verify: Score increased by 3
5. Query: `SELECT SUM(stat_value) FROM game_stats WHERE game_id = 'your-game-id' AND team_id = 'team-id'`
6. Verify: Sum matches `games.home_score` or `games.away_score`

### Test Player Locking (if implemented)
1. Create Team A in Tournament X
2. Add Player 1 to Team A ✅
3. Create Team B in same Tournament X
4. Attempt to add Player 1 to Team B ❌
5. Verify: Error message "Player is already assigned to another team in this tournament"

---

## 📊 EXPECTED CONSOLE OUTPUT (After Fixes)

**Before Fix** (Current State):
```
✅ SubscriptionManager: Channel status: SUBSCRIBED
⏰ Waiting for real-time events...
🔄 GameViewerData: Polling for updates (every 2 seconds) ← FALLBACK ACTIVE
```

**After Fix** (Expected State):
```
✅ SubscriptionManager: Channel status: SUBSCRIBED
🔔 SubscriptionManager: New game_stats INSERT detected ← NEW!
🔔 V2 Feed: Subscription callback received ← NEW!
🔄 V2 Feed: Triggering fetchAll() for game_stats update ← NEW!
✅ Score updated without polling! ← NEW!
```

---

## 🚨 ROLLBACK PLAN

If any fix causes issues, rollback steps:

### Rollback Real-Time Publication
```sql
ALTER PUBLICATION supabase_realtime DROP TABLE game_stats;
ALTER PUBLICATION supabase_realtime DROP TABLE game_substitutions;
```

### Rollback RLS Policies
```sql
DROP POLICY IF EXISTS "game_stats_public_realtime" ON game_stats;
DROP POLICY IF EXISTS "game_substitutions_public_realtime" ON game_substitutions;
```

### Rollback Score Trigger
```sql
DROP TRIGGER IF EXISTS game_stats_update_scores ON game_stats;
DROP TRIGGER IF EXISTS game_stats_delete_update_scores ON game_stats;
DROP FUNCTION IF EXISTS update_game_scores();
```

### Rollback Player Locking
```sql
DROP TRIGGER IF EXISTS enforce_one_team_per_tournament ON team_players;
DROP FUNCTION IF EXISTS check_player_team_assignment();
```

---

## 🎯 SUCCESS CRITERIA

- [ ] Live viewer updates scores without manual refresh
- [ ] Console shows real-time subscription callbacks firing
- [ ] `games.home_score` / `games.away_score` auto-update on stat INSERT
- [ ] Score totals match between `game_stats` SUM and `games` table
- [ ] (Optional) Player assignment validation working

---

## 📞 COORDINATION

**Frontend Developer**: Ready to remove polling fallback once real-time is confirmed working  
**Backend Developer**: Please confirm when fixes are applied to production  
**QA/Testing**: Please verify all test cases pass after deployment

---

**END OF BACKEND REQUIREMENTS - Please notify frontend team when complete**

