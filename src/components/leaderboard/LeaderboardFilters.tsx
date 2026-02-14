"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SortColumn, PerMode, GamePhase } from './LeaderboardRow';
import { useTournamentTheme } from '@/contexts/TournamentThemeContext';
import { getTournamentThemeClass } from '@/lib/utils/tournamentThemeClasses';

interface LeaderboardFiltersProps {
  sortColumn: SortColumn;
  onSortColumnChange: (column: SortColumn) => void;
  perMode: PerMode;
  onPerModeChange: (mode: PerMode) => void;
  minGames: number;
  onMinGamesChange: (games: number) => void;
  // Optional game phase filter (backward compatible)
  gamePhase?: GamePhase;
  onGamePhaseChange?: (phase: GamePhase) => void;
}

const STAT_OPTIONS: { value: SortColumn; label: string }[] = [
  { value: 'pts', label: 'Points' },
  { value: 'reb', label: 'Rebounds' },
  { value: 'ast', label: 'Assists' },
  { value: 'stl', label: 'Steals' },
  { value: 'blk', label: 'Blocks' },
  { value: 'tov', label: 'Turnovers' },
];

const PER_MODE_OPTIONS: { value: PerMode; label: string }[] = [
  { value: 'per_game', label: 'Per Game' },
  { value: 'totals', label: 'Totals' },
];

// Min Games filter removed - was competing with Game Phase filter
// Keeping minGames prop for backward compatibility (defaults to 1)

const GAME_PHASE_OPTIONS: { value: GamePhase; label: string }[] = [
  { value: 'all', label: 'All Games' },
  { value: 'regular', label: 'Regular Season' },
  { value: 'playoffs', label: 'Playoffs' },
  { value: 'finals', label: 'Finals' },
];

/**
 * LeaderboardFilters - Dropdown filters for the leaderboard
 * Follows .cursorrules: <100 lines, single responsibility
 */
export function LeaderboardFilters({
  sortColumn,
  onSortColumnChange,
  perMode,
  onPerModeChange,
  minGames,
  onMinGamesChange,
  gamePhase = 'all',
  onGamePhaseChange,
}: LeaderboardFiltersProps) {
  const { theme } = useTournamentTheme();
  const triggerClass = `w-28 sm:w-32 h-8 sm:h-9 text-[10px] sm:text-xs ${getTournamentThemeClass('inputBg', theme)} ${getTournamentThemeClass('inputBorder', theme)} ${getTournamentThemeClass('inputText', theme)}`;
  const contentClass = getTournamentThemeClass('navDropdownBg', theme);
  const itemClass = `text-xs ${getTournamentThemeClass('navDropdownItem', theme)}`;
  const triggerModeClass = `w-24 sm:w-28 h-8 sm:h-9 text-[10px] sm:text-xs ${getTournamentThemeClass('inputBg', theme)} ${getTournamentThemeClass('inputBorder', theme)} ${getTournamentThemeClass('inputText', theme)}`;

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <Select value={sortColumn} onValueChange={(v) => onSortColumnChange(v as SortColumn)}>
        <SelectTrigger className={triggerClass}>
          <SelectValue placeholder="Stat" />
        </SelectTrigger>
        <SelectContent className={contentClass}>
          {STAT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value} className={itemClass}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={perMode} onValueChange={(v) => onPerModeChange(v as PerMode)}>
        <SelectTrigger className={triggerModeClass}>
          <SelectValue placeholder="Mode" />
        </SelectTrigger>
        <SelectContent className={contentClass}>
          {PER_MODE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value} className={itemClass}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {onGamePhaseChange && (
        <Select value={gamePhase} onValueChange={(v) => onGamePhaseChange(v as GamePhase)}>
          <SelectTrigger className={triggerClass}>
            <SelectValue placeholder="Game Type" />
          </SelectTrigger>
          <SelectContent className={contentClass}>
            {GAME_PHASE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value} className={itemClass}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

