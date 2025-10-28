# useTracker.ts Refactoring Plan

## 🚨 **TECHNICAL DEBT ACKNOWLEDGMENT**

**Current Status**: `.cursorrules` VIOLATION  
**File**: `src/hooks/useTracker.ts`  
**Current Size**: 1,216 lines  
**Rule Limit**: 100 lines per hook  
**Violation**: 10.16x over limit  

---

## 📋 **CONTEXT**

### Why This Violation Exists:
1. **Phase 2 (Clock Automation)**: Added ~150 lines for clock engine integration
2. **Phase 3 (Possession Tracking)**: Added ~60 lines for possession engine integration
3. **Historical Growth**: Hook has accumulated features over time without refactoring

### Why We Proceeded:
1. **Risk Management**: Refactoring 1,156 lines mid-feature is high-risk
2. **Feature Priority**: Phase 3 needed to be completed and tested
3. **Separate Concerns**: Mixing new features with refactoring increases failure risk
4. **Rollback Strategy**: Easier to rollback Phase 3 than Phase 3 + Refactor

---

## 🎯 **REFACTORING STRATEGY**

### **Approach**: Gradual Extraction Pattern
- Extract one concern at a time
- Test after each extraction
- Maintain backward compatibility
- No breaking changes to consumers

---

## 📦 **TARGET ARCHITECTURE**

### **Split into 10 Focused Hooks** (each <100 lines):

```
src/hooks/
├── useTracker.ts              (~80 lines) - Main orchestrator
├── useGameClock.ts            (~90 lines) - Clock management
├── useShotClock.ts            (~70 lines) - Shot clock logic
├── useGameScores.ts           (~80 lines) - Score tracking
├── useGameRoster.ts           (~90 lines) - Roster management
├── useStatRecording.ts        (~95 lines) - Stat recording logic
├── useSubstitutions.ts        (~80 lines) - Substitution logic
├── useTimeouts.ts             (~85 lines) - Timeout management
├── useRulesetAutomation.ts    (~95 lines) - Ruleset & automation
└── usePossessionTracking.ts   (~90 lines) - Possession logic (Phase 3)
```

**Total**: 10 hooks, ~855 lines (average 85.5 lines per hook) ✅

---

## 🔄 **PHASE-BY-PHASE EXTRACTION PLAN**

### **Phase 1: Extract Clock Management** (Week 1)
**Target**: `useGameClock.ts` + `useShotClock.ts`

**Extract**:
- Game clock state (`clock`, `setClock`)
- Game clock actions (`startClock`, `stopClock`, `resetClock`, `setCustomTime`, `tick`)
- Shot clock state (`shotClock`, `setShotClock`)
- Shot clock actions (`startShotClock`, `stopShotClock`, `resetShotClock`, `setShotClockTime`, `shotClockTick`)
- Clock intervals and effects

**Return Interface**:
```typescript
interface UseGameClockReturn {
  clock: { isRunning: boolean; secondsRemaining: number };
  startClock: () => void;
  stopClock: () => void;
  resetClock: (forQuarter?: number) => void;
  setCustomTime: (minutes: number, seconds: number) => Promise<void>;
  tick: (seconds: number) => void;
}

interface UseShotClockReturn {
  shotClock: { isRunning: boolean; secondsRemaining: number; isVisible: boolean };
  startShotClock: () => void;
  stopShotClock: () => void;
  resetShotClock: (seconds?: number) => void;
  setShotClockTime: (seconds: number) => void;
  shotClockTick: (seconds: number) => void;
}
```

**Testing**:
- [ ] Clock starts/stops correctly
- [ ] Clock resets for quarters/OT
- [ ] Shot clock resets on events
- [ ] Manual time editing works
- [ ] No regression in stat tracker

---

### **Phase 2: Extract Score & Roster Management** (Week 2)
**Target**: `useGameScores.ts` + `useGameRoster.ts`

**Extract**:
- Score state (`scores`, `setScores`)
- Score refresh logic
- Roster state (`rosterA`, `rosterB`, `setRosterA`, `setRosterB`)
- Player seconds tracking

**Return Interface**:
```typescript
interface UseGameScoresReturn {
  scores: ScoreByTeam;
  refreshScoresFromDatabase: () => Promise<void>;
}

interface UseGameRosterReturn {
  rosterA: RosterState;
  rosterB: RosterState;
  setRosterA: (updater: (prev: RosterState) => RosterState) => void;
  setRosterB: (updater: (prev: RosterState) => RosterState) => void;
  playerSeconds: Record<string, number>;
}
```

**Testing**:
- [ ] Scores update correctly
- [ ] Score refresh works
- [ ] Roster updates work
- [ ] Player seconds tracked
- [ ] No regression in substitutions

---

### **Phase 3: Extract Stat Recording & Substitutions** (Week 3)
**Target**: `useStatRecording.ts` + `useSubstitutions.ts`

**Extract**:
- `recordStat` function
- Stat validation logic
- Clock automation integration
- Possession automation integration
- `substitute` function
- Substitution validation

