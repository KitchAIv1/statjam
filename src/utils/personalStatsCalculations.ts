/**
 * Personal Stats Calculation Utilities
 * 
 * Provides calculation functions for personal game statistics including
 * shooting percentages, efficiency metrics, and stat validation.
 * 
 * Reuses validation logic from existing stat validation system.
 */

import { validateStatValue, validateQuarter } from '@/lib/validation/statValidation';
import DOMPurify from 'dompurify';

/**
 * Sanitize text input for personal games to prevent XSS attacks
 * Follows pattern from useAuthError.ts
 */
export function sanitizePersonalGameText(text: string): string {
  if (!text) return '';
  if (typeof window === 'undefined') return text.trim();
  
  return DOMPurify.sanitize(text.trim(), {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
}

export interface ShootingStats {
  made: number;
  attempted: number;
  percentage: number;
}

export interface PersonalGameCalculations {
  // Shooting percentages
  fieldGoal: ShootingStats;
  threePoint: ShootingStats;
  freeThrow: ShootingStats;
  
  // Advanced metrics
  effectiveFieldGoalPercentage: number;
  trueShootingPercentage: number;
  
  // Game efficiency
  gameScore: number;
  playerEfficiencyRating: number;
  
  // Summary
  totalShots: number;
  totalMakes: number;
  statLine: string;
}

/**
 * Calculate shooting percentage with proper rounding
 */
export function calculatePercentage(made: number, attempted: number): number {
  if (attempted === 0) return 0;
  return Math.round((made / attempted) * 1000) / 10; // One decimal place
}

/**
 * Calculate effective field goal percentage
 * Formula: (FGM + 0.5 * 3PM) / FGA
 */
export function calculateEffectiveFieldGoalPercentage(
  fgMade: number,
  fgAttempted: number,
  threePtMade: number
): number {
  if (fgAttempted === 0) return 0;
  return Math.round(((fgMade + (0.5 * threePtMade)) / fgAttempted) * 1000) / 10;
}

/**
 * Calculate true shooting percentage
 * Formula: PTS / (2 * (FGA + 0.44 * FTA))
 */
export function calculateTrueShootingPercentage(
  points: number,
  fgAttempted: number,
  ftAttempted: number
): number {
  const denominator = 2 * (fgAttempted + (0.44 * ftAttempted));
  if (denominator === 0) return 0;
  return Math.round((points / denominator) * 1000) / 10;
}

/**
 * Calculate Game Score (simplified version)
 * Formula: PTS + 0.4*FGM - 0.7*FGA - 0.4*(FTA-FTM) + 0.7*REB + 0.7*STL + 0.7*AST + 0.7*BLK - 0.4*PF - TOV
 */
export function calculateGameScore(stats: {
  points: number;
  fgMade: number;
  fgAttempted: number;
  ftMade: number;
  ftAttempted: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  fouls: number;
  turnovers: number;
}): number {
  const {
    points,
    fgMade,
    fgAttempted,
    ftMade,
    ftAttempted,
    rebounds,
    assists,
    steals,
    blocks,
    fouls,
    turnovers
  } = stats;

  const gameScore = points 
    + (0.4 * fgMade) 
    - (0.7 * fgAttempted) 
    - (0.4 * (ftAttempted - ftMade)) 
    + (0.7 * rebounds) 
    + (0.7 * steals) 
    + (0.7 * assists) 
    + (0.7 * blocks) 
    - (0.4 * fouls) 
    - turnovers;

  return Math.round(gameScore * 10) / 10;
}

/**
 * Calculate simplified Player Efficiency Rating for personal games
 * This is a simplified version focusing on basic stats
 */
export function calculatePlayerEfficiencyRating(stats: {
  points: number;
  fgMade: number;
  fgAttempted: number;
  ftMade: number;
  ftAttempted: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  fouls: number;
  turnovers: number;
}): number {
  const {
    points,
    fgMade,
    fgAttempted,
    ftMade,
    ftAttempted,
    rebounds,
    assists,
    steals,
    blocks,
    fouls,
    turnovers
  } = stats;

  // Positive contributions
  const positive = points + rebounds + assists + steals + blocks + fgMade + ftMade;
  
  // Negative contributions
  const negative = fgAttempted - fgMade + ftAttempted - ftMade + fouls + turnovers;
  
  const per = positive - negative;
  return Math.round(per * 10) / 10;
}

/**
 * Generate stat line string (e.g., "24 PTS • 8 REB • 5 AST")
 */
export function generateStatLine(stats: {
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
}): string {
  const { points, rebounds, assists, steals, blocks } = stats;
  
  const statParts = [];
  
  if (points > 0) statParts.push(`${points} PTS`);
  if (rebounds > 0) statParts.push(`${rebounds} REB`);
  if (assists > 0) statParts.push(`${assists} AST`);
  if (steals > 0) statParts.push(`${steals} STL`);
  if (blocks > 0) statParts.push(`${blocks} BLK`);
  
  return statParts.length > 0 ? statParts.join(' • ') : '0 PTS';
}

/**
 * Generate shooting line string (e.g., "8/15 FG, 3/7 3PT, 5/6 FT")
 */
export function generateShootingLine(stats: {
  fgMade: number;
  fgAttempted: number;
  threePtMade: number;
  threePtAttempted: number;
  ftMade: number;
  ftAttempted: number;
}): string {
  const { fgMade, fgAttempted, threePtMade, threePtAttempted, ftMade, ftAttempted } = stats;
  
  const shootingParts = [];
  
  if (fgAttempted > 0) {
    shootingParts.push(`${fgMade}/${fgAttempted} FG`);
  }
  
  if (threePtAttempted > 0) {
    shootingParts.push(`${threePtMade}/${threePtAttempted} 3PT`);
  }
  
  if (ftAttempted > 0) {
    shootingParts.push(`${ftMade}/${ftAttempted} FT`);
  }
  
  return shootingParts.length > 0 ? shootingParts.join(', ') : 'No shots attempted';
}

/**
 * Calculate all personal game statistics
 */
export function calculatePersonalGameStats(gameData: {
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
}): PersonalGameCalculations {
  const {
    points,
    rebounds,
    assists,
    steals,
    blocks,
    turnovers,
    fouls,
    fgMade,
    fgAttempted,
    threePtMade,
    threePtAttempted,
    ftMade,
    ftAttempted
  } = gameData;

  // Calculate shooting stats
  const fieldGoal: ShootingStats = {
    made: fgMade,
    attempted: fgAttempted,
    percentage: calculatePercentage(fgMade, fgAttempted)
  };

  const threePoint: ShootingStats = {
    made: threePtMade,
    attempted: threePtAttempted,
    percentage: calculatePercentage(threePtMade, threePtAttempted)
  };

  const freeThrow: ShootingStats = {
    made: ftMade,
    attempted: ftAttempted,
    percentage: calculatePercentage(ftMade, ftAttempted)
  };

  // Calculate advanced metrics
  const effectiveFieldGoalPercentage = calculateEffectiveFieldGoalPercentage(
    fgMade,
    fgAttempted,
    threePtMade
  );

  const trueShootingPercentage = calculateTrueShootingPercentage(
    points,
    fgAttempted,
    ftAttempted
  );

  const gameScore = calculateGameScore(gameData);
  const playerEfficiencyRating = calculatePlayerEfficiencyRating(gameData);

  // Calculate totals
  const totalShots = fgAttempted + ftAttempted;
  const totalMakes = fgMade + ftMade;

  // Generate stat line
  const statLine = generateStatLine({
    points,
    rebounds,
    assists,
    steals,
    blocks
  });

  return {
    fieldGoal,
    threePoint,
    freeThrow,
    effectiveFieldGoalPercentage,
    trueShootingPercentage,
    gameScore,
    playerEfficiencyRating,
    totalShots,
    totalMakes,
    statLine
  };
}

/**
 * Validate personal game stats using existing validation system
 */
export function validatePersonalGameStats(gameData: {
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
}): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate individual stats using existing validation system
  const statsToValidate = [
    { type: 'points', value: gameData.points },
    { type: 'rebound', value: gameData.rebounds },
    { type: 'assist', value: gameData.assists },
    { type: 'steal', value: gameData.steals },
    { type: 'block', value: gameData.blocks },
    { type: 'turnover', value: gameData.turnovers },
    { type: 'foul', value: gameData.fouls }
  ];

  for (const stat of statsToValidate) {
    const validation = validateStatValue(stat.type, stat.value);
    if (!validation.valid && validation.error) {
      errors.push(validation.error);
    }
    if (validation.warning) {
      warnings.push(validation.warning);
    }
  }

  // Validate shooting ratios
  if (gameData.fgMade > gameData.fgAttempted) {
    errors.push('Field goals made cannot exceed attempts');
  }
  if (gameData.threePtMade > gameData.threePtAttempted) {
    errors.push('3-pointers made cannot exceed attempts');
  }
  if (gameData.ftMade > gameData.ftAttempted) {
    errors.push('Free throws made cannot exceed attempts');
  }

  // Validate 3-pointers are subset of field goals
  if (gameData.threePtMade > gameData.fgMade) {
    errors.push('3-pointers made cannot exceed total field goals made');
  }
  if (gameData.threePtAttempted > gameData.fgAttempted) {
    errors.push('3-point attempts cannot exceed total field goal attempts');
  }

  // Validate points calculation
  const calculatedPoints = (gameData.fgMade - gameData.threePtMade) * 2 + 
                          gameData.threePtMade * 3 + 
                          gameData.ftMade;
  
  if (Math.abs(gameData.points - calculatedPoints) > 5) {
    warnings.push(`Points (${gameData.points}) don't match calculated points (${calculatedPoints}). Please verify.`);
  }

  // Add warnings for unusual stats (Security: Prevent stat manipulation)
  if (gameData.points > 50) {
    warnings.push('Points over 50 is unusual - please verify this is correct');
  }
  
  if (gameData.fgMade === 0 && gameData.points > 0) {
    warnings.push('Points recorded but no field goals made - is this correct?');
  }

  if (gameData.rebounds > 30) {
    warnings.push('Rebounds over 30 is unusual - please verify');
  }

  if (gameData.assists > 20) {
    warnings.push('Assists over 20 is unusual - please verify');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Format percentage for display
 */
export function formatPercentage(percentage: number): string {
  if (percentage === 0) return '0.0%';
  return `${percentage.toFixed(1)}%`;
}

/**
 * Format stat value for display (handles decimals and whole numbers)
 */
export function formatStatValue(value: number): string {
  return value % 1 === 0 ? value.toString() : value.toFixed(1);
}
