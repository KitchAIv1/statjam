'use client';

import React, { useState } from 'react';
import { AlertTriangle, MoreHorizontal, RotateCcw, Undo, Edit } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Player {
  id: string;
  name: string;
  jersey_number?: number;
  photo_url?: string;
}

interface MobileStatGridV3Props {
  selectedPlayer: string | null;
  selectedPlayerData?: Player | null;
  isClockRunning: boolean;
  onStatRecord: (statType: string, modifier?: string) => Promise<void>;
  onFoulModal: () => void;
  onSubstitution?: () => void;
  lastAction?: string | null;
}

export function MobileStatGridV3({
  selectedPlayer,
  selectedPlayerData,
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

  // Primary stats with made/missed options - FIXED: Swapped rebound positions
  const madeStats = [
    { id: '2pt-made', label: '2PT', statType: 'field_goal', modifier: 'made' },
    { id: '3pt-made', label: '3PT', statType: 'three_pointer', modifier: 'made' },
    { id: 'ft-made', label: 'FT', statType: 'free_throw', modifier: 'made' },
    { id: 'reb-offensive', label: 'REB', statType: 'rebound', modifier: 'offensive' } // FIXED: Offensive rebound in first layer
  ];

  const missedStats = [
    { id: '2pt-missed', label: '2PT', statType: 'field_goal', modifier: 'missed' },
    { id: '3pt-missed', label: '3PT', statType: 'three_pointer', modifier: 'missed' },
    { id: 'ft-missed', label: 'FT', statType: 'free_throw', modifier: 'missed' },
    { id: 'reb-defensive', label: 'REB', statType: 'rebound', modifier: 'defensive' } // FIXED: Defensive rebound in second layer
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
      className="w-full rounded-xl p-4"
      style={{ 
        background: 'var(--dashboard-card)', 
        borderColor: 'var(--dashboard-border)',
        borderWidth: '1px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
    >


      {/* Made Stats Row - Clean Design */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {madeStats.map((stat) => (
          <Button
            key={stat.id}
            onClick={() => handleStatClick(stat.statType, stat.modifier)}
            disabled={isDisabled || isRecording === stat.statType}
            className={`h-18 flex flex-col justify-center items-center text-sm font-bold transition-all duration-200 rounded-xl border-2 shadow-sm ${
              isRecording === stat.statType && (stat.modifier === 'made' || stat.modifier === 'offensive')
                ? 'bg-green-600 border-green-400 text-white animate-pulse shadow-lg scale-105' 
                : isDisabled
                  ? 'opacity-40 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400'
                  : 'bg-green-500 border-green-400 hover:bg-green-600 hover:border-green-300 text-white hover:shadow-md hover:scale-105 active:scale-95'
            }`}
            style={{
              minHeight: '72px',
              fontSize: '13px'
            }}
          >
            <div className="font-black text-base">{stat.label}</div>
            <div className="text-xs opacity-90 font-semibold">
              {stat.statType === 'rebound' ? '⚡ Offensive' : '✓ MADE'}
            </div>
          </Button>
        ))}
      </div>

      {/* Missed Stats Row - Clean Design */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {missedStats.map((stat) => (
          <Button
            key={stat.id}
            onClick={() => handleStatClick(stat.statType, stat.modifier)}
            disabled={isDisabled || isRecording === stat.statType}
            className={`h-18 flex flex-col justify-center items-center text-sm font-medium transition-all duration-200 rounded-xl border-2 shadow-sm ${
              isRecording === stat.statType && (stat.modifier === 'missed' || stat.modifier === 'defensive')
                ? 'bg-red-600 border-red-400 text-white animate-pulse shadow-lg scale-105' 
                : isDisabled
                  ? 'opacity-40 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400'
                  : 'bg-red-400 border-red-300 hover:bg-red-500 hover:border-red-300 text-white hover:shadow-md hover:scale-105 active:scale-95'
            }`}
            style={{
              minHeight: '72px',
              fontSize: '13px'
            }}
          >
            <div className="font-black text-base">{stat.label}</div>
            <div className="text-xs opacity-90 font-semibold">
              {stat.statType === 'rebound' ? '🛡️ Defensive' : '✗ MISS'}
            </div>
          </Button>
        ))}
      </div>

      {/* Single Action Stats - Clean Design */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {singleStats.map((stat) => (
          <Button
            key={stat.id}
            onClick={() => handleStatClick(stat.statType)}
            disabled={isDisabled || isRecording === stat.statType}
            className={`h-18 text-sm font-bold transition-all duration-200 rounded-xl border-2 shadow-sm ${
              isRecording === stat.statType
                ? 'bg-blue-600 border-blue-400 text-white animate-pulse shadow-lg scale-105' 
                : isDisabled
                  ? 'opacity-40 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400'
                  : 'bg-blue-500 border-blue-400 hover:bg-blue-600 hover:border-blue-300 text-white hover:shadow-md hover:scale-105 active:scale-95'
            }`}
            style={{
              minHeight: '72px',
              fontSize: '14px'
            }}
          >
            <div className="font-black text-base">{stat.label}</div>
          </Button>
        ))}
      </div>

      {/* Special Actions - Clean Design with Custom Colors */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {secondaryActions.map((action) => {
          const Icon = action.icon;
          const isFoul = action.id === 'foul';
          const isSub = action.id === 'sub';
          
          return (
            <Button
              key={action.id}
              onClick={action.onClick}
              disabled={isDisabled || action.disabled}
              variant={action.variant}
              className={`h-14 flex items-center justify-center gap-3 text-sm font-semibold transition-all duration-200 rounded-xl border-2 shadow-sm ${
                isDisabled || action.disabled
                  ? 'opacity-40 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400'
                  : isFoul
                    ? 'bg-red-500 border-red-400 text-white hover:bg-red-600 hover:border-red-500 hover:shadow-md hover:scale-105 active:scale-95'
                    : isSub
                      ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-900 hover:border-gray-800 hover:shadow-md hover:scale-105 active:scale-95'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-500 hover:text-white hover:border-gray-400 hover:shadow-md hover:scale-105 active:scale-95'
              }`}
              style={{
                minHeight: '56px' // Touch target size
              }}
            >
              <Icon className="w-5 h-5" />
              <span className="font-bold">{action.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Last Action - Minimal Horizontal Layout */}
      {lastAction && selectedPlayer && selectedPlayerData && (
        <div 
          className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50 mt-4"
          style={{ 
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}
        >
          {/* Left: Player Details */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
              {selectedPlayerData.jersey_number || '?'}
            </div>
            <span className="text-sm font-medium text-gray-700">
              {selectedPlayerData.name}
            </span>
          </div>
          
          {/* Center: Action Text */}
          <div className="text-sm font-semibold text-gray-800 bg-white px-2 py-1 rounded border">
            {lastAction}
          </div>
          
          {/* Right: Action Icons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                // TODO: Implement undo functionality
                console.log('🔄 Undo last action:', lastAction);
                alert('Undo functionality will be implemented');
              }}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-orange-100 text-orange-600 hover:bg-orange-200 hover:scale-110 active:scale-95 transition-all duration-200"
            >
              <Undo className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => {
                // TODO: Implement edit functionality
                console.log('✏️ Edit last action:', lastAction);
                alert('Edit functionality will be implemented');
              }}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 hover:scale-110 active:scale-95 transition-all duration-200"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}