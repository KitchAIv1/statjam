# 🎯 Dual-Engine Architecture: Gap Analysis & Implementation Plan
**Date**: October 28, 2025  
**Purpose**: Map CURRENT vs TARGET engine; enumerate gaps with insertion points  
**Status**: COMPREHENSIVE GAP ANALYSIS

---

## 📋 EXECUTIVE SUMMARY

```yaml
TotalGaps: 28
Critical: 8 (blocking automation)
High: 12 (core engine features)
Medium: 6 (enhancements)
Low: 2 (nice-to-have)

EstimatedEffort: 120-160 hours
PhaseCount: 5
SchemaChanges: 3 tables, 8 columns
NewFiles: 12
ModifiedFiles: 8
```

---

## 🎯 TARGET ENGINE ARCHITECTURE

### Sub-Engines
1. **ClockEngine**: Auto-pause/resume, shot clock reset rules, FT mode
2. **PlayEngine**: Event sequences, assist→shot linking, turnover↔steal bundling
3. **PossessionEngine**: Auto-flip logic, possession persistence, arrow tracking
4. **RulesetService**: NBA/FIBA/NCAA configs (pure functions)

### Core Principles
- Event-driven model (domain events drive state changes)
- Command pattern (undo/redo via pre/post snapshots)
- Linked events (sequence_id, linked_event_id)
- Persistence of all state (including possession)

---

## 🚨 CRITICAL GAPS (Blocking Automation)

### GAP-CLK-001: Auto-Pause on Whistles
**Priority**: CRITICAL  
**Effort**: 8 hours

```yaml
Summary: Clock does not auto-pause on fouls, violations, or out-of-bounds
CurrentBehavior:
  - Clocks run continuously unless manually stopped
  - Fouls/violations recorded but no clock impact
  - File: src/hooks/useTracker.ts (lines 569-697)
  
TargetBehavior:
  - Foul → both clocks stop within 50ms
  - Violation → both clocks stop
  - Out-of-bounds → both clocks stop
  - Configurable per ruleset (NBA stops on made baskets last 2 min)

ImplementIn:
  - src/lib/engines/clockEngine.ts (NEW)
  - src/hooks/useTracker.ts (inject ClockEngine.applyEvent)
  
API:
  ClockEngine.applyEvent(event: GameEvent, context: GameContext): ClockStateDelta
    - Returns: { gameClock: { shouldPause: boolean }, shotClock: { shouldPause: boolean, shouldReset: boolean, resetTo?: number } }
  
  ClockStateDelta:
    gameClock:
      shouldPause: boolean
      shouldResume: boolean
    shotClock:
      shouldPause: boolean
      shouldReset: boolean
      resetTo?: number (24, 14, or custom)
      shouldDisable: boolean (for FT mode)

CalledBy:
  - useTracker.recordStat() (line 569)
  - After GameServiceV3.recordStat() succeeds (line 626)
  
Acceptance:
  - Foul recorded → clocks stop within 50ms
  - Made basket in Q4 last 2 min → clock stops (NBA rule)
  - Free throw mode → shot clock disabled
  - Configurable via ruleset
```

**Files to Create**:
```typescript
// src/lib/engines/clockEngine.ts
export interface ClockStateDelta {
  gameClock: { shouldPause: boolean; shouldResume: boolean };
  shotClock: { shouldPause: boolean; shouldReset: boolean; resetTo?: number; shouldDisable: boolean };
}

export class ClockEngine {
  static applyEvent(event: GameEvent, context: GameContext, ruleset: Ruleset): ClockStateDelta {
    // Implement whistle detection and clock rules
  }
}
```

**Insertion Point**:
```typescript
// src/hooks/useTracker.ts (after line 626)
const clockDelta = ClockEngine.applyEvent(
  { type: stat.statType, modifier: stat.modifier, quarter, gameTimeSeconds: clock.secondsRemaining },
  { ruleset: currentRuleset, scores, teamInPossession },
  currentRuleset
);

if (clockDelta.gameClock.shouldPause) {
  stopClock();
}
if (clockDelta.shotClock.shouldPause) {
  stopShotClock();
}
if (clockDelta.shotClock.shouldReset) {
  resetShotClock(clockDelta.shotClock.resetTo || 24);
}
```

---

### GAP-CLK-002: Shot Clock Auto-Reset Rules
**Priority**: CRITICAL  
**Effort**: 12 hours

```yaml
Summary: Shot clock does not auto-reset on made shots, rebounds, or fouls
CurrentBehavior:
  - Manual reset only (24s or 14s buttons)
  - No event-triggered resets
  - File: src/hooks/useTracker.ts (lines 445-453)
  
TargetBehavior:
  - Made basket → reset to 24s (or 30s/35s per ruleset)
  - Defensive rebound → reset to 24s
  - Offensive rebound → reset to 14s (NBA) or keep running (FIBA)
  - Foul → reset to 24s or 14s based on frontcourt/backcourt
  - Out-of-bounds (offensive team retains) → keep running if <14s, else reset to 14s

ImplementIn:
  - src/lib/engines/clockEngine.ts (extend applyEvent)
  - src/lib/config/rulesets.ts (NEW - shot clock rules per league)
  
API:
  Ruleset.shotClockRules:
    fullReset: number (24, 30, or 35)
    offensiveReboundReset: number | 'keep' (14 for NBA, 'keep' for FIBA)
    frontcourtFoulReset: number (14 for NBA)
    backcourt FoulReset: number (24 for all)
    outOfBoundsRule: 'keep' | 'reset_if_above_14'

CalledBy:
  - ClockEngine.applyEvent() (GAP-CLK-001)
  
Acceptance:
  - Made 3PT → shot clock resets to 24s automatically
  - Defensive rebound → shot clock resets to 24s
  - Offensive rebound → shot clock resets to 14s (NBA mode)
  - Foul in frontcourt → shot clock resets to 14s (NBA mode)
  - Configurable per ruleset
```

**Files to Create**:
```typescript
// src/lib/config/rulesets.ts
export interface ShotClockRules {
  fullReset: number; // 24, 30, or 35
  offensiveReboundReset: number | 'keep'; // 14 for NBA, 'keep' for FIBA
  frontcourtFoulReset: number; // 14 for NBA
  backcourt FoulReset: number; // 24 for all
  outOfBoundsRule: 'keep' | 'reset_if_above_14';
}

export interface Ruleset {
  id: 'NBA' | 'FIBA' | 'NCAA' | 'CUSTOM';
  name: string;
  quarterLengthMinutes: number;
  shotClockSeconds: number;
  shotClockRules: ShotClockRules;
  timeoutRules: TimeoutRules;
  foulRules: FoulRules;
}

export const NBA_RULESET: Ruleset = { /* ... */ };
export const FIBA_RULESET: Ruleset = { /* ... */ };
export const NCAA_RULESET: Ruleset = { /* ... */ };
```

