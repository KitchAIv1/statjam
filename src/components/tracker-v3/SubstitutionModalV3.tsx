'use client';

import React from 'react';
import { X, RefreshCw, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
}

interface SubstitutionModalV3Props {
  isOpen: boolean;
  onClose: () => void;
  playerOutId: string | null;
  playerOutData?: Player | null;
  benchPlayers: Player[];
  onConfirm: (playerInId: string) => void;
}

export function SubstitutionModalV3({
  isOpen,
  onClose,
  playerOutId,
  playerOutData,
  benchPlayers,
  onConfirm
}: SubstitutionModalV3Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-md mx-4 max-h-[90vh] overflow-hidden rounded-xl border shadow-2xl"
        style={{ 
          backgroundColor: '#1e293b',
          borderColor: '#475569',
          borderWidth: '2px'
        }}
      >
        {/* Header */}
        <div className="pb-4 px-6 pt-6">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
              <RefreshCw className="w-5 h-5 text-orange-500" />
              Player Substitution
            </h3>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-red-500/10 hover:border-red-500"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Content */}
        <div className="space-y-6 max-h-[70vh] overflow-y-auto px-6 pb-6">
          {/* Substitution Info - Enhanced */}
          <div 
            className="p-4 rounded-xl border-2"
            style={{ 
              borderColor: '#ef4444',
              background: 'rgba(239, 68, 68, 0.15)'
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-red-400 mb-1">
                  Player Coming Out:
                </p>
                {playerOutData ? (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xs">
                      #{playerOutData.jerseyNumber || '?'}
                    </div>
                    <span className="font-semibold text-white">
                      {playerOutData.name}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-300">
                    Player #{playerOutId?.slice(0, 8)}...
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Instructions - Enhanced */}
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2 text-white">
              Select Substitute Player
            </h3>
            <p className="text-sm text-gray-300">
              Choose a player from the bench to bring into the game
            </p>
          </div>

          {/* Bench Players List - Enhanced */}
          <div className="space-y-3">
            {benchPlayers.length > 0 ? (
              benchPlayers.map((player, index) => (
                <Button
                  key={player.id}
                  onClick={() => onConfirm(player.id)}
                  variant="outline"
                  className="w-full h-auto p-4 justify-start gap-4 bg-slate-800 border-slate-600 hover:bg-green-500/20 hover:border-green-500 hover:scale-102 transition-all duration-200 border-2"
                >
                  {/* Jersey Number - Enhanced */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-black text-sm shadow-md">
                    #{player.jerseyNumber || '?'}
                  </div>

                  {/* Player Info - Enhanced */}
                  <div className="flex-1 text-left">
                    <div className="font-bold text-base mb-1 text-white">
                      {player.name}
                    </div>
                    <div className="text-sm flex items-center gap-2 text-gray-300">
                      <span>Available to play</span>
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                  </div>

                  {/* Ready Badge */}
                  <div className="flex flex-col items-center gap-1">
                    <Badge 
                      variant="outline"
                      className="text-green-400 border-green-500 bg-green-500/20 font-semibold"
                    >
                      Ready
                    </Badge>
                    <span className="text-xs text-gray-400">#{index + 1}</span>
                  </div>
                </Button>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-semibold mb-2 text-white">No Bench Players</h3>
                <p className="text-sm text-gray-300">
                  All available players are currently on the court
                </p>
              </div>
            )}
          </div>

          {/* Actions - Enhanced */}
          <div className="border-t-2 border-slate-700 pt-4 space-y-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full py-3 text-base font-semibold bg-slate-800 text-gray-300 border-slate-600 hover:bg-red-500/10 hover:border-red-500 hover:text-red-400 transition-all duration-200"
            >
              Cancel Substitution
            </Button>
            
            <div className="text-center">
              <p className="text-xs mb-1 text-gray-300">
                💡 Tip: Click any player above to complete the substitution
              </p>
              <p className="text-xs text-gray-400">
                The selected player will immediately enter the game
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}