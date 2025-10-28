# 🚀 Dual-Engine Phased Refactor Plan
**Date**: October 28, 2025  
**Purpose**: Safe, incremental implementation with feature flags and zero breaking changes  
**Status**: PHASE 1 READY TO IMPLEMENT

---

## 🎯 CORE PRINCIPLES

### 1. Feature Flags First
```typescript
// All new automation behind flags - default OFF until Phase 5
interface AutomationFlags {
  clock: {
    enabled: boolean;           // Master switch
    autoPause: boolean;         // Auto-pause on whistles
    autoReset: boolean;         // Auto-reset shot clock
    ftMode: boolean;            // Free throw mode
    madeBasketStop: boolean;    // NBA last 2 min rule
  };
  possession: {
    enabled: boolean;           // Master switch
    autoFlip: boolean;          // Auto-flip on events
    persistState: boolean;      // Save to DB
    jumpBallArrow: boolean;     // Alternating possession
  };
  sequences: {
    enabled: boolean;           // Master switch
    promptAssists: boolean;     // Prompt after made shots
    promptRebounds: boolean;    // Prompt after misses
    promptBlocks: boolean;      // Prompt for blocks
    linkEvents: boolean;        // Store linked_event_id
    freeThrowSequence: boolean; // Auto FT sequence
  };
  fouls: {
    enabled: boolean;           // Master switch
    bonusFreeThrows: boolean;   // Auto bonus FTs
    foulOutEnforcement: boolean;// Remove at 6 fouls
    technicalEjection: boolean; // Eject at 2 technicals
  };
  undo: {
    enabled: boolean;           // Master switch
    maxHistorySize: number;     // Command log size
  };
}
```

### 2. Backward Compatibility
- All DB migrations are **additive only**
- New columns have defaults or nullable
- No dropping columns until Phase 5
- Legacy code paths remain until Phase 5

### 3. Incremental Rollout
```yaml
Phase1: Deploy with ALL flags OFF (no behavior change)
Phase2: Enable clock automation for beta tournaments
Phase3: Enable possession automation for beta tournaments  
Phase4: Enable sequences for beta tournaments
Phase5: Default ON for all new tournaments, remove legacy code
```

### 4. Rollback Strategy
- Feature flags can be toggled OFF instantly
- No DB rollback needed (additive migrations)
- Legacy code paths remain functional
- Per-tournament override capability

---

## 📦 PHASE 1: FOUNDATION (40 hours)

### Goals
1. ✅ Ruleset configuration (NBA/FIBA/NCAA/CUSTOM)
2. ✅ Feature flags infrastructure
3. ✅ Event linking schema (additive)
4. ✅ Possession persistence schema (additive)
5. ✅ Engine base classes (no-ops until enabled)
6. ✅ Zero behavior changes (all flags OFF)

---

### 1.1 Database Migrations (Additive Only)

#### Migration: `008_event_linking.sql`
```sql
-- ✅ ADDITIVE: Add event linking columns (nullable, no breaking changes)
ALTER TABLE game_stats 
  ADD COLUMN IF NOT EXISTS sequence_id UUID,
  ADD COLUMN IF NOT EXISTS linked_event_id UUID REFERENCES game_stats(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS event_metadata JSONB DEFAULT '{}'::jsonb;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_stats_sequence_id ON game_stats(sequence_id);
CREATE INDEX IF NOT EXISTS idx_game_stats_linked_event_id ON game_stats(linked_event_id);

-- Comments for documentation
COMMENT ON COLUMN game_stats.sequence_id IS 'Groups related events (e.g., assist + shot)';
COMMENT ON COLUMN game_stats.linked_event_id IS 'Points to primary event (e.g., assist → shot)';
COMMENT ON COLUMN game_stats.event_metadata IS 'Additional context (e.g., FT sequence number, automation flags)';

-- ✅ NO BREAKING CHANGES: Existing queries work unchanged
```

**Test Cases:**
```typescript
describe('Migration 008: Event Linking', () => {
  it('adds columns without breaking existing inserts', async () => {
    // Old insert (no new columns) should still work
    await db.insert('game_stats', {
      game_id: 'test-game',
      player_id: 'test-player',
      team_id: 'test-team',
      stat_type: 'field_goal',
      stat_value: 2,
      modifier: 'made'
    });
    // Should succeed without errors
  });
  
  it('allows new inserts with event linking', async () => {
    const shotId = await db.insert('game_stats', { /* shot */ });
    await db.insert('game_stats', {
      stat_type: 'assist',
      linked_event_id: shotId,
      sequence_id: 'seq-123'
    });
    // Should succeed
  });
});
```

---

#### Migration: `009_possession_tracking.sql`
```sql
-- ✅ ADDITIVE: New table for possession history
CREATE TABLE IF NOT EXISTS game_possessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  start_quarter INT NOT NULL CHECK (start_quarter BETWEEN 1 AND 8),
  start_time_seconds INT NOT NULL CHECK (start_time_seconds >= 0),
  end_quarter INT CHECK (end_quarter BETWEEN 1 AND 8),
  end_time_seconds INT CHECK (end_time_seconds >= 0),
  end_reason TEXT CHECK (end_reason IN (
    'made_shot', 'turnover', 'steal', 'defensive_rebound', 
    'violation', 'foul', 'timeout', 'quarter_end', 'game_end'
  )),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_game_possessions_game_id ON game_possessions(game_id);
CREATE INDEX IF NOT EXISTS idx_game_possessions_team_id ON game_possessions(team_id);

-- RLS Policies (permissive - public read, admin write)
ALTER TABLE game_possessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY game_possessions_public_read ON game_possessions
  FOR SELECT USING (true);

CREATE POLICY game_possessions_admin_write ON game_possessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('stat_admin', 'organizer', 'coach')
    )
  );

-- ✅ NO BREAKING CHANGES: New table, doesn't affect existing functionality
```

**Test Cases:**
```typescript
describe('Migration 009: Possession Tracking', () => {
  it('creates table without affecting existing games', async () => {
    const game = await db.select('games').where({ id: 'existing-game' });
    expect(game).toBeDefined(); // Existing games unaffected
  });
  
  it('allows possession records to be created', async () => {
    await db.insert('game_possessions', {
      game_id: 'test-game',
      team_id: 'team-a',
      start_quarter: 1,
      start_time_seconds: 720
    });
    // Should succeed
  });
  
  it('enforces valid end_reason values', async () => {
    await expect(
      db.insert('game_possessions', {
        game_id: 'test-game',
        team_id: 'team-a',
        start_quarter: 1,
        start_time_seconds: 720,
        end_reason: 'invalid_reason'
      })
    ).rejects.toThrow(); // Should fail CHECK constraint
  });
});
```

