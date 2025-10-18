**StatJam Product Requirements Document (PRD) – Full Product Release**

---

## 🔥 Project Summary

StatJam is a professional-grade sports tournament app built for real-time stat tracking, tournament organizing, and team/player performance management. It targets basketball tournaments initially and will expand to other sports. StatJam will ship as a full product (not MVP) with backend-powered authentication, real-time functionality, advanced stat-tracking, offline sync, fan/public access, and a polished, branded UI/UX.

---

## 👥 Target User Roles

1. **Organizers** – Create tournaments, manage teams, assign stat admins, schedule games, and view stats.
2. **Stat Admins** – Record live game data, including advanced stats.
3. **Players** – Can be Free or Premium. View performance, join teams, track progress.
4. **Fans** – Public viewers accessing tournament landing pages to see schedules, scores, team/player stats.

---

## 🚀 Phase 1 Deliverables

### ✅ Organizer Module

* Create/manage tournaments
* Organizer dashboard with team and stat overview
* Add teams manually or import via CSV
* Add players to teams (manual or via roster search)
* Assign Stat Admins per match
* Schedule games: date, time, venue, teams involved
* Country selection (used across UI views)
* Tournament Visibility: Public (discoverable on landing) or Private (only invited users)
* Ability to view Fan-facing landing page for their tournaments
* Games list with filters (per date, team, group phase, etc.)
* Bracket builder / Pool play scheduler

### ✅ Stat Admin Module (NBA-Level Tracking) - COMPLETE

* ✅ Real-time game stat input with V3 Raw HTTP engine
* ✅ Game clock control (start, stop, reset, manual edit)
* ✅ Shot clock integration (24s, 14s reset, edit mode)
* ✅ Substitution system with auto-UI refresh
  * Real-time roster updates without page refresh
  * Substitutions appear in play-by-play feed
  * On-court vs bench tracking
  * Chronological substitution history
* ✅ Team A vs Team B dual roster display
* ✅ Responsive layouts (mobile, tablet, desktop)
* ✅ Stats per player:
  * Points (made/missed) - 2PT, 3PT, FT
  * Assists
  * Rebounds (Offensive / Defensive)
  * Steals
  * Blocks
  * Turnovers
  * Fouls (Personal / Technical)
  * Free Throws (Made / Missed)
  * 2pt FG (Made / Missed)
  * 3pt FG (Made / Missed)
  * Minutes Played (automated via substitution timing)
  * All stats recorded to game_stats table

### ✅ Player Module - COMPLETE

