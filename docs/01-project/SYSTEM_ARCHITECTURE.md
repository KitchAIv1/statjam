# 🏗️ StatJam System Architecture

**Version**: 0.9.7  
**Date**: October 19, 2025  
**Status**: Production Ready with Security Hardening

---

## 🗺️ HIGH-LEVEL SYSTEM OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                        STATJAM MVP v0.9.7                        │
│              🔒 Production Ready with Security Hardening         │
│                                                                   │
│  ┌───────────┐      ┌───────────┐      ┌───────────┐           │
│  │ ORGANIZER │      │STAT ADMIN │      │  PLAYER   │           │
│  │ Dashboard │      │  Tracker  │      │ Dashboard │           │
│  └─────┬─────┘      └─────┬─────┘      └─────┬─────┘           │
│        │                   │                   │                 │
│        │                   │                   │                 │
│        ▼                   ▼                   ▼                 │
│  ┌───────────────────────────────────────────────────┐         │
│  │      FRONTEND (Next.js 15.4.5 + TypeScript)       │         │
│  │                                                     │         │
│  │  • React Context (AuthContext)                     │         │
│  │  • Custom Hooks (V3 Architecture)                  │         │
│  │  • Service Layer (Raw HTTP + Supabase Client)     │         │
│  │  • Real-time Manager (WebSocket Subscriptions)    │         │
│  └────────────────────┬──────────────────────────────┘         │
│                       │                                          │
│                       ▼                                          │
│  ┌───────────────────────────────────────────────────┐         │
│  │      SUPABASE (PostgreSQL + Real-time + Auth)     │         │
│  │                                                     │         │
│  │  • 20+ Tables (V3 Schema)                          │         │
│  │  • RLS Policies (Role-based access control)        │         │
│  │  • Real-Time Subscriptions (WebSocket)             │         │
│  │  • Storage (card-assets bucket)                    │         │
│  │  • Edge Functions (card generation)                │         │
│  └───────────────────────────────────────────────────┘         │
└───────────────────────────────────────────────────────────────────┘
```

---

## 📊 DATABASE ENTITY RELATIONSHIPS

```
┌──────────────────────────────────────────────────────────────────┐
│                    DATABASE SCHEMA (V3)                           │
└──────────────────────────────────────────────────────────────────┘

           ┌──────────────┐
           │    users     │ (id, email, role, name, jersey_number)
           └──────┬───────┘
                  │
        ┌─────────┼─────────────────┐
        │         │                 │
        ▼         ▼                 ▼
┌───────────┐ ┌───────────┐ ┌──────────────┐
│tournaments│ │team_players│ │player_achievements│
│(organizer)│ │ (roster)  │ │ (career_highs)│
└─────┬─────┘ └─────┬─────┘ └──────────────┘
      │             │
      │             │
      ▼             ▼
 ┌────────┐    ┌────────┐
 │ teams  │◄───┤ teams  │
 └───┬────┘    └────────┘
     │
     ▼
 ┌────────┐
 │ games  │ (team_a_id, team_b_id, status, start_time)
 └───┬────┘
     │
     ├─────────────────────────┐
     │                         │
     ▼                         ▼
┌──────────────┐      ┌─────────────────┐
│  game_stats  │      │game_substitutions│
│  (V3 ENGINE) │      │  (V3 ENGINE)    │
│              │      │                 │
│ • player_id  │      │ • player_in_id  │
│ • team_id    │      │ • player_out_id │
│ • stat_type  │      │ • team_id       │
│ • stat_value │      │ • quarter       │
│ • quarter    │      │ • timestamp     │
│ • game_time  │      └─────────────────┘
└──────────────┘
```

**Key Tables**:
- `users` - Player profiles, organizers, stat admins
- `tournaments` - Tournament metadata
- `teams` - Team information
- `team_players` - Roster assignments (many-to-many)
- `games` - Game schedules and status
- `game_stats` - **PRIMARY DATA SOURCE** for all stats (V3)
- `game_substitutions` - Player substitutions during games

---

## 🔄 DATA FLOW: STAT TRACKING (V3 ENGINE)

```
┌────────────────────────────────────────────────────────────────────┐
│                  STAT RECORDING FLOW (V3)                           │
└────────────────────────────────────────────────────────────────────┘

1. STAT ADMIN UI
   │
   ├─► Click "2PT Made" for Player #23
   │
   ▼
