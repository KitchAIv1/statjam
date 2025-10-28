# Coach Stat Tracking Test Guide

## 🎯 Purpose

Comprehensive testing guide for coach stat tracking functionality, including setup, test cases, and troubleshooting.

---

## 📋 Prerequisites

### 1. Database Setup

Run these SQL commands to ensure the database is ready:

```sql
-- 1. Verify is_opponent_stat column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'game_stats'
AND column_name = 'is_opponent_stat';

-- 2. Add column if missing
ALTER TABLE game_stats
ADD COLUMN IF NOT EXISTS is_opponent_stat BOOLEAN DEFAULT false;

-- 3. Add index for performance
CREATE INDEX IF NOT EXISTS idx_game_stats_opponent 
ON game_stats(game_id, is_opponent_stat);

-- 4. Update NULL values
UPDATE game_stats
SET is_opponent_stat = false
WHERE is_opponent_stat IS NULL;
```

### 2. Coach Account Setup

```sql
-- 1. Create a test coach account (if not exists)
-- This should be done through the signup flow, but can be verified:
SELECT id, email, role, premium_status
FROM users
WHERE role = 'coach'
LIMIT 5;

-- 2. Verify coach has teams
SELECT 
  t.id,
  t.name,
  t.coach_id,
  COUNT(tp.player_id) + COUNT(tp.custom_player_id) as player_count
FROM teams t
LEFT JOIN team_players tp ON t.id = tp.team_id
WHERE t.coach_id = '<your_coach_user_id>'
GROUP BY t.id, t.name, t.coach_id;

-- Expected: At least 1 team with 5+ players
```

### 3. Test Data Setup

```sql
-- 1. Find or create a coach team
SELECT id, name, coach_id, visibility
FROM teams
WHERE coach_id = '<your_coach_user_id>'
LIMIT 1;

-- 2. Verify team has players
SELECT 
  tp.id,
  tp.team_id,
  tp.player_id,
  tp.custom_player_id,
  u.full_name as regular_player_name,
  cp.name as custom_player_name
FROM team_players tp
LEFT JOIN users u ON tp.player_id = u.id
LEFT JOIN custom_players cp ON tp.custom_player_id = cp.id
WHERE tp.team_id = '<your_team_id>';

-- Expected: At least 5 players (mix of regular and custom)

-- 3. Create a quick track game
-- This is done through the UI, but can be verified:
SELECT 
  g.id,
  g.tournament_id,
  g.team_a_id,
  g.team_b_id,
  g.stat_admin_id,
  g.status,
  t.name as tournament_name
FROM games g
JOIN tournaments t ON g.tournament_id = t.id
WHERE g.stat_admin_id = '<your_coach_user_id>'
AND t.name = 'Coach Games (System)'
ORDER BY g.created_at DESC
LIMIT 1;

-- Expected: Game with matching team_a_id and team_b_id (coach mode)
```

---

## 🧪 Test Cases

### Test Case 1: Coach Team Player Stats

**Objective**: Verify coach's team player stats are tracked correctly

**Steps**:
1. Navigate to Coach Dashboard
2. Click "Quick Track" on a team with 5+ players
3. Select a player from your team
4. Record a stat (e.g., "3PT Made")
5. Verify stat appears in OpponentStatsPanel (top section)

**Expected Results**:
- ✅ Player appears in the stats list
- ✅ Points are added to the player's total
- ✅ Team aggregate stats update
- ✅ Scoreboard shows correct home team score

**SQL Verification**:
```sql
SELECT 
  gs.id,
  gs.player_id,
  gs.custom_player_id,
  gs.is_opponent_stat,
  gs.stat_type,
  gs.modifier,
  gs.stat_value,
  u.full_name as player_name,
  cp.name as custom_player_name
FROM game_stats gs
LEFT JOIN users u ON gs.player_id = u.id
LEFT JOIN custom_players cp ON gs.custom_player_id = cp.id
WHERE gs.game_id = '<your_game_id>'
AND gs.is_opponent_stat = false
ORDER BY gs.created_at DESC
LIMIT 10;
```

**Expected SQL Results**:
- `is_opponent_stat` = `false`
- `player_id` or `custom_player_id` is set
- `stat_value` matches recorded points

---

### Test Case 2: Opponent Team Stats

**Objective**: Verify opponent stats are tracked with correct flag

**Steps**:
1. In the tracker, click "Opponent Team" button
2. Verify "Opponent Team" is selected
3. Record a stat (e.g., "2PT Made")
4. Verify stat appears in OpponentStatsPanel (bottom section)

**Expected Results**:
- ✅ "Opponent Team" shows as selected
- ✅ Points are added to opponent aggregate stats
- ✅ Scoreboard shows correct opponent score
- ✅ Last action shows "Opponent Team: field goal made recorded"

