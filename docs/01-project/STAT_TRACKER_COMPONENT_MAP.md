# Stat Tracker V3 - Component Hierarchy Map

**Visual component tree and relationships**

---

## Component Tree

```
StatTrackerV3 (page.tsx)
│
├── ErrorBoundary
│   │
│   ├── [MOBILE LAYOUT] (screenWidth < 768px)
│   │   │
│   │   └── MobileLayoutV3
│   │       ├── CompactScoreboardV3
│   │       │   ├── Clock display
│   │       │   ├── Score display
│   │       │   └── Quarter indicator
│   │       │
│   │       ├── DualTeamHorizontalRosterV3
│   │       │   ├── Team A players (horizontal scroll)
│   │       │   └── Team B players (horizontal scroll)
│   │       │
│   │       ├── MobileStatGridV3
│   │       │   ├── Scoring buttons (2PT, 3PT, FT)
│   │       │   ├── Non-scoring buttons (AST, REB, STL, BLK, TO)
│   │       │   ├── Foul buttons
│   │       │   ├── Timeout button
│   │       │   └── End Game button
│   │       │
│   │       └── MobileShotClockV3
│   │           ├── Shot clock display
│   │           └── Shot clock controls
│   │
│   └── [DESKTOP LAYOUT] (screenWidth >= 768px)
│       │
│       ├── TopScoreboardV3
│       │   ├── Back button
│       │   ├── Team A info
│       │   │   ├── Team name
│       │   │   ├── Score
│       │   │   ├── Fouls
│       │   │   └── Timeouts
│       │   │
│       │   ├── Game Clock
│       │   │   ├── Time display
│       │   │   ├── Quarter indicator
│       │   │   ├── Start/Stop button
│       │   │   ├── Reset button
│       │   │   └── Manual edit button
│       │   │
│       │   ├── Shot Clock
│       │   │   ├── Time display
│       │   │   ├── Start/Stop button
│       │   │   ├── Reset button
│       │   │   └── Manual edit button
│       │   │
│       │   ├── Team B info
│       │   │   ├── Team name
│       │   │   ├── Score
│       │   │   ├── Fouls
│       │   │   └── Timeouts
│       │   │
│       │   └── Status Badge
│       │       └── LIVE / ENDED / CANCELLED
│       │
│       ├── [TWO-COLUMN LAYOUT]
│       │   │
│       │   ├── [LEFT COLUMN]
│       │   │   └── TeamRosterV3 (Team A)
│       │   │       ├── Team header
│       │   │       ├── On-court players (5)
│       │   │       │   ├── Player card
│       │   │       │   │   ├── Avatar
│       │   │       │   │   ├── Jersey number
│       │   │       │   │   ├── Name
│       │   │       │   │   └── Substitution button
│       │   │       │   └── ...
│       │   │       └── Player count
│       │   │
│       │   └── [RIGHT COLUMN]
│       │       └── TeamRosterV3 (Team B) OR OpponentTeamPanel
│       │           └── (Same structure as Team A)
│       │
│       └── [CENTER COLUMN]
│           └── DesktopStatGridV3
│               ├── Selected Player Display
│               │   ├── Player photo
│               │   ├── Player name
│               │   └── Jersey number
│               │
│               ├── Possession Indicator
│               │   ├── Team A badge
│               │   ├── Ball icon
│               │   ├── Jump ball arrow
│               │   └── Team B badge
│               │
│               ├── Scoring Stats Section
│               │   ├── 2PT (Made/Missed)
│               │   ├── 3PT (Made/Missed)
│               │   └── FT (Made/Missed)
│               │
│               ├── Non-Scoring Stats Section
│               │   ├── Assist
│               │   ├── Rebound (OFF/DEF)
│               │   ├── Steal
│               │   ├── Block
│               │   └── Turnover
│               │
│               ├── Foul Section
│               │   ├── Personal Foul
│               │   └── Technical Foul
│               │
│               ├── Game Actions Section
│               │   ├── Timeout button
│               │   ├── Substitution button
│               │   └── End Game button
│               │
│               └── Last Action Display
│                   └── Recent stat feedback
│
└── [MODALS] (Conditional rendering)
    │
    ├── PreFlightCheckModal
    │   ├── Game info
    │   ├── Preset selection
    │   │   ├── Minimal
    │   │   ├── Balanced
    │   │   └── Full Automation
    │   ├── Automation status summary
    │   ├── Advanced settings (collapsible)
    │   │   ├── Clock automation toggles
    │   │   ├── Possession automation toggles
    │   │   ├── Sequence automation toggles
    │   │   └── Foul automation toggles
    │   └── Action buttons
    │       ├── Cancel
    │       └── Start Tracking
    │
    ├── ShotClockViolationModal
    │   ├── Violation alert
    │   ├── Team name
    │   ├── NBA rule explanation
    │   ├── Auto-dismiss countdown
    │   └── Action buttons
    │       ├── Dismiss
    │       └── Record Violation
    │
    ├── AssistPromptModal
    │   ├── Shooter info
    │   ├── Player selection list
    │   │   └── Player cards (on-court only)
    │   └── Action buttons
    │       ├── No Assist
    │       └── Record Assist
    │
    ├── ReboundPromptModal
    │   ├── Shot info
    │   ├── Rebound type selector
    │   │   ├── Offensive
    │   │   └── Defensive
    │   ├── Player selection list
    │   │   └── Player cards (appropriate team)
    │   └── Action buttons
    │       ├── Skip
    │       └── Record Rebound
    │
    ├── BlockPromptModal
    │   ├── Shot info
    │   ├── Player selection list
    │   │   └── Player cards (defending team)
    │   └── Action buttons
    │       ├── No Block
    │       └── Record Block
    │
    ├── TurnoverPromptModal
    │   ├── Turnover type selector
    │   │   ├── Bad Pass
    │   │   ├── Travel
    │   │   ├── Double Dribble
    │   │   ├── Out of Bounds
    │   │   └── Other
    │   ├── Steal attribution (optional)
    │   │   └── Player selection
    │   └── Action buttons
    │       ├── Cancel
    │       └── Record Turnover
    │
    ├── FoulTypeSelectionModal
    │   ├── Fouler info
    │   ├── Foul type selector
    │   │   ├── Personal (no FTs)
    │   │   ├── Shooting 2PT (2 FTs)
    │   │   ├── Shooting 3PT (3 FTs)
    │   │   ├── Bonus/1-and-1 (up to 2 FTs)
    │   │   ├── Technical (1 FT + possession)
    │   │   ├── Flagrant (2 FTs + possession)
    │   │   └── Offensive (turnover)
    │   └── Action buttons
    │       └── Cancel
    │
    ├── VictimPlayerSelectionModal
    │   ├── Foul type info
    │   ├── Player selection list
    │   │   └── Player cards (fouled team)
    │   └── Action buttons
    │       ├── Cancel
    │       └── Continue to Free Throws
    │
    ├── FreeThrowSequenceModal
    │   ├── Shooter info
    │   ├── FT count display (1, 2, or 3)
    │   ├── Current attempt indicator
    │   ├── Made/Missed buttons
    │   ├── Score display (updates live)
    │   └── Auto-closes after sequence
    │
    ├── SubstitutionModalV3
    │   ├── Team selector
    │   ├── On-court players
    │   │   └── Player cards (select to sub out)
    │   ├── Bench players
    │   │   └── Player cards (select to sub in)
    │   └── Action buttons
    │       ├── Cancel
    │       └── Confirm Substitution
    │
    └── TimeoutModalV3
        ├── Team selector
        ├── Timeout type selector
        │   ├── Full Timeout (60s)
        │   └── 30-Second Timeout
        ├── Countdown timer
        └── Action buttons
            ├── Cancel
            └── Start Timeout
```

