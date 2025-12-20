# Subscription Gatekeeping Audit

## Overview
This document identifies all UX trigger points where subscription limits should be enforced.

---

## ORGANIZER GATEKEEPING

### 1. Calendar Time-Gate ✅ IMPLEMENTED
**Free Tier:** Current month only for tournament dates
**Pro Tier:** Full tournament date range (start to end date)

| Trigger Point | File | Status |
|---------------|------|--------|
| Create Tournament modal | `OrganizerTournamentManager.tsx` | ✅ Implemented - Start/End Date inputs have `max={maxDateForFree}` |
| Create Tournament page | `create-tournament/page.tsx` | ✅ Implemented - Date inputs restricted to current month |
| Schedule Game modal | `schedule/page.tsx` | ✅ Implemented - Date picker limited to current month |
| Bracket Builder modal | `schedule/page.tsx` | ✅ Implemented - Start date limited to current month |

**Implementation Details:**
- Free organizers: `maxDateForFree` = end of current month (e.g., Dec 31, 2024)
- Paid organizers: No date restrictions
- Shows upgrade notice with clock icon and "Current month only" label
- Upgrade CTA button in upgrade notice boxes

**Note:** Tournament count limit (1 tournament for free) was considered but tournaments can span multiple months, so calendar time-gate is more appropriate UX pattern.

### 2. Team Limit ✅ IMPLEMENTED
**Free Tier:** 6 teams max per season
**Pro Tier:** Unlimited

| Trigger Point | File | Status |
|---------------|------|--------|
| Team count selector | `OrganizerTournamentManager.tsx` | ✅ TeamLimitSelector integrated |
| Team count selector | `create-tournament/page.tsx` | ✅ TeamLimitSelector integrated |

### 3. Analytics Access ⚠️ NOT IMPLEMENTED (Feature doesn't exist yet)
**Free Tier:** Basic box scores only
**Pro Tier:** Full analytics

| Trigger Point | File | Status |
|---------------|------|--------|
| Tournament analytics tab | `TournamentDetailPage` | ⚠️ Analytics feature not yet built |
| Team analytics | Various | ⚠️ Analytics feature not yet built |

**Note:** Analytics features for organizers are planned but not yet implemented in the UI.

### 4. Video Tracking Purchase ⚠️ NOT IMPLEMENTED
**Free Tier:** Cannot purchase
**Pro Tier:** Can purchase ($40-45/game)

| Trigger Point | File | Action Required |
|---------------|------|-----------------|
| Video tracking CTA | Future | Gate with useFeatureGate('video_tracking') |

---

## COACH GATEKEEPING

### 1. Team Limit ⚠️ NOT IMPLEMENTED
**Free Tier:** 1 team max
**Pro Tier:** Unlimited

| Trigger Point | File | Action Required |
|---------------|------|-----------------|
| Create Team button | `CoachTeamsSection.tsx` | Check team count before modal |
| Create Team modal | `CreateCoachTeamModal.tsx` | Validate before submit |

### 2. Game Tracking Limit ✅ IMPLEMENTED
**Free Tier:** 6 games max (own tracked games)
**Pro Tier:** Unlimited

| Trigger Point | File | Status |
|---------------|------|--------|
| Quick Track button | `CoachQuickTrackSection.tsx` | ✅ Implemented - checks `getCoachGameCount` before opening modal |
| Quick Track modal | `CoachQuickTrackModal.tsx` | ✅ Implemented - validates before creating game |
| Start tracking | `CoachTeamCard.tsx` | ✅ Implemented - checks limit before navigation |

**Implementation Details:**
- Uses `SubscriptionService.getCoachGameCount()` to directly query `games` table
- Checks games where coach's teams are in `team_a_id` or `team_b_id`
- Shows `UpgradeModal` when limit reached
- Games in organizer leagues do NOT count toward this limit (only coach-tracked games)

**Note:** Games in organizer leagues do NOT count toward this limit.

### 3. Advanced Analytics ⚠️ NOT IMPLEMENTED
**Free Tier:** Basic analytics only
**Pro Tier:** Full analytics (shot charts, trends, etc.)

| Trigger Point | File | Action Required |
|---------------|------|-----------------|
| Shot charts | `CoachGameAnalyticsTab.tsx` | Wrap with FeatureLockedOverlay |
| Player trends | Various | Wrap with FeatureLockedOverlay |
| Export stats | Various | Gate with useFeatureGate('export_stats') |

### 4. Video Tracking Access ⚠️ NOT IMPLEMENTED
**Free Tier:** Cannot view video analytics
**Pro Tier:** Can view + purchase ($25/game)

---

## PLAYER GATEKEEPING

### 1. Analytics Access ✅ IMPLEMENTED
**Free Tier:** Profile + unverified stats only (Game logs show date/opponent/result only)
**Pro Tier:** Full analytics + verified visibility

