/**
 * Feature Flags for Dual-Engine Automation
 * 
 * Purpose: Control automation features per tournament
 * Phase 1: All flags default to FALSE (no behavior changes)
 * Phase 2-5: Gradually enable features
 * 
 * Stored in: tournaments.automation_settings (JSONB)
 * Loaded by: useTracker hook at game initialization
 * 
 * @module automation
 */

/**
 * Clock automation flags
 * Controls game clock and shot clock behavior
 */
export interface ClockAutomationFlags {
  /** Master switch for all clock automation */
  enabled: boolean;
  
  /** Auto-pause clocks on whistles (fouls, violations, out-of-bounds) */
  autoPause: boolean;
  
  /** Auto-reset shot clock on events (made shots, rebounds, fouls) */
  autoReset: boolean;
  
  /** Free throw mode (disable shot clock during FT sequence) */
  ftMode: boolean;
  
  /** NBA last 2 min rule (clock stops on made baskets) */
  madeBasketStop: boolean;
}

/**
 * Possession automation flags
 * Controls possession tracking and auto-flip
 */
export interface PossessionAutomationFlags {
  /** Master switch for all possession automation */
  enabled: boolean;
  
  /** Auto-flip possession on events (made shots, turnovers, steals, rebounds) */
  autoFlip: boolean;
  
  /** Persist possession changes to database (game_possessions table) */
  persistState: boolean;
  
  /** Track jump ball possession arrow (alternating possession) */
  jumpBallArrow: boolean;
}

/**
 * Event sequence automation flags
 * Controls event linking and prompts
 */
export interface SequenceAutomationFlags {
  /** Master switch for all sequence automation */
  enabled: boolean;
  
  /** Prompt "Was there an assist?" after made shot */
  promptAssists: boolean;
  
  /** Prompt "Who got the rebound?" after missed shot */
  promptRebounds: boolean;
  
  /** Prompt "Was it blocked?" after missed shot */
  promptBlocks: boolean;
  
  /** Store sequence_id and linked_event_id in database */
  linkEvents: boolean;
  
  /** Auto free throw sequence after shooting foul */
  freeThrowSequence: boolean;
}

/**
 * Foul enforcement automation flags
 * Controls bonus FTs, foul-out, and ejection
 */
export interface FoulAutomationFlags {
  /** Master switch for all foul automation */
  enabled: boolean;
  
  /** Auto award bonus free throws when team fouls >= threshold */
  bonusFreeThrows: boolean;
  
  /** Auto-remove player at foul limit (6 for NBA, 5 for FIBA) */
  foulOutEnforcement: boolean;
  
  /** Auto-eject player at 2 technical fouls */
  technicalEjection: boolean;
}

/**
 * Undo/redo automation flags
 * Controls command log and undo/redo functionality
 */
export interface UndoAutomationFlags {
  /** Master switch for undo/redo */
  enabled: boolean;
  
  /** Maximum command history size (default: 50) */
  maxHistorySize: number;
}

/**
 * Complete automation flags structure
 * Stored in tournaments.automation_settings
 */
export interface AutomationFlags {
  clock: ClockAutomationFlags;
  possession: PossessionAutomationFlags;
  sequences: SequenceAutomationFlags;
  fouls: FoulAutomationFlags;
  undo: UndoAutomationFlags;
}

/**
 * Default automation flags (Phase 1)
 * All features disabled by default
 * Safe for production deployment
 */
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

/**
 * Type guard to check if automation flags are valid
 */
export function isValidAutomationFlags(flags: unknown): flags is AutomationFlags {
  if (typeof flags !== 'object' || flags === null) return false;
  
  const f = flags as Partial<AutomationFlags>;
  
  return (
    typeof f.clock === 'object' &&
    typeof f.possession === 'object' &&
    typeof f.sequences === 'object' &&
    typeof f.fouls === 'object' &&
    typeof f.undo === 'object'
  );
}

/**
 * Merge automation flags with defaults
 * Ensures all required fields are present
 */
export function mergeAutomationFlags(
  flags: Partial<AutomationFlags> | null | undefined
): AutomationFlags {
  if (!flags || !isValidAutomationFlags(flags)) {
    return DEFAULT_AUTOMATION_FLAGS;
  }
  
  return {
    clock: { ...DEFAULT_AUTOMATION_FLAGS.clock, ...flags.clock },
    possession: { ...DEFAULT_AUTOMATION_FLAGS.possession, ...flags.possession },
    sequences: { ...DEFAULT_AUTOMATION_FLAGS.sequences, ...flags.sequences },
    fouls: { ...DEFAULT_AUTOMATION_FLAGS.fouls, ...flags.fouls },
    undo: { ...DEFAULT_AUTOMATION_FLAGS.undo, ...flags.undo }
  };
}

