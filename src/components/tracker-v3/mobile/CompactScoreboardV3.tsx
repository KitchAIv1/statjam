'use client';

import React from 'react';
import { ChevronRight, ChevronLeft, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { PossessionIndicator } from '../PossessionIndicator';

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
  // Shot Clock Props
  shotClockSeconds?: number;
  shotClockIsRunning?: boolean;
  shotClockIsVisible?: boolean;
  onShotClockReset?: (seconds?: number) => void;
  onShotClockSetTime?: (seconds: number) => void;
  // ✅ REFINEMENT 4: Possession Indicator Props
  showPossessionIndicator?: boolean;
  currentPossessionTeamId?: string;
  teamAId?: string;
  teamBId?: string;
  possessionArrow?: string;
  isCoachMode?: boolean;
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
  onSetCustomTime,
  shotClockSeconds = 24,
  shotClockIsRunning = false,
  shotClockIsVisible = true,
  onShotClockReset,
  onShotClockSetTime,
  showPossessionIndicator = false,
  currentPossessionTeamId,
  teamAId,
  teamBId,
  possessionArrow,
  isCoachMode = false
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
      <div className="grid grid-cols-5 items-center gap-1 text-center mb-1">
        {/* Team A - Narrower */}
        <Button
          onClick={() => onTeamSelect('A')}
          variant={selectedTeam === 'A' ? 'default' : 'outline'}
          className={`h-28 p-1 flex flex-col justify-center gap-1 text-xs font-bold transition-all ${
            selectedTeam === 'A' 
              ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500' 
              : 'hover:border-orange-500 hover:text-orange-500'
          }`}
        >
          <div className="text-[10px] leading-none">{formatTeamName(teamAName)}</div>
          <div className="text-4xl leading-none font-black font-mono tracking-tight">{teamAScore}</div>
        </Button>

        {/* Left Container - Quarter Section + Start/Reset Buttons (beside T1) */}
        <div className="col-span-1 flex flex-col items-center justify-center gap-2">
          {/* Quarter Section */}
          <div className="flex flex-col items-center justify-center gap-1">
            <Badge 
              variant="outline"
              className="text-orange-500 border-orange-500 bg-orange-500/10 px-2 py-1 text-xs font-bold"
            >
              Q{quarter}
            </Badge>
            <div 
              className={`text-2xl font-black font-mono leading-none ${
                isRunning ? 'text-green-500' : 'text-orange-500'
              }`}
            >
              {formatTime(minutes, seconds)}
            </div>
          </div>

          {/* Start/Reset Buttons */}
          <div className="flex flex-col gap-1">
            <Button
              onClick={isRunning ? onStopClock : onStartClock}
              size="sm"
              className={`h-8 px-3 flex items-center gap-2 text-[10px] font-bold ${
                isRunning 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {isRunning ? 'Stop' : 'Start'}
            </Button>
            
            <Button
              onClick={onResetClock}
              variant="outline"
              size="sm"
              className="h-8 px-3 flex items-center gap-2 text-[10px] font-bold hover:border-orange-500 hover:text-orange-500"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </Button>
          </div>
        </div>

        {/* ✅ REFINEMENT 4: Center - Possession Indicator (Moved from MobileLayoutV3) */}
        <div className="col-span-1 flex items-center justify-center">
          {showPossessionIndicator && currentPossessionTeamId && teamAId && teamBId && possessionArrow !== undefined ? (
            <PossessionIndicator
              currentTeamId={currentPossessionTeamId}
              teamAId={teamAId}
              teamBId={teamBId}
              teamAName={teamAName}
              teamBName={teamBName}
              possessionArrow={possessionArrow}
              isMobile={true}
            />
          ) : null}
        </div>

        {/* Right Container - Shot Clock Section + Buttons (beside T2) */}
        {shotClockIsVisible && (
          <div className="col-span-1 flex flex-col items-center justify-center gap-2">
            {/* Shot Clock Section */}
            <div className="flex flex-col items-center justify-center gap-1">
              <Badge 
                variant="outline"
                className="text-gray-400 border-gray-400 bg-gray-400/10 px-2 py-1 text-xs font-bold"
              >
                Shot
              </Badge>
              <div 
                className={`text-2xl font-black font-mono leading-none ${
                  shotClockSeconds !== undefined && shotClockSeconds <= 5 ? 'text-red-500' : 
                  shotClockSeconds !== undefined && shotClockSeconds <= 10 ? 'text-orange-500' : 
                  shotClockIsRunning ? 'text-green-500' : 'text-gray-400'
                }`}
                style={{ 
                  textShadow: shotClockSeconds !== undefined && shotClockSeconds <= 5 ? '0 0 6px rgba(239, 68, 68, 0.6)' : 'none'
                }}
              >
                {shotClockSeconds !== undefined ? shotClockSeconds.toString().padStart(2, '0') : '24'}
              </div>
            </div>

            {/* Shot Clock Buttons - 2x2 Grid */}
            <div className="grid grid-cols-2 gap-1">
              <Button
                onClick={() => onShotClockReset?.(24)}
                variant="outline"
                size="sm"
                className="h-7 px-2 text-[9px] font-bold border-gray-600 text-gray-400 hover:border-orange-500 hover:text-orange-500"
              >
                24s
              </Button>
              <Button
                onClick={() => onShotClockReset?.(14)}
                variant="outline"
                size="sm"
                className="h-7 px-2 text-[9px] font-bold border-gray-600 text-gray-400 hover:border-orange-500 hover:text-orange-500"
              >
                14s
              </Button>
              <Button
                onClick={() => onShotClockReset?.()}
                variant="outline"
                size="sm"
                className="h-7 px-2 text-[9px] font-bold border-gray-600 text-gray-400 hover:border-gray-500"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
              <Button
                onClick={() => {
                  // TODO: Implement edit functionality
                  console.log('Edit shot clock time');
                  alert('Edit functionality will be implemented');
                }}
                variant="outline"
                size="sm"
                className="h-7 px-2 text-[9px] font-bold border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
              >
                ✏️
              </Button>
            </div>
          </div>
        )}

        {/* Team B - Narrower */}
        <Button
          onClick={() => onTeamSelect('B')}
          variant={selectedTeam === 'B' ? 'default' : 'outline'}
          className={`h-28 p-1 flex flex-col justify-center gap-1 text-xs font-bold transition-all ${
            selectedTeam === 'B' 
              ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500' 
              : 'hover:border-orange-500 hover:text-orange-500'
          }`}
        >
          <div className="text-[10px] leading-none">{formatTeamName(teamBName)}</div>
          <div className="text-4xl leading-none font-black font-mono tracking-tight">{teamBScore}</div>
        </Button>
      </div>

      {/* Date Row */}
      <div className="flex justify-center mt-2">
        {gameDate && (
          <div 
            className="text-[8px] leading-none"
            style={{ color: 'var(--dashboard-text-secondary)' }}
          >
            {gameDate}
          </div>
        )}
      </div>




    </div>
  );
}