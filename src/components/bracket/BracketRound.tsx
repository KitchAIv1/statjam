/**
 * Bracket Round Component
 * 
 * Groups matches in a single round of the bracket.
 * Single responsibility: Display all matches in one round.
 */

import React from 'react';
import { BracketMatch } from './BracketMatch';
import { BracketMatch as BracketMatchType } from '@/lib/services/bracketService';
import { Game } from '@/lib/types/game';
import { Team } from '@/lib/types/tournament';
import { cn } from '@/lib/utils';

interface BracketRoundProps {
  roundNumber: number;
  roundName: string;
  matches: BracketMatchType[];
  games: Game[];
  teams: Team[];
  isActive?: boolean;
  isComplete?: boolean;
  onGameClick?: (gameId: string) => void;
  className?: string;
}

export function BracketRound({
  roundNumber,
  roundName,
  matches,
  games,
  teams,
  isActive = false,
  isComplete = false,
  onGameClick,
  className,
}: BracketRoundProps) {
  return (
    <div className={className}>
      {/* Round Header */}
      <div className="mb-4 text-center">
        <h3
          className={cn(
            'text-xs uppercase tracking-wide font-semibold',
            isActive && 'text-orange-600',
            isComplete && 'text-orange-500/70',
            !isActive && !isComplete && 'text-orange-500/60'
          )}
        >
          {roundName}
        </h3>
        {isActive && (
          <div className="mt-1 text-xs text-orange-600/80 font-medium">In Progress</div>
        )}
        {isComplete && (
          <div className="mt-1 text-xs text-orange-500/60">Complete</div>
        )}
      </div>

      {/* Matches */}
      <div className="space-y-3 sm:space-y-4">
        {matches.map((match, idx) => {
          // For empty slots, game will be null in the match object
          const game = match.game || games.find(g => g.id === match.gameId) || null;

          return (
            <BracketMatch
              key={match.gameId}
              game={game}
              teamA={match.teamA}
              teamB={match.teamB}
              roundNumber={roundNumber}
              matchNumber={match.matchNumber}
              isWinner={match.winnerId !== null}
              onGameClick={onGameClick}
              parentMatchA={match.parentMatchA}
              parentMatchB={match.parentMatchB}
              parentRoundA={match.parentRoundA}
              parentMatchAIdx={match.parentMatchAIdx}
              parentRoundB={match.parentRoundB}
              parentMatchBIdx={match.parentMatchBIdx}
            />
          );
        })}
      </div>
    </div>
  );
}

