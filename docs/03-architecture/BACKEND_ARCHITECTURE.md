# 🎯 StatJam System Audit: Ultimate Source of Truth
**Date**: October 17, 2025  
**Status**: CRITICAL RECOVERY DOCUMENT  
**Purpose**: Eliminate hallucinations, document actual implementation

---

## ⚠️ CRITICAL FINDINGS SUMMARY

### 🚨 **PRIMARY ISSUES IDENTIFIED**

1. **Real-Time Subscriptions NOT Working Properly**
   - Subscriptions are created but INSERT events are NOT firing
   - Live viewer requires manual refresh (2-second polling fallback active)
   - RLS policies likely blocking real-time broadcasts
   - Evidence: Channel connects but callbacks never execute

2. **Player Locking NOT Implemented**
   - Players can be assigned to multiple teams simultaneously
   - No database constraints prevent duplicate assignments
   - `team_players` table has no locking mechanism

3. **Score Aggregation Inconsistency**
   - Stats recorded to `game_stats` table
   - Scores calculated by **querying and summing** `game_stats` 
   - `games.home_score` and `games.away_score` are **NOT auto-updated**
   - Potential desync between `game_stats` totals and `games` table scores

4. **Multiple Data Flow Versions**
   - V1: `useGameStream` (legacy)
   - V2: `usePlayFeed` (current)
   - Both systems running simultaneously
   - Confusion about which system is source of truth

---

## ✅ November 2025 Backend Update
- **Demo RLS Hardening**: Added migrations `008`, `009`, `010` so stat admins can safely track demo games (game_stats, stats, games update policies now include `is_demo = true`)
- **Automation Persistence**: `GameServiceV3.updateGameAutomation` can now PATCH demo games thanks to revised `games_update_policy`
- **Documentation**: Demo runbook updated (`database/DEMO_GAME_RLS_FIX_INSTRUCTIONS.md`) and automation presets guide published
- **Tracker UI**: `TopScoreboardV3` demotes live badge to `DEMO` for training games, ensuring architecture reflects UI expectations

---

## 📊 **DATABASE SCHEMA (ACTUAL IMPLEMENTATION)**

### Core Tables (Verified via Code Analysis)

```typescript
// 20 Active Tables in Production
1.  tournaments
2.  teams
3.  team_players
4.  users
5.  games
6.  game_stats
7.  game_substitutions
8.  player_game_stats
9.  subscriptions
10. audit_logs
11. templates (card generation)
12. template_variants (card generation)
13. render_jobs (card generation)
14. player_cards (card generation)
15. player_achievements
16. player_career_highs
17. player_season_averages
18. player_performance_analytics
19. player_notifications
20. players (legacy? not actively used)
```

### Entity Relationships (Real Implementation)

```
┌──────────────┐
│   users      │
│  (role: ...)  │
└──────┬───────┘
       │
       ├──────────────┐
       │              │
       ▼              ▼
┌──────────────┐  ┌──────────────┐
│ tournaments  │  │   team_players│
│ (organizer)  │  │   (players)  │
└───────┬──────┘  └───────┬──────┘
        │                 │
        ▼                 ▼
   ┌────────┐        ┌────────┐
   │ teams  │◄───────┤ teams  │
   └───┬────┘        └────────┘
       │
       ▼
   ┌────────┐
   │ games  │ (team_a_id, team_b_id, stat_admin_id)
   └───┬────┘
       │
       ├─────────────────┐
       ▼                 ▼
┌──────────────┐  ┌─────────────────┐
│  game_stats  │  │game_substitutions│
└──────────────┘  └─────────────────┘
```

---

## 🔄 **DATA FLOW MAPPING**

### **1. ORGANIZER FLOW** ✅ (Mostly Working)

```
User Action → Service → Database → RLS Check → Response

CREATE TOURNAMENT
----------------
1. OrganizerDashboard → TournamentService.createTournament()
2. INSERT INTO tournaments (organizer_id = auth.uid())
3. RLS: tournaments_organizer_policy (organizer_id = auth.uid()) ✅
4. Returns: Tournament object

CREATE TEAM
-----------
1. TeamManagement → TeamService.createTeam()
2. INSERT INTO teams (tournament_id, name)
3. UPDATE tournaments SET current_teams = (SELECT COUNT...)
4. RLS: teams_organizer_policy ✅

ADD PLAYER TO TEAM
------------------
1. PlayerSelection → TeamService.addPlayerToTeam()
2. UPSERT INTO team_players (team_id, player_id)
3. ⚠️ NO LOCKING - Player can be added to multiple teams
4. RLS: Likely no restrictions on team_players

CREATE GAME
-----------
1. GameScheduling → GameService.createGame()
2. INSERT INTO games (tournament_id, team_a_id, team_b_id, stat_admin_id)
3. RLS: games_organizer_policy (via tournament ownership) ✅
```