---

#### Migration: `010_ruleset_configuration.sql`
```sql
-- ✅ ADDITIVE: Add ruleset columns with defaults
ALTER TABLE tournaments 
  ADD COLUMN IF NOT EXISTS ruleset TEXT DEFAULT 'NBA' 
    CHECK (ruleset IN ('NBA', 'FIBA', 'NCAA', 'CUSTOM')),
  ADD COLUMN IF NOT EXISTS ruleset_config JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS automation_settings JSONB DEFAULT '{
    "clock": {"enabled": false, "autoPause": false, "autoReset": false, "ftMode": false, "madeBasketStop": false},
    "possession": {"enabled": false, "autoFlip": false, "persistState": false, "jumpBallArrow": false},
    "sequences": {"enabled": false, "promptAssists": false, "promptRebounds": false, "promptBlocks": false, "linkEvents": false, "freeThrowSequence": false},
    "fouls": {"enabled": false, "bonusFreeThrows": false, "foulOutEnforcement": false, "technicalEjection": false},
    "undo": {"enabled": false, "maxHistorySize": 50}
  }'::jsonb;

-- Add possession tracking to games (nullable, no breaking changes)
ALTER TABLE games 
  ADD COLUMN IF NOT EXISTS possession_arrow UUID REFERENCES teams(id),
  ADD COLUMN IF NOT EXISTS current_possession UUID REFERENCES teams(id);

-- Comments
COMMENT ON COLUMN tournaments.ruleset IS 'NBA, FIBA, NCAA, or CUSTOM';
COMMENT ON COLUMN tournaments.ruleset_config IS 'Custom ruleset overrides (for CUSTOM ruleset)';
COMMENT ON COLUMN tournaments.automation_settings IS 'Feature flags for automation (all default OFF)';
COMMENT ON COLUMN games.possession_arrow IS 'Team that gets next jump ball (alternating possession)';
COMMENT ON COLUMN games.current_possession IS 'Team currently in possession';

-- ✅ NO BREAKING CHANGES: Defaults ensure existing tournaments work unchanged
```

**Test Cases:**
```typescript
describe('Migration 010: Ruleset Configuration', () => {
  it('adds columns with safe defaults', async () => {
    const tournament = await db.select('tournaments').where({ id: 'existing' });
    expect(tournament.ruleset).toBe('NBA'); // Default
    expect(tournament.automation_settings.clock.enabled).toBe(false); // Default OFF
  });
  
  it('allows custom ruleset configuration', async () => {
    await db.update('tournaments', { id: 'test' }, {
      ruleset: 'CUSTOM',
      ruleset_config: {
        quarterLengthMinutes: 15,
        shotClockSeconds: 30
      }
    });
    // Should succeed
  });
  
  it('enforces valid ruleset values', async () => {
    await expect(
      db.update('tournaments', { id: 'test' }, { ruleset: 'INVALID' })
    ).rejects.toThrow(); // Should fail CHECK constraint
  });
});
```

---

### 1.2 TypeScript Types & Interfaces

#### File: `src/lib/types/automation.ts` (NEW)
```typescript
/**
 * Feature Flags for Dual-Engine Automation
 * 
 * All flags default to FALSE until Phase 5.
 * Per-tournament override via tournaments.automation_settings.
 */

export interface ClockAutomationFlags {
  enabled: boolean;           // Master switch
  autoPause: boolean;         // Auto-pause on whistles (fouls, violations)
  autoReset: boolean;         // Auto-reset shot clock on events
  ftMode: boolean;            // Free throw mode (shot clock off)
  madeBasketStop: boolean;    // NBA last 2 min clock stop rule
}

export interface PossessionAutomationFlags {
  enabled: boolean;           // Master switch
  autoFlip: boolean;          // Auto-flip on made shots, turnovers, etc.
  persistState: boolean;      // Save possession changes to DB
  jumpBallArrow: boolean;     // Track alternating possession arrow
}

export interface SequenceAutomationFlags {
  enabled: boolean;           // Master switch
  promptAssists: boolean;     // Prompt "Was there an assist?" after made shot
  promptRebounds: boolean;    // Prompt "Who got the rebound?" after miss
  promptBlocks: boolean;      // Prompt "Was it blocked?" after miss
  linkEvents: boolean;        // Store sequence_id and linked_event_id
  freeThrowSequence: boolean; // Auto FT sequence after shooting foul
}

export interface FoulAutomationFlags {
  enabled: boolean;           // Master switch
  bonusFreeThrows: boolean;   // Auto award bonus FTs (team fouls >= 5)
  foulOutEnforcement: boolean;// Auto-remove player at foul limit
  technicalEjection: boolean; // Auto-eject at 2 technical fouls
}

export interface UndoAutomationFlags {
  enabled: boolean;           // Master switch
  maxHistorySize: number;     // Command log size (default: 50)
}

export interface AutomationFlags {
  clock: ClockAutomationFlags;
  possession: PossessionAutomationFlags;
  sequences: SequenceAutomationFlags;
  fouls: FoulAutomationFlags;
  undo: UndoAutomationFlags;
}

export const DEFAULT_AUTOMATION_FLAGS: AutomationFlags = {
  clock: {
    enabled: false,
    autoPause: false,
    autoReset: false,
    ftMode: false,
    madeBasketStop: false
  },
  possession: {
    enabled: false,
    autoFlip: false,
    persistState: false,
    jumpBallArrow: false
  },
  sequences: {
    enabled: false,
    promptAssists: false,
    promptRebounds: false,
    promptBlocks: false,
    linkEvents: false,
    freeThrowSequence: false
  },
  fouls: {
    enabled: false,
    bonusFreeThrows: false,
    foulOutEnforcement: false,
    technicalEjection: false
  },
  undo: {
    enabled: false,
    maxHistorySize: 50
  }
};
```

**Test Cases:**
```typescript
describe('AutomationFlags', () => {
  it('defaults all flags to false', () => {
    const flags = DEFAULT_AUTOMATION_FLAGS;
    expect(flags.clock.enabled).toBe(false);
    expect(flags.possession.enabled).toBe(false);
    expect(flags.sequences.enabled).toBe(false);
    expect(flags.fouls.enabled).toBe(false);
    expect(flags.undo.enabled).toBe(false);
  });
  
  it('allows selective enablement', () => {
    const flags: AutomationFlags = {
      ...DEFAULT_AUTOMATION_FLAGS,
      clock: { ...DEFAULT_AUTOMATION_FLAGS.clock, enabled: true, autoPause: true }
    };
    expect(flags.clock.enabled).toBe(true);
    expect(flags.possession.enabled).toBe(false); // Others still off
  });
});
```

