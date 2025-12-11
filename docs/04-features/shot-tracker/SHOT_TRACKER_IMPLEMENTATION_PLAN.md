# Shot Tracker Component - Implementation Plan

**Branch:** `feature/shot-tracker-component`  
**Status:** 📋 Planning Complete  
**Date:** December 11, 2025  
**Priority:** HIGH - Critical for COACH mode success

---

## 🎯 Executive Summary

A reusable half-court diagram component for tracking made/missed shots with location data. Initially for COACH mode, with future expansion to Stat Admin. Integrates with existing automation sequences (assists, rebounds, possession).

---

## ✅ Confirmed Requirements

| Requirement | Decision | Notes |
|-------------|----------|-------|
| **Input Type** | Court diagram + Made/Missed bar | Tap location → full-width bottom bar |
| **Shot Type Inference** | Zone-based auto-detection | Inside arc = 2PT, outside = 3PT |
| **Player Selection** | Player-first (existing flow) | No lock feature for MVP |
| **Auto Sequences** | Full integration | Triggers assists, rebounds, possession flip |
| **Location Storage** | Yes (x/y + zone enum) | For future shot chart analytics |
| **Mode Toggle** | Classic ↔ Shot Tracker | Preserve existing UX |
| **Court View** | Half-court only | With flip perspective option |
| **Design Priority** | Desktop-first | Within Tracker v3 |
| **Free Throws** | Excluded | Use existing FT flow |
| **Undo** | Existing StatEdit system | No new undo implementation |

---

## 🏗️ Architecture Overview

### Component Structure (Respecting .cursorrules)

```
src/
├── components/
│   └── tracker-v3/
│       └── shot-tracker/
│           ├── ShotTrackerContainer.tsx    (~150 lines) - Main wrapper with toggle
│           ├── HalfCourtDiagram.tsx        (~180 lines) - Court SVG with zones
│           ├── ShotLocationMarker.tsx      (~60 lines)  - Visual shot markers
│           ├── MadeMissedBar.tsx           (~80 lines)  - Bottom confirmation bar
│           └── CourtZoneOverlay.tsx        (~100 lines) - Interactive zone detection
│
├── hooks/
│   └── useShotTracker.ts                   (~90 lines)  - Shot tracking state/logic
│
├── services/
│   └── shotLocationService.ts              (~80 lines)  - Zone detection, persistence
│
└── lib/
    └── types/
        └── shotTracker.ts                  (~50 lines)  - Type definitions
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER FLOW                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Select Player (existing TeamRosterV3)                       │
│            ↓                                                     │
│  2. Tap Court Location (HalfCourtDiagram)                       │
│            ↓                                                     │
│  3. Zone Detection → Auto-infer 2PT/3PT (shotLocationService)   │
│            ↓                                                     │
│  4. Made/Missed Bar Appears (MadeMissedBar)                     │
│            ↓                                                     │
│  5. User Taps Made or Missed                                    │
│            ↓                                                     │
│  6. tracker.recordStat() with location data                     │
│            ↓                                                     │
│  7. PlayEngine triggers auto-sequences:                         │
│     - Made → Assist Prompt Modal                                │
│     - Missed → Rebound Prompt Modal                             │
│            ↓                                                     │
│  8. PossessionEngine flips possession                           │
│            ↓                                                     │
│  9. Shot marker appears on court (optional visual feedback)     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📐 Court Zones Definition

### Zone Map (Standard NBA Half-Court)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│   ┌─────┐                                           ┌─────┐     │
│   │CORNER│                                          │CORNER│    │
│   │ 3L   │                                          │ 3R  │     │
│   └─────┘                                           └─────┘     │
│                                                                  │
│      ┌───────────────────────────────────────────────┐          │
│      │                  TOP_3                         │          │
│      └───────────────────────────────────────────────┘          │
│                                                                  │
│   ┌─────┐     ┌───────────────────────────┐      ┌─────┐        │
│   │WING │     │                           │      │WING │        │
│   │ 3L  │     │       MID_RANGE           │      │ 3R  │        │
│   └─────┘     │                           │      └─────┘        │
│               └───────────────────────────┘                     │
│                                                                  │
│                    ┌─────────────────┐                          │
│                    │                 │                          │
│                    │     PAINT       │                          │
│                    │   (Restricted)  │                          │
│                    │                 │                          │
│                    └─────────────────┘                          │
│                                                                  │
│                         [BASKET]                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Zone Enum

```typescript
type ShotZone = 
  | 'paint'           // Inside the key (2PT)
  | 'mid_range'       // Between paint and 3PT line (2PT)
  | 'corner_3_left'   // Left corner 3 (3PT)
  | 'corner_3_right'  // Right corner 3 (3PT)
  | 'wing_3_left'     // Left wing 3 (3PT)
  | 'wing_3_right'    // Right wing 3 (3PT)
  | 'top_3';          // Top of the key 3 (3PT)