---

### **2. STATISTICIAN FLOW** ⚠️ (Partially Broken)

```
LAUNCH STAT BOARD
-----------------
1. StatAdminDashboard → getAssignedGames(stat_admin_id)
2. Query: SELECT * FROM games WHERE stat_admin_id = current_user
3. RLS: games_stat_admin_policy (stat_admin_id = auth.uid()) ✅
4. Navigates to /stat-tracker?gameId=xxx

START GAME
----------
1. StatTracker → GameService.startGame(gameId)
2. UPDATE games SET status='in_progress', start_time=NOW()
3. ✅ Working

RECORD STAT (THE BROKEN PART)
------------------------------
1. StatButtonsV3 → recordStat({ statType, playerId, teamId... })
2. GameService.recordStat() → INSERT INTO game_stats
3. ✅ INSERT succeeds
4. ❌ Real-time subscription does NOT fire
5. ❌ games.home_score / away_score NOT updated automatically
6. ⚠️ Live viewer does NOT receive update

SCORE CALCULATION (Current Implementation)
-------------------------------------------
// Stats are recorded individually
INSERT game_stats (stat_type='field_goal', stat_value=2, player_id=...)

// Scores are CALCULATED by querying game_stats
const score = SUM(game_stats.stat_value WHERE team_id = X AND stat_value > 0)

// games.home_score / away_score are MANUALLY updated (sometimes)
// This causes desync between game_stats totals and games table
```

---

### **3. VIEWER FLOW** ❌ (BROKEN - Polling Fallback Active)

```
LIVE GAMES DISPLAY (Home Page)
-------------------------------
1. LiveTournamentSection → useLiveGames()
2. Query: SELECT * FROM games WHERE status IN ('live', 'in_progress', 'overtime')
3. ✅ Initial fetch works
4. Real-time subscription:
   - Channel: 'public:games_live_cards'
   - Event: 'UPDATE' on games table
   - ⚠️ This subscription DOES work (games table updates fire)
   - ✅ Score updates display IF games.home_score/away_score are updated

GAME VIEWER (Individual Game Page)
-----------------------------------
1. /game-viewer/[id] → useGameStream(gameId) [V1]
2. /game-viewer/[id] → usePlayFeed(gameId) [V2]
3. ⚠️ TWO systems running simultaneously

V1: useGameStream
-----------------
- Fetches game data with JOIN to teams
- Subscribes to:
  * games UPDATE → Updates clock, scores, status ✅
  * game_stats INSERT → ❌ NOT FIRING
  * game_substitutions INSERT → ❌ NOT FIRING
- Uses gameSubscriptionManager (consolidated channel)
- **FALLBACK**: 2-second polling active (CustomEvent 'force-game-refresh')

V2: usePlayFeed
---------------
- Fetches game_stats + game_substitutions
- Transforms to play-by-play feed
- Calculates scores by summing game_stats
- Subscribes to:
  * game_stats INSERT → ❌ NOT FIRING
  * game_substitutions INSERT → ❌ NOT FIRING
- **FALLBACK**: 2-second polling active (CustomEvent 'force-v2-refresh')

EVIDENCE OF BROKEN REAL-TIME
-----------------------------
// Subscription manager logs show connection success
✅ SubscriptionManager: Channel status: SUBSCRIBED

// But INSERT callbacks NEVER execute
❌ Missing: "🔔 SubscriptionManager: New game_stats INSERT detected"
❌ Missing: "🔔 V2 Feed: Subscription callback received"

// Polling is the ONLY thing keeping live viewer functional
🔄 GameViewerData: Polling for updates (every 2 seconds)
```

---

## 🔌 **REAL-TIME SUBSCRIPTION AUDIT**

### Subscription Implementation

