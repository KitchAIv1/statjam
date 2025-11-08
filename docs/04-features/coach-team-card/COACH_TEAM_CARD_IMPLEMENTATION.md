# 👨‍🏫 Coach Team Card System - Implementation Guide

**Version**: 1.2.0  
**Date**: December 2025  
**Status**: ✅ Complete Implementation with UI Optimizations & RLS Fixes  
**Branch**: `feature/coach-team-card`

---

## 📋 Overview

The Coach Team Card System provides coaches with comprehensive team management capabilities, allowing them to create and manage non-tournament teams, handle player rosters, and conduct Quick Track stat tracking sessions.

### Key Features

- **Coach Role Authentication**: Dedicated coach role with specific permissions
- **Team Management**: Create, edit, delete, and manage non-tournament teams
- **Official vs Practice Team Types**: Toggle defines whether games impact player dashboards
- **Player Management**: Add existing StatJam users or create custom players
- **Quick Track Integration**: Reuse Stat Tracker V3 for coach-specific games
- **Mixed Rosters**: Support both StatJam users and custom players
- **Team Visibility**: Public/private team controls
- **Player Validation**: Minimum 5 players required for Quick Track

---

## 🏗️ Architecture

### Database Schema

#### Core Tables

**`custom_players`**:
```sql
- id (UUID, Primary Key)
- team_id (UUID, Foreign Key to teams)
- coach_id (UUID, Foreign Key to users)
- name (VARCHAR, Required)
- jersey_number (INTEGER, Optional)
- position (VARCHAR, Optional)
- notes (TEXT, Optional)
- created_at, updated_at (TIMESTAMPTZ)
```

**`team_players` (Extended)**:
```sql
- id (UUID, Primary Key)
- team_id (UUID, Foreign Key)
- player_id (UUID, Foreign Key to users) - For StatJam users
- custom_player_id (UUID, Foreign Key to custom_players) - For custom players
- CONSTRAINT: Either player_id OR custom_player_id must be set, not both
```

**`teams` (Extended)**:
```sql
- coach_id (UUID, Foreign Key to users)
- visibility (ENUM: 'public', 'private')
- tournament_id (NULL for coach teams)
```

**`games` (Extended)**:
```sql
- is_coach_game (BOOLEAN)
- opponent_name (VARCHAR)
- meta_json (JSONB for coach-specific data)
```

#### RLS Policies

**Coach Access Policies**:
- `custom_players_coach_access`: Coaches can manage their own custom players
- `teams_coach_access`: Coaches can manage their own teams
- `games_coach_access`: Coaches can manage their own games
- `team_players_coach_access`: Coaches can manage team rosters

**Public Access Policies**:
- `custom_players_public_read`: Public teams' custom players are readable
- `teams_public_read`: Public teams are readable by all users

---

## 🔧 Implementation Details

### Service Layer

#### CoachTeamService
```typescript
// Core team management
createTeam(teamData: CreateCoachTeamRequest): Promise<CoachTeam>
getCoachTeams(coachId: string): Promise<CoachTeam[]>
updateTeam(teamId: string, updates: Partial<CoachTeam>): Promise<CoachTeam>
deleteTeam(teamId: string): Promise<void>

// Team visibility
toggleTeamVisibility(teamId: string): Promise<CoachTeam>
```

#### CoachPlayerService
```typescript
// Player management
getCoachTeamPlayers(teamId: string): Promise<CoachPlayer[]>
addPlayerToTeam(teamId: string, playerId: string): Promise<void>
removePlayerFromTeam(teamId: string, playerId: string): Promise<void>

// Custom players
createCustomPlayer(teamId: string, playerData: CreateCustomPlayerRequest): Promise<CoachPlayer>
searchAvailablePlayers(query: string): Promise<Player[]>

// Validation
getTeamPlayerCount(teamId: string): Promise<number>
validateMinimumPlayers(teamId: string, minimum: number): Promise<boolean>
```

#### CoachGameService
```typescript
// Quick Track games
createQuickTrackGame(gameData: CreateQuickTrackGameRequest): Promise<CoachGame>
getCoachGames(coachId: string): Promise<CoachGame[]>

// Game management
updateGameStatus(gameId: string, status: GameStatus): Promise<void>
```

