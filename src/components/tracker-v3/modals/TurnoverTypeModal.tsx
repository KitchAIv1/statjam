'use client';

/**
 * TurnoverTypeModal - Select type of turnover
 * 
 * Shown when user clicks TOV button to select specific turnover type.
 * Follows same pattern as FoulTypeSelectionModal.
 * 
 * @module TurnoverTypeModal
 */

import React from 'react';
import { X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/card';

// Valid turnover modifiers per database constraint
export type TurnoverType = 'travel' | 'bad_pass' | 'double_dribble' | 'offensive_foul' | 'other';

interface TurnoverTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTurnoverType: (turnoverType: TurnoverType) => void;
  playerName: string;
}

export function TurnoverTypeModal({
  isOpen,
  onClose,
  onSelectTurnoverType,
  playerName
}: TurnoverTypeModalProps) {
  if (!isOpen) return null;

  // Turnover types matching database constraint
  const turnoverTypes: { type: TurnoverType; label: string; description: string; color: string }[] = [
    {
      type: 'travel',
      label: 'Travel',
      description: 'Walking with the ball',
      color: 'bg-yellow-600 hover:bg-yellow-700'
    },
    {
      type: 'bad_pass',
      label: 'Bad Pass',
      description: 'Pass out of bounds or intercepted',
      color: 'bg-orange-600 hover:bg-orange-700'
    },
    {
      type: 'double_dribble',
      label: 'Double Dribble',
      description: 'Dribbled after stopping',
      color: 'bg-red-600 hover:bg-red-700'
    },
    {
      type: 'other',
      label: 'Other',
      description: 'Other violation',
      color: 'bg-gray-600 hover:bg-gray-700'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg bg-slate-800 border-slate-700 shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <RotateCcw className="w-6 h-6 text-yellow-500" />
                Select Turnover Type
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Player: <span className="text-white font-medium">{playerName}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Turnover Type Options - 2x2 Grid */}
          <div className="grid grid-cols-2 gap-3">
            {turnoverTypes.map((to) => (
              <button
                key={to.type}
                onClick={() => onSelectTurnoverType(to.type)}
                className={`p-4 rounded-lg text-left transition-all ${to.color} text-white h-full`}
              >
                <div className="flex flex-col justify-between h-full">
                  <div>
                    <div className="font-bold text-lg">{to.label}</div>
                    <div className="text-sm opacity-90 mt-1">{to.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Cancel Button */}
          <div className="mt-6">
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
