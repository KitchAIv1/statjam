/**
 * Ruleset Configuration for NBA/FIBA/NCAA/CUSTOM
 * 
 * Purpose: Define all game rules (clock, shot clock, timeouts, fouls)
 * Loaded at: Game initialization from tournaments.ruleset
 * Drives: All engine behavior (ClockEngine, PlayEngine, PossessionEngine)
 * 
 * @module ruleset
 */

export type RulesetId = 'NBA' | 'FIBA' | 'NCAA' | 'CUSTOM';

/**
 * Shot clock rules per ruleset
 */
export interface ShotClockRules {
  /** Full reset time (24, 30, or 35 seconds) */
  fullReset: number;
  
  /** Offensive rebound reset (14 for NBA, 20 for NCAA, 'keep' for FIBA) */
  offensiveReboundReset: number | 'keep';
  
  /** Frontcourt foul reset (14 for NBA, 20 for NCAA, 24 for FIBA) */
  frontcourtFoulReset: number;
  
  /** Backcourt foul reset (always full reset) */
  backcourtFoulReset: number;
  
  /** Out-of-bounds rule ('keep' or 'reset_if_above_14') */
  outOfBoundsRule: 'keep' | 'reset_if_above_14';
  
  /** Disable shot clock during free throws */
  disableOnFreeThrows: boolean;
}

/**
 * Timeout rules per ruleset
 */
export interface TimeoutRules {
  /** Full timeouts per team per game */
  fullTimeouts: number;
  
  /** Short timeouts per team per game (30-second) */
  shortTimeouts: number;
  
  /** Full timeout duration in seconds */
  fullDurationSeconds: number;
  
  /** Short timeout duration in seconds */
  shortDurationSeconds: number;
  
  /** Max timeouts per half (NCAA: 4, NBA: 4) */
  maxPerHalf: number;
  
  /** Max timeouts in last 2 minutes (NBA: 3) */
  maxInLastTwoMinutes: number;
}

/**
 * Foul rules per ruleset
 */
export interface FoulRules {
  /** Personal foul limit before foul-out (6 for NBA, 5 for FIBA/NCAA) */
  personalFoulLimit: number;
  
  /** Technical fouls before ejection (2 for all) */
  technicalFoulEjection: number;
  
  /** Team fouls before bonus (5 for NBA, 4 for FIBA, 7 for NCAA) */
  teamFoulBonus: number;
  
  /** Team fouls before double bonus (10 for NBA/NCAA, null for FIBA) */
  teamFoulDoubleBonus: number | null;
  
  /** Bonus free throw type ('1-and-1' or 'double') */
  bonusFreeThrows: '1-and-1' | 'double';
}

/**
 * Clock rules per ruleset
 */
export interface ClockRules {
  /** Quarter/period length in minutes */
  quarterLengthMinutes: number;
  
  /** Number of periods per game (4 for NBA/FIBA, 2 for NCAA halves) */
  periodsPerGame: number;
  
  /** Overtime length in minutes */
  overtimeLengthMinutes: number;
  
  /** Clock stops on made basket (false, true, or 'last_2_minutes') */
  clockStopsOnMadeBasket: boolean | 'last_2_minutes';
}

/**
 * Complete ruleset definition
 */
export interface Ruleset {
  id: RulesetId;
  name: string;
  clockRules: ClockRules;
  shotClockRules: ShotClockRules;
  timeoutRules: TimeoutRules;
  foulRules: FoulRules;
}

/**
 * NBA Official Rules (Default)
 */
export const NBA_RULESET: Ruleset = {
  id: 'NBA',
  name: 'NBA Official Rules',
  clockRules: {
    quarterLengthMinutes: 12,
    periodsPerGame: 4,
    overtimeLengthMinutes: 5,
    clockStopsOnMadeBasket: 'last_2_minutes' // Only in Q4/OT last 2 min
  },
  shotClockRules: {
    fullReset: 24,
    offensiveReboundReset: 14, // NBA rule: 14 seconds on offensive rebound
    frontcourtFoulReset: 14,   // NBA rule: 14 seconds on frontcourt foul
    backcourtFoulReset: 24,
    outOfBoundsRule: 'reset_if_above_14', // Reset to 14 if >14 remaining
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
    teamFoulBonus: 5,        // Bonus at 5 team fouls
    teamFoulDoubleBonus: 10, // Double bonus at 10 team fouls
    bonusFreeThrows: '1-and-1' // 1-and-1 for 5-9 fouls, double for 10+
  }
};

/**
 * FIBA International Rules
 */
export const FIBA_RULESET: Ruleset = {
  id: 'FIBA',
  name: 'FIBA International Rules',
  clockRules: {
    quarterLengthMinutes: 10,
    periodsPerGame: 4,
    overtimeLengthMinutes: 5,
    clockStopsOnMadeBasket: false // Clock never stops on made baskets
  },
  shotClockRules: {
    fullReset: 24,
    offensiveReboundReset: 'keep', // FIBA: shot clock keeps running
    frontcourtFoulReset: 24,       // FIBA: always full reset on fouls
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
    teamFoulBonus: 4,           // Bonus at 4 team fouls
    teamFoulDoubleBonus: null,  // FIBA: no double bonus
    bonusFreeThrows: 'double'   // Always 2 FTs in bonus
  }
};

/**
 * NCAA College Rules
 */
export const NCAA_RULESET: Ruleset = {
  id: 'NCAA',
  name: 'NCAA College Rules',
  clockRules: {
    quarterLengthMinutes: 20, // 2 halves of 20 minutes each
    periodsPerGame: 2,
    overtimeLengthMinutes: 5,
    clockStopsOnMadeBasket: 'last_2_minutes' // Last minute of each half
  },
  shotClockRules: {
    fullReset: 30,
    offensiveReboundReset: 20, // NCAA: 20 seconds on offensive rebound
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
    teamFoulBonus: 7,          // Bonus at 7 team fouls
    teamFoulDoubleBonus: 10,   // Double bonus at 10 team fouls
    bonusFreeThrows: '1-and-1'
  }
};

/**
 * Ruleset registry
 */
export const RULESETS: Record<RulesetId, Ruleset> = {
  NBA: NBA_RULESET,
  FIBA: FIBA_RULESET,
  NCAA: NCAA_RULESET,
  CUSTOM: NBA_RULESET // Default to NBA for custom, user can override
};

/**
 * Type guard to check if ruleset ID is valid
 */
export function isValidRulesetId(id: unknown): id is RulesetId {
  return typeof id === 'string' && id in RULESETS;
}

/**
 * Get ruleset display name
 */
export function getRulesetDisplayName(id: RulesetId): string {
  return RULESETS[id]?.name || 'Unknown Ruleset';
}

/**
 * Get ruleset description for UI
 */
export function getRulesetDescription(id: RulesetId): string {
  switch (id) {
    case 'NBA':
      return '12 min quarters, 24s shot clock, 14s offensive rebound reset';
    case 'FIBA':
      return '10 min quarters, 24s shot clock, no offensive rebound reset';
    case 'NCAA':
      return '20 min halves, 30s shot clock, 20s offensive rebound reset';
    case 'CUSTOM':
      return 'Configure your own rules';
    default:
      return '';
  }
}