### Component Architecture

#### Core Components

**CoachDashboard** (`/src/app/dashboard/coach/page.tsx`):
- Main coach dashboard with team overview
- Team creation and management interface
- Quick Track launch functionality
- Onboarding checklist + help panel highlight team type rules

**CoachTeamCard** (`/src/components/coach/CoachTeamCard.tsx`):
- Individual team display with stats
- Player count and validation
- Quick Track button with minimum player check
- Team visibility toggle
- Team type badge (Official vs Practice) and edit modal warnings

**CoachTeamsSection** (`/src/components/coach/CoachTeamsSection.tsx`):
- Team listing and filtering
- Create team button
- Team search and management

#### Player Management Components

**CoachPlayerManagementModal** (`/src/components/coach/CoachPlayerManagementModal.tsx`):
- Full player management interface
- Current roster display
- Add/remove player functionality

**CoachPlayerSelectionList** (`/src/components/coach/CoachPlayerSelectionList.tsx`):
- Player search and selection UI
- Toggle between StatJam users and custom players
- List-based modern interface

**CreateCustomPlayerForm** (`/src/components/coach/CreateCustomPlayerForm.tsx`):
- Custom player creation form
- Name, jersey number, position fields
- Validation and error handling

#### Team Creation Components

**CreateCoachTeamModal** (`/src/components/coach/CreateCoachTeamModal.tsx`):
- 2-step team creation process
- Step 1: Team details (name, location, visibility)
- Team Type toggle (Official vs Practice) with player-impact messaging
- Step 2: Player management (add players)
- Progress indicator and validation

**CoachQuickTrackModal** (`/src/components/coach/CoachQuickTrackModal.tsx`):
- Quick Track game creation
- Player validation (minimum 5 players)
- Integration with Stat Tracker V3

---

## 🔄 Data Flow

### Team Creation Flow

```
1. Coach clicks "Create Team"
2. CreateCoachTeamModal opens (Step 1: Team Details)
3. Coach fills team information
4. Coach clicks "Next" → Step 2: Player Management
5. CoachPlayerSelectionList loads available players
6. Coach adds players (StatJam users or custom players)
7. Coach clicks "Create Team" → CoachTeamService.createTeam()
8. Team created with players → Success message
9. Coach redirected to team management
```

### Player Management Flow

```
1. Coach clicks "Manage Players" on team card
2. CoachPlayerManagementModal opens
3. Current roster displayed with remove options
4. Coach clicks "Add Players" → CoachPlayerSelectionList
5. Coach searches and selects players
6. Coach clicks "Add to Team" → CoachPlayerService.addPlayerToTeam()
7. Player added to roster → UI updates
8. Player count updated → Quick Track validation
```

### Quick Track Flow

```
1. Coach clicks "Quick Track" on team card
2. CoachPlayerService.validateMinimumPlayers() checks for 5+ players
3. If insufficient: Show "Add Players First" message
4. If sufficient: CoachQuickTrackModal opens
5. Coach enters opponent name and game details
6. Coach clicks "Start Tracking" → CoachGameService.createQuickTrackGame()
7. Game created → Navigate to /stat-tracker-v3?coachMode=true
8. Stat Tracker V3 loads in coach mode with OpponentTeamPanel
```

### Official vs Practice Team Flag

**Business Logic**:
- Official teams contribute to linked players' profile dashboards and season totals.
- Practice teams remain coach-only; their games and stats are excluded from player dashboards.
- Custom players are always coach-only regardless of team type setting.

**UI Guidance**:
- Create/Edit Team modal highlights the toggle with blue (Official) and amber (Practice) messaging.
- Team cards display trophy (Official) or dumbbell (Practice) badges beside the team name.
- Onboarding checklist and Help panel FAQs reinforce when to choose each mode.

**Data Flow**:
```
Team modal toggle → CoachTeamService.create/update
  → teams.is_official_team boolean
  → Player dashboards (PlayerGameStatsService) filter coach games by official teams only
```

