'use client';

import React, { useState } from 'react';
import { AlertTriangle, MoreHorizontal, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface MobileStatGridV3Props {
  selectedPlayer: string | null;
  isClockRunning: boolean;
  onStatRecord: (statType: string, modifier?: string) => Promise<void>;
  onFoulModal: () => void;
  onSubstitution?: () => void;
  lastAction?: string | null;
}

export function MobileStatGridV3({
  selectedPlayer,
  isClockRunning,
  onStatRecord,
  onFoulModal,
  onSubstitution,
  lastAction
}: MobileStatGridV3Props) {
  const [isRecording, setIsRecording] = useState<string | null>(null);

  const handleStatClick = async (statType: string, modifier?: string) => {
    if (!selectedPlayer) {
      alert('Please select a player first');
      return;
    }
    
    if (!isClockRunning) {
      alert('Clock must be running to record stats');
      return;
    }

    setIsRecording(statType);
    try {
      await onStatRecord(statType, modifier);
    } finally {
      setIsRecording(null);
    }
  };

  const isDisabled = !selectedPlayer || !isClockRunning;

  // Primary stats with made/missed options
  const madeStats = [
    { id: '2pt-made', label: '2PT', statType: 'field_goal', modifier: 'made' },
    { id: '3pt-made', label: '3PT', statType: 'three_pointer', modifier: 'made' },
    { id: 'ft-made', label: 'FT', statType: 'free_throw', modifier: 'made' },
    { id: 'reb-made', label: 'REB', statType: 'rebound', modifier: 'defensive' }
  ];

  const missedStats = [
    { id: '2pt-missed', label: '2PT', statType: 'field_goal', modifier: 'missed' },
    { id: '3pt-missed', label: '3PT', statType: 'three_pointer', modifier: 'missed' },
    { id: 'ft-missed', label: 'FT', statType: 'free_throw', modifier: 'missed' },
    { id: 'reb-missed', label: 'REB', statType: 'rebound', modifier: 'offensive' }
  ];

  // Other single-button stats
  const singleStats = [
    { id: 'ast', label: 'AST', statType: 'assist' },
    { id: 'stl', label: 'STL', statType: 'steal' },
    { id: 'blk', label: 'BLK', statType: 'block' },
    { id: 'tov', label: 'TOV', statType: 'turnover' }
  ];

  // Secondary actions (modals/special)
  const secondaryActions = [
    { 
      id: 'foul', 
      label: 'FOUL', 
      icon: AlertTriangle, 
      onClick: onFoulModal,
      variant: 'outline' as const
    },
    { 
      id: 'sub', 
      label: 'SUB', 
      icon: RotateCcw, 
      onClick: onSubstitution,
      variant: 'outline' as const,
      disabled: !onSubstitution
    }
  ];

  return (
    <div 
      className="w-full rounded-lg p-4 space-y-4"
      style={{ 
        background: 'var(--dashboard-card)', 
        borderColor: 'var(--dashboard-border)',
        borderWidth: '1px'
      }}
    >
      {/* Header */}
      <div className="text-center">
        <h3 
          className="text-sm font-medium mb-1"
          style={{ color: 'var(--dashboard-text-primary)' }}
        >
          Record Statistics
        </h3>
        {!selectedPlayer ? (
          <p 
            className="text-xs"
            style={{ color: 'var(--dashboard-text-secondary)' }}
          >
            Select a player to begin
          </p>
        ) : (
          <p 
            className="text-xs text-orange-500 font-medium"
          >
            Recording for selected player
          </p>
        )}
      </div>

      {/* Made Stats Row - 4 columns for 2PT, 3PT, FT, REB */}
      <div className="grid grid-cols-4 gap-2 mb-2">
        {madeStats.map((stat) => (
          <Button
            key={stat.id}
            onClick={() => handleStatClick(stat.statType, stat.modifier)}
            disabled={isDisabled || isRecording === stat.statType}
            className={`h-16 flex flex-col justify-center items-center text-xs font-bold transition-all ${
              isRecording === stat.statType && stat.modifier === 'made'
                ? 'bg-orange-600 text-white animate-pulse' 
                : isDisabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
            }`}
            style={{
              minHeight: '64px',
              fontSize: '12px'
            }}
          >
            <div>{stat.label}</div>
            <div className="text-[9px] opacity-75">MADE</div>
          </Button>
        ))}
      </div>

      {/* Missed Stats Row - 4 columns for 2PT, 3PT, FT, REB */}
      <div className="grid grid-cols-4 gap-2 mb-2">
        {missedStats.map((stat) => (
          <Button
            key={stat.id}
            onClick={() => handleStatClick(stat.statType, stat.modifier)}
            disabled={isDisabled || isRecording === stat.statType}
            className={`h-16 flex flex-col justify-center items-center text-xs font-medium transition-all ${
              isRecording === stat.statType && stat.modifier === 'missed'
                ? 'bg-orange-600 text-white animate-pulse' 
                : isDisabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'bg-orange-300 hover:bg-orange-400 text-white'
            }`}
            style={{
              minHeight: '64px',
              fontSize: '12px'
            }}
          >
            <div>{stat.label}</div>
            <div className="text-[9px] opacity-75">MISS</div>
          </Button>
        ))}
      </div>

      {/* Single Action Stats - 4 columns for AST, STL, BLK, TOV */}
      <div className="grid grid-cols-4 gap-2 mb-2">
        {singleStats.map((stat) => (
          <Button
            key={stat.id}
            onClick={() => handleStatClick(stat.statType, stat.modifier)}
            disabled={isDisabled || isRecording === stat.statType}
            className={`h-16 text-xs font-bold transition-all ${
              isRecording === stat.statType
                ? 'bg-orange-600 text-white animate-pulse' 
                : isDisabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
            }`}
            style={{
              minHeight: '64px',
              fontSize: '12px'
            }}
          >
            {stat.label}
          </Button>
        ))}
      </div>

      {/* Secondary Actions */}
      <div className="grid grid-cols-2 gap-2 mb-1">
        {secondaryActions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              onClick={action.onClick}
              disabled={isDisabled || action.disabled}
              variant={action.variant}
              className={`h-12 flex items-center justify-center gap-2 text-xs font-medium transition-all ${
                isDisabled || action.disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:border-orange-500 hover:text-orange-500'
              }`}
              style={{
                minHeight: '48px' // Touch target size
              }}
            >
              <Icon className="w-4 h-4" />
              {action.label}
            </Button>
          );
        })}
      </div>

      {/* Last Action Feedback */}
      {lastAction && (
        <div 
          className="text-center p-2 rounded-md"
          style={{ 
            background: 'var(--dashboard-primary)' + '10',
            borderColor: 'var(--dashboard-primary)',
            borderWidth: '1px'
          }}
        >
          <p 
            className="text-xs"
            style={{ color: 'var(--dashboard-text-primary)' }}
          >
            <span className="font-medium">Last: </span>
            {lastAction}
          </p>
        </div>
      )}
    </div>
  );
}