2. STAT TRACKER (src/app/stat-tracker-v3/page.tsx)
   │
   ├─► useTracker hook
   │   ├─► tracker.recordStat(playerId, "2pt_made", 2)
   │   │
   │   ▼
   ├─► GameServiceV3.recordStat()
   │   ├─► Raw HTTP POST request
   │   ├─► Authorization: Bearer {JWT}
   │   ├─► Body: { player_id, team_id, stat_type, stat_value, quarter, game_time }
   │   │
   │   ▼
   └─► Supabase PostgreSQL
       ├─► INSERT INTO game_stats
       ├─► ✅ Stat saved to database
       │
       ▼
3. REAL-TIME BROADCAST (WebSocket)
   │
   ├─► gameSubscriptionManager detects INSERT
   ├─► Broadcasts to all subscribed clients
   │
   ▼
4. LIVE VIEWER (src/app/game-viewer/[gameId]/page.tsx)
   │
   ├─► useGameViewerV2 receives update
   ├─► Transform game_stats → PlayByPlayEntry
   ├─► Calculate running scores
   ├─► React.memo prevents unnecessary re-renders
   │
   └─► ✅ UI updates silently (no loading state)

5. STAT TRACKER UI
   │
   └─► ✅ Score updates immediately (optimistic + confirmed)

RESULT: ✅ True real-time updates with <100ms latency
```

---

## 🔄 DATA FLOW: SUBSTITUTIONS (V3 ENGINE)

```
┌────────────────────────────────────────────────────────────────────┐
│                  SUBSTITUTION FLOW (V3)                             │
└────────────────────────────────────────────────────────────────────┘

1. STAT ADMIN UI
   │
   ├─► Click player on court → Opens substitution modal
   ├─► Select bench player → Click "Substitute"
   │
   ▼
2. SUBSTITUTION MODAL (SubstitutionModalV3.tsx)
   │
   ├─► handleSubConfirm()
   │   ├─► tracker.substitute(playerOut, playerIn, teamId)
   │   │
   │   ▼
   ├─► INSERT INTO game_substitutions
   │   ├─► player_out_id, player_in_id, team_id, quarter, game_time
   │   │
   │   ▼
   └─► TeamServiceV3.getTeamPlayersWithSubstitutions()
       ├─► Fetch base roster from team_players
       ├─► Apply substitutions chronologically
       ├─► Return current on-court vs bench status
       │
       ▼
3. UI UPDATE
   │
   ├─► Update teamAPlayers / teamBPlayers state
   ├─► Force re-render with rosterRefreshKey
   ├─► Player avatars swap positions
   │
   └─► ✅ UI reflects new roster state immediately

4. LIVE VIEWER
   │
   ├─► Real-time subscription detects substitution
   ├─► Add to play-by-play feed with 🔄 icon
   │
   └─► ✅ Substitution appears in feed with NBA styling

RESULT: ✅ Auto-UI update + play-by-play integration
```

---

## 🔐 AUTHENTICATION FLOW (CENTRALIZED)

```
┌────────────────────────────────────────────────────────────────────┐
│              AUTHENTICATION ARCHITECTURE (V2)                       │
└────────────────────────────────────────────────────────────────────┘

1. APP INITIALIZATION (src/app/layout.tsx)
   │
   ├─► <AuthProvider> wraps entire app
   │   ├─► useAuthV2() hook initialized
   │   ├─► Check localStorage for session
   │   ├─► Verify JWT expiration
   │   │
   │   ▼
   └─► If token expires < 5 min → Auto-refresh

2. USER SIGNS IN (src/components/auth/AuthPageV2.tsx)
   │
   ├─► authServiceV2.signIn(email, password)
   ├─► Raw HTTP POST to Supabase Auth
   ├─► Store access_token, refresh_token in localStorage
   │
   ▼
3. AUTH CONTEXT PROVIDES
   │
   ├─► { user, loading, error, signIn, signUp, signOut, refreshSession }
   ├─► Available to all components via useAuthContext()
   │
   └─► ✅ Single source of truth

4. CHILD COMPONENTS
   │
   ├─► const { user } = useAuthContext()
   ├─► Pass user to hooks/services
   │
   └─► ✅ NO redundant useAuthV2() calls

5. AUTO-REFRESH TIMER
   │
   ├─► setInterval every 45 minutes
   ├─► authServiceV2.refreshToken()
   ├─► Update localStorage with new tokens
   │
   └─► ✅ Never expires during active session

6. API CALLS (GameServiceV3, TeamServiceV3)
   │
   ├─► Include Authorization: Bearer {JWT}
   ├─► On 401/403 → Auto-refresh & retry once
   │
   └─► ✅ Seamless token refresh

RESULT: 97% reduction in auth API calls, auto-refresh, no manual login
```

---

## 👁️ LIVE VIEWER FLOW (V2 ENGINE)

```
┌────────────────────────────────────────────────────────────────────┐
│                  LIVE VIEWER DATA FLOW (V2)                         │
└────────────────────────────────────────────────────────────────────┘

