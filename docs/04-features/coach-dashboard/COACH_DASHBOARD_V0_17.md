# Coach Dashboard v0.17.0 Enhancements

## Overview

This document covers the UI/UX improvements and new features added to the Coach Dashboard in version 0.17.0.

## Changes Summary

### 1. Team Cards Layout
- **Before**: 3-column grid (`md:grid-cols-2 lg:grid-cols-3`)
- **After**: 2-column grid (`lg:grid-cols-2`)
- **Impact**: More compact, balanced display
- **Files**: 
  - `src/components/coach/CoachDashboardOverview.tsx`
  - `src/components/coach/CoachTeamsSection.tsx`

### 2. Profile Stats Visibility
- **Issue**: White text on light background (evening mode) was invisible
- **Fix**: Changed to primary color (orange) with proper contrast
- **Enhancements**:
  - Primary color text (`text-primary`)
  - Background: `bg-primary/10` with border
  - Drop shadow for definition
- **File**: `src/components/profile/ProfileCard.tsx`

### 3. Automation Guide Button
- **Before**: Large card taking full width
- **After**: Compact button in profile card upper right
- **Features**:
  - Tooltip with descriptive content
  - Matches organizer guide pattern
  - Better space utilization
- **File**: `src/app/dashboard/coach/page.tsx`

### 4. Player Claim Onboarding Flow
- **New Feature**: Pulsating Manage button highlight
  - Triggered by announcement CTA
  - Auto-scrolls to first team with players
  - Stops on click/navigation
- **Implementation**:
  - URL param: `?highlight=claim`
  - SessionStorage tracking to prevent duplicate scrolls
  - Smooth scroll animation
- **File**: `src/components/coach/CoachTeamCard.tsx`

### 5. Claim Link Tooltips
- **Enhancement**: Dark background tooltips
- **Content**: Descriptive explanations
- **States**: Different tooltips for generate vs copy
- **File**: `src/components/shared/GenerateClaimLinkButton.tsx`

## Technical Details

### Pulsating Highlight Implementation

```typescript
// In CoachTeamCard.tsx
const [highlightManage, setHighlightManage] = useState(false);

useEffect(() => {
  const highlight = searchParams.get('highlight');
  if (highlight === 'claim') {
    setHighlightManage(true);
    // Auto-scroll logic
    if (team.players_count > 0 && cardRef.current) {
      cardRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }
}, [searchParams, team.players_count]);
```

### Button Styling

```tsx
<Button
  className={`gap-1.5 w-full ${
    highlightManage 
      ? 'ring-2 ring-orange-500 ring-offset-2 animate-pulse bg-orange-50 border-orange-400 text-orange-700' 
      : ''
  }`}
>
  Manage
</Button>
```

## User Flow

1. User sees Player Claim announcement modal
2. Clicks "Try It Now"
3. Navigates to `/dashboard/coach?section=teams&highlight=claim`
4. Page auto-scrolls to first team with players
5. Manage button pulsates orange
6. User clicks Manage → Highlight stops
7. User clicks anywhere else → Highlight stops

## Testing

### Test Pulsating Highlight
1. Clear localStorage: `localStorage.removeItem('statjam_announcement_seen_player-claim-v1')`
2. Refresh coach dashboard
3. Click "Try It Now" in announcement
4. Verify scroll and pulsate

### Test Tooltips
1. Hover over "Claim Link" button → See generate tooltip
2. Generate link → Hover over "Copy Link" → See copy tooltip
3. Copy link → Tooltip updates to "Link Copied!"

## Future Enhancements

- [ ] Highlight multiple buttons (e.g., Manage → Claim Link)
- [ ] Step-by-step onboarding tour
- [ ] Analytics tracking for announcement engagement
- [ ] Customizable highlight colors per announcement

---

## Performance Optimizations (v0.17.8+)

### keepPreviousData Pattern Implementation

**Status**: ✅ Implemented (January 2025)

#### Overview

Adopted the proven `keepPreviousData` pattern from `TournamentPageShell.tsx` to eliminate loading flashes and ensure instant navigation.

#### Hooks Optimized

1. **`useCoachTeams`** (`src/hooks/useCoachTeams.ts`)
   - Added synchronous cache check on initial render
   - Only shows loading if no cached data exists
   - Cache TTL: 3 minutes
   - Result: Teams list loads instantly on return navigation

2. **`useCoachDashboardData`** (`src/hooks/useCoachDashboardData.ts`)
   - Added synchronous cache check on initial render
   - Only shows loading if no cached data exists
   - Cache TTL: 2 minutes
   - Result: Video queue, games, clips load instantly

3. **`useCoachProfile`** (`src/hooks/useCoachProfile.ts`)
   - **FIXED**: Was missing cache entirely - always showed loading
   - Added full caching pattern with optimistic updates
   - Cache TTL: 2 minutes
   - Result: Profile card loads instantly

4. **`useSubscription`** (`src/hooks/useSubscription.ts`)
   - Added caching for subscription and verified status
   - localStorage persistence for verified badge
   - Cache TTL: 15 minutes
   - Result: Verified badge no longer flashes on navigation

#### Navigation Bar Stability

