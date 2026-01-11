/**
 * Game Format Types - Defines period-based game structures
 * 
 * Supports different game formats:
 * - Quarters (4 periods) - NBA, FIBA, Youth
 * - Halves (2 periods) - High School, College
 * 
 * Follows .cursorrules: Single file for format types (<100 lines)
 */

export type GameFormatId = 'quarters' | 'halves';

export interface GameFormat {
  id: GameFormatId;
  label: string;
  periodsPerGame: number;
  defaultPeriodLength: number; // minutes
  periodLabel: string; // "Quarter" or "Half"
  periodAbbrev: string; // "Q" or "H"
}

export interface GameFormatSettings {
  formatId: GameFormatId;
  periodsPerGame: number;
  periodLengthMinutes: number;
}

/**
 * Extended game settings including format
 */
export interface CoachGameSettings {
  quarter_length_minutes: number;
  periods_per_game: number;
  shot_clock_seconds: number;
  track_turnovers: boolean;
  track_fouls: boolean;
}

/**
 * Get default game settings for a format
 */
export function getDefaultGameSettings(formatId: GameFormatId = 'quarters'): CoachGameSettings {
  const isHalves = formatId === 'halves';
  return {
    quarter_length_minutes: isHalves ? 18 : 8,
    periods_per_game: isHalves ? 2 : 4,
    shot_clock_seconds: 24,
    track_turnovers: true,
    track_fouls: true,
  };
}

