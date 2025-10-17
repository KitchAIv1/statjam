# 🏗️ StatJam System Architecture: Visual Diagrams

**Date**: October 17, 2025  
**Purpose**: Visual reference for system architecture

---

## 🗺️ HIGH-LEVEL SYSTEM OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                        STATJAM SYSTEM                            │
│                                                                   │
│  ┌───────────┐      ┌───────────┐      ┌───────────┐           │
│  │ ORGANIZER │      │STAT ADMIN │      │  VIEWER   │           │
│  │ Dashboard │      │  Tracker  │      │Live Games │           │
│  └─────┬─────┘      └─────┬─────┘      └─────┬─────┘           │
│        │                   │                   │                 │
│        ▼                   ▼                   ▼                 │
│  ┌───────────────────────────────────────────────────┐         │
│  │         FRONTEND (Next.js + TypeScript)            │         │
│  │                                                     │         │
│  │  Services → Hooks → Components → Pages             │         │
│  └────────────────────┬──────────────────────────────┘         │
│                       │                                          │
│                       ▼                                          │
│  ┌───────────────────────────────────────────────────┐         │
│  │      SUPABASE (PostgreSQL + Realtime + Auth)      │         │
│  │                                                     │         │
│  │  • 20 Tables (tournaments, games, game_stats...)   │         │
│  │  • RLS Policies (role-based access control)        │         │
│  │  • Real-Time Subscriptions (WebSocket)             │         │
│  │  • Storage (images, logos)                         │         │
│  └───────────────────────────────────────────────────┘         │
└───────────────────────────────────────────────────────────────────┘
```

---

## 📊 DATABASE ENTITY RELATIONSHIPS

```
┌──────────────────────────────────────────────────────────────────┐
│                    DATABASE SCHEMA (CORE)                         │
└──────────────────────────────────────────────────────────────────┘

           ┌──────────────┐
           │    users     │ (id, email, role, premium_status)
           └──────┬───────┘
                  │
        ┌─────────┼─────────────────┐
        │         │                 │
        ▼         ▼                 ▼
┌───────────┐ ┌───────────┐ ┌──────────────┐
│tournaments│ │team_players│ │ (stat_admin) │
│(organizer)│ │ (players) │ │              │
└─────┬─────┘ └─────┬─────┘ └──────┬───────┘
      │             │               │
      │             │               │
      ▼             ▼               │
 ┌────────┐    ┌────────┐          │
 │ teams  │◄───┤ teams  │          │
 └───┬────┘    └────────┘          │
     │                              │
     ▼                              │
 ┌────────┐                         │
 │ games  │◄────────────────────────┘
 │        │ (team_a_id, team_b_id, stat_admin_id)
 └───┬────┘
     │
     ├─────────────────────────┐
     │                         │
     ▼                         ▼
┌──────────────┐      ┌─────────────────┐
│  game_stats  │      │game_substitutions│
│              │      │                 │
│ (player_id,  │      │ (player_in_id,  │
│  team_id,    │      │  player_out_id, │
│  stat_type,  │      │  team_id,       │
│  stat_value) │      │  quarter)       │
└──────────────┘      └─────────────────┘
```

---

## 🔄 DATA FLOW: STAT RECORDING (CURRENT STATE)

```
┌────────────────────────────────────────────────────────────────────┐
│                    STAT RECORDING FLOW                              │
└────────────────────────────────────────────────────────────────────┘

