'use client';

import React from 'react';
import { X, RefreshCw, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';

interface Player {
  id: string;
  name: string;
  jersey_number?: number;
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
      <Card 
        className="relative w-full max-w-md mx-4 max-h-[90vh] overflow-hidden"
        style={{ 
          background: 'var(--dashboard-card)', 
          borderColor: 'var(--dashboard-border)',
          borderWidth: '1px'
        }}
      >
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2" style={{ color: 'var(--dashboard-text-primary)' }}>
              <RefreshCw className="w-5 h-5 text-orange-500" />
              Player Substitution
            </CardTitle>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-red-500/10 hover:border-red-500"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Substitution Info - Enhanced */}
          <div 
            className="p-4 rounded-xl border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-red-50"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-red-600 mb-1">
                  Player Coming Out:
                </p>
                {playerOutData ? (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xs">
                      #{playerOutData.jersey_number || '?'}
                    </div>
                    <span className="font-semibold text-gray-800">
                      {playerOutData.name}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-600">
                    Player #{playerOutId?.slice(0, 8)}...
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Instructions - Enhanced */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Select Substitute Player
            </h3>
            <p className="text-sm text-gray-600">
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
                  className="w-full h-auto p-4 justify-start gap-4 hover:bg-green-500/10 hover:border-green-500 hover:scale-102 transition-all duration-200 border-2"
                >
                  {/* Jersey Number - Enhanced */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-black text-sm shadow-md">
                    #{player.jersey_number || '?'}
                  </div>

                  {/* Player Info - Enhanced */}
                  <div className="flex-1 text-left">
                    <div className="font-bold text-gray-800 text-base mb-1">
                      {player.name}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <span>Available to play</span>
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                  </div>

                  {/* Ready Badge */}
                  <div className="flex flex-col items-center gap-1">
                    <Badge 
                      variant="outline"
                      className="text-green-600 border-green-500 bg-green-500/10 font-semibold"
                    >
                      Ready
                    </Badge>
                    <span className="text-xs text-gray-400">#{index + 1}</span>
                  </div>
                </Button>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-700 mb-2">No Bench Players</h3>
                <p className="text-sm text-gray-500">
                  All available players are currently on the court
                </p>
              </div>
            )}
          </div>

          {/* Actions - Enhanced */}
          <div className="border-t-2 border-gray-100 pt-4 space-y-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full py-3 text-base font-semibold hover:bg-red-500/10 hover:border-red-500 hover:text-red-600 transition-all duration-200"
            >
              Cancel Substitution
            </Button>
            
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">
                💡 Tip: Click any player above to complete the substitution
              </p>
              <p className="text-xs text-gray-400">
                The selected player will immediately enter the game
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}