---

#### File: `src/lib/types/ruleset.ts` (NEW)
```typescript
/**
 * Ruleset Configuration for NBA/FIBA/NCAA/CUSTOM
 * 
 * Defines all game rules (clock, shot clock, timeouts, fouls).
 * Loaded at game start, drives all engine behavior.
 */

export type RulesetId = 'NBA' | 'FIBA' | 'NCAA' | 'CUSTOM';

export interface ShotClockRules {
  fullReset: number;                    // 24, 30, or 35 seconds
  offensiveReboundReset: number | 'keep'; // 14 for NBA, 'keep' for FIBA
  frontcourtFoulReset: number;          // 14 for NBA, 24 for FIBA
  backcourtFoulReset: number;           // 24 for all
  outOfBoundsRule: 'keep' | 'reset_if_above_14'; // NBA resets if >14s
  disableOnFreeThrows: boolean;         // true for all
}

export interface TimeoutRules {
  fullTimeouts: number;                 // Per team per game
  shortTimeouts: number;                // 30-second timeouts
  fullDurationSeconds: number;          // 60 or 75
  shortDurationSeconds: number;         // 20 or 30
  maxPerHalf: number;                   // NCAA: 4 per half
  maxInLastTwoMinutes: number;          // NBA: 3 in Q4 last 2 min
}

export interface FoulRules {
  personalFoulLimit: number;            // 6 for NBA, 5 for FIBA
  technicalFoulEjection: number;        // 2 for all
  teamFoulBonus: number;                // 5 for NBA, 4 for FIBA
  teamFoulDoubleBonus: number | null;   // 10 for NBA, null for FIBA
  bonusFreeThrows: '1-and-1' | 'double'; // NBA: 1-and-1 then double, FIBA: always double
}

export interface ClockRules {
  quarterLengthMinutes: number;         // 12 for NBA, 10 for FIBA, 20 for NCAA (halves)
  periodsPerGame: number;               // 4 for NBA/FIBA, 2 for NCAA
  overtimeLengthMinutes: number;        // 5 for NBA/FIBA, 5 for NCAA
  clockStopsOnMadeBasket: boolean | 'last_2_minutes'; // NBA: last 2 min only
}

export interface Ruleset {
  id: RulesetId;
  name: string;
  clockRules: ClockRules;
  shotClockRules: ShotClockRules;
  timeoutRules: TimeoutRules;
  foulRules: FoulRules;
}

// ✅ NBA Ruleset (Default)
export const NBA_RULESET: Ruleset = {
  id: 'NBA',
  name: 'NBA Official Rules',
  clockRules: {
    quarterLengthMinutes: 12,
    periodsPerGame: 4,
    overtimeLengthMinutes: 5,
    clockStopsOnMadeBasket: 'last_2_minutes'
  },
  shotClockRules: {
    fullReset: 24,
    offensiveReboundReset: 14,
    frontcourtFoulReset: 14,
    backcourtFoulReset: 24,
    outOfBoundsRule: 'reset_if_above_14',
    disableOnFreeThrows: true
  },
  timeoutRules: {
    fullTimeouts: 7,
    shortTimeouts: 0,
    fullDurationSeconds: 75,
    shortDurationSeconds: 0,
    maxPerHalf: 4,
    maxInLastTwoMinutes: 3
  },
  foulRules: {
    personalFoulLimit: 6,
    technicalFoulEjection: 2,
    teamFoulBonus: 5,
    teamFoulDoubleBonus: 10,
    bonusFreeThrows: '1-and-1'
  }
};

// ✅ FIBA Ruleset
export const FIBA_RULESET: Ruleset = {
  id: 'FIBA',
  name: 'FIBA International Rules',
  clockRules: {
    quarterLengthMinutes: 10,
    periodsPerGame: 4,
    overtimeLengthMinutes: 5,
    clockStopsOnMadeBasket: false
  },
  shotClockRules: {
    fullReset: 24,
    offensiveReboundReset: 'keep', // FIBA doesn't reset on offensive rebound
    frontcourtFoulReset: 24,
    backcourtFoulReset: 24,
    outOfBoundsRule: 'keep',
    disableOnFreeThrows: true
  },
  timeoutRules: {
    fullTimeouts: 5,
    shortTimeouts: 0,
    fullDurationSeconds: 60,
    shortDurationSeconds: 0,
    maxPerHalf: 2,
    maxInLastTwoMinutes: 2
  },
  foulRules: {
    personalFoulLimit: 5,
    technicalFoulEjection: 2,
    teamFoulBonus: 4,
    teamFoulDoubleBonus: null,
    bonusFreeThrows: 'double'
  }
};

// ✅ NCAA Ruleset
export const NCAA_RULESET: Ruleset = {
  id: 'NCAA',
  name: 'NCAA College Rules',
  clockRules: {
    quarterLengthMinutes: 20, // 2 halves of 20 minutes
    periodsPerGame: 2,
    overtimeLengthMinutes: 5,
    clockStopsOnMadeBasket: 'last_2_minutes'
  },
  shotClockRules: {
    fullReset: 30,
    offensiveReboundReset: 20,
    frontcourtFoulReset: 20,
    backcourtFoulReset: 30,
    outOfBoundsRule: 'reset_if_above_14',
    disableOnFreeThrows: true
  },
  timeoutRules: {
    fullTimeouts: 4,
    shortTimeouts: 0,
    fullDurationSeconds: 60,
    shortDurationSeconds: 30,
    maxPerHalf: 4,
    maxInLastTwoMinutes: 2
  },
  foulRules: {
    personalFoulLimit: 5,
    technicalFoulEjection: 2,
    teamFoulBonus: 7,
    teamFoulDoubleBonus: 10,
    bonusFreeThrows: '1-and-1'
  }
};

export const RULESETS: Record<RulesetId, Ruleset> = {
  NBA: NBA_RULESET,
  FIBA: FIBA_RULESET,
  NCAA: NCAA_RULESET,
  CUSTOM: NBA_RULESET // Default to NBA for custom, user can override
};
```

