'use client';

import React, { useState } from 'react';
import { AlertTriangle, RotateCcw, Clock, Undo, Edit } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PossessionIndicator } from './PossessionIndicator';
import { StatEditModal } from './modals/StatEditModal';

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
  photo_url?: string;
}

interface DesktopStatGridV3Props {
  selectedPlayer: string | null;
  selectedPlayerData?: Player | null;
  isClockRunning: boolean;
  onStatRecord: (statType: string, modifier?: string) => Promise<void>;
  onFoulRecord: (foulType: 'personal' | 'technical') => Promise<void>;
  onTimeOut: () => void;
  onSubstitution?: () => void;
  onGameEnd: () => void;
  lastAction?: string | null;
  lastActionPlayerId?: string | null;
  // ✅ NEW: Possession indicator props
  possession?: {
    currentTeamId: string;
    possessionArrow: string;
  };
  teamAId?: string;
  teamBId?: string;
  teamAName?: string;
  teamBName?: string;
  isCoachMode?: boolean;
  // ✅ PHASE 6: Manual possession control
  onPossessionChange?: (teamId: string) => void;
  // ✅ Game Status
  gameStatus?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'overtime';
  // ✅ Stat Edit Modal
  gameId?: string;
  teamAPlayers?: Player[];
  teamBPlayers?: Player[];
}