---

### GAP-POS-001: Auto-Flip Possession
**Priority**: CRITICAL  
**Effort**: 10 hours

```yaml
Summary: Possession is manual toggle only; no auto-flip on events
CurrentBehavior:
  - Manual toggle via UI button
  - State: possessionTeam: 'A' | 'B' (local only)
  - File: src/components/tracker-v3/mobile/MobileLayoutV3.tsx (line 146)
  
TargetBehavior:
  - Made basket → possession flips to opposing team
  - Turnover → possession flips to opposing team
  - Steal → possession flips to stealing team
  - Defensive rebound → possession flips to rebounding team
  - Shot clock violation → possession flips to opposing team
  - Out-of-bounds → possession to inbounding team (manual or auto based on context)

ImplementIn:
  - src/lib/engines/possessionEngine.ts (NEW)
  - src/hooks/useTracker.ts (integrate PossessionEngine)
  
API:
  PossessionEngine.applyEvent(event: GameEvent, currentPossession: TeamId): PossessionDelta
    - Returns: { newPossession: TeamId | null, reason: string }
  
  PossessionDelta:
    newPossession: TeamId | null (null = no change)
    reason: string ('made_basket', 'turnover', 'steal', 'defensive_rebound', etc.)
    shouldPersist: boolean

CalledBy:
  - useTracker.recordStat() (after ClockEngine.applyEvent)
  
Acceptance:
  - Made basket → possession flips within 50ms
  - Turnover → possession flips
  - Steal → possession flips to stealing team
  - Defensive rebound → possession flips
  - Possession state persisted to database
```

**Files to Create**:
```typescript
// src/lib/engines/possessionEngine.ts
export interface PossessionDelta {
  newPossession: TeamId | null;
  reason: string;
  shouldPersist: boolean;
}

export class PossessionEngine {
  static applyEvent(event: GameEvent, currentPossession: TeamId, context: GameContext): PossessionDelta {
    // Implement possession flip logic
  }
}
```

**Insertion Point**:
```typescript
// src/hooks/useTracker.ts (after ClockEngine.applyEvent)
const possessionDelta = PossessionEngine.applyEvent(
  { type: stat.statType, modifier: stat.modifier, teamId: stat.teamId },
  currentPossession,
  { teamAId, teamBId }
);

if (possessionDelta.newPossession) {
  setPossession(possessionDelta.newPossession);
  if (possessionDelta.shouldPersist) {
    await GameServiceV3.recordPossessionChange({
      gameId,
      newPossession: possessionDelta.newPossession,
      reason: possessionDelta.reason,
      quarter,
      gameTimeSeconds: clock.secondsRemaining
    });
  }
}
```

---

### GAP-PLY-001: Assist-to-Shot Linking
**Priority**: CRITICAL  
**Effort**: 16 hours

```yaml
Summary: Assists are independent events; no linkage to made shots
CurrentBehavior:
  - Assist recorded as standalone event
  - No validation that a shot was made
  - No prompt after made shot
  - File: src/hooks/useTracker.ts (lines 569-697)
  
TargetBehavior:
  - Made shot → prompt "Was there an assist?"
  - Assist recorded → linked to shot via linked_event_id
  - Validation: assist requires a made shot within last 5 seconds
  - Play-by-play displays: "Player A assisted by Player B"

ImplementIn:
  - src/lib/engines/playEngine.ts (NEW)
  - src/hooks/useTracker.ts (integrate PlayEngine)
  - src/components/tracker-v3/AssistPromptModal.tsx (NEW)
  
API:
  PlayEngine.shouldPromptAssist(event: GameEvent, recentEvents: GameEvent[]): boolean
    - Returns true if made shot and no assist in last 5s
  
  PlayEngine.linkEvents(primaryEvent: GameEvent, linkedEvent: GameEvent): EventLink
    - Returns: { sequence_id: UUID, linked_event_id: UUID }

CalledBy:
  - useTracker.recordStat() (after successful stat recording)
  
Acceptance:
  - Made 2PT → "Assist?" prompt appears
  - Assist recorded → linked_event_id points to shot
  - Play-by-play shows: "John Doe 2PT (assisted by Jane Smith)"
  - Validation prevents assist without recent made shot
```

**Files to Create**:
```typescript
// src/lib/engines/playEngine.ts
export interface EventLink {
  sequence_id: string;
  linked_event_id: string;
  link_type: 'assist' | 'rebound' | 'steal_turnover' | 'block';
}

export class PlayEngine {
  static shouldPromptAssist(event: GameEvent, recentEvents: GameEvent[]): boolean {
    // Check if made shot and no assist in last 5s
  }
  
  static linkEvents(primaryEvent: GameEvent, linkedEvent: GameEvent, linkType: string): EventLink {
    // Generate sequence_id and link events
  }
  
  static validateEventSequence(event: GameEvent, recentEvents: GameEvent[]): ValidationResult {
    // Validate event makes sense in context (e.g., assist requires made shot)
  }
}
```

```typescript
// src/components/tracker-v3/AssistPromptModal.tsx
export function AssistPromptModal({ 
  isOpen, 
  onClose, 
  onAssist, 
  shotEvent, 
  availablePlayers 
}: AssistPromptModalProps) {
  // UI for selecting assist player after made shot
}
```

**Insertion Point**:
```typescript
// src/hooks/useTracker.ts (after successful recordStat)
if (stat.statType in ['field_goal', 'three_pointer'] && stat.modifier === 'made') {
  const shouldPrompt = PlayEngine.shouldPromptAssist(
    { type: stat.statType, modifier: stat.modifier, id: recordedStatId },
    recentEvents
  );
  
  if (shouldPrompt) {
    setShowAssistPrompt(true);
    setPendingShotEvent({ id: recordedStatId, playerId: stat.playerId, teamId: stat.teamId });
  }
}
```

---

### GAP-PLY-002: Rebound-to-Miss Linking
**Priority**: CRITICAL  
**Effort**: 12 hours

