'use client';

/**
 * VideoQuarterAdvancePrompt - Quarter advancement inline prompt
 * 
 * Shows when game clock reaches 0:00 to prompt user to advance to next quarter.
 * Supports overtime detection after Q4 based on score comparison.
 * 
 * @module VideoQuarterAdvancePrompt
 */

import React, { useEffect, useCallback } from 'react';
import { Clock, FastForward, X, AlertTriangle } from 'lucide-react';

interface VideoQuarterAdvancePromptProps {
  currentQuarter: number;
  onAdvanceQuarter: (nextQuarter: number) => void;
  onDismiss: () => void;
  isOvertime?: boolean;
  teamAScore?: number;
  teamBScore?: number;
}

export function VideoQuarterAdvancePrompt({
  currentQuarter,
  onAdvanceQuarter,
  onDismiss,
  isOvertime = false,
  teamAScore = 0,
  teamBScore = 0,
}: VideoQuarterAdvancePromptProps) {
  // Determine next quarter
  const getNextQuarterLabel = (): string => {
    if (currentQuarter < 4) {
      return `Q${currentQuarter + 1}`;
    }
    // After Q4, check if overtime
    const isTied = teamAScore === teamBScore;
    if (currentQuarter === 4 && isTied) {
      return 'OT1';
    }
    if (currentQuarter >= 4 && isOvertime) {
      return `OT${currentQuarter - 3}`;
    }
    return `Q${currentQuarter + 1}`;
  };

  const getNextQuarterNumber = (): number => {
    return currentQuarter + 1;
  };

  const nextQuarterLabel = getNextQuarterLabel();
  const isTiedAfterQ4 = currentQuarter === 4 && teamAScore === teamBScore;

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onDismiss();
        return;
      }

      // Q key or Enter to advance
      if (e.key.toLowerCase() === 'q' || e.key === 'Enter') {
        e.preventDefault();
        onAdvanceQuarter(getNextQuarterNumber());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuarter, onAdvanceQuarter, onDismiss]);

  // Get current quarter label
  const getCurrentQuarterLabel = (): string => {
    if (currentQuarter <= 4) {
      return `Q${currentQuarter}`;
    }
    return `OT${currentQuarter - 4}`;
  };

  return (
    <div className="p-4 rounded-xl border-2 bg-gradient-to-r from-orange-50 to-amber-50 border-orange-300 shadow-lg animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-600" />
          <span className="font-bold text-orange-800">
            {getCurrentQuarterLabel()} Ended
          </span>
        </div>
        <button
          onClick={onDismiss}
          className="w-6 h-6 rounded-full hover:bg-orange-200 flex items-center justify-center transition-colors"
          title="Dismiss (Esc)"
        >
          <X className="w-4 h-4 text-orange-600" />
        </button>
      </div>

      {/* Tied Score Warning (After Q4) */}
      {isTiedAfterQ4 && (
        <div className="mb-3 p-2 bg-yellow-100 border border-yellow-300 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <span className="text-sm text-yellow-800 font-medium">
            Scores tied {teamAScore}-{teamBScore} — Overtime!
          </span>
        </div>
      )}

      {/* Prompt */}
      <div className="text-sm text-gray-700 mb-3">
        Mark current video position as start of{' '}
        <span className="font-bold text-orange-700">{nextQuarterLabel}</span>?
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onAdvanceQuarter(getNextQuarterNumber())}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
        >
          <FastForward className="w-4 h-4" />
          <span>Mark {nextQuarterLabel} Start</span>
          <kbd className="bg-orange-400 px-2 py-0.5 rounded text-xs">Q</kbd>
        </button>
        <button
          onClick={onDismiss}
          className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
        >
          Later
        </button>
      </div>

      {/* Help Text */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        Press <kbd className="bg-gray-200 px-1 rounded">Q</kbd> or{' '}
        <kbd className="bg-gray-200 px-1 rounded">Enter</kbd> to confirm,{' '}
        <kbd className="bg-gray-200 px-1 rounded">Esc</kbd> to dismiss
      </div>
    </div>
  );
}

