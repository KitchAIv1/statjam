/**
 * PlayEngine - Intelligent event sequencing and linking
 * 
 * PURPOSE:
 * - Detects when follow-up events should be prompted (assists, rebounds, blocks)
 * - Links related events together (assist→shot, rebound→miss, steal→turnover)
 * - Manages free throw sequences
 * - Provides event metadata for play-by-play
 * 
 * FEATURES:
 * - Assist prompts after made shots
 * - Rebound prompts after missed shots
 * - Block prompts after missed shots
 * - Auto-creates turnovers for steals
 * - Free throw sequence management
 * - Event linking via sequence_id and linked_event_id
 * 
 * PHASE 4: Play Sequences & Event Linking
 */

import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// TYPES
// ============================================================================

export interface PlaySequenceFlags {
  enabled: boolean;           // Master switch
  promptAssists: boolean;     // Prompt after made shots
  promptRebounds: boolean;    // Prompt after misses
  promptBlocks: boolean;      // Prompt for blocks
  linkEvents: boolean;        // Store linked_event_id
  freeThrowSequence: boolean; // Auto FT sequence
}

export interface GameEvent {
  id?: string;
  statType: string;
  modifier?: string;
  playerId: string;
  teamId: string;
  quarter: number;
  gameTimeSeconds: number;
  statValue?: number;
}

export interface LinkedEvent {
  primaryEventId: string;
  linkedEventId: string;
  sequenceId: string;
  linkType: 'assist' | 'rebound' | 'block' | 'steal_turnover' | 'free_throw';
}

export interface PromptDecision {
  shouldPrompt: boolean;
  promptType: 'assist' | 'rebound' | 'block' | null;
  primaryEvent: GameEvent;
  metadata?: Record<string, any>;
}

export interface FreeThrowSequence {
  sequenceId: string;
  shooterId: string;
  teamId: string;
  totalAttempts: number;
  currentAttempt: number;
  foulType: 'shooting' | 'technical' | 'flagrant' | 'bonus';
  metadata: Record<string, any>;
}

export interface PlayEngineResult {
  shouldPrompt: boolean;
  promptType: 'assist' | 'rebound' | 'block' | 'free_throw' | null;
  sequenceId?: string;
  linkedEventId?: string;
  metadata?: Record<string, any>;
  actions: string[];
}

// ============================================================================
// PLAY ENGINE
// ============================================================================

export class PlayEngine {
  
  /**
   * Analyze an event and determine if a follow-up prompt is needed
   */
  static analyzeEvent(
    event: GameEvent,
    flags: PlaySequenceFlags,
    recentEvents: GameEvent[] = []
  ): PlayEngineResult {
    
    // Return early if automation disabled
    if (!flags || !flags.enabled) {
      return {
        shouldPrompt: false,
        promptType: null,
        actions: []
      };
    }

    const result: PlayEngineResult = {
      shouldPrompt: false,
      promptType: null,
      actions: []
    };

    // Check for assist prompt (after made shots)
    if (flags.promptAssists && this.shouldPromptAssist(event)) {
      result.shouldPrompt = true;
      result.promptType = 'assist';
      result.sequenceId = uuidv4();
      result.metadata = {
        shotType: event.statType,
        shotValue: event.statValue,
        shooterId: event.playerId
      };
      result.actions.push(`Prompt assist for made ${event.statType}`);
    }

    // Check for rebound prompt (after missed shots)
    if (flags.promptRebounds && this.shouldPromptRebound(event)) {
      result.shouldPrompt = true;
      result.promptType = 'rebound';
      result.sequenceId = uuidv4();
      result.metadata = {
        shotType: event.statType,
        shooterId: event.playerId
      };
      result.actions.push(`Prompt rebound for missed ${event.statType}`);
    }

    // Check for block prompt (after missed shots)
    if (flags.promptBlocks && this.shouldPromptBlock(event)) {
      result.shouldPrompt = true;
      result.promptType = 'block';
      result.sequenceId = uuidv4();
      result.metadata = {
        shotType: event.statType,
        shooterId: event.playerId
      };
      result.actions.push(`Prompt block for missed ${event.statType}`);
    }

    // ✅ AUTO-GENERATE TURNOVER FOR STEAL
    // When a steal is recorded, automatically create a turnover for the opponent
    if (event.statType === 'steal') {
      result.sequenceId = uuidv4();
      result.metadata = {
        stealerId: event.playerId,
        stealerTeamId: event.teamId,
        shouldGenerateTurnover: true
      };
      result.actions.push(`Auto-generate turnover for steal by player ${event.playerId}`);
    }

    return result;
  }

  /**
   * Check if assist prompt should be shown
   * Criteria: Made field goal or 3-pointer
   */
  static shouldPromptAssist(event: GameEvent): boolean {
    const isMadeShot = 
      (event.statType === 'field_goal' || 
       event.statType === 'three_pointer' || 
       event.statType === '3_pointer') && 
      event.modifier === 'made';
    
    return isMadeShot;
  }

  /**
   * Check if rebound prompt should be shown
   * Criteria: Missed field goal, 3-pointer, or free throw
   */
  static shouldPromptRebound(event: GameEvent): boolean {
    const isMissedShot = 
      (event.statType === 'field_goal' || 
       event.statType === 'three_pointer' || 
       event.statType === '3_pointer' ||
       event.statType === 'free_throw') && 
      event.modifier === 'missed';
    
    return isMissedShot;
  }