**Test Cases:**
```typescript
describe('Rulesets', () => {
  it('NBA ruleset has correct values', () => {
    const nba = NBA_RULESET;
    expect(nba.clockRules.quarterLengthMinutes).toBe(12);
    expect(nba.shotClockRules.fullReset).toBe(24);
    expect(nba.shotClockRules.offensiveReboundReset).toBe(14);
    expect(nba.foulRules.personalFoulLimit).toBe(6);
    expect(nba.foulRules.teamFoulBonus).toBe(5);
  });
  
  it('FIBA ruleset has correct values', () => {
    const fiba = FIBA_RULESET;
    expect(fiba.clockRules.quarterLengthMinutes).toBe(10);
    expect(fiba.shotClockRules.offensiveReboundReset).toBe('keep');
    expect(fiba.foulRules.personalFoulLimit).toBe(5);
    expect(fiba.foulRules.teamFoulBonus).toBe(4);
  });
  
  it('NCAA ruleset has correct values', () => {
    const ncaa = NCAA_RULESET;
    expect(ncaa.clockRules.quarterLengthMinutes).toBe(20);
    expect(ncaa.clockRules.periodsPerGame).toBe(2); // Halves
    expect(ncaa.shotClockRules.fullReset).toBe(30);
    expect(ncaa.shotClockRules.offensiveReboundReset).toBe(20);
  });
});
```

---

### 1.3 Ruleset Service (Pure Functions)

#### File: `src/lib/config/rulesetService.ts` (NEW)
```typescript
/**
 * RulesetService - Pure Functions for Ruleset Management
 * 
 * Loads rulesets from tournaments, applies custom overrides.
 * No side effects, no DB calls (those happen in caller).
 */

import { Ruleset, RulesetId, RULESETS } from '@/lib/types/ruleset';

export class RulesetService {
  /**
   * Get ruleset by ID
   * @param rulesetId - NBA, FIBA, NCAA, or CUSTOM
   * @returns Ruleset configuration
   */
  static getRuleset(rulesetId: RulesetId): Ruleset {
    return RULESETS[rulesetId] || RULESETS.NBA; // Default to NBA
  }
  
  /**
   * Apply custom overrides to a ruleset
   * @param baseRuleset - Base ruleset (NBA, FIBA, NCAA)
   * @param overrides - Custom overrides (from tournaments.ruleset_config)
   * @returns Merged ruleset
   */
  static applyCustomOverrides(
    baseRuleset: Ruleset,
    overrides: Partial<Ruleset>
  ): Ruleset {
    return {
      ...baseRuleset,
      id: 'CUSTOM',
      name: 'Custom Rules',
      clockRules: { ...baseRuleset.clockRules, ...overrides.clockRules },
      shotClockRules: { ...baseRuleset.shotClockRules, ...overrides.shotClockRules },
      timeoutRules: { ...baseRuleset.timeoutRules, ...overrides.timeoutRules },
      foulRules: { ...baseRuleset.foulRules, ...overrides.foulRules }
    };
  }
  
  /**
   * Validate ruleset configuration
   * @param ruleset - Ruleset to validate
   * @returns Validation result
   */
  static validateRuleset(ruleset: Ruleset): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Clock validation
    if (ruleset.clockRules.quarterLengthMinutes < 1 || ruleset.clockRules.quarterLengthMinutes > 30) {
      errors.push('Quarter length must be between 1 and 30 minutes');
    }
    
    // Shot clock validation
    if (ruleset.shotClockRules.fullReset < 10 || ruleset.shotClockRules.fullReset > 35) {
      errors.push('Shot clock must be between 10 and 35 seconds');
    }
    
    // Foul validation
    if (ruleset.foulRules.personalFoulLimit < 3 || ruleset.foulRules.personalFoulLimit > 10) {
      errors.push('Personal foul limit must be between 3 and 10');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}
```

**Test Cases:**
```typescript
describe('RulesetService', () => {
  describe('getRuleset', () => {
    it('returns NBA ruleset', () => {
      const ruleset = RulesetService.getRuleset('NBA');
      expect(ruleset.id).toBe('NBA');
      expect(ruleset.shotClockRules.fullReset).toBe(24);
    });
    
    it('returns FIBA ruleset', () => {
      const ruleset = RulesetService.getRuleset('FIBA');
      expect(ruleset.id).toBe('FIBA');
      expect(ruleset.clockRules.quarterLengthMinutes).toBe(10);
    });
    
    it('defaults to NBA for invalid ID', () => {
      const ruleset = RulesetService.getRuleset('INVALID' as RulesetId);
      expect(ruleset.id).toBe('NBA');
    });
  });
  
  describe('applyCustomOverrides', () => {
    it('merges custom overrides with base ruleset', () => {
      const base = RulesetService.getRuleset('NBA');
      const custom = RulesetService.applyCustomOverrides(base, {
        clockRules: { quarterLengthMinutes: 15 },
        shotClockRules: { fullReset: 30 }
      });
      
      expect(custom.id).toBe('CUSTOM');
      expect(custom.clockRules.quarterLengthMinutes).toBe(15);
      expect(custom.shotClockRules.fullReset).toBe(30);
      expect(custom.foulRules.personalFoulLimit).toBe(6); // Unchanged
    });
  });
  
  describe('validateRuleset', () => {
    it('validates correct ruleset', () => {
      const ruleset = RulesetService.getRuleset('NBA');
      const result = RulesetService.validateRuleset(ruleset);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('rejects invalid quarter length', () => {
      const ruleset = {
        ...RulesetService.getRuleset('NBA'),
        clockRules: { ...RulesetService.getRuleset('NBA').clockRules, quarterLengthMinutes: 100 }
      };
      const result = RulesetService.validateRuleset(ruleset);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Quarter length must be between 1 and 30 minutes');
    });
  });
});
```

---

### 1.4 Engine Base Classes (No-Ops Until Enabled)