```typescript
// src/lib/subscriptionManager.ts (Consolidated Manager)
class GameSubscriptionManager {
  subscribe(gameId: string, callback: Function) {
    const channel = supabase
      .channel(`consolidated-game-${gameId}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
        (payload) => callback('games', payload)
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'game_stats', filter: `game_id=eq.${gameId}` },
        (payload) => callback('game_stats', payload)
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'game_substitutions', filter: `game_id=eq.${gameId}` },
        (payload) => callback('game_substitutions', payload)
      )
      .subscribe();
  }
}
```

### Known Subscription Points

```typescript
// 1. useGameStream.tsx (V1 - Game Viewer)
const unsubscribe = gameSubscriptionManager.subscribe(gameId, (table, payload) => {
  if (table === 'games') {
    // ✅ WORKS - Updates clock, scores, status
    setGameData(...)
  }
  if (table === 'game_stats') {
    // ❌ NEVER FIRES
    fetchGameData(true)
  }
  if (table === 'game_substitutions') {
    // ❌ NEVER FIRES
    refetchSubs()
  }
})

// 2. usePlayFeed.tsx (V2 - Play-by-Play Feed)
const unsubscribe = gameSubscriptionManager.subscribe(gameId, (table, payload) => {
  if (table === 'game_stats' || table === 'game_substitutions') {
    // ❌ NEVER FIRES
    fetchAll() // Re-fetch stats and subs
  }
})

// 3. useLiveGames.ts (Home Page Live Games)
supabase
  .channel('public:games_live_cards')
  .on('postgres_changes', 
    { event: 'UPDATE', schema: 'public', table: 'games', filter: '*' },
    (payload) => {
      // ✅ WORKS - Updates live game cards
      setGames(...)
    }
  )
```

### Root Cause Analysis

**Why game_stats/game_substitutions INSERTs don't fire:**

1. **RLS Policies Blocking Real-Time Events**
   - Supabase real-time requires BOTH:
     * Table replication enabled (Publications)
     * RLS policies that allow SELECT access
   - Hypothesis: `game_stats` RLS policy blocks unauthenticated SELECT
   - Live viewers (home page) are often not authenticated

2. **Missing Realtime Publication**
   - Tables must be added to Supabase Replication
   - Check: Database → Replication → Publications
   - Verify: `game_stats` and `game_substitutions` are enabled

3. **RLS Policy Configuration**
   - Need public SELECT policy for live viewers
   - OR: Viewers must be authenticated with proper roles

---

## 🔐 **RLS POLICIES (Inferred from Code)**

### tournaments
```sql
-- Organizers manage their own tournaments
CREATE POLICY "tournaments_organizer_policy" 
  ON tournaments FOR ALL 
  USING (organizer_id = auth.uid());

-- Public can view public tournaments
CREATE POLICY "tournaments_public_policy" 
  ON tournaments FOR SELECT 
  USING (is_public = true);
```

### teams
```sql
-- Organizers manage teams in their tournaments
CREATE POLICY "teams_organizer_policy" 
  ON teams FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM tournaments t 
      WHERE t.id = teams.tournament_id 
      AND t.organizer_id = auth.uid()
    )
  );

-- Public view for public tournaments
CREATE POLICY "teams_public_policy" 
  ON teams FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM tournaments t 
      WHERE t.id = teams.tournament_id 
      AND t.is_public = true
    )
  );
```

### games
```sql
-- Organizers manage games in their tournaments
CREATE POLICY "games_organizer_policy" 
  ON games FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM tournaments t 
      WHERE t.id = games.tournament_id 
      AND t.organizer_id = auth.uid()
    )
  );

-- Stat admins manage assigned games
CREATE POLICY "games_stat_admin_policy" 
  ON games FOR ALL 
  USING (stat_admin_id = auth.uid());

-- ⚠️ MISSING: Public SELECT policy for live viewers
```

### game_substitutions
```sql
-- Stat admins manage substitutions for their assigned games
CREATE POLICY "game_substitutions_stat_admin_manage"
ON public.game_substitutions FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.games g
    WHERE g.id = game_substitutions.game_id 
    AND g.stat_admin_id = auth.uid()
  )
);

-- Organizers can DELETE substitutions when deleting tournaments
CREATE POLICY "game_substitutions_organizer_delete"
ON public.game_substitutions FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.games g
    JOIN public.tournaments t ON g.tournament_id = t.id
    WHERE g.id = game_substitutions.game_id 
    AND t.organizer_id = auth.uid()
  )
);