**SQL Verification**:
```sql
SELECT 
  gs.id,
  gs.player_id,
  gs.is_opponent_stat,
  gs.stat_type,
  gs.modifier,
  gs.stat_value,
  gs.team_id
FROM game_stats gs
WHERE gs.game_id = '<your_game_id>'
AND gs.is_opponent_stat = true
ORDER BY gs.created_at DESC
LIMIT 10;
```

**Expected SQL Results**:
- `is_opponent_stat` = `true` ← **CRITICAL**
- `player_id` = coach's user ID (proxy)
- `team_id` = coach's team ID (same as team_a_id)
- `stat_value` matches recorded points

---

### Test Case 3: Mixed Stats (Coach + Opponent)

**Objective**: Verify both coach and opponent stats work together

**Steps**:
1. Record 3 stats for coach's players (e.g., 3 x 2PT Made = 6 points)
2. Record 2 stats for opponent (e.g., 2 x 2PT Made = 4 points)
3. Verify scoreboard shows: Home 6 - Opponent 4

**Expected Results**:
- ✅ Home team score = 6
- ✅ Opponent score = 4
- ✅ Coach player stats show in top section
- ✅ Opponent aggregate stats show in bottom section
- ✅ Both sections update in real-time

**SQL Verification**:
```sql
-- Count stats by type
SELECT 
  is_opponent_stat,
  COUNT(*) as stat_count,
  SUM(CASE 
    WHEN stat_type IN ('field_goal', 'three_pointer', 'free_throw') 
    AND modifier = 'made' 
    THEN stat_value 
    ELSE 0 
  END) as total_points
FROM game_stats
WHERE game_id = '<your_game_id>'
GROUP BY is_opponent_stat;
```

**Expected SQL Results**:
```
is_opponent_stat | stat_count | total_points
false            | 3          | 6
true             | 2          | 4
```

---

### Test Case 4: Custom Player Stats

**Objective**: Verify custom players (non-StatJam users) track correctly

**Steps**:
1. Ensure team has at least 1 custom player
2. Select the custom player
3. Record a stat (e.g., "3PT Made")
4. Verify stat appears in OpponentStatsPanel

**Expected Results**:
- ✅ Custom player appears in stats list
- ✅ Custom player name is displayed correctly
- ✅ Points are added to custom player's total
- ✅ Team aggregate stats update

**SQL Verification**:
```sql
SELECT 
  gs.id,
  gs.custom_player_id,
  gs.is_opponent_stat,
  gs.stat_type,
  gs.modifier,
  gs.stat_value,
  cp.name as custom_player_name
FROM game_stats gs
JOIN custom_players cp ON gs.custom_player_id = cp.id
WHERE gs.game_id = '<your_game_id>'
AND gs.custom_player_id IS NOT NULL
ORDER BY gs.created_at DESC
LIMIT 10;
```

**Expected SQL Results**:
- `custom_player_id` is set (not NULL)
- `player_id` is NULL
- `is_opponent_stat` = `false`
- Custom player name matches

---

### Test Case 5: Real-Time Updates

**Objective**: Verify stats update in real-time via WebSocket

**Steps**:
1. Open tracker in one browser tab
2. Open Live Viewer in another tab (if available)
3. Record a stat in the tracker
4. Verify both tabs update immediately

**Expected Results**:
- ✅ Tracker updates immediately
- ✅ Live Viewer updates within 1-2 seconds
- ✅ No page refresh required
- ✅ WebSocket connection logs show in console

**Console Verification**:
```
✅ HybridService: WebSocket connected for game_stats-game_id=eq.<game_id>
🔔 HybridService: WebSocket event received for game_stats
🔄 SubscriptionManager: New game_stats detected
```

---

### Test Case 6: Substitutions (Future)

**Objective**: Verify player substitutions work in coach mode

**Steps**:
1. Click "SUB" button
2. Select a player to sub out
3. Select a player to sub in
4. Verify roster updates

**Expected Results**:
- ✅ On-court roster shows 5 players
- ✅ Bench roster shows remaining players
- ✅ Substitution is recorded in database
- ✅ Player minutes are calculated correctly

**SQL Verification**:
```sql
SELECT 
  id,
  game_id,
  team_id,
  player_id,
  custom_player_id,
  action,
  quarter,
  game_time_minutes,
  game_time_seconds
FROM game_substitutions
WHERE game_id = '<your_game_id>'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🐛 Troubleshooting

### Issue 1: Opponent Stats Not Showing

**Symptoms**:
- Opponent stats recorded but not appearing in UI
- `useOpponentStats: Found 0 opponent stats` in console

**Diagnosis**:
```sql
-- Check if is_opponent_stat column exists
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'game_stats'
AND column_name = 'is_opponent_stat';

