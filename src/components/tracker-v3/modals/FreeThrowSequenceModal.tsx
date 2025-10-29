'use client';

import React, { useState } from 'react';
import { X, Target, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * FreeThrowSequenceModal - Manage free throw sequence
 * 
 * PURPOSE:
 * - Appears after shooting foul
 * - Tracks multiple free throw attempts
 * - Shows current attempt (1 of 2, 2 of 2, etc.)
 * - Records made/missed for each attempt
 * - Links all FTs in sequence via sequence_id
 * 
 * PHASE 4: Play Sequences & Event Linking
 */

interface FreeThrowSequenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordFreeThrow: (made: boolean) => void;
  shooterName: string;
  currentAttempt: number;
  totalAttempts: number;
  foulType: 'shooting' | 'technical' | 'flagrant' | 'bonus';
}

export function FreeThrowSequenceModal({
  isOpen,
  onClose,
  onRecordFreeThrow,
  shooterName,
  currentAttempt,
  totalAttempts,
  foulType
}: FreeThrowSequenceModalProps) {
  const [isRecording, setIsRecording] = useState(false);

  if (!isOpen) return null;

  const handleMade = async () => {
    setIsRecording(true);
    await onRecordFreeThrow(true);
    setIsRecording(false);
  };

  const handleMissed = async () => {
    setIsRecording(true);
    await onRecordFreeThrow(false);
    setIsRecording(false);
  };

  const getFoulTypeLabel = () => {
    switch (foulType) {
      case 'shooting':
        return 'Shooting Foul';
      case 'technical':
        return 'Technical Foul';
      case 'flagrant':
        return 'Flagrant Foul';
      case 'bonus':
        return 'Bonus Free Throws';
      default:
        return 'Free Throws';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4"
        style={{
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Free Throw</h2>
              <p className="text-sm text-gray-600">
                {getFoulTypeLabel()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            disabled={isRecording}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Shooter Info */}
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-green-50 to-teal-50 border border-green-200">
            <p className="text-sm text-gray-600 mb-1">Shooter</p>
            <p className="text-lg font-bold text-gray-900">{shooterName}</p>
          </div>

          {/* Attempt Counter */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100">
              <span className="text-sm font-medium text-gray-600">Attempt</span>
              <span className="text-2xl font-bold text-gray-900">
                {currentAttempt}
              </span>
              <span className="text-sm font-medium text-gray-600">of</span>
              <span className="text-2xl font-bold text-gray-900">
                {totalAttempts}
              </span>
            </div>
          </div>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mb-6">
            {[...Array(totalAttempts)].map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index < currentAttempt - 1
                    ? 'bg-green-500'
                    : index === currentAttempt - 1
                    ? 'bg-blue-500 animate-pulse'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Instructions */}
          <p className="text-center text-sm text-gray-600 mb-6">
            Did {shooterName} make the free throw?
          </p>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={handleMissed}
              disabled={isRecording}
              className="h-24 flex flex-col items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white border-2 border-red-400 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <X className="w-8 h-8" />
              <span className="text-lg font-bold">MISSED</span>
            </Button>

            <Button
              onClick={handleMade}
              disabled={isRecording}
              className="h-24 flex flex-col items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white border-2 border-green-400 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Check className="w-8 h-8" />
              <span className="text-lg font-bold">MADE</span>
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0">
          <p className="text-xs text-center text-gray-500">
            {currentAttempt === totalAttempts 
              ? 'Last free throw in sequence' 
              : `${totalAttempts - currentAttempt} more attempt${totalAttempts - currentAttempt > 1 ? 's' : ''} remaining`
            }
          </p>
        </div>
      </div>
    </div>
  );
}

