# Subscription System Implementation

**Last Updated:** December 20, 2024  
**Status:** Active Development

---

## Overview

This document describes the complete subscription system implementation for StatJam, including role-based tier limits, feature gating, and usage tracking.

---

## Architecture

### Core Components

1. **Pricing Configuration** (`src/config/pricing.ts`)
   - Central source of truth for all tier definitions and limits
   - Defines limits by role: `FREE_*_LIMITS` and `PAID_*_LIMITS`

2. **Subscription Service** (`src/lib/services/subscriptionService.ts`)
   - Business logic for subscription data fetching
   - Usage tracking and limit checking
   - Role-specific helpers (e.g., `getCoachGameCount()`)

3. **Subscription Hooks** (`src/hooks/useSubscription.ts`)
   - React hook for component-level subscription state
   - Returns `{ tier, limits, isVerified, loading }`

4. **UI Components** (`src/components/subscription/`)
   - `UpgradeModal` - Pricing modal with tier cards
   - `FeatureLockedOverlay` - Blur overlay for locked features
   - `PricingTierCard` - Individual tier display card
   - `UsageLimitWarning` - Usage warning component

---

## Role-Based Implementation

### Player Subscription Gates

#### 1. Performance Analytics
**Location:** `src/components/PlayerDashboard.tsx`

**Free Tier:**
- Blurred analytics section with teaser preview
- Shows overlay with upgrade CTA
- Blur: `6px` (teaser level)
- Overlay opacity: `50%/80%`

**Paid Tier:**
- Full access to performance charts and insights
- Trend analysis, season highs, overall rating

**Implementation:**
```tsx
<FeatureLockedOverlay
  isLocked={!limits.hasAnalytics}
  featureName="Performance Analytics"
  upgradeMessage="Unlock detailed performance analytics, trends, and insights to track your growth."
  onUpgrade={() => handleUpgradeClick('Access performance analytics and track your progress over time.')}
  blurIntensity="teaser"
>
  {/* Performance Analytics Content */}
</FeatureLockedOverlay>
```

#### 2. Game Logs (My Stats)
**Location:** `src/components/GameStatsTable.tsx`

**Free Tier:**
- ✅ Visible: Date, Opponent (vs/@ Team), Result (W/L with score)
- 🔒 Locked: MIN, PTS, REB, AST, STL, BLK, FG%, 3P%, FT%, TO, PF, +/-
- Shows "🔒 Upgrade to view" in stat columns
- Footer shows upgrade CTA

**Paid Tier:**
- Full detailed stats table
- All columns visible

**Implementation:**
```tsx
<GameStatsTable 
  userId={user?.id || ''} 
  showDetailedStats={limits.hasAnalytics}
  onUpgrade={() => handleUpgradeClick('Unlock detailed game-by-game stats.')}
/>
```

#### 3. Stat Cards Generation
**Location:** `src/app/dashboard/player/cards/page.tsx`

**Free Tier:**
- Shows locked card with upgrade prompt
- "Stat Cards are a Premium Feature" message
- Upgrade CTA button

**Paid Tier:**
- Full access to Quick Generator and Template Browser
- Can generate and download cards

#### 4. Verified Badge
**Location:** `src/components/PlayerDashboard.tsx`

**Free Tier:**
- No badge displayed

**Paid Tier:**
- Blue "Verified" badge with BadgeCheck icon next to player name

**Implementation:**
```tsx
{limits.isVerified && (
  <Badge className="bg-blue-500 text-white border-0 gap-1 px-2.5 py-1">
    <BadgeCheck className="w-4 h-4" />
    Verified
  </Badge>
)}
```

---

### Coach Subscription Gates

#### 1. Game Tracking Limit (6 games for free tier)
**Locations:**
- `src/components/coach/CoachQuickTrackSection.tsx`
- `src/components/coach/CoachQuickTrackModal.tsx`
- `src/components/coach/CoachTeamCard.tsx`