---

## Component Relationships

### Parent-Child Data Flow

```
page.tsx
  ├── Provides: gameData, tracker state, handlers
  │
  ├──> TopScoreboardV3
  │     ├── Receives: scores, clock, fouls, timeouts, gameStatus
  │     └── Emits: onStart, onStop, onReset, onSetCustomTime, onBack
  │
  ├──> TeamRosterV3
  │     ├── Receives: players, selectedPlayer, teamName, teamSide
  │     └── Emits: onPlayerSelect, onSubstitution
  │
  ├──> DesktopStatGridV3
  │     ├── Receives: selectedPlayer, isClockRunning, possession, gameStatus
  │     └── Emits: onStatRecord, onFoulRecord, onTimeOut, onSubstitution, onGameEnd
  │
  └──> Modals
        ├── Receives: isOpen, game/player data
        └── Emits: onClose, onConfirm, onSelect
```

### Hook Dependencies

```
page.tsx
  │
  ├── useAuthContext()
  │     └── Provides: user, loading
  │
  ├── useSearchParams()
  │     └── Provides: gameId, teamAId, teamBId, coachMode
  │
  ├── useResponsiveLayout()
  │     └── Provides: isMobile, isDesktop
  │
  ├── useTracker()
  │     ├── Depends on: gameId, teamAId, teamBId, isCoachMode
  │     └── Provides: All game state and actions
  │
  └── useShotClockViolation()
        ├── Depends on: shotClockSeconds, shotClockRunning, possessionTeamId
        └── Provides: showViolationModal, violationTeamId
```

