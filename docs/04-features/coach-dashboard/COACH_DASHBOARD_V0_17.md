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