-- Public can read substitutions in public tournaments
CREATE POLICY "game_substitutions_public_read"
ON public.game_substitutions FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.games g
    JOIN public.tournaments t ON g.tournament_id = t.id
    WHERE g.id = game_substitutions.game_id 
    AND t.is_public = TRUE
  )
);
-- This might be why real-time works for games UPDATE but not game_stats INSERT
```

### game_stats ⚠️ (CRITICAL - Likely Blocking Real-Time)
```sql
-- ❌ LIKELY PROBLEM: No public SELECT policy
-- Real-time requires SELECT permission for unauthenticated viewers

-- Hypothesis: Only authenticated stat admins can SELECT
CREATE POLICY "game_stats_stat_admin_policy" 
  ON game_stats FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM games g 
      WHERE g.id = game_stats.game_id 
      AND g.stat_admin_id = auth.uid()
    )
  );

-- ✅ NEEDED: Public SELECT for real-time to work
CREATE POLICY "game_stats_public_view" 
  ON game_stats FOR SELECT 
  USING (true); -- Or restrict to public tournaments
```

---

## 🎯 **SOURCE OF TRUTH HIERARCHY**

### Database Tables (Single Source of Truth)
```
tournaments → teams → team_players → users (players)
                 ↓
               games ← stat_admin assignment
                 ↓
         ┌───────┴────────┐
         ▼                ▼
    game_stats    game_substitutions
         │
         └─> SCORES CALCULATED FROM game_stats
         └─> games.home_score / away_score (MANUAL UPDATE)
```

### Data Flow (Actual Implementation)
```
1. User Action (Button Press)
   ↓
2. Service Layer (gameService.ts)
   ↓
3. Supabase Client (INSERT/UPDATE)
   ↓
4. PostgreSQL Database
   ↓
5a. RLS Policy Check ✅
   ↓
5b. Real-Time Publication ❌ (BLOCKED)
   ↓
6. [FALLBACK] Polling (2s interval)
   ↓
7. UI Update
```

---

## 🐛 **CRITICAL BUGS CONFIRMED**

### 1. Real-Time Subscriptions Broken
**Symptom**: Live viewer requires manual refresh  
**Root Cause**: RLS policies blocking real-time broadcast for `game_stats` and `game_substitutions`  
**Evidence**:
- Channel connects successfully (SUBSCRIBED status)
- INSERT callbacks never execute
- Polling fallback is the only functional update mechanism

**Fix Required**:
1. Enable realtime replication for `game_stats` and `game_substitutions`
2. Add public SELECT RLS policy for live viewers
3. Verify WebSocket connections in Supabase dashboard

---

### 2. Player Locking Not Implemented
**Symptom**: Players can be assigned to multiple teams  
**Root Cause**: No database constraints on `team_players` table  
**Evidence**:
```typescript
// TeamService.addPlayerToTeam()
// Uses UPSERT with onConflict: 'team_id,player_id'
// This only prevents duplicate (team,player) pairs
// Does NOT prevent same player in multiple teams
```

**Fix Required**:
1. Add business logic check before INSERT
2. OR: Add database trigger to enforce one-team-per-player-per-tournament
3. OR: Add UI warning when player already assigned

---

### 3. Score Desync Between game_stats and games Table
**Symptom**: Scores might not match between stat totals and games table  
**Root Cause**: `games.home_score` not automatically updated when `game_stats` inserted  
**Evidence**:
```typescript
// gameService.ts recordStat()
// Only INSERTs into game_stats
// Does NOT UPDATE games.home_score / away_score
```

**Fix Required**:
1. Add database trigger to auto-update games.home_score/away_score
2. OR: Update scores in same transaction as stat INSERT
3. OR: Calculate scores on-demand from game_stats (current V2 approach)

---

### 4. Dual Data Flow (V1 vs V2 Confusion)
**Symptom**: Two separate systems for game viewing  
**Root Cause**: Migration from V1 to V2 incomplete  
**Evidence**:
- `useGameStream` (V1) still active
- `usePlayFeed` (V2) also running
- Both have polling fallbacks
- Unclear which is source of truth

**Fix Required**:
1. Choose one system (V2 recommended - cleaner architecture)
2. Remove or deprecate the other
3. Document which components use which system

---

## 🛠️ **IMMEDIATE ACTION ITEMS**

### Priority 1: Fix Real-Time Subscriptions (Backend)
```sql
-- 1. Enable realtime replication
ALTER PUBLICATION supabase_realtime ADD TABLE game_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE game_substitutions;