```yaml
Summary: Rebounds are independent events; no linkage to missed shots
CurrentBehavior:
  - Rebound recorded as standalone event
  - No validation that a shot was missed
  - No prompt after missed shot
  - File: src/hooks/useTracker.ts (lines 569-697)
  
TargetBehavior:
  - Missed shot → prompt "Who got the rebound?"
  - Rebound recorded → linked to miss via linked_event_id
  - Validation: rebound requires a missed shot within last 5 seconds
  - Auto-determine offensive vs defensive based on team

ImplementIn:
  - src/lib/engines/playEngine.ts (extend)
  - src/components/tracker-v3/ReboundPromptModal.tsx (NEW)
  
API:
  PlayEngine.shouldPromptRebound(event: GameEvent, recentEvents: GameEvent[]): boolean
  PlayEngine.determineReboundType(reboundTeam: TeamId, shotTeam: TeamId): 'offensive' | 'defensive'

CalledBy:
  - useTracker.recordStat() (after missed shot)
  
Acceptance:
  - Missed 3PT → "Rebound?" prompt appears
  - Rebound recorded → linked_event_id points to miss
  - Offensive/defensive auto-determined
  - Play-by-play shows: "Missed 3PT, rebounded by John Doe (DEF)"
```

---

### GAP-PLY-003: Steal-Turnover Bundling
**Priority**: HIGH  
**Effort**: 8 hours

```yaml
Summary: Steals and turnovers are independent; no automatic pairing
CurrentBehavior:
  - Steal recorded independently
  - Turnover recorded independently
  - No linkage between the two
  - File: src/hooks/useTracker.ts (lines 569-697)
  
TargetBehavior:
  - Steal recorded → auto-create turnover for opposing team
  - Turnover recorded → prompt "Was it a steal?"
  - Both events linked via sequence_id

ImplementIn:
  - src/lib/engines/playEngine.ts (extend)
  
API:
  PlayEngine.shouldCreateTurnover(event: GameEvent): { create: boolean, opposingTeam: TeamId }
  PlayEngine.shouldPromptSteal(event: GameEvent): boolean

CalledBy:
  - useTracker.recordStat() (after steal or turnover)
  
Acceptance:
  - Steal recorded → turnover auto-created for opposing team
  - Both events linked via sequence_id
  - Play-by-play shows: "Turnover by John Doe (stolen by Jane Smith)"
```

---

### GAP-CMD-001: Undo/Redo System
**Priority**: CRITICAL  
**Effort**: 20 hours

```yaml
Summary: No undo/redo functionality; events are permanent
CurrentBehavior:
  - TODO comments in DesktopStatGridV3.tsx (line 206)
  - No event versioning
  - No command pattern
  - Manual database deletion only
  
TargetBehavior:
  - Undo button reverts last stat/event
  - Redo button re-applies undone event
  - Command log with pre/post snapshots
  - Undo affects: stats, clock state, possession, scores

ImplementIn:
  - src/lib/engines/commandEngine.ts (NEW)
  - src/hooks/useTracker.ts (integrate CommandEngine)
  
API:
  CommandEngine.execute(command: Command): CommandResult
  CommandEngine.undo(): CommandResult
  CommandEngine.redo(): CommandResult
  
  Command:
    type: 'RECORD_STAT' | 'SUBSTITUTION' | 'TIMEOUT' | 'CLOCK_CHANGE'
    payload: any
    preSnapshot: GameStateSnapshot
    postSnapshot: GameStateSnapshot
    timestamp: string

CalledBy:
  - useTracker.recordStat() (wrap in CommandEngine.execute)
  - UI undo/redo buttons
  
Acceptance:
  - Undo button reverts last stat
  - Score, clock, possession all revert
  - Database updated (soft delete or versioning)
  - Redo button re-applies undone stat
  - Command log persisted for session recovery
```

**Files to Create**:
```typescript
// src/lib/engines/commandEngine.ts
export interface Command {
  id: string;
  type: 'RECORD_STAT' | 'SUBSTITUTION' | 'TIMEOUT' | 'CLOCK_CHANGE';
  payload: any;
  preSnapshot: GameStateSnapshot;
  postSnapshot: GameStateSnapshot;
  timestamp: string;
}

export interface CommandResult {
  success: boolean;
  newSnapshot: GameStateSnapshot;
  error?: string;
}

export class CommandEngine {
  private commandLog: Command[] = [];
  private currentIndex: number = -1;
  
  execute(command: Command): CommandResult {
    // Execute command, store in log
  }
  
  undo(): CommandResult {
    // Revert to preSnapshot of last command
  }
  
  redo(): CommandResult {
    // Re-apply postSnapshot of undone command
  }
  
  getCommandLog(): Command[] {
    return this.commandLog;
  }
}
```

---

### GAP-RLS-001: Ruleset Configuration
**Priority**: CRITICAL  
**Effort**: 14 hours

```yaml
Summary: No NBA/FIBA/NCAA ruleset selection; hardcoded values
CurrentBehavior:
  - Hardcoded 12 min quarters (line 75)
  - Hardcoded 24s shot clock (line 80)
  - Hardcoded 7 timeouts (lines 91-94)
  - No ruleset configuration
  - File: src/hooks/useTracker.ts
  
TargetBehavior:
  - Tournament has ruleset field ('NBA' | 'FIBA' | 'NCAA' | 'CUSTOM')
  - Ruleset loaded at game start
  - All clock/timeout/foul rules driven by ruleset
  - UI displays active ruleset

ImplementIn:
  - src/lib/config/rulesets.ts (NEW)
  - src/hooks/useTracker.ts (load and apply ruleset)
  - Database: tournaments.ruleset column
  
API:
  RulesetService.getRuleset(rulesetId: string): Ruleset
  RulesetService.applyRuleset(tracker: TrackerState, ruleset: Ruleset): TrackerState

CalledBy:
  - useTracker initialization (load ruleset from tournament)
  - All engine functions (pass ruleset as context)
  
Acceptance:
  - Tournament created with NBA ruleset → 12 min quarters, 24s shot clock
  - Tournament created with FIBA ruleset → 10 min quarters, 24s shot clock
  - Tournament created with NCAA ruleset → 20 min halves, 30s shot clock
  - Custom ruleset allows manual configuration
```

