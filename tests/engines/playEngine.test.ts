/**
 * PlayEngine Tests
 * 
 * These tests verify the core game logic for:
 * - Assist prompts after made shots
 * - Rebound prompts after missed shots
 * - Free throw sequence logic
 * - Turnover generation for steals
 * - Event validation
 */

import { describe, it, expect } from 'vitest'
import { 
  PlayEngine, 
  GameEvent, 
  PlaySequenceFlags,
  FreeThrowSequence 
} from '@/lib/engines/playEngine'

// ============================================================================
// TEST DATA
// ============================================================================

const enabledFlags: PlaySequenceFlags = {
  enabled: true,
  promptAssists: true,
  promptRebounds: true,
  promptBlocks: true,
  linkEvents: true,
  freeThrowSequence: true,
}

const disabledFlags: PlaySequenceFlags = {
  enabled: false,
  promptAssists: false,
  promptRebounds: false,
  promptBlocks: false,
  linkEvents: false,
  freeThrowSequence: false,
}

const createEvent = (overrides: Partial<GameEvent> = {}): GameEvent => ({
  statType: 'field_goal',
  playerId: 'player-1',
  teamId: 'team-a',
  quarter: 1,
  gameTimeSeconds: 300,
  ...overrides,
})

// ============================================================================
// ASSIST PROMPT TESTS
// ============================================================================

describe('PlayEngine - Assist Prompts', () => {
  it('should prompt for assist after made field goal', () => {
    const event = createEvent({ 
      statType: 'field_goal', 
      modifier: 'made' 
    })
    
    const result = PlayEngine.analyzeEvent(event, enabledFlags)
    
    expect(result.shouldPrompt).toBe(true)
    expect(result.promptType).toBe('assist')
    expect(result.metadata?.shotType).toBe('field_goal')
  })

  it('should prompt for assist after made three pointer', () => {
    const event = createEvent({ 
      statType: 'three_pointer', 
      modifier: 'made' 
    })
    
    const result = PlayEngine.analyzeEvent(event, enabledFlags)
    
    expect(result.shouldPrompt).toBe(true)
    expect(result.promptType).toBe('assist')
  })

  it('should NOT prompt for assist after missed shot', () => {
    const event = createEvent({ 
      statType: 'field_goal', 
      modifier: 'missed' 
    })
    
    const result = PlayEngine.analyzeEvent(event, enabledFlags)
    
    // Missed shots trigger rebound prompts, not assist
    expect(result.promptType).not.toBe('assist')
  })

  it('should NOT prompt for assist when automation disabled', () => {
    const event = createEvent({ 
      statType: 'field_goal', 
      modifier: 'made' 
    })
    
    const result = PlayEngine.analyzeEvent(event, disabledFlags)
    
    expect(result.shouldPrompt).toBe(false)
  })
})

// ============================================================================
// REBOUND PROMPT TESTS
// ============================================================================

describe('PlayEngine - Rebound Prompts', () => {
  it('should prompt for rebound after missed field goal', () => {
    const event = createEvent({ 
      statType: 'field_goal', 
      modifier: 'missed' 
    })
    
    const result = PlayEngine.analyzeEvent(event, enabledFlags)
    
    expect(result.shouldPrompt).toBe(true)
    expect(result.promptType).toBe('rebound')
  })

  it('should prompt for rebound after missed three pointer', () => {
    const event = createEvent({ 
      statType: 'three_pointer', 
      modifier: 'missed' 
    })
    
    const result = PlayEngine.analyzeEvent(event, enabledFlags)
    
    expect(result.shouldPrompt).toBe(true)
    expect(result.promptType).toBe('rebound')
  })

  it('should prompt for rebound after missed free throw', () => {
    const event = createEvent({ 
      statType: 'free_throw', 
      modifier: 'missed' 
    })
    
    const result = PlayEngine.analyzeEvent(event, enabledFlags)
    
    expect(result.shouldPrompt).toBe(true)
    expect(result.promptType).toBe('rebound')
  })

  it('should include shooter info in rebound metadata', () => {
    const event = createEvent({ 
      statType: 'field_goal', 
      modifier: 'missed',
      playerId: 'shooter-123',
      teamId: 'team-a'
    })
    
    const result = PlayEngine.analyzeEvent(event, enabledFlags)
    
    expect(result.metadata?.shooterId).toBe('shooter-123')
    expect(result.metadata?.shooterTeamId).toBe('team-a')
  })
})

