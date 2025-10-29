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
  type: 'made_shot' | 'turnover' | 'steal' | 'defensive_rebound' | 'offensive_rebound' | 'violation' | 'jump_ball' | 'foul';
  teamId: string;
  opponentTeamId: string;
  foulType?: 'personal' | 'shooting' | '1-and-1' | 'technical' | 'flagrant' | 'offensive'; // For foul possession handling
  isTechnicalOrFlagrantFT?: boolean; // ✅ PHASE 6B: Flag for technical/flagrant FTs that retain possession
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
        // ✅ PHASE 6B: Check if this is a technical/flagrant FT (retains possession)
        if (event.isTechnicalOrFlagrantFT) {
          // Technical/Flagrant FT: Shooting team KEEPS possession
          newState.currentPossession = event.teamId;
          shouldFlip = currentState.currentPossession !== event.teamId;
          shouldPersist = flags.persistState;
          endReason = 'technical_flagrant_ft_possession_retained';
          actions.push(`Possession retained by ${event.teamId} (technical/flagrant FT made)`);
        } else {
          // Regular made shot → Possession ALWAYS flips to opponent (unconditional)
          // This ensures possession tracking works from game start, regardless of initial state
          newState.currentPossession = event.opponentTeamId;
          shouldFlip = true;
          shouldPersist = flags.persistState;
          endReason = 'made_shot';
          actions.push(`Possession flipped to ${event.opponentTeamId} (made shot by ${event.teamId})`);
        }
        break;
        
      case 'turnover':
        // ✅ Turnover → Possession ALWAYS flips to opponent (unconditional)
        newState.currentPossession = event.opponentTeamId;
        shouldFlip = true;
        shouldPersist = flags.persistState;
        endReason = 'turnover';
        actions.push(`Possession flipped to ${event.opponentTeamId} (turnover by ${event.teamId})`);
        break;
        
      case 'steal':
        // ✅ Steal → Possession ALWAYS flips to stealing team (unconditional)
        newState.currentPossession = event.teamId;
        shouldFlip = true;
        shouldPersist = flags.persistState;
        endReason = 'steal';
        actions.push(`Possession flipped to ${event.teamId} (steal)`);
        break;
        
      case 'defensive_rebound':
        // ✅ Defensive rebound → Possession ALWAYS flips to rebounding team (unconditional)
        newState.currentPossession = event.teamId;
        shouldFlip = true;
        shouldPersist = flags.persistState;
        endReason = 'defensive_rebound';
        actions.push(`Possession flipped to ${event.teamId} (defensive rebound)`);
        break;
        
      case 'offensive_rebound':
        // ✅ Offensive rebound → Possession stays with rebounding team
        // Only persist if the rebounding team already has possession (sanity check)
        if (currentState.currentPossession === event.teamId) {
          shouldPersist = flags.persistState;
          endReason = 'offensive_rebound';
          actions.push(`Possession retained by ${event.teamId} (offensive rebound)`);
        } else {
          // Edge case: Offensive rebound but possession was wrong - correct it
          newState.currentPossession = event.teamId;
          shouldFlip = true;
          shouldPersist = flags.persistState;
          endReason = 'offensive_rebound';
          actions.push(`Possession corrected to ${event.teamId} (offensive rebound)`);
        }
        break;
        
      case 'violation':
        // ✅ Violation → Possession ALWAYS flips to opponent (unconditional)
        newState.currentPossession = event.opponentTeamId;
        shouldFlip = true;
        shouldPersist = flags.persistState;
        endReason = 'violation';
        actions.push(`Possession flipped to ${event.opponentTeamId} (violation by ${event.teamId})`);
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
        
      case 'foul':
        // ✅ PHASE 6A & 6B: Foul possession logic with technical/flagrant special handling
        
        // Check if this is a technical or flagrant foul (fouled team keeps possession)
        if (event.foulType === 'technical' || event.foulType === 'flagrant') {
          // Technical/Flagrant: Fouled team KEEPS possession after FTs
          // The opponent team (who was fouled) retains possession
          newState.currentPossession = event.opponentTeamId;
          shouldFlip = currentState.currentPossession !== event.opponentTeamId;
          shouldPersist = flags.persistState;
          endReason = `${event.foulType}_foul_possession_retained`;
          actions.push(`Possession retained by ${event.opponentTeamId} (${event.foulType} foul by ${event.teamId})`);
        } else {
          // Standard fouls (personal, shooting, offensive, 1-and-1): Opponent gets ball
          newState.currentPossession = event.opponentTeamId;
          shouldFlip = true;
          shouldPersist = flags.persistState;
          endReason = 'foul';
          actions.push(`Possession flipped to ${event.opponentTeamId} (foul by ${event.teamId})`);
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

