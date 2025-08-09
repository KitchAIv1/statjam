'use client';

import React from 'react';
import { Trophy, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';

interface ScoreboardV3Props {
  teamAName: string;
  teamBName: string;
  teamAScore: number;
  teamBScore: number;
  quarter: number;
  selectedTeam: 'A' | 'B';
  onTeamSelect: (team: 'A' | 'B') => void;
}

export function ScoreboardV3({
  teamAName,
  teamBName,
  teamAScore,
  teamBScore,
  quarter,
  selectedTeam,
  onTeamSelect
}: ScoreboardV3Props) {
  return (
    <Card style={{ 
      background: 'var(--dashboard-card)', 
      borderColor: 'var(--dashboard-border)',
      borderWidth: '1px'
    }}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2" style={{ color: 'var(--dashboard-text-primary)' }}>
          <Trophy className="w-5 h-5 text-orange-500" />
          Scoreboard
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Quarter Indicator */}
        <div className="text-center">
          <Badge 
            variant="outline"
            className="text-orange-500 border-orange-500 bg-orange-500/10 px-4 py-1"
          >
            Quarter {quarter}
          </Badge>
        </div>

        {/* Team Scores */}
        <div className="grid grid-cols-2 gap-4">
          {/* Team A */}
          <Button
            variant={selectedTeam === 'A' ? 'default' : 'outline'}
            onClick={() => onTeamSelect('A')}
            className={`h-auto p-4 flex flex-col gap-2 transition-all ${
              selectedTeam === 'A' 
                ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500' 
                : 'hover:bg-orange-500/10 hover:border-orange-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="font-medium text-sm">{teamAName}</span>
            </div>
            <div className="text-3xl font-bold">{teamAScore}</div>
            {selectedTeam === 'A' && (
              <Badge variant="secondary" className="text-xs bg-white/20">
                Active
              </Badge>
            )}
          </Button>

          {/* Team B */}
          <Button
            variant={selectedTeam === 'B' ? 'default' : 'outline'}
            onClick={() => onTeamSelect('B')}
            className={`h-auto p-4 flex flex-col gap-2 transition-all ${
              selectedTeam === 'B' 
                ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500' 
                : 'hover:bg-orange-500/10 hover:border-orange-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="font-medium text-sm">{teamBName}</span>
            </div>
            <div className="text-3xl font-bold">{teamBScore}</div>
            {selectedTeam === 'B' && (
              <Badge variant="secondary" className="text-xs bg-white/20">
                Active
              </Badge>
            )}
          </Button>
        </div>

        {/* Score Difference */}
        <div className="text-center pt-2">
          {teamAScore !== teamBScore && (
            <p 
              className="text-sm font-medium"
              style={{ color: 'var(--dashboard-text-secondary)' }}
            >
              {teamAScore > teamBScore 
                ? `${teamAName} leads by ${teamAScore - teamBScore}`
                : `${teamBName} leads by ${teamBScore - teamAScore}`
              }
            </p>
          )}
          {teamAScore === teamBScore && (
            <p 
              className="text-sm font-medium text-orange-500"
            >
              Tied Game
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}