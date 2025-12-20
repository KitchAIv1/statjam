# Subscription Gatekeeping Audit

## Overview
This document identifies all UX trigger points where subscription limits should be enforced.

---

## ORGANIZER GATEKEEPING

### 1. Season/Tournament Limit ⚠️ NOT IMPLEMENTED
**Free Tier:** 1 season max
**Pro Tier:** Unlimited

| Trigger Point | File | Action Required |
|---------------|------|-----------------|
| Create Tournament button | `OrganizerTournamentManager.tsx` | Check existing tournament count before opening modal |
| Create Tournament page | `create-tournament/page.tsx` | Check on page load, redirect with upgrade prompt if at limit |
| Submit tournament | `useTournamentForm.ts` | Validate before API call |

**Implementation:**
```typescript
// Before creating tournament
const { allowed, currentCount, maxAllowed } = useUsageLimits('season', 'organizer');
if (!allowed) {
  // Show UpgradeModal with reason
}
```

### 2. Team Limit ✅ IMPLEMENTED
**Free Tier:** 6 teams max per season
**Pro Tier:** Unlimited

| Trigger Point | File | Status |
|---------------|------|--------|
| Team count selector | `OrganizerTournamentManager.tsx` | ✅ TeamLimitSelector integrated |
| Team count selector | `create-tournament/page.tsx` | ✅ TeamLimitSelector integrated |

### 3. Analytics Access ⚠️ NOT IMPLEMENTED
**Free Tier:** Basic box scores only
**Pro Tier:** Full analytics

| Trigger Point | File | Action Required |
|---------------|------|-----------------|
| Tournament analytics tab | `TournamentDetailPage` | Wrap with FeatureLockedOverlay |
| Team analytics | Various | Wrap with FeatureLockedOverlay |

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

### 2. Game Tracking Limit ⚠️ NOT IMPLEMENTED
**Free Tier:** 6 games max (own tracked games)
**Pro Tier:** Unlimited

| Trigger Point | File | Action Required |
|---------------|------|-----------------|
| Quick Track button | `CoachQuickTrackSection.tsx` | Check game count |
| Quick Track modal | `CoachQuickTrackModal.tsx` | Validate before creating game |
| Start tracking | `CoachTeamCard.tsx` | Check before navigation |

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

### 1. Analytics Access ⚠️ NOT IMPLEMENTED
**Free Tier:** Profile + unverified stats only
**Pro Tier:** Full analytics + verified visibility

| Trigger Point | File | Action Required |
|---------------|------|-----------------|
| Player dashboard analytics | `PlayerDashboard.tsx` | Wrap with FeatureLockedOverlay |
| Performance insights | Various | Gate features |
| Stat cards | `PlayerCardGenerator` | Gate with useFeatureGate |

---

## PRIORITY IMPLEMENTATION ORDER

### Phase 1: Critical Limits (Blocks Creation)
1. **Organizer Season Limit** - Must check before creating tournament
2. **Coach Team Limit** - Must check before creating team
3. **Coach Game Limit** - Must check before tracking game

### Phase 2: Feature Gates (Blocks Viewing)
4. Advanced analytics overlay
5. Export stats gate
6. Shot charts gate

### Phase 3: Purchase Gates
7. Video tracking purchase
8. Player premium features

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

## FILES TO MODIFY

| Priority | File | Change |
|----------|------|--------|
| P1 | `OrganizerTournamentManager.tsx` | Add season limit check on create button |
| P1 | `CoachTeamsSection.tsx` | Add team limit check on create button |
| P1 | `CoachQuickTrackModal.tsx` | Add game limit check before submit |
| P2 | `CoachGameAnalyticsTab.tsx` | Wrap with FeatureLockedOverlay |
| P2 | `PlayerDashboard.tsx` | Wrap analytics with FeatureLockedOverlay |

---

*Last Updated: December 2024*

