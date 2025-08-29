'use client';

import React from 'react';
import { ChevronRight, ChevronLeft, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';

interface CompactScoreboardV3Props {
  gameId?: string;
  tournamentName?: string;
  gameDate?: string;
  teamAName: string;
  teamBName: string;
  teamAScore: number;
  teamBScore: number;
  teamAFouls: number;
  teamBFouls: number;
  quarter: number;
  minutes: number;
  seconds: number;
  isRunning: boolean;
  possessionTeam: 'A' | 'B';
  selectedTeam: 'A' | 'B';
  onTeamSelect: (team: 'A' | 'B') => void;
  onPossessionToggle: () => void;
  onStartClock: () => void;
  onStopClock: () => void;
  onResetClock: () => void;
  onSetCustomTime?: (minutes: number, seconds: number) => void; // NEW: Manual time setting
}

export function CompactScoreboardV3({
  gameId,
  tournamentName,
  gameDate,
  teamAName,
  teamBName,
  teamAScore,
  teamBScore,
  teamAFouls,
  teamBFouls,
  quarter,
  minutes,
  seconds,
  isRunning,
  possessionTeam,
  selectedTeam,
  onTeamSelect,
  onPossessionToggle,
  onStartClock,
  onStopClock,
  onResetClock,
  onSetCustomTime
}: CompactScoreboardV3Props) {
  const formatTime = (min: number, sec: number) => {
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const formatTeamName = (name: string) => {
    // Convert long team names to 3-letter abbreviations
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 3).toUpperCase();
    }
    return words.map(w => w[0]).join('').substring(0, 3).toUpperCase();
  };

  return (
    <div 
      className="w-full rounded-lg p-2"
      style={{ 
        background: '#ffffff', 
        borderColor: '#e5e7eb',
        borderWidth: '1px'
      }}
    >
      {/* Main Scoreboard Row */}
      <div className="grid grid-cols-3 items-center gap-2 text-center mb-1">
        {/* Team A */}
        <Button
          onClick={() => onTeamSelect('A')}
          variant={selectedTeam === 'A' ? 'default' : 'outline'}
          className={`h-24 p-2 flex flex-col justify-center gap-1 text-xs font-bold transition-all ${
            selectedTeam === 'A' 
              ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500' 
              : 'hover:border-orange-500 hover:text-orange-500'
          }`}
        >
          <div className="text-[12px] leading-none">{formatTeamName(teamAName)}</div>
          <div className="text-5xl leading-none font-black">{teamAScore}</div>
        </Button>

        {/* Central Clock Area - V1 Style Unified */}
        <div className="flex flex-col items-center justify-center gap-1">
          {/* Game Details */}
          <div className="text-center">
            <div 
              className="text-[10px] leading-none"
              style={{ color: 'var(--dashboard-text-secondary)' }}
            >
              {tournamentName || 'Basketball Tournament'}
            </div>
            {gameDate && (
              <div 
                className="text-[9px] leading-none mt-0.5"
                style={{ color: 'var(--dashboard-text-secondary)' }}
              >
                {gameDate}
              </div>
            )}
          </div>
          
          {/* Quarter Badge */}
          <Badge 
            variant="outline"
            className="text-orange-500 border-orange-500 bg-orange-500/10 px-3 py-1 text-sm font-bold"
          >
            Q{quarter}
          </Badge>
          
          {/* MASSIVE Clock Display */}
          <div 
            className={`text-4xl font-black font-mono leading-none ${
              isRunning ? 'text-green-500' : 'text-orange-500'
            }`}
          >
            {formatTime(minutes, seconds)}
          </div>
          
          {/* Possession Arrow - Centered */}
          <Button
            onClick={onPossessionToggle}
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-orange-500 hover:bg-orange-500/20 flex items-center justify-center text-[10px]"
            style={{ color: 'var(--dashboard-primary)' }}
          >
            {possessionTeam === 'A' ? (
              <>← {formatTeamName(teamAName)}</>
            ) : (
              <>{formatTeamName(teamBName)} →</>
            )}
          </Button>
          
          {/* Clock Controls - Compact */}
          <div className="flex gap-1">
            <Button
              onClick={isRunning ? onStopClock : onStartClock}
              size="sm"
              className={`h-5 px-2 flex items-center gap-1 text-[9px] ${
                isRunning 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isRunning ? <Pause className="w-2 h-2" /> : <Play className="w-2 h-2" />}
              {isRunning ? 'Stop' : 'Start'}
            </Button>
            
            <Button
              onClick={onResetClock}
              variant="outline"
              size="sm"
              className="h-5 px-2 flex items-center gap-1 text-[9px] hover:border-orange-500 hover:text-orange-500"
            >
              <RotateCcw className="w-2 h-2" />
              Reset
            </Button>
          </div>
        </div>

        {/* Team B */}
        <Button
          onClick={() => onTeamSelect('B')}
          variant={selectedTeam === 'B' ? 'default' : 'outline'}
          className={`h-24 p-2 flex flex-col justify-center gap-1 text-xs font-bold transition-all ${
            selectedTeam === 'B' 
              ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500' 
              : 'hover:border-orange-500 hover:text-orange-500'
          }`}
        >
          <div className="text-[12px] leading-none">{formatTeamName(teamBName)}</div>
          <div className="text-5xl leading-none font-black">{teamBScore}</div>
        </Button>
      </div>




    </div>
  );
}