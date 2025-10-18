# StatJam Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