#### File: `src/lib/engines/clockEngine.ts` (NEW)
```typescript
/**
 * ClockEngine - Game Clock & Shot Clock Automation
 * 
 * Phase 1: Stub implementation (no-op, returns no changes)
 * Phase 2: Full implementation with auto-pause, auto-reset, FT mode
 * 
 * All behavior gated by automation flags.
 */

import { Ruleset } from '@/lib/types/ruleset';
import { AutomationFlags } from '@/lib/types/automation';
import { StatRecord } from '@/lib/types/tracker';

export interface ClockStateDelta {
  gameClock: {
    shouldPause: boolean;
    shouldResume: boolean;
    reason?: string;
  };
  shotClock: {
    shouldPause: boolean;
    shouldReset: boolean;
    resetTo?: number;
    shouldDisable: boolean; // For FT mode
    reason?: string;
  };
}

export interface GameContext {
  quarter: number;
  gameClockSecondsRemaining: number;
  shotClockSecondsRemaining: number;
  scores: { teamA: number; teamB: number };
  teamInPossession: string;
  ruleset: Ruleset;
  automationFlags: AutomationFlags;
}

export class ClockEngine {
  /**
   * Apply event to determine clock behavior
   * 
   * Phase 1: Returns no-op (no changes)
   * Phase 2: Implements auto-pause, auto-reset, FT mode
   * 
   * @param event - Game event (stat, substitution, timeout, etc.)
   * @param context - Current game context
   * @returns Clock state delta (what should change)
   */
  static applyEvent(
    event: StatRecord,
    context: GameContext
  ): ClockStateDelta {
    // ✅ PHASE 1: No-op if automation disabled
    if (!context.automationFlags.clock.enabled) {
      return {
        gameClock: { shouldPause: false, shouldResume: false },
        shotClock: { shouldPause: false, shouldReset: false, shouldDisable: false }
      };
    }
    
    // 🚧 PHASE 2: Implement automation logic here
    // For now, return no-op
    return {
      gameClock: { shouldPause: false, shouldResume: false },
      shotClock: { shouldPause: false, shouldReset: false, shouldDisable: false }
    };
  }
  
  /**
   * Determine if clock should stop on made basket
   * NBA: Last 2 minutes of Q4/OT only
   * FIBA: Never
   * NCAA: Last minute only
   */
  static shouldStopOnMadeBasket(context: GameContext): boolean {
    if (!context.automationFlags.clock.enabled || !context.automationFlags.clock.madeBasketStop) {
      return false;
    }
    
    // ✅ PHASE 1: No-op
    // 🚧 PHASE 2: Implement ruleset-specific logic
    return false;
  }
}
```

**Test Cases:**
```typescript
describe('ClockEngine (Phase 1)', () => {
  const mockContext: GameContext = {
    quarter: 1,
    gameClockSecondsRemaining: 720,
    shotClockSecondsRemaining: 24,
    scores: { teamA: 0, teamB: 0 },
    teamInPossession: 'team-a',
    ruleset: NBA_RULESET,
    automationFlags: DEFAULT_AUTOMATION_FLAGS // All disabled
  };
  
  it('returns no-op when automation disabled', () => {
    const event: StatRecord = {
      gameId: 'test',
      teamId: 'team-a',
      playerId: 'player-1',
      statType: 'field_goal',
      modifier: 'made'
    };
    
    const delta = ClockEngine.applyEvent(event, mockContext);
    
    expect(delta.gameClock.shouldPause).toBe(false);
    expect(delta.shotClock.shouldReset).toBe(false);
  });
  
  it('returns no-op for made basket clock stop', () => {
    const shouldStop = ClockEngine.shouldStopOnMadeBasket(mockContext);
    expect(shouldStop).toBe(false);
  });
});
```

---

#### File: `src/lib/engines/playEngine.ts` (NEW)
```typescript
/**
 * PlayEngine - Event Sequences & Linking
 * 
 * Phase 1: Stub implementation (no prompts, no linking)
 * Phase 4: Full implementation with assist/rebound/block prompts
 * 
 * All behavior gated by automation flags.
 */

import { AutomationFlags } from '@/lib/types/automation';
import { StatRecord } from '@/lib/types/tracker';

export interface EventLink {
  sequence_id: string;
  linked_event_id: string;
  link_type: 'assist' | 'rebound' | 'steal_turnover' | 'block';
}

export class PlayEngine {
  /**
   * Check if we should prompt for an assist after a made shot
   * 
   * Phase 1: Returns false (no prompts)
   * Phase 4: Returns true if made shot and no recent assist
   */
  static shouldPromptAssist(
    event: StatRecord,
    recentEvents: StatRecord[],
    automationFlags: AutomationFlags
  ): boolean {
    // ✅ PHASE 1: No-op if automation disabled
    if (!automationFlags.sequences.enabled || !automationFlags.sequences.promptAssists) {
      return false;
    }
    
    // 🚧 PHASE 4: Implement prompt logic
    return false;
  }
  
  /**
   * Check if we should prompt for a rebound after a missed shot
   * 
   * Phase 1: Returns false (no prompts)
   * Phase 4: Returns true if missed shot and no recent rebound
   */
  static shouldPromptRebound(
    event: StatRecord,
    recentEvents: StatRecord[],
    automationFlags: AutomationFlags
  ): boolean {
    // ✅ PHASE 1: No-op if automation disabled
    if (!automationFlags.sequences.enabled || !automationFlags.sequences.promptRebounds) {
      return false;
    }
    
    // 🚧 PHASE 4: Implement prompt logic
    return false;
  }
  
  /**
   * Link two events together (e.g., assist → shot)
   * 
   * Phase 1: Returns null (no linking)
   * Phase 4: Generates sequence_id and linked_event_id
   */
  static linkEvents(
    primaryEvent: StatRecord,
    linkedEvent: StatRecord,
    linkType: 'assist' | 'rebound' | 'steal_turnover' | 'block',
    automationFlags: AutomationFlags
  ): EventLink | null {
    // ✅ PHASE 1: No-op if automation disabled
    if (!automationFlags.sequences.enabled || !automationFlags.sequences.linkEvents) {
      return null;
    }
    
    // 🚧 PHASE 4: Implement linking logic
    return null;
  }
}
```

**Test Cases:**
```typescript
describe('PlayEngine (Phase 1)', () => {
  const mockFlags = DEFAULT_AUTOMATION_FLAGS; // All disabled
  
  it('returns false for assist prompt when disabled', () => {
    const event: StatRecord = {
      gameId: 'test',
      teamId: 'team-a',
      playerId: 'player-1',
      statType: 'field_goal',
      modifier: 'made'
    };
    
    const shouldPrompt = PlayEngine.shouldPromptAssist(event, [], mockFlags);
    expect(shouldPrompt).toBe(false);
  });
  
  it('returns false for rebound prompt when disabled', () => {
    const event: StatRecord = {
      gameId: 'test',
      teamId: 'team-a',
      playerId: 'player-1',
      statType: 'field_goal',
      modifier: 'missed'
    };
    
    const shouldPrompt = PlayEngine.shouldPromptRebound(event, [], mockFlags);
    expect(shouldPrompt).toBe(false);
  });
  
  it('returns null for event linking when disabled', () => {
    const shot: StatRecord = { /* ... */ };
    const assist: StatRecord = { /* ... */ };
    
    const link = PlayEngine.linkEvents(shot, assist, 'assist', mockFlags);
    expect(link).toBeNull();
  });
});
```

