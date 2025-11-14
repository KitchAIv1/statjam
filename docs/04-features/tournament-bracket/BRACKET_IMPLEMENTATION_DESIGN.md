# Tournament Bracket Visualization - Implementation Design

**Date**: November 12, 2025  
**Branch**: `feature/tournament-bracket-visualization`  
**Status**: Design Phase  
**Approach**: Additive Only - No Schema Changes, No Component Modifications

---

## 🎯 Core Principles

### ✅ What We WILL Do
- **Read-only bracket visualization** - Derives structure from existing `games` table
- **New service layer** - `BracketService` to calculate bracket structure
- **New UI components** - Standalone bracket visualization components
- **Replace placeholder** - Update `BracketTab.tsx` only (no other tabs touched)

### ❌ What We WON'T Do
- **No schema changes** - Games table stays exactly as-is
- **No existing component modifications** - All other tabs/components untouched
- **No database writes** - Bracket is calculated, not stored
- **No source of truth changes** - Games table remains single source of truth

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    EXISTING LAYER                           │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  games table │    │ GameService  │    │ ScheduleTab │  │
│  │  (unchanged) │───▶│ (unchanged)  │───▶│ (unchanged) │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ reads from
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    NEW BRACKET LAYER                        │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │BracketService│───▶│BracketTab    │───▶│BracketViz    │  │
│  │ (NEW)        │    │ (REPLACE)    │    │ (NEW)        │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                    │                    │          │
│         │ calculates         │ renders            │ displays │
│         │ bracket structure  │ bracket UI        │ matches  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow

### Step 1: Fetch Games (Existing)
```typescript
// Uses existing GameService - NO CHANGES
const games = await GameService.getGamesByTournament(tournamentId);
```

### Step 2: Calculate Bracket Structure (NEW)
```typescript
// NEW: BracketService calculates bracket from games
const bracketStructure = BracketService.calculateBracket({
  games,
  tournamentType: 'single_elimination',
  teams: [...]
});
```

### Step 3: Render Bracket (NEW)
```typescript
// NEW: BracketTab renders bracket visualization
<BracketVisualization 
  structure={bracketStructure}
  games={games}
  onGameClick={handleGameClick}
/>
```

---

## 🎨 UI Implementation Design

### Component Hierarchy

```
BracketTab (REPLACE existing placeholder)
├── BracketHeader (NEW)
│   ├── Tournament type badge
│   ├── Round selector (if multiple rounds)
│   └── View options (compact/expanded)
│
├── BracketVisualization (NEW)
│   ├── SingleEliminationBracket (NEW)
│   │   ├── BracketRound[] (NEW)
│   │   │   ├── BracketMatch[] (NEW)
│   │   │   │   ├── TeamSlot (NEW)
│   │   │   │   ├── VS divider
│   │   │   │   ├── TeamSlot (NEW)
│   │   │   │   └── Score/Status badge
│   │   │   └── Connector lines (SVG)
│   │   └── Winner path highlighting
│   │
│   ├── DoubleEliminationBracket (NEW)
│   │   ├── Winner Bracket (SingleEliminationBracket)
│   │   ├── Loser Bracket (SingleEliminationBracket)
│   │   └── Grand Final (special match)
│   │
│   └── RoundRobinBracket (NEW)
│       └── Group stage visualization
│
└── BracketControls (NEW)
    ├── Zoom controls
    ├── Mobile minimap
    └── Export buttons
```

---

## 🎨 Visual Design System

### Color Palette (Matches Existing)
```css
/* Backgrounds */
--bracket-bg: #121212 (dark)
--match-bg: rgba(255, 255, 255, 0.05) (glass effect)
--round-bg: rgba(255, 255, 255, 0.02)

/* Borders */
--bracket-border: rgba(255, 255, 255, 0.1)
--match-border: rgba(255, 255, 255, 0.1)
--active-border: #FF3B30 (primary red)

/* Text */
--text-primary: white
--text-secondary: rgba(255, 255, 255, 0.6)
--text-muted: rgba(255, 255, 255, 0.4)

/* Status Colors */
--live: #FF3B30 (red)
--completed: rgba(255, 255, 255, 0.2)
--scheduled: rgba(255, 255, 255, 0.1)
--winner: rgba(255, 59, 48, 0.2) (red glow)
```

### Typography (Matches Existing)
```css
/* Round Labels */
font-size: 10px (mobile) / 12px (desktop)
text-transform: uppercase
letter-spacing: 0.05em
color: rgba(255, 255, 255, 0.4)

/* Team Names */
font-size: 12px (mobile) / 14px (desktop)
font-weight: 600
color: white

/* Scores */
font-size: 14px (mobile) / 16px (desktop)
font-weight: 700
font-family: monospace (tabular numbers)
```

