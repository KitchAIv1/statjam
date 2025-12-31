/**
 * StatAdminGameViewer - Game Analysis Page for Stat Admins
 * 
 * PURPOSE: Reuses Coach Command Center components for stat admin game viewing.
 * Split-screen layout: Play-by-play left, Tabbed content right.
 * 
 * AUTHENTICATED: Stat Admin role only
 * REUSES: CommandCenterHeader, CompactPlayByPlayFeed, CommandCenterTabPanel
 * 
 * @module StatAdminGameViewer
 */

'use client';

import React, { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameViewerV2 } from '@/hooks/useGameViewerV2';
import { useTeamStats } from '@/hooks/useTeamStats';
import { useGameAwards } from '@/hooks/useGameAwards';
import { useGameAnalytics } from '@/hooks/useGameAnalytics';
import { useAuthV2 } from '@/hooks/useAuthV2';
import { TeamService } from '@/lib/services/tournamentService';
// Reuse coach's Command Center components
import { CommandCenterHeader } from '@/app/dashboard/coach/game/[gameId]/components/CommandCenterHeader';
import { CompactPlayByPlayFeed } from '@/app/dashboard/coach/game/[gameId]/components/CompactPlayByPlayFeed';
import { CommandCenterTabPanel } from '@/app/dashboard/coach/game/[gameId]/components/CommandCenterTabPanel';
import { GameViewerSkeleton } from '@/app/dashboard/coach/game/[gameId]/components/GameViewerSkeleton';
import { Loader2, AlertCircle, ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface StatAdminGameViewerProps {
  params: Promise<{ gameId: string }>;
}

export default function StatAdminGameViewer({ params }: StatAdminGameViewerProps) {
  const { gameId } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuthV2();
  
  // Game data
  const { game, plays, loading, error } = useGameViewerV2(gameId);
  
  // Team logos
  const [teamALogo, setTeamALogo] = useState<string | null>(null);
  const [teamBLogo, setTeamBLogo] = useState<string | null>(null);

  // Load team logos
  useEffect(() => {
    let isMounted = true;
    async function loadTeamLogos() {
      if (!game?.team_a_id && !game?.team_b_id) return;
      try {
        const [teamAInfo, teamBInfo] = await Promise.all([
          game?.team_a_id ? TeamService.getTeamInfo(game.team_a_id) : null,
          game?.team_b_id ? TeamService.getTeamInfo(game.team_b_id) : null,
        ]);
        if (!isMounted) return;
        setTeamALogo(teamAInfo?.logo ?? null);
        setTeamBLogo(teamBInfo?.logo ?? null);
      } catch (err) {
        console.error('Failed to load team logos:', err);
      }
    }
    void loadTeamLogos();
    return () => { isMounted = false; };
  }, [game?.team_a_id, game?.team_b_id]);

  // Prefetch team stats for instant tab switching
  const teamAPrefetch = useTeamStats(gameId, game?.team_a_id || '', {
    prefetch: true,
    enabled: !!game?.team_a_id
  });

  const teamBPrefetch = useTeamStats(gameId, game?.team_b_id || '', {
    prefetch: true,
    enabled: !!game?.team_b_id
  });

  // Game completion state
  const isCompleted = game?.status?.toLowerCase() === 'completed';
  const isLive = game?.status?.toLowerCase().includes('live') ||
                 game?.status?.toLowerCase().includes('progress');

  // Prefetch game awards for completed games
  const gameAwardsPrefetch = useGameAwards(gameId, {
    prefetch: true,
    enabled: isCompleted
  });

  // Prefetch analytics for completed games
  const analyticsPrefetch = useGameAnalytics(gameId, game?.team_a_id || '', {
    prefetch: true,
    enabled: isCompleted && !!game?.team_a_id
  });

  // Auth check - must be stat_admin
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-red-50/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'stat_admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-red-50/30 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-orange-200">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 mb-4">This page is only available to stat admins.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Loading state - show skeleton instead of spinner
  if (loading) {
    return <GameViewerSkeleton />;
  }

  // Error state
  if (error || !game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-red-50/30 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-red-200">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {error || 'Game Not Found'}
          </h2>
          <p className="text-gray-500 mb-4">Unable to load game data.</p>
          <button
            onClick={() => router.push('/dashboard/stat-admin')}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Get opponent name for coach games
  const teamBName = game.is_coach_game
    ? (game.opponent_name || 'Opponent')
    : (game.team_b_name || 'Team B');

  return (
    <div className="h-screen bg-gradient-to-br from-orange-50/50 via-white to-red-50/30 flex flex-col overflow-hidden">
      {/* Back Button - Fixed at top */}
      <div className="absolute top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/dashboard/stat-admin/video/${gameId}`)}
          className="gap-2 bg-white/90 backdrop-blur-sm shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Video Tracker
        </Button>
      </div>

      {/* Header */}
      <CommandCenterHeader
        game={{
          teamAName: game.team_a_name || 'Team',
          teamBName: teamBName,
          teamALogo: teamALogo || undefined,
          teamBLogo: teamBLogo || undefined,
          homeScore: game.home_score || 0,
          awayScore: game.away_score || 0,
          status: game.status || 'scheduled',
          quarter: game.quarter || 1,
          gameClockMinutes: game.game_clock_minutes ?? 0,
          gameClockSeconds: game.game_clock_seconds ?? 0,
          gamePhase: (game as any).game_phase,
        }}
        isLive={isLive ?? false}
      />

      {/* Main Content - Split Screen */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Play-by-Play */}
        <aside className="hidden lg:flex w-[35%] min-w-[280px] max-w-[400px] border-r border-orange-200 flex-col bg-white shadow-sm">
          <CompactPlayByPlayFeed
            plays={(plays || []) as any}
            teamAName={game.team_a_name || 'Team'}
            teamBName={teamBName}
            isLive={isLive ?? false}
          />
        </aside>

        {/* Right Panel - Tabbed Content */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          <CommandCenterTabPanel
            gameId={gameId}
            game={{
              teamAId: game.team_a_id,
              teamBId: game.team_b_id,
              teamAName: game.team_a_name || 'Team',
              teamBName: teamBName,
              homeScore: game.home_score || 0,
              awayScore: game.away_score || 0,
              status: game.status || 'scheduled',
              quarter: game.quarter || 1,
              gameClockMinutes: game.game_clock_minutes ?? 0,
              gameClockSeconds: game.game_clock_seconds ?? 0,
              teamAFouls: game.team_a_fouls || 0,
              teamBFouls: game.team_b_fouls || 0,
              teamATimeouts: game.team_a_timeouts_remaining || 5,
              teamBTimeouts: game.team_b_timeouts_remaining || 5,
              isCoachGame: game.is_coach_game || false,
            }}
            isCompleted={isCompleted}
            teamAPrefetch={teamAPrefetch}
            teamBPrefetch={teamBPrefetch}
            gameAwardsPrefetch={gameAwardsPrefetch}
            analyticsPrefetch={analyticsPrefetch}
          />
        </main>
      </div>

      {/* Mobile: Bottom Sheet for Play-by-Play */}
      <MobilePlayByPlaySheet
        plays={plays || []}
        teamAName={game.team_a_name || 'Team'}
        teamBName={teamBName}
        isLive={isLive ?? false}
      />
    </div>
  );
}

// Mobile bottom sheet for play-by-play on smaller screens
function MobilePlayByPlaySheet({
  plays,
  teamAName,
  teamBName,
  isLive,
}: {
  plays: any[];
  teamAName: string;
  teamBName: string;
  isLive: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 z-50 px-4 py-2 bg-white border border-orange-200 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium text-gray-700 hover:bg-orange-50 transition-colors"
      >
        <span>📋</span>
        <span>Feed ({plays.length})</span>
      </button>

      {/* Slide-up Sheet */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setIsOpen(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 h-[60vh] bg-white rounded-t-2xl overflow-hidden shadow-xl border-t border-orange-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center py-2 bg-orange-50/50">
              <div className="w-10 h-1 bg-orange-300 rounded-full" />
            </div>
            
            <CompactPlayByPlayFeed
              plays={plays as any}
              teamAName={teamAName}
              teamBName={teamBName}
              isLive={isLive ?? false}
            />
          </div>
        </div>
      )}
    </div>
  );
}

