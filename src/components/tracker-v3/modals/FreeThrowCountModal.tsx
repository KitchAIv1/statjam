/**
 * Free Throw Count Selection Modal
 * 
 * Reusable modal for selecting number of free throws (1, 2, or 3).
 * Used in FULL auto mode for FT Made button auto-sequence.
 * 
 * Follows .cursorrules: <200 lines, single responsibility
 */

'use client';

import React from 'react';
import { X, Target } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/card';

interface FreeThrowCountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCount: (count: 1 | 2 | 3) => void;
  shooterName: string;
}

export function FreeThrowCountModal({
  isOpen,
  onClose,
  onSelectCount,
  shooterName
}: FreeThrowCountModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700 shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Target className="w-6 h-6 text-orange-500" />
                Free Throw Count
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Shooter: <span className="text-white font-medium">{shooterName}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Question */}
          <div className="mb-6 text-center">
            <p className="text-lg text-white font-medium mb-4">
              How many free throws?
            </p>
          </div>

          {/* Count Selection Buttons */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Button
              onClick={() => onSelectCount(1)}
              className="h-20 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg flex flex-col items-center justify-center gap-2"
            >
              <span className="text-2xl">1</span>
              <span className="text-xs">Free Throw</span>
            </Button>
            <Button
              onClick={() => onSelectCount(2)}
              className="h-20 bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg flex flex-col items-center justify-center gap-2"
            >
              <span className="text-2xl">2</span>
              <span className="text-xs">Free Throws</span>
            </Button>
            <Button
              onClick={() => onSelectCount(3)}
              className="h-20 bg-red-600 hover:bg-red-700 text-white font-bold text-lg flex flex-col items-center justify-center gap-2"
            >
              <span className="text-2xl">3</span>
              <span className="text-xs">Free Throws</span>
            </Button>
          </div>

          {/* Cancel Button */}
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
}

