/**
 * Game Format Configuration - Presets for different game types
 * 
 * Provides format presets and period length options for coach games.
 * Used by CoachQuickTrackModal for game setup.
 * 
 * Follows .cursorrules: Config file, <100 lines
 */

import { GameFormat, GameFormatId } from '@/lib/types/gameFormat';

/**
 * Available game formats
 */
export const GAME_FORMATS: Record<GameFormatId, GameFormat> = {
  quarters: {
    id: 'quarters',
    label: '4 Quarters',
    periodsPerGame: 4,
    defaultPeriodLength: 8,
    periodLabel: 'Quarter',
    periodAbbrev: 'Q',
  },
  halves: {
    id: 'halves',
    label: '2 Halves',
    periodsPerGame: 2,
    defaultPeriodLength: 18,
    periodLabel: 'Half',
    periodAbbrev: 'H',
  },
};

/**
 * Period length options (available for all formats)
 */
export const PERIOD_LENGTH_OPTIONS = [
  { value: 5, label: '5 min', description: 'Practice' },
  { value: 6, label: '6 min', description: 'Short Game' },
  { value: 8, label: '8 min', description: 'Youth/Rec' },
  { value: 10, label: '10 min', description: 'FIBA' },
  { value: 12, label: '12 min', description: 'NBA' },
  { value: 16, label: '16 min', description: 'HS Halves' },
  { value: 18, label: '18 min', description: 'HS Standard' },
  { value: 20, label: '20 min', description: 'NCAA' },
] as const;

/**
 * Get default period length for a format
 */
export function getDefaultPeriodLength(formatId: GameFormatId): number {
  return GAME_FORMATS[formatId].defaultPeriodLength;
}

/**
 * Get format by ID with fallback
 */
export function getGameFormat(formatId: GameFormatId | string): GameFormat {
  return GAME_FORMATS[formatId as GameFormatId] || GAME_FORMATS.quarters;
}

/**
 * Get periods per game from format ID
 */
export function getPeriodsPerGame(formatId: GameFormatId | string): number {
  return getGameFormat(formatId).periodsPerGame;
}

