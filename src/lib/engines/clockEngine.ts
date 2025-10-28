/**
 * ClockEngine - Game Clock and Shot Clock Automation
 * 
 * Purpose: Auto-pause, auto-reset, FT mode, made basket stop
 * Phase 1: STUB (no-op, returns current state unchanged)
 * Phase 2: Full implementation
 * 
 * Pure function - no side effects, no DB calls
 * 
 * @module clockEngine
 */

import { Ruleset } from '@/lib/types/ruleset';
import { ClockAutomationFlags } from '@/lib/types/automation';

export interface ClockState {
  gameClockMinutes: number;
  gameClockSeconds: number;
  gameClockRunning: boolean;
  shotClock: number;
  shotClockRunning: boolean;
  shotClockDisabled: boolean; // True during free throws
  quarter: number;
}

export interface ClockEvent {
  type: 'foul' | 'made_shot' | 'missed_shot' | 'turnover' | 'timeout' | 'free_throw' | 'substitution';
  modifier?: string;
  ballLocation?: 'frontcourt' | 'backcourt';
  reboundType?: 'offensive' | 'defensive';
}

export interface ClockEngineResult {
  newState: ClockState;
  actions: string[]; // Human-readable actions taken
}

export class ClockEngine {
  /**
   * Process clock event
   * 
   * Phase 1: STUB - returns current state unchanged
   * Phase 2: Implements auto-pause, auto-reset, FT mode
   * 
   * @param currentState - Current clock state
   * @param event - Event that occurred
   * @param ruleset - Game ruleset
   * @param flags - Automation flags
   * @returns New clock state and actions taken
   * 
   * @example
   * ```typescript
   * const result = ClockEngine.processEvent(
   *   currentState,
   *   { type: 'foul', modifier: 'personal' },
   *   NBA_RULESET,
   *   { enabled: true, autoPause: true }
   * );
   * 
   * // Phase 1: result.newState === currentState (no changes)
   * // Phase 2: result.newState.gameClockRunning === false (auto-paused)
   * ```
   */
  static processEvent(
    currentState: ClockState,
    event: ClockEvent,
    ruleset: Ruleset,
    flags: ClockAutomationFlags
  ): ClockEngineResult {
    // ✅ PHASE 1 STUB: Return current state unchanged
    // This ensures no behavior changes when flags are OFF
    
    if (!flags.enabled) {
      return {
        newState: currentState,
        actions: []
      };
    }
    
    // ✅ PHASE 1: Even with flags ON, return no-op
    // Phase 2 will implement actual logic here
    
    console.log('[ClockEngine] Phase 1 stub - no automation yet', {
      event,
      ruleset: ruleset.id,
      flags
    });
    
    return {
      newState: currentState,
      actions: []
    };
  }
  
  /**
   * Calculate shot clock reset value
   * 
   * Phase 1: STUB - returns current shot clock
   * Phase 2: Implements NBA/FIBA/NCAA reset rules
   * 
   * @param event - Event that occurred
   * @param currentShotClock - Current shot clock value
   * @param ruleset - Game ruleset
   * @returns New shot clock value
   */
  static calculateShotClockReset(
    event: ClockEvent,
    currentShotClock: number,
    ruleset: Ruleset
  ): number {
    // ✅ PHASE 1 STUB: Return current value
    return currentShotClock;
  }
  
  /**
   * Check if clock should stop on made basket
   * 
   * Phase 1: STUB - returns false
   * Phase 2: Implements NBA last 2 min rule, NCAA last 1 min rule
   * 
   * @param currentState - Current clock state
   * @param ruleset - Game ruleset
   * @returns True if clock should stop
   */
  static shouldStopOnMadeBasket(
    currentState: ClockState,
    ruleset: Ruleset
  ): boolean {
    // ✅ PHASE 1 STUB: Always return false (no auto-stop)
    return false;
  }
  
  /**
   * Check if shot clock should be disabled (FT mode)
   * 
   * Phase 1: STUB - returns false
   * Phase 2: Implements FT mode detection
   * 
   * @param event - Event that occurred
   * @param flags - Automation flags
   * @returns True if shot clock should be disabled
   */
  static shouldDisableShotClock(
    event: ClockEvent,
    flags: ClockAutomationFlags
  ): boolean {
    // ✅ PHASE 1 STUB: Always return false
    return false;
  }
}

