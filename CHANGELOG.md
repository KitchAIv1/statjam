# StatJam Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.10.0] - 2025-10-21

### 🎓 **ORGANIZER GUIDE UX SYSTEM**

#### Complete 3-Surface Guide Implementation
- **Added**: Comprehensive guide system for organizer onboarding and reference
- **Architecture**: React Context-based state management for proper state synchronization
- **Persistence**: localStorage integration for user preferences and session tracking
- **Mobile-First**: Fully responsive design with right-side slide panel

#### Guide Surfaces

**1. Header Guide Button**
- **Component**: `OrganizerGuideButton.tsx` (41 lines)
- **Features**:
  - Visible only to authenticated organizer users
  - "New" badge displayed for first 3 sessions
  - Smooth animation and hover effects
  - White text with orange hover state matching navbar theme
  - Tooltip: "Organizer Guide: setup, statisticians, live tracking"
  - Proper event handling to prevent propagation issues

**2. Dashboard Callout Card**
- **Component**: `OrganizerGuideCallout.tsx` (57 lines)
- **Features**:
  - Auto-shows for first 3 sessions or until dismissed
  - Dismissible with X button (persists across sessions)
  - Gradient background design for high visibility
  - Quick start bullet points:
    * Create tournament and add teams
    * Assign a Stat Profile in Game Settings
    * Stat admin launches Stat Tracker for live stats
  - "Open Guide" CTA button

**3. Comprehensive Guide Panel**
- **Component**: `OrganizerGuidePanel.tsx` (295 lines)
- **Features**:
  - Right-side slide panel (Shadcn Sheet component)
  - Scrollable content with 6 comprehensive sections
  - Mobile responsive (full width mobile, 384px max desktop)
  - ESC key and click-outside to close
  - WhatsApp support integration (+7472189711)

**Guide Content Sections**:
1. **Quick Start**: Overview and welcome message
2. **Create Organizer Account**: Account setup and profile completion
3. **Create Tournament & Teams**: Tournament creation, team/player management
4. **Assign a Statistician**: Stat profile setup and assignment workflow
5. **Run the Game**: Live stat tracking process and requirements
6. **Review & Share**: Post-game summaries, stats, and sharing features
7. **Beta Feedback**: WhatsApp contact for support and feedback

#### Technical Implementation

**New Files Created**:
- `contexts/OrganizerGuideContext.tsx` (136 lines) - Centralized state management
- `components/guide/OrganizerGuideButton.tsx` (41 lines) - Header button
- `components/guide/OrganizerGuidePanel.tsx` (295 lines) - Main guide panel
- `components/guide/OrganizerGuideCallout.tsx` (57 lines) - Dashboard callout
- `components/guide/GuideSection.tsx` (25 lines) - Reusable section component
- `components/guide/index.ts` (4 lines) - Barrel exports
- `hooks/useOrganizerGuide.ts` (121 lines) - Hook wrapper for context
- `lib/types/guide.ts` (40 lines) - TypeScript interfaces

**Context Provider Pattern**:
```typescript
interface OrganizerGuideContextType {
  // State
  isGuideOpen: boolean;
  showCallout: boolean;
  showBadge: boolean;
  sessionCount: number;
  
  // Actions
  openGuide: () => void;
  closeGuide: () => void;
  dismissCallout: () => void;
  incrementSession: () => void;
}
```

**State Management**:
- Centralized state via React Context API
- Solves state synchronization issues between components
- All components share single source of truth
- Prevents duplicate hook instances

**localStorage Schema**:
```typescript
interface GuideState {
  sessionCount: number;        // Number of dashboard visits
  calloutDismissed: boolean;   // Permanent dismissal flag
  panelOpenCount: number;      // Times panel was opened
  lastShown?: string;          // ISO date of last session
}
```

**Session Tracking**:
- Auto-increments on dashboard load (once per day)
- Badge shows for first 3 sessions AND zero panel opens
- Callout shows for first 3 sessions AND not dismissed
- Date-based duplicate prevention

#### Integrations

**Navigation Header**:
- Guide button conditionally rendered for organizer role
- Integrated into right-side actions section
- Positioned between nav links and user dropdown

**Dashboard Page**:
- Wrapped with `OrganizerGuideProvider` for state access
- Guide panel rendered at root level (outside scrolling content)

**Dashboard Overview**:
- Callout card rendered at top (before stats cards)
- Auto-triggers session increment on mount
- Respects dismissal state

### 🐛 **Bug Fixes**

#### State Synchronization Issue
- **Problem**: Guide button clicks worked but panel didn't open
- **Root Cause**: Each component created separate hook instances with isolated state
- **Solution**: Migrated from individual `useState` hooks to React Context
- **Impact**: Button and panel now share state perfectly, instant synchronization