**Files to Create**:
```typescript
// src/lib/config/rulesets.ts (comprehensive)
export interface TimeoutRules {
  fullTimeouts: number;
  shortTimeouts: number;
  fullDurationSeconds: number;
  shortDurationSeconds: number;
  maxPerHalf: number;
  maxInLastTwoMinutes: number;
}

export interface FoulRules {
  personalFoulLimit: number; // 6 for NBA, 5 for FIBA
  technicalFoulEjection: number; // 2
  teamFoulBonus: number; // 5 for NBA, 4 for FIBA
  teamFoulDoubleBonus: number; // 10 for NBA (2 FTs), N/A for FIBA
}

export interface Ruleset {
  id: 'NBA' | 'FIBA' | 'NCAA' | 'CUSTOM';
  name: string;
  quarterLengthMinutes: number;
  periodsPerGame: number; // 4 for NBA/FIBA, 2 for NCAA
  overtimeLengthMinutes: number;
  shotClockSeconds: number;
  shotClockRules: ShotClockRules;
  timeoutRules: TimeoutRules;
  foulRules: FoulRules;
  clockStopsOnMadeBasket: boolean | 'last_2_minutes'; // NBA: last 2 min only
}

export const RULESETS: Record<string, Ruleset> = {
  NBA: { /* ... */ },
  FIBA: { /* ... */ },
  NCAA: { /* ... */ }
};

export class RulesetService {
  static getRuleset(id: string): Ruleset {
    return RULESETS[id] || RULESETS.NBA;
  }
  
  static validateRuleset(ruleset: Ruleset): ValidationResult {
    // Validate ruleset configuration
  }
}
```

---

## 🔥 HIGH PRIORITY GAPS (Core Engine Features)

### GAP-CLK-003: Free Throw Mode (Shot Clock Off)
**Priority**: HIGH  
**Effort**: 6 hours

```yaml
Summary: No free throw mode; shot clock runs during FTs
CurrentBehavior:
  - Shot clock runs continuously
  - No FT-specific mode
  
TargetBehavior:
  - Shooting foul → shot clock disabled
  - FT sequence → shot clock remains off
  - Last FT made → shot clock resets to 24s
  - Last FT missed → shot clock resets based on rebound

ImplementIn:
  - src/lib/engines/clockEngine.ts (extend)
  - src/hooks/useTracker.ts (FT mode state)
  
API:
  ClockEngine.enterFreeThrowMode(): void
  ClockEngine.exitFreeThrowMode(result: 'made' | 'missed', reboundTeam?: TeamId): ClockStateDelta

Acceptance:
  - Shooting foul → shot clock disabled
  - FT made (last) → shot clock resets to 24s
  - FT missed (last) → shot clock resets based on rebound
```

---

### GAP-CLK-004: Made Basket Clock Stop (NBA Last 2 Min)
**Priority**: HIGH  
**Effort**: 4 hours

```yaml
Summary: Clock does not stop on made baskets in last 2 minutes
CurrentBehavior:
  - Clock runs continuously on made baskets
  
TargetBehavior:
  - NBA: Made basket in Q4/OT last 2 min → clock stops
  - FIBA: Clock never stops on made baskets
  - NCAA: Clock stops on all made baskets in last minute

ImplementIn:
  - src/lib/engines/clockEngine.ts (extend applyEvent)
  
API:
  ClockEngine.shouldStopOnMadeBasket(quarter: number, timeRemaining: number, ruleset: Ruleset): boolean

Acceptance:
  - NBA Q4 1:30 remaining → made basket stops clock
  - FIBA Q4 1:30 remaining → made basket does NOT stop clock
  - Configurable per ruleset
```

---

### GAP-POS-002: Possession Persistence
**Priority**: HIGH  
**Effort**: 8 hours

```yaml
Summary: Possession state is local only; lost on refresh
CurrentBehavior:
  - Possession state: possessionTeam: 'A' | 'B' (local)
  - Not persisted to database
  - Lost on page refresh
  - File: src/components/tracker-v3/mobile/MobileLayoutV3.tsx (line 83)
  
TargetBehavior:
  - Possession state persisted to game_possessions table
  - Loaded on game start
  - Tracks possession history (start/end times, reason)

ImplementIn:
  - Database: game_possessions table (NEW)
  - src/lib/services/gameServiceV3.ts (add possession methods)
  - src/hooks/useTracker.ts (load/save possession)
  
API:
  GameServiceV3.recordPossessionChange(data: PossessionChange): Promise<boolean>
  GameServiceV3.getCurrentPossession(gameId: string): Promise<TeamId>
  GameServiceV3.getPossessionHistory(gameId: string): Promise<PossessionRecord[]>

Acceptance:
  - Possession change → saved to database
  - Page refresh → possession restored
  - Possession history viewable in admin panel
```

---

### GAP-POS-003: Jump Ball / Possession Arrow
**Priority**: HIGH  
**Effort**: 10 hours

```yaml
Summary: No jump ball or possession arrow tracking
CurrentBehavior:
  - No jump ball mechanism
  - No alternating possession
  
TargetBehavior:
  - Jump ball → possession arrow set
  - Next jump ball → arrow determines possession, then flips
  - Stored in game state

ImplementIn:
  - src/lib/engines/possessionEngine.ts (extend)
  - src/hooks/useTracker.ts (possession arrow state)
  - Database: games.possession_arrow column
  
API:
  PossessionEngine.handleJumpBall(currentArrow: TeamId): { possession: TeamId, newArrow: TeamId }

Acceptance:
  - Jump ball → arrow set to team that didn't get possession
  - Next jump ball → arrow team gets possession, arrow flips
  - Arrow persisted to database
```

---

### GAP-PLY-004: Block-to-Miss Linking
**Priority**: HIGH  
**Effort**: 6 hours

```yaml
Summary: Blocks are independent events; no linkage to missed shots
CurrentBehavior:
  - Block recorded independently
  - No validation that a shot was attempted
  
TargetBehavior:
  - Missed shot → prompt "Was it blocked?"
  - Block recorded → linked to miss via linked_event_id

ImplementIn:
  - src/lib/engines/playEngine.ts (extend)
  
API:
  PlayEngine.shouldPromptBlock(event: GameEvent): boolean

Acceptance:
  - Missed shot → "Blocked?" prompt
  - Block recorded → linked to miss
  - Play-by-play shows: "Missed 2PT (blocked by John Doe)"
```

---

### GAP-PLY-005: Free Throw Sequence
**Priority**: HIGH  
**Effort**: 12 hours

```yaml
Summary: No automatic free throw sequence after shooting fouls
CurrentBehavior:
  - Foul recorded independently
  - No FT prompt or sequence
  
TargetBehavior:
  - Shooting foul → prompt "How many FTs?" (1, 2, or 3)
  - FT sequence UI appears
  - Each FT recorded with sequence_id
  - Shot clock disabled during FTs

ImplementIn:
  - src/lib/engines/playEngine.ts (extend)
  - src/components/tracker-v3/FreeThrowSequenceModal.tsx (NEW)
  
API:
  PlayEngine.startFreeThrowSequence(foulEvent: GameEvent, ftCount: number): FTSequence
  PlayEngine.recordFreeThrow(sequence: FTSequence, result: 'made' | 'missed', ftNumber: number): void

Acceptance:
  - Shooting foul → "1, 2, or 3 FTs?" prompt
  - FT sequence UI displays
  - Each FT recorded and linked
  - Shot clock disabled during sequence
  - Last FT → shot clock resets
```

