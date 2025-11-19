'use client';

import React from 'react';
import { X, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/card';

interface Player {
  id: string;
  name: string;
  teamId: string;
}

interface VictimPlayerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlayer: (playerId: string, playerName: string) => void;
  players: Player[];
  teamName: string;
  foulType: string;
}

export function VictimPlayerSelectionModal({
  isOpen,
  onClose,
  onSelectPlayer,
  players,
  teamName,
  foulType
}: VictimPlayerSelectionModalProps) {
  if (!isOpen) return null;

  const getFoulTypeDisplay = () => {
    switch (foulType) {
      case 'shooting_2pt':
        return 'Shooting Foul (2PT)';
      case 'shooting_3pt':
        return 'Shooting Foul (3PT)';
      case 'bonus':
        return '1-and-1 / Bonus';
      case 'technical':
        return 'Technical Foul';
      case 'flagrant':
        return 'Flagrant Foul';
      default:
        return 'Foul';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg bg-slate-800 border-slate-700 shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <User className="w-6 h-6 text-blue-500" />
                Who Was Fouled?
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                {getFoulTypeDisplay()} • {teamName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Player List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              {teamName} (On Court)
            </h3>
            {players.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No players available
              </div>
            ) : (
              players.map((player) => (
                <button
                  key={player.id}
                  onClick={() => onSelectPlayer(player.id, player.name)}
                  className="w-full p-4 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-left transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="font-medium">{player.name}</div>
                      <div className="text-xs text-gray-400">Select as victim</div>
                    </div>
                  </div>
                  <div className="text-xl opacity-50">→</div>
                </button>
              ))
            )}
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

