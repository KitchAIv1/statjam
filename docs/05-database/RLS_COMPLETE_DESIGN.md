# 🔒 StatJam RLS Complete Design & Implementation Plan

**Date**: October 18, 2025  
**Status**: ✅ FINAL AUTHORITATIVE VERSION  
**Purpose**: Fix RLS policies once and for all - eliminate timeouts and circular dependencies  
**Implementation**: `FINAL_RLS_CLEAN_SLATE.sql` (executes this design)

---

## 📋 **Executive Summary**

**Problem**: Complex RLS policies with multi-table JOINs are causing 10-15 second database timeouts.

**Root Causes**:
1. `users_organizer_select_policy` - 3-table JOIN (teams → tournaments → team_players)
2. `users_stat_admin_game_policy` - Complex tournaments JOIN
3. Circular dependencies between policies
4. No clear access control matrix

**Solution**: Complete RLS redesign with simple, performant policies based on clear role-based access requirements.

---

## 🎯 **Role-Based Access Requirements**

### **1. Organizer Role**
**What they need access to**:
- ✅ Their own profile (users table)
- ✅ Tournaments they created (tournaments table)
- ✅ Teams in their tournaments (teams table)
- ✅ Players in their teams (users table via team_players)
- ✅ Games in their tournaments (games table)
- ✅ Stats for games in their tournaments (game_stats table)

**What they DON'T need**:
- ❌ Other organizers' tournaments
- ❌ Players not in their teams
- ❌ Stats from other tournaments

### **2. Stat Admin Role**
**What they need access to**:
- ✅ Their own profile (users table)
- ✅ Games assigned to them (games table)
- ✅ Players in assigned games (users table via team_players)
- ✅ Teams in assigned games (teams table)
- ✅ Tournament info for assigned games (tournaments table)
- ✅ Record stats for assigned games (game_stats table)

**What they DON'T need**:
- ❌ Games not assigned to them
- ❌ Players not in their assigned games
- ❌ Other tournaments

### **3. Player Role**
**What they need access to**:
- ✅ Their own profile (users table)
- ✅ Teams they're on (teams table via team_players)
- ✅ Games they're playing in (games table)
- ✅ Their own stats (game_stats table)
- ✅ Tournament info for their games (tournaments table)

**What they DON'T need**:
- ❌ Other players' profiles
- ❌ Teams they're not on
- ❌ Games they're not in

### **4. Public/Anon Role**
**What they need access to**:
- ✅ Public tournaments (tournaments table where is_public = true)
- ✅ Teams in public tournaments (teams table)
- ✅ Live games in public tournaments (games table)
- ✅ Stats for public games (game_stats table)
- ✅ Player names for public games (users table - name only)

**What they DON'T need**:
- ❌ Private tournaments
- ❌ User emails or sensitive data
- ❌ Draft games

---

## 🗄️ **Table-by-Table RLS Policy Design**

### **1. USERS Table**

**Current Problematic Policies** (TO BE REMOVED):
- ❌ `users_organizer_select_policy` - Complex 3-table JOIN causing timeouts
- ❌ `users_stat_admin_game_policy` - Complex tournaments JOIN causing timeouts

**New Simple Policies**:

```sql
-- ✅ POLICY 1: Self-access (all users can see/update their own profile)
CREATE POLICY "users_self_access" ON users
  FOR ALL
  TO authenticated
  USING (id = auth.uid());

-- ✅ POLICY 2: Organizers can see players in their teams
CREATE POLICY "users_organizer_team_players" ON users
  FOR SELECT
  TO authenticated
  USING (
    role = 'player' 
    AND id IN (
      SELECT tp.player_id 
      FROM team_players tp
      JOIN teams t ON t.id = tp.team_id
      JOIN tournaments tr ON tr.id = t.tournament_id
      WHERE tr.organizer_id = auth.uid()
    )
  );

-- ✅ POLICY 3: Stat admins can see players in their assigned games
CREATE POLICY "users_stat_admin_game_players" ON users
  FOR SELECT
  TO authenticated
  USING (
    role = 'player'
    AND id IN (
      SELECT tp.player_id
      FROM team_players tp
      WHERE tp.team_id IN (
        SELECT team_a_id FROM games WHERE stat_admin_id = auth.uid()
        UNION
        SELECT team_b_id FROM games WHERE stat_admin_id = auth.uid()
      )
    )
  );

-- ✅ POLICY 4: Public can see player names for public games
CREATE POLICY "users_public_player_names" ON users
  FOR SELECT
  TO anon
  USING (
    role = 'player'
    AND id IN (
      SELECT tp.player_id
      FROM team_players tp
      JOIN teams t ON t.id = tp.team_id
      JOIN tournaments tr ON tr.id = t.tournament_id
      WHERE tr.is_public = true
    )
  );

-- ✅ POLICY 5: New user sign-ups
CREATE POLICY "users_insert_new" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());
```

**Why This Works**:
- ✅ No circular dependencies
- ✅ Each policy has a clear, single purpose
- ✅ Subqueries are simple and indexed
- ✅ No multi-table JOINs in the main USING clause

---

### **2. TOURNAMENTS Table**

**New Simple Policies**:

```sql
-- ✅ POLICY 1: Organizers manage their own tournaments
CREATE POLICY "tournaments_organizer_access" ON tournaments
  FOR ALL
  TO authenticated
  USING (organizer_id = auth.uid());

-- ✅ POLICY 2: Public can view public tournaments
CREATE POLICY "tournaments_public_view" ON tournaments
  FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

-- ✅ POLICY 3: Stat admins can view tournaments for their assigned games
CREATE POLICY "tournaments_stat_admin_view" ON tournaments
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT tournament_id 
      FROM games 
      WHERE stat_admin_id = auth.uid()
    )
  );

-- ✅ POLICY 4: Players can view tournaments for their teams
CREATE POLICY "tournaments_player_view" ON tournaments
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT t.tournament_id
      FROM teams t
      JOIN team_players tp ON tp.team_id = t.id
      WHERE tp.player_id = auth.uid()
    )
  );
```

---

### **3. TEAMS Table**

**New Simple Policies**:

```sql
-- ✅ POLICY 1: Organizers manage teams in their tournaments
CREATE POLICY "teams_organizer_access" ON teams
  FOR ALL
  TO authenticated
  USING (
    tournament_id IN (
      SELECT id FROM tournaments WHERE organizer_id = auth.uid()
    )
  );

-- ✅ POLICY 2: Public can view teams in public tournaments
CREATE POLICY "teams_public_view" ON teams
  FOR SELECT
  TO anon, authenticated
  USING (
    tournament_id IN (
      SELECT id FROM tournaments WHERE is_public = true
    )
  );

-- ✅ POLICY 3: Stat admins can view teams in their assigned games
CREATE POLICY "teams_stat_admin_view" ON teams
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT team_a_id FROM games WHERE stat_admin_id = auth.uid()
      UNION
      SELECT team_b_id FROM games WHERE stat_admin_id = auth.uid()
    )
  );

-- ✅ POLICY 4: Players can view their own teams
CREATE POLICY "teams_player_view" ON teams
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT team_id FROM team_players WHERE player_id = auth.uid()
    )
  );
```

---

### **4. GAMES Table**

**New Simple Policies**:

```sql
-- ✅ POLICY 1: Organizers manage games in their tournaments
CREATE POLICY "games_organizer_access" ON games
  FOR ALL
  TO authenticated
  USING (
    tournament_id IN (
      SELECT id FROM tournaments WHERE organizer_id = auth.uid()
    )
  );

-- ✅ POLICY 2: Stat admins manage their assigned games
CREATE POLICY "games_stat_admin_access" ON games
  FOR ALL
  TO authenticated
  USING (stat_admin_id = auth.uid());

-- ✅ POLICY 3: Public can view live games in public tournaments
CREATE POLICY "games_public_view" ON games
  FOR SELECT
  TO anon, authenticated
  USING (
    tournament_id IN (
      SELECT id FROM tournaments WHERE is_public = true
    )
    AND status IN ('live', 'in_progress', 'overtime', 'completed')
  );

-- ✅ POLICY 4: Players can view their games
CREATE POLICY "games_player_view" ON games
  FOR SELECT
  TO authenticated
  USING (
    team_a_id IN (SELECT team_id FROM team_players WHERE player_id = auth.uid())
    OR
    team_b_id IN (SELECT team_id FROM team_players WHERE player_id = auth.uid())
  );
```

---

### **5. GAME_STATS Table**

**New Simple Policies**:

```sql
-- ✅ POLICY 1: Stat admins can insert/delete stats for their assigned games
CREATE POLICY "game_stats_stat_admin_access" ON game_stats
  FOR ALL
  TO authenticated
  USING (
    game_id IN (
      SELECT id FROM games WHERE stat_admin_id = auth.uid()
    )
  );

-- ✅ POLICY 2: Public can view stats for public games
CREATE POLICY "game_stats_public_view" ON game_stats
  FOR SELECT
  TO anon, authenticated
  USING (
    game_id IN (
      SELECT g.id 
      FROM games g
      JOIN tournaments t ON t.id = g.tournament_id
      WHERE t.is_public = true
    )
  );

-- ✅ POLICY 3: Players can view their own stats
CREATE POLICY "game_stats_player_view" ON game_stats
  FOR SELECT
  TO authenticated
  USING (player_id = auth.uid());

-- ✅ POLICY 4: Organizers can view stats in their tournaments
CREATE POLICY "game_stats_organizer_view" ON game_stats
  FOR SELECT
  TO authenticated
  USING (
    game_id IN (
      SELECT g.id
      FROM games g
      JOIN tournaments t ON t.id = g.tournament_id
      WHERE t.organizer_id = auth.uid()
    )
  );
```

---

### **6. TEAM_PLAYERS Table**

**New Simple Policies**:

```sql
-- ✅ POLICY 1: Organizers manage team rosters in their tournaments
CREATE POLICY "team_players_organizer_access" ON team_players
  FOR ALL
  TO authenticated
  USING (
    team_id IN (
      SELECT t.id
      FROM teams t
      JOIN tournaments tr ON tr.id = t.tournament_id
      WHERE tr.organizer_id = auth.uid()
    )
  );

-- ✅ POLICY 2: Public can view rosters for public tournaments
CREATE POLICY "team_players_public_view" ON team_players
  FOR SELECT
  TO anon, authenticated
  USING (
    team_id IN (
      SELECT t.id
      FROM teams t
      JOIN tournaments tr ON tr.id = t.tournament_id
      WHERE tr.is_public = true
    )
  );

-- ✅ POLICY 3: Stat admins can view rosters for their assigned games
CREATE POLICY "team_players_stat_admin_view" ON team_players
  FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT team_a_id FROM games WHERE stat_admin_id = auth.uid()
      UNION
      SELECT team_b_id FROM games WHERE stat_admin_id = auth.uid()
    )
  );

-- ✅ POLICY 4: Players can view their own team rosters
CREATE POLICY "team_players_player_view" ON team_players
  FOR SELECT
  TO authenticated
  USING (
    player_id = auth.uid()
    OR
    team_id IN (
      SELECT team_id FROM team_players WHERE player_id = auth.uid()
    )
  );
```

---

## 🚀 **Migration Plan**

### **Phase 1: Backup & Audit (5 minutes)**

```sql
-- 1. Export current policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual as using_clause
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 2. Save to file: current_rls_policies_backup.sql
```

### **Phase 2: Drop All Existing Policies (2 minutes)**