* ✅ Player Profile Management
  * Editable profile with name, height, weight, position
  * Photo uploads (profile photo + action pose)
  * Smart type conversion (6'0" → inches, "180 lbs" → pounds)
  * Independent profile control (organizers cannot edit player names)
* ✅ Two account types:
  * **Premium**: Full visibility, searchable by organizers, fast invite (Coming Soon)
  * **Free**: Basic profile and stats access (Current)
* ✅ Performance dashboard
  * Season averages display
  * Career highs tracking
  * Achievement badges
  * Game stats table (NBA-style box scores)
  * Upcoming games schedule
* ✅ Authentication with auto-redirect to dashboard
* ✅ Profile data persistence across sessions

### ✅ Fan Module (Landing Page View)

* No login required
* Homepage includes:

  * Hero Section (branding + pitch)
  * Public Tournaments Section
  * Public Organizer Sections w/ their hosted tournaments
  * Linkable tournament pages (shareable)

### ✅ UI Country Filters

* Country-based tournament filtering throughout landing and internal screens
* Initial country setting: Organizer selection during tournament creation
* Filtering behavior:

  * Public users: auto-filter by selected or detected country (no clutter)
  * Organizer Dashboard: country-scoped views

### ✅ Offline Sync (Phase 1.5)

* Local data cache for stat entry when offline
* Sync stats when back online

---

## 🔐 Backend Authentication & Infrastructure - IMPLEMENTED

* ✅ Full Supabase Auth with Enterprise Enhancements
  * JWT-based secure session handling with auto-refresh (45-minute intervals)
  * Centralized AuthContext for global state management
  * Role-based access: Organizer, Stat Admin, Player, Public
  * Automatic token refresh on 401/403 errors
  * 97% reduction in authentication API calls
* ✅ Supabase DB with Row-Level Security (RLS)
  * Comprehensive RLS policies for all tables
  * Stat admin can manage their assigned games
  * Organizers can view their tournament data
  * Public can view public tournaments
* ✅ Real-time Architecture
  * gameSubscriptionManager for WebSocket subscriptions
  * Silent updates without loading screens
  * Hybrid approach: WebSocket + polling fallback
* ✅ Raw HTTP V3 Pattern
  * Direct REST API calls bypassing client issues
  * GameServiceV3, TeamServiceV3 for reliability
  * Cache-control headers for fresh data
* ✅ Database Triggers
  * Auto-populate public.users from auth.users on signup
  * Score synchronization triggers
* ✅ Supabase Storage for Images
  * Profile photos and action poses
  * Tournament logos and banners
* ✅ Comprehensive Error Handling
  * Retry logic with exponential backoff
  * Fallback mechanisms for critical operations
  * Detailed logging for debugging

---

## 🛠️ Tech Stack

* **Frontend**: Next.js 14 + TypeScript, Tailwind CSS with custom components
* **Backend**: Supabase (Postgres + Auth + Storage + Edge Functions)
* **State Management**: Zustand for client state management
* **Real-time**: Supabase subscriptions for live stat updates
* **Charts/Visualization**: Recharts for stat displays
* **Offline Sync**: Browser localStorage with sync queuing (Phase 1.5)
* **Time Handling**: Day.js for game scheduling and timing
* **Design/Prototyping**: Figma
* **Version Control**: GitHub (using Cursor.dev)

---

## 🎨 UI/UX Design and Branding

### Design Principles

* **STUNNING Landing Page**: NBA.com/ESPN.com inspired hero sections with dynamic content
* Dark Mode Default with accent contrast (purple + gold theme)
* Responsive grid-based layout with modular components
* Heroic Tournament Branding Pages (NBA-vibe with premium feel)
* Smooth animations and micro-interactions for premium UX
* Seamless page transitions with loading states
* Card-style UI for teams, players, stats with hover effects
* Tabbed navigation for Game Schedule, Teams, Player Stats, and Leaderboards
* Dynamic hero banners per organizer and tournament with video/image backgrounds
* Typography hierarchy using web fonts for maximum visual impact

### Branding

* App Name: **StatJam**
* Tagline: “Your courtside command center.”
* Fonts: Poppins (UI), Anton (Headers)
* Colors:

  * Primary: Royal Purple (#4B0082)
  * Accent: Gold (#FFD700)
  * Background: Dark Gray (#121212)
* Logo: Whistle + Scoreboard icon (custom vector)

---

## 🔁 Updated Flows

### Player Invitation Logic

* Organizer searches player (free and premium both visible)

  * Premium: high visibility
  * Free: listed below
* Invite sent to player dashboard (no email required)
* Player accepts invite and joins team

### Substitution + Time Tracking

* Substitution button:

  * Stops and starts the player’s `minutes_played`
  * Accumulates total per game
* Stat Admin triggers substitution manually in-game UI

---

## 📈 Phase 2 (Post Launch Priorities)

* Advanced analytics (charts, graphs)
* Sponsor banners per tournament
* Multi-sport expansion (e.g., volleyball, futsal)
* Fan following and commenting system
* Leaderboards: top scorers, assist leaders, rebound kings
* iPad/Tablet-optimized layouts

---

## 📌 Summary

StatJam’s full product rollout is positioned to rival pro-level tools with intuitive UX, airtight backend infrastructure, real-time features, and an extensible stat framework. No features will be left half-baked—Phase 1 is full-grade and ready to deploy across serious tournament organizations.

---

Let me know when you're ready for a Figma-style UI visual system or stakeholder presentation deck.
