'use client';

import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/card';

export type FoulType = 'personal' | 'shooting_2pt' | 'shooting_3pt' | 'bonus' | 'technical' | 'flagrant' | 'offensive';

interface FoulTypeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFoulType: (foulType: FoulType) => void;
  foulerName: string;
}

export function FoulTypeSelectionModal({
  isOpen,
  onClose,
  onSelectFoulType,
  foulerName
}: FoulTypeSelectionModalProps) {
  if (!isOpen) return null;

  const foulTypes: { type: FoulType; label: string; description: string; color: string }[] = [
    {
      type: 'personal',
      label: 'Personal Foul',
      description: 'No free throws',
      color: 'bg-gray-600 hover:bg-gray-700'
    },
    {
      type: 'shooting_2pt',
      label: 'Shooting Foul (2PT)',
      description: '2 free throws',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      type: 'shooting_3pt',
      label: 'Shooting Foul (3PT)',
      description: '3 free throws',
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      type: 'bonus',
      label: '1-and-1 / Bonus',
      description: 'Up to 2 free throws',
      color: 'bg-indigo-600 hover:bg-indigo-700'
    },
    {
      type: 'technical',
      label: 'Technical Foul',
      description: '1 free throw + possession',
      color: 'bg-orange-600 hover:bg-orange-700'
    },
    {
      type: 'flagrant',
      label: 'Flagrant Foul',
      description: '2 free throws + possession',
      color: 'bg-red-600 hover:bg-red-700'
    },
    {
      type: 'offensive',
      label: 'Offensive Foul',
      description: 'Turnover, no free throws',
      color: 'bg-yellow-600 hover:bg-yellow-700'
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
                <AlertTriangle className="w-6 h-6 text-red-500" />
                Select Foul Type
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Fouler: <span className="text-white font-medium">{foulerName}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Foul Type Options */}
          <div className="space-y-3">
            {foulTypes.map((foul) => (
              <button
                key={foul.type}
                onClick={() => onSelectFoulType(foul.type)}
                className={`w-full p-4 rounded-lg text-left transition-all ${foul.color} text-white`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-lg">{foul.label}</div>
                    <div className="text-sm opacity-90">{foul.description}</div>
                  </div>
                  <div className="text-2xl opacity-50">→</div>
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