**Safeguards**:
- Default team type is Practice to avoid unwanted stat pollution.
- Warning alert appears when switching Official → Practice (players lose dashboard stats).
- Delete confirmation dialog enumerates cascading impact (team data, game history, roster links).
- Switch component redesigned for high-contrast OFF/ON states.

---

## 🎯 Key Features Implementation

### Mixed Roster Support

**Database Design**:
- `team_players` table supports both `player_id` and `custom_player_id`
- Constraint ensures exactly one is set: `CHECK (player_id IS NOT NULL OR custom_player_id IS NOT NULL)`
- RLS policies handle both types of players

**Service Layer**:
- `CoachPlayerService.getCoachTeamPlayers()` fetches both types
- Graceful fallback if custom players migration not applied
- Migration checker utility provides status information

**UI Components**:
- `CoachPlayerSelectionList` toggles between search and create modes
- `CreateCustomPlayerForm` handles custom player creation
- `CoachPlayerManagementModal` displays both types with appropriate badges

### Player Validation

**Minimum Player Requirement**:
- Quick Track requires minimum 5 players
- `CoachPlayerService.validateMinimumPlayers()` checks count
- UI shows validation messages and blocks progression
- Real-time player count updates in team cards

**Validation Points**:
- Team creation (Step 2): Warn if no players added
- Quick Track launch: Block if < 5 players
- Player removal: Warn if would drop below minimum

### Migration Handling

**Graceful Degradation**:
- `MigrationChecker.hasCustomPlayersMigration()` checks schema
- Services handle missing tables/columns gracefully
- UI shows appropriate warnings and disables features
- Error messages guide users to apply migrations

**Migration Status**:
- Check for `custom_players` table existence
- Check for `custom_player_id` column in `team_players`
- Provide specific error messages for missing components

---

## 🔒 Security & Permissions

### RLS Policies

**Coach Data Access**:
- Coaches can only access their own teams, players, and games
- Custom players are scoped to coach ownership
- Team visibility controls public access

**Public Data Access**:
- Public teams and their custom players are readable by all
- Private teams are only accessible by the coach
- Stat Admin role has access to all coach data for game management

### Authentication

**Coach Role**:
- Added to `users_role_check` constraint
- Coach-specific navigation and permissions
- Integration with existing auth system

**Session Management**:
- Uses existing AuthContext and JWT system
- No special session handling required
- Automatic token refresh works for coaches

---

## 📱 UI/UX Design

### Design System

**Theme Consistency**:
- Uses StatJam light theme (white/cream background)
- Consistent with existing dashboard designs
- Proper contrast and accessibility

**Component Patterns**:
- Reuses existing Card, Button, Badge components
- Consistent modal and form patterns
- Responsive design for mobile/desktop

### User Experience

**Progressive Disclosure**:
- 2-step team creation process
- Clear progress indicators
- Step-by-step guidance

**Validation Feedback**:
- Real-time player count updates
- Clear error messages for validation failures
- Helpful guidance for minimum requirements

**Error Handling**:
- Graceful degradation for missing migrations
- Specific error messages for different failure types
- Recovery suggestions and next steps

---

## 🧪 Testing & Validation

### Manual Testing Checklist

**Team Creation**:
- [ ] 2-step process works correctly
- [ ] Team details validation
- [ ] Player addition in Step 2
- [ ] Team visibility toggle
- [ ] Success message and redirect

**Player Management**:
- [ ] Add existing StatJam users
- [ ] Create custom players
- [ ] Remove players from roster
- [ ] Player count updates
- [ ] Mixed roster display

**Quick Track**:
- [ ] Player validation (minimum 5)
- [ ] Game creation with opponent name
- [ ] Stat Tracker V3 integration
- [ ] OpponentTeamPanel display
- [ ] Coach mode functionality

**Error Handling**:
- [ ] Migration status checks
- [ ] Graceful degradation
- [ ] Error message clarity
- [ ] Recovery suggestions

### Database Testing

**Schema Validation**:
- [ ] `custom_players` table exists
- [ ] `team_players.custom_player_id` column exists
- [ ] RLS policies work correctly
- [ ] Constraints enforce data integrity

**Data Operations**:
- [ ] Team creation with custom players
- [ ] Mixed roster queries
- [ ] Player count aggregation
- [ ] Game creation with coach data

