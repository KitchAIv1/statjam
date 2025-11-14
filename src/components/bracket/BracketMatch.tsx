/**
 * Bracket Match Component
 * 
 * Displays a single matchup between two teams in the bracket.
 * Single responsibility: Render one match card with teams and scores.
 */

import React from 'react';
import { Game } from '@/lib/types/game';
import { Team } from '@/lib/types/tournament';
import { Shield, Clock, MapPin, User, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface BracketMatchProps {
  game: Game | null; // Null for empty slots (future rounds)
  teamA: Team | null;
  teamB: Team | null;
  roundNumber: number;
  matchNumber: number;
  isWinner?: boolean;
  onGameClick?: (gameId: string) => void;
  className?: string;
  parentMatchA?: number; // Legacy: position number
  parentMatchB?: number; // Legacy: position number
  parentRoundA?: number; // Round number of parent match A
  parentMatchAIdx?: number; // Match number of parent match A
  parentRoundB?: number; // Round number of parent match B
  parentMatchBIdx?: number; // Match number of parent match B
}

export function BracketMatch({
  game,
  teamA,
  teamB,
  roundNumber,
  matchNumber,
  isWinner = false,
  onGameClick,
  className,
  parentMatchA,
  parentMatchB,
  parentRoundA,
  parentMatchAIdx,
  parentRoundB,
  parentMatchBIdx,
}: BracketMatchProps) {
  const isEmpty = game === null;
  const isCompleted = game?.status === 'completed' || false;
  const isLive = game?.status === 'in_progress' || game?.status === 'overtime' || false;
  const isScheduled = game?.status === 'scheduled' || false;

  // Determine winner
  const winnerId = isCompleted && game
    ? game.home_score > game.away_score
      ? game.team_a_id
      : game.away_score > game.home_score
      ? game.team_b_id
      : null
    : null;

  const teamAWon = game ? winnerId === game.team_a_id : false;
  const teamBWon = game ? winnerId === game.team_b_id : false;

  const handleClick = () => {
    if (onGameClick && game) {
      onGameClick(game.id);
    }
  };

  // For empty slots, show "TBD" or "Winner of Round X Match Y"
  const getEmptySlotLabel = (position: 'A' | 'B') => {
    if (position === 'A') {
      if (parentRoundA && parentMatchAIdx) {
        const roundLabel = parentRoundA === 1 ? 'Round 1' : 
                          parentRoundA === 2 ? 'Semifinals' : 
                          parentRoundA === 3 ? 'Final' : 
                          `Round ${parentRoundA}`;
        return `Winner of ${roundLabel} Match ${parentMatchAIdx}`;
      }
      if (parentMatchA) {
        // Fallback to position number if round/match not available
        return `Winner of Match ${parentMatchA}`;
      }
    }
    if (position === 'B') {
      if (parentRoundB && parentMatchBIdx) {
        const roundLabel = parentRoundB === 1 ? 'Round 1' : 
                          parentRoundB === 2 ? 'Semifinals' : 
                          parentRoundB === 3 ? 'Final' : 
                          `Round ${parentRoundB}`;
        return `Winner of ${roundLabel} Match ${parentMatchBIdx}`;
      }
      if (parentMatchB) {
        // Fallback to position number if round/match not available
        return `Winner of Match ${parentMatchB}`;
      }
    }
    return 'TBD';
  };

  // Build tooltip content
  const getTooltipContent = () => {
    if (isEmpty) {
      const labelA = getEmptySlotLabel('A');
      const labelB = getEmptySlotLabel('B');
      return (
        <div className="space-y-1">
          <div className="font-semibold">Future Match</div>
          <div className="text-xs opacity-90">
            {labelA !== 'TBD' && labelB !== 'TBD' ? `${labelA} vs ${labelB}` : 
             labelA !== 'TBD' ? `${labelA} vs TBD` :
             labelB !== 'TBD' ? `TBD vs ${labelB}` :
             'Matchup to be determined'}
          </div>
        </div>
      );
    }
    
    if (!game) return null;
    
    return (
      <div className="space-y-2 text-xs">
        <div className="font-semibold text-sm mb-2">
          {roundNumber === 1 ? 'Round 1' : roundNumber === 2 ? 'Semifinals' : roundNumber === 3 ? 'Final' : `Round ${roundNumber}`} - Match {matchNumber}
        </div>
        
        {game.venue && (
          <div className="flex items-center gap-2">
            <MapPin className="w-3 h-3" />
            <span>{game.venue}</span>
          </div>
        )}
        
        {game.start_time && (
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3" />
            <span>
              {new Date(game.start_time).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
          </div>
        )}
        
        {isCompleted && (
          <div className="flex items-center gap-2 pt-1 border-t border-white/20">
            <Trophy className="w-3 h-3 text-yellow-400" />
            <span className="font-semibold">
              Winner: {teamAWon ? teamA?.name : teamBWon ? teamB?.name : 'Tie'}
            </span>
          </div>
        )}
        
        {isLive && (
          <div className="flex items-center gap-2 pt-1 border-t border-white/20">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="font-semibold text-red-300">Live Now</span>
          </div>
        )}
        
        {onGameClick && (
          <div className="text-xs opacity-70 pt-1">
            Click to view game details
          </div>
        )}
      </div>
    );
  };

  const matchCard = (
    <div
      className={cn(
        'relative rounded-xl border transition-all shadow-sm',
        isEmpty && 'border-gray-200/50 bg-gradient-to-br from-gray-50/50 to-white/70 border-dashed',
        isLive && 'border-red-500/60 bg-gradient-to-br from-red-500/20 to-orange-500/20 shadow-red-500/20',
        isCompleted && !isWinner && 'border-orange-200/30 bg-gradient-to-br from-orange-50/80 to-white/90',
        isWinner && 'border-orange-500/50 bg-gradient-to-br from-orange-100/90 to-red-100/90 shadow-orange-500/30',
        isScheduled && 'border-orange-200/40 bg-gradient-to-br from-orange-50/70 to-white/80 hover:border-orange-400/60 hover:shadow-md',
        onGameClick && game && 'cursor-pointer',
        className
      )}
      onClick={handleClick}
    >
      {/* Live Badge */}
      {isLive && (
        <div className="absolute -top-2 -right-2 px-2 py-1 bg-gradient-to-r from-red-600 to-orange-600 text-white text-xs font-semibold rounded-full flex items-center gap-1 shadow-lg">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          LIVE
        </div>
      )}

      {/* Match Content */}
      <div className="p-3 sm:p-4 space-y-2">
        {/* Team A */}
        <div
          className={cn(
            'flex items-center justify-between gap-3 p-2 rounded-lg transition-colors',
            teamAWon && 'bg-gradient-to-r from-orange-100/80 to-red-100/80',
            !teamAWon && isCompleted && 'bg-white/60',
            isLive && 'bg-white/80',
            isScheduled && 'bg-white/50'
          )}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {teamA?.logo ? (
              <img
                src={teamA.logo}
                alt={teamA.name}
                className="w-8 h-8 rounded-lg object-cover shrink-0 border border-orange-200/50"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shrink-0 shadow-sm">
                <Shield className="w-4 h-4 text-white" />
              </div>
            )}
            <span className={cn(
              'text-sm font-semibold truncate',
              isEmpty && 'text-gray-500 italic',
              isLive ? 'text-red-700' : isEmpty ? 'text-gray-500' : 'text-gray-900'
            )}>
              {teamA?.name || (isEmpty ? getEmptySlotLabel('A') : 'TBD')}
            </span>
          </div>
          {isCompleted && game && (
            <span className="text-base font-bold text-gray-900 tabular-nums">
              {game.home_score}
            </span>
          )}
          {isLive && game && (
            <span className="text-base font-bold text-red-600 tabular-nums">
              {game.home_score}
            </span>
          )}
        </div>

        {/* VS Divider */}
        <div className="flex items-center justify-center py-1">
          <div className={cn(
            'h-px flex-1',
            isLive ? 'bg-gradient-to-r from-transparent via-red-300/50 to-transparent' : 'bg-gradient-to-r from-transparent via-orange-200/50 to-transparent'
          )} />
          <span className={cn(
            'px-2 text-xs font-medium',
            isLive ? 'text-red-600' : 'text-orange-600'
          )}>VS</span>
          <div className={cn(
            'h-px flex-1',
            isLive ? 'bg-gradient-to-r from-transparent via-red-300/50 to-transparent' : 'bg-gradient-to-r from-transparent via-orange-200/50 to-transparent'
          )} />
        </div>

        {/* Team B */}
        <div
          className={cn(
            'flex items-center justify-between gap-3 p-2 rounded-lg transition-colors',
            teamBWon && 'bg-gradient-to-r from-orange-100/80 to-red-100/80',
            !teamBWon && isCompleted && 'bg-white/60',
            isLive && 'bg-white/80',
            isScheduled && 'bg-white/50'
          )}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {teamB?.logo ? (
              <img
                src={teamB.logo}
                alt={teamB.name}
                className="w-8 h-8 rounded-lg object-cover shrink-0 border border-orange-200/50"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shrink-0 shadow-sm">
                <Shield className="w-4 h-4 text-white" />
              </div>
            )}
            <span className={cn(
              'text-sm font-semibold truncate',
              isEmpty && 'text-gray-500 italic',
              isLive ? 'text-red-700' : isEmpty ? 'text-gray-500' : 'text-gray-900'
            )}>
              {teamB?.name || (isEmpty ? getEmptySlotLabel('B') : 'TBD')}
            </span>
          </div>
          {isCompleted && game && (
            <span className="text-base font-bold text-gray-900 tabular-nums">
              {game.away_score}
            </span>
          )}
          {isLive && game && (
            <span className="text-base font-bold text-red-600 tabular-nums">
              {game.away_score}
            </span>
          )}
        </div>

        {/* Game Time */}
        {isScheduled && game && (
          <div className="flex items-center justify-center gap-1 text-xs text-orange-600/80 pt-1">
            <Clock className="w-3 h-3" />
            <span>
              {new Date(game.start_time).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
          </div>
        )}
        {isEmpty && (
          <div className="flex items-center justify-center gap-1 text-xs text-gray-400/70 pt-1 italic">
            <Clock className="w-3 h-3" />
            <span>To be determined</span>
          </div>
        )}
      </div>
    </div>
  );

  // Wrap in tooltip if we have content to show
  const tooltipContent = getTooltipContent();
  
  if (tooltipContent) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {matchCard}
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="bg-gray-900 text-white border-gray-700 max-w-xs z-50"
          sideOffset={8}
        >
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    );
  }

  return matchCard;
}

