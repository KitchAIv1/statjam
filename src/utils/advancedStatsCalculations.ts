/**
 * Advanced Stats Calculations for Coach Analytics
 * 
 * Includes NBA-level metrics:
 * - VPS (Versatility Performance Score)
 * - Offensive/Defensive Rating
 * - Usage Rate
 * - Plus/Minus
 * - Advanced efficiency metrics
 * 
 * @module advancedStatsCalculations
 */

export interface PlayerGameStats {
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  fgMade: number;
  fgAttempted: number;
  threePtMade: number;
  threePtAttempted: number;
  ftMade: number;
  ftAttempted: number;
  minutesPlayed?: number;
}

export interface TeamGameStats {
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointersMade: number;
  threePointersAttempted: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  possessions?: number;
}

/**
 * Calculate VPS (Versatility Performance Score)
 * 
 * Formula: (PTS + REB + AST + STL + BLK) - (FGA - FGM) - (FTA - FTM) - TO
 * 
 * Measures a player's all-around contribution across multiple stat categories.
 * Higher scores indicate more versatile, well-rounded players.
 * 
 * @param stats - Player game statistics
 * @returns VPS score (can be negative for poor performances)
 */
export function calculateVPS(stats: PlayerGameStats): number {
  const {
    points,
    rebounds,
    assists,
    steals,
    blocks,
    fgMade,
    fgAttempted,
    ftMade,
    ftAttempted,
    turnovers
  } = stats;

  // Positive contributions
  const positiveContributions = points + rebounds + assists + steals + blocks;
  
  // Negative contributions
  const missedFieldGoals = fgAttempted - fgMade;
  const missedFreeThrows = ftAttempted - ftMade;
  const negativeContributions = missedFieldGoals + missedFreeThrows + turnovers;
  
  const vps = positiveContributions - negativeContributions;
  
  return Math.round(vps * 10) / 10; // One decimal place
}

/**
 * Calculate Offensive Rating
 * 
 * Formula: (Points Produced / Possessions Used) * 100
 * Simplified version: (PTS / (FGA + 0.44 * FTA + TO)) * 100
 * 
 * @param stats - Player game statistics
 * @returns Offensive rating (points per 100 possessions)
 */
export function calculateOffensiveRating(stats: PlayerGameStats): number {
  const { points, fgAttempted, ftAttempted, turnovers } = stats;
  
  const possessionsUsed = fgAttempted + (0.44 * ftAttempted) + turnovers;
  
  if (possessionsUsed === 0) return 0;
  
  const offensiveRating = (points / possessionsUsed) * 100;
  
  return Math.round(offensiveRating * 10) / 10;
}

/**
 * Calculate Usage Rate
 * 
 * Formula: ((FGA + 0.44 * FTA + TO) / Minutes) * (Team Minutes / 5) * 100
 * Simplified: (FGA + 0.44 * FTA + TO) / Team Possessions * 100
 * 
 * @param stats - Player game statistics
 * @param teamStats - Team game statistics
 * @returns Usage rate percentage
 */
export function calculateUsageRate(
  stats: PlayerGameStats,
  teamStats: TeamGameStats
): number {
  const { fgAttempted, ftAttempted, turnovers } = stats;
  
  const playerPossessions = fgAttempted + (0.44 * ftAttempted) + turnovers;
  const teamPossessions = teamStats.possessions || 
    (teamStats.fieldGoalsAttempted + (0.44 * teamStats.freeThrowsAttempted) + teamStats.turnovers);
  
  if (teamPossessions === 0) return 0;
  
  const usageRate = (playerPossessions / teamPossessions) * 100;
  
  return Math.round(usageRate * 10) / 10;
}

/**
 * Calculate Team Offensive Rating
 * 
 * Formula: (Total Points / Total Possessions) * 100
 * 
 * @param teamStats - Team game statistics
 * @param totalPoints - Total points scored
 * @returns Team offensive rating
 */
export function calculateTeamOffensiveRating(
  teamStats: TeamGameStats,
  totalPoints: number
): number {
  const possessions = teamStats.possessions || 
    (teamStats.fieldGoalsAttempted + (0.44 * teamStats.freeThrowsAttempted) + teamStats.turnovers);
  
  if (possessions === 0) return 0;
  
  const offensiveRating = (totalPoints / possessions) * 100;
  
  return Math.round(offensiveRating * 10) / 10;
}

/**
 * Calculate Team Defensive Rating
 * 
 * Formula: (Opponent Points / Total Possessions) * 100
 * 
 * @param opponentPoints - Opponent's total points
 * @param teamStats - Team game statistics (for possessions)
 * @returns Team defensive rating
 */
export function calculateTeamDefensiveRating(
  opponentPoints: number,
  teamStats: TeamGameStats
): number {
  const possessions = teamStats.possessions || 
    (teamStats.fieldGoalsAttempted + (0.44 * teamStats.freeThrowsAttempted) + teamStats.turnovers);
  
  if (possessions === 0) return 0;
  
  const defensiveRating = (opponentPoints / possessions) * 100;
  
  return Math.round(defensiveRating * 10) / 10;
}

/**
 * Calculate Pace (Possessions per game)
 * 
 * Formula: (Team Possessions + Opponent Possessions) / 2
 * 
 * @param teamStats - Team game statistics
 * @param opponentStats - Opponent game statistics
 * @returns Pace (possessions per game)
 */
