/**
 * TeamStatsTabLight - Light Theme Team Statistics Display
 * 
 * PURPOSE: Light-theme variant of TeamStatsTab for StatEditModal
 * - Reuses TeamStatsTab logic but with light theme (white/purple)
 * - Matches StatEditModal's purple/indigo color scheme
 * 
 * Follows .cursorrules: <200 lines component
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useTeamStatsOptimized } from '@/hooks/useTeamStatsOptimized';
import { PlayerStatsRowLight } from './PlayerStatsRowLight';

export interface TeamStatsTabLightProps {
  gameId: string;
  teamId: string;
  teamName: string;
}

export function TeamStatsTabLight({ gameId, teamId, teamName }: TeamStatsTabLightProps) {
  const { teamStats, onCourtPlayers, benchPlayers, loading, error } = useTeamStatsOptimized(gameId, teamId);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-gray-100 rounded-lg" />
          <div className="h-6 w-24 bg-gray-100 rounded" />
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-50 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    );
  }

  if (!teamStats) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500 text-sm">No team statistics available</div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Team Performance Summary */}
      <div className={`p-4 border-b border-gray-200 ${isMobile ? 'p-3' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold text-gray-900">{teamName}</div>
        </div>
        
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-3' : 'grid-cols-7'}`}>
          <div className="flex flex-col items-center">
            <div className="text-base font-semibold text-gray-900 mb-1">
              {teamStats.fieldGoalsMade}/{teamStats.fieldGoalsAttempted}
            </div>
            <div className="text-xs text-gray-500 uppercase">FG</div>
            <div className="text-xs text-gray-400 mt-0.5">{teamStats.fieldGoalPercentage}%</div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="text-base font-semibold text-gray-900 mb-1">
              {teamStats.threePointersMade}/{teamStats.threePointersAttempted}
            </div>
            <div className="text-xs text-gray-500 uppercase">3FG</div>
            <div className="text-xs text-gray-400 mt-0.5">{teamStats.threePointPercentage}%</div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="text-base font-semibold text-gray-900 mb-1">
              {teamStats.freeThrowsMade}/{teamStats.freeThrowsAttempted}
            </div>
            <div className="text-xs text-gray-500 uppercase">FTS</div>
            <div className="text-xs text-gray-400 mt-0.5">{teamStats.freeThrowPercentage}%</div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="text-base font-semibold text-gray-900 mb-1">{teamStats.turnovers}</div>
            <div className="text-xs text-gray-500 uppercase">TO</div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="text-base font-semibold text-gray-900 mb-1">{teamStats.rebounds}</div>
            <div className="text-xs text-gray-500 uppercase">REB</div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="text-base font-semibold text-gray-900 mb-1">{teamStats.assists}</div>
            <div className="text-xs text-gray-500 uppercase">AST</div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="text-base font-semibold text-gray-900 mb-1">{teamStats.teamFouls}</div>
            <div className="text-xs text-gray-500 uppercase">FOULS</div>
          </div>
        </div>
      </div>

      {/* On Court Section */}
      <div>
        <div className="text-base font-semibold text-gray-900 px-4 py-3 bg-purple-50 border-b border-purple-100">
          On court
        </div>
        <div>
          {onCourtPlayers.length > 0 ? (
            onCourtPlayers.map((player, index) => (
              <PlayerStatsRowLight
                key={player.playerId}
                player={{
                  id: player.playerId,
                  name: player.playerName,
                  position: index < 2 ? 'G' : index < 4 ? 'F' : 'C'
                }}
                stats={{
                  minutes: player.minutes,
                  points: player.points,
                  rebounds: player.rebounds,
                  assists: player.assists,
                  steals: player.steals,
                  blocks: player.blocks,
                  fouls: player.fouls,
                  plusMinus: player.plusMinus
                }}
              />
            ))
          ) : (
            <div className="text-gray-500 text-sm px-4 py-5 text-center">No players on court</div>
          )}
        </div>
      </div>

      {/* Bench Section */}
      <div>
        <div className="text-base font-semibold text-gray-900 px-4 py-3 bg-purple-50 border-b border-purple-100 border-t border-gray-200">
          Bench
        </div>
        <div>
          {benchPlayers.length > 0 ? (
            benchPlayers.map((player, index) => (
              <PlayerStatsRowLight
                key={player.playerId}
                player={{
                  id: player.playerId,
                  name: player.playerName,
                  position: index < 2 ? 'G' : index < 4 ? 'F' : 'C'
                }}
                stats={{
                  minutes: player.minutes,
                  points: player.points,
                  rebounds: player.rebounds,
                  assists: player.assists,
                  steals: player.steals,
                  blocks: player.blocks,
                  fouls: player.fouls,
                  plusMinus: player.plusMinus
                }}
              />
            ))
          ) : (
            <div className="text-gray-500 text-sm px-4 py-5 text-center">No bench players</div>
          )}
        </div>
      </div>
    </div>
  );
}

