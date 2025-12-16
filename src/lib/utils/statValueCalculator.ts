/**
 * statValueCalculator - Calculate stat_value for game_stats
 * 
 * PURPOSE:
 * - Centralized logic for calculating stat_value
 * - Used by useTracker and StatCreateForm
 * - Ensures consistency across stat creation paths
 * 
 * Follows .cursorrules: Business logic in utils
 */

/**
 * Calculate stat_value based on stat type and modifier
 * 
 * @param statType - The type of stat (field_goal, three_pointer, etc.)
 * @param modifier - The modifier (made, missed, offensive, etc.)
 * @returns The calculated stat_value for database storage
 */
export function calculateStatValue(statType: string, modifier: string | null): number {
  // Made shots = points scored
  if (statType === 'field_goal' && modifier === 'made') {
    return 2;
  }
  if (statType === 'three_pointer' && modifier === 'made') {
    return 3;
  }
  if (statType === 'free_throw' && modifier === 'made') {
    return 1;
  }
  
  // Missed shots = 0 points (but tracked as attempt)
  if (modifier === 'missed') {
    return 0;
  }
  
  // All other stats (rebounds, assists, steals, blocks, fouls, turnovers) = 1
  return 1;
}
