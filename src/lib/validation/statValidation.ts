/**
 * Stat Validation Utilities
 * 
 * Provides validation for basketball statistics with soft warnings for unusual
 * values and hard errors for impossible values.
 */

export interface StatLimits {
  min: number;
  max: number;
  warningThreshold: number; // Values above this show a warning
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
}

/**
 * Stat type limits based on realistic basketball gameplay
 */
export const STAT_LIMITS: Record<string, StatLimits> = {
  // Scoring
  points: { min: 0, max: 100, warningThreshold: 50 },
  field_goal: { min: 0, max: 50, warningThreshold: 30 },
  three_pointer: { min: 0, max: 20, warningThreshold: 12 },
  free_throw: { min: 0, max: 30, warningThreshold: 20 },
  
  // Rebounds
  rebound: { min: 0, max: 40, warningThreshold: 25 },
  offensive_rebound: { min: 0, max: 20, warningThreshold: 12 },
  defensive_rebound: { min: 0, max: 30, warningThreshold: 20 },
  
  // Assists
  assist: { min: 0, max: 30, warningThreshold: 20 },
  
  // Defense
  steal: { min: 0, max: 15, warningThreshold: 10 },
  block: { min: 0, max: 15, warningThreshold: 10 },
  
  // Negative stats
  turnover: { min: 0, max: 20, warningThreshold: 12 },
  foul: { min: 0, max: 6, warningThreshold: 5 }, // Hard limit at 6 (fouled out)
};

/**
 * Quarter validation limits
 */
export const QUARTER_LIMITS = {
  min: 1,
  max: 8, // Includes up to 4 overtime periods
};

/**
 * Validate a stat value against defined limits
 * @param statType - Type of stat (e.g., 'three_pointer', 'rebound')
 * @param value - The stat value to validate
 * @returns Validation result with error/warning messages
 */
export function validateStatValue(
  statType: string,
  value: number
): ValidationResult {
  // Get limits for this stat type
  const limits = STAT_LIMITS[statType];
  
  if (!limits) {
    // Unknown stat type - allow it but warn
    return {
      valid: true,
      warning: `Unknown stat type: ${statType}. Proceeding without validation.`
    };
  }

  // Hard error: negative values
  if (value < limits.min) {
    return {
      valid: false,
      error: `${formatStatType(statType)} cannot be negative.`
    };
  }

  // Hard error: exceeds maximum
  if (value > limits.max) {
    return {
      valid: false,
      error: `${formatStatType(statType)} cannot exceed ${limits.max}. Current value: ${value}.`
    };
  }

  // Special case: fouls at exactly 6 should warn about fouling out
  if (statType === 'foul' && value === 6) {
    return {
      valid: true,
      warning: `Player has fouled out (6 fouls). They should be substituted.`
    };
  }

  // Soft warning: unusual but not impossible
  if (value > limits.warningThreshold) {
    return {
      valid: true,
      warning: `Unusually high ${formatStatType(statType)}: ${value}. Double-check this value.`
    };
  }

  // All good
  return { valid: true };
}

/**
 * Validate quarter number
 * @param quarter - Quarter number to validate
 * @returns Validation result
 */
export function validateQuarter(quarter: number): ValidationResult {
  if (quarter < QUARTER_LIMITS.min) {
    return {
      valid: false,
      error: 'Quarter cannot be less than 1.'
    };
  }

  if (quarter > QUARTER_LIMITS.max) {
    return {
      valid: false,
      error: `Quarter cannot exceed ${QUARTER_LIMITS.max} (regulation + ${QUARTER_LIMITS.max - 4} OT periods).`
    };
  }

  if (quarter > 4) {
    return {
      valid: true,
      warning: `Game in overtime (Period ${quarter - 4}).`
    };
  }

  return { valid: true };
}

/**
 * Get limits for a specific stat type
 * @param statType - The stat type
 * @returns Stat limits or null if not found
 */
export function getStatLimits(statType: string): StatLimits | null {
  return STAT_LIMITS[statType] || null;
}

/**
 * Format stat type for display in messages
 * @param statType - Raw stat type (e.g., 'three_pointer')
 * @returns Formatted string (e.g., '3-Pointers')
 */
function formatStatType(statType: string): string {
  const formatted: Record<string, string> = {
    points: 'Points',
    field_goal: '2-Point Field Goals',
    three_pointer: '3-Pointers',
    free_throw: 'Free Throws',
    rebound: 'Rebounds',
    offensive_rebound: 'Offensive Rebounds',
    defensive_rebound: 'Defensive Rebounds',
    assist: 'Assists',
    steal: 'Steals',
    block: 'Blocks',
    turnover: 'Turnovers',
    foul: 'Fouls',
  };

  return formatted[statType] || statType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Calculate total stats for a player and validate consistency
 * Useful for catching data entry errors
 */
export function validatePlayerTotals(stats: {
  fieldGoalMade: number;
  threePointerMade: number;
  freeThrowMade: number;
  totalPoints: number;
}): ValidationResult {
  const calculatedPoints = 
    (stats.fieldGoalMade * 2) + 
    (stats.threePointerMade * 3) + 
    (stats.freeThrowMade * 1);

  if (calculatedPoints !== stats.totalPoints) {
    return {
      valid: false,
      error: `Point total mismatch. Calculated: ${calculatedPoints}, Recorded: ${stats.totalPoints}.`
    };
  }

  return { valid: true };
}

