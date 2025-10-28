/**
 * PossessionEngine - Possession Tracking and Auto-Flip
 * 
 * Purpose: Auto-flip possession on events, persist to database
 * Phase 1: STUB (no-op, returns current possession unchanged)
 * Phase 3: Full implementation
 * 
 * Pure function - no side effects, no DB calls
 * 
 * @module possessionEngine
 */

import { Ruleset } from '@/lib/types/ruleset';
import { PossessionAutomationFlags } from '@/lib/types/automation';

export interface PossessionState {
  currentPossession: string; // Team ID
  possessionArrow: string | null; // Team ID for jump ball
}

export interface PossessionEvent {
  type: 'made_shot' | 'turnover' | 'steal' | 'defensive_rebound' | 'offensive_rebound' | 'violation' | 'jump_ball';
  teamId: string;
  opponentTeamId: string;
}

export interface PossessionEngineResult {
  newState: PossessionState;
  shouldFlip: boolean;
  shouldPersist: boolean;
  endReason?: string;
  actions: string[];
}

export class PossessionEngine {
  /**
   * Process possession event
   * 
   * Phase 1: STUB - returns current possession unchanged
   * Phase 3: Implements auto-flip logic
   * 
   * @param currentState - Current possession state
   * @param event - Event that occurred
   * @param ruleset - Game ruleset
   * @param flags - Automation flags
   * @returns New possession state and actions taken
   * 
   * @example
   * ```typescript
   * const result = PossessionEngine.processEvent(
   *   { currentPossession: 'team-a-id', possessionArrow: null },
   *   { type: 'made_shot', teamId: 'team-a-id', opponentTeamId: 'team-b-id' },
   *   NBA_RULESET,
   *   { enabled: true, autoFlip: true }
   * );
   * 
   * // Phase 1: result.shouldFlip === false (no auto-flip)
   * // Phase 3: result.shouldFlip === true, result.newState.currentPossession === 'team-b-id'
   * ```
   */
  static processEvent(
    currentState: PossessionState,
    event: PossessionEvent,
    ruleset: Ruleset,
    flags: PossessionAutomationFlags
  ): PossessionEngineResult {
    // Return unchanged if automation disabled or flags undefined
    if (!flags || !flags.enabled || !flags.autoFlip) {
      return {
        newState: currentState,
        shouldFlip: false,
        shouldPersist: false,
        actions: []
      };
    }
    
    // ✅ PHASE 3: Implement auto-flip logic
    const actions: string[] = [];
    let newState = { ...currentState };
    let shouldFlip = false;
    let shouldPersist = false;
    let endReason: string | undefined;
    
    // Determine if possession should flip based on event type
    switch (event.type) {
      case 'made_shot':
        // Made shot → Possession flips to opponent
        if (currentState.currentPossession === event.teamId) {
          newState.currentPossession = event.opponentTeamId;
          shouldFlip = true;
          shouldPersist = flags.persistState;
          endReason = 'made_shot';
          actions.push(`Possession flipped to opponent (made shot)`);
        }
        break;
        
      case 'turnover':
        // Turnover → Possession flips to opponent
        if (currentState.currentPossession === event.teamId) {
          newState.currentPossession = event.opponentTeamId;
          shouldFlip = true;
          shouldPersist = flags.persistState;
          endReason = 'turnover';
          actions.push(`Possession flipped to opponent (turnover)`);
        }
        break;
        
      case 'steal':
        // Steal → Possession flips to stealing team
        if (currentState.currentPossession !== event.teamId) {
          newState.currentPossession = event.teamId;
          shouldFlip = true;
          shouldPersist = flags.persistState;
          endReason = 'steal';
          actions.push(`Possession flipped to ${event.teamId} (steal)`);
        }
        break;
        
      case 'defensive_rebound':
        // Defensive rebound → Possession flips to rebounding team
        if (currentState.currentPossession !== event.teamId) {
          newState.currentPossession = event.teamId;
          shouldFlip = true;
          shouldPersist = flags.persistState;
          endReason = 'defensive_rebound';
          actions.push(`Possession flipped to ${event.teamId} (defensive rebound)`);
        }
        break;
        
      case 'offensive_rebound':
        // Offensive rebound → Possession stays with rebounding team
        // No flip needed, but we may want to persist for analytics
        if (currentState.currentPossession === event.teamId) {
          shouldPersist = flags.persistState;
          endReason = 'offensive_rebound';
          actions.push(`Possession retained (offensive rebound)`);
        }
        break;
        
      case 'violation':
        // Violation → Possession flips to opponent
        if (currentState.currentPossession === event.teamId) {
          newState.currentPossession = event.opponentTeamId;
          shouldFlip = true;
          shouldPersist = flags.persistState;
          endReason = 'violation';
          actions.push(`Possession flipped to opponent (violation)`);
        }
        break;
        
      case 'jump_ball':
        // Jump ball → Use alternating possession arrow (if enabled)
        if (flags.jumpBallArrow && currentState.possessionArrow) {
          newState.currentPossession = currentState.possessionArrow;
          // Flip arrow to other team for next jump ball
          newState.possessionArrow = currentState.possessionArrow === event.teamId 
            ? event.opponentTeamId 
            : event.teamId;
          shouldFlip = true;
          shouldPersist = flags.persistState;
          endReason = 'jump_ball';
          actions.push(`Possession awarded via jump ball arrow`);
          actions.push(`Arrow flipped to ${newState.possessionArrow}`);
        }
        break;
        
      default:
        // Unknown event type - no change
        break;
    }
    
    return {
      newState,
      shouldFlip,
      shouldPersist,
      endReason,
      actions
    };
  }
  
  /**
   * Determine if possession should flip
   * 
   * Phase 1: STUB - returns false
   * Phase 3: Implements flip logic per event type
   * 
   * @param event - Event that occurred
   * @returns True if possession should flip
   */
  static shouldFlipPossession(event: PossessionEvent): boolean {
    // ✅ PHASE 1 STUB: Always return false
    return false;
  }
  
  /**
   * Get possession end reason
   * 
   * Phase 1: STUB - returns undefined
   * Phase 3: Maps event type to end reason
   * 
   * @param event - Event that occurred
   * @returns End reason string for database
   */
  static getEndReason(event: PossessionEvent): string | undefined {
    // ✅ PHASE 1 STUB: Return undefined
    return undefined;
  }
  
  /**
   * Handle jump ball with possession arrow
   * 
   * Phase 1: STUB - returns current arrow
   * Phase 3: Implements alternating possession
   * 
   * @param currentArrow - Current possession arrow team ID
   * @param opponentTeamId - Opponent team ID
   * @returns New possession arrow team ID
   */
  static handleJumpBall(
    currentArrow: string | null,
    opponentTeamId: string
  ): string {
    // ✅ PHASE 1 STUB: Return current arrow or opponent
    return currentArrow || opponentTeamId;
  }
}

