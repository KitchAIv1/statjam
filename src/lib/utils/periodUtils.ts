/**
 * Period Utilities - Display helpers for game periods
 * 
 * Provides consistent period labeling across the app:
 * - Quarters: Q1, Q2, Q3, Q4
 * - Halves: H1, H2
 * - Overtime: OT1, OT2, etc.
 * 
 * Follows .cursorrules: Single responsibility, <100 lines
 */

/**
 * Get display label for a period (Q1, H2, OT1, etc.)
 * 
 * @param period - Current period number (1-based)
 * @param periodsPerGame - Number of regulation periods (4 for quarters, 2 for halves)
 * @returns Display string like "Q1", "H2", "OT1"
 */
export function getPeriodLabel(
  period: number,
  periodsPerGame: number = 4
): string {
  if (period > periodsPerGame) {
    return `OT${period - periodsPerGame}`;
  }
  return periodsPerGame === 2 ? `H${period}` : `Q${period}`;
}

/**
 * Get full period name for accessibility/display
 * 
 * @param period - Current period number
 * @param periodsPerGame - Number of regulation periods
 * @returns Full name like "1st Quarter", "2nd Half", "Overtime 1"
 */
export function getPeriodFullName(
  period: number,
  periodsPerGame: number = 4
): string {
  if (period > periodsPerGame) {
    const otNumber = period - periodsPerGame;
    return otNumber === 1 ? 'Overtime' : `Overtime ${otNumber}`;
  }
  
  const ordinal = getOrdinal(period);
  const periodType = periodsPerGame === 2 ? 'Half' : 'Quarter';
  return `${ordinal} ${periodType}`;
}

/**
 * Check if period is overtime
 */
export function isOvertimePeriod(
  period: number,
  periodsPerGame: number = 4
): boolean {
  return period > periodsPerGame;
}

/**
 * Check if this is the final regulation period
 */
export function isFinalRegulationPeriod(
  period: number,
  periodsPerGame: number = 4
): boolean {
  return period === periodsPerGame;
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, 4th)
 */
function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