// ============================================================================
// BLOCK LOGIC TESTS
// ============================================================================

describe('PlayEngine - Block Detection', () => {
  it('should detect blockable shots (field goals)', () => {
    const event = createEvent({ 
      statType: 'field_goal', 
      modifier: 'missed' 
    })
    
    const canBlock = PlayEngine.shouldPromptBlock(event)
    
    expect(canBlock).toBe(true)
  })

  it('should NOT detect blockable free throws', () => {
    const event = createEvent({ 
      statType: 'free_throw', 
      modifier: 'missed' 
    })
    
    const canBlock = PlayEngine.shouldPromptBlock(event)
    
    expect(canBlock).toBe(false)
  })

  it('should prompt for shot type after block is recorded', () => {
    const event = createEvent({ 
      statType: 'block',
      playerId: 'blocker-1'
    })
    
    const result = PlayEngine.analyzeEvent(event, enabledFlags)
    
    expect(result.shouldPrompt).toBe(true)
    expect(result.promptType).toBe('missed_shot_type')
    expect(result.metadata?.blockerId).toBe('blocker-1')
  })
})

// ============================================================================
// STEAL/TURNOVER TESTS
// ============================================================================

describe('PlayEngine - Steal and Turnover', () => {
  it('should flag steal for turnover generation', () => {
    const event = createEvent({ 
      statType: 'steal',
      playerId: 'stealer-1',
      teamId: 'team-a'
    })
    
    const result = PlayEngine.analyzeEvent(event, enabledFlags)
    
    expect(result.metadata?.shouldGenerateTurnover).toBe(true)
    expect(result.metadata?.stealerId).toBe('stealer-1')
    expect(result.metadata?.stealerTeamId).toBe('team-a')
  })

  it('should generate correct turnover event for steal', () => {
    const stealEvent = createEvent({ 
      statType: 'steal',
      playerId: 'stealer-1',
      teamId: 'team-a',
      quarter: 2,
      gameTimeSeconds: 180
    })
    
    const turnover = PlayEngine.generateTurnoverForSteal(stealEvent, 'team-b')
    
    expect(turnover.statType).toBe('turnover')
    expect(turnover.modifier).toBe('steal')
    expect(turnover.teamId).toBe('team-b') // Turnover to opponent
    expect(turnover.quarter).toBe(2)
    expect(turnover.gameTimeSeconds).toBe(180)
  })
})

// ============================================================================
// FREE THROW SEQUENCE TESTS
// ============================================================================

describe('PlayEngine - Free Throw Sequences', () => {
  it('should create 2-shot sequence for shooting foul on 2-pointer', () => {
    const sequence = PlayEngine.createFreeThrowSequence(
      'shooter-1',
      'team-a',
      'shooting',
      'field_goal'
    )
    
    expect(sequence.totalAttempts).toBe(2)
    expect(sequence.currentAttempt).toBe(0)
    expect(sequence.foulType).toBe('shooting')
  })

  it('should create 3-shot sequence for shooting foul on 3-pointer', () => {
    const sequence = PlayEngine.createFreeThrowSequence(
      'shooter-1',
      'team-a',
      'shooting',
      'three_pointer'
    )
    
    expect(sequence.totalAttempts).toBe(3)
  })

  it('should create 1-shot sequence for technical foul', () => {
    const sequence = PlayEngine.createFreeThrowSequence(
      'shooter-1',
      'team-a',
      'technical'
    )
    
    expect(sequence.totalAttempts).toBe(1)
  })

  it('should create 2-shot sequence for flagrant foul', () => {
    const sequence = PlayEngine.createFreeThrowSequence(
      'shooter-1',
      'team-a',
      'flagrant'
    )
    
    expect(sequence.totalAttempts).toBe(2)
  })

  it('should advance free throw sequence correctly', () => {
    let sequence = PlayEngine.createFreeThrowSequence(
      'shooter-1',
      'team-a',
      'shooting'
    )
    
    expect(sequence.currentAttempt).toBe(0)
    
    sequence = PlayEngine.advanceFreeThrowSequence(sequence)
    expect(sequence.currentAttempt).toBe(1)
    
    sequence = PlayEngine.advanceFreeThrowSequence(sequence)
    expect(sequence.currentAttempt).toBe(2)
  })

  it('should detect when free throw sequence is complete', () => {
    let sequence = PlayEngine.createFreeThrowSequence(
      'shooter-1',
      'team-a',
      'shooting'
    )
    
    expect(PlayEngine.isFreeThrowSequenceComplete(sequence)).toBe(false)
    
    sequence = PlayEngine.advanceFreeThrowSequence(sequence) // 1
    sequence = PlayEngine.advanceFreeThrowSequence(sequence) // 2
    
    expect(PlayEngine.isFreeThrowSequenceComplete(sequence)).toBe(true)
  })
})