---

### GAP-FOUL-001: Bonus Free Throw Logic
**Priority**: HIGH  
**Effort**: 10 hours

```yaml
Summary: No automatic bonus free throws when team fouls >= 5
CurrentBehavior:
  - Bonus indicator displayed (TopScoreboardV3.tsx line 108)
  - No automatic FT awarding
  - No enforcement
  
TargetBehavior:
  - Team fouls >= 5 (NBA) or >= 4 (FIBA) → non-shooting foul awards FTs
  - NBA: 5-9 fouls = 1-and-1, 10+ fouls = 2 FTs
  - FIBA: 4+ fouls = 2 FTs
  - Auto-prompt FT sequence

ImplementIn:
  - src/lib/engines/playEngine.ts (extend)
  - src/hooks/useTracker.ts (check bonus on foul)
  
API:
  PlayEngine.shouldAwardBonusFTs(teamFouls: number, foulType: string, ruleset: Ruleset): { award: boolean, count: number, type: '1-and-1' | 'double' }

Acceptance:
  - Non-shooting foul with 5 team fouls → 1-and-1 FT prompt (NBA)
  - Non-shooting foul with 10 team fouls → 2 FT prompt (NBA)
  - Non-shooting foul with 4 team fouls → 2 FT prompt (FIBA)
```

---

### GAP-FOUL-002: Foul Out Enforcement
**Priority**: HIGH  
**Effort**: 8 hours

```yaml
Summary: No player foul-out enforcement (6 fouls NBA, 5 FIBA)
CurrentBehavior:
  - Fouls recorded indefinitely
  - No foul limit enforcement
  
TargetBehavior:
  - Player reaches foul limit → auto-removed from game
  - Prompt for substitution
  - Cannot be re-added to game

ImplementIn:
  - src/hooks/useTracker.ts (track player fouls)
  - src/components/tracker-v3/FoulOutModal.tsx (NEW)
  
API:
  useTracker.playerFouls: Record<PlayerId, number>
  useTracker.checkFoulOut(playerId: PlayerId): boolean

Acceptance:
  - Player gets 6th foul (NBA) → auto-removed, substitution prompt
  - Player gets 5th foul (FIBA) → auto-removed, substitution prompt
  - Fouled-out player cannot be selected for substitution
```

---

### GAP-FOUL-003: Technical Foul Ejection
**Priority**: HIGH  
**Effort**: 6 hours

```yaml
Summary: No technical foul ejection (2 technicals)
CurrentBehavior:
  - Technical fouls recorded independently
  - No ejection logic
  
TargetBehavior:
  - Player gets 2nd technical → auto-ejected
  - Coach gets 2nd technical → ejected
  - Prompt for substitution (if player)

ImplementIn:
  - src/hooks/useTracker.ts (track technical fouls)
  
API:
  useTracker.technicalFouls: Record<PlayerId, number>
  useTracker.checkTechnicalEjection(playerId: PlayerId): boolean

Acceptance:
  - Player gets 2nd technical → ejected, substitution prompt
  - Ejected player cannot be re-added
```

---

### GAP-TIMEOUT-001: Auto-Resume After Timeout
**Priority**: HIGH  
**Effort**: 4 hours

```yaml
Summary: Timeout expires but requires manual resume
CurrentBehavior:
  - Timeout countdown reaches 0
  - Manual resume required
  - File: src/hooks/useTracker.ts (line 558)
  
TargetBehavior:
  - Timeout reaches 0 → auto-resume prompt
  - Optional: auto-resume after 3s delay
  - Configurable per tournament

ImplementIn:
  - src/hooks/useTracker.ts (extend timeout countdown)
  
API:
  useTracker.autoResumeTimeout: boolean (config)

Acceptance:
  - Timeout reaches 0 → "Resume play?" prompt
  - Optional auto-resume after 3s
```

---

### GAP-SUB-001: Dead Ball Substitution Validation
**Priority**: MEDIUM  
**Effort**: 4 hours

```yaml
Summary: Substitutions allowed anytime; no dead ball requirement
CurrentBehavior:
  - Substitutions allowed while clock running
  - No dead ball validation
  - File: src/hooks/useTracker.ts (lines 700-750)
  
TargetBehavior:
  - Substitution requires dead ball (clock stopped)
  - Warning if attempted during live play
  - Configurable per ruleset

ImplementIn:
  - src/hooks/useTracker.ts (extend substitute validation)
  
API:
  useTracker.canSubstitute(): { allowed: boolean, reason: string }

Acceptance:
  - Substitution attempted while clock running → warning
  - Substitution allowed when clock stopped
```

---

### GAP-PERSIST-001: Event Linking Schema
**Priority**: HIGH  
**Effort**: 6 hours

```yaml
Summary: No event linking columns in database
CurrentBehavior:
  - game_stats table has no linking columns
  - Events are independent
  
TargetBehavior:
  - game_stats has sequence_id, linked_event_id, event_metadata
  - Linked events queryable
  - Play-by-play can reconstruct sequences

ImplementIn:
  - Database migration: add columns to game_stats
  - src/lib/services/gameServiceV3.ts (update recordStat)
  
Schema:
  ALTER TABLE game_stats ADD COLUMN sequence_id UUID;
  ALTER TABLE game_stats ADD COLUMN linked_event_id UUID REFERENCES game_stats(id);
  ALTER TABLE game_stats ADD COLUMN event_metadata JSONB;
  CREATE INDEX idx_game_stats_sequence_id ON game_stats(sequence_id);
  CREATE INDEX idx_game_stats_linked_event_id ON game_stats(linked_event_id);

Acceptance:
  - Assist recorded → linked_event_id points to shot
  - Rebound recorded → linked_event_id points to miss
  - Play-by-play query can join linked events
```

---

## 📊 MEDIUM PRIORITY GAPS (Enhancements)

### GAP-TIMEOUT-002: Timeout Limit Per Half
**Priority**: MEDIUM  
**Effort**: 4 hours

```yaml
Summary: No timeout limit per half; only total limit
CurrentBehavior:
  - 7 timeouts per team (total)
  - No per-half limit
  
TargetBehavior:
  - NBA: Max 3 timeouts in Q4 last 3 minutes
  - NCAA: Max 4 timeouts per half
  - Validation prevents exceeding limit

ImplementIn:
  - src/hooks/useTracker.ts (extend timeout validation)
  
API:
  useTracker.canCallTimeout(teamId: TeamId, quarter: number): { allowed: boolean, reason: string }

Acceptance:
  - Team tries 4th timeout in Q4 last 3 min → blocked (NBA)
```

