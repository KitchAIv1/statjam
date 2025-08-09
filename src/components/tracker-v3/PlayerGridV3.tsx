'use client';

import React from 'react';
import { User, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';

interface Player {
  id: string;
  name: string;
  jersey_number?: number;
}

interface PlayerGridV3Props {
  players: Player[];
  selectedPlayer: string | null;
  onPlayerSelect: (playerId: string) => void;
  onSubstitution: (playerId: string) => void;
}

export function PlayerGridV3({
  players,
  selectedPlayer,
  onPlayerSelect,
  onSubstitution
}: PlayerGridV3Props) {
  return (
    <Card style={{ 
      background: 'var(--dashboard-card)', 
      borderColor: 'var(--dashboard-border)',
      borderWidth: '1px'
    }}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2" style={{ color: 'var(--dashboard-text-primary)' }}>
          <User className="w-5 h-5 text-orange-500" />
          On Court Players
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <p 
          className="text-sm mb-4"
          style={{ color: 'var(--dashboard-text-secondary)' }}
        >
          Select a player to record stats for:
        </p>

        <div className="grid grid-cols-1 gap-2">
          {players.map((player) => (
            <div 
              key={player.id}
              className={`border rounded-lg p-3 transition-all cursor-pointer ${
                selectedPlayer === player.id
                  ? 'border-orange-500 bg-orange-500/10'
                  : 'border-gray-200 dark:border-gray-700 hover:border-orange-500/50 hover:bg-orange-500/5'
              }`}
              onClick={() => onPlayerSelect(player.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Jersey Number */}
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      selectedPlayer === player.id
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {player.jersey_number || '?'}
                  </div>

                  {/* Player Info */}
                  <div>
                    <div 
                      className={`font-medium ${
                        selectedPlayer === player.id 
                          ? 'text-orange-500' 
                          : 'text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      {player.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      #{player.jersey_number || 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Selected Indicator */}
                  {selectedPlayer === player.id && (
                    <Badge 
                      variant="outline"
                      className="text-orange-500 border-orange-500 bg-orange-500/10 text-xs"
                    >
                      Selected
                    </Badge>
                  )}

                  {/* Substitution Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSubstitution(player.id);
                    }}
                    className="h-8 w-8 p-0 hover:bg-blue-500/10 hover:border-blue-500"
                    title="Substitute player"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {players.length === 0 && (
          <div className="text-center py-8">
            <User className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p 
              className="text-sm"
              style={{ color: 'var(--dashboard-text-secondary)' }}
            >
              No players available
            </p>
          </div>
        )}

        {/* Selection Info */}
        {selectedPlayer && (
          <div 
            className="mt-4 p-3 rounded-lg"
            style={{ background: 'var(--dashboard-primary)' + '10', borderColor: 'var(--dashboard-primary)' }}
          >
            <p className="text-sm font-medium text-orange-500">
              Recording stats for: {players.find(p => p.id === selectedPlayer)?.name}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}