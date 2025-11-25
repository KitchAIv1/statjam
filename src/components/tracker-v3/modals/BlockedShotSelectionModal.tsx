'use client';

import React, { useState, useEffect } from 'react';
import { X, Shield, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * BlockedShotSelectionModal - Select shooter and shot type after block
 * 
 * PURPOSE:
 * - Appears after block is recorded manually
 * - Allows tracker to select who shot the ball (from opposite team)
 * - Allows tracker to select shot type (2PT or 3PT)
 * - Triggers missed shot → rebound sequence
 * 
 * REUSES: ReboundPromptModal player selection pattern
 */

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
  teamId: string;
}

interface BlockedShotSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (shooterId: string, shotType: 'field_goal' | 'three_pointer') => void;
  shooterTeamPlayers: Player[]; // Only on-court players from shooter team
  shooterTeamName: string; // Team name for display
  blockerName: string;
}

export function BlockedShotSelectionModal({
  isOpen,
  onClose,
  onSelect,
  shooterTeamPlayers,
  shooterTeamName,
  blockerName
}: BlockedShotSelectionModalProps) {
  const [selectedShooterId, setSelectedShooterId] = useState<string | null>(null);
  const [shotType, setShotType] = useState<'field_goal' | 'three_pointer' | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedShooterId(null);
      setShotType(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ✅ AUTO-SAVE: Auto-save when BOTH shooterId AND shotType are selected
  const handleShooterSelect = (shooterId: string) => {
    setSelectedShooterId(shooterId);
    // Auto-save if shotType is already selected
    if (shotType) {
      onSelect(shooterId, shotType);
      setSelectedShooterId(null);
      setShotType(null);
    }
  };

  const handleShotTypeSelect = (type: 'field_goal' | 'three_pointer') => {
    setShotType(type);
    // Auto-save if shooterId is already selected
    if (selectedShooterId) {
      onSelect(selectedShooterId, type);
      setSelectedShooterId(null);
      setShotType(null);
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedShooterId(null);
    setShotType(null);
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
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Blocked Shot</h2>
              <p className="text-sm text-gray-600">
                {blockerName} blocked a shot
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

        {/* Content */}
        <div 
          className="flex-1 overflow-y-auto p-6"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#9ca3af #f3f4f6'
          }}
        >
          {/* Shot Type Selection */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              What type of shot was blocked?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleShotTypeSelect('field_goal')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  shotType === 'field_goal'
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900 mb-1">2PT</div>
                  <div className="text-xs text-gray-600">Two Point Shot</div>
                </div>
              </button>
              <button
                onClick={() => handleShotTypeSelect('three_pointer')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  shotType === 'three_pointer'
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                }`}
              >
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900 mb-1">3PT</div>
                  <div className="text-xs text-gray-600">Three Point Shot</div>
                </div>
              </button>
            </div>
          </div>

          {/* Player Selection - Always visible */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Who shot the ball?
            </p>
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {shooterTeamName} (On Court)
              </h3>
              <div className="space-y-2">
                {shooterTeamPlayers.length > 0 ? (
                  shooterTeamPlayers.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => handleShooterSelect(player.id)}
                      className={`w-full p-3 rounded-xl border-2 transition-all duration-200 ${
                        selectedShooterId === player.id
                          ? 'border-orange-500 bg-orange-50 shadow-md'
                          : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              selectedShooterId === player.id
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            #{player.jerseyNumber ?? '?'}
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {player.name}
                          </span>
                        </div>
                        {selectedShooterId === player.id && (
                          <Check className="w-4 h-4 text-orange-500" />
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No players on court
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions - Only Cancel button (auto-save when both selections are made) */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <Button
            onClick={handleClose}
            variant="outline"
            className="flex-1 py-3 text-base font-semibold"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

