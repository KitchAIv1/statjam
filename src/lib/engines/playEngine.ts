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
  customPlayerId?: string; // ✅ FIX: Support custom players in automation
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
  promptType: 'assist' | 'rebound' | 'block' | 'turnover' | 'free_throw' | 'missed_shot_type' | null;
  sequenceId?: string;
  linkedEventId?: string;
  metadata?: Record<string, any>;
  actions: string[];
  // ✅ SEQUENTIAL PROMPTS: Support multiple prompts for one event
  promptQueue?: Array<{
    type: 'assist' | 'rebound' | 'block' | 'turnover' | 'free_throw' | 'missed_shot_type';
    sequenceId: string;
    metadata: Record<string, any>;
  }>;
}

// ============================================================================
// PLAY ENGINE
// ============================================================================

export class PlayEngine {
  
  /**
   * Get the actual player ID (either regular or custom)
   * ✅ FIX: Helper to support both regular and custom players in automation
   */
  private static getPlayerIdentifier(event: GameEvent): string {
    return event.playerId || event.customPlayerId || '';
  }

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
        shooterId: this.getPlayerIdentifier(event), // ✅ FIX: Support custom players
        shooterTeamId: event.teamId, // ✅ FIX: Add team ID so modal knows which roster to show
        shooterName: event.playerId || event.customPlayerId || 'Unknown' // For display
      };
      result.actions.push(`Prompt assist for made ${event.statType}`);
    }

    // ✅ MISSED SHOT SEQUENCE: Rebound prompt (blocks removed from auto-sequence)
    // Note: Blocks can still be recorded manually via stat buttons
    const isMissedShot = this.shouldPromptRebound(event) || this.shouldPromptBlock(event);
    
    if (isMissedShot) {
      const sequenceId = uuidv4();
      const promptQueue: Array<{
        type: 'assist' | 'rebound' | 'block' | 'turnover';
        sequenceId: string;
        metadata: Record<string, any>;
      }> = [];
      
      // ✅ REMOVED: Block prompt from auto-sequence
      // Blocks can still be recorded manually via stat buttons, but are no longer
      // part of the automatic missed shot sequence to improve UX and speed up stat entry
      
      // Rebound prompt (required, appears immediately after missed shot)
      if (flags.promptRebounds && this.shouldPromptRebound(event)) {
        promptQueue.push({
          type: 'rebound',
          sequenceId: sequenceId,
          metadata: {
            shotType: event.statType,
            shooterId: this.getPlayerIdentifier(event), // ✅ FIX: Support custom players
            shooterTeamId: event.teamId
          }
        });
        result.actions.push(`Prompt rebound for missed ${event.statType}`);
      }
      
      // Set result with queue
      if (promptQueue.length > 0) {
        result.shouldPrompt = true;
        result.promptType = promptQueue[0].type; // First prompt in queue (rebound)
        result.sequenceId = sequenceId;
        result.metadata = promptQueue[0].metadata;
        result.promptQueue = promptQueue;
      }
    }

    // ✅ BLOCK → MISSED SHOT SEQUENCE
    // When a block is recorded manually, prompt for shot type, then trigger rebound sequence
    if (event.statType === 'block') {
      const sequenceId = uuidv4();
      result.shouldPrompt = true;
      result.promptType = 'missed_shot_type';
      result.sequenceId = sequenceId;
      result.metadata = {
        blockerId: this.getPlayerIdentifier(event),
        blockerTeamId: event.teamId,
        shotType: null // Will be determined by user selection
      };
      result.actions.push(`Prompt for missed shot type after block by player ${this.getPlayerIdentifier(event)}`);
    }

    // ✅ AUTO-GENERATE TURNOVER FOR STEAL
    // When a steal is recorded, automatically create a turnover for the opponent
    if (event.statType === 'steal') {
      result.sequenceId = uuidv4();
      result.metadata = {
        stealerId: this.getPlayerIdentifier(event), // ✅ FIX: Support custom players
        stealerTeamId: event.teamId,
        shouldGenerateTurnover: true
      };
      result.actions.push(`Auto-generate turnover for steal by player ${this.getPlayerIdentifier(event)}`);
    }
    
    // ✅ PHASE 5: FREE THROW SEQUENCE DETECTION
    // NOTE: FT sequences are now triggered manually in the foul flow (handleVictimSelection)
    // This automatic detection is DISABLED to prevent duplicate FT modals
    // 
    // The foul flow is:
    // 1. User selects foul type
    // 2. User selects victim (for shooting fouls)
    // 3. handleVictimSelection manually triggers FT modal via tracker.setPlayPrompt()
    //
    // We keep this code commented for reference but it should NOT run:
    /*
    if (event.statType === 'foul' && flags.freeThrowSequence) {
      const foulType = this.determineFoulType(event);
      const totalShots = this.determineFreeThrowCount(event, foulType);
      
      if (totalShots > 0) {
        result.shouldPrompt = true;
        result.promptType = 'free_throw';
        result.sequenceId = uuidv4();
        result.metadata = {
          shooterId: event.playerId,
          shooterName: event.playerId,
          foulType: foulType,
          totalShots: totalShots,
          foulerId: event.metadata?.foulerId,
          shooterTeamId: event.teamId
        };
        result.actions.push(`Prompt free throw sequence: ${totalShots} shots (${foulType})`);
      }
    }
    */

    return result;
  }
  
  /**
   * Determine the type of foul for free throw purposes
   */
  static determineFoulType(event: GameEvent): '1-and-1' | 'shooting' | 'technical' | 'flagrant' {
    const modifier = event.modifier?.toLowerCase() || '';
    
    if (modifier.includes('technical')) return 'technical';
    if (modifier.includes('flagrant')) return 'flagrant';
    if (modifier.includes('1-and-1') || modifier.includes('bonus')) return '1-and-1';
    if (modifier.includes('shooting')) return 'shooting';
    
    // Default to shooting foul
    return 'shooting';
  }
  
  /**
   * Determine how many free throws should be awarded
   */
  static determineFreeThrowCount(event: GameEvent, foulType: string): number {
    const modifier = event.modifier?.toLowerCase() || '';
    
    // Technical fouls: 1 shot
    if (foulType === 'technical') return 1;
    
    // Flagrant fouls: 2 shots
    if (foulType === 'flagrant') return 2;
    
    // 1-and-1: Up to 2 shots (but handled specially in modal)
    if (foulType === '1-and-1') return 2;
    
    // Shooting fouls: Check shot type from metadata
    if (foulType === 'shooting') {
      // Check if it was a 3-point attempt
      if (modifier.includes('3') || modifier.includes('three')) return 3;
      // Default to 2 shots for shooting fouls
      return 2;
    }
    
    // Default: no free throws
    return 0;
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
