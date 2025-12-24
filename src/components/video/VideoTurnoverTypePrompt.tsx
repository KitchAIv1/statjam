'use client';

/**
 * VideoTurnoverTypePrompt - Inline prompt for selecting turnover type
 * 
 * Shows turnover type options when T is pressed.
 * User can press number keys to select type or Esc to cancel.
 * 
 * @module VideoTurnoverTypePrompt
 */

import React, { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { TURNOVER_TYPES } from '@/hooks/useVideoStatPrompts';

interface VideoTurnoverTypePromptProps {
  playerName: string;
  onSelectType: (turnoverType: string) => void;
  onSkip: () => void;
}

export function VideoTurnoverTypePrompt({
  playerName,
  onSelectType,
  onSkip,
}: VideoTurnoverTypePromptProps) {
  // Handle keyboard events for the prompt
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to cancel
      if (e.key === 'Escape') {
        e.preventDefault();
        onSkip();
        return;
      }

      // Number keys 1-7 for turnover type selection
      const key = e.key;
      const typeOption = TURNOVER_TYPES.find(t => t.key === key);
      if (typeOption) {
        e.preventDefault();
        onSelectType(typeOption.value);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSelectType, onSkip]);

  return (
    <div className="p-3 rounded-lg border bg-orange-50 border-orange-200 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-600" />
          <span className="text-sm font-medium">
            Turnover - {playerName}
          </span>
        </div>
        <button
          onClick={onSkip}
          className="w-5 h-5 rounded-full hover:bg-gray-200 flex items-center justify-center"
          title="Cancel (Esc)"
        >
          <X className="w-3 h-3 text-gray-500" />
        </button>
      </div>

      {/* Prompt */}
      <div className="text-xs font-medium text-gray-700 mb-2">
        Select type: Press <kbd className="bg-gray-200 px-1 rounded">1-7</kbd> or <kbd className="bg-gray-200 px-1 rounded">Esc</kbd> to cancel
      </div>

      {/* Turnover type buttons */}
      <div className="grid grid-cols-2 gap-1">
        {TURNOVER_TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => onSelectType(type.value)}
            className="flex items-center gap-1 px-2 py-1.5 bg-white rounded border hover:bg-orange-100 text-xs"
          >
            <kbd className="bg-orange-100 px-1 rounded text-[10px] font-bold">{type.key}</kbd>
            <span className="truncate">{type.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