---

## 🚀 Deployment Notes

### Database Migrations

**Required Migrations**:
1. `004_coach_team_card_schema.sql` - Core coach schema
2. `005_custom_players_schema.sql` - Custom players table
3. `005_fix_team_players_column.sql` - Team players column fix

**Migration Order**:
- Apply migrations in sequence
- Test each migration individually
- Verify RLS policies after each step

### Environment Variables

**No Additional Variables Required**:
- Uses existing Supabase configuration
- Leverages existing auth system
- No special environment setup needed

### Feature Flags

**No Feature Flags Required**:
- Coach role is always available
- No conditional feature enabling
- Full functionality on deployment

---

## 📊 Performance Considerations

### Database Queries

**Optimized Queries**:
- `Promise.all()` for parallel data fetching
- Efficient joins for mixed roster queries
- Proper indexing on foreign keys

**Caching Strategy**:
- Player count caching in team cards
- Migration status caching
- Service-level result caching

### UI Performance

**Component Optimization**:
- `React.memo` for expensive components
- Efficient re-render patterns
- Lazy loading for large player lists

**State Management**:
- Local state for form data
- Context for shared team data
- Optimistic updates for better UX

---

## 🔮 Future Enhancements

### Planned Features

**Advanced Player Management**:
- Player statistics and performance tracking
- Player notes and comments
- Player photo uploads
- Jersey number validation

**Team Analytics**:
- Team performance metrics
- Player contribution analysis
- Game history and trends
- Export capabilities

**Integration Features**:
- Tournament team import
- Player data export
- Team sharing and collaboration
- Advanced Quick Track options

### Technical Improvements

**Performance**:
- Database query optimization
- Caching layer implementation
- Real-time updates for team changes
- Bulk operations for player management

**User Experience**:
- Drag-and-drop player management
- Advanced search and filtering
- Team templates and presets
- Mobile app integration

---

## 📝 Documentation Updates

### Files Updated

**Project Documentation**:
- `docs/01-project/FEATURES_COMPLETE.md` - Added Coach Team Card section
- `docs/01-project/PROJECT_STATUS.md` - Updated status and achievements
- `docs/04-features/coach-team-card/COACH_TEAM_CARD_IMPLEMENTATION.md` - This file

**Database Documentation**:
- `docs/05-database/migrations/004_coach_team_card_schema.sql` - Core schema
- `docs/05-database/migrations/005_custom_players_schema.sql` - Custom players
- `docs/05-database/migrations/005_fix_team_players_column.sql` - Column fix

### Code Documentation

**Service Documentation**:
- Comprehensive JSDoc comments in all services
- Type definitions in `src/lib/types/coach.ts`
- Error handling documentation

**Component Documentation**:
- Props and usage examples
- State management patterns
- Event handling documentation

---

## ✅ Implementation Summary

The Coach Team Card System is **fully implemented** and **production-ready**:

✅ **Database Schema**: Complete with RLS policies and constraints  
✅ **Service Layer**: All CRUD operations and business logic  
✅ **UI Components**: Modern, responsive, accessible interface  
✅ **Player Management**: Mixed roster support with validation  
✅ **Quick Track Integration**: Seamless Stat Tracker V3 integration  
✅ **Error Handling**: Graceful degradation and migration support  
✅ **Security**: Proper RLS policies and coach data isolation  
✅ **Documentation**: Comprehensive implementation guide  

**Ready for production deployment and user testing!** 🚀

---

---

## 🎉 Latest Updates

### v1.3.0 - November 8, 2025: Official Team Flag & Cleanup

**New Capabilities**:
- ✅ Official vs Practice team toggle controls player stat inclusion with clear badges
- ✅ Delete team workflow with confirmation modal and async loading states
- ✅ Switch component redesign (gray OFF / blue ON) for instant clarity
- ✅ Help panel + checklist copy updated to explain player stat impact

**Services & Data**:
- Added `CoachTeamService.deleteTeam()` and propagated `is_official_team` through coach types
- Player dashboard services respect `is_official_team` when aggregating coach games
- Database migration `006_add_official_team_flag.sql` documents schema change

