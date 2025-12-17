/**
 * statTypes - Shared constants for stat types and modifiers
 * 
 * PURPOSE:
 * - Single source of truth for stat type options
 * - Used by StatCreateForm, StatEditForm, and other stat-related components
 * 
 * Follows .cursorrules: Constants in separate file
 */

export const STAT_TYPES = [
  { value: 'field_goal', label: '2PT Field Goal' },
  { value: 'three_pointer', label: '3PT Shot' },
  { value: 'free_throw', label: 'Free Throw' },
  { value: 'rebound', label: 'Rebound' },
  { value: 'assist', label: 'Assist' },
  { value: 'steal', label: 'Steal' },
  { value: 'block', label: 'Block' },
  { value: 'turnover', label: 'Turnover' },
  { value: 'foul', label: 'Foul' }
] as const;

export const MODIFIERS_BY_TYPE: Record<string, readonly string[]> = {
  field_goal: ['made', 'missed'],
  three_pointer: ['made', 'missed'],
  free_throw: ['made', 'missed'],
  rebound: ['offensive', 'defensive'],
  foul: ['personal', 'shooting', 'technical', 'offensive', 'flagrant', '1-and-1'],
  turnover: ['bad_pass', 'travel', 'offensive_foul', 'steal', 'double_dribble', 'lost_ball', 'out_of_bounds'],
  assist: [],
  steal: [],
  block: []
} as const;

/**
 * Get available modifiers for a given stat type
 */
export function getModifiersForStatType(statType: string): readonly string[] {
  return MODIFIERS_BY_TYPE[statType] || [];
}