export function DesktopStatGridV3({
  selectedPlayer,
  selectedPlayerData,
  isClockRunning,
  onStatRecord,
  onFoulRecord,
  onTimeOut,
  onSubstitution,
  onGameEnd,
  lastAction,
  lastActionPlayerId,
  // ✅ NEW: Possession indicator props
  possession,
  teamAId,
  teamBId,
  teamAName,
  teamBName,
  isCoachMode = false,
  onPossessionChange,
  // ✅ Game Status
  gameStatus = 'in_progress',
  // ✅ Stat Edit Modal
  gameId,
  teamAPlayers = [],
  teamBPlayers = []
}: DesktopStatGridV3Props) {
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

  // Primary stats with made/missed options - Same as mobile
  const madeStats = [
    { id: '2pt-made', label: '2PT', statType: 'field_goal', modifier: 'made' },
    { id: '3pt-made', label: '3PT', statType: 'three_pointer', modifier: 'made' },
    { id: 'ft-made', label: 'FT', statType: 'free_throw', modifier: 'made' },
    { id: 'reb-offensive', label: 'REB', statType: 'rebound', modifier: 'offensive' }
  ];

  const missedStats = [
    { id: '2pt-missed', label: '2PT', statType: 'field_goal', modifier: 'missed' },
    { id: '3pt-missed', label: '3PT', statType: 'three_pointer', modifier: 'missed' },
    { id: 'ft-missed', label: 'FT', statType: 'free_throw', modifier: 'missed' },
    { id: 'reb-defensive', label: 'REB', statType: 'rebound', modifier: 'defensive' }
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
      disabled: !onSubstitution,
      color: 'gray'
    }
  ];

  return (
    <div 
      className="w-full h-full rounded-xl p-4 flex flex-col"
      style={{ 
        background: '#ffffff', 
        borderColor: '#e5e7eb',
        borderWidth: '1px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        minHeight: '650px',
        maxHeight: '650px',
        height: '650px',
        overflow: 'hidden'
      }}
    >


      {/* ✅ FIXED: Last Action Section - Fixed Height to Prevent Button Shifting */}
      <div 
        className="w-full rounded-xl p-3 mb-3 flex-shrink-0"
        style={{ 
          background: '#ffffff', 
          borderColor: '#e5e7eb',
          borderWidth: '1px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          minHeight: '130px',
          maxHeight: '130px',
          overflow: 'hidden'
        }}
      >
        {/* Possession Indicator replaces "Last Action" text */}
        {possession && teamAId && teamBId && teamAName && teamBName ? (
          <div className="mb-4 flex justify-center">
            <PossessionIndicator
              currentTeamId={possession.currentTeamId}
              teamAId={teamAId}
              teamBId={teamBId}
              teamAName={teamAName}
              teamBName={teamBName}
              possessionArrow={possession.possessionArrow}
              isMobile={false}
              onPossessionChange={onPossessionChange}
            />
          </div>
        ) : (
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Last Action</h3>
        )}
        
        {/* Keep Last Action Details - ✅ OPTION A: Show for ALL stats regardless of selected player */}
        {lastAction ? (
          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50">
            {/* Left: Player Details */}
            <div className="flex items-center gap-3">
              {lastActionPlayerId === null && lastAction.includes('Opponent Team') ? (
                // Opponent Team Display
                <>
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    VS
                  </div>
                  <span className="text-base font-medium text-gray-700">
                    Opponent Team
                  </span>
                </>
              ) : lastActionPlayerId && selectedPlayerData && selectedPlayer === lastActionPlayerId ? (
                // Currently Selected Player (show their details)
                <>
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    #{selectedPlayerData?.jerseyNumber || '?'}
                  </div>
                  <span className="text-base font-medium text-gray-700">
                    {selectedPlayerData?.name}
                  </span>
                </>
              ) : (
                // Different Player (show generic indicator)
                <>
                  <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-base font-medium text-gray-700">
                    Last Action
                  </span>
                </>
              )}
            </div>
            
            {/* Center: Action Text */}
            <div className="text-base font-semibold text-gray-800 bg-white px-3 py-2 rounded border">
              {lastAction}
            </div>
            
            {/* Right: Action Icons */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  // TODO: Implement undo functionality
                  console.log('🔄 Undo last action:', lastAction);
                  alert('Undo functionality will be implemented');
                }}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-orange-100 text-orange-600 hover:bg-orange-200 hover:scale-110 active:scale-95 transition-all duration-200"
              >
                <Undo className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setShowStatEditModal(true)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 hover:scale-110 active:scale-95 transition-all duration-200"
                title="Edit Game Stats"
              >
                <Edit className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="text-gray-400 text-sm">
              No recent actions to display
            </div>
          </div>
        )}
      </div>

      {/* ✅ FIXED: Scrollable Stat Grids Container */}
      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden stat-grid-scroll"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#9ca3af #f3f4f6'
        }}
      >
      {/* Made Stats Row - Desktop Optimized */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {madeStats.map((stat) => {
          const statId = `${stat.statType}-${stat.modifier}`;
          const isThisButtonRecording = isRecording === statId;
          
          return (
            <Button
              key={stat.id}
              onClick={() => handleStatClick(stat.statType, stat.modifier)}
              disabled={isDisabled || isThisButtonRecording}
              className={`h-20 flex flex-col justify-center items-center text-base font-bold transition-colors duration-150 rounded-xl border-2 shadow-md ${
                isThisButtonRecording
                  ? 'bg-green-600 border-green-400 text-white shadow-xl' 
                  : isDisabled
                    ? 'opacity-40 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400'
                    : 'bg-green-500 border-green-400 hover:bg-green-600 hover:border-green-300 text-white hover:shadow-lg active:scale-95'
              }`}
              style={{
                minHeight: '80px',
                fontSize: '15px',
                willChange: 'background-color, border-color'
              }}
            >
              <div className="font-black text-xl">{stat.label}</div>
              <div className="text-sm opacity-90 font-semibold">
                {stat.statType === 'rebound' ? '⚡ Offensive' : '✓ MADE'}
              </div>
            </Button>
          );
        })}
      </div>

      {/* Missed Stats Row - Desktop Optimized */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {missedStats.map((stat) => {
          const statId = `${stat.statType}-${stat.modifier}`;
          const isThisButtonRecording = isRecording === statId;
          
          return (
            <Button
              key={stat.id}
              onClick={() => handleStatClick(stat.statType, stat.modifier)}
              disabled={isDisabled || isThisButtonRecording}
              className={`h-20 flex flex-col justify-center items-center text-base font-medium transition-colors duration-150 rounded-xl border-2 shadow-md ${
                isThisButtonRecording
                  ? 'bg-red-600 border-red-400 text-white shadow-xl' 
                  : isDisabled
                    ? 'opacity-40 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400'
                    : 'bg-red-400 border-red-300 hover:bg-red-500 hover:border-red-300 text-white hover:shadow-lg active:scale-95'
              }`}
              style={{
                minHeight: '80px',
                fontSize: '15px',
                willChange: 'background-color, border-color'
              }}
            >
              <div className="font-black text-xl">{stat.label}</div>
              <div className="text-sm opacity-90 font-semibold">
                {stat.statType === 'rebound' ? '🛡️ Defensive' : '✗ MISS'}
              </div>
            </Button>
          );
        })}
      </div>

      {/* Single Action Stats - Desktop Optimized */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {singleStats.map((stat) => (
          <Button
            key={stat.id}
            onClick={() => handleStatClick(stat.statType)}
            disabled={isDisabled || isRecording === stat.statType}
            className={`h-20 text-base font-bold transition-colors duration-150 rounded-xl border-2 shadow-md ${
              isRecording === stat.statType
                ? 'bg-blue-600 border-blue-400 text-white shadow-xl' 
                : isDisabled
                  ? 'opacity-40 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400'
                  : 'bg-blue-500 border-blue-400 hover:bg-blue-600 hover:border-blue-300 text-white hover:shadow-lg active:bg-blue-700'
            }`}
            style={{
              minHeight: '80px',
              fontSize: '16px',
              willChange: 'background-color, border-color'
            }}
          >
            <div className="font-black text-xl">{stat.label}</div>
          </Button>
        ))}
      </div>

      {/* Special Actions - Desktop Layout */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {secondaryActions.map((action) => {
          const Icon = action.icon;
          const isRecordingThis = isRecording === `foul-${action.id === 'foul' ? 'personal' : 'technical'}`;
          
          // Color schemes for each button
          const getColorClasses = () => {
            if (isDisabled || action.disabled) {
              return 'opacity-40 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400';
            }
            
            if (isRecordingThis) {
              return 'animate-pulse shadow-xl scale-105';
            }
            
            switch (action.color) {
              case 'red':
                return 'bg-red-500 border-red-400 text-white hover:bg-red-600 hover:border-red-500 hover:shadow-lg hover:scale-105 active:scale-95';
              case 'orange':
                return 'bg-orange-500 border-orange-400 text-white hover:bg-orange-600 hover:border-orange-500 hover:shadow-lg hover:scale-105 active:scale-95';
              case 'lightblack':
                return 'bg-gray-600 border-gray-500 text-white hover:bg-gray-700 hover:border-gray-600 hover:shadow-lg hover:scale-105 active:scale-95';
              case 'gray':
                return 'bg-gray-800 border-gray-700 text-white hover:bg-gray-900 hover:border-gray-800 hover:shadow-lg hover:scale-105 active:scale-95';
              default:
                return 'border-gray-300 text-gray-600 hover:bg-gray-500 hover:text-white hover:border-gray-400 hover:shadow-lg hover:scale-105 active:scale-95';
            }
          };
          
          return (
            <Button
              key={action.id}
              onClick={action.onClick}
              disabled={isDisabled || action.disabled}
              variant={action.variant}
              className={`h-16 flex items-center justify-center gap-3 text-base font-semibold transition-all duration-200 rounded-xl border-2 shadow-md ${getColorClasses()}`}
              style={{
                minHeight: '64px'
              }}
            >
              <Icon className="w-5 h-5" />
              <span className="font-bold">{action.label}</span>
            </Button>
          );
        })}
      </div>

      </div>
      {/* ✅ END: Scrollable Stat Grids Container */}

      {/* ✅ End Game Button / Status - Always Visible at Bottom */}
      <div className="mt-3 flex-shrink-0">
        {gameStatus === 'completed' || gameStatus === 'cancelled' ? (
          <div
            className="w-full text-lg font-black py-3 rounded-xl border-2 border-gray-400 bg-gray-500 text-white cursor-not-allowed opacity-50"
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl">🏁</span>
              <span>{gameStatus === 'completed' ? 'GAME ENDED' : 'GAME CANCELLED'}</span>
            </div>
          </div>
        ) : (
          <button
            className="w-full text-lg font-black py-3 rounded-xl border-2 border-red-400 bg-red-500 hover:bg-red-600 text-white transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95"
            onClick={() => {
              if (confirm('End Game?\n\nThis will mark the game as completed and save all statistics. This action cannot be undone.')) {
                onGameEnd();
              }
            }}
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl">🏁</span>
              <span>END GAME</span>
            </div>
          </button>
        )}
      </div>

      {/* Stat Edit Modal */}
      {showStatEditModal && gameId && (
        <StatEditModal
          isOpen={showStatEditModal}
          onClose={() => setShowStatEditModal(false)}
          gameId={gameId}
          teamAPlayers={teamAPlayers}
          teamBPlayers={teamBPlayers}
        />
      )}
    </div>
  );
}
