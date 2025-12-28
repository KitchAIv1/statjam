'use client';

/**
 * VideoFreeThrowPrompt - Inline prompt for free throw sequence
 * 
 * Shows FT made/missed options for each shot in sequence.
 * Reuses pattern from tracker-v3 FreeThrowSequenceModal.
 * 
 * @module VideoFreeThrowPrompt
 */

import React, { useState, useEffect } from 'react';
import { X, Target, CheckCircle2, XCircle } from 'lucide-react';

interface VideoFreeThrowPromptProps {
  shooterName: string;
  totalShots: number;  // 1, 2, or 3
  foulType: string;
  onComplete: (results: { made: boolean }[]) => void;
  onSkip: () => void;
}

export function VideoFreeThrowPrompt({
  shooterName,
  totalShots,
  foulType,
  onComplete,
  onSkip,
}: VideoFreeThrowPromptProps) {
  const [currentShot, setCurrentShot] = useState(1);
  const [results, setResults] = useState<{ made: boolean }[]>([]);

  // Reset when prompt opens
  useEffect(() => {
    setCurrentShot(1);
    setResults([]);
  }, [shooterName, totalShots]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onSkip();
        return;
      }

      // Y = made, N = missed
      if (e.key.toLowerCase() === 'y' || e.key === '1') {
        e.preventDefault();
        handleShotResult(true);
      } else if (e.key.toLowerCase() === 'n' || e.key === '2') {
        e.preventDefault();
        handleShotResult(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentShot, results, totalShots]);

  const handleShotResult = (made: boolean) => {
    const newResults = [...results, { made }];
    setResults(newResults);

    // Handle 1-and-1 special case
    if (foulType === '1-and-1' && currentShot === 1 && !made) {
      // Missed first shot of 1-and-1 ends sequence
      onComplete(newResults);
      return;
    }

    // Check if sequence is complete
    const maxShots = foulType === '1-and-1' ? 2 : totalShots;
    if (currentShot >= maxShots) {
      onComplete(newResults);
      return;
    }

    // Advance to next shot
    setCurrentShot(currentShot + 1);
  };

  // Progress indicator
  const renderProgress = () => {
    const maxShots = foulType === '1-and-1' ? 2 : totalShots;
    return (
      <div className="flex gap-1 mb-2">
        {Array.from({ length: maxShots }, (_, i) => {
          const shotNum = i + 1;
          const result = results[i];
          
          if (result !== undefined) {
            // Shot already taken
            return (
              <div
                key={shotNum}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  result.made ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}
              >
                {result.made ? '✓' : '✗'}
              </div>
            );
          } else if (shotNum === currentShot) {
            // Current shot
            return (
              <div
                key={shotNum}
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-orange-500 text-white animate-pulse"
              >
                {shotNum}
              </div>
            );
          } else {
            // Future shot
            return (
              <div
                key={shotNum}
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-gray-200 text-gray-500"
              >
                {shotNum}
              </div>
            );
          }
        })}
      </div>
    );
  };

  return (
    <div className="p-3 rounded-lg border bg-blue-50 border-blue-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium">
            Free Throws - {shooterName}
          </span>
        </div>
        <button
          onClick={onSkip}
          className="w-5 h-5 rounded-full hover:bg-gray-200 flex items-center justify-center"
          title="Skip (Esc)"
        >
          <X className="w-3 h-3 text-gray-500" />
        </button>
      </div>

      {/* Progress */}
      {renderProgress()}

      {/* Prompt */}
      <div className="text-xs font-medium text-gray-700 mb-2">
        FT {currentShot} of {foulType === '1-and-1' ? '1-and-1' : totalShots}: Press <kbd className="bg-gray-200 px-1 rounded">Y</kbd> Made or <kbd className="bg-gray-200 px-1 rounded">N</kbd> Missed
      </div>

      {/* Made/Missed buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => handleShotResult(true)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 text-sm font-medium text-green-700"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Made</span>
          <kbd className="bg-green-100 px-1.5 py-0.5 rounded text-xs">Y</kbd>
        </button>
        <button
          onClick={() => handleShotResult(false)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 text-sm font-medium text-red-700"
        >
          <XCircle className="w-4 h-4" />
          <span>Missed</span>
          <kbd className="bg-red-100 px-1.5 py-0.5 rounded text-xs">N</kbd>
        </button>
      </div>
    </div>
  );
}