```sql
-- Drop all policies on users table
DROP POLICY IF EXISTS "users_self_access_policy" ON users;
DROP POLICY IF EXISTS "users_view_own_profile" ON users;
DROP POLICY IF EXISTS "users_organizer_select_policy" ON users;
DROP POLICY IF EXISTS "users_stat_admin_game_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_self_update_policy" ON users;
DROP POLICY IF EXISTS "users_update_own_profile" ON users;

-- Drop all policies on other tables (tournaments, teams, games, etc.)
-- [Full list in migration SQL file]
```

### **Phase 3: Create New Policies (5 minutes)**

Apply all new policies from sections above in order:
1. Users table policies
2. Tournaments table policies
3. Teams table policies
4. Games table policies
5. Game_stats table policies
6. Team_players table policies

### **Phase 4: Test & Verify (10 minutes)**

```sql
-- Test 1: Organizer can see their tournaments
SET request.jwt.claims.sub = '<organizer_id>';
SELECT * FROM tournaments WHERE organizer_id = '<organizer_id>';

-- Test 2: Stat admin can see assigned games
SET request.jwt.claims.sub = '<stat_admin_id>';
SELECT * FROM games WHERE stat_admin_id = '<stat_admin_id>';

-- Test 3: Public can see live games
SET ROLE anon;
SELECT * FROM games WHERE status = 'live';

-- Test 4: Performance check (should be < 100ms)
EXPLAIN ANALYZE SELECT * FROM users WHERE id = '<user_id>';
```

---

## ✅ **Success Criteria**

1. **Performance**: All queries < 1 second (target: < 100ms)
2. **Security**: Each role can only access their authorized data
3. **No Timeouts**: GameServiceV2 and V1 work instantly
4. **No Circular Dependencies**: No policy references its own table recursively
5. **Maintainability**: Each policy has a single, clear purpose

---

## 📊 **Performance Optimization**

### **Required Indexes**

```sql
-- Users table
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Tournaments table
CREATE INDEX IF NOT EXISTS idx_tournaments_organizer ON tournaments(organizer_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_public ON tournaments(is_public) WHERE is_public = true;

-- Teams table
CREATE INDEX IF NOT EXISTS idx_teams_tournament ON teams(tournament_id);

-- Games table
CREATE INDEX IF NOT EXISTS idx_games_tournament ON games(tournament_id);
CREATE INDEX IF NOT EXISTS idx_games_stat_admin ON games(stat_admin_id) WHERE stat_admin_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_games_teams ON games(team_a_id, team_b_id);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);

-- Game_stats table
CREATE INDEX IF NOT EXISTS idx_game_stats_game ON game_stats(game_id);
CREATE INDEX IF NOT EXISTS idx_game_stats_player ON game_stats(player_id);

-- Team_players table
CREATE INDEX IF NOT EXISTS idx_team_players_team ON team_players(team_id);
CREATE INDEX IF NOT EXISTS idx_team_players_player ON team_players(player_id);
```

---

## 🔒 **Security Validation**

### **Test Cases**

1. ✅ Organizer CANNOT see other organizers' tournaments
2. ✅ Stat admin CANNOT see games not assigned to them
3. ✅ Player CANNOT see other players' profiles
4. ✅ Public CANNOT see private tournaments
5. ✅ Anon users CANNOT modify any data
6. ✅ Users CAN update their own profiles
7. ✅ Stat admins CAN record stats for assigned games
8. ✅ Organizers CAN manage their tournaments

---

## 📝 **Next Steps**

1. **Review this document** - Validate the access requirements match your needs
2. **Create migration SQL** - Combine all policies into executable SQL file
3. **Test in staging** - Apply to a test database first
4. **Apply to production** - Execute migration during low-traffic period
5. **Monitor performance** - Check query times and logs
6. **Update documentation** - Reflect new RLS design in all docs

---

**Status**: Ready for review and approval  
**Estimated Migration Time**: 25 minutes total  
**Risk Level**: Low (can rollback to current policies if needed)