### Service Layer Dependencies

```
useTracker
  │
  ├── GameServiceV3
  │     ├── getGameById()
  │     ├── recordStat()
  │     ├── recordTimeout()
  │     ├── recordSubstitution()
  │     ├── updateGameState()
  │     ├── updateGameStatus()
  │     └── updateGameAutomation()
  │
  ├── TeamServiceV3
  │     ├── getTeamById()
  │     └── getTeamPlayers()
  │
  └── RulesetService
        └── getRulesetForTournament()
```

---

## State Flow Diagram

### Stat Recording Flow

```
User Action
    │
    ▼
[DesktopStatGridV3]
handleStatClick()
    │
    ▼
[page.tsx]
onStatRecord()
    │
    ▼
[useTracker]
recordStat()
    │
    ├──> [Local State Update]
    │     ├── Update scores
    │     ├── Update teamFouls
    │     └── Set lastAction
    │
    ├──> [Database Write]
    │     └── GameServiceV3.recordStat()
    │
    ├──> [Automation Triggers]
    │     ├── Possession flip?
    │     ├── Shot clock reset?
    │     └── Clock pause?
    │
    └──> [Modal Triggers]
          ├── Made shot? → AssistPromptModal
          ├── Missed shot? → ReboundPromptModal
          └── Foul? → FoulTypeSelectionModal
```

### Clock Automation Flow

```
[useTracker]
recordStat()
    │
    ▼
Check automationFlags.clock.enabled
    │
    ├──> [Auto-Pause Conditions]
    │     ├── Foul recorded?
    │     ├── Timeout called?
    │     └── Violation detected?
    │     │
    │     └──> stopClock()
    │
    └──> [Shot Clock Reset Conditions]
          ├── Made shot? → resetShotClock(24)
          ├── Defensive rebound? → resetShotClock(24)
          └── Offensive rebound? → resetShotClock(14)
```

### Possession Automation Flow

```
[useTracker]
recordStat()
    │
    ▼
Check automationFlags.possession.enabled
    │
    ├──> [Auto-Flip Conditions]
    │     ├── Made shot? → Flip to opponent
    │     ├── Defensive rebound? → Flip to rebounder's team
    │     ├── Steal? → Flip to stealer's team
    │     └── Turnover? → Flip to opponent
    │     │
    │     └──> updatePossession()
    │
    └──> [Persist to Database]
          └── Record to game_possessions table
```

---

## Modal Trigger Map

