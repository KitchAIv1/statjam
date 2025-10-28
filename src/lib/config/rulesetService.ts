/**
 * RulesetService - Pure Functions for Ruleset Management
 * 
 * Purpose: Load and validate rulesets, apply custom overrides
 * Phase: 1 (Foundation)
 * 
 * Pure functions only - no side effects, no DB calls
 * DB operations happen in caller (useTracker, tournament service)
 * 
 * @module rulesetService
 */

import { Ruleset, RulesetId, RULESETS, isValidRulesetId } from '@/lib/types/ruleset';

export interface RulesetValidationResult {
  valid: boolean;
  errors: string[];
}

export class RulesetService {
  /**
   * Get ruleset by ID
   * 
   * @param rulesetId - NBA, FIBA, NCAA, or CUSTOM
   * @returns Ruleset configuration
   * @example
   * ```typescript
   * const nba = RulesetService.getRuleset('NBA');
   * console.log(nba.shotClockRules.fullReset); // 24
   * ```
   */
  static getRuleset(rulesetId: RulesetId | string): Ruleset {
    if (!isValidRulesetId(rulesetId)) {
      console.warn(`Invalid ruleset ID: ${rulesetId}, defaulting to NBA`);
      return RULESETS.NBA;
    }
    
    return RULESETS[rulesetId];
  }
  
  /**
   * Apply custom overrides to a base ruleset
   * 
   * Used when tournaments.ruleset = 'CUSTOM'
   * Merges tournaments.ruleset_config with base ruleset
   * 
   * @param baseRuleset - Base ruleset (NBA, FIBA, or NCAA)
   * @param overrides - Custom overrides from tournaments.ruleset_config
   * @returns Merged ruleset with id='CUSTOM'
   * 
   * @example
   * ```typescript
   * const base = RulesetService.getRuleset('NBA');
   * const custom = RulesetService.applyCustomOverrides(base, {
   *   clockRules: { quarterLengthMinutes: 15 },
   *   shotClockRules: { fullReset: 30 }
   * });
   * console.log(custom.clockRules.quarterLengthMinutes); // 15
   * console.log(custom.foulRules.personalFoulLimit); // 6 (unchanged from NBA)
   * ```
   */
  static applyCustomOverrides(
    baseRuleset: Ruleset,
    overrides: Partial<Ruleset>
  ): Ruleset {
    return {
      ...baseRuleset,
      id: 'CUSTOM',
      name: 'Custom Rules',
      clockRules: { 
        ...baseRuleset.clockRules, 
        ...(overrides.clockRules || {}) 
      },
      shotClockRules: { 
        ...baseRuleset.shotClockRules, 
        ...(overrides.shotClockRules || {}) 
      },
      timeoutRules: { 
        ...baseRuleset.timeoutRules, 
        ...(overrides.timeoutRules || {}) 
      },
      foulRules: { 
        ...baseRuleset.foulRules, 
        ...(overrides.foulRules || {}) 
      }
    };
  }
  
