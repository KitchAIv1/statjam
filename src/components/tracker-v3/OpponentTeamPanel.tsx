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
  mobileMode?: boolean; // ✅ Mobile optimization flag
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
  teamName,
  mobileMode = false
}: OpponentTeamPanelProps) {
  
  const OPPONENT_TEAM_ID = 'opponent-team';
  const isSelected = selectedPlayer === OPPONENT_TEAM_ID;

  // ✅ MOBILE MODE: Compact button only (matches HOME team height)
  if (mobileMode) {
    return (
      <div className="flex items-center gap-2">
        {/* ✅ FIX 1: Vertical Team Label (matching home team style) */}
        <div 
          className={`flex items-center justify-center px-2 py-3 rounded-lg ${
            isSelected
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        >
          <span className="text-xs font-bold tracking-wider">
            OPPONENT
          </span>
        </div>

        {/* ✅ FIX 3: Entire Roster Container Clickable */}
        <div 
          onClick={() => onPlayerSelect(OPPONENT_TEAM_ID)}
          className="flex-1 rounded-lg p-2 transition-all border-2 cursor-pointer"
          style={{
            borderColor: isSelected ? '#3b82f6' : '#93c5fd',
            background: isSelected 
              ? 'linear-gradient(to right, #dbeafe, #bfdbfe)' 
              : 'linear-gradient(to right, #eff6ff, #dbeafe)',
            boxShadow: isSelected ? '0 4px 6px -1px rgba(59, 130, 246, 0.3)' : 'none'
          }}
        >
          {/* Team Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-teal-500"></div>
              <span className="text-xs font-semibold text-blue-700">
                {opponentName}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <Target className="w-3 h-3 text-blue-600" />
              <span className="text-[10px] font-medium text-blue-600">
                Opponent
              </span>
            </div>
          </div>

          {/* ✅ FIX 2: Opponent Icon Centered in Roster */}
          <div className="flex justify-center gap-2">
            <div className="flex-shrink-0 flex flex-col items-center gap-1">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: isSelected 
                    ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                    : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                  border: isSelected ? '2px solid #1d4ed8' : '2px solid #93c5fd',
                  boxShadow: isSelected 
                    ? '0 4px 8px rgba(59, 130, 246, 0.4)'
                    : '0 2px 4px rgba(59, 130, 246, 0.1)'
                }}
              >
                <Users 
                  className="w-6 h-6"
                  style={{
                    color: isSelected ? '#ffffff' : '#3b82f6'
                  }}
                />
              </div>
              <span 
                className="text-[10px] font-medium text-center"
                style={{
                  color: isSelected ? '#1e40af' : '#60a5fa'
                }}
              >
                VS
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ DESKTOP MODE: Full panel with stats
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
        onClick={() => onPlayerSelect(OPPONENT_TEAM_ID)}
        className="rounded-xl p-4 border-2 cursor-pointer transition-all duration-200 hover:scale-[1.02]"
        style={{
          background: '#ffffff',
          borderColor: isSelected ? '#3b82f6' : '#60a5fa',
          boxShadow: isSelected 
            ? '0 10px 25px -5px rgba(59, 130, 246, 0.3), 0 10px 10px -5px rgba(59, 130, 246, 0.2)'
            : '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          minHeight: '200px',
          maxHeight: '200px'
        }}
      >
        {/* ✅ FIX 1: Team Header (matching home team style) */}
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

        {/* ✅ FIX 2: Opponent Icon Centered in Roster Interface */}
        <div className="flex flex-col items-center justify-center">
          <div 
            className="transition-all duration-200"
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '12px',
              background: isSelected 
                ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
              border: isSelected ? '3px solid #1d4ed8' : '2px solid #93c5fd',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: isSelected 
                ? '0 8px 16px rgba(59, 130, 246, 0.4)'
                : '0 4px 8px rgba(59, 130, 246, 0.1)'
            }}
          >
            <Users 
              style={{
                width: '36px',
                height: '36px',
                color: isSelected ? '#ffffff' : '#3b82f6'
              }}
            />
            <div style={{
              fontSize: '0.75rem',
              fontWeight: '700',
              color: isSelected ? '#ffffff' : '#1e40af',
              textAlign: 'center'
            }}>
              VS
            </div>
          </div>

          {/* Selection Indicator */}
          {isSelected && (
            <div style={{
              marginTop: '8px',
              padding: '4px 10px',
              background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
              border: '1px solid #93c5fd',
              borderRadius: '6px',
              textAlign: 'center',
              color: '#1e40af',
              fontSize: '0.7rem',
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
