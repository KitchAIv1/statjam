/**
 * PlayEngine - Event Sequence Automation
 * 
 * Purpose: Prompt for assists/rebounds/blocks, link events
 * Phase 1: STUB (no-op, returns no prompts)
 * Phase 4: Full implementation
 * 
 * Pure function - no side effects, no DB calls
 * 
 * @module playEngine
 */

import { Ruleset } from '@/lib/types/ruleset';
import { SequenceAutomationFlags } from '@/lib/types/automation';

export interface PlayEvent {
  type: 'field_goal' | 'three_pointer' | 'free_throw' | 'foul';
  modifier: 'made' | 'missed' | 'personal' | 'shooting' | 'technical' | 'flagrant';
  playerId: string;
  teamId: string;
}

export interface PlayEnginePrompt {
  type: 'assist' | 'rebound' | 'block' | 'foul_type' | 'free_throw_count';
  message: string;
  options?: string[];
}

export interface PlayEngineResult {
  prompts: PlayEnginePrompt[];
  linkedEvents: Array<{
    type: string;
    playerId?: string;
    linkedTo: string; // Event ID to link to
  }>;
  sequenceId: string | null;
  actions: string[];
}

export class PlayEngine {
  /**
   * Process play event
   * 
   * Phase 1: STUB - returns no prompts
   * Phase 4: Implements assist/rebound/block prompts
   * 
   * @param event - Play event that occurred
   * @param ruleset - Game ruleset
   * @param flags - Automation flags
   * @returns Prompts and linked events
   * 
   * @example
   * ```typescript
   * const result = PlayEngine.processEvent(
   *   { type: 'field_goal', modifier: 'made', playerId: 'p1', teamId: 't1' },
   *   NBA_RULESET,
   *   { enabled: true, promptAssists: true }
   * );
   * 
   * // Phase 1: result.prompts === [] (no prompts)
   * // Phase 4: result.prompts === [{ type: 'assist', message: 'Was there an assist?' }]
   * ```
   */
  static processEvent(
    event: PlayEvent,
    ruleset: Ruleset,
    flags: SequenceAutomationFlags
  ): PlayEngineResult {
    // ✅ PHASE 1 STUB: Return no prompts
    
    if (!flags.enabled) {
      return {
        prompts: [],
        linkedEvents: [],
        sequenceId: null,
        actions: []
      };
    }
    
    // ✅ PHASE 1: Even with flags ON, return no-op
    // Phase 4 will implement actual logic here
    
    console.log('[PlayEngine] Phase 1 stub - no automation yet', {
      event,
      ruleset: ruleset.id,
      flags
    });
    
    return {
      prompts: [],
      linkedEvents: [],
      sequenceId: null,
      actions: []
    };
  }
  
  /**
   * Check if assist prompt should appear
   * 
   * Phase 1: STUB - returns false
   * Phase 4: Returns true for made shots
   * 
   * @param event - Play event
   * @param flags - Automation flags
   * @returns True if assist prompt should appear
   */
  static shouldPromptAssist(
    event: PlayEvent,
    flags: SequenceAutomationFlags
  ): boolean {
    // ✅ PHASE 1 STUB: Always return false
    return false;
  }
  
  /**
   * Check if rebound prompt should appear
   * 
   * Phase 1: STUB - returns false
   * Phase 4: Returns true for missed shots
   * 
   * @param event - Play event
   * @param flags - Automation flags
   * @returns True if rebound prompt should appear
   */
  static shouldPromptRebound(
    event: PlayEvent,
    flags: SequenceAutomationFlags
  ): boolean {
    // ✅ PHASE 1 STUB: Always return false
    return false;
  }
  
  /**
   * Check if block prompt should appear
   * 
   * Phase 1: STUB - returns false
   * Phase 4: Returns true for missed shots
   * 
   * @param event - Play event
   * @param flags - Automation flags
   * @returns True if block prompt should appear
   */
  static shouldPromptBlock(
    event: PlayEvent,
    flags: SequenceAutomationFlags
  ): boolean {
    // ✅ PHASE 1 STUB: Always return false
    return false;
  }
  
  /**
   * Generate sequence ID for linked events
   * 
   * Phase 1: STUB - returns null
   * Phase 4: Generates UUID for sequence
   * 
   * @returns Sequence ID or null
   */
  static generateSequenceId(): string | null {
    // ✅ PHASE 1 STUB: Return null (no sequences yet)
    return null;
  }
}

