'use client';

import React, { useState } from 'react';
import { AlertTriangle, MoreHorizontal, RotateCcw, Clock, Undo, Edit } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatEditModal } from '../modals/StatEditModal';

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
  photo_url?: string;
}

interface MobileStatGridV3Props {
  selectedPlayer: string | null;
  selectedPlayerData?: Player | null;
  isClockRunning: boolean;
  onStatRecord: (statType: string, modifier?: string) => Promise<void>;
  onFoulRecord: (foulType: 'personal' | 'technical') => Promise<void>;
  onTimeOut: () => void;
  onSubstitution?: () => void;
  lastAction?: string | null;
  lastActionPlayerId?: string | null;
  // ✅ Stat Edit Modal
  gameId?: string;
  teamAPlayers?: Player[];
  teamBPlayers?: Player[];
  teamAId?: string;
  teamBId?: string;
  teamAName?: string;
  teamBName?: string;
}

export function MobileStatGridV3({
  selectedPlayer,
  selectedPlayerData,
  isClockRunning,
  onStatRecord,
  onFoulRecord,
  onTimeOut,
  onSubstitution,
  lastAction,
  lastActionPlayerId,
  // ✅ Stat Edit Modal
  gameId,
  teamAPlayers = [],
  teamBPlayers = [],
  teamAId,
  teamBId,
  teamAName = 'Team A',
  teamBName = 'Team B'
}: MobileStatGridV3Props) {
  // ✅ UI OPTIMIZATION: Track full stat identity (type + modifier) to prevent visual coupling
  const [isRecording, setIsRecording] = useState<string | null>(null);
  const [showStatEditModal, setShowStatEditModal] = useState(false);

  const handleStatClick = async (statType: string, modifier?: string) => {
    if (!selectedPlayer) {
      alert('Please select a player first');
      return;
    }
    
    if (!isClockRunning) {
      alert('Clock must be running to record stats');
      return;
    }

    // ✅ Create unique identifier for this specific button
    const statId = `${statType}-${modifier || 'default'}`;
    setIsRecording(statId);
    
    try {
      await onStatRecord(statType, modifier);
    } finally {
      // ✅ Small delay to ensure smooth visual feedback
      setTimeout(() => setIsRecording(null), 50);
    }
  };

  const handleFoulClick = async (foulType: 'personal' | 'technical') => {
    if (!selectedPlayer) {
      alert('Please select a player first');
      return;
    }
    
    if (!isClockRunning) {
      alert('Clock must be running to record fouls');
      return;
    }

    setIsRecording(`foul-${foulType}`);
    try {
      await onFoulRecord(foulType);
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

  // Other single-button stats (✅ PHASE 5 FIX: No modifiers - database constraint requires NULL)
  const singleStats = [
    { id: 'ast', label: 'AST', statType: 'assist', modifier: undefined },
    { id: 'stl', label: 'STL', statType: 'steal', modifier: undefined },
    { id: 'blk', label: 'BLK', statType: 'block', modifier: undefined },
    { id: 'tov', label: 'TOV', statType: 'turnover', modifier: 'traveling' } // ✅ FIX: Default to traveling (dead ball - clock pauses)
  ];

  // Secondary actions - FOUL, TF, TIME OUT, SUB
  const secondaryActions = [
    { 
      id: 'foul', 
      label: 'FOUL', 
      icon: AlertTriangle, 
      onClick: () => handleFoulClick('personal'),
      variant: 'outline' as const,
      color: 'red'
    },
    { 
      id: 'technical', 
      label: 'TF', 
      icon: AlertTriangle, 
      onClick: () => handleFoulClick('technical'),
      variant: 'outline' as const,
      color: 'orange'
    },
    { 
      id: 'timeout', 
      label: 'TIME OUT', 
      icon: Clock, 
      onClick: onTimeOut,
      variant: 'outline' as const,
      color: 'lightblack'
    },
    { 
      id: 'sub', 
      label: 'SUB', 
      icon: RotateCcw, 
      onClick: onSubstitution,
      variant: 'outline' as const,
      color: 'gray'
    }
  ];

  return (
    <div 
      className="w-full rounded-xl p-4"
      style={{ 
        background: '#ffffff', 
        borderColor: '#e5e7eb',
        borderWidth: '1px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
    >


      {/* Made Stats Row - Clean Design */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {madeStats.map((stat) => {
          const statId = `${stat.statType}-${stat.modifier}`;
          const isThisButtonRecording = isRecording === statId;
          
          return (
            <Button
              key={stat.id}
              onClick={() => handleStatClick(stat.statType, stat.modifier)}
              disabled={isDisabled || isThisButtonRecording}
              className={`h-18 flex flex-col justify-center items-center text-sm font-bold transition-colors duration-150 rounded-xl border-2 shadow-sm ${
                isThisButtonRecording
                  ? 'bg-green-600 border-green-400 text-white shadow-lg' 
                  : isDisabled
                    ? 'opacity-40 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400'
                    : 'bg-green-500 border-green-400 hover:bg-green-600 hover:border-green-300 text-white hover:shadow-md active:scale-95'
              }`}
              style={{
                minHeight: '72px',
                fontSize: '13px',
                willChange: 'background-color, border-color'
              }}
            >
              <div className="font-black text-base">{stat.label}</div>
              <div className="text-xs opacity-90 font-semibold">
                {stat.statType === 'rebound' ? '⚡ Offensive' : '✓ MADE'}
              </div>
            </Button>
          );
        })}
      </div>

      {/* Missed Stats Row - Clean Design */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {missedStats.map((stat) => {
          const statId = `${stat.statType}-${stat.modifier}`;
          const isThisButtonRecording = isRecording === statId;
          
          return (
            <Button
              key={stat.id}
              onClick={() => handleStatClick(stat.statType, stat.modifier)}
              disabled={isDisabled || isThisButtonRecording}
              className={`h-18 flex flex-col justify-center items-center text-sm font-medium transition-colors duration-150 rounded-xl border-2 shadow-sm ${
                isThisButtonRecording
                  ? 'bg-red-600 border-red-400 text-white shadow-lg' 
                  : isDisabled
                    ? 'opacity-40 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400'
                    : 'bg-red-400 border-red-300 hover:bg-red-500 hover:border-red-300 text-white hover:shadow-md active:scale-95'
              }`}
              style={{
                minHeight: '72px',
                fontSize: '13px',
                willChange: 'background-color, border-color'
              }}
            >
              <div className="font-black text-base">{stat.label}</div>
              <div className="text-xs opacity-90 font-semibold">
                {stat.statType === 'rebound' ? '🛡️ Defensive' : '✗ MISS'}
              </div>
            </Button>
          );
        })}
      </div>

      {/* Single Action Stats - Clean Design */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {singleStats.map((stat) => (
          <Button
            key={stat.id}
            onClick={() => handleStatClick(stat.statType)}
            disabled={isDisabled || isRecording === stat.statType}
            className={`h-18 text-sm font-bold transition-colors duration-150 rounded-xl border-2 shadow-sm ${
              isRecording === stat.statType
                ? 'bg-blue-600 border-blue-400 text-white shadow-lg' 
                : isDisabled
                  ? 'opacity-40 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400'
                  : 'bg-blue-500 border-blue-400 hover:bg-blue-600 hover:border-blue-300 text-white hover:shadow-md active:bg-blue-700'
            }`}
            style={{
              minHeight: '72px',
              fontSize: '14px',
              willChange: 'background-color, border-color'
            }}
          >
            <div className="font-black text-base">{stat.label}</div>
          </Button>
        ))}
      </div>

      {/* Special Actions - FOUL, TF, TIME OUT, SUB */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {secondaryActions.map((action) => {
          const Icon = action.icon;
          const isRecordingThis = isRecording === `foul-${action.id === 'foul' ? 'personal' : 'technical'}`;
          
          // ✅ SUB and TIMEOUT buttons are always available (no requirements)
          const isSubButton = action.id === 'sub';
          const isTimeoutButton = action.id === 'timeout';
          const shouldDisable = (isSubButton || isTimeoutButton)
            ? action.disabled // SUB/TIMEOUT always available (no requirements)
            : (isDisabled || action.disabled); // Other buttons need clock running
          
          // Color schemes for each button
          const getColorClasses = () => {
            if (shouldDisable) {
              return 'opacity-40 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400';
            }
            
            if (isRecordingThis) {
              return 'animate-pulse shadow-lg scale-105';
            }
            
            switch (action.color) {
              case 'red':
                return 'bg-red-500 border-red-400 text-white hover:bg-red-600 hover:border-red-500 hover:shadow-md hover:scale-105 active:scale-95';
              case 'orange':
                return 'bg-orange-500 border-orange-400 text-white hover:bg-orange-600 hover:border-orange-500 hover:shadow-md hover:scale-105 active:scale-95';
              case 'blue':
                return 'bg-blue-500 border-blue-400 text-white hover:bg-blue-600 hover:border-blue-500 hover:shadow-md hover:scale-105 active:scale-95';
              case 'lightblack':
                return 'bg-gray-600 border-gray-500 text-white hover:bg-gray-700 hover:border-gray-600 hover:shadow-md hover:scale-105 active:scale-95';
              case 'gray':
                return 'bg-gray-800 border-gray-700 text-white hover:bg-gray-900 hover:border-gray-800 hover:shadow-md hover:scale-105 active:scale-95';
              default:
                return 'border-gray-300 text-gray-600 hover:bg-gray-500 hover:text-white hover:border-gray-400 hover:shadow-md hover:scale-105 active:scale-95';
            }
          };
          
          return (
            <Button
              key={action.id}
              onClick={action.onClick}
              disabled={shouldDisable}
              variant={action.variant}
              className={`h-14 flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-200 rounded-xl border-2 shadow-sm ${getColorClasses()}`}
              style={{
                minHeight: '56px' // Touch target size
              }}
            >
              <Icon className="w-4 h-4" />
              <span className="font-bold text-xs">{action.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Last Action - ✅ OPTION A: Show for ALL stats regardless of selected player */}
      {lastAction ? (
        <div 
          className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50 mt-4"
          style={{ 
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}
        >
          {/* Left: Player/Team Indicator */}
          <div className="flex items-center gap-2">
            {lastActionPlayerId === null && lastAction.includes('Opponent Team') ? (
              // Opponent Team
              <>
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                  VS
                </div>
                <span className="text-sm font-medium text-gray-700">
                  Opponent
                </span>
              </>
            ) : lastActionPlayerId && selectedPlayerData && selectedPlayer === lastActionPlayerId ? (
              // Currently Selected Player
              <>
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                  {selectedPlayerData.jerseyNumber ?? '?'}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {selectedPlayerData.name}
                </span>
              </>
            ) : (
              // Different Player
              <>
                <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center text-white">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  Last Action
                </span>
              </>
            )}
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
              onClick={() => setShowStatEditModal(true)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 hover:scale-110 active:scale-95 transition-all duration-200"
              title="Edit Game Stats"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div 
          className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50 mt-4"
          style={{ 
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="text-gray-400 text-xs">
            No recent actions to display
          </div>
          {/* ✅ Edit button always visible, even when no last action */}
          <button
            onClick={() => setShowStatEditModal(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 hover:scale-110 active:scale-95 transition-all duration-200"
            title="Edit Game Stats"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stat Edit Modal */}
      {showStatEditModal && gameId && (
        <StatEditModal
          isOpen={showStatEditModal}
          onClose={() => setShowStatEditModal(false)}
          gameId={gameId}
          teamAPlayers={teamAPlayers}
          teamBPlayers={teamBPlayers}
          teamAId={teamAId}
          teamBId={teamBId}
          teamAName={teamAName}
          teamBName={teamBName}
        />
      )}
    </div>
  );
}