```
Stat Recording
    │
    ├── Made 2PT/3PT
    │     └──> AssistPromptModal
    │           └──> Record assist (optional)
    │
    ├── Missed 2PT/3PT
    │     ├──> ReboundPromptModal
    │     │     └──> Record rebound
    │     │
    │     └──> BlockPromptModal
    │           └──> Record block (optional)
    │
    ├── Foul
    │     └──> FoulTypeSelectionModal
    │           ├── Personal → Close
    │           ├── Offensive → Close
    │           └── Shooting/Bonus/Technical/Flagrant
    │                 └──> VictimPlayerSelectionModal
    │                       └──> FreeThrowSequenceModal
    │                             └──> Record FT results
    │
    └── Turnover
          └──> TurnoverPromptModal
                └──> Record turnover + steal (optional)

Shot Clock
    │
    └── Reaches 0
          └──> ShotClockViolationModal
                ├── Record Violation → Record as turnover
                └── Dismiss → Close modal

Game Actions
    │
    ├── Substitution button
    │     └──> SubstitutionModalV3
    │           └──> Record substitution
    │
    └── Timeout button
          └──> TimeoutModalV3
                └──> Record timeout + start countdown
```

---

## Responsive Breakpoints

```
Mobile Layout (< 768px)
├── MobileLayoutV3
├── CompactScoreboardV3
├── DualTeamHorizontalRosterV3
├── MobileStatGridV3
└── MobileShotClockV3

Tablet Layout (768px - 1024px)
├── Desktop layout with adjusted spacing
├── Smaller roster cards
└── Compact stat grid

Desktop Layout (>= 1024px)
├── TopScoreboardV3
├── Three-column layout
│   ├── Left: Team A roster
│   ├── Center: Stat grid
│   └── Right: Team B roster
└── Full-size components

Large Desktop (>= 1280px)
├── Maximum width: 1400px
├── Larger spacing
└── Enhanced visual elements
```

---

## Component File Sizes

```
Large Components (>400 lines)
├── page.tsx (1332 lines)
├── useTracker.ts (1514 lines)
├── TopScoreboardV3.tsx (520 lines)
└── DesktopStatGridV3.tsx (476 lines)

Medium Components (200-400 lines)
├── PreFlightCheckModal.tsx (408 lines)
├── TeamRosterV3.tsx (219 lines)
├── MobileLayoutV3.tsx (~300 lines)
└── GameServiceV3.ts (730 lines)

Small Components (<200 lines)
├── ShotClockViolationModal.tsx (156 lines)
├── AssistPromptModal.tsx (171 lines)
├── ReboundPromptModal.tsx (~180 lines)
├── PossessionIndicator.tsx (115 lines)
└── useShotClockViolation.ts (102 lines)
```

---

## Component Complexity Matrix

| Component | Lines | State Variables | Props | Hooks | Complexity |
|-----------|-------|-----------------|-------|-------|------------|
| page.tsx | 1332 | 15+ | 0 | 5 | ⭐⭐⭐⭐⭐ |
| useTracker | 1514 | 20+ | 4 | 3 | ⭐⭐⭐⭐⭐ |
| TopScoreboardV3 | 520 | 8 | 20+ | 2 | ⭐⭐⭐⭐ |
| DesktopStatGridV3 | 476 | 2 | 15+ | 1 | ⭐⭐⭐ |
| TeamRosterV3 | 219 | 0 | 8 | 0 | ⭐⭐ |
| PreFlightCheckModal | 408 | 3 | 8 | 1 | ⭐⭐⭐ |
| MobileLayoutV3 | ~300 | 5+ | 15+ | 2 | ⭐⭐⭐⭐ |
| AssistPromptModal | 171 | 1 | 7 | 0 | ⭐⭐ |
| PossessionIndicator | 115 | 0 | 8 | 0 | ⭐ |

**Complexity Legend**:
- ⭐ Simple (< 100 lines, minimal state)
- ⭐⭐ Low (100-200 lines, few state variables)
- ⭐⭐⭐ Medium (200-400 lines, moderate state)
- ⭐⭐⭐⭐ High (400-800 lines, complex state)
- ⭐⭐⭐⭐⭐ Very High (800+ lines, extensive state)

