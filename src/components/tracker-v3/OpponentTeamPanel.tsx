'use client';

import React from 'react';
import { Users, Target } from 'lucide-react';
import { OpponentStatsPanel } from './OpponentStatsPanel';

interface OpponentTeamPanelProps {
  opponentName: string;
  selectedPlayer: string | null;
  onPlayerSelect: (playerId: string) => void;
  gameId: string;
  teamId: string;
  teamName: string;
}

/**
 * OpponentTeamPanel - Split panel for coach mode
 * 
 * Features:
 * - Top half: Opponent team selection (compressed)
 * - Bottom half: Real-time opponent stats display
 * - Matches existing TeamRosterV3 styling
 * - Works with existing stat recording flow
 * 
 * Follows .cursorrules: <200 lines, single responsibility
 */
export function OpponentTeamPanel({
  opponentName,
  selectedPlayer,
  onPlayerSelect,
  gameId,
  teamId,
  teamName
}: OpponentTeamPanelProps) {
  
  const OPPONENT_TEAM_ID = 'opponent-team';
  const isSelected = selectedPlayer === OPPONENT_TEAM_ID;

  return (
    <div 
      className="w-full h-full flex flex-col gap-3"
      style={{ 
        minHeight: '650px',
        maxHeight: '650px',
        height: '650px'
      }}
    >
      {/* CONTAINER 1: Opponent Team Selection Button */}
      <div 
        className="rounded-xl p-4 border-2"
        style={{
          background: '#ffffff',
          borderColor: '#60a5fa',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          minHeight: '200px',
          maxHeight: '200px'
        }}
      >
        {/* Team Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-teal-500"></div>
            <h3 className="text-lg font-bold text-blue-800">
              {opponentName}
            </h3>
          </div>
          
          <div className="flex items-center gap-1">
            <Target className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-700">
              Opponent
            </span>
          </div>
        </div>

        {/* Opponent Team Selection Button (Compact) */}
        <div className="flex flex-col items-center">
          <div 
            onClick={() => onPlayerSelect(OPPONENT_TEAM_ID)}
            className="cursor-pointer transition-all duration-200 hover:scale-105"
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '12px',
              background: isSelected 
                ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
              border: isSelected ? '3px solid #1d4ed8' : '2px solid #93c5fd',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: isSelected 
                ? '0 10px 20px rgba(59, 130, 246, 0.4)'
                : '0 5px 10px rgba(59, 130, 246, 0.1)'
            }}
          >
            <Users 
              style={{
                width: '40px',
                height: '40px',
                color: isSelected ? '#ffffff' : '#3b82f6'
              }}
            />
            <div style={{
              fontSize: '0.875rem',
              fontWeight: '700',
              color: isSelected ? '#ffffff' : '#1e40af',
              textAlign: 'center'
            }}>
              Opponent Team
            </div>
          </div>

          {/* Selection Indicator */}
          {isSelected && (
            <div style={{
              marginTop: '8px',
              padding: '6px 12px',
              background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
              border: '1px solid #93c5fd',
              borderRadius: '6px',
              textAlign: 'center',
              color: '#1e40af',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              ✓ Selected
            </div>
          )}
        </div>
      </div>

      {/* CONTAINER 2: Opponent Stats Display */}
      <div 
        className="flex-1 rounded-xl overflow-hidden"
        style={{
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
      >
        <OpponentStatsPanel
          gameId={gameId}
          teamId={teamId}
          teamName={teamName}
          opponentName={opponentName}
        />
      </div>
    </div>
  );
}
