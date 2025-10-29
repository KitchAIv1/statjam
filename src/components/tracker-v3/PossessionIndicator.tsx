'use client';

import React from 'react';

interface PossessionIndicatorProps {
  currentTeamId: string;
  teamAId: string;
  teamBId: string;
  teamAName: string;
  teamBName: string;
  possessionArrow: string;
  isMobile?: boolean;
  onPossessionChange?: (teamId: string) => void; // ✅ PHASE 6: Manual control
}

/**
 * PossessionIndicator - Shows which team currently has possession
 * 
 * Features:
 * - Active possession badge with gradient
 * - Pulse animation on possession change
 * - Jump ball arrow indicator
 * - Responsive sizing for mobile/desktop
 */
export const PossessionIndicator: React.FC<PossessionIndicatorProps> = ({
  currentTeamId,
  teamAId,
  teamBId,
  teamAName,
  teamBName,
  possessionArrow,
  isMobile = false,
  onPossessionChange
}) => {
  const isTeamAPossession = currentTeamId === teamAId;
  const isTeamBPossession = currentTeamId === teamBId;
  
  // Determine which team name to display
  const possessionTeamName = isTeamAPossession ? teamAName : teamBName;
  
  // Show arrow if possession arrow differs from current possession (jump ball situation)
  const showArrow = possessionArrow !== currentTeamId;

  // ✅ PHASE 6: Handle manual possession change
  const handleTeamClick = (teamId: string) => {
    if (onPossessionChange && teamId !== currentTeamId) {
      onPossessionChange(teamId);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${isMobile ? 'justify-center' : ''}`}>
      {/* Team A Indicator */}
      <div
        onClick={() => handleTeamClick(teamAId)}
        className={`
          ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'}
          rounded-md font-medium transition-all duration-300
          ${onPossessionChange ? 'cursor-pointer hover:opacity-80' : ''}
          ${isTeamAPossession 
            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg animate-pulse' 
            : 'bg-gray-700 text-gray-400'
          }
        `}
        title={onPossessionChange ? `Click to give possession to ${teamAName}` : undefined}
      >
        {isMobile ? 'A' : teamAName}
      </div>

      {/* Possession Ball Icon */}
      <div className="relative">
        <div
          className={`
            w-6 h-6 rounded-full flex items-center justify-center
            transition-all duration-300
            ${isTeamAPossession || isTeamBPossession
              ? 'bg-orange-500 shadow-lg shadow-orange-500/50' 
              : 'bg-gray-600'
            }
          `}
        >
          <span className="text-white text-xs font-bold">●</span>
        </div>
        
        {/* Jump Ball Arrow */}
        {showArrow && (
          <div
            className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center"
            title={`Jump ball arrow: ${possessionArrow === teamAId ? teamAName : teamBName}`}
          >
            <span className="text-white text-[8px]">↑</span>
          </div>
        )}
      </div>

      {/* Team B Indicator */}
      <div
        onClick={() => handleTeamClick(teamBId)}
        className={`
          ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'}
          rounded-md font-medium transition-all duration-300
          ${onPossessionChange ? 'cursor-pointer hover:opacity-80' : ''}
          ${isTeamBPossession 
            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg animate-pulse' 
            : 'bg-gray-700 text-gray-400'
          }
        `}
        title={onPossessionChange ? `Click to give possession to ${teamBName}` : undefined}
      >
        {isMobile ? 'B' : teamBName}
      </div>
    </div>
  );
};

