/**
 * CommandCenterTabPanel - Right Panel Tab Container
 * 
 * PURPOSE: Manage tabbed content for the Command Center right panel.
 * Contains Box Score, Analytics, Team Stats, and Opponent Stats tabs.
 * 
 * @module CommandCenterTabPanel
 */

'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeamStatsTab } from '@/app/game-viewer/[gameId]/components/TeamStatsTab';
import { CoachGameAnalyticsTab } from '@/app/game-viewer/[gameId]/components/CoachGameAnalyticsTab';
import { GameAwardsSection } from '@/app/game-viewer/[gameId]/components/GameAwardsSection';
import { BarChart3, Users, Target, Trophy } from 'lucide-react';

interface CommandCenterTabPanelProps {
  gameId: string;
  game: {
    teamAId: string;
    teamBId: string;
    teamAName: string;
    teamBName: string;
    homeScore: number;
    awayScore: number;
    status: string;
    quarter: number;
    gameClockMinutes: number;
    gameClockSeconds: number;
    teamAFouls: number;
    teamBFouls: number;
    teamATimeouts: number;
    teamBTimeouts: number;
    isCoachGame: boolean;
  };
  isCompleted: boolean;
  teamAPrefetch?: {
    loading: boolean;
    error: string | null;
    teamStats: any;
    onCourtPlayers: any[];
    benchPlayers: any[];
  };
  teamBPrefetch?: {
    loading: boolean;
    error: string | null;
    teamStats: any;
    onCourtPlayers: any[];
    benchPlayers: any[];
  };
  gameAwardsPrefetch?: {
    loading: boolean;
    playerOfTheGame: any;
    hustlePlayer: any;
  };
}

export function CommandCenterTabPanel({
  gameId,
  game,
  isCompleted,
  teamAPrefetch,
  teamBPrefetch,
  gameAwardsPrefetch,
}: CommandCenterTabPanelProps) {
  const tabTriggerClass = `flex-1 data-[state=active]:border-b-2 data-[state=active]:border-orange-500 
    rounded-none py-2.5 text-xs font-medium
    data-[state=active]:bg-orange-50 text-gray-500 data-[state=active]:text-orange-600
    flex items-center justify-center gap-1.5 hover:bg-orange-50/50 transition-colors`;

  return (
    <Tabs defaultValue="boxscore" className="flex flex-col h-full bg-white">
      {/* Tab Navigation */}
      <TabsList className="w-full rounded-none h-auto p-0 bg-white border-b border-orange-200 shrink-0">
        <TabsTrigger value="boxscore" className={tabTriggerClass}>
          <Trophy className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Box Score</span>
          <span className="sm:hidden">Box</span>
        </TabsTrigger>
        
        {isCompleted && (
          <TabsTrigger value="analytics" className={tabTriggerClass}>
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Analytics</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
        )}
        
        <TabsTrigger value="team" className={tabTriggerClass}>
          <Users className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{game.teamAName}</span>
          <span className="sm:hidden">Team</span>
        </TabsTrigger>
        
        <TabsTrigger value="opponent" className={tabTriggerClass}>
          <Target className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{game.teamBName}</span>
          <span className="sm:hidden">Opp</span>
        </TabsTrigger>
      </TabsList>

      {/* Tab Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* Box Score Tab */}
        <TabsContent value="boxscore" className="mt-0 h-full">
          <div className="p-4 space-y-4 bg-gradient-to-br from-orange-50/30 via-white to-red-50/20">
            {/* Game Summary Card */}
            <div className="rounded-lg p-4 bg-white border border-orange-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 pb-3 border-b border-orange-100 mb-3">
                Game Summary
              </h3>
              
              {/* Team A */}
              <div className="flex justify-between items-center py-2 border-b border-orange-100">
                <span className="text-sm font-medium text-gray-900">{game.teamAName}</span>
                <span className="text-xl font-bold text-orange-600">{game.homeScore}</span>
              </div>
              
              {/* Team B */}
              <div className="flex justify-between items-center py-2 border-b border-orange-100">
                <span className="text-sm font-medium text-gray-900">{game.teamBName}</span>
                <span className="text-xl font-bold text-gray-700">{game.awayScore}</span>
              </div>
              
              {/* Game Info */}
              <div className="grid grid-cols-3 gap-3 pt-3 text-xs">
                <div className="text-center">
                  <div className="text-gray-500">Status</div>
                  <div className="text-gray-700 font-medium">{game.status}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500">Quarter</div>
                  <div className="text-gray-700 font-medium">Q{game.quarter}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500">Clock</div>
                  <div className="text-gray-700 font-medium">
                    {String(game.gameClockMinutes).padStart(2, '0')}:{String(game.gameClockSeconds).padStart(2, '0')}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 pt-3 text-xs">
                <div className="text-center">
                  <div className="text-gray-500">Fouls</div>
                  <div className="text-gray-700 font-medium">{game.teamAFouls} - {game.teamBFouls}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500">Timeouts</div>
                  <div className="text-gray-700 font-medium">{game.teamATimeouts} - {game.teamBTimeouts}</div>
                </div>
              </div>
            </div>

            {/* Game Awards - Only for completed games */}
            {isCompleted && gameAwardsPrefetch && (
              <GameAwardsSection
                isDark={false}
                loading={gameAwardsPrefetch.loading}
                gameId={gameId}
                prefetchedData={!gameAwardsPrefetch.loading ? {
                  playerOfTheGame: gameAwardsPrefetch.playerOfTheGame,
                  hustlePlayer: gameAwardsPrefetch.hustlePlayer
                } : undefined}
              />
            )}
          </div>
        </TabsContent>

        {/* Analytics Tab - Only for completed games */}
        {isCompleted && (
          <TabsContent value="analytics" className="mt-0 h-full bg-gradient-to-br from-orange-50/30 via-white to-red-50/20">
            <CoachGameAnalyticsTab
              gameId={gameId}
              teamId={game.teamAId}
              teamName={game.teamAName}
              isDark={false}
            />
          </TabsContent>
        )}

        {/* Team Stats Tab */}
        <TabsContent value="team" className="mt-0 h-full bg-gradient-to-br from-orange-50/30 via-white to-red-50/20">
          <TeamStatsTab
            gameId={gameId}
            teamId={game.teamAId}
            teamName={game.teamAName}
            isDark={false}
            prefetchedData={teamAPrefetch && !teamAPrefetch.loading && !teamAPrefetch.error ? {
              teamStats: teamAPrefetch.teamStats,
              onCourtPlayers: teamAPrefetch.onCourtPlayers,
              benchPlayers: teamAPrefetch.benchPlayers
            } : undefined}
          />
        </TabsContent>

        {/* Opponent Stats Tab */}
        <TabsContent value="opponent" className="mt-0 h-full bg-gradient-to-br from-orange-50/30 via-white to-red-50/20">
          <TeamStatsTab
            gameId={gameId}
            teamId={game.teamBId}
            teamName={game.teamBName}
            isDark={false}
            teamStatsOnly={game.isCoachGame}
            prefetchedData={teamBPrefetch && !teamBPrefetch.loading && !teamBPrefetch.error ? {
              teamStats: teamBPrefetch.teamStats,
              onCourtPlayers: teamBPrefetch.onCourtPlayers,
              benchPlayers: teamBPrefetch.benchPlayers
            } : undefined}
          />
        </TabsContent>
      </div>
    </Tabs>
  );
}

