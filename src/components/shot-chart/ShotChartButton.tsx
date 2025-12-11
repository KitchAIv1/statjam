'use client';

/**
 * ShotChartButton - Trigger button for opening shot chart modal
 * 
 * A small, reusable button that can be placed on player rows or game cards.
 * 
 * @module ShotChartButton
 */

import React, { useState } from 'react';
import { Target } from 'lucide-react';
import { ShotChartModal } from './ShotChartModal';

// ============================================================================
// TYPES
// ============================================================================

interface ShotChartButtonProps {
  /** Game ID */
  gameId: string;
  /** Optional: Player ID to filter shots */
  playerId?: string;
  /** Optional: Player name for modal title */
  playerName?: string;
  /** Optional: Team ID to filter shots */
  teamId?: string;
  /** Optional: Team name for modal title */
  teamName?: string;
  /** Optional: Button variant */
  variant?: 'icon' | 'compact' | 'full';
  /** Optional: Custom class name */
  className?: string;
  /** Optional: Hide if no shot data exists (not implemented - always shows) */
  hideIfNoData?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ShotChartButton({
  gameId,
  playerId,
  playerName,
  teamId,
  teamName,
  variant = 'icon',
  className = ''
}: ShotChartButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Render button based on variant
  const buttonContent = (() => {
    switch (variant) {
      case 'icon':
        return (
          <button
            onClick={() => setIsModalOpen(true)}
            className={`p-1.5 rounded-full hover:bg-orange-100 text-orange-500 hover:text-orange-600 transition-colors ${className}`}
            title="View Shot Chart"
            aria-label="View shot chart"
          >
            <Target className="w-4 h-4" />
          </button>
        );
      
      case 'compact':
        return (
          <button
            onClick={() => setIsModalOpen(true)}
            className={`flex items-center gap-1 px-2 py-1 text-xs font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded transition-colors ${className}`}
            title="View Shot Chart"
          >
            <Target className="w-3.5 h-3.5" />
            <span>Shots</span>
          </button>
        );
      
      case 'full':
        return (
          <button
            onClick={() => setIsModalOpen(true)}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors ${className}`}
          >
            <Target className="w-4 h-4" />
            <span>View Shot Chart</span>
          </button>
        );
      
      default:
        return null;
    }
  })();

  return (
    <>
      {buttonContent}
      
      {isModalOpen && (
        <ShotChartModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          gameId={gameId}
          playerId={playerId}
          playerName={playerName}
          teamId={teamId}
          teamName={teamName}
        />
      )}
    </>
  );
}
