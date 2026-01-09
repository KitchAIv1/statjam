// ============================================================================
// SEASON CARD - Coach Dashboard (<100 lines)
// Purpose: Display season preview card in list modal
// Follows .cursorrules: Single responsibility, <100 lines
// ============================================================================

'use client';

import React from 'react';
import { Season, SeasonType } from '@/lib/types/season';
import { cn } from '@/lib/utils';
import { Calendar, Trophy, ChevronRight, Eye, EyeOff, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatWinPct } from '@/hooks/useStandings';

interface SeasonCardProps {
  season: Season;
  onClick: () => void;
  onEdit?: () => void;
  className?: string;
}

const typeIcons: Record<SeasonType, React.ReactNode> = {
  regular: <Calendar className="w-4 h-4" />,
  playoffs: <Trophy className="w-4 h-4" />,
  preseason: <Calendar className="w-4 h-4" />,
  summer: <Calendar className="w-4 h-4" />,
  tournament: <Trophy className="w-4 h-4" />,
};

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
};

export function SeasonCard({ season, onClick, onEdit, className }: SeasonCardProps) {
  const { wins, losses, total_games, points_for, points_against } = season;
  const winPct = total_games > 0 ? wins / total_games : 0;
  const pointDiff = points_for - points_against;

  return (
    <div
      onClick={onClick}
      className={cn(
        'group p-4 rounded-xl border border-gray-200 bg-white hover:border-orange-300 hover:shadow-md',
        'transition-all duration-200 cursor-pointer',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Logo/Icon */}
        {season.logo ? (
          <img src={season.logo} alt={season.name} className="w-12 h-12 rounded-lg object-cover" />
        ) : (
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${season.primary_color || '#FF6B00'}20` }}
          >
            {typeIcons[season.season_type]}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">{season.name}</h3>
            <Badge className={cn('text-[10px] shrink-0', statusColors[season.status])}>
              {season.status}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 truncate">
            {season.league_name || season.season_year || 'Season'}
            {season.conference && ` • ${season.conference}`}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs">
            <span className="font-bold text-gray-800">{wins}-{losses}</span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-600">{formatWinPct(winPct)}</span>
            <span className="text-gray-400">|</span>
            <span className={cn('font-medium', pointDiff >= 0 ? 'text-green-600' : 'text-red-600')}>
              {pointDiff >= 0 ? '+' : ''}{pointDiff}
            </span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-500">{total_games} games</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="p-1 rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Edit Season"
              >
                <Pencil className="w-4 h-4 text-gray-500 hover:text-orange-500" />
              </button>
            )}
            {season.is_public ? (
              <Eye className="w-4 h-4 text-green-500" />
            ) : (
              <EyeOff className="w-4 h-4 text-gray-400" />
            )}
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-orange-500 transition-colors" />
        </div>
      </div>
    </div>
  );
}

