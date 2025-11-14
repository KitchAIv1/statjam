/**
 * Single Elimination Bracket Component
 * 
 * Main visualization component for single elimination brackets.
 * Single responsibility: Display complete bracket structure with rounds and connectors.
 */

import React from 'react';
import { BracketRound } from './BracketRound';
import { BracketStructure } from '@/lib/services/bracketService';
import { Game } from '@/lib/types/game';
import { Team } from '@/lib/types/tournament';

interface SingleEliminationBracketProps {
  structure: BracketStructure;
  games: Game[];
  teams: Team[];
  onGameClick?: (gameId: string) => void;
  className?: string;
}

export function SingleEliminationBracket({
  structure,
  games,
  teams,
  onGameClick,
  className,
}: SingleEliminationBracketProps) {
  if (structure.rounds.length === 0) {
    return (
      <div className="text-center py-12 text-orange-600/70">
        <p>No bracket matches found. Generate a bracket to get started.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Desktop: Horizontal Row Layout (NBA-style) */}
      <div className="hidden lg:flex items-start justify-start gap-0 overflow-x-auto pb-6 px-4">
        {structure.rounds.map((round, roundIdx) => {
          const nextRound = structure.rounds[roundIdx + 1];
          const hasNextRound = !!nextRound;
          
          return (
            <React.Fragment key={round.roundNumber}>
              {/* Round Column */}
              <div className="flex-shrink-0 flex flex-col items-center relative min-w-[220px] px-2">
                <BracketRound
                  roundNumber={round.roundNumber}
                  roundName={round.roundName}
                  matches={round.matches}
                  games={games}
                  teams={teams}
                  isActive={round.isActive}
                  isComplete={round.isComplete}
                  onGameClick={onGameClick}
                />
              </div>
              
              {/* Connector Lines (between rounds) */}
              {hasNextRound && (
                <div className="flex-shrink-0 relative w-8 lg:w-12 h-full flex flex-col items-center justify-center pointer-events-none min-h-[200px]">
                  {/* Simple visual connectors - horizontal arrow */}
                  <div className="flex items-center w-full h-full">
                    {/* Arrow pointing right */}
                    <div className="flex-1 h-px bg-gradient-to-r from-orange-400/50 via-orange-300/40 to-transparent" />
                    <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-orange-400/50" />
                    <div className="flex-1 h-px bg-gradient-to-l from-orange-400/50 via-orange-300/40 to-transparent" />
                  </div>
                  
                  {/* Vertical connectors for each match pair */}
                  {round.matches.length > 0 && nextRound.matches.length > 0 && (
                    <div className="absolute inset-0 flex flex-col justify-around">
                      {nextRound.matches.map((_, nextMatchIdx) => {
                        const matchesPerNextMatch = round.matches.length / nextRound.matches.length;
                        const startMatchIdx = Math.floor(nextMatchIdx * matchesPerNextMatch);
                        const endMatchIdx = Math.floor((nextMatchIdx + 1) * matchesPerNextMatch) - 1;
                        
                        // Calculate approximate vertical center for this group
                        const groupStart = (startMatchIdx / round.matches.length) * 100;
                        const groupEnd = ((endMatchIdx + 1) / round.matches.length) * 100;
                        const groupCenter = (groupStart + groupEnd) / 2;
                        const nextGroupCenter = ((nextMatchIdx + 0.5) / nextRound.matches.length) * 100;
                        
                        return (
                          <div
                            key={nextMatchIdx}
                            className="absolute left-1/2 -translate-x-1/2 w-0.5 bg-gradient-to-b from-orange-400/40 via-orange-300/30 to-orange-400/40"
                            style={{
                              top: `${groupCenter}%`,
                              bottom: `${100 - nextGroupCenter}%`,
                              height: `${Math.abs(nextGroupCenter - groupCenter)}%`,
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile/Tablet: Vertical Layout */}
      <div className="lg:hidden space-y-8">
        {structure.rounds.map((round) => (
          <BracketRound
            key={round.roundNumber}
            roundNumber={round.roundNumber}
            roundName={round.roundName}
            matches={round.matches}
            games={games}
            teams={teams}
            isActive={round.isActive}
            isComplete={round.isComplete}
            onGameClick={onGameClick}
          />
        ))}
      </div>
    </div>
  );
}

