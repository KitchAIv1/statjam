# Enhanced ScoreOverlay Component

## Overview

The `EnhancedScoreOverlay` component is a professional basketball broadcast-style overlay that displays comprehensive game information using existing database columns. It includes team branding, foul tracking, timeout indicators, possession tracking, and smooth animations.

## Component Location

```
src/components/live-streaming/EnhancedScoreOverlay.tsx
```

## TypeScript Interface

```typescript
export interface EnhancedScoreOverlayProps {
  // Existing props
  teamAName: string;
  teamBName: string;
  homeScore: number;
  awayScore: number;
  quarter: number;
  gameClockMinutes: number;
  gameClockSeconds: number;
  shotClockSeconds?: number;
  
  // NEW props (from existing DB columns)
  teamALogo?: string;              // teams.logo_url
  teamBLogo?: string;              // teams.logo_url
  teamAPrimaryColor?: string;      // teams.primary_color
  teamBPrimaryColor?: string;      // teams.primary_color
  teamASecondaryColor?: string;    // teams.secondary_color
  teamBSecondaryColor?: string;    // teams.secondary_color
  teamAFouls: number;              // games.team_a_fouls
  teamBFouls: number;              // games.team_b_fouls
  teamATimeouts: number;           // games.team_a_timeouts_remaining
  teamBTimeouts: number;           // games.team_b_timeouts_remaining
  currentPossessionTeamId?: string;// games.current_possession_team_id
  jumpBallArrowTeamId?: string;    // games.jump_ball_arrow_team_id
  teamAId?: string;                // games.team_a_id (for possession comparison)
  teamBId?: string;                // games.team_b_id (for possession comparison)
  venue?: string;                  // games.venue
  tournamentName?: string;         // tournaments.name
  tournamentLogo?: string;         // tournaments.logo_url
}
```

## Component Structure

### Main Component: `EnhancedScoreOverlay`

The main component renders a professional overlay with:

1. **Tournament Header** (optional)
   - Tournament logo and name
   - Venue information
   - Gradient background with backdrop blur

2. **Main Score Bar**
   - Away team section (left)
   - Center clock/quarter section
   - Home team section (right)

3. **Team Sections Include:**
   - Team logo (40x40px) with fallback to initial
   - Team name badge with color-coded border
   - Score display with pulse animation on change
   - Foul count badge with bonus indicator
   - Timeout indicators (dot-based)
   - Possession indicator (arrow)
   - Jump ball arrow indicator

### Sub-Components

#### 1. `TimeoutIndicator`
- Displays timeouts as dots
- Filled dots = used timeouts
- Empty dots = remaining timeouts
- Max 7 timeouts (configurable)

#### 2. `FoulCountBadge`
- Shows foul count number
- Color coding:
  - Normal: white/10 background
  - Warning (4 fouls): yellow background
  - Bonus (5+ fouls): red background with "BONUS" text
- Pulsing animation when in bonus

#### 3. `PossessionIndicator`
- Arrow pointing to team with possession
- Uses team primary color
- Smooth spring animation on change

#### 4. `JumpBallArrow`
- Rotating arrow symbol (↻)
- Shows which team has alternating possession
- Uses team primary color

#### 5. `TeamLogo`
- Displays team logo from `logo_url`
- Fallback to team initial in circle if logo missing
- Handles image load errors gracefully
- 40x40px default size

## Visual Features

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│ Tournament Header (optional)                             │
│ [Logo] Tournament Name • Venue                          │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  [Away Logo]  [Away Badge]    [Away Score]              │
│               [Fouls] [Timeouts]                         │
│                                                           │
│              [Game Clock]                                │
│              [Quarter]                                   │
│              [Shot Clock]                                │
│                                                           │
│  [Home Score]  [Home Badge]  [Home Logo]                │
│                [Timeouts] [Fouls]                        │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Color System

- **Team Colors**: Uses `primary_color` from teams table for borders and accents
- **Foul Badges**:
  - Normal: `bg-white/10`
  - Warning (4): `bg-yellow-500/80`
  - Bonus (5+): `bg-red-600`
- **Background**: Gradient from `black/95` to transparent with backdrop blur

### Animations

1. **Score Changes**
   - Pulse animation (scale 1 → 1.05 → 1)
   - 0.3s duration
   - Triggers on score prop change

2. **Foul Bonus Indicator**
   - Continuous pulse when in bonus (5+ fouls)
   - Red background with "BONUS" text
   - Infinite repeat with 1s delay

3. **Possession Changes**
   - Spring animation on arrow appearance
   - Rotates from -180° to 0° with scale
   - Smooth transition

4. **Shot Clock Warning**
   - Pulsing animation when ≤ 5 seconds
   - Color change to red
   - Infinite repeat

## Database Column Mapping

| Component Feature | Database Column | Table | Type |
|------------------|----------------|-------|------|
| Team Logo | `logo_url` | `teams` | text |
| Primary Color | `primary_color` | `teams` | text |
| Secondary Color | `secondary_color` | `teams` | text |
| Foul Count | `team_a_fouls`, `team_b_fouls` | `games` | integer |
| Timeouts | `team_a_timeouts_remaining`, `team_b_timeouts_remaining` | `games` | integer |
| Possession | `current_possession_team_id` | `games` | uuid |
| Jump Ball Arrow | `jump_ball_arrow_team_id` | `games` | uuid |
| Venue | `venue` | `games` | text |
| Tournament Name | `name` | `tournaments` | text |
| Tournament Logo | `logo_url` | `tournaments` | text |

## Usage Example

```typescript
import { EnhancedScoreOverlay } from '@/components/live-streaming/EnhancedScoreOverlay';

<EnhancedScoreOverlay
  teamAName="Lakers"
  teamBName="Warriors"
  homeScore={85}
  awayScore={92}
  quarter={3}
  gameClockMinutes={5}
  gameClockSeconds={32}
  shotClockSeconds={14}
  teamALogo="https://example.com/lakers-logo.png"
  teamBLogo="https://example.com/warriors-logo.png"
  teamAPrimaryColor="#552583"
  teamBPrimaryColor="#1D428A"
  teamASecondaryColor="#FDB927"
  teamBSecondaryColor="#FFC72C"
  teamAFouls={4}
  teamBFouls={6}
  teamATimeouts={5}
  teamBTimeouts={3}
  currentPossessionTeamId="team-a-uuid"
  jumpBallArrowTeamId="team-b-uuid"
  teamAId="team-a-uuid"
  teamBId="team-b-uuid"
  venue="Staples Center"
  tournamentName="NBA Finals"
  tournamentLogo="https://example.com/nba-logo.png"
/>
```

## Dependencies

- `framer-motion`: For smooth animations
- `next/image`: For optimized image loading
- `react`: Base React library

## Styling

- Uses Tailwind CSS utility classes
- Responsive design with max-width container
- Backdrop blur effects for modern glass-morphism look
- Gradient overlays for readability
- Tabular numbers for consistent score/clock display

## Fallback Behavior

1. **Missing Logos**: Displays team initial in a circle
2. **Missing Colors**: Uses default blue/red colors
3. **Missing Tournament Info**: Header section hidden
4. **Image Load Errors**: Automatically falls back to initial

## Performance Considerations

- Uses `motion.div` with `key` prop to trigger animations only on value changes
- Image optimization via Next.js Image component
- Conditional rendering for optional elements
- Minimal re-renders through proper prop structure

## Next Steps

1. Integrate with `OrganizerLiveStream` component
2. Connect to real-time game data via Supabase subscriptions
3. Add unit tests for sub-components
4. Add accessibility labels for screen readers
5. Consider adding team abbreviation display option

