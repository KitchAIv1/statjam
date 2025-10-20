# StatJam Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.9.8] - 2025-10-19

### 🎉 New Features

#### Team Fouls Tracking System
- **Added**: Auto-aggregating team fouls tracking
- **Added**: Database trigger to auto-increment team fouls when player commits foul
- **Added**: Real-time team foul display in scoreboard (mobile + desktop)
- **Added**: NBA-standard bonus indicator (red "BONUS" at 5+ fouls)
- **Added**: Team foul display in live viewer game summary
- **Backend**: Added `team_a_fouls`, `team_b_fouls` columns to games table

#### Enhanced Timeout Management System
- **Added**: Interactive TimeoutModalV3 component with NBA-style design (200 lines)
- **Added**: Team selection with visual buttons (Team A / Team B)
- **Added**: Timeout type selection (Full 60s / Short 30s)
- **Added**: Live countdown timer with progress bar and glow effect
- **Added**: Auto-stop all clocks (game clock + shot clock) on timeout start
- **Added**: Dimmed overlay prevents stat entry during timeout
- **Added**: Resume Play button for manual timeout end
- **Added**: Auto-warning when < 5 seconds remaining
- **Added**: Timeout validation (prevents recording with 0 timeouts left)
- **Backend**: Added `team_a_timeouts_remaining`, `team_b_timeouts_remaining` columns
- **Backend**: Created `game_timeouts` table for timeout history
- **Backend**: Added `timeout_type` and `duration_seconds` columns

#### Timeout Play-by-Play Integration
- **Added**: Timeout events appear in live viewer play-by-play feed
- **Added**: ⏸️ icon for instant timeout recognition
- **Added**: Amber visual theme (distinct from stats orange and substitutions indigo)
- **Added**: Shows team name + timeout type + duration (e.g., "Lakers Full Timeout (60s)")
- **Added**: Chronological integration with all other plays
- **Enhanced**: Complete game flow visibility for fans

### 🐛 Bug Fixes

#### Desktop Substitution System
- **Fixed**: Desktop substitution was completely non-functional (0% working)
- **Fixed**: Modal never appeared on desktop view
- **Fixed**: Unified substitution logic between mobile and desktop
- **Added**: SubstitutionModalV3 rendering for desktop layout
- **Result**: Desktop substitution now 100% functional

### 🔧 Technical Improvements

#### Database Schema
- **Added**: Migration 006 - Team fouls and basic timeouts
- **Added**: Migration 007 - Enhanced timeout UX (type, duration, in_progress flag)
- **Added**: Auto-increment trigger for team fouls
- **Added**: RLS policies for game_timeouts table
- **Added**: Indexes for performance optimization

#### State Management
- **Enhanced**: useTracker hook with team fouls and timeouts state
- **Added**: Timeout countdown effect (1-second intervals)
- **Added**: Timeout active state management
- **Added**: Clock auto-control during timeouts

#### Service Layer
- **Enhanced**: GameServiceV3.recordTimeout with timeout type parameter
- **Updated**: SELECT queries to include team_fouls and timeouts columns
- **Added**: Timeout history recording to game_timeouts table
- **Added**: Automatic timeout count decrement

### 📚 Documentation
- **Added**: Team Fouls & Timeouts Analysis document
- **Added**: Migration 006 and 007 SQL files with rollback instructions
- **Added**: MVP Readiness Audit report
- **Updated**: README.md with team fouls and timeout features
- **Updated**: Version bumped to 0.9.8

---

## [0.9.7] - 2025-10-19

### 🎉 New Features

#### Validation & Error Handling System
- **Added**: Comprehensive input validation across all user forms
- **Added**: Sonner toast notification library for user feedback
- **Added**: NotificationService with platform abstraction layer (web → Sonner, future RN support)
- **Added**: Stat validation utilities with soft warnings and hard errors
- **Added**: Profile validation utilities for player data
- **Enhanced**: Tournament validation with additional business rules

#### Stat Tracker Validation
- **Added**: Real-time stat value validation before recording
- **Added**: Soft warnings for unusual values (e.g., 25 3-pointers)
- **Added**: Hard errors for impossible values (prevents submission)
- **Added**: Quarter validation with overtime period support
- **Added**: Toast notifications for validation errors and successes

#### Profile Edit Validation
- **Added**: Real-time field validation on blur
- **Added**: Inline error messages for each field
- **Added**: Auto-clear errors when user corrects input
- **Added**: Disable Save button when validation errors exist
- **Added**: Success/error toasts on save operations

#### Tournament Creation Enhancement
- **Added**: Toast notifications on create success/failure
- **Added**: Loading toast during creation
- **Enhanced**: Validation messages with error counts

### 🐛 Bug Fixes

#### User-Friendly Error Messages
- **Enhanced**: GameServiceV3 with status code to user message mapping
- **Enhanced**: TeamServiceV3 with status code to user message mapping
- **Enhanced**: AuthServiceV2 with Supabase error message parsing
- **Fixed**: Network errors now show "No internet connection" instead of technical details
- **Fixed**: Auth errors show specific messages (e.g., "Invalid email or password")

