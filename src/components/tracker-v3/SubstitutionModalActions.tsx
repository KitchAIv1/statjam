'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';

interface SubstitutionModalActionsProps {
  currentStep: 'team-selection' | 'player-out-selection' | 'player-in-selection';
  multiSelectMode: boolean;
  selectedPlayersInCount: number;
  onBack: () => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function SubstitutionModalActions({
  currentStep,
  multiSelectMode,
  selectedPlayersInCount,
  onBack,
  onConfirm,
  onClose
}: SubstitutionModalActionsProps) {
  if (currentStep === 'player-in-selection') {
    return (
      <>
        <Button
          onClick={onConfirm}
          disabled={selectedPlayersInCount === 0}
          className="w-full py-3 text-base font-semibold bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {multiSelectMode 
            ? `Substitute ${selectedPlayersInCount} Player${selectedPlayersInCount !== 1 ? 's' : ''}`
            : selectedPlayersInCount > 0
            ? 'Confirm Substitution'
            : 'Select a Player First'}
        </Button>
        <Button
          onClick={onBack}
          variant="outline"
          className="w-full py-3 text-base font-semibold bg-slate-800 text-gray-300 border-slate-600 hover:bg-blue-500/10 hover:border-blue-500"
        >
          Back
        </Button>
        <Button
          onClick={onClose}
          variant="outline"
          className="w-full py-3 text-base font-semibold bg-slate-800 text-gray-300 border-slate-600 hover:bg-red-500/10 hover:border-red-500 hover:text-red-400"
        >
          Cancel
        </Button>
      </>
    );
  }

  if (currentStep === 'player-out-selection') {
    return (
      <>
        <Button
          onClick={onBack}
          variant="outline"
          className="w-full py-3 text-base font-semibold bg-slate-800 text-gray-300 border-slate-600 hover:bg-blue-500/10 hover:border-blue-500"
        >
          Back to Team Selection
        </Button>
        <Button
          onClick={onClose}
          variant="outline"
          className="w-full py-3 text-base font-semibold bg-slate-800 text-gray-300 border-slate-600 hover:bg-red-500/10 hover:border-red-500 hover:text-red-400"
        >
          Cancel
        </Button>
      </>
    );
  }

  return (
    <Button
      onClick={onClose}
      variant="outline"
      className="w-full py-3 text-base font-semibold bg-slate-800 text-gray-300 border-slate-600 hover:bg-red-500/10 hover:border-red-500 hover:text-red-400"
    >
      Cancel
    </Button>
  );
}

