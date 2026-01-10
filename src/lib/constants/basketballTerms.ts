/**
 * Basketball Terminology Constants
 * 
 * PURPOSE: Centralized stat abbreviation definitions for Stats Guide
 * Follows .cursorrules: <50 lines, constants only
 */

export interface StatTerm {
  abbr: string;
  full: string;
  description: string;
  example?: string;
}

export const BASIC_STATS: StatTerm[] = [
  { abbr: 'MIN', full: 'Minutes', description: 'Time played on court' },
  { abbr: 'PTS', full: 'Points', description: 'Total points scored' },
  { abbr: 'REB', full: 'Rebounds', description: 'Offensive + defensive boards combined' },
  { abbr: 'AST', full: 'Assists', description: 'Passes leading directly to made baskets' },
  { abbr: 'STL', full: 'Steals', description: 'Turnovers forced from the opponent' },
  { abbr: 'BLK', full: 'Blocks', description: 'Opponent shots blocked' },
  { abbr: 'TO', full: 'Turnovers', description: 'Possessions lost to the opponent' },
  { abbr: 'PF', full: 'Personal Fouls', description: 'Fouls committed by the player' },
];

export const SHOOTING_STATS: StatTerm[] = [
  { abbr: 'FG', full: 'Field Goals', description: 'All 2PT and 3PT shots (Made/Attempted)' },
  { abbr: '3P', full: 'Three-Pointers', description: 'Shots beyond the arc (Made/Attempted)' },
  { abbr: 'FT', full: 'Free Throws', description: 'Foul shots from the line (Made/Attempted)' },
];

export const ADVANCED_STATS: StatTerm[] = [
  { 
    abbr: '+/-', 
    full: 'Plus/Minus', 
    description: 'Point differential while this player was on the court.',
    example: 'If a player has +8, their team outscored the opponent by 8 points during their minutes. A high +/- indicates positive team impact.'
  },
];