---

#### File: `src/lib/engines/possessionEngine.ts` (NEW)
```typescript
/**
 * PossessionEngine - Possession Tracking & Auto-Flip
 * 
 * Phase 1: Stub implementation (no auto-flip)
 * Phase 3: Full implementation with auto-flip and persistence
 * 
 * All behavior gated by automation flags.
 */

import { AutomationFlags } from '@/lib/types/automation';
import { StatRecord } from '@/lib/types/tracker';

export interface PossessionDelta {
  newPossession: string | null; // null = no change
  reason: string;
  shouldPersist: boolean;
}

export class PossessionEngine {
  /**
   * Determine if possession should flip based on event
   * 
   * Phase 1: Returns null (no auto-flip)
   * Phase 3: Returns new possession if event triggers flip
   */
  static applyEvent(
    event: StatRecord,
    currentPossession: string,
    teamAId: string,
    teamBId: string,
    automationFlags: AutomationFlags
  ): PossessionDelta {
    // ✅ PHASE 1: No-op if automation disabled
    if (!automationFlags.possession.enabled || !automationFlags.possession.autoFlip) {
      return {
        newPossession: null,
        reason: 'automation_disabled',
        shouldPersist: false
      };
    }
    
    // 🚧 PHASE 3: Implement auto-flip logic
    return {
      newPossession: null,
      reason: 'no_change',
      shouldPersist: false
    };
  }
  
  /**
   * Handle jump ball (alternating possession)
   * 
   * Phase 1: Returns null (no arrow tracking)
   * Phase 3: Returns possession based on arrow, flips arrow
   */
  static handleJumpBall(
    currentArrow: string,
    teamAId: string,
    teamBId: string,
    automationFlags: AutomationFlags
  ): { possession: string; newArrow: string } | null {
    // ✅ PHASE 1: No-op if automation disabled
    if (!automationFlags.possession.enabled || !automationFlags.possession.jumpBallArrow) {
      return null;
    }
    
    // 🚧 PHASE 3: Implement arrow logic
    return null;
  }
}
```

**Test Cases:**
```typescript
describe('PossessionEngine (Phase 1)', () => {
  const mockFlags = DEFAULT_AUTOMATION_FLAGS; // All disabled
  
  it('returns no change when automation disabled', () => {
    const event: StatRecord = {
      gameId: 'test',
      teamId: 'team-a',
      playerId: 'player-1',
      statType: 'field_goal',
      modifier: 'made'
    };
    
    const delta = PossessionEngine.applyEvent(
      event,
      'team-a',
      'team-a',
      'team-b',
      mockFlags
    );
    
    expect(delta.newPossession).toBeNull();
    expect(delta.shouldPersist).toBe(false);
  });
  
  it('returns null for jump ball when disabled', () => {
    const result = PossessionEngine.handleJumpBall(
      'team-a',
      'team-a',
      'team-b',
      mockFlags
    );
    
    expect(result).toBeNull();
  });
});
```

---

#### File: `src/lib/engines/commandEngine.ts` (NEW)
```typescript
/**
 * CommandEngine - Undo/Redo System
 * 
 * Phase 1: Stub implementation (no undo/redo)
 * Phase 5: Full implementation with command log and snapshots
 * 
 * All behavior gated by automation flags.
 */

import { AutomationFlags } from '@/lib/types/automation';

export interface Command {
  id: string;
  type: 'RECORD_STAT' | 'SUBSTITUTION' | 'TIMEOUT' | 'CLOCK_CHANGE';
  payload: any;
  preSnapshot: any; // Game state before command
  postSnapshot: any; // Game state after command
  timestamp: string;
}

export interface CommandResult {
  success: boolean;
  newSnapshot: any;
  error?: string;
}

export class CommandEngine {
  private commandLog: Command[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 50;
  
  constructor(automationFlags: AutomationFlags) {
    this.maxHistorySize = automationFlags.undo.maxHistorySize;
  }
  
  /**
   * Execute a command
   * 
   * Phase 1: No-op (just executes, no logging)
   * Phase 5: Logs command with snapshots
   */
  execute(command: Command, automationFlags: AutomationFlags): CommandResult {
    // ✅ PHASE 1: No-op if automation disabled
    if (!automationFlags.undo.enabled) {
      return {
        success: true,
        newSnapshot: command.postSnapshot
      };
    }
    
    // 🚧 PHASE 5: Implement command logging
    return {
      success: true,
      newSnapshot: command.postSnapshot
    };
  }
  
  /**
   * Undo last command
   * 
   * Phase 1: Returns error (not implemented)
   * Phase 5: Reverts to preSnapshot
   */
  undo(automationFlags: AutomationFlags): CommandResult {
    // ✅ PHASE 1: No-op if automation disabled
    if (!automationFlags.undo.enabled) {
      return {
        success: false,
        newSnapshot: null,
        error: 'Undo not enabled'
      };
    }
    
    // 🚧 PHASE 5: Implement undo logic
    return {
      success: false,
      newSnapshot: null,
      error: 'Not implemented yet'
    };
  }
  
  /**
   * Redo previously undone command
   * 
   * Phase 1: Returns error (not implemented)
   * Phase 5: Re-applies postSnapshot
   */
  redo(automationFlags: AutomationFlags): CommandResult {
    // ✅ PHASE 1: No-op if automation disabled
    if (!automationFlags.undo.enabled) {
      return {
        success: false,
        newSnapshot: null,
        error: 'Redo not enabled'
      };
    }
    
    // 🚧 PHASE 5: Implement redo logic
    return {
      success: false,
      newSnapshot: null,
      error: 'Not implemented yet'
    };
  }
}
```

**Test Cases:**
```typescript
describe('CommandEngine (Phase 1)', () => {
  const mockFlags = DEFAULT_AUTOMATION_FLAGS; // All disabled
  const engine = new CommandEngine(mockFlags);
  
  it('executes command without logging when disabled', () => {
    const command: Command = {
      id: 'cmd-1',
      type: 'RECORD_STAT',
      payload: { /* ... */ },
      preSnapshot: { /* ... */ },
      postSnapshot: { /* ... */ },
      timestamp: new Date().toISOString()
    };
    
    const result = engine.execute(command, mockFlags);
    expect(result.success).toBe(true);
  });
  
  it('returns error for undo when disabled', () => {
    const result = engine.undo(mockFlags);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Undo not enabled');
  });
  
  it('returns error for redo when disabled', () => {
    const result = engine.redo(mockFlags);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Redo not enabled');
  });
});
```

