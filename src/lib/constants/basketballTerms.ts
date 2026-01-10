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

// ============================================================================
// TEAM SEASON STATS - Terminology for aggregate team statistics
// ============================================================================

export const TEAM_SHOOTING_STATS: StatTerm[] = [
  { abbr: 'FG%', full: 'Field Goal Percentage', description: 'Percentage of all 2PT and 3PT shots made' },
  { abbr: '3P%', full: 'Three-Point Percentage', description: 'Percentage of shots from beyond the arc made' },
  { abbr: 'FT%', full: 'Free Throw Percentage', description: 'Percentage of foul shots made' },
];

export const TEAM_PER_GAME_STATS: StatTerm[] = [
  { abbr: 'PPG', full: 'Points Per Game', description: 'Average points scored per game' },
  { abbr: 'RPG', full: 'Rebounds Per Game', description: 'Average total rebounds per game' },
  { abbr: 'APG', full: 'Assists Per Game', description: 'Average assists per game' },
  { abbr: 'SPG', full: 'Steals Per Game', description: 'Average steals per game' },
  { abbr: 'BPG', full: 'Blocks Per Game', description: 'Average blocks per game' },
  { abbr: 'TOPG', full: 'Turnovers Per Game', description: 'Average turnovers per game (lower is better)' },
];

export const TEAM_TOTAL_STATS: StatTerm[] = [
  { abbr: 'PTS', full: 'Total Points', description: 'Total points scored across all games' },
  { abbr: 'REB', full: 'Total Rebounds', description: 'Total rebounds across all games' },
  { abbr: 'AST', full: 'Total Assists', description: 'Total assists across all games' },
  { abbr: 'STL', full: 'Total Steals', description: 'Total steals across all games' },
  { abbr: 'BLK', full: 'Total Blocks', description: 'Total blocks across all games' },
  { abbr: 'TO', full: 'Total Turnovers', description: 'Total turnovers across all games (lower is better)' },
];