```

### Shot Type Inference Rules

| Zone | Shot Type | Points |
|------|-----------|--------|
| `paint` | field_goal | 2 |
| `mid_range` | field_goal | 2 |
| `corner_3_left` | three_pointer | 3 |
| `corner_3_right` | three_pointer | 3 |
| `wing_3_left` | three_pointer | 3 |
| `wing_3_right` | three_pointer | 3 |
| `top_3` | three_pointer | 3 |

---

## 🗄️ Database Schema Changes

### Option A: Add columns to `game_stats` (Recommended)

```sql
-- Migration: Add shot location tracking
ALTER TABLE game_stats 
ADD COLUMN shot_location_x DECIMAL(5,2) DEFAULT NULL;

ALTER TABLE game_stats 
ADD COLUMN shot_location_y DECIMAL(5,2) DEFAULT NULL;

ALTER TABLE game_stats 
ADD COLUMN shot_zone VARCHAR(20) DEFAULT NULL;

-- Add constraint for valid zones
ALTER TABLE game_stats 
ADD CONSTRAINT valid_shot_zone 
CHECK (shot_zone IS NULL OR shot_zone IN (
  'paint', 'mid_range', 
  'corner_3_left', 'corner_3_right',
  'wing_3_left', 'wing_3_right', 
  'top_3'
));

-- Index for shot chart queries
CREATE INDEX idx_game_stats_shot_zone ON game_stats(game_id, shot_zone) 
WHERE shot_zone IS NOT NULL;
```

### Location Coordinate System

- **X-axis:** 0-100 (left to right of half-court)
- **Y-axis:** 0-100 (baseline to halfcourt line)
- **Origin (0,0):** Bottom-left corner of half-court
- **Basket position:** Approximately (50, 5)

---

## 🔌 Integration with Existing Systems

### 1. useTracker Hook Integration

```typescript
// Extended recordStat call with location data
tracker.recordStat({
  playerId: selectedPlayer,
  teamId: selectedTeamId,
  statType: 'field_goal' | 'three_pointer', // Auto-inferred from zone
  modifier: 'made' | 'missed',
  quarter: currentQuarter,
  gameTimeMinutes: gameClockMinutes,
  gameTimeSeconds: gameClockSeconds,
  // NEW: Shot location data
  shotLocationX: tapCoordinates.x,
  shotLocationY: tapCoordinates.y,
  shotZone: inferredZone
});
```

### 2. GameServiceV3 Changes

```typescript
// Update recordStat to accept and persist location data
static async recordStat(statData: {
  // ... existing fields
  shotLocationX?: number;
  shotLocationY?: number;
  shotZone?: string;
}): Promise<any> {
  // Add to INSERT body
}
```

### 3. PlayEngine - No Changes Required

PlayEngine already analyzes events by `statType` and `modifier`. Shot Tracker just provides a different input mechanism - the automation flows remain identical.

### 4. Tracker Mode Toggle

```typescript
// New state in page.tsx or context
type TrackerInputMode = 'classic' | 'shot_tracker';
const [inputMode, setInputMode] = useState<TrackerInputMode>('classic');

// Toggle UI in ActionBarV3 or header
<ToggleGroup value={inputMode} onValueChange={setInputMode}>
  <ToggleGroupItem value="classic">Buttons</ToggleGroupItem>
  <ToggleGroupItem value="shot_tracker">Court</ToggleGroupItem>
</ToggleGroup>
```

---

## 📱 UI/UX Design Specifications

### Desktop Layout (Shot Tracker Mode)

```
┌──────────────────────────────────────────────────────────────────┐
│  [SCOREBOARD]  [CLOCKS]  [Mode: ○ Buttons ● Court]  [Settings]  │
├─────────────────────┬────────────────────────────────────────────┤
│                     │                                            │
│   TEAM A ROSTER     │        ┌─────────────────────────┐        │
│                     │        │                         │        │
│   [Player Cards]    │        │    HALF-COURT DIAGRAM   │        │
│                     │        │                         │        │
│   ────────────────  │        │    [Tap to mark shot]   │        │
│                     │        │                         │        │
│   TEAM B ROSTER     │        └─────────────────────────┘        │
│                     │                                            │
│   [Player Cards]    │        ┌─────────────────────────┐        │
│                     │        │  [MADE]      [MISSED]   │        │
│                     │        └─────────────────────────┘        │
│                     │                                            │
└─────────────────────┴────────────────────────────────────────────┘
```

### Made/Missed Confirmation Bar

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│   ┌─────────────────────┐    ┌─────────────────────┐            │
│   │                     │    │                     │            │
│   │   ✓  MADE (2PT)     │    │   ✗  MISSED (2PT)   │            │
│   │                     │    │                     │            │
│   │   [Green bg]        │    │   [Red bg]          │            │
│   │                     │    │                     │            │
│   └─────────────────────┘    └─────────────────────┘            │
│                                                                  │
│   ──────────────────────────────────────────────────────────────│
│   Player: John Doe (#23)  •  Zone: Top of Key 3  •  [Cancel]    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Court Flip Perspective

```typescript
// Perspective state
type CourtPerspective = 'team_a_attacks_up' | 'team_b_attacks_up';
const [perspective, setPerspective] = useState<CourtPerspective>('team_a_attacks_up');

