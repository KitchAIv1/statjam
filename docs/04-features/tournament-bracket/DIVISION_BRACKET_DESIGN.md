# Division-Based Tournament Bracket Design

**Impact Analysis**: How divisions (A, B, C, etc.) affect bracket implementation

---

## ✅ Implementation Notes — November 14, 2025

- **Intra-Division Brackets**: Division views now include **only** games where *both* teams belong to the selected division.
- **Championship Bracket**: Championship view includes games where teams come from **different divisions** (or at least one team has no division). This ensures the bracket only displays cross-division matchups.
- **Auto-Advancement**: Completed division games automatically populate the next round slots and auto-feed the championship bracket once division winners emerge.
- **UI Toggle**: When the organizer selects “All Divisions”, `DivisionBracketView` renders every division bracket plus a championship bracket. Selecting a specific division renders just that division’s bracket via `BracketVisualization`.
- **Schedule Regeneration Rules**: The bracket builder now warns organizers before regenerating brackets once games exist, preventing accidental data loss during division-to-championship transitions.

---

## 🏗️ Tournament Structure with Divisions

### Two-Phase Tournament Format

```
┌─────────────────────────────────────────────────────────────┐
│                    PHASE 1: DIVISION PLAY                    │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Division A   │  │ Division B   │  │ Division C   │      │
│  │              │  │              │  │              │      │
│  │ [Bracket A]  │  │ [Bracket B]  │  │ [Bracket C]  │      │
│  │              │  │              │  │              │      │
│  │ Winner: A1   │  │ Winner: B1   │  │ Winner: C1   │      │
│  │ Runner-up: A2│  │ Runner-up: B2│  │ Runner-up: C2│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                 │                 │               │
│         └─────────────────┼─────────────────┘               │
│                           │                                   │
│                           ▼                                   │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ Advancers move to
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              PHASE 2: CROSS-DIVISION BRACKET                 │
│                                                               │
│                    ┌──────────────┐                          │
│                    │ Final Bracket │                          │
│                    │              │                          │
│                    │ [Championship│                          │
│                    │  Bracket]    │                          │
│                    │              │                          │
│                    │ Winner: Champ│                          │
│                    └──────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 How Divisions Affect Bracket Calculation

### Current Games Table Structure
```sql
games (
  tournament_id,
  team_a_id,
  team_b_id,
  start_time,
  status,
  home_score,
  away_score
)
```

**Key Insight**: Games table doesn't explicitly store division or phase, but we can infer it from:
1. **Team divisions** (from `teams.division` field)
2. **Game timing** (division games happen first, then cross-division)
3. **Team relationships** (division games = teams from same division)

---

## 🔍 Bracket Calculation Logic with Divisions

### Step 1: Identify Tournament Phases

```typescript
interface TournamentPhase {
  phase: 'division' | 'championship';
  divisions?: string[]; // ['A', 'B', 'C'] for division phase
}

// Logic:
// - If teams have divisions AND early games are intra-division → Division Phase
// - If later games have teams from different divisions → Championship Phase
```

### Step 2: Group Games by Phase

```typescript
// Division Phase Games
const divisionGames = games.filter(game => {
  const teamA = teams.find(t => t.id === game.team_a_id);
  const teamB = teams.find(t => t.id === game.team_b_id);
  return teamA?.division === teamB?.division && teamA?.division;
});

// Championship Phase Games  
const championshipGames = games.filter(game => {
  const teamA = teams.find(t => t.id === game.team_a_id);
  const teamB = teams.find(t => t.id === game.team_b_id);
  return teamA?.division !== teamB?.division || !teamA?.division;
});
```

### Step 3: Calculate Division Brackets

```typescript
// For each division, calculate its bracket
const divisionBrackets = divisions.map(division => {
  const divisionTeams = teams.filter(t => t.division === division);
  const divisionGames = games.filter(game => {
    // Games where both teams are in this division
  });
  
  return BracketService.calculateBracket({
    games: divisionGames,
    teams: divisionTeams,
    tournamentType: 'single_elimination'
  });
});
```

### Step 4: Calculate Championship Bracket

```typescript
// Determine advancers from each division
const advancers = divisions.map(division => {
  const divisionBracket = divisionBrackets[division];
  return {
    division,
    winner: getWinner(divisionBracket),
    runnerUp: getRunnerUp(divisionBracket), // if needed
    // Could also advance top 2, top 4, etc.
  };
});

