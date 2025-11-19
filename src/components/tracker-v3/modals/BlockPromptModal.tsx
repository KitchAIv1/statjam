'use client';

import React, { useState } from 'react';
import { X, Shield, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * BlockPromptModal - Prompt for block after missed shot
 * 
 * PURPOSE:
 * - Appears after missed field goal or 3-pointer
 * - Allows user to select which player blocked the shot
 * - Links block to miss via sequence_id
 * - Optional (can skip if no block)
 * 
 * PHASE 4: Play Sequences & Event Linking
 */

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
  teamId: string;
}

interface BlockPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlayer: (playerId: string) => void;
  onSkip: () => void;
  defensivePlayers: Player[];
  shooterName: string;
  shotType: string;
}

export function BlockPromptModal({
  isOpen,
  onClose,
  onSelectPlayer,
  onSkip,
  defensivePlayers,
  shooterName,
  shotType
}: BlockPromptModalProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedPlayerId) {
      onSelectPlayer(selectedPlayerId);
      setSelectedPlayerId(null);
    }
  };

  const handleSkip = () => {
    onSkip();
    setSelectedPlayerId(null);
  };

  const handleClose = () => {
    onClose();
    setSelectedPlayerId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4"
        style={{
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Block?</h2>
              <p className="text-sm text-gray-600">
                {shooterName} missed {shotType}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Player List */}
        <div 
          className="flex-1 overflow-y-auto p-6"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#9ca3af #f3f4f6'
          }}
        >
          <p className="text-sm text-gray-600 mb-4">
            Who blocked the shot?
          </p>
          
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            (On Court)
          </h3>
          
          <div className="space-y-2">
            {defensivePlayers.map((player) => (
              <button
                key={player.id}
                onClick={() => setSelectedPlayerId(player.id)}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                  selectedPlayerId === player.id
                    ? 'border-red-500 bg-red-50 shadow-md'
                    : 'border-gray-200 hover:border-red-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        selectedPlayerId === player.id
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      #{player.jerseyNumber || '?'}
                    </div>
                    <span className="font-medium text-gray-900">
                      {player.name}
                    </span>
                  </div>
                  {selectedPlayerId === player.id && (
                    <Check className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <Button
            onClick={handleSkip}
            variant="outline"
            className="flex-1 py-3 text-base font-semibold"
          >
            No Block
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedPlayerId}
            className={`flex-1 py-3 text-base font-semibold ${
              selectedPlayerId
                ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white'
                : 'opacity-50 cursor-not-allowed'
            }`}
          >
            Record Block
          </Button>
        </div>
      </div>
    </div>
  );
}