-- 2. Add public SELECT policy for real-time
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

### Priority 2: Implement Player Locking (Frontend)
```typescript
// TeamService.addPlayerToTeam()
static async addPlayerToTeam(teamId: string, playerId: string): Promise<void> {
  // Check if player already assigned to another team in this tournament
  const { data: team } = await supabase
    .from('teams')
    .select('tournament_id')
    .eq('id', teamId)
    .single();
  
  const { data: existing } = await supabase
    .from('team_players')
    .select('team_id, teams!inner(tournament_id)')
    .eq('player_id', playerId)
    .eq('teams.tournament_id', team.tournament_id);
  
  if (existing && existing.length > 0) {
    throw new Error('Player already assigned to a team in this tournament');
  }
  
  // Proceed with INSERT...
}
```

### Priority 3: Fix Score Sync (Backend Trigger)
```sql
-- Auto-update games.home_score / away_score on game_stats INSERT
CREATE OR REPLACE FUNCTION update_game_scores()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate scores from all game_stats for this game
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
    )
  WHERE id = NEW.game_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER game_stats_update_scores
  AFTER INSERT ON game_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_game_scores();
```

### Priority 4: Consolidate Data Flow (Frontend)
```typescript
// Deprecate V1 (useGameStream) in favor of V2 (usePlayFeed)
// Update all components to use V2 exclusively
// Remove polling fallbacks once real-time is fixed
```

---

## 📋 **TESTING CHECKLIST**

### Verify Real-Time Fix
- [ ] Record stat in tracker
- [ ] Verify "🔔 SubscriptionManager: New game_stats INSERT detected" in console
- [ ] Verify live viewer updates without manual refresh
- [ ] Verify polling can be disabled (no regressions)

### Verify Player Locking
- [ ] Assign player to Team A
- [ ] Attempt to assign same player to Team B
- [ ] Verify error message displayed
- [ ] Verify database has only one assignment

### Verify Score Sync
- [ ] Record 2-point shot
- [ ] Check `game_stats` table (verify INSERT)
- [ ] Check `games` table (verify home_score/away_score updated)
- [ ] Verify V2 calculated score matches games table score

---

## 🎓 **LESSONS LEARNED**

1. **Ignore outdated documentation** - Always audit actual code
2. **Real-time requires proper RLS** - SELECT policies enable broadcasts
3. **Polling is masking the real problem** - Remove fallbacks to expose issues
4. **Score calculation has two sources** - game_stats SUM vs games.home_score
5. **Player locking needs explicit checks** - Database doesn't enforce by default

---

## 📖 **ARCHITECTURAL RECOMMENDATIONS**

### Recommended Tech Stack (Current)
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS ✅
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage) ✅
- **State Management**: Zustand (useAuthStore) ✅
- **Real-Time**: Supabase Realtime (needs fixing) ⚠️

### Recommended Data Flow (After Fixes)
```
1. Button Press → Service Layer
2. Service → Supabase INSERT (game_stats)
3. Database Trigger → UPDATE games (home_score/away_score)
4. Realtime Broadcast → Subscription Callback
5. UI Update (no polling needed)
```

### Service Layer Architecture ✅
```
src/lib/services/
├── gameService.ts (game CRUD + stat recording)
├── tournamentService.ts (tournament + team management)
├── statsService.ts (stat queries)
├── substitutionsService.ts (substitution queries)
└── ...
```

### Hook Layer Architecture ✅
```
src/hooks/
├── useGameStream.tsx (V1 - deprecate)
├── usePlayFeed.tsx (V2 - primary)
├── useLiveGames.ts (home page)
├── useTracker.ts (stat tracker state)
└── ...
```

---

## 🔗 **RELATED DOCUMENTATION**

- `docs/BACKEND_RLS_REALTIME_FIX_INSTRUCTIONS.md` - Backend real-time fix guide
- `docs/BACKEND_RLS_STATUS_UPDATE_JANUARY_2025.md` - RLS status
- `docs/STAT_ADMIN_OPTIMIZATION_STRATEGY.md` - Stat tracker optimization
- `src/lib/subscriptionManager.ts` - Subscription manager implementation
- `src/hooks/usePlayFeed.tsx` - V2 data flow (recommended)

---

**END OF AUDIT - Next Steps: Fix real-time subscriptions (backend coordination required)**

