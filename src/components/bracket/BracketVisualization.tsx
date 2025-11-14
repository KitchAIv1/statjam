/**
 * Bracket Visualization Component
 * 
 * Main wrapper component that handles different bracket types.
 * Single responsibility: Route to appropriate bracket visualization.
 */

import React from 'react';
import { SingleEliminationBracket } from './SingleEliminationBracket';
import { BracketStructure } from '@/lib/services/bracketService';
import { Game } from '@/lib/types/game';
import { Team } from '@/lib/types/tournament';

interface BracketVisualizationProps {
  structure: BracketStructure;
  games: Game[];
  teams: Team[];
  onGameClick?: (gameId: string) => void;
  className?: string;
}

export function BracketVisualization({
  structure,
  games,
  teams,
  onGameClick,
  className,
}: BracketVisualizationProps) {
  switch (structure.type) {
    case 'single_elimination':
      return (
        <SingleEliminationBracket
          structure={structure}
          games={games}
          teams={teams}
          onGameClick={onGameClick}
          className={className}
        />
      );

    case 'double_elimination':
      // TODO: Implement DoubleEliminationBracket component
      return (
        <div className="text-center py-12 text-orange-600/70">
          <p>Double elimination bracket visualization coming soon.</p>
        </div>
      );

    case 'round_robin':
      // TODO: Implement RoundRobinBracket component
      return (
        <div className="text-center py-12 text-orange-600/70">
          <p>Round robin bracket visualization coming soon.</p>
        </div>
      );

    case 'swiss':
      // TODO: Implement SwissBracket component
      return (
        <div className="text-center py-12 text-orange-600/70">
          <p>Swiss bracket visualization coming soon.</p>
        </div>
      );

    default:
      return (
        <div className="text-center py-12 text-orange-600/70">
          <p>Unsupported bracket type.</p>
        </div>
      );
  }
}

