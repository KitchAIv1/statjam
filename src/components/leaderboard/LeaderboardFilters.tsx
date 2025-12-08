"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SortColumn, PerMode, GamePhase } from './LeaderboardRow';

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

const MIN_GAMES_OPTIONS = [1, 2, 3, 5];

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
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      {/* Stat Category Dropdown */}
      <Select value={sortColumn} onValueChange={(v) => onSortColumnChange(v as SortColumn)}>
        <SelectTrigger className="w-28 sm:w-32 h-8 sm:h-9 bg-white/5 border-white/10 text-white text-[10px] sm:text-xs">
          <SelectValue placeholder="Stat" />
        </SelectTrigger>
        <SelectContent className="bg-[#1a1a1a] border-white/10">
          {STAT_OPTIONS.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="text-white text-xs hover:bg-white/10 focus:bg-white/10 focus:text-white"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Per Mode Dropdown */}
      <Select value={perMode} onValueChange={(v) => onPerModeChange(v as PerMode)}>
        <SelectTrigger className="w-24 sm:w-28 h-8 sm:h-9 bg-white/5 border-white/10 text-white text-[10px] sm:text-xs">
          <SelectValue placeholder="Mode" />
        </SelectTrigger>
        <SelectContent className="bg-[#1a1a1a] border-white/10">
          {PER_MODE_OPTIONS.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="text-white text-xs hover:bg-white/10 focus:bg-white/10 focus:text-white"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Min Games Dropdown */}
      <Select value={String(minGames)} onValueChange={(v) => onMinGamesChange(Number(v))}>
        <SelectTrigger className="w-20 sm:w-24 h-8 sm:h-9 bg-white/5 border-white/10 text-white text-[10px] sm:text-xs">
          <SelectValue placeholder="Min GP" />
        </SelectTrigger>
        <SelectContent className="bg-[#1a1a1a] border-white/10">
          {MIN_GAMES_OPTIONS.map((games) => (
            <SelectItem
              key={games}
              value={String(games)}
              className="text-white text-xs hover:bg-white/10 focus:bg-white/10 focus:text-white"
            >
              {games}+ GP
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Game Phase Dropdown - Optional, only shown if handler provided */}
      {onGamePhaseChange && (
        <Select value={gamePhase} onValueChange={(v) => onGamePhaseChange(v as GamePhase)}>
          <SelectTrigger className="w-28 sm:w-32 h-8 sm:h-9 bg-white/5 border-white/10 text-white text-[10px] sm:text-xs">
            <SelectValue placeholder="Game Type" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-white/10">
            {GAME_PHASE_OPTIONS.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="text-white text-xs hover:bg-white/10 focus:bg-white/10 focus:text-white"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

