/**
 * Division Bracket View Component
 * 
 * Displays brackets for all divisions plus championship bracket.
 * Single responsibility: Show division and championship brackets together.
 */

import React, { useState } from 'react';
import { BracketVisualization } from './BracketVisualization';
import { BracketStructure } from '@/lib/services/bracketService';
import { Game } from '@/lib/types/game';
import { Team, Tournament } from '@/lib/types/tournament';
import { Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DivisionBracketViewProps {
  tournament: Tournament;
  games: Game[];
  teams: Team[];
  divisionBrackets: Record<string, BracketStructure>; // division name -> bracket structure
  championshipBracket?: BracketStructure;
  onGameClick?: (gameId: string) => void;
}

export function DivisionBracketView({
  tournament,
  games,
  teams,
  divisionBrackets,
  championshipBracket,
  onGameClick,
}: DivisionBracketViewProps) {
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(
    new Set(tournament.division_names || [])
  );
  const [showChampionship, setShowChampionship] = useState(true);

  const toggleDivision = (division: string) => {
    setExpandedDivisions(prev => {
      const next = new Set(prev);
      if (next.has(division)) {
        next.delete(division);
      } else {
        next.add(division);
      }
      return next;
    });
  };

  if (!tournament.has_divisions || !tournament.division_names) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Division Brackets */}
      {tournament.division_names.map((division) => {
        const bracket = divisionBrackets[division];
        const isExpanded = expandedDivisions.has(division);
        
        if (!bracket || bracket.rounds.length === 0) {
          return (
            <div
              key={division}
              className="bg-white/60 rounded-xl p-4 border border-orange-200/30"
            >
              <button
                onClick={() => toggleDivision(division)}
                className="w-full flex items-center justify-between text-left"
              >
                <h3 className="text-lg font-semibold text-orange-600">
                  Division {division}
                </h3>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-orange-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-orange-600" />
                )}
              </button>
              {isExpanded && (
                <p className="mt-2 text-sm text-orange-600/70">
                  No bracket generated for Division {division} yet.
                </p>
              )}
            </div>
          );
        }

        return (
          <div
            key={division}
            className="bg-white/60 rounded-xl p-6 border border-orange-200/30 shadow-sm"
          >
            <button
              onClick={() => toggleDivision(division)}
              className="w-full flex items-center justify-between text-left mb-4"
            >
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-orange-600">
                  Division {division} Bracket
                </h3>
                <span className="text-sm text-orange-600/70">
                  ({bracket.totalTeams} teams)
                </span>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-orange-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-orange-600" />
              )}
            </button>

            {isExpanded && (
              <div className="bg-gradient-to-br from-orange-50/50 via-white/80 to-red-50/30 rounded-xl p-6 border border-orange-200/30 shadow-lg overflow-x-auto">
                <BracketVisualization
                  structure={bracket}
                  games={games}
                  teams={teams}
                  onGameClick={onGameClick}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* Championship Bracket */}
      {championshipBracket && championshipBracket.rounds.length > 0 && (
        <div className="bg-gradient-to-br from-orange-100/80 to-red-100/80 rounded-xl p-6 border-2 border-orange-500/50 shadow-lg">
          <button
            onClick={() => setShowChampionship(!showChampionship)}
            className="w-full flex items-center justify-between text-left mb-4"
          >
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-orange-700" />
              <h2 className="text-xl font-bold text-orange-700">
                Championship Bracket
              </h2>
              <span className="text-sm text-orange-700/70">
                (All Divisions)
              </span>
            </div>
            {showChampionship ? (
              <ChevronUp className="w-5 h-5 text-orange-700" />
            ) : (
              <ChevronDown className="w-5 h-5 text-orange-700" />
            )}
          </button>

          {showChampionship && (
            <div className="bg-gradient-to-br from-orange-50/50 via-white/80 to-red-50/30 rounded-xl p-6 border border-orange-200/30 shadow-lg overflow-x-auto">
              <BracketVisualization
                structure={championshipBracket}
                games={games}
                teams={teams}
                onGameClick={onGameClick}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