### Spacing (Matches Existing)
```css
/* Card Padding */
padding: 16px (mobile) / 24px (desktop)

/* Match Spacing */
gap: 12px (mobile) / 16px (desktop)

/* Round Spacing */
gap: 24px (mobile) / 32px (desktop)
```

---

## 📱 Responsive Design

### Desktop (>1024px)
- **Layout**: Horizontal bracket flow (left to right)
- **Rounds**: Side-by-side columns
- **Matches**: Full team names, logos, scores visible
- **Connectors**: SVG lines between rounds
- **Interaction**: Hover tooltips, click to view game

### Tablet (768px - 1024px)
- **Layout**: Horizontal with scroll
- **Rounds**: Side-by-side (condensed)
- **Matches**: Team names truncated, logos smaller
- **Connectors**: Simplified SVG lines

### Mobile (<768px)
- **Layout**: Vertical stack (top to bottom)
- **Rounds**: Stacked vertically
- **Matches**: Compact cards (team name + score only)
- **Connectors**: Vertical lines
- **Navigation**: Minimap for large brackets

---

## 🎯 Component Specifications

### 1. BracketMatch Component

**Purpose**: Display a single matchup between two teams

**Props**:
```typescript
interface BracketMatchProps {
  game: Game; // Existing Game type
  teamA: Team; // Team info
  teamB: Team; // Team info
  roundNumber: number;
  matchNumber: number;
  isWinner?: boolean; // If team won this match
  onGameClick?: (gameId: string) => void;
}
```

**Visual Structure**:
```
┌─────────────────────────────┐
│ Team A Logo | Team A Name  │ ← Avatar + Name
│             | Score: 85     │ ← Score badge
├─────────────────────────────┤
│            VS               │ ← Divider
├─────────────────────────────┤
│ Team B Logo | Team B Name  │ ← Avatar + Name
│             | Score: 72     │ ← Score badge
└─────────────────────────────┘
```

**Styling**:
- Card: `rounded-xl border border-white/10 bg-white/5 backdrop-blur`
- Hover: `hover:border-[#FF3B30]/50 hover:bg-white/10`
- Winner: `border-[#FF3B30]/30 bg-[#FF3B30]/10` (subtle glow)

---

### 2. BracketRound Component

**Purpose**: Group matches in a single round

**Props**:
```typescript
interface BracketRoundProps {
  roundNumber: number;
  roundName: string; // "Round of 16", "Quarterfinals", etc.
  matches: BracketMatch[];
  isActive?: boolean; // Current round being played
}
```

**Visual Structure**:
```
Round of 16
├── Match 1
├── Match 2
├── Match 3
└── Match 4
```

**Styling**:
- Container: `space-y-3` (match spacing)
- Round label: `text-xs uppercase tracking-wide text-white/40`

---

### 3. SingleEliminationBracket Component

**Purpose**: Main bracket visualization for single elimination

**Props**:
```typescript
interface SingleEliminationBracketProps {
  rounds: BracketRound[];
  games: Game[];
  teams: Team[];
  onGameClick?: (gameId: string) => void;
}
```

**Visual Structure** (8 teams example):
```
Round of 8          Semifinals         Final
┌─────────┐                            ┌─────────┐
│ Match 1 │──────────┐                  │         │
└─────────┘          │                   │  Final  │
┌─────────┐          ├───┐               │  Match  │
│ Match 2 │──────────┘   │               │         │
└─────────┘              ├───────────────┘
┌─────────┐          ┌───┘               ┌─────────┐
│ Match 3 │──────────┘                   │ Winner  │
└─────────┘                              └─────────┘
┌─────────┐
│ Match 4 │
└─────────┘
```

**Connector Lines**:
- SVG paths connecting winners to next round
- Animated when winner is determined
- Color: `rgba(255, 255, 255, 0.2)` (subtle)

---

### 4. BracketTab Component (REPLACE)

**Purpose**: Main tab component (replaces placeholder)

**Structure**:
```typescript
export function BracketTab({ tournamentId }: BracketTabProps) {
  // Fetch games (existing GameService)
  // Fetch teams (existing TeamService)
  // Calculate bracket (NEW BracketService)
  // Render bracket visualization (NEW components)
  
  return (
    <div className="space-y-4 sm:space-y-6">
      <BracketHeader tournamentType={...} />
      <BracketVisualization 
        structure={bracketStructure}
        games={games}
        teams={teams}
      />
    </div>
  );
}
```

---

## 🔧 Service Layer: BracketService

### Purpose
Calculate bracket structure from games without modifying database

### Methods

#### `calculateBracket()`
```typescript
interface CalculateBracketParams {
  games: Game[];
  tournamentType: 'single_elimination' | 'double_elimination' | 'round_robin';
  teams: Team[];
}

interface BracketStructure {
  rounds: BracketRound[];
  type: string;
  totalRounds: number;
  currentRound: number;
}

static calculateBracket(params: CalculateBracketParams): BracketStructure
```