---

### GAP-PERSIST-002: Possession History Table
**Priority**: MEDIUM  
**Effort**: 6 hours

```yaml
Summary: No possession history tracking
CurrentBehavior:
  - Possession state local only
  
TargetBehavior:
  - game_possessions table tracks all possession changes
  - Queryable for analytics

ImplementIn:
  - Database migration: create game_possessions table
  
Schema:
  CREATE TABLE game_possessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id),
    start_quarter INT NOT NULL,
    start_time_seconds INT NOT NULL,
    end_quarter INT,
    end_time_seconds INT,
    end_reason TEXT, -- 'made_shot', 'turnover', 'violation', etc.
    created_at TIMESTAMP DEFAULT NOW()
  );
  CREATE INDEX idx_game_possessions_game_id ON game_possessions(game_id);

Acceptance:
  - Possession change → record created
  - Possession history queryable
```

---

### GAP-ANALYTICS-001: Advanced Stats Calculation
**Priority**: MEDIUM  
**Effort**: 12 hours

```yaml
Summary: No advanced stats (TS%, eFG%, usage rate, etc.)
CurrentBehavior:
  - Basic stats only (PTS, REB, AST, etc.)
  
TargetBehavior:
  - Calculate advanced stats from game_stats
  - Display in player dashboard

ImplementIn:
  - src/lib/services/advancedStatsService.ts (NEW)
  
API:
  AdvancedStatsService.calculatePlayerAdvancedStats(playerId: PlayerId, gameId: GameId): AdvancedStats

Acceptance:
  - TS%, eFG%, usage rate calculated
  - Displayed in player dashboard
```

---

### GAP-UI-001: Ruleset Selector in Tournament Creation
**Priority**: MEDIUM  
**Effort**: 4 hours

```yaml
Summary: No ruleset selector in tournament creation UI
CurrentBehavior:
  - No ruleset selection
  
TargetBehavior:
  - Tournament creation has ruleset dropdown
  - NBA/FIBA/NCAA/Custom options

ImplementIn:
  - src/app/dashboard/create-tournament/page.tsx
  
Acceptance:
  - Ruleset dropdown in tournament creation
  - Selected ruleset saved to tournaments.ruleset
```

---

### GAP-UI-002: Automation Toggle Switches
**Priority**: MEDIUM  
**Effort**: 6 hours

```yaml
Summary: No UI to toggle automation on/off
CurrentBehavior:
  - All features manual
  
TargetBehavior:
  - Settings panel with automation toggles
  - Auto-pause, auto-flip, auto-reset, etc.
  - Saved per tournament

ImplementIn:
  - src/components/tracker-v3/AutomationSettingsPanel.tsx (NEW)
  
Acceptance:
  - Toggle switches for each automation feature
  - Settings saved to tournament config
```

---

### GAP-UI-003: Event Sequence Indicators
**Priority**: MEDIUM  
**Effort**: 4 hours

```yaml
Summary: No visual indication of linked events
CurrentBehavior:
  - Play-by-play shows independent events
  
TargetBehavior:
  - Linked events displayed together
  - Visual grouping (e.g., assist + shot)

ImplementIn:
  - src/hooks/usePlayFeed.tsx (group linked events)
  - src/components/game-viewer/PlayByPlayFeed.tsx
  
Acceptance:
  - Assist + shot displayed as single entry
  - Visual grouping with indentation or badges
```

---

## 🎯 LOW PRIORITY GAPS (Nice-to-Have)

### GAP-MERCY-001: Mercy Rule / Running Clock
**Priority**: LOW  
**Effort**: 6 hours

```yaml
Summary: No mercy rule or running clock for blowouts
CurrentBehavior:
  - Clock behavior constant regardless of score
  
TargetBehavior:
  - Configurable mercy rule (e.g., 30-point lead in Q4)
  - Running clock (no stops) when mercy rule active

ImplementIn:
  - src/lib/config/rulesets.ts (add mercy rule config)
  - src/lib/engines/clockEngine.ts (apply mercy rule)
  
Acceptance:
  - 30-point lead in Q4 → clock runs continuously
  - Configurable per tournament
```

---

### GAP-ANALYTICS-002: Possession Analytics
**Priority**: LOW  
**Effort**: 8 hours

```yaml
Summary: No possession-based analytics (pace, efficiency, etc.)
CurrentBehavior:
  - No possession analytics
  
TargetBehavior:
  - Calculate possessions per game, pace, offensive/defensive efficiency
  - Display in team dashboard

ImplementIn:
  - src/lib/services/possessionAnalyticsService.ts (NEW)
  
Acceptance:
  - Possessions per game calculated
  - Pace, efficiency displayed
```

---

## 📦 SCHEMA CHANGES REQUIRED

### 1. Event Linking (game_stats)
```sql
-- Migration: 008_event_linking.sql
ALTER TABLE game_stats ADD COLUMN sequence_id UUID;
ALTER TABLE game_stats ADD COLUMN linked_event_id UUID REFERENCES game_stats(id) ON DELETE SET NULL;
ALTER TABLE game_stats ADD COLUMN event_metadata JSONB DEFAULT '{}'::jsonb;

CREATE INDEX idx_game_stats_sequence_id ON game_stats(sequence_id);
CREATE INDEX idx_game_stats_linked_event_id ON game_stats(linked_event_id);

COMMENT ON COLUMN game_stats.sequence_id IS 'Groups related events (e.g., assist + shot)';
COMMENT ON COLUMN game_stats.linked_event_id IS 'Points to primary event (e.g., assist → shot)';
COMMENT ON COLUMN game_stats.event_metadata IS 'Additional event context (e.g., FT sequence number)';
```

### 2. Possession Tracking (game_possessions)
```sql
-- Migration: 009_possession_tracking.sql
CREATE TABLE game_possessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  start_quarter INT NOT NULL CHECK (start_quarter BETWEEN 1 AND 8),
  start_time_seconds INT NOT NULL CHECK (start_time_seconds >= 0),
  end_quarter INT CHECK (end_quarter BETWEEN 1 AND 8),
  end_time_seconds INT CHECK (end_time_seconds >= 0),
  end_reason TEXT CHECK (end_reason IN ('made_shot', 'turnover', 'steal', 'defensive_rebound', 'violation', 'foul', 'timeout', 'quarter_end', 'game_end')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_game_possessions_game_id ON game_possessions(game_id);
CREATE INDEX idx_game_possessions_team_id ON game_possessions(team_id);
CREATE INDEX idx_game_possessions_game_team ON game_possessions(game_id, team_id);

-- RLS Policies
ALTER TABLE game_possessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY game_possessions_public_read ON game_possessions
  FOR SELECT USING (true);

CREATE POLICY game_possessions_stat_admin_write ON game_possessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'stat_admin'
    )
  );

CREATE POLICY game_possessions_coach_write ON game_possessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM games
      JOIN teams ON teams.id = games.team_a_id OR teams.id = games.team_b_id
      WHERE games.id = game_possessions.game_id
      AND teams.coach_id = auth.uid()
    )
  );
```

