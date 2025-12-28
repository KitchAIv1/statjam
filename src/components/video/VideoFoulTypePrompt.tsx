'use client';

/**
 * VideoFoulTypePrompt - Inline prompt for selecting foul type
 * 
 * Shows foul type options when F is pressed.
 * User can press number keys to select type or Esc to cancel.
 * 
 * @module VideoFoulTypePrompt
 */

import React, { useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { FOUL_TYPES } from '@/hooks/useVideoStatPrompts';

interface VideoFoulTypePromptProps {
  playerName: string;
  onSelectType: (foulType: string, ftCount: number) => void;  // Now includes FT count
  onSkip: () => void;
}

export function VideoFoulTypePrompt({
  playerName,
  onSelectType,
  onSkip,
}: VideoFoulTypePromptProps) {
  // Handle keyboard events for the prompt
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to cancel
      if (e.key === 'Escape') {
        e.preventDefault();
        onSkip();
        return;
      }

      // Number keys 1-7 for foul type selection
      const key = e.key;
      const typeOption = FOUL_TYPES.find(t => t.key === key);
      if (typeOption) {
        e.preventDefault();
        onSelectType(typeOption.value, typeOption.ftCount);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSelectType, onSkip]);

  return (
    <div className="p-3 rounded-lg border bg-red-50 border-red-200 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span className="text-sm font-medium">
            Foul - {playerName}
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

      {/* Foul type buttons */}
      <div className="grid grid-cols-4 gap-1">
        {FOUL_TYPES.map((type) => (
          <button
            key={type.key}
            onClick={() => onSelectType(type.value, type.ftCount)}
            className="flex items-center gap-1 px-2 py-1.5 bg-white rounded border hover:bg-red-100 text-xs"
          >
            <kbd className="bg-red-100 px-1 rounded text-[10px] font-bold">{type.key}</kbd>
            <span className="truncate">{type.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

