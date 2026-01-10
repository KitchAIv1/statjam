/**
 * TeamStatsTab Component - Team Statistics Display
 * 
 * PURPOSE: Display team performance summary and player box scores
 * for the Team Stats Tab in live game viewer.
 * 
 * UI STRUCTURE:
 * - Team Performance Summary (header block with FG, 3FG, FTS, TO, REB, AST)
 * - On Court section (5 players with stats grid)
 * - Bench section (remaining players with stats grid)
 * 
 * STYLING: Dark mode theme matching existing game viewer
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTeamStats } from '@/hooks/useTeamStats';
import { PlayerStatsRow } from './PlayerStatsRow';
import { PlayerProfileModal } from '@/components/player/PlayerProfileModal';
import { usePlayerProfileModal } from '@/hooks/usePlayerProfileModal';
import { StatsGuide } from '@/components/shared/StatsGuide';

export interface TeamStatsTabProps {
  gameId: string;
  teamId: string;
  teamName: string;
  isDark?: boolean; // ✅ Theme support - matches Game Viewer
  teamStatsOnly?: boolean; // ✅ Coach mode: Show only team summary, hide player sections
  // ✅ PHASE 2: Optional prefetched data for instant rendering
  prefetchedData?: {
    teamStats: any;
    onCourtPlayers: any[];
    benchPlayers: any[];
  };
  // ✅ Subscription gatekeeping for shot charts
  hasAdvancedAnalytics?: boolean;
  onUpgradeClick?: () => void;
}

export function TeamStatsTab({ 
  gameId, 
  teamId, 
  teamName, 
  isDark = true, 
  teamStatsOnly = false, 
  prefetchedData,
  hasAdvancedAnalytics = true,
  onUpgradeClick
}: TeamStatsTabProps) {
  // ✅ PHASE 2: Use prefetched data if available, otherwise fetch normally
  const hookData = useTeamStats(gameId, teamId, { 
    enabled: !prefetchedData // Skip hook if we have prefetched data
  });
  
  // ✅ PHASE 2: Smart data selection - prefetched takes priority
  const { teamStats, onCourtPlayers, benchPlayers, loading, error } = prefetchedData ? {
    teamStats: prefetchedData.teamStats,
    onCourtPlayers: prefetchedData.onCourtPlayers,
    benchPlayers: prefetchedData.benchPlayers,
    loading: false, // Prefetched data is ready
    error: null
  } : hookData;
  const [isMobile, setIsMobile] = useState(false);

  // ✅ Player Profile Modal - opens when clicking on a player row
  const { isOpen, playerId, isCustomPlayer, openModal, closeModal } = usePlayerProfileModal();

  const handlePlayerClick = useCallback((id: string, isCustom: boolean) => {
    openModal(id, { isCustomPlayer: isCustom });
  }, [openModal]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (loading) {
    return (
      <div className={isDark ? 'bg-slate-900 text-white' : 'bg-orange-50/30 text-gray-900'}>
        {/* ✅ LIGHTWEIGHT SKELETON */}
        <div className="p-5 space-y-4">
          <div className={`h-20 rounded-lg animate-pulse ${isDark ? 'bg-slate-800' : 'bg-orange-100/50'}`} />
          <div className={`h-6 w-24 rounded animate-pulse mt-6 ${isDark ? 'bg-slate-700' : 'bg-orange-200/50'}`} />
          <div className={`h-14 rounded-lg animate-pulse ${isDark ? 'bg-slate-800' : 'bg-orange-100/50'}`} />
          <div className={`h-14 rounded-lg animate-pulse ${isDark ? 'bg-slate-800' : 'bg-orange-100/50'}`} />
          <div className={`h-14 rounded-lg animate-pulse ${isDark ? 'bg-slate-800' : 'bg-orange-100/50'}`} />
          <div className={`h-6 w-24 rounded animate-pulse mt-6 ${isDark ? 'bg-slate-700' : 'bg-orange-200/50'}`} />
          <div className={`h-14 rounded-lg animate-pulse ${isDark ? 'bg-slate-800' : 'bg-orange-100/50'}`} />
          <div className={`h-14 rounded-lg animate-pulse ${isDark ? 'bg-slate-800' : 'bg-orange-100/50'}`} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center p-10 ${isDark ? 'bg-slate-900' : 'bg-orange-50/30'}`}>
        <div className="text-red-500 text-sm">{error}</div>
      </div>
    );
  }

  if (!teamStats) {
    return (
      <div className={`flex items-center justify-center p-10 ${isDark ? 'bg-slate-900' : 'bg-orange-50/30'}`}>
        <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>No team statistics available</div>
      </div>
    );
  }

  return (
    <div className={isDark ? 'bg-slate-900 text-white' : 'bg-orange-50/30 text-gray-900'}>
      {/* Team Performance Summary */}
      <div className={`p-3 md:p-4 border-b ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-orange-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{teamName}</div>
          <StatsGuide isDark={isDark} />
        </div>
        
        <div className={`grid gap-3 md:gap-4 ${isMobile ? 'grid-cols-3' : 'grid-cols-7'}`}>
          <div className="flex flex-col items-center text-center min-w-[50px]">
            <div className={`text-base font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {teamStats.fieldGoalsMade}/{teamStats.fieldGoalsAttempted}
            </div>
            <div className={`text-xs uppercase tracking-wide mb-0.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>FG</div>
            <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{teamStats.fieldGoalPercentage}%</div>
          </div>
          
          <div className="flex flex-col items-center text-center min-w-[50px]">
            <div className={`text-base font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {teamStats.threePointersMade}/{teamStats.threePointersAttempted}
            </div>
            <div className={`text-xs uppercase tracking-wide mb-0.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>3FG</div>
            <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{teamStats.threePointPercentage}%</div>
          </div>
          
          <div className="flex flex-col items-center text-center min-w-[50px]">
            <div className={`text-base font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {teamStats.freeThrowsMade}/{teamStats.freeThrowsAttempted}
            </div>
            <div className={`text-xs uppercase tracking-wide mb-0.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>FTS</div>
            <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{teamStats.freeThrowPercentage}%</div>
          </div>
          
          <div className="flex flex-col items-center text-center min-w-[50px]">
            <div className={`text-base font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{teamStats.turnovers}</div>
            <div className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>TO</div>
          </div>
          
          <div className="flex flex-col items-center text-center min-w-[50px]">
            <div className={`text-base font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{teamStats.rebounds}</div>
            <div className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>REB</div>
          </div>
          
          <div className="flex flex-col items-center text-center min-w-[50px]">
            <div className={`text-base font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{teamStats.assists}</div>
            <div className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>AST</div>
          </div>
          
          <div className="flex flex-col items-center text-center min-w-[50px]">
            <div className={`text-base font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{teamStats.teamFouls}</div>
            <div className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>FOULS</div>
          </div>
        </div>
      </div>

      {/* ✅ Player sections - hidden for opponent in coach mode */}
      {!teamStatsOnly && (
        <>
          {/* On Court Section */}
          <div className={isDark ? 'bg-slate-900' : 'bg-orange-50/30'}>
            <div className={`text-sm font-semibold uppercase tracking-wide px-4 py-3 border-b flex items-center gap-2 ${isDark ? 'text-orange-400 bg-slate-800/50 border-slate-700' : 'text-orange-600 bg-white border-orange-200'}`}>
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              On Court
            </div>
            <div className={isDark ? 'bg-slate-900' : 'bg-white'}>
              {onCourtPlayers.length > 0 ? (
                onCourtPlayers.map((player, index) => (
                  <PlayerStatsRow
                    key={player.playerId}
                    player={{
                      id: player.playerId,
                      name: player.playerName,
                      position: index < 2 ? 'G' : index < 4 ? 'F' : 'C',
                      isCustomPlayer: player.isCustomPlayer || false,
                      profilePhotoUrl: player.profilePhotoUrl
                    }}
                    stats={{
                      minutes: player.minutes,
                      points: player.points,
                      rebounds: player.rebounds,
                      assists: player.assists,
                      steals: player.steals,
                      blocks: player.blocks,
                      turnovers: player.turnovers,
                      fouls: player.fouls,
                      plusMinus: player.plusMinus,
                      fieldGoalsMade: player.fieldGoalsMade,
                      fieldGoalsAttempted: player.fieldGoalsAttempted,
                      threePointersMade: player.threePointersMade,
                      threePointersAttempted: player.threePointersAttempted,
                      freeThrowsMade: player.freeThrowsMade,
                      freeThrowsAttempted: player.freeThrowsAttempted
                    }}
                    onPlayerClick={handlePlayerClick}
                    isDark={isDark}
                    gameId={gameId}
                    hasAdvancedAnalytics={hasAdvancedAnalytics}
                    onUpgradeClick={onUpgradeClick}
                  />
                ))
              ) : (
                <div className={`text-sm text-center p-5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>No players on court</div>
              )}
            </div>
          </div>

          {/* Bench Section */}
          <div className={isDark ? 'bg-slate-900' : 'bg-orange-50/30'}>
            <div className={`text-sm font-semibold uppercase tracking-wide px-4 py-3 border-b ${isDark ? 'text-slate-300 bg-slate-800/50 border-slate-700' : 'text-gray-600 bg-white border-orange-200'}`}>
              Bench
            </div>
            <div className={isDark ? 'bg-slate-900' : 'bg-white'}>
              {benchPlayers.length > 0 ? (
                benchPlayers.map((player, index) => (
                  <PlayerStatsRow
                    key={player.playerId}
                    player={{
                      id: player.playerId,
                      name: player.playerName,
                      position: index < 2 ? 'G' : index < 4 ? 'F' : 'C',
                      isCustomPlayer: player.isCustomPlayer || false,
                      profilePhotoUrl: player.profilePhotoUrl
                    }}
                    stats={{
                      minutes: player.minutes,
                      points: player.points,
                      rebounds: player.rebounds,
                      assists: player.assists,
                      steals: player.steals,
                      blocks: player.blocks,
                      turnovers: player.turnovers,
                      fouls: player.fouls,
                      plusMinus: player.plusMinus,
                      fieldGoalsMade: player.fieldGoalsMade,
                      fieldGoalsAttempted: player.fieldGoalsAttempted,
                      threePointersMade: player.threePointersMade,
                      threePointersAttempted: player.threePointersAttempted,
                      freeThrowsMade: player.freeThrowsMade,
                      freeThrowsAttempted: player.freeThrowsAttempted
                    }}
                    onPlayerClick={handlePlayerClick}
                    isDark={isDark}
                    gameId={gameId}
                    hasAdvancedAnalytics={hasAdvancedAnalytics}
                    onUpgradeClick={onUpgradeClick}
                  />
                ))
              ) : (
                <div className={`text-sm text-center p-5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>No bench players</div>
              )}
            </div>
          </div>

          {/* Player Profile Modal */}
          {playerId && (
            <PlayerProfileModal
              isOpen={isOpen}
              onClose={closeModal}
              playerId={playerId}
              isCustomPlayer={isCustomPlayer || false}
            />
          )}
        </>
      )}
    </div>
  );
}

// ✅ Styles migrated to Tailwind classes with isDark theme support