  /**
   * Check if block prompt should be shown
   * Criteria: Missed field goal or 3-pointer (not free throws)
   */
  static shouldPromptBlock(event: GameEvent): boolean {
    const isMissedFieldGoal = 
      (event.statType === 'field_goal' || 
       event.statType === 'three_pointer' || 
       event.statType === '3_pointer') && 
      event.modifier === 'missed';
    
    return isMissedFieldGoal;
  }

  /**
   * Create a linked event relationship
   */
  static createLinkedEvent(
    primaryEventId: string,
    linkedEventId: string,
    linkType: 'assist' | 'rebound' | 'block' | 'steal_turnover' | 'free_throw'
  ): LinkedEvent {
    return {
      primaryEventId,
      linkedEventId,
      sequenceId: uuidv4(),
      linkType
    };
  }

  /**
   * Generate a turnover event for a steal
   * When a steal is recorded, automatically create the corresponding turnover
   */
  static generateTurnoverForSteal(
    stealEvent: GameEvent,
    opponentTeamId: string
  ): GameEvent {
    return {
      id: uuidv4(),
      statType: 'turnover',
      modifier: 'steal',
      playerId: stealEvent.playerId, // Same player who made the steal
      teamId: opponentTeamId, // Turnover is charged to opponent
      quarter: stealEvent.quarter,
      gameTimeSeconds: stealEvent.gameTimeSeconds,
      statValue: 1
    };
  }

  /**
   * Create a free throw sequence
   * Determines number of attempts based on foul type
   */
  static createFreeThrowSequence(
    shooterId: string,
    teamId: string,
    foulType: 'shooting' | 'technical' | 'flagrant' | 'bonus',
    shotType?: 'field_goal' | 'three_pointer' | '3_pointer'
  ): FreeThrowSequence {
    
    let totalAttempts = 2; // Default for shooting fouls
    
    // Determine FT attempts based on foul type
    if (foulType === 'shooting') {
      if (shotType === 'three_pointer' || shotType === '3_pointer') {
        totalAttempts = 3; // 3-point shooting foul
      } else {
        totalAttempts = 2; // 2-point shooting foul
      }
    } else if (foulType === 'technical') {
      totalAttempts = 1; // Technical foul
    } else if (foulType === 'flagrant') {
      totalAttempts = 2; // Flagrant foul
    } else if (foulType === 'bonus') {
      totalAttempts = 2; // Bonus situation (team fouls >= 5)
    }

    return {
      sequenceId: uuidv4(),
      shooterId,
      teamId,
      totalAttempts,
      currentAttempt: 0,
      foulType,
      metadata: {
        shotType,
        createdAt: new Date().toISOString()
      }
    };
  }

  /**
   * Check if a free throw sequence is complete
   */
  static isFreeThrowSequenceComplete(sequence: FreeThrowSequence): boolean {
    return sequence.currentAttempt >= sequence.totalAttempts;
  }

  /**
   * Advance free throw sequence to next attempt
   */
  static advanceFreeThrowSequence(sequence: FreeThrowSequence): FreeThrowSequence {
    return {
      ...sequence,
      currentAttempt: sequence.currentAttempt + 1
    };
  }

  /**
   * Generate event metadata for database storage
   */
  static generateEventMetadata(
    eventType: string,
    sequenceId?: string,
    linkedEventId?: string,
    additionalData?: Record<string, any>
  ): Record<string, any> {
    return {
      eventType,
      sequenceId,
      linkedEventId,
      timestamp: new Date().toISOString(),
      automationVersion: 'v4.0-play-sequences',
      ...additionalData
    };
  }

  /**
   * Validate event linking data
   */
  static validateEventLink(
    primaryEvent: GameEvent,
    linkedEvent: GameEvent
  ): { valid: boolean; error?: string } {
    
    // Both events must exist
    if (!primaryEvent || !linkedEvent) {
      return { valid: false, error: 'Missing event data' };
    }

    // Events must be in same game (same quarter and close in time)
    if (primaryEvent.quarter !== linkedEvent.quarter) {
      return { valid: false, error: 'Events in different quarters' };
    }

    // Linked event should occur within 10 seconds of primary event
    const timeDiff = Math.abs(primaryEvent.gameTimeSeconds - linkedEvent.gameTimeSeconds);
    if (timeDiff > 10) {
      return { valid: false, error: 'Events too far apart in time' };
    }

    return { valid: true };
  }
}

/**
 * USAGE EXAMPLES:
 * 
 * // 1. Check if assist prompt needed after made shot
 * const result = PlayEngine.analyzeEvent(madeShot, flags);
 * if (result.shouldPrompt && result.promptType === 'assist') {
 *   showAssistPrompt(result.metadata);
 * }
 * 
 * // 2. Auto-create turnover for steal
 * const turnover = PlayEngine.generateTurnoverForSteal(stealEvent, opponentTeamId);
 * await recordStat(turnover);
 * 
 * // 3. Create free throw sequence
 * const ftSequence = PlayEngine.createFreeThrowSequence(
 *   shooterId, 
 *   teamId, 
 *   'shooting', 
 *   'three_pointer'
 * );
 * showFreeThrowModal(ftSequence);
 * 
 * // 4. Link assist to shot
 * const linkedEvent = PlayEngine.createLinkedEvent(
 *   shotId, 
 *   assistId, 
 *   'assist'
 * );
 */