---

### 1.5 Integration with useTracker Hook

#### File: `src/hooks/useTracker.ts` (MODIFY)

**Changes:**
1. Load ruleset from tournament
2. Load automation flags from tournament
3. Pass flags to engine functions (but engines return no-ops in Phase 1)
4. No behavior changes (all flags OFF by default)

```typescript
// Add imports at top
import { RulesetService } from '@/lib/config/rulesetService';
import { Ruleset } from '@/lib/types/ruleset';
import { AutomationFlags, DEFAULT_AUTOMATION_FLAGS } from '@/lib/types/automation';
import { ClockEngine } from '@/lib/engines/clockEngine';
import { PlayEngine } from '@/lib/engines/playEngine';
import { PossessionEngine } from '@/lib/engines/possessionEngine';
import { CommandEngine } from '@/lib/engines/commandEngine';

// Add to UseTrackerReturn interface (around line 10)
export interface UseTrackerReturn {
  // ... existing properties ...
  
  // NEW: Ruleset and automation flags
  ruleset: Ruleset;
  automationFlags: AutomationFlags;
}

// Add state variables (around line 70)
const [ruleset, setRuleset] = useState<Ruleset>(RulesetService.getRuleset('NBA'));
const [automationFlags, setAutomationFlags] = useState<AutomationFlags>(DEFAULT_AUTOMATION_FLAGS);

// Load ruleset and flags on game initialization (around line 115)
useEffect(() => {
  const initializeGameState = async () => {
    try {
      setIsLoading(true);
      
      // ... existing game loading code ...
      
      // ✅ NEW: Load ruleset from tournament
      if (game.tournament_id) {
        const { data: tournament } = await supabase
          .from('tournaments')
          .select('ruleset, ruleset_config, automation_settings')
          .eq('id', game.tournament_id)
          .single();
        
        if (tournament) {
          // Load base ruleset
          const baseRuleset = RulesetService.getRuleset(tournament.ruleset || 'NBA');
          
          // Apply custom overrides if CUSTOM ruleset
          const finalRuleset = tournament.ruleset === 'CUSTOM' && tournament.ruleset_config
            ? RulesetService.applyCustomOverrides(baseRuleset, tournament.ruleset_config)
            : baseRuleset;
          
          setRuleset(finalRuleset);
          
          // Load automation flags (default to all OFF)
          setAutomationFlags(tournament.automation_settings || DEFAULT_AUTOMATION_FLAGS);
          
          console.log('✅ Ruleset loaded:', finalRuleset.id);
          console.log('✅ Automation flags loaded:', tournament.automation_settings);
        }
      }
      
      // ... rest of initialization ...
      
    } catch (error) {
      console.error('Error initializing game state:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  initializeGameState();
}, [gameId, teamAId, teamBId]);

// Integrate engines into recordStat (around line 626)
const recordStat = useCallback(async (stat: Omit<StatRecord, 'createdAt' | 'quarter' | 'gameTimeSeconds'>) => {
  try {
    // ... existing stat recording code ...
    
    // ✅ NEW: Apply clock engine (no-op in Phase 1)
    const clockDelta = ClockEngine.applyEvent(
      fullStat,
      {
        quarter,
        gameClockSecondsRemaining: clock.secondsRemaining,
        shotClockSecondsRemaining: shotClock.secondsRemaining,
        scores: { teamA: scores[teamAId] || 0, teamB: scores[teamBId] || 0 },
        teamInPossession: currentPossession,
        ruleset,
        automationFlags
      }
    );
    
    // Apply clock changes (if any)
    if (clockDelta.gameClock.shouldPause) {
      stopClock();
    }
    if (clockDelta.shotClock.shouldReset) {
      resetShotClock(clockDelta.shotClock.resetTo || 24);
    }
    
    // ✅ NEW: Check for play sequences (no-op in Phase 1)
    const shouldPromptAssist = PlayEngine.shouldPromptAssist(
      fullStat,
      recentEvents,
      automationFlags
    );
    
    // ✅ NEW: Check for possession flip (no-op in Phase 1)
    const possessionDelta = PossessionEngine.applyEvent(
      fullStat,
      currentPossession,
      teamAId,
      teamBId,
      automationFlags
    );
    
    // ... rest of recordStat ...
    
  } catch (error) {
    console.error('Error recording stat:', error);
  }
}, [/* ... dependencies ... */, ruleset, automationFlags]);

// Return ruleset and flags (around line 853)
return {
  // ... existing returns ...
  ruleset,
  automationFlags
};
```

**Test Cases:**
```typescript
describe('useTracker (Phase 1 Integration)', () => {
  it('loads NBA ruleset by default', async () => {
    const { result } = renderHook(() => useTracker({
      initialGameId: 'test-game',
      teamAId: 'team-a',
      teamBId: 'team-b'
    }));
    
    await waitFor(() => {
      expect(result.current.ruleset.id).toBe('NBA');
    });
  });
  
  it('loads automation flags as all disabled', async () => {
    const { result } = renderHook(() => useTracker({ /* ... */ }));
    
    await waitFor(() => {
      expect(result.current.automationFlags.clock.enabled).toBe(false);
      expect(result.current.automationFlags.possession.enabled).toBe(false);
      expect(result.current.automationFlags.sequences.enabled).toBe(false);
    });
  });
  
  it('calls engine functions but gets no-ops', async () => {
    const { result } = renderHook(() => useTracker({ /* ... */ }));
    
    // Record a stat
    await act(async () => {
      await result.current.recordStat({
        gameId: 'test',
        teamId: 'team-a',
        playerId: 'player-1',
        statType: 'field_goal',
        modifier: 'made'
      });
    });
    
    // Clock should NOT have changed (engines return no-ops)
    expect(result.current.clock.isRunning).toBe(/* unchanged */);
  });
});
```

---

### 1.6 UI: Ruleset Selector in Tournament Creation

#### File: `src/app/dashboard/create-tournament/page.tsx` (MODIFY)

**Add ruleset selector dropdown:**