  /**
   * Validate ruleset configuration
   * 
   * Ensures all values are within reasonable ranges
   * Used before saving custom rulesets
   * 
   * @param ruleset - Ruleset to validate
   * @returns Validation result with errors array
   * 
   * @example
   * ```typescript
   * const result = RulesetService.validateRuleset(customRuleset);
   * if (!result.valid) {
   *   console.error('Invalid ruleset:', result.errors);
   * }
   * ```
   */
  static validateRuleset(ruleset: Ruleset): RulesetValidationResult {
    const errors: string[] = [];
    
    // Clock validation
    if (ruleset.clockRules.quarterLengthMinutes < 1 || ruleset.clockRules.quarterLengthMinutes > 30) {
      errors.push('Quarter length must be between 1 and 30 minutes');
    }
    
    if (ruleset.clockRules.periodsPerGame < 1 || ruleset.clockRules.periodsPerGame > 4) {
      errors.push('Periods per game must be between 1 and 4');
    }
    
    if (ruleset.clockRules.overtimeLengthMinutes < 1 || ruleset.clockRules.overtimeLengthMinutes > 15) {
      errors.push('Overtime length must be between 1 and 15 minutes');
    }
    
    // Shot clock validation
    if (ruleset.shotClockRules.fullReset < 10 || ruleset.shotClockRules.fullReset > 35) {
      errors.push('Shot clock must be between 10 and 35 seconds');
    }
    
    if (typeof ruleset.shotClockRules.offensiveReboundReset === 'number') {
      if (ruleset.shotClockRules.offensiveReboundReset < 10 || 
          ruleset.shotClockRules.offensiveReboundReset > 35) {
        errors.push('Offensive rebound reset must be between 10 and 35 seconds or "keep"');
      }
    }
    
    // Timeout validation
    if (ruleset.timeoutRules.fullTimeouts < 0 || ruleset.timeoutRules.fullTimeouts > 10) {
      errors.push('Full timeouts must be between 0 and 10');
    }
    
    if (ruleset.timeoutRules.fullDurationSeconds < 30 || ruleset.timeoutRules.fullDurationSeconds > 120) {
      errors.push('Full timeout duration must be between 30 and 120 seconds');
    }
    
    // Foul validation
    if (ruleset.foulRules.personalFoulLimit < 3 || ruleset.foulRules.personalFoulLimit > 10) {
      errors.push('Personal foul limit must be between 3 and 10');
    }
    
    if (ruleset.foulRules.teamFoulBonus < 1 || ruleset.foulRules.teamFoulBonus > 15) {
      errors.push('Team foul bonus threshold must be between 1 and 15');
    }
    
    if (ruleset.foulRules.teamFoulDoubleBonus !== null) {
      if (ruleset.foulRules.teamFoulDoubleBonus < 1 || ruleset.foulRules.teamFoulDoubleBonus > 20) {
        errors.push('Team foul double bonus threshold must be between 1 and 20');
      }
      
      if (ruleset.foulRules.teamFoulDoubleBonus <= ruleset.foulRules.teamFoulBonus) {
        errors.push('Double bonus threshold must be greater than bonus threshold');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Get all available rulesets
   * 
   * @returns Array of all ruleset IDs
   */
  static getAllRulesetIds(): RulesetId[] {
    return Object.keys(RULESETS) as RulesetId[];
  }
  
  /**
   * Compare two rulesets for equality
   * 
   * @param a - First ruleset
   * @param b - Second ruleset
   * @returns True if rulesets are identical
   */
  static areRulesetsEqual(a: Ruleset, b: Ruleset): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  
  /**
   * Get ruleset differences
   * 
   * Useful for displaying what changed in custom rulesets
   * 
   * @param base - Base ruleset
   * @param custom - Custom ruleset
   * @returns Object with differences
   */
  static getRulesetDifferences(base: Ruleset, custom: Ruleset): Record<string, unknown> {
    const differences: Record<string, unknown> = {};
    
    // Compare clock rules
    Object.keys(custom.clockRules).forEach(key => {
      const k = key as keyof typeof custom.clockRules;
      if (custom.clockRules[k] !== base.clockRules[k]) {
        differences[`clockRules.${key}`] = {
          base: base.clockRules[k],
          custom: custom.clockRules[k]
        };
      }
    });
    
    // Compare shot clock rules
    Object.keys(custom.shotClockRules).forEach(key => {
      const k = key as keyof typeof custom.shotClockRules;
      if (custom.shotClockRules[k] !== base.shotClockRules[k]) {
        differences[`shotClockRules.${key}`] = {
          base: base.shotClockRules[k],
          custom: custom.shotClockRules[k]
        };
      }
    });
    
    // Compare timeout rules
    Object.keys(custom.timeoutRules).forEach(key => {
      const k = key as keyof typeof custom.timeoutRules;
      if (custom.timeoutRules[k] !== base.timeoutRules[k]) {
        differences[`timeoutRules.${key}`] = {
          base: base.timeoutRules[k],
          custom: custom.timeoutRules[k]
        };
      }
    });
    
    // Compare foul rules
    Object.keys(custom.foulRules).forEach(key => {
      const k = key as keyof typeof custom.foulRules;
      if (custom.foulRules[k] !== base.foulRules[k]) {
        differences[`foulRules.${key}`] = {
          base: base.foulRules[k],
          custom: custom.foulRules[k]
        };
      }
    });
    
    return differences;
  }
}

