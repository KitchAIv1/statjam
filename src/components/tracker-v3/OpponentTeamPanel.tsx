'use client';

import React from 'react';
import { Users, Target } from 'lucide-react';

interface OpponentTeamPanelProps {
  opponentName: string;
  selectedPlayer: string | null;
  onPlayerSelect: (playerId: string) => void;
}

/**
 * OpponentTeamPanel - Replaces Team B roster in coach mode
 * 
 * Features:
 * - Shows opponent name prominently
 * - Single "Opponent Team" selection option
 * - Matches existing TeamRosterV3 styling
 * - Works with existing stat recording flow
 * 
 * Follows .cursorrules: <100 lines, single responsibility
 */
export function OpponentTeamPanel({
  opponentName,
  selectedPlayer,
  onPlayerSelect
}: OpponentTeamPanelProps) {
  
  const OPPONENT_TEAM_ID = 'opponent-team';
  const isSelected = selectedPlayer === OPPONENT_TEAM_ID;

  return (
    <div 
      className="w-full h-full rounded-xl p-6 border-2 flex flex-col"
      style={{ 
        background: '#ffffff',
        borderColor: '#60a5fa',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        minHeight: '650px',
        maxHeight: '650px',
        height: '650px'
      }}
    >
      {/* Team Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-teal-500"></div>
          <h3 className="text-xl font-bold text-blue-800">
            {opponentName}
          </h3>
        </div>
        
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-700">
            Opponent
          </span>
        </div>
      </div>

      {/* Opponent Team Selection */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div 
          onClick={() => onPlayerSelect(OPPONENT_TEAM_ID)}
          className="cursor-pointer transition-all duration-200 hover:scale-105"
          style={{
            width: '200px',
            height: '200px',
            borderRadius: '16px',
            background: isSelected 
              ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
              : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
            border: isSelected ? '4px solid #1d4ed8' : '2px solid #93c5fd',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            boxShadow: isSelected 
              ? '0 20px 40px rgba(59, 130, 246, 0.4)'
              : '0 10px 20px rgba(59, 130, 246, 0.1)'
          }}
        >
          <Users 
            style={{
              width: '64px',
              height: '64px',
              color: isSelected ? '#ffffff' : '#3b82f6'
            }}
          />
          <div style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: isSelected ? '#ffffff' : '#1e40af',
            textAlign: 'center'
          }}>
            Opponent Team
          </div>
        </div>

        {/* Helper Text */}
        <div style={{
          marginTop: '32px',
          textAlign: 'center',
          color: '#6b7280',
          fontSize: '0.875rem',
          maxWidth: '300px'
        }}>
          <p>
            Select "Opponent Team" to record stats for {opponentName}
          </p>
          <p style={{ marginTop: '8px', fontSize: '0.75rem' }}>
            All opponent stats will be attributed to the team as a whole
          </p>
        </div>
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
          border: '1px solid #93c5fd',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#1e40af',
          fontSize: '0.875rem',
          fontWeight: '600'
        }}>
          ✓ Opponent Team Selected - Choose a stat to record
        </div>
      )}
    </div>
  );
}
