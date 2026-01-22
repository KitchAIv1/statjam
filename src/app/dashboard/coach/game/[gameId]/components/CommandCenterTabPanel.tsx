/**
 * CommandCenterTabPanel - Right Panel Tab Container
 * 
 * PURPOSE: Manage tabbed content for the Command Center right panel.
 * Contains Box Score, Analytics, Team Stats, and Opponent Stats tabs.
 * 
 * @module CommandCenterTabPanel
 */

'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeamStatsTab } from '@/app/game-viewer/[gameId]/components/TeamStatsTab';
import { CoachGameAnalyticsTab } from '@/app/game-viewer/[gameId]/components/CoachGameAnalyticsTab';
import { GameAwardsSection } from '@/app/game-viewer/[gameId]/components/GameAwardsSection';
import { TournamentGameArticle } from '@/app/game-viewer/[gameId]/components/TournamentGameArticle';
import { UpgradeModal } from '@/components/subscription';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuthContext } from '@/contexts/AuthContext';
import { BarChart3, Users, Target, Trophy, Lock, Crown, Film } from 'lucide-react';
import { ClipsTab } from './ClipsTab';
import { AICoachAnalysis } from '@/components/game-viewer/AICoachAnalysis';
import { TeamShotChart } from './TeamShotChart';

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
  analyticsPrefetch?: {
    loading: boolean;
    error: string | null;
    analytics: any;
  };
  shotChartPrefetch?: {
    data: any;
    loading: boolean;
    error: string | null;
  };
}

export function CommandCenterTabPanel({
  gameId,
  game,
  isCompleted,
  teamAPrefetch,
  teamBPrefetch,
  gameAwardsPrefetch,
  analyticsPrefetch,
  shotChartPrefetch,
}: CommandCenterTabPanelProps) {
  // Subscription check for analytics gate
  const { limits } = useSubscription('coach');
  const { user } = useAuthContext();
  
  // ✅ Stat Admins and Admins are exempt from premium gates
  const isExempt = user?.role === 'stat_admin' || user?.role === 'admin';
  const hasAdvancedAnalytics = isExempt || (limits?.hasAdvancedAnalytics ?? false);
  
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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
          <TabsTrigger 
            value="analytics" 
            className={`${tabTriggerClass} ${!hasAdvancedAnalytics ? 'relative' : ''}`}
          >
            {hasAdvancedAnalytics ? (
              <BarChart3 className="w-3.5 h-3.5" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-gray-400" />
            )}
            <span className="hidden sm:inline">Analytics</span>
            <span className="sm:hidden">Stats</span>
            {!hasAdvancedAnalytics && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center">
                <Crown className="w-2 h-2 text-white" />
              </span>
            )}
          </TabsTrigger>
        )}

        {/* Clips Tab - Always visible for upsell */}
        <TabsTrigger value="clips" className={tabTriggerClass}>
          <Film className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Clips</span>
          <span className="sm:hidden">🎬</span>
        </TabsTrigger>
        
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
              
              {/* Game Info - Single Row */}
              <div className="flex items-center justify-between gap-2 pt-3 mt-1 border-t border-orange-100">
                <div className="flex-1 text-center px-2 py-1.5 bg-gray-50 rounded">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide">Status</div>
                  <div className="text-xs text-gray-700 font-semibold capitalize">{game.status}</div>
                </div>
                <div className="flex-1 text-center px-2 py-1.5 bg-orange-50 rounded">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide">Qtr</div>
                  <div className="text-xs text-orange-600 font-bold">Q{game.quarter}</div>
                </div>
                <div className="flex-1 text-center px-2 py-1.5 bg-gray-50 rounded">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide">Clock</div>
                  <div className="text-xs text-gray-700 font-semibold tabular-nums">
                    {String(game.gameClockMinutes).padStart(2, '0')}:{String(game.gameClockSeconds).padStart(2, '0')}
                  </div>
                </div>
                <div className="flex-1 text-center px-2 py-1.5 bg-gray-50 rounded">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide">Fouls</div>
                  <div className="text-xs text-gray-700 font-semibold">{game.teamAFouls} - {game.teamBFouls}</div>
                </div>
                <div className="flex-1 text-center px-2 py-1.5 bg-gray-50 rounded">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide">T/O</div>
                  <div className="text-xs text-gray-700 font-semibold">{game.teamATimeouts} - {game.teamBTimeouts}</div>
                </div>
              </div>
            </div>

            {/* Team Shot Chart - Court diagram with shot locations */}
            <TeamShotChart
              gameId={gameId}
              teamId={game.teamAId}
              teamName={game.teamAName}
              prefetchedData={shotChartPrefetch && !shotChartPrefetch.loading && !shotChartPrefetch.error
                ? shotChartPrefetch.data
                : undefined}
            />

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

            {/* Tournament Game Article - Below Awards */}
            {isCompleted && (
              <TournamentGameArticle gameId={gameId} isDark={false} />
            )}
          </div>
        </TabsContent>

        {/* Analytics Tab - Only for completed games */}
        {isCompleted && (
          <TabsContent value="analytics" className="mt-0 h-full bg-gradient-to-br from-orange-50/30 via-white to-red-50/20">
            {hasAdvancedAnalytics ? (
              <div className="space-y-0">
                <CoachGameAnalyticsTab
                  gameId={gameId}
                  teamId={game.teamAId}
                  teamName={game.teamAName}
                  isDark={false}
                  prefetchedData={analyticsPrefetch && !analyticsPrefetch.loading && !analyticsPrefetch.error 
                    ? analyticsPrefetch.analytics 
                    : undefined}
                />
                {/* AI Coach Analysis - Below Advanced Stats */}
                <AICoachAnalysis gameId={gameId} />
              </div>
            ) : (
              /* Locked State for Free Users */
              <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
                <div className="w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center shadow-lg">
                  <Lock className="w-10 h-10 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Advanced Analytics
                </h3>
                <p className="text-gray-600 mb-6 max-w-sm">
                  Unlock detailed game breakdowns, shooting efficiency metrics, shot selection analysis, and AI-powered coaching insights.
                </p>
                <div className="flex flex-wrap justify-center gap-2 mb-6 text-xs">
                  <span className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full border border-orange-200">
                    eFG% & TS%
                  </span>
                  <span className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full border border-orange-200">
                    Shot Selection
                  </span>
                  <span className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full border border-orange-200">
                    Game Intelligence
                  </span>
                  <span className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full border border-orange-200">
                    Coach Insights
                  </span>
                </div>
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg shadow-md hover:from-orange-600 hover:to-orange-700 transition-all flex items-center gap-2"
                >
                  <Crown className="w-4 h-4" />
                  Upgrade to Pro
                </button>
              </div>
            )}
          </TabsContent>
        )}

        {/* Clips Tab */}
        <TabsContent value="clips" className="mt-0 h-full bg-gradient-to-br from-orange-50/30 via-white to-red-50/20">
          <ClipsTab gameId={gameId} teamId={game.teamAId} />
        </TabsContent>

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
            hasAdvancedAnalytics={hasAdvancedAnalytics}
            onUpgradeClick={() => setShowUpgradeModal(true)}
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
            hasAdvancedAnalytics={hasAdvancedAnalytics}
            onUpgradeClick={() => setShowUpgradeModal(true)}
          />
        </TabsContent>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        role="coach"
        triggerReason="Upgrade to unlock Advanced Analytics with detailed game breakdowns, efficiency metrics, and AI coaching insights."
      />
    </Tabs>
  );
}