**Logic**:
1. Group games by round (infer from game dates/order)
2. Determine round names based on team count
3. Map teams to matchups
4. Calculate winner paths
5. Return structured bracket data

#### `determineRoundNumber()`
```typescript
static determineRoundNumber(game: Game, allGames: Game[]): number
```
- Infers round from game order and dates
- For single elim: Round 1 = earliest games, Final = latest game

#### `getRoundName()`
```typescript
static getRoundName(roundNumber: number, totalTeams: number): string
```
- "Round of 16", "Quarterfinals", "Semifinals", "Final"
- Handles odd team counts (byes)

---

## 📁 File Structure

```
src/
├── components/
│   └── tournament/
│       └── tabs/
│           └── BracketTab.tsx (REPLACE - only this file)
│
├── components/
│   └── bracket/ (NEW FOLDER)
│       ├── BracketVisualization.tsx (NEW)
│       ├── SingleEliminationBracket.tsx (NEW)
│       ├── DoubleEliminationBracket.tsx (NEW)
│       ├── RoundRobinBracket.tsx (NEW)
│       ├── BracketRound.tsx (NEW)
│       ├── BracketMatch.tsx (NEW)
│       ├── TeamSlot.tsx (NEW)
│       ├── BracketConnector.tsx (NEW)
│       └── BracketHeader.tsx (NEW)
│
└── lib/
    └── services/
        └── bracketService.ts (NEW)
```

---

## 🎯 Implementation Phases

### Phase 1: Foundation (Week 1)
- ✅ Create branch
- ✅ Design document (this file)
- ✅ Create BracketService skeleton
- ✅ Create basic BracketMatch component
- ✅ Create basic BracketRound component

### Phase 2: Single Elimination (Week 2)
- ✅ Implement SingleEliminationBracket
- ✅ Add connector lines (SVG)
- ✅ Wire up to BracketTab
- ✅ Test with real tournament data

### Phase 3: Enhanced Features (Week 3)
- ✅ Add double elimination support
- ✅ Add round robin visualization
- ✅ Add mobile responsive design
- ✅ Add minimap for mobile

### Phase 4: Polish (Week 4)
- ✅ Add hover tooltips
- ✅ Add click-to-view-game
- ✅ Add winner highlighting
- ✅ Add loading/empty states

---

## 🔍 Key Design Decisions

### 1. Why No Schema Changes?
- **Games table is source of truth** - All game data already exists
- **Bracket is derived** - Can calculate structure from game relationships
- **No migration needed** - Zero risk to existing data
- **Simpler implementation** - Less complexity, faster to ship

### 2. Why Read-Only?
- **Games table manages state** - Scores, status, winners already tracked
- **Bracket is visualization** - Just displays what games table says
- **No sync issues** - Single source of truth prevents inconsistencies

### 3. Why Replace BracketTab Only?
- **Placeholder exists** - Already in tab system, just needs content
- **Isolated change** - No impact on other tabs
- **Clean integration** - Fits existing architecture perfectly

### 4. Why New Components Folder?
- **Separation of concerns** - Bracket logic separate from tournament tabs
- **Reusability** - Could use bracket components elsewhere
- **Maintainability** - Easier to find and modify bracket code

---

## 🎨 UI Examples

### Match Card (Desktop)
```
┌─────────────────────────────────────┐
│  [Logo] Team A          Score: 85  │
│                      ─────────────  │
│  [Logo] Team B          Score: 72  │
│                      [LIVE badge]   │
└─────────────────────────────────────┘
```

### Match Card (Mobile)
```
┌──────────────────────┐
│ Team A   85          │
│ ─────────────────── │
│ Team B   72  [LIVE]  │
└──────────────────────┘
```

### Round Label
```
┌─────────────────────────────┐
│ QUARTERFINALS               │
│ ─────────────────────────── │
│ [Match 1]                   │
│ [Match 2]                   │
│ [Match 3]                   │
│ [Match 4]                   │
└─────────────────────────────┘
```

---

## 🚀 Next Steps

1. **Review this design** - Confirm approach aligns with requirements
2. **Create BracketService** - Implement calculation logic
3. **Build BracketMatch component** - Start with smallest unit
4. **Build BracketRound component** - Group matches
5. **Build SingleEliminationBracket** - Main visualization
6. **Wire up to BracketTab** - Replace placeholder
7. **Test with real data** - Verify with actual tournaments
8. **Add responsive design** - Mobile/tablet support
9. **Add enhancements** - Tooltips, interactions, polish

---

## 📝 Notes

- **No database writes** - Everything is read-only
- **No existing code changes** - Only BracketTab.tsx modified
- **Matches existing UI** - Uses same design system
- **Scalable** - Handles any number of teams/rounds
- **Performant** - Calculates bracket on-demand, caches results

---

**Status**: Ready for implementation  
**Risk Level**: Low (additive only, no breaking changes)  
**Estimated Time**: 3-4 weeks  
**Dependencies**: None (uses existing services)