#### Guide Button Clickability
- **Fixed**: Badge overlay blocking button clicks
- **Added**: `pointer-events-none` to badge elements
- **Added**: Proper event handling with `preventDefault` and `stopPropagation`
- **Added**: z-index layering for proper stacking

#### Session Counting
- **Fixed**: Multiple increments on same day
- **Added**: Date comparison logic (`toDateString()` check)
- **Impact**: Session count accurately reflects unique dashboard visits

### 🎨 **UI/UX Improvements**

#### Support Contact Enhancement
- **Changed**: Email contact (support@statjam.app) → WhatsApp (+7472189711)
- **Reason**: Better real-time support and accessibility
- **Visual**: Green themed button (was blue) for WhatsApp branding
- **Action**: Opens WhatsApp web/app in new tab

#### Guide Button Styling
- **Text Color**: White (default), Orange on hover
- **Background**: Transparent ghost, Orange tint on hover
- **Badge**: Primary colored with pulse animation
- **Consistency**: Matches existing navbar button patterns

#### Mobile Responsiveness
- **Panel**: Full-width on mobile, constrained on desktop
- **Button**: Icon-only on small screens, text visible on sm+
- **Callout**: Responsive padding and typography
- **Sheet**: Native mobile slide animations

### 🔧 **Technical Improvements**

#### Code Quality
- **Clean Architecture**: Separation of state, UI, and business logic
- **TypeScript**: Full type safety across all components
- **No Console Pollution**: All debug logs removed from production code
- **Linting**: Zero ESLint errors, follows modularity guidelines

#### Performance
- **Memoization**: Used `useCallback` for all actions (empty deps with functional updates)
- **Conditional Rendering**: Guide components only mount for organizer role
- **Lazy State Init**: localStorage read only on initial mount
- **Efficient Updates**: Functional state updates prevent unnecessary re-renders

#### SSR Safety
- **localStorage Checks**: All access wrapped in `typeof window !== 'undefined'`
- **Error Handling**: Try-catch blocks for localStorage operations
- **Fallback State**: Default values when localStorage unavailable

### 📝 **Documentation Updates**
- Updated PROJECT_STATUS.md to v0.10.0
- Updated CHANGELOG.md with comprehensive v0.10.0 entry
- Documented all new components and their purposes
- Added technical implementation details

---

## [0.9.9] - 2025-10-20

### 🏗️ **MAJOR ARCHITECTURE REFACTORING**

#### AuthPageV2 Component Decomposition
- **Refactored**: Decomposed 997-line monolithic AuthPageV2 into 14 modular components
- **Reduced**: Main component from 997 lines to 81 lines (92% reduction)
- **Reduced**: Main function from 888 lines to 43 lines (95% reduction)
- **Improved**: Code quality violations from 21 to 1 (95% improvement)
- **Created**: 7 new custom hooks for authentication logic
- **Created**: 4 new UI components for modular forms
- **Created**: Validation utilities and styling modules
- **Result**: Maintainable, testable, scalable authentication system

**Files Created**:
- `components/auth/AuthFormContainer.tsx` (110 lines) - UI container
- `components/auth/SignInForm.tsx` (80 lines) - Sign-in form
- `components/auth/SignUpForm.tsx` (145 lines) - Sign-up form
- `components/auth/RoleSelector.tsx` (60 lines) - Role selection
- `components/auth/AuthInput.tsx` (40 lines) - Reusable input
- `components/auth/PasswordStrengthIndicator.tsx` (60 lines) - Password feedback
- `components/auth/styles/AuthPageStyles.ts` (300 lines) - All styles
- `components/auth/utils/authValidation.ts` (50 lines) - Validation logic
- `hooks/useAuthForm.ts` (146 lines) - Form state management
- `hooks/useAuthFlow.ts` (205 lines) - Business logic
- `hooks/useAuthError.ts` (40 lines) - Error handling
- `hooks/usePasswordStrength.ts` (30 lines) - Password validation
- `hooks/useNameValidation.ts` (40 lines) - Name validation
- `hooks/useAuthSubmit.ts` (75 lines) - Form submission
- `hooks/useAuthPageSetup.ts` (30 lines) - Initialization
- `utils/validators/authValidators.ts` (60 lines) - Core validators

### 🛡️ **FRONTEND MODULARITY GUARDRAILS**

#### Code Quality Enforcement System
- **Added**: `.cursorrules` file for AI-level code generation enforcement
- **Added**: ESLint Frontend Modularity rules in `eslint.config.mjs`
- **Installed**: `eslint-plugin-sonarjs`, `eslint-plugin-unicorn`
- **Configured**: Hard limits for file size, function size, complexity
- **Established**: Naming conventions and code organization standards