USER ACTION: "Player scores 2-point shot"
│
├─► [1] FRONTEND: StatButtonsV3.tsx
│   │   ↓ onClick handler
│   │
│   ├─► [2] TRACKER: recordStat({ statType: 'field_goal', playerId, teamId })
│   │   │   ↓ useTracker hook
│   │   │
│   │   ├─► [3] SERVICE: GameService.recordStat()
│   │   │   │   ↓ Validate session
│   │   │   │   ↓ Prepare data
│   │   │   │
│   │   │   ├─► [4] SUPABASE: INSERT INTO game_stats
│   │   │   │   │   (game_id, player_id, team_id, stat_type, stat_value=2)
│   │   │   │   │
│   │   │   │   ├─► [5] POSTGRESQL: Write to database
│   │   │   │   │   │   ✅ Stat saved successfully
│   │   │   │   │   │
│   │   │   │   │   ├─► [6] RLS POLICY CHECK:
│   │   │   │   │   │   │   • INSERT: ✅ Stat admin has permission
│   │   │   │   │   │   │   • SELECT: ❌ Public viewers blocked!
│   │   │   │   │   │   │
│   │   │   │   │   │   └─► [7a] REAL-TIME ATTEMPT:
│   │   │   │   │   │       │   ❌ Broadcast blocked (no SELECT permission)
│   │   │   │   │   │       │   ❌ Live viewers don't receive update
│   │   │   │   │   │       │
│   │   │   │   │   │       └─► [FALLBACK] Polling (every 2 seconds)
│   │   │   │   │   │           │   🔄 Frontend: CustomEvent('force-game-refresh')
│   │   │   │   │   │           │   🔄 usePlayFeed: fetchAll()
│   │   │   │   │   │           │   🔄 Query: SELECT * FROM game_stats
│   │   │   │   │   │           │   ✅ Score updates after 2-second delay
│   │   │   │   │   │
│   │   │   │   │   └─► [7b] SCORE SYNC:
│   │   │   │   │       │   ⚠️ games.home_score NOT updated
│   │   │   │   │       │   ⚠️ Must calculate from game_stats SUM
│   │   │   │   │       │   ⚠️ Potential desync
│   │   │   │   │
│   │   │   │   └─► [8] RESPONSE: { success: true }
│   │   │   │
│   │   │   └─► [9] UI UPDATE: 
│   │   │       │   ✅ Local state updated
│   │   │       │   ✅ Score display incremented
│   │   │       │   ✅ Play-by-play feed updated (after 2s)
│   │   │
│   │   └─► ✅ STAT RECORDED (but real-time broken)
│
└─► ⚠️ LIVE VIEWERS: See update after 2-second polling delay
```

---

## 🔄 DATA FLOW: STAT RECORDING (AFTER FIXES)

```
┌────────────────────────────────────────────────────────────────────┐
│              STAT RECORDING FLOW (FIXED)                            │
└────────────────────────────────────────────────────────────────────┘

USER ACTION: "Player scores 2-point shot"
│
├─► [1-4] SAME AS BEFORE (Frontend → Service → Supabase → PostgreSQL)
│   │
│   └─► [5] POSTGRESQL: Write to database
│       │   ✅ Stat saved successfully
│       │
│       ├─► [6] DATABASE TRIGGER (NEW!):
│       │   │   ↓ update_game_scores()
│       │   │   │
│       │   │   ├─► Calculate: home_score = SUM(game_stats WHERE team_id = team_a)
│       │   │   ├─► Calculate: away_score = SUM(game_stats WHERE team_id = team_b)
│       │   │   └─► UPDATE games SET home_score = X, away_score = Y
│       │   │       ✅ Scores auto-synced!
│       │   │
│       │   ├─► [7] RLS POLICY CHECK (UPDATED!):
│       │   │   │   • INSERT: ✅ Stat admin has permission
│       │   │   │   • SELECT: ✅ Public viewers allowed (NEW!)
│       │   │   │
│       │   │   └─► [8] REAL-TIME BROADCAST (WORKING!):
│       │   │       │
│       │   │       ├─► [8a] Event: game_stats INSERT
│       │   │       │   │   ✅ Broadcast to all subscribers
│       │   │       │   │   ✅ usePlayFeed callback fires
│       │   │       │   │   ✅ Live viewer updates INSTANTLY
│       │   │       │
│       │   │       └─► [8b] Event: games UPDATE (from trigger)
│       │   │           │   ✅ Broadcast score change
│       │   │           │   ✅ useGameStream callback fires
│       │   │           │   ✅ Scores synced everywhere
│       │   │
│       │   └─► [9] UI UPDATE:
│       │       │   ✅ Local state updated
│       │       │   ✅ Score display incremented
│       │       │   ✅ Play-by-play feed updated INSTANTLY
│       │       │   ✅ No polling needed!
│       │
│       └─► ✅ STAT RECORDED (real-time working!)
│
└─► ✅ LIVE VIEWERS: See update INSTANTLY (<100ms)
```

---

## 👥 USER ROLE FLOWS

### ORGANIZER FLOW ✅ (Working)

```
┌─────────────────────────────────────────────────────────────┐
│                    ORGANIZER WORKFLOW                        │
└─────────────────────────────────────────────────────────────┘

