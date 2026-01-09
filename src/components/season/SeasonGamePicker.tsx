// ============================================================================
// SEASON GAME PICKER - UI only (<150 lines)
// Purpose: Game selection UI for adding games to a season
// Follows .cursorrules: UI component, <200 lines, single responsibility
// ============================================================================

'use client';

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Trophy, Home, Plane, CheckCircle } from 'lucide-react';
import { CoachGame } from '@/lib/types/coach';

interface SeasonGamePickerProps {
  games: CoachGame[];
  selectedIds: string[];
  selectedStats: {
    count: number;
    wins: number;
    losses: number;
    avgFor: string;
    avgAgainst: string;
  };
  loading: boolean;
  error: string | null;
  onToggle: (gameId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function SeasonGamePicker({
  games,
  selectedIds,
  selectedStats,
  loading,
  error,
  onToggle,
  onSelectAll,
  onDeselectAll,
}: SeasonGamePickerProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Loading games...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-red-500">
        {error}
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p className="font-medium">No completed games found.</p>
        <p className="text-xs mt-1">Only <strong>completed</strong> games can be added to a season.</p>
        <p className="text-xs mt-1 text-orange-600">Finish tracking your in-progress games first!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with bulk actions */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {games.length} games available
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onSelectAll}>
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={onDeselectAll}>
            Clear
          </Button>
        </div>
      </div>

      {/* Game list */}
      <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
        {games.map((game) => {
          const isSelected = selectedIds.includes(game.id);
          const isWin = game.home_score > game.away_score;
          const gameDate = game.start_time || game.created_at;

          return (
            <label
              key={game.id}
              className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                isSelected ? 'bg-orange-50' : ''
              }`}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggle(game.id)}
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Badge
                    variant={isWin ? 'default' : 'secondary'}
                    className={`text-[10px] px-1.5 ${isWin ? 'bg-green-600' : 'bg-red-500'}`}
                  >
                    {isWin ? 'W' : 'L'}
                  </Badge>
                  <span className="font-medium text-sm truncate">
                    vs {game.opponent_name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatDate(gameDate)}</span>
                  <span>•</span>
                  <span className="font-semibold">
                    {game.home_score} - {game.away_score}
                  </span>
                </div>
              </div>

              {isSelected && (
                <CheckCircle className="w-4 h-4 text-orange-500 shrink-0" />
              )}
            </label>
          );
        })}
      </div>

      {/* Selected stats summary */}
      {selectedIds.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-orange-600" />
              <span className="font-medium text-sm text-orange-900">
                {selectedStats.count} games selected
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-green-700 font-semibold">{selectedStats.wins}W</span>
              <span className="text-red-600 font-semibold">{selectedStats.losses}L</span>
              <span className="text-muted-foreground">
                Avg: {selectedStats.avgFor} - {selectedStats.avgAgainst}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

