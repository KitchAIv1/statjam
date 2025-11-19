'use client';

import React, { useState } from 'react';
import { X, UserPlus, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * AssistPromptModal - Prompt for assist after made shot
 * 
 * PURPOSE:
 * - Appears after made field goal or 3-pointer
 * - Allows user to select which player assisted
 * - Links assist to shot via sequence_id
 * - Optional (can skip if no assist)
 * 
 * PHASE 4: Play Sequences & Event Linking
 */

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
}

interface AssistPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlayer: (playerId: string) => void;
  onSkip: () => void;
  players: Player[];
  shooterName: string;
  shotType: string;
  shotValue: number;
}

export function AssistPromptModal({
  isOpen,
  onClose,
  onSelectPlayer,
  onSkip,
  players,
  shooterName,
  shotType,
  shotValue
}: AssistPromptModalProps) {
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
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Assist?</h2>
              <p className="text-sm text-gray-600">
                {shooterName} made {shotValue}pt shot
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
            Who assisted on this shot?
          </p>
          
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            (On Court)
          </h3>
          
          <div className="space-y-2">
            {players.map((player) => (
              <button
                key={player.id}
                onClick={() => setSelectedPlayerId(player.id)}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                  selectedPlayerId === player.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        selectedPlayerId === player.id
                          ? 'bg-blue-500 text-white'
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
                    <Check className="w-5 h-5 text-blue-500" />
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
            No Assist
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedPlayerId}
            className={`flex-1 py-3 text-base font-semibold ${
              selectedPlayerId
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                : 'opacity-50 cursor-not-allowed'
            }`}
          >
            Record Assist
          </Button>
        </div>
      </div>
    </div>
  );
}