1. CREATE TOURNAMENT
   ├─► tournaments table
   └─► RLS: organizer_id = auth.uid() ✅

2. CREATE TEAMS
   ├─► teams table (tournament_id FK)
   ├─► UPDATE tournaments.current_teams
   └─► RLS: Via tournament ownership ✅

3. ADD PLAYERS TO TEAMS
   ├─► team_players table (team_id, player_id)
   ├─► ⚠️ NO VALIDATION: Can add same player to multiple teams
   └─► FIX: Add frontend validation (FRONTEND_ACTION_PLAN.md)

4. CREATE GAMES
   ├─► games table (team_a_id, team_b_id, stat_admin_id)
   └─► RLS: Via tournament ownership ✅

5. ASSIGN STAT ADMIN
   ├─► UPDATE games.stat_admin_id
   └─► Round-robin distribution ✅
```

### STAT ADMIN FLOW ⚠️ (Partially Working)

```
┌─────────────────────────────────────────────────────────────┐
│                 STAT ADMIN WORKFLOW                          │
└─────────────────────────────────────────────────────────────┘

1. VIEW ASSIGNED GAMES
   ├─► Query: SELECT * FROM games WHERE stat_admin_id = auth.uid()
   ├─► Group by organizer
   └─► RLS: stat_admin_id = auth.uid() ✅

2. LAUNCH STAT BOARD
   ├─► Navigate to /stat-tracker?gameId=xxx
   └─► Load game + teams + players ✅

3. START GAME
   ├─► UPDATE games SET status='in_progress'
   └─► RLS: stat_admin_id = auth.uid() ✅

4. RECORD STATS
   ├─► INSERT INTO game_stats
   ├─► ✅ Stat saved
   ├─► ❌ Real-time broadcast blocked (FIX NEEDED)
   └─► ⚠️ games.home_score not updated (FIX NEEDED)

5. RECORD SUBSTITUTIONS
   ├─► INSERT INTO game_substitutions
   ├─► ✅ Substitution saved
   └─► ❌ Real-time broadcast blocked (FIX NEEDED)

6. END GAME
   ├─► UPDATE games SET status='completed', end_time=NOW()
   └─► RLS: stat_admin_id = auth.uid() ✅
```

### VIEWER FLOW ❌ (Broken - Polling Fallback)

```
┌─────────────────────────────────────────────────────────────┐
│                    VIEWER WORKFLOW                           │
└─────────────────────────────────────────────────────────────┘

1. VIEW LIVE GAMES (Home Page)
   ├─► Query: SELECT * FROM games WHERE status IN ('live', 'in_progress')
   ├─► ✅ Initial fetch works
   ├─► Subscribe to games table UPDATE
   ├─► ✅ Real-time works for games table
   └─► ⚠️ Scores only update if games.home_score/away_score updated

2. VIEW INDIVIDUAL GAME
   ├─► Query: SELECT * FROM games WHERE id = xxx
   ├─► Query: SELECT * FROM game_stats WHERE game_id = xxx
   ├─► ✅ Initial fetch works
   │
   ├─► V1: useGameStream (Legacy)
   │   ├─► Subscribe to games UPDATE ✅
   │   ├─► Subscribe to game_stats INSERT ❌
   │   └─► Subscribe to game_substitutions INSERT ❌
   │
   ├─► V2: usePlayFeed (Current)
   │   ├─► Subscribe to game_stats INSERT ❌
   │   └─► Subscribe to game_substitutions INSERT ❌
   │
   └─► FALLBACK: Polling (every 2 seconds)
       ├─► CustomEvent('force-game-refresh')
       ├─► fetchAll() re-queries database
       └─► ⚠️ 2-second delay, not true real-time