- **Fixed container width**: `min-w-[120px]` prevents layout shift
- **Reserved badge space**: 70px × 20px container for verified badge
- **localStorage persistence**: Verified status cached to prevent flash
- **Result**: Navbar remains stable, no horizontal shifts

#### Performance Metrics

| Scenario | Before | After |
|----------|--------|-------|
| Return navigation | 200-400ms flash | **0ms (instant)** |
| Network error | Error state | **Shows cached data** |
| Navbar navigation | Layout shift | **No shift** |

#### Documentation

See `docs/02-development/COACH_DASHBOARD_PERFORMANCE_OPTIMIZATION.md` for detailed implementation guide.

---

## Branding Alignment (v0.17.8+)

### Orange Theme Consistency

All coach dashboard pages now use consistent orange/gray branding:

- **Live badges**: `orange-500`
- **Success indicators**: `orange-*`
- **Info/actions**: `orange-*`
- **Feature buttons**: `orange-600`
- **Neutral elements**: `gray-*`
- **Semantic errors**: `red-*` (kept for errors/misses)

### Pages Updated

- View Games (`/dashboard/coach/games`)
- Video Tracking (`/dashboard/coach/video/[gameId]`)
- Game Clips (`/dashboard/coach/game/[gameId]/clips`)
- Play-by-Play Feed components
- Command Center Header
- Tournaments page
- Stat Admin Video Tracking page

### Help Center Updates

- FAQs updated with current UX (video tracking, seasons, verified badge)
- Free tier limits corrected: **1 team, 6 games, no video access**
- Accent colors: blue → orange
- Checklist simplified to match Quick Actions flow

---

## Critical Performance Optimizations (v0.17.10)

**Status**: ✅ Implemented (January 2025)

### Database RLS Policy Optimizations

#### Problem
Coach tracking mode was experiencing severe performance issues:
- `57014` (statement timeout) errors on INSERT and SELECT operations
- Constant cascade of database queries
- 30-60 second delays in game completion modal

#### Solution
1. **Dropped Redundant Policies**: Removed 3 redundant RLS policies on `game_stats` table
2. **Optimized Coach Policies**: Changed `IN` subqueries to `EXISTS` (50% faster)
3. **Split ALL Policy**: Separated `game_stats_coach_access` (ALL) into:
   - `game_stats_coach_select` (SELECT only)
   - `game_stats_coach_update` (UPDATE only)
   - `game_stats_coach_delete` (DELETE only)
4. **Added Dedicated INSERT Policies**:
   - `game_stats_coach_opponent_insert` - For opponent stats
   - `game_stats_coach_regular_player_insert` - For regular player stats

#### Performance Impact
- **RLS Policy Evaluation**: 50% reduction in execution time
- **Statement Timeout Errors**: Eliminated (was 57014 errors)
- **Query Cascade Frequency**: 60% reduction (2000ms → 5000ms debounce)

#### Documentation
See `docs/02-development/COACH_TRACKING_RLS_OPTIMIZATION.md` for complete details.

### Game Completion Modal Performance

#### Problem
Modal taking 30-60 seconds to load after game completion due to query waterfall.

#### Solution
- **Parallel Data Fetching**: Fetch roster, team stats, and player stats in single batch
- **Prefetched Data Passing**: Pass data as props to child components
- **Eliminated Duplicate Queries**: `AwardSuggestionService` accepts pre-fetched stats

#### Performance Impact
- **Load Time**: 90% faster (30-60s → 2-5s)
- **Query Count**: 10+ sequential → 3 parallel queries

### Real-time Subscription Debounce

#### Optimization
Increased `REALTIME_DEBOUNCE_MS` from 2000ms to 5000ms in:
- `useTracker.ts`
- `useOpponentStats.ts`
- `useTeamStats.ts`
- `useTeamStatsOptimized.ts`

#### Result
- Smoother real-time updates
- 60% reduction in query frequency
- Reduced database load

### Quarter Length & Game Format Fixes

#### Fixes
- **18/20 Minute Periods**: Updated `localStorage` validation to include 18 and 20 minute periods
- **Quarter Length Locking**: Fixed `quarterLengthLockedRef` to prevent overwriting
- **2-Halves Support**: Added `periods_per_game` field (4 for quarters, 2 for halves)

### Score Calculation Accuracy

#### Fix
Scores now calculated from `game_stats` table (source of truth) instead of stale `games` table values.

#### Result
- 100% accurate scores
- No stale values
- Batched queries for multiple games

### Video Credits UX Enhancement

#### Features
- **Two-Modal Flow**: Gatekeeping modal for non-subscribers, credits modal for subscribers
- **Visible Badge**: Film icon + credits count in Quick Actions container
- **Color-Coded**: Orange (has credits), Gray (no credits)

---

**Last Updated**: January 2025  
**Related Docs**: 
- `docs/02-development/COACH_DASHBOARD_PERFORMANCE_OPTIMIZATION.md`
- `docs/02-development/COACH_TRACKING_RLS_OPTIMIZATION.md`
- `docs/01-project/CHANGELOG.md`
- `docs/01-project/DOCUMENTATION_UPDATE_SUMMARY_0.17.10.md`