// Auto-flip based on selected team (offense always attacks basket)
useEffect(() => {
  if (selectedTeamId === teamAId) {
    setPerspective('team_a_attacks_up');
  } else if (selectedTeamId === teamBId) {
    setPerspective('team_b_attacks_up');
  }
}, [selectedTeamId]);
```

---

## 📋 Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Create type definitions (`shotTracker.ts`)
- [ ] Create `shotLocationService.ts` with zone detection
- [ ] Database migration for location columns
- [ ] Basic `HalfCourtDiagram.tsx` with SVG court

### Phase 2: Core Component (Week 1-2)
- [ ] Create `useShotTracker.ts` hook
- [ ] Create `MadeMissedBar.tsx` component
- [ ] Create `ShotTrackerContainer.tsx` wrapper
- [ ] Integrate with `tracker.recordStat()`

### Phase 3: Integration (Week 2)
- [ ] Add mode toggle to ActionBarV3
- [ ] Wire up to Tracker v3 page
- [ ] Test with COACH mode automation
- [ ] Verify assist/rebound prompts work

### Phase 4: Polish (Week 2-3)
- [ ] Add court flip perspective
- [ ] Visual shot markers (optional)
- [ ] Mobile responsiveness testing
- [ ] Performance optimization

### Phase 5: Documentation (Week 3)
- [ ] User guide for coaches
- [ ] Developer documentation
- [ ] Test cases

---

## 🧪 Testing Checklist

### Functional Tests
- [ ] Tap inside paint → 2PT inferred
- [ ] Tap corner 3 → 3PT inferred
- [ ] Made shot → Assist prompt appears (when automation on)
- [ ] Missed shot → Rebound prompt appears
- [ ] Possession flips correctly
- [ ] Score updates correctly
- [ ] Location data persisted to database

### Edge Cases
- [ ] Tap on 3PT line → Default to 2PT (conservative)
- [ ] No player selected → Show warning, don't record
- [ ] Cancel before Made/Missed → No stat recorded
- [ ] Rapid tapping → Debounce/ignore duplicates

### Integration Tests
- [ ] Works with custom players (COACH mode)
- [ ] Works with regular players
- [ ] StatEdit modal shows location data
- [ ] Live viewer receives stats with location

---

## 📊 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Stat entry speed** | <2 seconds per shot | Time from tap to confirmation |
| **Accuracy** | 99% correct zone detection | User feedback, error rate |
| **Adoption** | 50% of coaches use it | Feature flag analytics |
| **Integration** | 100% sequence compatibility | All prompts trigger correctly |

---

## ⚠️ Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Court tap area too small on mobile | High | Start desktop-first, test touch targets |
| Zone detection edge cases | Medium | Conservative defaults, allow override |
| Performance with many markers | Low | Virtualize markers, limit display |
| Breaking existing automation | High | Use same recordStat pipeline, extensive testing |

---

## 📚 Related Documentation

- `AUTOMATION_COMPLETE_GUIDE.md` - Auto sequence reference
- `STAT_EDIT_IMPLEMENTATION_SUMMARY.md` - Undo/edit system
- `USETRACKER_GAMESERVICE_ARCHITECTURE_MAP.md` - Data flow
- `.cursorrules` - Code standards (must follow)

---

## ✅ Definition of Done

1. [ ] All components under line limits per .cursorrules
2. [ ] Business logic in services/hooks, not components
3. [ ] Full integration with existing automation
4. [ ] Database schema updated
5. [ ] Desktop UI complete
6. [ ] Toggle mode working
7. [ ] Court flip perspective working
8. [ ] Tests passing
9. [ ] Documentation complete
10. [ ] Code reviewed and merged

---

**Next Step:** Review this plan and confirm before implementation begins.