PROBLEM: Real-time subscriptions blocked by RLS
FIX: Add public SELECT policy (BACKEND_COORDINATION_REQUIRED.md)
```

---

## 🔒 RLS POLICY OVERVIEW

```
┌──────────────────────────────────────────────────────────────────┐
│                   RLS POLICY STRUCTURE                            │
└──────────────────────────────────────────────────────────────────┘

TABLE: tournaments
├─► Policy: organizer_policy
│   └─► FOR ALL USING (organizer_id = auth.uid()) ✅
└─► Policy: public_policy
    └─► FOR SELECT USING (is_public = true) ✅

TABLE: teams
├─► Policy: organizer_policy
│   └─► FOR ALL USING (tournament.organizer_id = auth.uid()) ✅
└─► Policy: public_policy
    └─► FOR SELECT USING (tournament.is_public = true) ✅

TABLE: games
├─► Policy: organizer_policy
│   └─► FOR ALL USING (tournament.organizer_id = auth.uid()) ✅
├─► Policy: stat_admin_policy
│   └─► FOR ALL USING (stat_admin_id = auth.uid()) ✅
└─► Policy: public_policy
    └─► FOR SELECT USING (tournament.is_public = true) ✅

TABLE: game_stats
├─► Policy: stat_admin_policy
│   └─► FOR ALL USING (game.stat_admin_id = auth.uid()) ✅
└─► Policy: public_realtime (MISSING! ❌)
    └─► FOR SELECT USING (tournament.is_public = true) ⚠️ NEED TO ADD

TABLE: game_substitutions
├─► Policy: stat_admin_policy
│   └─► FOR ALL USING (game.stat_admin_id = auth.uid()) ✅
└─► Policy: public_realtime (MISSING! ❌)
    └─► FOR SELECT USING (tournament.is_public = true) ⚠️ NEED TO ADD
```

---

## 🌐 REAL-TIME SUBSCRIPTION ARCHITECTURE

```
┌──────────────────────────────────────────────────────────────────┐
│            SUPABASE REAL-TIME ARCHITECTURE                        │
└──────────────────────────────────────────────────────────────────┘

FRONTEND (Browser)
│
├─► WebSocket Connection
│   ├─► supabase.channel('consolidated-game-123')
│   │   ├─► .on('postgres_changes', { table: 'games', event: 'UPDATE' })
│   │   ├─► .on('postgres_changes', { table: 'game_stats', event: 'INSERT' })
│   │   └─► .on('postgres_changes', { table: 'game_substitutions', event: 'INSERT' })
│   │
│   └─► .subscribe((status) => { ... })
│       ├─► Status: 'SUBSCRIBED' ✅ (Connection successful)
│       └─► Waiting for events...
│
▼
SUPABASE BACKEND
│
├─► PostgreSQL Database
│   ├─► [1] INSERT INTO game_stats (...)
│   │   │   ✅ Record saved
│   │   │
│   │   ├─► [2] Realtime Publication Check
│   │   │   │   ✅ game_stats in supabase_realtime publication?
│   │   │   │   ✅ YES (or ❌ NO - need to add)
│   │   │   │
│   │   │   ├─► [3] RLS Policy Check for SELECT
│   │   │   │   │   ❌ BLOCKED: No public SELECT policy
│   │   │   │   │   ❌ Real-time event NOT broadcast
│   │   │   │   │
│   │   │   │   └─► [FIX] Add public SELECT policy
│   │   │   │       │   CREATE POLICY "game_stats_public_realtime"
│   │   │   │       │   ON game_stats FOR SELECT
│   │   │   │       │   USING (tournament.is_public = true)
│   │   │   │       │
│   │   │   │       └─► [4] Broadcast Event
│   │   │   │           │   ✅ WebSocket: { event: 'INSERT', table: 'game_stats', ... }
│   │   │   │           │   ✅ All subscribers receive update
│   │   │   │           │
│   │   │   │           └─► FRONTEND: Callback fires
│   │   │   │               │   🔔 SubscriptionManager: INSERT detected
│   │   │   │               │   🔔 V2 Feed: Callback received
│   │   │   │               │   ✅ UI updates instantly
│   │   │   │
│   │   │   └─► [CURRENT] No broadcast
│   │   │       │   ⚠️ Frontend: Timeout waiting for event
│   │   │       │   🔄 Fallback: Polling (every 2 seconds)
│   │   │
│   │   └─► Response: { success: true }
│   │
│   └─► WebSocket Server
│       └─► Manages subscriptions and broadcasts
```

---

## 🎯 SERVICE LAYER ARCHITECTURE

```
┌──────────────────────────────────────────────────────────────────┐
│               FRONTEND SERVICE LAYER                              │
└──────────────────────────────────────────────────────────────────┘