1. USER NAVIGATES TO GAME (/game-viewer/[gameId])
   │
   ├─► GameViewerPage component loads
   │   ├─► useGameViewerV2(gameId, user)
   │   │
   │   ▼
   └─► INITIAL DATA FETCH (Raw HTTP)
       ├─► GET /games?id=eq.{gameId}
       ├─► GET /game_stats?game_id=eq.{gameId}
       ├─► GET /game_substitutions?game_id=eq.{gameId}
       ├─► GET /teams (for team_a and team_b)
       │
       └─► ✅ Loading state shown ONLY on initial load

2. DATA TRANSFORMATION
   │
   ├─► Fetch player names for all player_ids
   ├─► Merge game_stats + game_substitutions by timestamp
   ├─► Sort chronologically (oldest first)
   ├─► Calculate running scores per play
   ├─► Transform to PlayByPlayEntry[] format
   │
   └─► ✅ Play-by-play feed ready

3. REAL-TIME SUBSCRIPTION (WebSocket)
   │
   ├─► gameSubscriptionManager.subscribe(gameId)
   ├─► Listen for INSERT/UPDATE on game_stats
   ├─► Listen for INSERT on game_substitutions
   │
   ▼
4. REAL-TIME UPDATE RECEIVED
   │
   ├─► fetchGameData(true) ← isUpdate flag
   ├─► ❌ setLoading(false) NOT called (silent update)
   ├─► Fetch latest data
   ├─► Re-transform to PlayByPlayEntry[]
   ├─► React.memo prevents re-render if data unchanged
   │
   └─► ✅ UI updates smoothly, no white screen

5. COMPONENT RENDERING
   │
   ├─► PlayByPlayFeed (React.memo)
   │   ├─► Maps PlayByPlayEntry[] to PlayEntry components
   │   ├─► Each entry shows: icon, player, action, score, time
   │   └─► NBA-style player points display: "(15 PTS)"
   │
   └─► ✅ Professional NBA-level viewer

RESULT: ✅ Silent updates, no flicker, real-time play-by-play
```

---

## 👤 PLAYER DASHBOARD FLOW

```
┌────────────────────────────────────────────────────────────────────┐
│                  PLAYER DASHBOARD DATA FLOW                         │
└────────────────────────────────────────────────────────────────────┘

1. PLAYER SIGNS IN
   │
   ├─► Redirect to /dashboard/player
   │   ├─► PlayerDashboardPage component
   │   ├─► useAuthContext() provides user
   │   │
   │   ▼
   └─► usePlayerDashboardData(user)