// Calculate championship bracket with advancers
const championshipBracket = BracketService.calculateBracket({
  games: championshipGames,
  teams: advancers.map(a => a.winner), // Or all advancers
  tournamentType: 'single_elimination'
});
```

---

## 🎨 UI Implementation with Divisions

### Component Structure

```
BracketTab
├── PhaseSelector (NEW)
│   ├── "Division Play" tab
│   └── "Championship" tab
│
├── DivisionSelector (NEW) - Only shown in Division Phase
│   ├── [Division A] [Division B] [Division C]
│   └── Shows active division bracket
│
├── DivisionBracketView (NEW)
│   └── SingleEliminationBracket (per division)
│
└── ChampionshipBracketView (NEW)
    └── SingleEliminationBracket (cross-division)
```

### Visual Layout

#### Desktop View
```
┌─────────────────────────────────────────────────────────────┐
│  [Division Play ▼] [Championship]                           │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  [Division A] [Division B] [Division C] [All Divisions]     │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         DIVISION A BRACKET                            │  │
│  │                                                       │  │
│  │  Round 1    Round 2    Semifinal    Final           │  │
│  │  ┌─────┐    ┌─────┐    ┌─────┐     ┌─────┐          │  │
│  │  │Match│───▶│Match│───▶│Match│────▶│Final│          │  │
│  │  └─────┘    └─────┘    └─────┘     └─────┘          │  │
│  │                                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Division A Winner: [Team Name] → Advances to Final   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

#### Championship View
```
┌─────────────────────────────────────────────────────────────┐
│  [Division Play] [Championship ▼]                           │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         CHAMPIONSHIP BRACKET                          │  │
│  │                                                       │  │
│  │  Semifinal              Final                        │  │
│  │  ┌──────────┐          ┌──────────┐                  │  │
│  │  │Div A Win │─────────▶│          │                  │  │
│  │  │  vs      │          │  Final   │                  │  │
│  │  │Div B Win │          │  Match   │                  │  │
│  │  └──────────┘          │          │                  │  │
│  │  ┌──────────┐          │          │                  │  │
│  │  │Div C Win │─────────▶│          │                  │  │
│  │  │  vs      │          │          │                  │  │
│  │  │Div D Win │          │          │                  │  │
│  │  └──────────┘          └──────────┘                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Service Layer Updates

### BracketService Enhancements

```typescript
class BracketService {
  // NEW: Detect if tournament has divisions
  static hasDivisions(teams: Team[]): boolean {
    const divisions = new Set(teams.map(t => t.division).filter(Boolean));
    return divisions.size > 1;
  }

  // NEW: Group games by phase
  static groupGamesByPhase(
    games: Game[],
    teams: Team[]
  ): { divisionGames: Game[]; championshipGames: Game[] } {
    // Logic to separate division play from championship
  }

  // NEW: Calculate division brackets
  static calculateDivisionBrackets(
    games: Game[],
    teams: Team[],
    tournamentType: string
  ): Record<string, BracketStructure> {
    // Returns { 'A': bracket, 'B': bracket, 'C': bracket }
  }

  // NEW: Determine advancers from divisions
  static getDivisionAdvancers(
    divisionBrackets: Record<string, BracketStructure>
  ): Team[] {
    // Returns teams that advance to championship
  }