src/lib/services/
│
├─► gameService.ts (Game Management)
│   ├─► createGame()
│   ├─► updateGameState()
│   ├─► startGame()
│   ├─► recordStat() ⚠️ Core function
│   ├─► recordSubstitution()
│   └─► getAssignedGames()
│
├─► tournamentService.ts (Tournament + Team Management)
│   ├─► createTournament()
│   ├─► getTournamentsByOrganizer()
│   ├─► TeamService.createTeam()
│   ├─► TeamService.addPlayerToTeam() ⚠️ Needs validation
│   ├─► TeamService.getTeamPlayers()
│   └─► TeamService.getStatAdmins()
│
├─► statsService.ts (Stat Queries)
│   └─► getByGameId() (No JOINs for performance)
│
├─► substitutionsService.ts (Substitution Queries)
│   └─► getByGameId()
│
└─► organizerDashboardService.ts (Dashboard Aggregations)
    ├─► getDashboardData()
    ├─► getRecentTournaments()
    └─► getUpcomingGames()

HOOK LAYER (src/hooks/)
│
├─► useGameStream.tsx (V1 - Legacy) ⚠️ Deprecate
├─► usePlayFeed.tsx (V2 - Current) ✅ Primary
├─► useLiveGames.ts (Home Page)
├─► useTracker.ts (Stat Tracker State)
└─► useOrganizerDashboardData.ts (Dashboard State)
```

---

## 🔧 FIX IMPLEMENTATION MAP

```
┌──────────────────────────────────────────────────────────────────┐
│                    FIXES OVERVIEW                                 │
└──────────────────────────────────────────────────────────────────┘

BACKEND FIXES (Supabase SQL) - 15-30 minutes
│
├─► [1] Enable Realtime Publication
│   └─► ALTER PUBLICATION supabase_realtime ADD TABLE game_stats;
│   └─► ALTER PUBLICATION supabase_realtime ADD TABLE game_substitutions;
│
├─► [2] Add Public RLS Policies
│   └─► CREATE POLICY "game_stats_public_realtime" ON game_stats...
│   └─► CREATE POLICY "game_substitutions_public_realtime" ON game_substitutions...
│
└─► [3] Add Score Sync Trigger
    └─► CREATE FUNCTION update_game_scores()...
    └─► CREATE TRIGGER game_stats_update_scores...

FRONTEND FIXES (TypeScript) - 2-3 hours
│
├─► [1] Player Locking Validation
│   └─► Location: src/lib/services/tournamentService.ts
│   └─► Function: TeamService.addPlayerToTeam()
│   └─► Add: Check existing assignments before INSERT
│
├─► [2] Data Flow Consolidation
│   └─► Location: src/hooks/useGameViewerData.ts
│   └─► Add: ENABLE_V1_FALLBACK feature flag
│   └─► Goal: Clean separation of V1 and V2
│
├─► [3] Score Validation Logging
│   └─► Location: src/hooks/usePlayFeed.tsx
│   └─► Add: Compare calculated vs database scores
│   └─► Goal: Detect desync issues
│
├─► [4] Error Handling Improvements
│   └─► Location: src/lib/services/gameService.ts
│   └─► Function: recordStat()
│   └─► Add: User-friendly error messages
│
└─► [5] Real-Time Status Indicator
    └─► Location: src/hooks/useGameViewerData.ts
    └─► Add: realtimeStatus state
    └─► UI: Show "Live" or "Polling" badge
```

---

**END OF VISUAL DIAGRAMS - For detailed implementation, see action plan documents**

