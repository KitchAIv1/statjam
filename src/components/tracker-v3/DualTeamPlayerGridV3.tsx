'use client';

import React from 'react';
import { User, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
}

interface DualTeamPlayerGridV3Props {
  teamAPlayers: Player[];
  teamBPlayers: Player[];
  teamAName: string;
  teamBName: string;
  selectedPlayer: string | null;
  onPlayerSelect: (playerId: string) => void;
  onSubstitution: (playerId: string) => void;
}

export function DualTeamPlayerGridV3({
  teamAPlayers,
  teamBPlayers,
  teamAName,
  teamBName,
  selectedPlayer,
  onPlayerSelect,
  onSubstitution
}: DualTeamPlayerGridV3Props) {
  
  // Get first 5 players for each team
  const teamAOnCourt = teamAPlayers.slice(0, 5);
  const teamBOnCourt = teamBPlayers.slice(0, 5);
  
  // Check if selected player is from Team A or B (check on-court players only)
  const selectedPlayerTeam = teamAOnCourt.find(p => p.id === selectedPlayer) ? 'A' : 
                            teamBOnCourt.find(p => p.id === selectedPlayer) ? 'B' : null;

  const renderPlayerCard = (player: Player, team: 'A' | 'B') => {
    const isSelected = selectedPlayer === player.id;
    
    return (
      <div 
        key={`${team}-${player.id}`}
        className={`border rounded-lg p-2 transition-all cursor-pointer ${
          isSelected
            ? 'border-orange-500 bg-orange-500/20 shadow-md'
            : 'border-gray-200 dark:border-gray-700 hover:border-orange-500/50 hover:bg-orange-500/5'
        }`}
        onClick={() => {
          onPlayerSelect(player.id);
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Jersey Number */}
            <div 
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                isSelected
                  ? 'bg-orange-500 text-white'
                  : team === 'A' 
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-blue-100 text-blue-700'
              }`}
            >
              {player.jerseyNumber ?? '?'}
            </div>

            {/* Player Info */}
            <div>
              <div 
                className={`font-medium text-sm ${
                  isSelected 
                    ? 'text-orange-600' 
                    : 'text-gray-900 dark:text-gray-100'
                }`}
              >
                {player.name}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Selected Indicator */}
            {isSelected && (
              <Badge 
                variant="outline"
                className="text-orange-500 border-orange-500 bg-orange-500/10 text-xs px-1 py-0"
              >
                Active
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
              className="h-6 w-6 p-0 hover:bg-blue-500/10 hover:border-blue-500"
              title="Substitute player"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

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
      
      <CardContent className="space-y-4">
        <p 
          className="text-sm mb-4"
          style={{ color: 'var(--dashboard-text-secondary)' }}
        >
          Select a player to record stats for:
        </p>

        {/* Team A Container */}
        <div 
          className={`rounded-lg p-3 transition-all border-2 ${
            selectedPlayerTeam === 'A'
              ? 'border-orange-500 bg-gradient-to-r from-orange-50 to-red-50 shadow-lg'
              : 'border-orange-200 bg-gradient-to-r from-orange-25 to-red-25'
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-400 to-red-500"></div>
            <h3 className="font-semibold text-sm text-orange-700">
              {teamAName} (First 5)
            </h3>
          </div>
          
          <div className="space-y-2">
            {teamAOnCourt.length > 0 ? (
              teamAOnCourt.map((player) => renderPlayerCard(player, 'A'))
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-orange-500/70">No players available</p>
              </div>
            )}
          </div>
        </div>

        {/* Team B Container */}
        <div 
          className={`rounded-lg p-3 transition-all border-2 ${
            selectedPlayerTeam === 'B'
              ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-teal-50 shadow-lg'
              : 'border-blue-200 bg-gradient-to-r from-blue-25 to-teal-25'
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-teal-500"></div>
            <h3 className="font-semibold text-sm text-blue-700">
              {teamBName} (First 5)
            </h3>
          </div>
          
          <div className="space-y-2">
            {teamBOnCourt.length > 0 ? (
              teamBOnCourt.map((player) => renderPlayerCard(player, 'B'))
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-blue-500/70">No players available</p>
              </div>
            )}
          </div>
        </div>

        {/* Selection Info */}
        {selectedPlayer && (
          <div 
            className="mt-4 p-3 rounded-lg border"
            style={{ 
              background: 'var(--dashboard-primary)' + '10', 
              borderColor: 'var(--dashboard-primary)',
              borderWidth: '1px'
            }}
          >
            <p className="text-sm font-medium text-orange-500">
              Recording stats for: {
                [...teamAOnCourt, ...teamBOnCourt].find(p => p.id === selectedPlayer)?.name
              } ({selectedPlayerTeam === 'A' ? teamAName : teamBName})
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
