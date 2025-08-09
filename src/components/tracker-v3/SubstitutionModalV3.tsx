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
  benchPlayers: Player[];
  onConfirm: (playerInId: string) => void;
}

export function SubstitutionModalV3({
  isOpen,
  onClose,
  playerOutId,
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
        
        <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Substitution Info */}
          <div 
            className="p-3 rounded-lg"
            style={{ background: 'var(--dashboard-primary)' + '10', borderColor: 'var(--dashboard-primary)' }}
          >
            <p className="text-sm font-medium text-orange-500 mb-1">
              Player Coming Out:
            </p>
            <p 
              className="text-sm"
              style={{ color: 'var(--dashboard-text-primary)' }}
            >
              Player #{playerOutId?.slice(0, 8)}...
            </p>
          </div>

          {/* Instructions */}
          <div>
            <p 
              className="text-sm mb-3"
              style={{ color: 'var(--dashboard-text-secondary)' }}
            >
              Select a player from the bench to substitute in:
            </p>
          </div>

          {/* Bench Players List */}
          <div className="space-y-2">
            {benchPlayers.length > 0 ? (
              benchPlayers.map((player) => (
                <Button
                  key={player.id}
                  onClick={() => onConfirm(player.id)}
                  variant="outline"
                  className="w-full h-auto p-3 justify-start gap-3 hover:bg-orange-500/10 hover:border-orange-500"
                >
                  {/* Jersey Number */}
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                  >
                    {player.jersey_number || '?'}
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 text-left">
                    <div 
                      className="font-medium"
                      style={{ color: 'var(--dashboard-text-primary)' }}
                    >
                      {player.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      #{player.jersey_number || 'N/A'} • Bench
                    </div>
                  </div>

                  {/* Available Badge */}
                  <Badge 
                    variant="outline"
                    className="text-green-500 border-green-500 bg-green-500/10"
                  >
                    Available
                  </Badge>
                </Button>
              ))
            ) : (
              <div className="text-center py-8">
                <User className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p 
                  className="text-sm"
                  style={{ color: 'var(--dashboard-text-secondary)' }}
                >
                  No bench players available
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t pt-4 space-y-2">
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full hover:bg-gray-500/10"
            >
              Cancel Substitution
            </Button>
            
            <p 
              className="text-xs text-center"
              style={{ color: 'var(--dashboard-text-secondary)' }}
            >
              Click on a bench player to complete the substitution
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}