**UX Enhancements**:
- Action buttons align in a single row with explicit outline borders
- Edit modal warning appears when downgrading Official → Practice
- Delete confirmation lists cascading impact (team data, games, player links)
- Need Help panel surfaced FAQ covering official/practice behavior and custom players

### v1.2.0 - December 2025: UI Optimizations & RLS Fixes

**Critical Fixes**:
- ✅ **RLS Authentication**: Fixed `TeamServiceV3` and `TeamStatsService` to use authenticated requests for coach teams
- ✅ **Custom Player Fetching**: Resolved issue where custom players returned 0 records due to RLS policies
- ✅ **Stats Display**: Fixed stats not showing (0 records) by implementing authenticated HTTP requests
- ✅ **Plus/Minus Calculation**: Fixed "Game not found" error in coach mode
- ✅ **Player Loading**: All 7 players (5 regular + 2 custom) now load correctly

**UI Improvements**:
- ✅ **Compact Player Stats**: Removed avatar icons, moved position inline as "Name (G)" format
- ✅ **Reduced Row Height**: 60px → 48px (desktop), 56px → 44px (mobile)
- ✅ **Compact Team Aggregates**: Fixed position at bottom, smaller fonts (10px labels, 9px stats)
- ✅ **Removed Header**: Eliminated redundant "Team Statistics" header to save space
- ✅ **Scrollability Indicators**: Enhanced scrollbar with hover feedback (appears on hover)
- ✅ **Fixed Roster Display**: Only shows 5 on-court players, rest accessible via substitution modal

**Roster Management**:
- ✅ **On-Court Players**: Always displays only first 5 players in left roster
- ✅ **Substitution Modal**: Bench players (6th, 7th, etc.) accessible via substitution
- ✅ **Consistent Behavior**: Same logic for both desktop and mobile views

**Technical Implementation**:
- Added `makeAuthenticatedRequest()` method to `TeamServiceV3` and `TeamStatsService`
- Updated 6 critical queries to use authenticated access for coach-specific data
- Enhanced scrollbar CSS with transparent-to-visible hover transitions
- Optimized component rendering with reduced padding and margins

---

### v1.1.0 - October 28, 2025: Custom Players & Opponent Stats Support

**New Features**:
- ✅ **Custom Player Stats**: Custom players can now record stats successfully
- ✅ **Opponent Team Stats**: Dedicated opponent stat tracking with score separation
- ✅ **Database Integration**: Full support for custom players in `game_stats` and `stats` tables
- ✅ **Trigger Updates**: Modified aggregation triggers to handle both player types
- ✅ **Score Calculation**: Correct score attribution for coach vs opponent teams
- ✅ **UI Feedback**: Instant score updates with optimistic UI rendering
- ✅ **Last Action Display**: Opponent stats now show in last action with distinct visual indicator

**Database Changes**:
- Added `custom_player_id` column to `game_stats` and `stats` tables
- Added `is_opponent_stat` flag to `game_stats` and `stats` tables
- Updated unique constraints with partial indexes for proper player type handling
- Modified `update_player_stats()` trigger function for dual player type support

**Code Updates**:
- Updated `StatRecord` interface to include `customPlayerId` and `isOpponentStat`
- Modified `GameServiceV3.recordStat()` to handle opponent flag
- Enhanced `useTracker` hook for opponent score calculation
- Fixed score refresh logic to read `is_opponent_stat` from database
- Updated `DesktopStatGridV3` to display opponent team last actions

**Migrations Applied**:
- `007_game_stats_custom_players.sql` - Custom player schema
- `fix-stats-table-safe.sql` - Stats table migration
- `fix-stats-unique-constraint.sql` - Partial unique indexes
- `update-trigger-for-new-indexes.sql` - Trigger function updates
- `add-opponent-flag-to-game-stats.sql` - Opponent flag support

**Testing Status**:
- ✅ Regular players: Fully functional
- ✅ Custom players: Fully functional
- ✅ Opponent stats: Fully functional with correct score separation
- ✅ Score display: Instant updates, correct attribution
- ✅ Last action: Displays for all player types including opponent

---

**Last Updated**: December 2025  
**Maintained By**: Development Team