export function calculatePace(
  teamStats: TeamGameStats,
  opponentStats: TeamGameStats
): number {
  const teamPossessions = teamStats.possessions || 
    (teamStats.fieldGoalsAttempted + (0.44 * teamStats.freeThrowsAttempted) + teamStats.turnovers);
  
  const opponentPossessions = opponentStats.possessions || 
    (opponentStats.fieldGoalsAttempted + (0.44 * opponentStats.freeThrowsAttempted) + opponentStats.turnovers);
  
  const pace = (teamPossessions + opponentPossessions) / 2;
  
  return Math.round(pace * 10) / 10;
}

/**
 * Calculate Assist-to-Turnover Ratio
 * 
 * @param assists - Total assists
 * @param turnovers - Total turnovers
 * @returns Assist-to-turnover ratio
 */
export function calculateAssistToTurnoverRatio(
  assists: number,
  turnovers: number
): number {
  if (turnovers === 0) return assists > 0 ? 99.9 : 0; // Max ratio if no turnovers
  
  const ratio = assists / turnovers;
  
  return Math.round(ratio * 10) / 10;
}

/**
 * Calculate Assist Percentage
 * 
 * Formula: (AST / FGM) * 100
 * 
 * @param assists - Total assists
 * @param fieldGoalsMade - Total field goals made
 * @returns Assist percentage
 */
export function calculateAssistPercentage(
  assists: number,
  fieldGoalsMade: number
): number {
  if (fieldGoalsMade === 0) return 0;
  
  const assistPercentage = (assists / fieldGoalsMade) * 100;
  
  return Math.round(assistPercentage * 10) / 10;
}

/**
 * Calculate Three-Point Attempt Rate
 * 
 * Formula: (3PA / FGA) * 100
 * 
 * @param threePtAttempted - Three-point attempts
 * @param fieldGoalsAttempted - Total field goal attempts
 * @returns Three-point attempt rate percentage
 */
export function calculateThreePointAttemptRate(
  threePtAttempted: number,
  fieldGoalsAttempted: number
): number {
  if (fieldGoalsAttempted === 0) return 0;
  
  const rate = (threePtAttempted / fieldGoalsAttempted) * 100;
  
  return Math.round(rate * 10) / 10;
}

/**
 * Calculate Free Throw Rate
 * 
 * Formula: (FTA / FGA) * 100
 * 
 * @param ftAttempted - Free throw attempts
 * @param fieldGoalsAttempted - Field goal attempts
 * @returns Free throw rate percentage
 */
export function calculateFreeThrowRate(
  ftAttempted: number,
  fieldGoalsAttempted: number
): number {
  if (fieldGoalsAttempted === 0) return 0;
  
  const rate = (ftAttempted / fieldGoalsAttempted) * 100;
  
  return Math.round(rate * 10) / 10;
}

/**
 * Determine player strengths based on stats
 * 
 * @param stats - Player game statistics
 * @returns Array of strength categories
 */
export function determinePlayerStrengths(stats: PlayerGameStats): string[] {
  const strengths: string[] = [];
  
  // Calculate percentages
  const fgPercentage = stats.fgAttempted > 0 ? (stats.fgMade / stats.fgAttempted) * 100 : 0;
  const threePtPercentage = stats.threePtAttempted > 0 ? (stats.threePtMade / stats.threePtAttempted) * 100 : 0;
  const ftPercentage = stats.ftAttempted > 0 ? (stats.ftMade / stats.ftAttempted) * 100 : 0;
  
  // Scoring
  if (stats.points >= 15) strengths.push('Scoring');
  if (fgPercentage >= 50) strengths.push('FG% Efficiency');
  if (threePtPercentage >= 40 && stats.threePtAttempted >= 3) strengths.push('3PT Shooting');
  if (ftPercentage >= 80 && stats.ftAttempted >= 3) strengths.push('FT Shooting');
  
  // Rebounding
  if (stats.rebounds >= 8) strengths.push('Rebounding');
  
  // Playmaking
  if (stats.assists >= 5) strengths.push('Playmaking');
  
  // Defense
  if (stats.steals >= 2) strengths.push('Steals');
  if (stats.blocks >= 2) strengths.push('Shot Blocking');
  
  // Ball security
  if (stats.turnovers <= 2 && stats.assists >= 3) strengths.push('Ball Security');
  
  return strengths;
}

/**
 * Determine player weaknesses based on stats
 * 
 * @param stats - Player game statistics
 * @returns Array of weakness categories
 */
export function determinePlayerWeaknesses(stats: PlayerGameStats): string[] {
  const weaknesses: string[] = [];
  
  // Calculate percentages
  const fgPercentage = stats.fgAttempted > 0 ? (stats.fgMade / stats.fgAttempted) * 100 : 0;
  const threePtPercentage = stats.threePtAttempted > 0 ? (stats.threePtMade / stats.threePtAttempted) * 100 : 0;
  const ftPercentage = stats.ftAttempted > 0 ? (stats.ftMade / stats.ftAttempted) * 100 : 0;
  
  // Shooting efficiency
  if (fgPercentage < 35 && stats.fgAttempted >= 5) weaknesses.push('FG% Efficiency');
  if (threePtPercentage < 30 && stats.threePtAttempted >= 3) weaknesses.push('3PT Shooting');
  if (ftPercentage < 65 && stats.ftAttempted >= 3) weaknesses.push('FT Shooting');
  
  // Turnovers
  if (stats.turnovers >= 4) weaknesses.push('Turnovers');
  
  // Fouls
  if (stats.fouls >= 4) weaknesses.push('Foul Trouble');
  
  // Low production
  if (stats.points < 5 && stats.rebounds < 3 && stats.assists < 2) weaknesses.push('Low Production');
  
  return weaknesses;
}