// ============================================================================
// FOUL TYPE DETECTION TESTS
// ============================================================================

describe('PlayEngine - Foul Type Detection', () => {
  it('should detect technical foul', () => {
    const event = createEvent({ 
      statType: 'foul',
      modifier: 'technical'
    })
    
    const foulType = PlayEngine.determineFoulType(event)
    
    expect(foulType).toBe('technical')
  })

  it('should detect flagrant foul', () => {
    const event = createEvent({ 
      statType: 'foul',
      modifier: 'flagrant'
    })
    
    const foulType = PlayEngine.determineFoulType(event)
    
    expect(foulType).toBe('flagrant')
  })

  it('should detect 1-and-1 (bonus) foul', () => {
    const event = createEvent({ 
      statType: 'foul',
      modifier: '1-and-1'
    })
    
    const foulType = PlayEngine.determineFoulType(event)
    
    expect(foulType).toBe('1-and-1')
  })

  it('should default to shooting foul', () => {
    const event = createEvent({ 
      statType: 'foul',
      modifier: 'personal'
    })
    
    const foulType = PlayEngine.determineFoulType(event)
    
    expect(foulType).toBe('shooting')
  })
})

// ============================================================================
// EVENT VALIDATION TESTS
// ============================================================================

describe('PlayEngine - Event Validation', () => {
  it('should validate events in same quarter', () => {
    const event1 = createEvent({ quarter: 1, gameTimeSeconds: 300 })
    const event2 = createEvent({ quarter: 1, gameTimeSeconds: 298 })
    
    const validation = PlayEngine.validateEventLink(event1, event2)
    
    expect(validation.valid).toBe(true)
  })

  it('should reject events in different quarters', () => {
    const event1 = createEvent({ quarter: 1 })
    const event2 = createEvent({ quarter: 2 })
    
    const validation = PlayEngine.validateEventLink(event1, event2)
    
    expect(validation.valid).toBe(false)
    expect(validation.error).toBe('Events in different quarters')
  })

  it('should reject events too far apart in time', () => {
    const event1 = createEvent({ quarter: 1, gameTimeSeconds: 300 })
    const event2 = createEvent({ quarter: 1, gameTimeSeconds: 280 }) // 20 sec apart
    
    const validation = PlayEngine.validateEventLink(event1, event2)
    
    expect(validation.valid).toBe(false)
    expect(validation.error).toBe('Events too far apart in time')
  })

  it('should accept events within 10 seconds', () => {
    const event1 = createEvent({ quarter: 1, gameTimeSeconds: 300 })
    const event2 = createEvent({ quarter: 1, gameTimeSeconds: 291 }) // 9 sec apart
    
    const validation = PlayEngine.validateEventLink(event1, event2)
    
    expect(validation.valid).toBe(true)
  })
})

// ============================================================================
// CUSTOM PLAYER SUPPORT TESTS
// ============================================================================

describe('PlayEngine - Custom Player Support', () => {
  it('should handle custom player in assist prompt', () => {
    const event = createEvent({ 
      statType: 'field_goal', 
      modifier: 'made',
      playerId: '', // No regular player
      customPlayerId: 'custom-player-123'
    })
    
    const result = PlayEngine.analyzeEvent(event, enabledFlags)
    
    expect(result.shouldPrompt).toBe(true)
    expect(result.metadata?.shooterId).toBe('custom-player-123')
  })

  it('should prefer regular player ID over custom player ID', () => {
    const event = createEvent({ 
      statType: 'field_goal', 
      modifier: 'made',
      playerId: 'regular-player',
      customPlayerId: 'custom-player'
    })
    
    const result = PlayEngine.analyzeEvent(event, enabledFlags)
    
    expect(result.metadata?.shooterId).toBe('regular-player')
  })
})

