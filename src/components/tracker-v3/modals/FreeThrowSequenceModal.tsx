'use client';

import React, { useState } from 'react';
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
}

export function FreeThrowSequenceModal({
  isOpen,
  onClose,
  onComplete,
  shooterName,
  totalShots,
  foulType
}: FreeThrowSequenceModalProps) {
  const [currentShot, setCurrentShot] = useState(1);
  const [results, setResults] = useState<{ made: boolean; shouldRebound: boolean }[]>([]);

  if (!isOpen) return null;

  const handleShotResult = (made: boolean) => {
    const newResults = [...results, { made, shouldRebound: !made }];
    setResults(newResults);

    // Check if sequence should continue
    if (foulType === '1-and-1') {
      // 1-and-1: Stop if first shot is missed
      if (currentShot === 1 && !made) {
        onComplete(newResults);
        resetModal();
        return;
      }
      // 1-and-1: Continue to second shot if first is made
      if (currentShot === 1 && made) {
        setCurrentShot(2);
        return;
      }
      // 1-and-1: Complete after second shot
      if (currentShot === 2) {
        onComplete(newResults);
        resetModal();
        return;
      }
    } else {
      // Regular shooting fouls: All shots must be taken
      if (currentShot < totalShots) {
        setCurrentShot(currentShot + 1);
        return;
      } else {
        // Sequence complete
        onComplete(newResults);
        resetModal();
        return;
      }
    }
  };

  const resetModal = () => {
    setCurrentShot(1);
    setResults([]);
  };

  const handleClose = () => {
    resetModal();
    onClose();
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
                Shot {currentShot} of {foulType === '1-and-1' ? '2 (max)' : totalShots}
              </span>
            </div>
            <div className="flex gap-2">
              {Array.from({ length: totalShots }).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 flex-1 rounded-full transition-all ${
                    idx < results.length
                      ? results[idx].made
                        ? 'bg-green-500'
                        : 'bg-red-500'
                      : idx === currentShot - 1
                      ? 'bg-orange-500'
                      : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Previous Results */}
          {results.length > 0 && (
            <div className="mb-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
              <p className="text-xs text-gray-400 mb-2">Previous Shots:</p>
              <div className="flex gap-2">
                {results.map((result, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      result.made
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {result.made ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    Shot {idx + 1}: {result.made ? 'Made' : 'Missed'}
                  </div>
                ))}
              </div>
            </div>
          )}

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