### 3. Ruleset Configuration (tournaments)
```sql
-- Migration: 010_ruleset_configuration.sql
ALTER TABLE tournaments ADD COLUMN ruleset TEXT DEFAULT 'NBA' CHECK (ruleset IN ('NBA', 'FIBA', 'NCAA', 'CUSTOM'));
ALTER TABLE tournaments ADD COLUMN ruleset_config JSONB DEFAULT '{}'::jsonb;

-- Add possession arrow to games
ALTER TABLE games ADD COLUMN possession_arrow UUID REFERENCES teams(id);
ALTER TABLE games ADD COLUMN current_possession UUID REFERENCES teams(id);

-- Add automation settings to tournaments
ALTER TABLE tournaments ADD COLUMN automation_settings JSONB DEFAULT '{
  "auto_pause_on_whistles": true,
  "auto_reset_shot_clock": true,
  "auto_flip_possession": true,
  "prompt_assists": true,
  "prompt_rebounds": true,
  "enforce_foul_limits": true,
  "enforce_bonus_fts": true
}'::jsonb;

COMMENT ON COLUMN tournaments.ruleset IS 'NBA, FIBA, NCAA, or CUSTOM';
COMMENT ON COLUMN tournaments.ruleset_config IS 'Custom ruleset configuration (overrides defaults)';
COMMENT ON COLUMN tournaments.automation_settings IS 'Toggle automation features per tournament';
```

### 4. Player Foul Tracking (game_stats or new table)
```sql
-- Option A: Add to existing game_stats (already has foul stats)
-- No schema change needed, just aggregate player fouls from game_stats

-- Option B: Create dedicated player_game_fouls table for real-time tracking
CREATE TABLE player_game_fouls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID REFERENCES users(id) ON DELETE CASCADE,
  custom_player_id UUID REFERENCES custom_players(id) ON DELETE CASCADE,
  personal_fouls INT DEFAULT 0,
  technical_fouls INT DEFAULT 0,
  flagrant_fouls INT DEFAULT 0,
  fouled_out BOOLEAN DEFAULT false,
  ejected BOOLEAN DEFAULT false,
  updated_at TIMESTAMP DEFAULT NOW(),
  CHECK ((player_id IS NOT NULL AND custom_player_id IS NULL) OR (player_id IS NULL AND custom_player_id IS NOT NULL)),
  UNIQUE (game_id, player_id),
  UNIQUE (game_id, custom_player_id)
);

CREATE INDEX idx_player_game_fouls_game_id ON player_game_fouls(game_id);
CREATE INDEX idx_player_game_fouls_player_id ON player_game_fouls(player_id);
CREATE INDEX idx_player_game_fouls_custom_player_id ON player_game_fouls(custom_player_id);
```

---

## 🗂️ NEW FILES TO CREATE

### 1. Engine Files
```
src/lib/engines/
├── clockEngine.ts (GAP-CLK-001, 002, 003, 004)
├── playEngine.ts (GAP-PLY-001, 002, 003, 004, 005, FOUL-001)
├── possessionEngine.ts (GAP-POS-001, 002, 003)
└── commandEngine.ts (GAP-CMD-001)
```

### 2. Configuration Files
```
src/lib/config/
└── rulesets.ts (GAP-RLS-001)
```

### 3. Service Files
```
src/lib/services/
├── advancedStatsService.ts (GAP-ANALYTICS-001)
└── possessionAnalyticsService.ts (GAP-ANALYTICS-002)
```

### 4. UI Component Files
```
src/components/tracker-v3/
├── AssistPromptModal.tsx (GAP-PLY-001)
├── ReboundPromptModal.tsx (GAP-PLY-002)
├── FreeThrowSequenceModal.tsx (GAP-PLY-005)
├── FoulOutModal.tsx (GAP-FOUL-002)
├── AutomationSettingsPanel.tsx (GAP-UI-002)
└── EventSequenceIndicator.tsx (GAP-UI-003)
```

---

## 🔧 FILES TO MODIFY

### 1. Core Tracker Hook
```
src/hooks/useTracker.ts
- Integrate ClockEngine (GAP-CLK-001, 002, 003, 004)
- Integrate PlayEngine (GAP-PLY-001, 002, 003, 004, 005)
- Integrate PossessionEngine (GAP-POS-001, 002, 003)
- Integrate CommandEngine (GAP-CMD-001)
- Load and apply ruleset (GAP-RLS-001)
- Track player fouls (GAP-FOUL-002, 003)
- Validate substitutions (GAP-SUB-001)
- Validate timeouts (GAP-TIMEOUT-001, 002)
```

### 2. Stat Recording Service
```
src/lib/services/gameServiceV3.ts
- Add sequence_id, linked_event_id to recordStat (GAP-PERSIST-001)
- Add recordPossessionChange method (GAP-POS-002)
- Add getCurrentPossession method (GAP-POS-002)
```

### 3. Play-by-Play Feed
```
src/hooks/usePlayFeed.tsx
- Group linked events (GAP-UI-003)
- Display event sequences
```

### 4. Tournament Creation
```
src/app/dashboard/create-tournament/page.tsx
- Add ruleset selector (GAP-UI-001)
- Add automation settings (GAP-UI-002)
```

### 5. Stat Tracker Page
```
src/app/stat-tracker-v3/page.tsx
- Load ruleset from tournament (GAP-RLS-001)
- Pass ruleset to useTracker
```

### 6. Types
```
src/lib/types/tracker.ts
- Add Ruleset interface (GAP-RLS-001)
- Add GameEvent interface (for engines)
- Add EventLink interface (GAP-PLY-001)
- Add PossessionDelta interface (GAP-POS-001)
- Add ClockStateDelta interface (GAP-CLK-001)
```

### 7. Domain Logic
```
src/lib/domain/tracker.ts
- Add ruleset validation functions
- Add event linking helpers
```

### 8. Database Migrations
```
docs/05-database/migrations/
├── 008_event_linking.sql (GAP-PERSIST-001)
├── 009_possession_tracking.sql (GAP-POS-002)
└── 010_ruleset_configuration.sql (GAP-RLS-001)
```

---