-- Check if flag is being set
SELECT is_opponent_stat, COUNT(*)
FROM game_stats
WHERE game_id = '<your_game_id>'
GROUP BY is_opponent_stat;
```

**Solution**:
1. Run the SQL commands in "Prerequisites > Database Setup"
2. Restart the tracker
3. Record a new opponent stat
4. Verify flag is set correctly

---

### Issue 2: Custom Players Not Loading

**Symptoms**:
- `TeamServiceV3: Found 0 custom player details` in console
- Custom players not appearing in roster

**Diagnosis**:
```sql
-- Check if custom_players table exists
SELECT table_name 
FROM information_schema.tables
WHERE table_name = 'custom_players';

-- Check if team has custom players
SELECT 
  tp.id,
  tp.custom_player_id,
  cp.name
FROM team_players tp
LEFT JOIN custom_players cp ON tp.custom_player_id = cp.id
WHERE tp.team_id = '<your_team_id>'
AND tp.custom_player_id IS NOT NULL;
```

**Solution**:
1. Verify migration `004_coach_team_card_schema.sql` was applied
2. Add custom players through "Manage Players" UI
3. Verify RLS policies allow coach to read custom_players

---

### Issue 3: Scores Not Updating

**Symptoms**:
- Stats recorded but scoreboard doesn't update
- `🔍 Added X points to Team A` in console but score is 0

**Diagnosis**:
```sql
-- Check if stats are being recorded
SELECT 
  stat_type,
  modifier,
  stat_value,
  is_opponent_stat,
  created_at
FROM game_stats
WHERE game_id = '<your_game_id>'
ORDER BY created_at DESC
LIMIT 10;

-- Check game clock state
SELECT 
  id,
  quarter,
  game_clock_minutes,
  game_clock_seconds,
  home_score,
  away_score
FROM games
WHERE id = '<your_game_id>';
```

**Solution**:
1. Verify `useTracker` is calculating scores correctly
2. Check console for `🔄 useTracker: Refreshing scores from database`
3. Verify `is_opponent_stat` flag is set correctly
4. Hard refresh the page (Cmd+Shift+R)

---

### Issue 4: RLS Policy Errors

**Symptoms**:
- 403 Forbidden errors in console
- `TeamServiceV3: Authenticated HTTP request failed`

**Diagnosis**:
```sql
-- Check RLS policies for game_stats
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'game_stats';

-- Check if coach can read their own game stats
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub TO '<your_coach_user_id>';

SELECT COUNT(*)
FROM game_stats
WHERE game_id = '<your_game_id>';
```

**Solution**:
1. Verify migration `004_coach_team_card_schema.sql` Phase 5 was applied
2. Check RLS policies allow coach to:
   - SELECT from `game_stats` where `stat_admin_id` matches
   - INSERT into `game_stats` for their own games
3. Restart Supabase if policies were just added

---

## 📊 Performance Benchmarks

### Expected Load Times

| Operation | Target | Acceptable | Needs Optimization |
|-----------|--------|------------|-------------------|
| Initial Load | < 1s | < 2s | > 3s |
| Stat Recording | < 200ms | < 500ms | > 1s |
| Real-Time Update | < 500ms | < 1s | > 2s |
| Stats Panel Refresh | < 300ms | < 700ms | > 1.5s |

### Console Log Expectations

**Successful Stat Recording**:
```
🏀 Recording regular player stat for ID: <player_id>
🏀 Recording stat to database: { ... }
🚀 GameServiceV3: Recording stat via raw HTTP: { ... }
✅ GameServiceV3: Stat recorded successfully via raw HTTP
✅ Stat recorded successfully in database
🎯 Regular stat - setting last action: <stat_type> <modifier> recorded
```

**Successful Opponent Stat Recording**:
```
🏀 Recording opponent team stat (flagged as opponent), team_id: <team_id>
🏀 Recording stat to database: { ... }
🚀 GameServiceV3: Recording stat via raw HTTP: { ... }
✅ GameServiceV3: Stat recorded successfully via raw HTTP
✅ Stat recorded successfully in database
🎯 Opponent stat - setting last action: Opponent Team: <stat_type> <modifier> recorded
```

---

## 🔗 Related Files

- `src/app/stat-tracker-v3/page.tsx` - Main tracker page with coach mode logic
- `src/hooks/useTracker.ts` - Stat recording and score calculation
- `src/hooks/useTeamStats.ts` - Team and player stats fetching
- `src/hooks/useOpponentStats.ts` - Opponent stats fetching
- `src/components/tracker-v3/OpponentStatsPanel.tsx` - Opponent stats display
- `src/lib/services/gameServiceV3.ts` - Game and stat recording service
- `src/lib/services/teamServiceV3.ts` - Team and player fetching service
- `docs/06-troubleshooting/CHECK_COACH_OPPONENT_STATS.sql` - Diagnostic SQL queries

---

**Last Updated**: 2025-10-28  
**Status**: Active Testing Phase  
**Next Steps**: Complete all test cases and verify opponent stats display correctly