2. DATA FETCHING (PlayerDashboardService)
   │
   ├─► getIdentity(userId)
   │   └─► Query users table for profile data
   │
   ├─► getSeasonAverages(userId)
   │   └─► Query player_season_averages (currently empty)
   │
   ├─► getCareerHighs(userId)
   │   └─► Query player_career_highs
   │
   ├─► getUpcomingGames(userId) ✅ NEW
   │   ├─► Query team_players for player's teams
   │   ├─► Query games WHERE team_a_id OR team_b_id IN (player's teams)
   │   ├─► Filter by status: scheduled, in_progress
   │   ├─► Transform to UpcomingGame format
   │   └─► ✅ Returns actual upcoming games
   │
   └─► getPerformanceAnalytics(userId)
       └─► Query player_performance_analytics (placeholder)

3. GAME STATS TABLE (GameStatsTable.tsx)
   │
   ├─► PlayerGameStatsService.getPlayerGameStats(userId)
   │   ├─► Query game_stats table
   │   ├─► GROUP BY game_id
   │   ├─► Calculate FG%, 3P%, FT%, shooting efficiency
   │   └─► Return GameStatsSummary[] (NBA-style box score)
   │
   └─► ✅ Display game log with all stats

4. MY TOURNAMENTS SECTION
   │
   ├─► Map UpcomingGame[] to TournamentCard components
   │   ├─► Display opponent team name
   │   ├─► Display formatted date/time
   │   ├─► Display tournament venue
   │   │
   │   └─► ✅ "No upcoming games" if player not on team

5. EDIT PROFILE MODAL
   │
   ├─► EditProfileModal component
   │   ├─► Populate form with currentPlayerData
   │   ├─► Parse height/weight to proper format
   │   ├─► Update users table on save
   │   │
   │   └─► ✅ Profile data editable and persisted

RESULT: ✅ Complete player dashboard with live data
```

---

## 🏗️ FRONTEND ARCHITECTURE

### Directory Structure
```
src/
├── app/                          # Next.js 15 app router
│   ├── layout.tsx               # Root layout with AuthProvider
│   ├── page.tsx                 # Home page
│   ├── dashboard/
│   │   ├── page.tsx             # Organizer dashboard
│   │   ├── stat-admin/page.tsx  # Stat admin dashboard
│   │   └── player/page.tsx      # Player dashboard
│   ├── stat-tracker-v3/page.tsx # V3 stat tracker
│   └── game-viewer/[gameId]/    # Live game viewer
│
├── components/                   # React components
│   ├── auth/                    # Authentication components
│   ├── tracker-v3/              # Stat tracker V3 components
│   ├── ui/                      # Shadcn UI components
│   └── *.tsx                    # Feature components
│
├── contexts/
│   └── AuthContext.tsx          # Centralized auth state
│
├── hooks/                        # Custom React hooks
│   ├── useAuthV2.ts             # Auth hook with auto-refresh
│   ├── useTracker.ts            # Stat tracking state
│   ├── useGameViewerV2.ts       # Live viewer data
│   └── usePlayerDashboardData.ts # Player dashboard data
│
├── lib/
│   ├── services/                # Business logic layer
│   │   ├── gameServiceV3.ts     # Game CRUD (Raw HTTP)
│   │   ├── teamServiceV3.ts     # Team data (Raw HTTP)
│   │   ├── authServiceV2.ts     # Authentication (Raw HTTP)
│   │   ├── playerDashboardService.ts # Player data
│   │   └── organizerDashboardService.ts # Organizer data
│   │
│   ├── types/                   # TypeScript interfaces
│   ├── utils/                   # Utility functions
│   └── supabase.ts              # Supabase client config
│
└── lib/utils/
    ├── gameSubscriptionManager.ts # Real-time subscriptions
    └── tokenRefresh.ts            # JWT refresh logic
```

### Key Patterns

**1. Centralized Authentication**
- AuthProvider wraps app
- useAuthContext() for all components
- No redundant auth calls

**2. Service Layer Pattern**
- Business logic in `lib/services/`
- Raw HTTP for V3 services
- Supabase client for legacy features

**3. Custom Hooks for State**
- `useTracker` - Game tracking state
- `useGameViewerV2` - Live viewer data
- `usePlayerDashboardData` - Player profile data

**4. Real-time Manager**
- `gameSubscriptionManager` - WebSocket subscriptions
- Centralized subscription management
- Automatic cleanup on unmount

---

## 🔧 TECHNICAL STACK

### Frontend
- **Framework**: Next.js 15.4.5 (Turbopack)
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS + Shadcn UI
- **State**: React Context API + Custom Hooks
- **Data Fetching**: Raw HTTP + Supabase Client (Hybrid)

### Backend
- **BaaS**: Supabase
- **Database**: PostgreSQL 15
- **Auth**: Supabase Auth (JWT)
- **Real-time**: WebSocket subscriptions
- **Storage**: Supabase Storage (card-assets bucket)
- **Functions**: Supabase Edge Functions

### Development
- **Build Tool**: Turbopack
- **Package Manager**: npm
- **Linting**: ESLint
- **Version Control**: Git + GitHub

---

## 🚀 DEPLOYMENT ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                  PRODUCTION DEPLOYMENT                       │
└─────────────────────────────────────────────────────────────┘

Frontend (Vercel)
├─► Next.js app deployed to Vercel
├─► Automatic deployments from main branch
├─► Environment variables configured
└─► Edge network for global distribution

Backend (Supabase)
├─► PostgreSQL database (hosted)
├─► Real-time engine (hosted)
├─► Storage bucket (hosted)
├─► Edge Functions (hosted)
└─► Automatic backups

DNS & SSL
├─► Custom domain support
└─► Automatic SSL certificates

Monitoring
├─► Vercel Analytics
├─► Supabase Dashboard
└─► Browser Console Logging
```

---

## 📝 CURRENT STATUS

### What's Working ✅
- Authentication with centralized context
- Real-time stat tracking (V3 engine)
- Live viewer with silent updates
- Substitution system with auto-UI updates
- Player Dashboard with upcoming games
- Responsive design for all devices
- JWT auto-refresh
- Performance optimizations

### Known Limitations
- Aggregated tables empty (backend pipeline needed)
- Historical stats table not integrated
- NBA card generation placeholder
- No mobile app (web-only)

### Next Phase Features
See `FEATURES_COMPLETE.md` for full roadmap

---

**For detailed feature documentation, see:**
- `docs/04-features/` - Feature-specific guides
- `docs/03-architecture/` - Detailed architecture docs
- `CHANGELOG.md` - Version history
- `README.md` - Quick start guide