  // ENHANCED: Calculate championship bracket
  static calculateChampionshipBracket(
    games: Game[],
    advancers: Team[],
    tournamentType: string
  ): BracketStructure {
    // Championship bracket with division winners
  }
}
```

---

## 🎯 UI Component Updates

### BracketTab Component (Enhanced)

```typescript
export function BracketTab({ tournamentId }: BracketTabProps) {
  const [activePhase, setActivePhase] = useState<'division' | 'championship'>('division');
  const [activeDivision, setActiveDivision] = useState<string | null>(null);
  
  // Detect if tournament has divisions
  const hasDivisions = BracketService.hasDivisions(teams);
  
  // Group games by phase
  const { divisionGames, championshipGames } = 
    BracketService.groupGamesByPhase(games, teams);
  
  // Calculate division brackets
  const divisionBrackets = hasDivisions
    ? BracketService.calculateDivisionBrackets(divisionGames, teams, tournamentType)
    : {};
  
  // Calculate championship bracket
  const advancers = BracketService.getDivisionAdvancers(divisionBrackets);
  const championshipBracket = BracketService.calculateChampionshipBracket(
    championshipGames,
    advancers,
    tournamentType
  );

  return (
    <div>
      {/* Phase Selector - Only show if divisions exist */}
      {hasDivisions && (
        <PhaseSelector
          activePhase={activePhase}
          onPhaseChange={setActivePhase}
        />
      )}
      
      {/* Division Selector - Only in division phase */}
      {activePhase === 'division' && hasDivisions && (
        <DivisionSelector
          divisions={Object.keys(divisionBrackets)}
          activeDivision={activeDivision}
          onDivisionChange={setActiveDivision}
        />
      )}
      
      {/* Bracket Visualization */}
      {activePhase === 'division' ? (
        <DivisionBracketView
          bracket={divisionBrackets[activeDivision || 'A']}
          division={activeDivision || 'A'}
        />
      ) : (
        <ChampionshipBracketView bracket={championshipBracket} />
      )}
    </div>
  );
}
```

---

## 📊 Data Flow with Divisions

### Scenario: 16 Teams, 4 Divisions (A, B, C, D)

**Phase 1: Division Play**
```
Division A (4 teams) → 3 games → 1 winner
Division B (4 teams) → 3 games → 1 winner  
Division C (4 teams) → 3 games → 1 winner
Division D (4 teams) → 3 games → 1 winner
Total: 12 division games
```

**Phase 2: Championship**
```
4 division winners → 3 games → 1 champion
- Semifinal 1: Div A vs Div B
- Semifinal 2: Div C vs Div D
- Final: Semifinal winners
Total: 3 championship games
```

**Total Games**: 15 games (12 division + 3 championship)

---

## 🎨 Visual Design Considerations

### Division Badge
```
┌─────────────────────┐
│  DIVISION A         │ ← Badge on bracket header
│  ─────────────────  │
│  [Bracket content]  │
└─────────────────────┘
```

### Advancer Indicator
```
┌─────────────────────┐
│  Team Name   85     │
│  ─────────────────  │
│  Team Name   72     │
│              [🏆]   │ ← Trophy icon for division winner
└─────────────────────┘
```

### Phase Transition
```
Division Play Complete
         │
         ▼
┌─────────────────────┐
│  Advancing Teams:   │
│  • Division A: Team X│
│  • Division B: Team Y│
│  • Division C: Team Z│
│  • Division D: Team W│
│                     │
│  [View Championship]│ ← Button to switch phase
└─────────────────────┘
```

---

## 🔍 Edge Cases & Considerations

### 1. **Uneven Divisions**
- Division A: 5 teams
- Division B: 4 teams
- Division C: 3 teams
- **Solution**: Handle byes in bracket calculation

### 2. **Multiple Advancers Per Division**
- Some tournaments advance top 2 from each division
- **Solution**: `getDivisionAdvancers()` returns array of advancers

### 3. **Round Robin Divisions**
- Divisions play round robin, then bracket
- **Solution**: Calculate standings first, then bracket top teams

### 4. **No Divisions**
- Tournament has no divisions (all teams in one bracket)
- **Solution**: Show single bracket (current design)

### 5. **Mixed Tournament Types**
- Division A: Single elimination
- Division B: Round robin
- **Solution**: Calculate each division bracket independently

---

## 🚀 Implementation Impact

### What Changes

1. **BracketService**: Adds division detection and grouping logic
2. **BracketTab**: Adds phase/division selectors
3. **New Components**: `PhaseSelector`, `DivisionSelector`, `DivisionBracketView`
4. **UI State**: Tracks active phase and division

### What Stays the Same

1. **Games Table**: No schema changes
2. **GameService**: No changes
3. **TeamService**: No changes
4. **Core Bracket Components**: `BracketMatch`, `BracketRound` unchanged
5. **Visual Design**: Same styling, just multiple brackets

---

## 📋 Summary

### Key Points

1. **Divisions = Multiple Brackets**: Each division has its own bracket
2. **Two Phases**: Division play → Championship bracket
3. **Advancers**: Division winners/advancers move to championship
4. **UI Navigation**: Phase selector + Division selector
5. **No Schema Changes**: Still reads from games table, infers divisions from teams

### Implementation Strategy

1. **Detect divisions** from teams (if `team.division` exists)
2. **Group games** by phase (division vs championship)
3. **Calculate multiple brackets** (one per division + championship)
4. **Render appropriate bracket** based on selected phase/division
5. **Show advancers** clearly when switching to championship phase

### Complexity Level

- **Without Divisions**: Simple (current design)
- **With Divisions**: Medium complexity (multiple brackets, phase logic)
- **Still Additive**: No breaking changes, just enhanced logic

---

**This design maintains the "no schema changes" principle while supporting division-based tournaments through intelligent game grouping and bracket calculation.**

