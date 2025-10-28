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
  type: 'foul' | 'made_shot' | 'missed_shot' | 'turnover' | 'timeout' | 'free_throw' | 'substitution' | 'steal';
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
    // Return unchanged if automation disabled
    if (!flags.enabled) {
      return {
        newState: currentState,
        actions: []
      };
    }
    
    const actions: string[] = [];
    let newState = { ...currentState };
    
    // ✅ PHASE 2: Auto-Pause Logic
    if (flags.autoPause) {
      const shouldPause = this.shouldPauseClocks(event);
      if (shouldPause && (currentState.gameClockRunning || currentState.shotClockRunning)) {
        newState.gameClockRunning = false;
        newState.shotClockRunning = false;
        actions.push(`Auto-paused clocks (${event.type})`);
      }
    }
    
    // ✅ PHASE 2: Shot Clock Reset Logic
    if (flags.autoReset) {
      const newShotClock = this.calculateShotClockReset(event, currentState.shotClock, ruleset);
      if (newShotClock !== currentState.shotClock) {
        newState.shotClock = newShotClock;
        newState.shotClockRunning = true;
        actions.push(`Shot clock reset to ${newShotClock}s`);
      }
    }
    
    // ✅ PHASE 2: Free Throw Mode
    if (flags.ftMode) {
      const shouldDisable = this.shouldDisableShotClock(event, flags);
      if (shouldDisable && !currentState.shotClockDisabled) {
        newState.shotClockDisabled = true;
        newState.shotClockRunning = false;
        actions.push('Shot clock disabled (FT mode)');
      } else if (!shouldDisable && currentState.shotClockDisabled && event.type === 'made_shot') {
        // Re-enable after last FT made
        newState.shotClockDisabled = false;
        newState.shotClockRunning = true;
        actions.push('Shot clock re-enabled');
      }
    }
    
    // ✅ PHASE 2: Made Basket Stop (NBA Last 2 Min)
    if (flags.madeBasketStop && event.type === 'made_shot') {
      const shouldStop = this.shouldStopOnMadeBasket(currentState, ruleset);
      if (shouldStop && currentState.gameClockRunning) {
        newState.gameClockRunning = false;
        newState.shotClockRunning = false;
        actions.push('Clock stopped (made basket in last 2 min)');
      }
    }
    
    return {
      newState,
      actions
    };
  }
  
  /**
   * Determine if clocks should pause for this event
   * 
   * @param event - Event that occurred
   * @returns True if clocks should pause
   */
  private static shouldPauseClocks(event: ClockEvent): boolean {
    const pauseEvents = ['foul', 'timeout', 'turnover'];
    return pauseEvents.includes(event.type);
  }
  
  /**
   * Calculate shot clock reset value
   * 
   * Implements NBA/FIBA/NCAA reset rules
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
    const rules = ruleset.shotClockRules;
    
    // Made basket → Full reset
    if (event.type === 'made_shot') {
      return rules.fullReset;
    }
    
    // Missed shot with rebound
    if (event.type === 'missed_shot' && event.reboundType) {
      // Defensive rebound → Full reset
      if (event.reboundType === 'defensive') {
        return rules.fullReset;
      }
      
      // Offensive rebound → Depends on ruleset
      if (event.reboundType === 'offensive') {
        if (rules.offensiveReboundReset === 'keep') {
          // FIBA: Keep current shot clock
          return currentShotClock;
        } else {
          // NBA: Reset to 14s ONLY if current < 14s, otherwise keep current
          // NCAA: Reset to 20s ONLY if current < 20s, otherwise keep current
          const resetValue = rules.offensiveReboundReset as number;
          return currentShotClock < resetValue ? resetValue : currentShotClock;
        }
      }
    }
    
    // Foul → Depends on ball location
    if (event.type === 'foul') {
      if (event.ballLocation === 'frontcourt') {
        // Frontcourt foul → 14s (NBA), 20s (NCAA), 24s (FIBA)
        return rules.frontcourtFoulReset;
      } else if (event.ballLocation === 'backcourt') {
        // Backcourt foul → Full reset
        return rules.backcourtFoulReset;
      }
    }
    
    // Turnover → Full reset (new possession)
    if (event.type === 'turnover') {
      return rules.fullReset;
    }
    
    // Steal → Full reset (change of possession, clock keeps running)
    if (event.type === 'steal') {
      return rules.fullReset;
    }
    
    // No reset needed
    return currentShotClock;
  }
  
  /**
   * Check if clock should stop on made basket
   * 
   * Implements NBA last 2 min rule, NCAA last 1 min rule
   * 
   * @param currentState - Current clock state
   * @param ruleset - Game ruleset
   * @returns True if clock should stop
   */
  static shouldStopOnMadeBasket(
    currentState: ClockState,
    ruleset: Ruleset
  ): boolean {
    const clockRule = ruleset.clockRules.clockStopsOnMadeBasket;
    
    // FIBA: Clock never stops on made basket
    if (clockRule === false) {
      return false;
    }
    
    // NBA/NCAA: Clock stops in last 2 minutes of Q4/OT
    if (clockRule === 'last_2_minutes' || clockRule === true) {
      const totalSeconds = (currentState.gameClockMinutes * 60) + currentState.gameClockSeconds;
      const isQ4OrOT = currentState.quarter >= 4;
      const isLast2Min = totalSeconds <= 120; // 2 minutes = 120 seconds
      
      return isQ4OrOT && isLast2Min;
    }
    
    return false;
  }
  
  /**
   * Check if shot clock should be disabled (FT mode)
   * 
   * Implements FT mode detection
   * 
   * @param event - Event that occurred
   * @param flags - Automation flags
   * @returns True if shot clock should be disabled
   */
  static shouldDisableShotClock(
    event: ClockEvent,
    flags: ClockAutomationFlags
  ): boolean {
    // Free throw events should disable shot clock
    if (event.type === 'free_throw') {
      return true;
    }
    
    // Shooting foul should disable shot clock (FT sequence coming)
    if (event.type === 'foul' && event.modifier === 'shooting') {
      return true;
    }
    
    return false;
  }
}