### 🔧 Technical Improvements

#### Validation Rules
- **Points**: 0-100 per player (warning at 50+)
- **3-Pointers**: 0-20 per player (warning at 12+)
- **Rebounds**: 0-40 per player (warning at 25+)
- **Assists**: 0-30 per player (warning at 20+)
- **Steals/Blocks**: 0-15 each (warning at 10+)
- **Fouls**: 0-6 per player (hard limit, warning at 6)
- **Jersey Number**: 0-99
- **Height**: 48-96 inches (4'0" - 8'0")
- **Weight**: 50-400 lbs
- **Age**: 10-99 years
- **Tournament Duration**: Max 1 year
- **Entry Fee**: Max $10,000
- **Prize Pool**: Max $1,000,000

#### Code Quality
- **All new files**: Under 500 lines (largest: 228 lines)
- **TypeScript**: Strict mode compliance
- **Zero linting errors**: All validation passes
- **No backend changes**: Pure frontend implementation
- **Platform ready**: Notification service abstracted for future mobile support

### 📚 Documentation
- **Updated**: Version bumped to 0.9.7
- **Added**: CHANGELOG entry for validation and error handling
- **Added**: MVP_VALIDATION_ERROR_HANDLING_PLAN.md implementation guide

### 🔒 Security Hardening (P0 Fixes)

#### Constructor Safety
- **Fixed**: AuthServiceV2 constructor throwing errors causing SSR crashes
- **Added**: Graceful degradation with runtime validation in getHeaders method
- **Impact**: Zero breakage - methods fail gracefully with clear error messages
- **Risk**: Eliminated build crash risk during SSR/build time

#### CORS Security
- **Fixed**: Wildcard '*' CORS in edge function allowing any origin
- **Added**: Validated origin list with localhost + production domains
- **Added**: 'Vary: Origin' header for proper caching
- **Impact**: Zero breakage while significantly reducing attack surface
- **Location**: supabase/functions/render-card-quick/index.ts

#### Performance Optimization
- **Fixed**: Excessive will-change CSS properties causing memory overhead
- **Removed**: Unnecessary will-change from auth-input and auth-button
- **Kept**: Essential transform optimizations for animated elements
- **Impact**: Improved memory usage and rendering performance

---

## [0.9.6] - 2025-10-18

### 🎉 New Features

#### My Tournaments Section
- **Fixed**: Player Dashboard "My Tournaments" section now displays actual upcoming games
- **Added**: `PlayerDashboardService.getUpcomingGames()` full implementation
- **Added**: Queries `team_players` table to find player's team assignments
- **Added**: Queries `games` table for upcoming games involving player's teams
- **Added**: Data transformation to match UI requirements
- **Fixed**: Proper mapping of `UpcomingGame` fields to `TournamentCard` component

#### Live Game Status
- **Fixed**: Home page live game cards now show "LIVE" status correctly
- **Added**: `GameServiceV3.updateGameStatus()` method
- **Added**: Automatic status update from 'scheduled' to 'in_progress' when tracker starts
- **Fixed**: Status persistence so games show as live after tracker is running

### 📚 Documentation

#### Organization
- **Moved**: All root-level documentation files into proper `docs/` folder structure
- **Moved**: `ARCHITECTURE_DESIGN.md` → `docs/03-architecture/`
- **Moved**: `AUTHENTICATION_AUDIT.md` → `docs/04-features/authentication/`
- **Moved**: `PERFORMANCE_MEASUREMENT.md` → `docs/02-development/`
- **Moved**: `LIVE_VIEWER_DATA_ANALYSIS.md` → `docs/04-features/live-viewer/`
- **Moved**: `LIVE_VIEWER_UI_ANALYSIS.md` → `docs/04-features/live-viewer/`
- **Moved**: `PLAYER_DASHBOARD_ANALYSIS.md` → `docs/04-features/dashboards/`
- **Moved**: `PLAYER_DASHBOARD_DATA_AUDIT.md` → `docs/04-features/dashboards/`
- **Updated**: `docs/INDEX.md` with all new document locations and quick search links
- **Archived**: Legacy PRD from parent directory to `docs/08-archive/LEGACY_PRD_ORIGINAL.md`

---

## [0.9.5] - 2025-10-18

### 🎉 Major Features

#### Substitution System Overhaul
- **Fixed**: Substitution UI now updates automatically without page refresh
- **Added**: `TeamServiceV3.getTeamPlayersWithSubstitutions()` method
- **Added**: On-court vs bench status tracking based on substitution history
- **Added**: Real-time roster updates with React key optimization
- **Added**: Substitutions integrated into play-by-play feed
- **Added**: NBA-style substitution entries with indigo styling
- **Added**: Loading overlay during substitution process

#### Play-by-Play Enhancements
- **Added**: Substitution events in live viewer feed
- **Added**: NBA-style player points display (e.g., "(15 PTS)")
- **Added**: Lead indicators in score display
- **Added**: Substitution icon (🔄) and special styling
- **Fixed**: Silent updates - no white screen on real-time data changes
- **Fixed**: React.memo optimization to prevent unnecessary re-renders

### 🔧 Bug Fixes

#### Stat Tracker
- **Fixed**: Infinite shot clock violation loop
- **Fixed**: Players disappearing after substitution
- **Fixed**: ReferenceError: statsError is not defined
- **Fixed**: Shot clock auto-restart preventing violations
- **Fixed**: Substituted players not visible in roster

#### Live Viewer
- **Fixed**: White screen with thinking cursor on data updates
- **Fixed**: CSS conflict warning (background vs backgroundColor)
- **Fixed**: "Invalid Date" display in game header
- **Fixed**: useCallback not imported causing ReferenceError
- **Fixed**: Expanded view stretching across full viewport

#### Player Dashboard
- **Fixed**: Authentication loop and undefined user issues
- **Fixed**: Profile save with height/weight type conversion
- **Fixed**: Empty src attribute causing page download
- **Fixed**: Missing "Edit Profile" and "Generate Card" buttons
- **Fixed**: Profile card height cutting off buttons
- **Fixed**: Photo containers too large in edit modal

#### Organizer Dashboard
- **Fixed**: Active tournament count showing 0 (verified as correct)
- **Fixed**: Infinite authentication loop after status change
- **Fixed**: Team count causing infinite re-renders
- **Fixed**: Jersey number update errors
- **Fixed**: Removed player name editing (independent profiles)

#### Authentication
- **Fixed**: JWT token expiration causing 401/403 errors
- **Fixed**: New user signup not auto-signing in
- **Fixed**: Redirect loop after signup
- **Fixed**: Multiple useAuthV2 calls per component

### 🎨 UI/UX Improvements

#### Mobile Stat Tracker
- **Changed**: Shot clock moved below top scoreboard
- **Changed**: Start/stop buttons removed from shot clock (uses main clock)
- **Changed**: Edit button moved to same row as 24s/14s/restart
- **Changed**: Shot clock integrated into compact scoreboard
- **Changed**: Narrower number style with font-mono
- **Changed**: Increased score card height (h-24 → h-28)
- **Changed**: Date moved to leftmost side of controls
- **Changed**: Quarter and shot clock in unified compact containers

#### Desktop Stat Tracker
- **Changed**: Shot clock in separate container beside quarter section
- **Changed**: Dual-container layout with equal heights
- **Changed**: Increased spacing between team sections
- **Changed**: Shot clock START replaced with EDIT button
- **Added**: Scrolling enabled for expanded view
- **Changed**: Responsive text sizes and button heights

#### Live Viewer
- **Changed**: Fixed-width 800px centered layout
- **Changed**: Tab styling with subtle active state
- **Changed**: "Game" tab renamed to "Box Score"
- **Added**: Team names in play-by-play score display
- **Added**: Lead indicators for score differences

#### Substitution Modal
- **Fixed**: Completely transparent modal background
- **Fixed**: All text visibility issues
- **Fixed**: Cancel button showing white initially
- **Changed**: Solid dark theme with proper contrast
- **Changed**: All CSS variables replaced with solid colors

### 🏗️ Architecture

#### Centralized Authentication
- **Added**: AuthContext and AuthProvider
- **Added**: useAuthContext hook for global auth state
- **Migrated**: All dashboards to use centralized auth
- **Migrated**: All hooks to accept user as parameter
- **Removed**: Direct authServiceV2 calls from services
- **Result**: 97% reduction in authentication API calls

#### Service Layer Improvements
- **Added**: TeamServiceV3.getTeamPlayersWithSubstitutions()
- **Enhanced**: GameServiceV3 with automatic token refresh on 401/403
- **Enhanced**: PlayerDashboardService with userId parameters
- **Fixed**: TournamentService removing auth calls
- **Added**: Cache-control headers for fresh data

#### Performance Optimizations
- **Added**: React.memo for PlayByPlayFeed component
- **Added**: Custom comparison function for memoization
- **Added**: JWT auto-refresh every 45 minutes
- **Added**: Token expiration checking on mount
- **Added**: Retry logic with exponential backoff
- **Optimized**: Re-render prevention with useMemo and useCallback

### 📊 Performance Metrics
- Authentication API calls: 97% reduction (30+ → 1 per session)
- Page load time: < 1 second
- Stat recording: < 100ms
- Real-time updates: < 500ms
- Substitution UI update: Instant (< 100ms)

---

## [0.9.0] - 2025-10-17

### Initial MVP Release
- Authentication V2 system
- Stat Tracker V3 with raw HTTP
- Live Viewer V2 with hybrid updates
- Organizer Dashboard
- Player Dashboard
- Basic substitution system
- Real-time game streaming

---

## Future Versions

### [1.0.0] - Planned
- Premium subscriptions
- Advanced analytics
- Player card generation
- Public tournament pages
- Multi-sport support
- Mobile apps

---

**For detailed documentation, see `/docs/INDEX.md`**