| Trigger Point | File | Status |
|---------------|------|--------|
| Player dashboard analytics | `PlayerDashboard.tsx` | ✅ Implemented - Performance Analytics wrapped with FeatureLockedOverlay |
| Game Logs (My Stats) | `GameStatsTable.tsx` | ✅ Implemented - Shows date/opponent/result for free, detailed stats for paid |
| Stat cards | `PlayerCardsPage` | ✅ Implemented - Gate with upgrade prompt |
| Verified badge | `PlayerDashboard.tsx` | ✅ Implemented - Shows "Verified" badge for paid players |

**Implementation Details:**
- Performance Analytics uses `FeatureLockedOverlay` with `blurIntensity="teaser"` (6px blur, 50-80% opacity overlay)
- Game Stats Table accepts `showDetailedStats` prop - free users see locked columns
- Stat Cards page shows upgrade prompt when `!limits.hasExportStats`
- Verified badge uses `limits.isVerified` check

---

## IMPLEMENTATION STATUS

### Phase 1: Critical Limits (Blocks Creation) - ✅ COMPLETE
1. ✅ **Organizer Calendar Time-Gate** - Current month restriction for free users
2. ⚠️ **Coach Team Limit** - Team creation limit check (to be implemented)
3. ✅ **Coach Game Limit** - 6 games max for free tier, fully implemented

### Phase 2: Feature Gates (Blocks Viewing) - ✅ PARTIALLY COMPLETE
4. ✅ Player Analytics overlay (Performance Analytics + Game Logs)
5. ✅ Player Export stats gate (Stat Cards page)
6. ⚠️ Coach Advanced analytics (to be implemented when feature exists)
7. ⚠️ Shot charts gate (to be implemented when feature exists)

### Phase 3: Purchase Gates - ⚠️ PENDING
8. ⚠️ Video tracking purchase (to be implemented)
9. ✅ Player premium features (Verified badge, Analytics, Stat Cards)

---

## IMPLEMENTATION PATTERN

```typescript
// 1. In the component that triggers the action
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { UpgradeModal } from '@/components/subscription';

// 2. Check limit before action
const { allowed, currentCount, maxAllowed } = useUsageLimits('season', 'organizer');
const [showUpgrade, setShowUpgrade] = useState(false);

const handleCreate = () => {
  if (!allowed) {
    setShowUpgrade(true);
    return;
  }
  // Proceed with creation
};

// 3. Show upgrade modal
<UpgradeModal
  isOpen={showUpgrade}
  onClose={() => setShowUpgrade(false)}
  role="organizer"
  triggerReason={`You've reached your limit of ${maxAllowed} season(s). Upgrade for unlimited.`}
/>
```

---

## FILES MODIFIED (Completed Implementation)

### Organizer Calendar Time-Gate
- ✅ `src/components/OrganizerTournamentManager.tsx` - Date inputs with `max={maxDateForFree}`
- ✅ `src/app/dashboard/create-tournament/page.tsx` - Date restriction + upgrade notice
- ✅ `src/app/dashboard/tournaments/[id]/schedule/page.tsx` - CreateGameModal + BracketBuilderModal date gates

### Coach Game Limit
- ✅ `src/components/coach/CoachQuickTrackSection.tsx` - Pre-check before opening modal
- ✅ `src/components/coach/CoachQuickTrackModal.tsx` - Validation before game creation
- ✅ `src/components/coach/CoachTeamCard.tsx` - Limit check on Quick Track button
- ✅ `src/lib/services/subscriptionService.ts` - Added `getCoachGameCount()` function

### Player Subscription Gates
- ✅ `src/components/PlayerDashboard.tsx` - Performance Analytics overlay, Verified badge
- ✅ `src/components/GameStatsTable.tsx` - Conditional detailed stats display
- ✅ `src/app/dashboard/player/cards/page.tsx` - Stat Cards upgrade gate
- ✅ `src/components/subscription/FeatureLockedOverlay.tsx` - Enhanced with `teaser` blur level

### Navigation Cleanup
- ✅ `src/lib/navigation-config.ts` - Removed Teams and Live Stream nav items

---

## ADDITIONAL IMPLEMENTATION NOTES

### FeatureLockedOverlay Blur Levels
- **teaser**: `blur-[6px]` - Can see shapes/colors, can't read details (used for Performance Analytics)
- **light**: `blur-sm` - Light blur
- **medium**: `blur-md` - Standard blur (default)
- **heavy**: `blur-lg` - Heavy obscuring
- Overlay opacity: `50%/80%` for teaser level (enticing but not usable)

### Subscription Service Enhancements
- `getCoachGameCount()`: Directly queries `games` table using `team_a_id` and `team_b_id`
- Uses `.maybeSingle()` instead of `.single()` to gracefully handle non-existent subscription records
- Returns accurate game count for coach's teams

### UI/UX Patterns
- Date pickers show "Current month only" label with clock icon for free users
- Upgrade notices use orange color scheme matching brand
- Consistent upgrade CTA buttons with Crown icon
- All gates use `useSubscription()` hook for consistent state management

---

*Last Updated: December 20, 2024*