```typescript
// Add import
import { RULESETS } from '@/lib/types/ruleset';

// Add to form state (around line 50)
const [ruleset, setRuleset] = useState<'NBA' | 'FIBA' | 'NCAA' | 'CUSTOM'>('NBA');

// Add to form JSX (around line 200, after tournament type selection)
<div className="space-y-2">
  <Label htmlFor="ruleset">Game Rules</Label>
  <Select value={ruleset} onValueChange={(value: any) => setRuleset(value)}>
    <SelectTrigger>
      <SelectValue placeholder="Select ruleset" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="NBA">
        <div className="flex flex-col">
          <span className="font-semibold">NBA</span>
          <span className="text-xs text-gray-500">12 min quarters, 24s shot clock</span>
        </div>
      </SelectItem>
      <SelectItem value="FIBA">
        <div className="flex flex-col">
          <span className="font-semibold">FIBA</span>
          <span className="text-xs text-gray-500">10 min quarters, 24s shot clock</span>
        </div>
      </SelectItem>
      <SelectItem value="NCAA">
        <div className="flex flex-col">
          <span className="font-semibold">NCAA</span>
          <span className="text-xs text-gray-500">20 min halves, 30s shot clock</span>
        </div>
      </SelectItem>
      <SelectItem value="CUSTOM">
        <div className="flex flex-col">
          <span className="font-semibold">Custom</span>
          <span className="text-xs text-gray-500">Configure your own rules</span>
        </div>
      </SelectItem>
    </SelectContent>
  </Select>
</div>

// Add to tournament creation payload (around line 300)
const tournamentData = {
  // ... existing fields ...
  ruleset: ruleset,
  automation_settings: DEFAULT_AUTOMATION_FLAGS // All OFF by default
};
```

**Test Cases:**
```typescript
describe('Tournament Creation (Phase 1)', () => {
  it('defaults to NBA ruleset', () => {
    render(<CreateTournamentPage />);
    const rulesetSelect = screen.getByLabelText('Game Rules');
    expect(rulesetSelect).toHaveValue('NBA');
  });
  
  it('allows selecting FIBA ruleset', async () => {
    render(<CreateTournamentPage />);
    const rulesetSelect = screen.getByLabelText('Game Rules');
    
    await userEvent.click(rulesetSelect);
    await userEvent.click(screen.getByText('FIBA'));
    
    expect(rulesetSelect).toHaveValue('FIBA');
  });
  
  it('creates tournament with selected ruleset', async () => {
    render(<CreateTournamentPage />);
    
    // Select FIBA
    const rulesetSelect = screen.getByLabelText('Game Rules');
    await userEvent.click(rulesetSelect);
    await userEvent.click(screen.getByText('FIBA'));
    
    // Submit form
    await userEvent.click(screen.getByText('Create Tournament'));
    
    // Verify API call
    expect(mockCreateTournament).toHaveBeenCalledWith(
      expect.objectContaining({
        ruleset: 'FIBA',
        automation_settings: DEFAULT_AUTOMATION_FLAGS
      })
    );
  });
});
```

---

## 📊 PHASE 1 SUMMARY

### Deliverables Checklist
- ✅ 3 database migrations (additive, no breaking changes)
- ✅ 2 new type files (automation.ts, ruleset.ts)
- ✅ 1 new service file (rulesetService.ts)
- ✅ 4 new engine files (clockEngine, playEngine, possessionEngine, commandEngine)
- ✅ Modified useTracker hook (loads ruleset + flags, calls engines)
- ✅ Modified tournament creation UI (ruleset selector)
- ✅ 50+ test cases (unit tests for all new code)

### Behavior Changes
- ❌ NONE - All automation flags default to OFF
- ✅ Tournaments now have ruleset field (default: NBA)
- ✅ Tournaments now have automation_settings field (default: all OFF)
- ✅ Games load ruleset and flags (but don't use them yet)
- ✅ Engine functions are called but return no-ops

### Database Changes
- ✅ `game_stats`: +3 columns (sequence_id, linked_event_id, event_metadata)
- ✅ `game_possessions`: new table (possession history)
- ✅ `tournaments`: +3 columns (ruleset, ruleset_config, automation_settings)
- ✅ `games`: +2 columns (possession_arrow, current_possession)
- ✅ All changes are additive (nullable or with defaults)

### Rollback Strategy
- ✅ No rollback needed (additive migrations)
- ✅ Existing games work unchanged
- ✅ New games work with default flags (OFF)
- ✅ Can deploy to production safely

---

## 🚀 DEPLOYMENT PLAN

### Step 1: Apply Migrations
```bash
# Run migrations in order
psql $DATABASE_URL < docs/05-database/migrations/008_event_linking.sql
psql $DATABASE_URL < docs/05-database/migrations/009_possession_tracking.sql
psql $DATABASE_URL < docs/05-database/migrations/010_ruleset_configuration.sql
```

### Step 2: Deploy Code
```bash
# Merge feature branch
git checkout main
git merge feature/dual-engine-phase1-foundation
git push origin main

# Deploy to production (Vercel, etc.)
vercel deploy --prod
```

### Step 3: Verify
```bash
# Check migrations applied
psql $DATABASE_URL -c "SELECT column_name FROM information_schema.columns WHERE table_name='game_stats' AND column_name='sequence_id';"

# Check existing tournaments still work
curl https://api.statjam.com/tournaments/existing-tournament-id

# Create test tournament with FIBA ruleset
curl -X POST https://api.statjam.com/tournaments \
  -d '{"name": "Test FIBA", "ruleset": "FIBA"}'
```

### Step 4: Monitor
- ✅ No errors in Sentry
- ✅ Existing games load successfully
- ✅ New tournaments can be created with rulesets
- ✅ Stat tracking works unchanged (engines return no-ops)

---

## 📝 NEXT STEPS: PHASE 2

Once Phase 1 is deployed and verified:

1. **Enable Clock Automation** (Phase 2)
   - Implement ClockEngine.applyEvent() logic
   - Add auto-pause on fouls/violations
   - Add shot clock auto-reset rules
   - Add FT mode (shot clock off)
   - Enable for beta tournaments only (flag: `clock.enabled = true`)

2. **Test with Beta Users**
   - Select 5-10 tournaments for beta
   - Enable clock automation flags
   - Collect feedback
   - Fix bugs before wider rollout

3. **Gradual Rollout**
   - Week 1: 10% of new tournaments
   - Week 2: 25% of new tournaments
   - Week 3: 50% of new tournaments
   - Week 4: 100% of new tournaments

---

**Document Version**: 1.0  
**Last Updated**: October 28, 2025  
**Status**: READY FOR IMPLEMENTATION  
**Estimated Effort**: 40 hours  
**Risk Level**: LOW (no breaking changes)