**Guardrail Rules**:
- Max 500 lines per file
- Max 200 lines per React component
- Max 100 lines per custom hook
- Max 40 lines per function
- Max complexity: 10
- No vague identifiers (data, info, helper, temp, obj)
- Proper PascalCase/camelCase naming
- Separation of UI and business logic

**Impact**:
- Identified 337 modularity violations in legacy code
- Established baseline for gradual improvement
- Prevents future technical debt
- Guides all future development

### 🎯 **TIER 2 VALIDATION FEATURES**

#### Password Strength Indicator
- **Added**: Real-time password strength calculation
- **Added**: Visual strength bar with smooth animations
- **Added**: Color-coded indicators (Weak/Medium/Strong/Very Strong)
- **Added**: Scoring system (0-6 points based on length, complexity)
- **Added**: Helpful hint text for password requirements
- **Implementation**: `PasswordStrengthIndicator.tsx`, `usePasswordStrength.ts`

#### Enhanced Email Validation
- **Improved**: Email regex from simple to robust pattern
- **Now Rejects**: Invalid formats (@@, leading/trailing dots, short TLDs)
- **Prevents**: Common email injection patterns
- **Location**: `authServiceV2.ts` (Line 215)

#### Metadata Validation
- **Added**: Server-side validation for user role metadata
- **Validates**: userType field exists and is valid
- **Allowed Values**: player, organizer, stat_admin
- **Prevents**: Invalid role injection attacks
- **Error Messages**: Clear, user-friendly validation errors
- **Location**: `authServiceV2.ts` (Lines 209-224)

#### Name Validation
- **Added**: Real-time first/last name validation
- **Rules**: 2-50 characters, letters/spaces/hyphens/apostrophes only
- **Rejects**: Numbers, special characters, HTML
- **Accepts**: Valid names (John, O'Brien, Anne-Marie, de la Cruz)
- **Frontend**: HTML5 validation + real-time feedback
- **Backend**: Server-side validation for security
- **Implementation**: `useNameValidation.ts`, `authValidators.ts`

### 🐛 **Bug Fixes**

#### Critical stat_admin Redirect Fix
- **Fixed**: stat_admin users redirected to `/stat-tracker` instead of `/dashboard/stat-admin`
- **Impact**: Stat admins saw "No game data available" after login
- **Root Cause**: Extraction bug during refactoring
- **Resolution**: Updated `useAuthFlow.ts` line 95
- **Status**: Verified working for all user roles

#### Session Management Issues
- **Documented**: 403 session_not_found errors from stale tokens
- **Created**: `scripts/clear-invalid-session.js` for cleanup
- **Documented**: `AUTH_SESSION_ISSUES_FIX.md` for troubleshooting
- **Note**: Not related to refactoring, existing operational issue

### 📚 **Documentation Updates**

#### New Documentation
- `docs/04-fixes/AUTHPAGEV2_REFACTORING_COMPLETE.md` - Complete refactoring details
- `docs/04-fixes/TIER2_IMPLEMENTATION_COMPLETE.md` - Tier 2 features documentation
- `docs/04-fixes/ESLINT_MODULARITY_SETUP_REPORT.md` - Code quality setup
- `docs/04-fixes/REFACTORING_AUDIT_CRITICAL_FINDINGS.md` - Lessons learned
- `docs/04-fixes/AUTH_SESSION_ISSUES_FIX.md` - Session troubleshooting
- `docs/04-features/authentication/AUTH_V2_REFACTORED.md` - Updated auth architecture

#### Updated Documentation
- `docs/01-project/PROJECT_STATUS.md` - Updated to v0.9.9
- `docs/01-project/SYSTEM_ARCHITECTURE.md` - Added frontend modularity section
- `CHANGELOG.md` - This file

### 🔧 **Technical Improvements**

#### Build & Performance
- Bundle size: 15.6 kB → 16.6 kB (+1 kB for 4 Tier 2 features)
- Build time: Improved with modular architecture
- Hot reload: Faster with smaller components
- Tree-shaking: More effective with modular code

#### Code Maintainability
- Testability: Each component can be unit tested independently
- Reusability: Components and hooks can be used across the app
- Debugging: Easier to isolate issues in smaller files
- Collaboration: Reduced merge conflicts with modular structure

### 📊 **Metrics**

**Code Quality Improvement**:
- Main component: 997 → 81 lines (92% reduction)
- Largest function: 888 → 43 lines (95% reduction)
- Violations: 21 → 1 (95% improvement)
- Complexity: 20 → <10 (50% reduction)

**Development Velocity**:
- New features can be added in isolated files
- No risk of breaking monolithic component
- Clear ownership and responsibilities
- Faster code reviews

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