**Return Interface**:
```typescript
interface UseStatRecordingReturn {
  recordStat: (stat: Omit<StatRecord, 'createdAt' | 'quarter' | 'gameTimeSeconds'>) => Promise<void>;
  lastAction: string | null;
  lastActionPlayerId: string | null;
}

interface UseSubstitutionsReturn {
  substitute: (sub: { gameId: string; teamId: string; playerOutId: string; playerInId: string; quarter: number; gameTimeSeconds: number }) => Promise<boolean>;
}
```

**Testing**:
- [ ] Stats record correctly
- [ ] Clock automation triggers
- [ ] Possession automation triggers
- [ ] Substitutions work
- [ ] No regression in game flow

---

### **Phase 4: Extract Timeouts & Automation** (Week 4)
**Target**: `useTimeouts.ts` + `useRulesetAutomation.ts` + `usePossessionTracking.ts`

**Extract**:
- Timeout state and logic
- Ruleset loading
- Automation flags
- Possession state and logic

**Return Interface**:
```typescript
interface UseTimeoutsReturn {
  teamFouls: { [teamId: string]: number };
  teamTimeouts: { [teamId: string]: number };
  timeoutActive: boolean;
  timeoutTeamId: string | null;
  timeoutSecondsRemaining: number;
  timeoutType: 'full' | '30_second';
  startTimeout: (teamId: string, type: 'full' | '30_second') => Promise<boolean>;
  resumeFromTimeout: () => void;
}

interface UseRulesetAutomationReturn {
  ruleset: Ruleset | null;
  automationFlags: AutomationFlags;
}

interface UsePossessionTrackingReturn {
  possession: {
    currentTeamId: string;
    possessionArrow: string;
    lastChangeReason: string | null;
    lastChangeTimestamp: string | null;
  };
}
```

**Testing**:
- [ ] Timeouts work correctly
- [ ] Ruleset loads
- [ ] Automation flags applied
- [ ] Possession tracking works
- [ ] No regression in Phase 2/3

---

### **Phase 5: Final Integration** (Week 5)
**Target**: `useTracker.ts` (orchestrator)

**Responsibilities**:
- Compose all extracted hooks
- Provide unified interface
- Handle cross-cutting concerns
- Maintain backward compatibility

**Final `useTracker.ts`** (~80 lines):
```typescript
export const useTracker = ({ initialGameId, teamAId, teamBId, isCoachMode }: UseTrackerProps): UseTrackerReturn => {
  const gameClock = useGameClock(initialGameId);
  const shotClock = useShotClock();
  const scores = useGameScores(initialGameId, teamAId, teamBId);
  const roster = useGameRoster(teamAId, teamBId);
  const statRecording = useStatRecording(initialGameId, gameClock, shotClock, /* ... */);
  const substitutions = useSubstitutions(initialGameId);
  const timeouts = useTimeouts(initialGameId, teamAId, teamBId);
  const rulesetAutomation = useRulesetAutomation(initialGameId, isCoachMode);
  const possession = usePossessionTracking(teamAId, teamBId);

  return {
    gameId: initialGameId,
    quarter: gameClock.quarter,
    clock: gameClock.clock,
    shotClock: shotClock.shotClock,
    scores: scores.scores,
    ruleset: rulesetAutomation.ruleset,
    automationFlags: rulesetAutomation.automationFlags,
    rosterA: roster.rosterA,
    rosterB: roster.rosterB,
    recordStat: statRecording.recordStat,
    // ... (compose all returns)
    possession: possession.possession
  };
};
```

**Testing**:
- [ ] All features work end-to-end
- [ ] No performance regression
- [ ] No memory leaks
- [ ] Stat Admin interface works
- [ ] Coach Tracker interface works
- [ ] Live Viewer works

---

## ✅ **SUCCESS CRITERIA**

1. ✅ All files < 500 lines
2. ✅ All hooks < 100 lines
3. ✅ All functions < 40 lines
4. ✅ Clear separation of concerns
5. ✅ No breaking changes to consumers
6. ✅ All tests pass
7. ✅ No performance regression
8. ✅ Documentation updated

---

## 🚨 **ROLLBACK PLAN**

If refactoring fails at any phase:
1. Revert to last working commit
2. Document failure reason
3. Reassess strategy
4. Create new plan

---

## 📅 **TIMELINE**

- **Week 1**: Extract clock management
- **Week 2**: Extract scores & roster
- **Week 3**: Extract stat recording & substitutions
- **Week 4**: Extract timeouts & automation
- **Week 5**: Final integration & testing

**Total**: 5 weeks (1 phase per week)

---

## 📝 **NOTES**

- **Branch**: `refactor/split-useTracker` (create after Phase 3 merge)
- **Testing**: Manual + automated tests after each phase
- **Review**: Code review after each phase
- **Documentation**: Update docs after final integration

---

**Status**: PLANNED  
**Priority**: HIGH (technical debt)  
**Scheduled**: After Phase 3 merge and testing  
**Owner**: TBD  
**Created**: October 28, 2025  
**Last Updated**: October 28, 2025