---

## Refactoring Opportunities

### High Priority (Complexity > ⭐⭐⭐⭐)

1. **page.tsx (1332 lines)**
   - Extract modal management to custom hook
   - Split mobile/desktop logic into separate components
   - Move stat recording logic to service layer

2. **useTracker.ts (1514 lines)**
   - Split into multiple hooks:
     - `useGameClock()`
     - `useShotClock()`
     - `usePossession()`
     - `useGameState()`
   - Extract automation logic to separate service

3. **TopScoreboardV3.tsx (520 lines)**
   - Extract clock controls to separate component
   - Extract shot clock to separate component
   - Simplify prop interface

### Medium Priority (Complexity = ⭐⭐⭐)

1. **DesktopStatGridV3.tsx (476 lines)**
   - Extract stat button groups to sub-components
   - Create reusable `StatButton` component
   - Simplify button state management

2. **PreFlightCheckModal.tsx (408 lines)**
   - Extract preset cards to separate component
   - Extract advanced settings to separate component
   - Simplify settings management

3. **MobileLayoutV3.tsx (~300 lines)**
   - Already well-structured
   - Consider extracting action bar

### Low Priority (Complexity ≤ ⭐⭐)

- Most modal components are appropriately sized
- Roster components are well-structured
- Indicator components are simple and focused

---

## Component Reusability

### Highly Reusable (Used 3+ times)
- `Button` (UI component)
- `Card` (UI component)
- `Badge` (UI component)
- Player selection pattern (modals)

### Moderately Reusable (Used 2 times)
- `TeamRosterV3` (Team A + Team B)
- Clock controls pattern
- Player card pattern

### Single Use (Unique components)
- `TopScoreboardV3`
- `DesktopStatGridV3`
- `PreFlightCheckModal`
- Most modals (specific use cases)

---

## Performance Considerations

### Heavy Components (Re-render frequently)
- `TopScoreboardV3` (clock updates every second)
- `DesktopStatGridV3` (stat recording feedback)
- `TeamRosterV3` (player selection changes)

**Optimization**:
- Use `React.memo()` for roster components
- Use `useCallback()` for event handlers
- Debounce clock updates

### Light Components (Re-render rarely)
- Modal components (only when open)
- Static UI elements
- Indicator components

---

## Testing Strategy

### Unit Tests (Component-level)
```typescript
// Example: TeamRosterV3.test.tsx
describe('TeamRosterV3', () => {
  it('displays on-court players', () => {});
  it('handles player selection', () => {});
  it('triggers substitution', () => {});
});
```

### Integration Tests (Feature-level)
```typescript
// Example: StatRecording.test.tsx
describe('Stat Recording', () => {
  it('records made 2PT and updates score', () => {});
  it('triggers assist prompt after made shot', () => {});
  it('flips possession on defensive rebound', () => {});
});
```

### E2E Tests (User flow)
```typescript
// Example: FullGameFlow.test.tsx
describe('Full Game Flow', () => {
  it('completes a full game from start to end', () => {});
  it('handles all stat types', () => {});
  it('manages timeouts and substitutions', () => {});
});
```

---

## Maintenance Checklist

### When Adding New Features
- [ ] Update component map
- [ ] Update state flow diagram
- [ ] Add to feature matrix
- [ ] Update complexity matrix
- [ ] Document new modals/components
- [ ] Update testing strategy

### When Refactoring
- [ ] Update file sizes
- [ ] Update complexity ratings
- [ ] Update reusability assessment
- [ ] Document breaking changes
- [ ] Update component relationships

### Regular Maintenance
- [ ] Review component sizes (monthly)
- [ ] Identify refactoring opportunities
- [ ] Update performance considerations
- [ ] Review and update tests
- [ ] Update documentation

---

**Last Updated**: October 30, 2025  
**Maintained By**: Development Team

