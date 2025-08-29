'use client';

import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Edit3, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';

interface TopScoreboardV3Props {
  teamAName: string;
  teamBName: string;
  teamAScore: number;
  teamBScore: number;
  quarter: number;
  minutes: number;
  seconds: number;
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onSetCustomTime?: (minutes: number, seconds: number) => void; // NEW: Manual time setting
  // NBA Standard: Team fouls and timeouts
  teamAFouls?: number;
  teamBFouls?: number;
  teamATimeouts?: number;
  teamBTimeouts?: number;
}

export function TopScoreboardV3({
  teamAName,
  teamBName,
  teamAScore,
  teamBScore,
  quarter,
  minutes,
  seconds,
  isRunning,
  onStart,
  onStop,
  onReset,
  onSetCustomTime,
  teamAFouls = 0,
  teamBFouls = 0,
  teamATimeouts = 7,
  teamBTimeouts = 7
}: TopScoreboardV3Props) {
  // NEW: Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editMinutes, setEditMinutes] = useState(minutes);
  const [editSeconds, setEditSeconds] = useState(seconds);
  
  const formatTime = (mins: number, secs: number) => {
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuarterDisplay = (q: number) => {
    if (q <= 4) return `Q${q}`;
    return `OT${q - 4}`;
  };

  // NEW: Handle edit mode toggle
  const handleEditToggle = () => {
    if (isEditMode) {
      // Cancel edit - reset to current values
      setEditMinutes(minutes);
      setEditSeconds(seconds);
    } else {
      // Enter edit mode - initialize with current values
      setEditMinutes(minutes);
      setEditSeconds(seconds);
    }
    setIsEditMode(!isEditMode);
  };

  // NEW: Handle custom time set
  const handleSetCustomTime = () => {
    if (onSetCustomTime) {
      onSetCustomTime(editMinutes, editSeconds);
    }
    setIsEditMode(false);
  };

  // NBA Standard: Determine bonus situation (5+ team fouls = bonus)
  const teamAInBonus = teamAFouls >= 5;
  const teamBInBonus = teamBFouls >= 5;

  return (
    <div 
      className="w-full rounded-xl p-4 mb-3"
      style={{ 
        background: '#ffffff', 
        borderColor: '#e5e7eb',
        borderWidth: '1px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}
    >
      {/* NBA Standard Layout: Team Names & Scores */}
      <div className="grid grid-cols-3 gap-4 items-center mb-4">
        
        {/* Team A Section */}
        <div className="text-center">
          <div 
            className="text-xl lg:text-2xl font-bold mb-2"
            style={{ color: 'var(--dashboard-text-primary)' }}
          >
            {teamAName}
          </div>
          <div className="text-4xl lg:text-5xl font-black text-orange-500 leading-none mb-3">
            {teamAScore}
          </div>
          
          {/* Team A Fouls & Timeouts - NBA Standard Position */}
          <div className="space-y-2">
            {/* Team Fouls */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-semibold text-gray-600">FOULS</span>
              <div className={`px-2 py-1 rounded text-sm font-bold ${
                teamAInBonus ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}>
                {teamAFouls}
                {teamAInBonus && <span className="ml-1 text-xs">BONUS</span>}
              </div>
            </div>
            
            {/* Timeouts Remaining */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-semibold text-gray-600">TO</span>
              <div className="flex gap-1">
                {Array.from({ length: 7 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      i < teamATimeouts ? 'bg-orange-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Center - Clock and Quarter */}
        <div className="flex flex-col items-center justify-center space-y-3">
          {/* Quarter Display */}
          <div 
            className="px-4 py-2 rounded-xl text-lg font-black border-2 shadow-lg"
            style={{ 
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              color: 'white',
              borderColor: '#fb923c',
              boxShadow: '0 8px 16px -4px rgba(249, 115, 22, 0.4)'
            }}
          >
            {getQuarterDisplay(quarter)}
          </div>

          {/* Clock Display */}
          <div className="text-center">
            {isEditMode ? (
              // NEW: Edit Mode - Compact input fields
              <div className="flex items-center justify-center gap-1 mb-2">
                <Input
                  type="number"
                  min="0"
                  max="15"
                  value={editMinutes}
                  onChange={(e) => setEditMinutes(Math.max(0, Math.min(15, parseInt(e.target.value) || 0)))}
                  className="w-12 h-8 text-center text-sm font-bold p-1"
                  style={{ 
                    background: 'var(--dashboard-card)',
                    borderColor: 'var(--dashboard-border)',
                    color: 'var(--dashboard-text-primary)'
                  }}
                />
                <span className="text-lg font-bold text-gray-600">:</span>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={editSeconds}
                  onChange={(e) => setEditSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className="w-12 h-8 text-center text-sm font-bold p-1"
                  style={{ 
                    background: 'var(--dashboard-card)',
                    borderColor: 'var(--dashboard-border)',
                    color: 'var(--dashboard-text-primary)'
                  }}
                />
              </div>
            ) : (
              // Normal Mode - Clock display
              <>
                <div 
                  className={`text-3xl lg:text-4xl font-mono font-black leading-none mb-1 ${
                    isRunning ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {formatTime(minutes, seconds)}
                </div>
                <div className="text-xs text-gray-500 font-medium">
                  {isRunning ? 'RUNNING' : 'STOPPED'}
                </div>
              </>
            )}
          </div>

          {/* Clock Controls - Compact */}
          <div className="flex items-center gap-2">
            {isEditMode ? (
              // NEW: Edit Mode Controls
              <>
                <Button
                  onClick={handleSetCustomTime}
                  className="h-8 px-3 text-xs font-bold bg-green-500 hover:bg-green-600 text-white border-2 border-green-400 hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-200"
                  disabled={!onSetCustomTime}
                >
                  <Check className="w-3 h-3 mr-1" />
                  SET
                </Button>

                <Button
                  onClick={handleEditToggle}
                  variant="outline"
                  className="h-8 px-3 text-xs font-bold border-2 border-red-300 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-400 hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-200"
                >
                  <X className="w-3 h-3 mr-1" />
                  CANCEL
                </Button>
              </>
            ) : (
              // Normal Mode Controls
              <>
                <Button
                  onClick={isRunning ? onStop : onStart}
                  className={`h-8 px-3 text-xs font-bold transition-all duration-200 rounded-lg ${
                    isRunning
                      ? 'bg-red-500 hover:bg-red-600 text-white border-red-400'
                      : 'bg-green-500 hover:bg-green-600 text-white border-green-400'
                  } border-2 hover:shadow-md hover:scale-105 active:scale-95`}
                >
                  {isRunning ? (
                    <>
                      <Pause className="w-3 h-3 mr-1" />
                      STOP
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 mr-1" />
                      START
                    </>
                  )}
                </Button>

                <Button
                  onClick={onReset}
                  variant="outline"
                  className="h-8 px-3 text-xs font-bold border-2 border-gray-300 text-gray-600 hover:bg-gray-500 hover:text-white hover:border-gray-400 hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-200"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  RESET
                </Button>

                <Button
                  onClick={handleEditToggle}
                  variant="outline"
                  className="h-8 px-3 text-xs font-bold border-2 border-blue-300 text-blue-600 hover:bg-blue-500 hover:text-white hover:border-blue-400 hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-200"
                  disabled={!onSetCustomTime}
                >
                  <Edit3 className="w-3 h-3 mr-1" />
                  EDIT
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Team B Section */}
        <div className="text-center">
          <div 
            className="text-xl lg:text-2xl font-bold mb-2"
            style={{ color: 'var(--dashboard-text-primary)' }}
          >
            {teamBName}
          </div>
          <div className="text-4xl lg:text-5xl font-black text-blue-500 leading-none mb-3">
            {teamBScore}
          </div>
          
          {/* Team B Fouls & Timeouts - NBA Standard Position */}
          <div className="space-y-2">
            {/* Team Fouls */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-semibold text-gray-600">FOULS</span>
              <div className={`px-2 py-1 rounded text-sm font-bold ${
                teamBInBonus ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}>
                {teamBFouls}
                {teamBInBonus && <span className="ml-1 text-xs">BONUS</span>}
              </div>
            </div>
            
            {/* Timeouts Remaining */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-semibold text-gray-600">TO</span>
              <div className="flex gap-1">
                {Array.from({ length: 7 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      i < teamBTimeouts ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
