'use client';

/**
 * CompactStatButtons - Reduced stat buttons for Shot Tracker mode
 * 
 * Shows only non-shot stats when court diagram handles 2PT/3PT.
 * Compact layout with smaller buttons to fit alongside court.
 * Uses shared configs from statButtonConfigs.ts for consistency.
 * 
 * @module CompactStatButtons
 */

import React, { useRef } from 'react';
import { AlertTriangle, Clock, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FT_REB_STATS, OTHER_STATS } from '../config/statButtonConfigs';

interface CompactStatButtonsProps {
  selectedPlayer: string | null;
  isClockRunning: boolean;
  onStatRecord: (statType: string, modifier?: string) => Promise<void>;
  onFoulRecord: (foulType: 'personal' | 'technical') => Promise<void>;
  onTimeOut: () => void;
  onSubstitution?: () => void;
  isRecording: string | null;
  setIsRecording: (value: string | null) => void;
}

const DEBOUNCE_DELAY = 500;

export function CompactStatButtons({
  selectedPlayer,
  isClockRunning,
  onStatRecord,
  onFoulRecord,
  onTimeOut,
  onSubstitution,
  isRecording,
  setIsRecording
}: CompactStatButtonsProps) {
  const lastClickTimeRef = useRef<Record<string, number>>({});

  const handleStatClick = async (statType: string, modifier?: string) => {
    if (!selectedPlayer) return;
    
    const isFTMade = statType === 'free_throw' && modifier === 'made';
    if (!isClockRunning && !isFTMade) return;

    const statId = `${statType}-${modifier || 'default'}`;
    const now = Date.now();
    if (now - (lastClickTimeRef.current[statId] || 0) < DEBOUNCE_DELAY) return;
    
    lastClickTimeRef.current[statId] = now;
    setIsRecording(statId);
    
    try {
      await onStatRecord(statType, modifier);
    } finally {
      setTimeout(() => setIsRecording(null), DEBOUNCE_DELAY);
    }
  };

  const handleFoulClick = async (foulType: 'personal' | 'technical') => {
    if (!selectedPlayer || !isClockRunning) return;

    const foulId = `foul-${foulType}`;
    const now = Date.now();
    if (now - (lastClickTimeRef.current[foulId] || 0) < DEBOUNCE_DELAY) return;
    
    lastClickTimeRef.current[foulId] = now;
    setIsRecording(foulId);
    
    try {
      await onFoulRecord(foulType);
    } finally {
      setTimeout(() => setIsRecording(null), DEBOUNCE_DELAY);
    }
  };

  const isDisabled = !selectedPlayer || !isClockRunning;

  // ✅ Use shared configs for consistency with Button mode
  // FT_REB_STATS: Free throws + Rebounds (Row 1)
  // OTHER_STATS: AST, STL, BLK, TOV with correct modifiers (Row 2)

  const getButtonClasses = (color: string, isActive: boolean, disabled: boolean) => {
    if (disabled) return 'opacity-40 bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed';
    if (isActive) return 'bg-gray-600 border-gray-500 text-white animate-pulse';
    
    const colors: Record<string, string> = {
      green: 'bg-green-500 border-green-400 hover:bg-green-600 text-white',
      red: 'bg-red-400 border-red-300 hover:bg-red-500 text-white',
      blue: 'bg-blue-500 border-blue-400 hover:bg-blue-600 text-white',
      purple: 'bg-purple-500 border-purple-400 hover:bg-purple-600 text-white',
      indigo: 'bg-indigo-500 border-indigo-400 hover:bg-indigo-600 text-white',
      yellow: 'bg-yellow-500 border-yellow-400 hover:bg-yellow-600 text-white',
      orange: 'bg-orange-500 border-orange-400 hover:bg-orange-600 text-white',
      gray: 'bg-gray-700 border-gray-600 hover:bg-gray-800 text-white'
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="space-y-2">
      {/* Row 1: FT + Rebounds */}
      <div className="grid grid-cols-4 gap-2">
        {FT_REB_STATS.map((stat) => {
          const statId = `${stat.statType}-${stat.modifier}`;
          const isActive = isRecording === statId;
          const isFTMade = stat.id === 'ft-made';
          const shouldDisable = isFTMade ? !selectedPlayer : isDisabled;
          
          return (
            <Button
              key={stat.id}
              onClick={() => handleStatClick(stat.statType, stat.modifier)}
              disabled={shouldDisable || isActive}
              className={`h-12 flex flex-col justify-center items-center rounded-lg border-2 transition-all ${
                getButtonClasses(stat.color, isActive, shouldDisable)
              }`}
            >
              <span className="text-sm font-bold">{stat.label}</span>
              <span className="text-xs opacity-80">{stat.sub}</span>
            </Button>
          );
        })}
      </div>

      {/* Row 2: Other stats (AST, STL, BLK, TOV) */}
      <div className="grid grid-cols-4 gap-2">
        {OTHER_STATS.map((stat) => {
          const isActive = isRecording === stat.statType;
          
          return (
            <Button
              key={stat.id}
              onClick={() => handleStatClick(stat.statType, stat.modifier)}
              disabled={isDisabled || isActive}
              className={`h-12 flex items-center justify-center rounded-lg border-2 transition-all ${
                getButtonClasses(stat.color, isActive, isDisabled)
              }`}
            >
              <span className="text-sm font-bold">{stat.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Row 3: Fouls + Game management */}
      <div className="grid grid-cols-4 gap-2">
        <Button
          onClick={() => handleFoulClick('personal')}
          disabled={isDisabled}
          className={`h-12 flex items-center justify-center gap-1 rounded-lg border-2 transition-all ${
            getButtonClasses('red', isRecording === 'foul-personal', isDisabled)
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-bold">FOUL</span>
        </Button>
        
        <Button
          onClick={() => handleFoulClick('technical')}
          disabled={isDisabled}
          className={`h-12 flex items-center justify-center gap-1 rounded-lg border-2 transition-all ${
            getButtonClasses('orange', isRecording === 'foul-technical', isDisabled)
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-bold">TF</span>
        </Button>
        
        <Button
          onClick={onTimeOut}
          className="h-12 flex items-center justify-center gap-1 rounded-lg border-2 bg-gray-600 border-gray-500 hover:bg-gray-700 text-white transition-all"
        >
          <Clock className="w-4 h-4" />
          <span className="text-sm font-bold">T.OUT</span>
        </Button>
        
        <Button
          onClick={onSubstitution}
          className="h-12 flex items-center justify-center gap-1 rounded-lg border-2 bg-gray-800 border-gray-700 hover:bg-gray-900 text-white transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="text-sm font-bold">SUB</span>
        </Button>
      </div>
    </div>
  );
}
