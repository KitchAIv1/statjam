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
import { useTeamStats } from '@/hooks/useTeamStats';
import { PlayerStatsRowLight } from './PlayerStatsRowLight';

export interface TeamStatsTabLightProps {
  gameId: string;
  teamId: string;
  teamName: string;
  /**
   * If true, uses useTeamStats (no cache, real-time updates)
   * If false, uses useTeamStatsOptimized (cache-first, optimized for Edit Stats Modal)
   * Default: false (cache-first)
   */
  useRealTime?: boolean;
}

export function TeamStatsTabLight({ gameId, teamId, teamName, useRealTime = false }: TeamStatsTabLightProps) {
  // ✅ FIX: Use useTeamStats for Score section (real-time), useTeamStatsOptimized for Edit Stats (cache-first)
  // Conditionally call hooks based on useRealTime to avoid unnecessary subscriptions
  const optimizedData = useTeamStatsOptimized(gameId, teamId);
  const realTimeData = useTeamStats(gameId, teamId, { enabled: useRealTime });
  
  // Select data based on useRealTime prop
  // When useRealTime=true, useTeamStats runs and useTeamStatsOptimized still runs but is ignored
  // When useRealTime=false, useTeamStatsOptimized runs and useTeamStats is disabled
  const { teamStats, onCourtPlayers, benchPlayers, loading, error } = useRealTime ? realTimeData : optimizedData;
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
      <div className={`border-b border-gray-200 ${isMobile ? 'p-2' : 'p-4'}`}>
        <div className={`flex items-center justify-between ${isMobile ? 'mb-2' : 'mb-4'}`}>
          <div className={`font-semibold text-gray-900 ${isMobile ? 'text-sm' : 'text-lg'}`}>{teamName}</div>
        </div>
        
        {/* ✅ MOBILE: Horizontal scroll for team stats */}
        <div className={`${isMobile ? 'overflow-x-auto scrollbar-hide' : ''}`}>
          <div className={`grid gap-3 ${isMobile ? 'grid-cols-7' : 'grid-cols-7'}`} style={isMobile ? { minWidth: '320px' } : undefined}>
            <div className="flex flex-col items-center">
              <div className={`font-semibold text-gray-900 mb-0.5 ${isMobile ? 'text-xs' : 'text-base'}`}>
                {teamStats.fieldGoalsMade}/{teamStats.fieldGoalsAttempted}
              </div>
              <div className={`text-gray-500 uppercase ${isMobile ? 'text-[8px]' : 'text-xs'}`}>FG</div>
              <div className={`text-gray-400 ${isMobile ? 'text-[8px]' : 'text-xs'}`}>{teamStats.fieldGoalPercentage}%</div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className={`font-semibold text-gray-900 mb-0.5 ${isMobile ? 'text-xs' : 'text-base'}`}>
                {teamStats.threePointersMade}/{teamStats.threePointersAttempted}
              </div>
              <div className={`text-gray-500 uppercase ${isMobile ? 'text-[8px]' : 'text-xs'}`}>3FG</div>
              <div className={`text-gray-400 ${isMobile ? 'text-[8px]' : 'text-xs'}`}>{teamStats.threePointPercentage}%</div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className={`font-semibold text-gray-900 mb-0.5 ${isMobile ? 'text-xs' : 'text-base'}`}>
                {teamStats.freeThrowsMade}/{teamStats.freeThrowsAttempted}
              </div>
              <div className={`text-gray-500 uppercase ${isMobile ? 'text-[8px]' : 'text-xs'}`}>FT</div>
              <div className={`text-gray-400 ${isMobile ? 'text-[8px]' : 'text-xs'}`}>{teamStats.freeThrowPercentage}%</div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className={`font-semibold text-gray-900 mb-0.5 ${isMobile ? 'text-xs' : 'text-base'}`}>{teamStats.turnovers}</div>
              <div className={`text-gray-500 uppercase ${isMobile ? 'text-[8px]' : 'text-xs'}`}>TO</div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className={`font-semibold text-gray-900 mb-0.5 ${isMobile ? 'text-xs' : 'text-base'}`}>{teamStats.rebounds}</div>
              <div className={`text-gray-500 uppercase ${isMobile ? 'text-[8px]' : 'text-xs'}`}>REB</div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className={`font-semibold text-gray-900 mb-0.5 ${isMobile ? 'text-xs' : 'text-base'}`}>{teamStats.assists}</div>
              <div className={`text-gray-500 uppercase ${isMobile ? 'text-[8px]' : 'text-xs'}`}>AST</div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className={`font-semibold text-gray-900 mb-0.5 ${isMobile ? 'text-xs' : 'text-base'}`}>{teamStats.teamFouls}</div>
              <div className={`text-gray-500 uppercase ${isMobile ? 'text-[8px]' : 'text-xs'}`}>PF</div>
            </div>
          </div>
        </div>
      </div>

      {/* On Court Section */}
      <div>
        <div className={`font-semibold text-gray-900 bg-purple-50 border-b border-purple-100 ${
          isMobile ? 'text-xs px-2 py-1.5' : 'text-base px-4 py-3'
        }`}>
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
                  plusMinus: player.plusMinus,
                  fieldGoalsMade: player.fieldGoalsMade,
                  fieldGoalsAttempted: player.fieldGoalsAttempted,
                  threePointersMade: player.threePointersMade,
                  threePointersAttempted: player.threePointersAttempted,
                  freeThrowsMade: player.freeThrowsMade,
                  freeThrowsAttempted: player.freeThrowsAttempted
                }}
              />
            ))
          ) : (
            <div className={`text-gray-500 text-center ${isMobile ? 'text-xs px-2 py-3' : 'text-sm px-4 py-5'}`}>No players on court</div>
          )}
        </div>
      </div>

      {/* Bench Section */}
      <div>
        <div className={`font-semibold text-gray-900 bg-purple-50 border-b border-purple-100 border-t border-gray-200 ${
          isMobile ? 'text-xs px-2 py-1.5' : 'text-base px-4 py-3'
        }`}>
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
                  plusMinus: player.plusMinus,
                  fieldGoalsMade: player.fieldGoalsMade,
                  fieldGoalsAttempted: player.fieldGoalsAttempted,
                  threePointersMade: player.threePointersMade,
                  threePointersAttempted: player.threePointersAttempted,
                  freeThrowsMade: player.freeThrowsMade,
                  freeThrowsAttempted: player.freeThrowsAttempted
                }}
              />
            ))
          ) : (
            <div className={`text-gray-500 text-center ${isMobile ? 'text-xs px-2 py-3' : 'text-sm px-4 py-5'}`}>No bench players</div>
          )}
        </div>
      </div>
    </div>
  );
}

