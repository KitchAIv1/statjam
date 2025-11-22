'use client';

import React, { useState, useEffect } from 'react';
import { X, Target, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/card';

interface FreeThrowSequenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (results: { made: boolean; shouldRebound: boolean }[]) => void;
  shooterName: string;
  totalShots: number; // 1, 2, or 3
  foulType: '1-and-1' | 'shooting' | 'technical' | 'flagrant';
  initialCurrentShot?: number; // ✅ NEW: For auto-sequence mode
  showProgress?: boolean; // ✅ NEW: Show progress indicator (e.g., "1 of 3")
  autoSequenceMode?: boolean; // ✅ NEW: Call onComplete after each shot (for auto-sequence)
  previousResults?: { made: boolean; shouldRebound: boolean }[]; // ✅ NEW: Previous shots' results (for progress bar)
}

export function FreeThrowSequenceModal({
  isOpen,
  onClose,
  onComplete,
  shooterName,
  totalShots,
  foulType,
  initialCurrentShot = 1,
  showProgress = false,
  autoSequenceMode = false,
  previousResults = [] // ✅ NEW: Previous shots' results for progress bar
}: FreeThrowSequenceModalProps) {
  const [currentShot, setCurrentShot] = useState(initialCurrentShot);
  const [results, setResults] = useState<{ made: boolean; shouldRebound: boolean }[]>([]);

  // ✅ FIX: Reset modal state when it closes (prevents flash/rerender)
  // ✅ NEW: Update currentShot when initialCurrentShot changes (for auto-sequence)
  useEffect(() => {
    if (!isOpen) {
      // Reset state after modal closes
      setCurrentShot(1);
      setResults([]);
    } else if (initialCurrentShot !== currentShot && isOpen) {
      // Update currentShot for auto-sequence mode (only when modal is open)
      setCurrentShot(initialCurrentShot);
      setResults([]); // Reset current modal's results (previousResults prop handles history)
    }
  }, [isOpen, initialCurrentShot]);

  // ✅ NEW: Combine previous results with current modal results for progress bar
  const allResults = [...previousResults, ...results];

  if (!isOpen) return null;

  const handleShotResult = async (made: boolean) => {
    // ✅ FIX: Rebound should only be true if it's the LAST shot AND it's missed
    const isLastShot = currentShot >= totalShots;
    const shouldRebound = !made && isLastShot;
    const newResults = [...results, { made, shouldRebound }];
    setResults(newResults);

    // Check if sequence should continue
    if (foulType === '1-and-1') {
      // 1-and-1: Stop if first shot is missed
      if (currentShot === 1 && !made) {
        await onComplete(newResults);
        // ✅ FIX: Modal will reset automatically via useEffect when isOpen becomes false
        return;
      }
      // 1-and-1: Continue to second shot if first is made
      if (currentShot === 1 && made) {
        setCurrentShot(2);
        return;
      }
      // 1-and-1: Complete after second shot
      if (currentShot === 2) {
        await onComplete(newResults);
        // ✅ FIX: Modal will reset automatically via useEffect when isOpen becomes false
        return;
      }
    } else {
      // Regular shooting fouls: All shots must be taken
      // ✅ NEW: Auto-sequence mode - call onComplete after each shot
      if (autoSequenceMode) {
        await onComplete(newResults);
        return;
      }
      
      // Normal mode: Continue until all shots are taken
      if (currentShot < totalShots) {
        setCurrentShot(currentShot + 1);
        return;
      } else {
        // Sequence complete - ✅ FIX: Wait for onComplete to finish, modal resets via useEffect
        await onComplete(newResults);
        // ✅ FIX: Modal will reset automatically via useEffect when isOpen becomes false
        return;
      }
    }
  };

  const handleClose = () => {
    onClose();
    // ✅ FIX: Modal will reset automatically via useEffect when isOpen becomes false
  };

  const getFoulTypeDisplay = () => {
    switch (foulType) {
      case '1-and-1':
        return '1-and-1 Free Throws';
      case 'shooting':
        return `${totalShots} Free Throws`;
      case 'technical':
        return 'Technical Free Throw';
      case 'flagrant':
        return `Flagrant Foul - ${totalShots} Free Throws`;
      default:
        return 'Free Throws';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700 shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Target className="w-6 h-6 text-orange-500" />
                {getFoulTypeDisplay()}
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Shooter: <span className="text-white font-medium">{shooterName}</span>
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Shot Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Progress</span>
              <span className="text-sm text-white font-medium">
                {showProgress && totalShots > 1
                  ? `Free Throw ${currentShot} of ${totalShots}`
                  : foulType === '1-and-1'
                  ? `Shot ${currentShot} of 2 (max)`
                  : `Shot ${currentShot} of ${totalShots}`}
              </span>
            </div>
            <div className="flex gap-2">
              {Array.from({ length: totalShots }).map((_, idx) => {
                // ✅ FIX: Determine bar color based on shot status
                const shotIndex = idx + 1; // 1-indexed
                const isCompleted = idx < allResults.length;
                const isCurrent = shotIndex === currentShot && !isCompleted;
                const isFuture = shotIndex > currentShot;
                
                let barColor = 'bg-gray-700'; // Default: not started
                
                if (isCompleted) {
                  // ✅ Completed shot: green if made, red if missed (stays colored)
                  barColor = allResults[idx].made ? 'bg-green-500' : 'bg-red-500';
                } else if (isCurrent) {
                  // ✅ Current shot: orange (waiting for result)
                  barColor = 'bg-orange-500';
                } else if (isFuture) {
                  // ✅ Future shot: gray (not started)
                  barColor = 'bg-gray-700';
                }
                
                return (
                  <div
                    key={idx}
                    className={`h-2 flex-1 rounded-full transition-all duration-300 ${barColor}`}
                    title={
                      isCompleted
                        ? `Shot ${shotIndex}: ${allResults[idx].made ? 'Made' : 'Missed'}`
                        : isCurrent
                        ? `Shot ${shotIndex}: In progress`
                        : `Shot ${shotIndex}: Not started`
                    }
                  />
                );
              })}
            </div>
          </div>

          {/* Current Shot Question */}
          <div className="mb-6 text-center">
            <p className="text-lg text-white font-medium mb-2">
              Did {shooterName} make Free Throw #{currentShot}?
            </p>
            {foulType === '1-and-1' && currentShot === 1 && (
              <p className="text-sm text-gray-400">
                (If missed, sequence ends)
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => handleShotResult(true)}
              className="h-20 bg-green-600 hover:bg-green-700 text-white font-bold text-lg flex flex-col items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-8 h-8" />
              Made
            </Button>
            <Button
              onClick={() => handleShotResult(false)}
              className="h-20 bg-red-600 hover:bg-red-700 text-white font-bold text-lg flex flex-col items-center justify-center gap-2"
            >
              <XCircle className="w-8 h-8" />
              Missed
            </Button>
          </div>

          {/* Info Text */}
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-xs text-blue-300 text-center">
              {foulType === '1-and-1'
                ? 'First shot must be made to attempt second shot'
                : 'All free throws must be recorded'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
