'use client';

import React from 'react';
import { Users, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';

interface TeamSelectorV3Props {
  selectedTeam: 'A' | 'B';
  teamAName: string;
  teamBName: string;
  onTeamSelect: (team: 'A' | 'B') => void;
}

export function TeamSelectorV3({
  selectedTeam,
  teamAName,
  teamBName,
  onTeamSelect
}: TeamSelectorV3Props) {
  return (
    <Card style={{ 
      background: 'var(--dashboard-card)', 
      borderColor: 'var(--dashboard-border)',
      borderWidth: '1px'
    }}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2" style={{ color: 'var(--dashboard-text-primary)' }}>
          <Shield className="w-5 h-5 text-orange-500" />
          Active Team
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <p 
          className="text-sm mb-4"
          style={{ color: 'var(--dashboard-text-secondary)' }}
        >
          Select the team you&apos;re recording stats for:
        </p>

        <div className="grid grid-cols-1 gap-3">
          {/* Team A Button */}
          <Button
            onClick={() => onTeamSelect('A')}
            variant={selectedTeam === 'A' ? 'default' : 'outline'}
            size="lg"
            className={`justify-start gap-3 h-14 transition-all ${
              selectedTeam === 'A'
                ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500' 
                : 'hover:bg-orange-500/10 hover:border-orange-500'
            }`}
          >
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                selectedTeam === 'A' ? 'bg-white/20' : 'bg-orange-500/10'
              }`}
            >
              <Users className={`w-4 h-4 ${selectedTeam === 'A' ? 'text-white' : 'text-orange-500'}`} />
            </div>
            
            <div className="flex-1 text-left">
              <div className="font-semibold">{teamAName}</div>
              <div className={`text-xs ${selectedTeam === 'A' ? 'text-white/70' : 'text-gray-500'}`}>
                Team A
              </div>
            </div>

            {selectedTeam === 'A' && (
              <div className="w-3 h-3 rounded-full bg-white/80 animate-pulse" />
            )}
          </Button>

          {/* Team B Button */}
          <Button
            onClick={() => onTeamSelect('B')}
            variant={selectedTeam === 'B' ? 'default' : 'outline'}
            size="lg"
            className={`justify-start gap-3 h-14 transition-all ${
              selectedTeam === 'B'
                ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500' 
                : 'hover:bg-orange-500/10 hover:border-orange-500'
            }`}
          >
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                selectedTeam === 'B' ? 'bg-white/20' : 'bg-orange-500/10'
              }`}
            >
              <Users className={`w-4 h-4 ${selectedTeam === 'B' ? 'text-white' : 'text-orange-500'}`} />
            </div>
            
            <div className="flex-1 text-left">
              <div className="font-semibold">{teamBName}</div>
              <div className={`text-xs ${selectedTeam === 'B' ? 'text-white/70' : 'text-gray-500'}`}>
                Team B
              </div>
            </div>

            {selectedTeam === 'B' && (
              <div className="w-3 h-3 rounded-full bg-white/80 animate-pulse" />
            )}
          </Button>
        </div>

        {/* Selection Indicator */}
        <div className="text-center pt-2">
          <p 
            className="text-sm font-medium text-orange-500"
          >
            Recording stats for {selectedTeam === 'A' ? teamAName : teamBName}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}