**Free Tier:**
- Maximum 6 tracked games (games where coach's teams are in `team_a_id` or `team_b_id`)
- Pre-check before opening Quick Track modal
- Validation before game creation
- Shows UpgradeModal when limit reached

**Paid Tier:**
- Unlimited game tracking

**Implementation:**
```tsx
const { tier, limits } = useSubscription('coach');
const actualGameCount = await SubscriptionService.getCoachGameCount(userId);

if (isFree && actualGameCount >= 6) {
  setShowUpgradeModal(true);
  return; // Block game creation
}
```

**Note:** Games in organizer tournaments do NOT count toward this limit.

---

### Organizer Subscription Gates

#### 1. Calendar Time-Gate (Current month restriction)
**Locations:**
- `src/components/OrganizerTournamentManager.tsx` (Create Tournament modal)
- `src/app/dashboard/create-tournament/page.tsx` (Create Tournament page)
- `src/app/dashboard/tournaments/[id]/schedule/page.tsx` (Schedule Game modal, Bracket Builder)

**Free Tier:**
- Date pickers limited to current month only (e.g., Dec 1-31, 2024)
- Cannot schedule tournaments/games beyond current month
- Shows "Current month only" label with clock icon
- Upgrade notice with CTA button

**Paid Tier:**
- Full date range available (tournament start to end date)

**Implementation:**
```tsx
const isFreeOrganizer = tier === 'free';
const getMaxDateForFree = (): string => {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return endOfMonth.toISOString().split('T')[0];
};

<input
  type="date"
  max={isFreeOrganizer ? maxDateForFree : undefined}
  // ...
/>
```

---

## FeatureLockedOverlay Component

### Blur Levels

| Level | Blur Value | Use Case |
|-------|-----------|----------|
| `teaser` | `blur-[6px]` | Enticing preview - can see shapes, not details |
| `light` | `blur-sm` | Light blur |
| `medium` | `blur-md` | Standard blur (default) |
| `heavy` | `blur-lg` | Heavy obscuring |

### Overlay Opacity
- **Teaser level**: `from-white/50 to-white/80` (50-80% opacity)
- Standard levels use higher opacity for better obscuring

### Usage Example
```tsx
<FeatureLockedOverlay
  isLocked={!limits.hasAnalytics}
  featureName="Performance Analytics"
  upgradeMessage="Unlock detailed performance analytics and insights."
  onUpgrade={() => handleUpgradeClick('reason')}
  blurIntensity="teaser" // or "light", "medium", "heavy"
>
  {/* Your gated content */}
</FeatureLockedOverlay>
```

---

## Subscription Service Methods

### `getCoachGameCount(userId: string)`

Directly queries the `games` table to count games associated with a coach's teams.

**Query Logic:**
- Finds all teams where coach is the owner
- Counts games where `team_a_id` OR `team_b_id` matches coach's teams
- Uses `Set` to count unique games

**Returns:** `Promise<number>`

**Note:** Only counts coach-tracked games, not games in organizer tournaments.

---

## Navigation Updates

### Organizer Dashboard
**Removed:**
- Teams nav item (integrated into Tournament Manager)
- Live Stream nav item (feature not yet available)

**Remaining:**
- Overview
- Tournaments
- Games

**Location:** `src/lib/navigation-config.ts`

---

## Database Schema

### Subscriptions Table
Extended in migration `024_subscription_system.sql`:
- `tier`: Subscription tier (free, pro, seasonal_pass, annual, family)
- `billing_period`: monthly, seasonal, annual
- `expires_at`: Subscription expiration
- `stripe_customer_id`: Stripe integration
- `stripe_subscription_id`: Stripe integration
- `video_credits`: Video tracking credits

### Subscription Usage Table
Tracks resource usage for limits:
- `user_id`: User identifier
- `resource_type`: season, team, game, video_game
- `count`: Current usage count
- `limit_type`: hard, soft, unlimited

### Helper Functions
- `has_active_subscription(user_id)`: Checks if user has active subscription
- `get_subscription_tier(user_id, role)`: Returns user's tier
- `increment_usage(user_id, resource_type)`: Increments usage count

---

## Pricing Tiers

### Player Tiers
1. **Free**: Profile only, unverified stats, no analytics
2. **Season** ($25): Full analytics, verified stats, stat cards
3. **Annual** ($49): Year-round access
4. **Family Plan** ($99): Multiple profiles

### Coach Tiers
1. **Free**: 1 team, 6 games, basic analytics
2. **Monthly** ($12): Unlimited teams/games, advanced analytics
3. **Season** ($40): 4-month access
4. **Annual** ($99): Year-round + priority support

### Organizer Tiers
1. **Free**: 1 season, 6 teams, current month only, basic features
2. **Pro** ($40/month): Unlimited, full date range, video tracking access
3. **Seasonal Pass** ($150): 4-month access, 3 video games included

---

## Testing Checklist

### Player Gates
- [ ] Free user sees blurred Performance Analytics
- [ ] Free user sees date/opponent/result in Game Logs, not detailed stats
- [ ] Free user sees upgrade prompt on Stat Cards page
- [ ] Free user does NOT see Verified badge
- [ ] Paid user sees all features unlocked

### Coach Gates
- [ ] Free coach can track up to 6 games
- [ ] Free coach sees upgrade modal on 7th game attempt
- [ ] Games in organizer tournaments don't count toward limit
- [ ] Paid coach has unlimited games

### Organizer Gates
- [ ] Free organizer date picker limited to current month
- [ ] Free organizer sees upgrade notice with CTA
- [ ] Paid organizer has full date range
- [ ] Calendar restrictions apply to all relevant modals

---

## Future Enhancements

### Planned Features
1. Coach team limit (1 team for free tier)
2. Organizer analytics gates (when analytics feature exists)
3. Video tracking purchase flow
4. Usage limit warnings (90% threshold)
5. Subscription management UI

---

## References

- **FRD**: Feature Requirements Document (subscription limits)
- **Database Migration**: `docs/05-database/migrations/024_subscription_system.sql`
- **Audit Document**: `docs/06-monetization/SUBSCRIPTION_GATEKEEPING_AUDIT.md`
- **Pricing Config**: `src/config/pricing.ts`

---

*Last Updated: December 20, 2024*