## 📊 IMPLEMENTATION ROADMAP

### Phase 1: Foundation (40 hours)
**Goal**: Ruleset configuration + basic engine structure

```yaml
Tasks:
  - GAP-RLS-001: Ruleset configuration (14h)
  - GAP-PERSIST-001: Event linking schema (6h)
  - GAP-POS-002: Possession persistence (8h)
  - Create engine base classes (12h)

Deliverables:
  - Ruleset selector in tournament creation
  - Rulesets.ts with NBA/FIBA/NCAA configs
  - Event linking columns in game_stats
  - game_possessions table
  - ClockEngine, PlayEngine, PossessionEngine base classes

Acceptance:
  - Tournament created with NBA ruleset
  - Ruleset loaded in stat tracker
  - Event linking columns exist
  - Possession persisted to DB
```

---

### Phase 2: Clock Automation (30 hours)
**Goal**: Auto-pause, auto-reset, FT mode

```yaml
Tasks:
  - GAP-CLK-001: Auto-pause on whistles (8h)
  - GAP-CLK-002: Shot clock auto-reset (12h)
  - GAP-CLK-003: Free throw mode (6h)
  - GAP-CLK-004: Made basket clock stop (4h)

Deliverables:
  - ClockEngine.applyEvent() implementation
  - Auto-pause on fouls/violations
  - Shot clock auto-reset on events
  - FT mode (shot clock off)
  - NBA last 2 min clock stop

Acceptance:
  - Foul → clocks stop automatically
  - Made basket → shot clock resets to 24s
  - Shooting foul → shot clock disabled
  - NBA Q4 last 2 min → clock stops on made basket
```

---

### Phase 3: Possession Automation (28 hours)
**Goal**: Auto-flip possession, jump ball, arrow

```yaml
Tasks:
  - GAP-POS-001: Auto-flip possession (10h)
  - GAP-POS-003: Jump ball / arrow (10h)
  - GAP-TIMEOUT-001: Auto-resume timeout (4h)
  - GAP-SUB-001: Dead ball validation (4h)

Deliverables:
  - PossessionEngine.applyEvent() implementation
  - Auto-flip on made baskets, turnovers, steals, rebounds
  - Jump ball and possession arrow tracking
  - Auto-resume after timeout
  - Dead ball substitution validation

Acceptance:
  - Made basket → possession flips automatically
  - Turnover → possession flips
  - Jump ball → arrow set and tracked
  - Timeout expires → auto-resume prompt
  - Substitution requires dead ball
```

---

### Phase 4: Play Sequences (54 hours)
**Goal**: Event linking, assist/rebound/steal prompts, FT sequences

```yaml
Tasks:
  - GAP-PLY-001: Assist-to-shot linking (16h)
  - GAP-PLY-002: Rebound-to-miss linking (12h)
  - GAP-PLY-003: Steal-turnover bundling (8h)
  - GAP-PLY-004: Block-to-miss linking (6h)
  - GAP-PLY-005: Free throw sequence (12h)

Deliverables:
  - PlayEngine.shouldPromptAssist/Rebound/Block()
  - PlayEngine.linkEvents()
  - AssistPromptModal, ReboundPromptModal
  - FreeThrowSequenceModal
  - Steal auto-creates turnover
  - All events linked via sequence_id

Acceptance:
  - Made shot → "Assist?" prompt
  - Assist recorded → linked to shot
  - Missed shot → "Rebound?" prompt
  - Rebound recorded → linked to miss
  - Steal → turnover auto-created
  - Shooting foul → FT sequence UI
```

---

### Phase 5: Foul Enforcement & Undo (44 hours)
**Goal**: Bonus FTs, foul-out, ejection, undo/redo

```yaml
Tasks:
  - GAP-FOUL-001: Bonus free throw logic (10h)
  - GAP-FOUL-002: Foul out enforcement (8h)
  - GAP-FOUL-003: Technical ejection (6h)
  - GAP-CMD-001: Undo/redo system (20h)

Deliverables:
  - Bonus FT auto-prompt when team fouls >= 5
  - Player foul-out at 6 fouls (NBA) or 5 (FIBA)
  - Technical ejection at 2 technicals
  - CommandEngine with undo/redo
  - Command log with snapshots
  - Undo/redo UI buttons

Acceptance:
  - Non-shooting foul with 5 team fouls → FT prompt
  - Player gets 6th foul → auto-removed, sub prompt
  - Player gets 2nd technical → ejected
  - Undo button reverts last stat
  - Redo button re-applies undone stat
```

---

## 📈 EFFORT SUMMARY

```yaml
Phase1_Foundation: 40 hours
Phase2_ClockAutomation: 30 hours
Phase3_PossessionAutomation: 28 hours
Phase4_PlaySequences: 54 hours
Phase5_FoulEnforcement_Undo: 44 hours

TotalCriticalGaps: 88 hours
TotalHighGaps: 72 hours
TotalMediumGaps: 26 hours
TotalLowGaps: 14 hours

GrandTotal: 196 hours (24.5 days @ 8 hours/day)

RecommendedTimeline: 6-8 weeks (with testing, QA, documentation)
```

---

## 🎯 ACCEPTANCE CRITERIA (Overall)

### Minimum Viable Dual-Engine (Phases 1-3)
- ✅ Ruleset configuration (NBA/FIBA/NCAA)
- ✅ Auto-pause on whistles
- ✅ Shot clock auto-reset
- ✅ Auto-flip possession
- ✅ Possession persistence
- ✅ Event linking schema

### Full Dual-Engine (Phases 1-5)
- ✅ All Phase 1-3 features
- ✅ Assist/rebound/steal linking
- ✅ Free throw sequences
- ✅ Bonus free throws
- ✅ Foul-out enforcement
- ✅ Technical ejection
- ✅ Undo/redo system

### Enterprise-Ready (All Phases + Polish)
- ✅ All Phase 1-5 features
- ✅ Automation toggle switches
- ✅ Advanced analytics
- ✅ Event sequence indicators
- ✅ Comprehensive testing
- ✅ Documentation

---

## 📋 NEXT STEPS

1. **Review & Prioritize**: Stakeholder review of gap analysis
2. **Resource Allocation**: Assign developers to phases
3. **Phase 1 Kickoff**: Begin ruleset configuration and foundation
4. **Iterative Development**: Complete phases 1-5 sequentially
5. **Testing & QA**: Comprehensive testing after each phase
6. **Documentation**: Update docs as features are implemented
7. **Deployment**: Phased rollout with feature flags

---

**Document Version**: 1.0  
**Last Updated**: October 28, 2025  
**Maintained By**: StatJam Architecture Team

