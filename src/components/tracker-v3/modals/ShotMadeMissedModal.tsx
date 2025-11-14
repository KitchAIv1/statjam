'use client';

import React from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/card';

interface ShotMadeMissedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (made: boolean) => void;
  playerName: string;
  shotType: '2pt' | '3pt';
}

export function ShotMadeMissedModal({
  isOpen,
  onClose,
  onSelect,
  playerName,
  shotType
}: ShotMadeMissedModalProps) {
  if (!isOpen) return null;

  const handleMade = () => {
    onSelect(true);
  };

  const handleMissed = () => {
    onSelect(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700 shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                Shooting Foul ({shotType === '2pt' ? '2PT' : '3PT'})
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                {playerName} was fouled while shooting
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Question */}
          <div className="mb-6">
            <p className="text-lg text-white text-center mb-4">
              Was the shot made or missed?
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Made Button */}
              <button
                onClick={handleMade}
                className="p-6 rounded-lg border-2 border-green-500 bg-green-500/20 hover:bg-green-500/30 transition-all flex flex-col items-center gap-3"
              >
                <CheckCircle className="w-12 h-12 text-green-400" />
                <div className="text-center">
                  <div className="text-xl font-bold text-white mb-1">Made</div>
                  <div className="text-xs text-gray-300">
                    Basket counts + 1 FT
                  </div>
                </div>
              </button>
              
              {/* Missed Button */}
              <button
                onClick={handleMissed}
                className="p-6 rounded-lg border-2 border-red-500 bg-red-500/20 hover:bg-red-500/30 transition-all flex flex-col items-center gap-3"
              >
                <XCircle className="w-12 h-12 text-red-400" />
                <div className="text-center">
                  <div className="text-xl font-bold text-white mb-1">Missed</div>
                  <div className="text-xs text-gray-300">
                    {shotType === '2pt' ? '2' : '3'} Free Throws
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Cancel Button */}
          <div className="mt-4">
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

