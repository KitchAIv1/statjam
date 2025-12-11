'use client';

/**
 * ShotChartModal - Modal wrapper for ShotChartView
 * 
 * Displays shot chart in a modal dialog. Can be triggered from various
 * places like game viewer, player dashboard, etc.
 * 
 * @module ShotChartModal
 */

import React from 'react';
import { X, Target } from 'lucide-react';
import { ShotChartView } from './ShotChartView';

// ============================================================================
// TYPES
// ============================================================================

interface ShotChartModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback to close modal */
  onClose: () => void;
  /** Game ID to display shots for */
  gameId: string;
  /** Optional: Filter to specific player */
  playerId?: string;
  /** Optional: Player name for title */
  playerName?: string;
  /** Optional: Filter to specific team */
  teamId?: string;
  /** Optional: Team name for title */
  teamName?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ShotChartModal({
  isOpen,
  onClose,
  gameId,
  playerId,
  playerName,
  teamId,
  teamName
}: ShotChartModalProps) {
  if (!isOpen) return null;

  // Generate title based on context
  const getTitle = () => {
    if (playerName) return `${playerName}'s Shot Chart`;
    if (teamName) return `${teamName} Shot Chart`;
    return 'Shot Chart';
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shot-chart-title"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-red-50">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-500" />
            <h2 id="shot-chart-title" className="text-lg font-semibold text-gray-900">
              {getTitle()}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <ShotChartView
            gameId={gameId}
            playerId={playerId}
            teamId={teamId}
            showLegend={true}
            showStats={true}
            size="lg"
          />
        </div>
        
        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
