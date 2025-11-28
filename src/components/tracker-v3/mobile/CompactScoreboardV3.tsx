'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Play, Pause, RotateCcw, Eye, EyeOff, Check, X, Pencil } from 'lucide-react';
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
  onSetQuarter?: (quarter: number) => void; // ✅ NEW: Manual quarter setting
  // Shot Clock Props
  shotClockSeconds?: number;
  shotClockIsRunning?: boolean;
  shotClockIsVisible?: boolean;
  onShotClockReset?: (seconds?: number) => void;
  onShotClockSetTime?: (seconds: number) => void;
  onToggleShotClockVisibility?: () => void; // ✅ Toggle shot clock display
  // ✅ REFINEMENT 4: Possession Indicator Props
  showPossessionIndicator?: boolean;
  currentPossessionTeamId?: string;
  teamAId?: string;
  teamBId?: string;
  possessionArrow?: string;
  isCoachMode?: boolean;
  // ✅ PHASE 6: Manual possession control
  onPossessionChange?: (teamId: string) => void;
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
  onSetQuarter,
  shotClockSeconds = 24,
  shotClockIsRunning = false,
  shotClockIsVisible = true,
  onShotClockReset,
  onShotClockSetTime,
  onToggleShotClockVisibility,
  showPossessionIndicator = false,
  currentPossessionTeamId,
  teamAId,
  teamBId,
  possessionArrow,
  isCoachMode = false,
  onPossessionChange
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

  // ✅ NEW: Quarter edit mode state
  const [isQuarterEditMode, setIsQuarterEditMode] = useState(false);
  const [editQuarter, setEditQuarter] = useState(quarter);

  // ✅ NEW: Clock edit mode state
  const [isClockEditMode, setIsClockEditMode] = useState(false);
  const [editMinutes, setEditMinutes] = useState(minutes);
  const [editSeconds, setEditSeconds] = useState(seconds);

  // ✅ Sync editQuarter when quarter prop changes
  useEffect(() => {
    if (!isQuarterEditMode) {
      setEditQuarter(quarter);
    }
  }, [quarter, isQuarterEditMode]);

  // ✅ Sync editMinutes/editSeconds when clock props change
  useEffect(() => {
    if (!isClockEditMode) {
      setEditMinutes(minutes);
      setEditSeconds(seconds);
    }
  }, [minutes, seconds, isClockEditMode]);

  // ✅ NEW: Handle quarter edit mode toggle
  const handleQuarterEditToggle = () => {
    if (isQuarterEditMode) {
      // Cancel edit - reset to current quarter
      setEditQuarter(quarter);
    } else {
      // Enter edit mode - initialize with current quarter
      setEditQuarter(quarter);
    }
    setIsQuarterEditMode(!isQuarterEditMode);
  };

  // ✅ NEW: Handle quarter change
  const handleSetQuarter = () => {
    if (onSetQuarter && editQuarter !== quarter) {
      onSetQuarter(editQuarter);
    }
    setIsQuarterEditMode(false);
  };

  // ✅ NEW: Handle clock edit mode toggle
  const handleClockEditToggle = () => {
    if (isClockEditMode) {
      // Cancel edit - reset to current values
      setEditMinutes(minutes);
      setEditSeconds(seconds);
    } else {
      // Enter edit mode - initialize with current values
      setEditMinutes(minutes);
      setEditSeconds(seconds);
    }
    setIsClockEditMode(!isClockEditMode);
  };

  // ✅ NEW: Handle clock time set
  const handleSetCustomTime = () => {
    if (onSetCustomTime) {
      onSetCustomTime(editMinutes, editSeconds);
    }
    setIsClockEditMode(false);
  };

  const getQuarterDisplay = (q: number) => {
    if (q <= 4) return `Q${q}`;
    return `OT${q - 4}`;
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
            {isQuarterEditMode ? (
              // ✅ Quarter Edit Mode - Dropdown (Mobile)
              <div className="flex flex-col items-center gap-1">
                <select
                  value={editQuarter}
                  onChange={(e) => setEditQuarter(parseInt(e.target.value))}
                  className="text-orange-500 border-orange-500 bg-orange-500/10 px-2 py-1 text-xs font-bold rounded border focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="1">Q1</option>
                  <option value="2">Q2</option>
                  <option value="3">Q3</option>
                  <option value="4">Q4</option>
                  <option value="5">OT1</option>
                  <option value="6">OT2</option>
                  <option value="7">OT3</option>
                  <option value="8">OT4</option>
                </select>
                <div className="flex gap-1">
                  <Button
                    onClick={handleSetQuarter}
                    size="sm"
                    className="h-6 px-2 bg-green-500 hover:bg-green-600 text-white text-[10px]"
                  >
                    <Check className="w-2.5 h-2.5" />
                  </Button>
                  <Button
                    onClick={handleQuarterEditToggle}
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-[10px]"
                  >
                    <X className="w-2.5 h-2.5" />
                  </Button>
                </div>
              </div>
            ) : (
              // ✅ Quarter Display (Clickable to edit)
              <Badge 
                variant="outline"
                className={`text-orange-500 border-orange-500 bg-orange-500/10 px-2 py-1 text-xs font-bold ${
                  onSetQuarter ? 'cursor-pointer hover:bg-orange-500/20 transition-colors' : ''
                }`}
                onClick={onSetQuarter ? handleQuarterEditToggle : undefined}
                title={onSetQuarter ? 'Click to edit quarter' : undefined}
              >
                {getQuarterDisplay(quarter)}
              </Badge>
            )}
            {isClockEditMode ? (
              // ✅ Clock Edit Mode - Number inputs
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={editMinutes}
                    onChange={(e) => setEditMinutes(Math.max(0, Math.min(20, parseInt(e.target.value) || 0)))}
                    className="w-10 h-6 text-center text-orange-500 border-orange-500 bg-orange-500/10 rounded border text-sm font-bold focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                  <span className="text-orange-500 font-bold">:</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={editSeconds}
                    onChange={(e) => setEditSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    className="w-10 h-6 text-center text-orange-500 border-orange-500 bg-orange-500/10 rounded border text-sm font-bold focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div className="flex gap-1">
                  <Button
                    onClick={handleSetCustomTime}
                    size="sm"
                    className="h-6 px-2 bg-green-500 hover:bg-green-600 text-white text-[10px]"
                  >
                    <Check className="w-2.5 h-2.5" />
                  </Button>
                  <Button
                    onClick={handleClockEditToggle}
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-[10px]"
                  >
                    <X className="w-2.5 h-2.5" />
                  </Button>
                </div>
              </div>
            ) : (
              // ✅ Clock Display (Clickable to edit when onSetCustomTime is provided)
              <div 
                className={`text-2xl font-black font-mono leading-none ${
                  isRunning ? 'text-green-500' : 'text-orange-500'
                } ${onSetCustomTime ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                onClick={onSetCustomTime && !isRunning ? handleClockEditToggle : undefined}
                title={onSetCustomTime && !isRunning ? 'Click to edit time' : undefined}
              >
                {formatTime(minutes, seconds)}
              </div>
            )}
          </div>

          {/* Start/Reset/Edit Buttons */}
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
            
            {/* Reset + Edit buttons side by side */}
            <div className="flex gap-1">
              <Button
                onClick={onResetClock}
                variant="outline"
                size="sm"
                className="h-8 px-2 flex-1 flex items-center justify-center gap-1 text-[10px] font-bold hover:border-orange-500 hover:text-orange-500"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
              {onSetCustomTime && (
                <Button
                  onClick={handleClockEditToggle}
                  variant="outline"
                  size="sm"
                  disabled={isRunning}
                  className="h-8 px-2 flex-1 flex items-center justify-center gap-1 text-[10px] font-bold hover:border-orange-500 hover:text-orange-500 disabled:opacity-50"
                >
                  <Pencil className="w-3 h-3" />
                </Button>
              )}
            </div>
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
              onPossessionChange={onPossessionChange}
            />
          ) : null}
        </div>

        {/* Right Container - Shot Clock Section + Buttons (beside T2) */}
        {shotClockIsVisible ? (
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

            {/* ✅ Toggle Shot Clock Visibility Button */}
            {onToggleShotClockVisibility && (
              <Button
                onClick={onToggleShotClockVisibility}
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[8px] font-semibold text-gray-400 hover:text-gray-600 hover:bg-gray-100 border border-gray-300 rounded transition-all mt-1"
                title={shotClockIsVisible ? "Hide Shot Clock" : "Show Shot Clock"}
              >
                {shotClockIsVisible ? (
                  <>
                    <EyeOff className="w-2.5 h-2.5 mr-1" />
                    Hide
                  </>
                ) : (
                  <>
                    <Eye className="w-2.5 h-2.5 mr-1" />
                    Show
                  </>
                )}
              </Button>
            )}
          </div>
        ) : (
          /* ✅ Show Toggle Button When Shot Clock is Hidden */
          onToggleShotClockVisibility && (
            <div className="col-span-1 flex items-center justify-center">
              <Button
                onClick={onToggleShotClockVisibility}
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-[9px] font-semibold text-gray-400 hover:text-gray-600 hover:bg-gray-100 border border-gray-300 rounded transition-all"
                title="Show Shot Clock"
              >
                <Eye className="w-3 h-3 mr-1" />
                Show
              </Button>
            </div>
          )
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