// ============================================================================
// SEASON DETAIL PAGE (<200 lines)
// Purpose: ESPN-like season view with standings, player stats, game results
// Follows .cursorrules: Single responsibility, <200 lines
// ============================================================================

'use client';

import React, { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthV2 } from '@/hooks/useAuthV2';
import { useSeasonDetails } from '@/hooks/useSeasonDetails';
import { useSeasonPlayerStats } from '@/hooks/useSeasonPlayerStats';
import { useStandings } from '@/hooks/useStandings';
import { SeasonHeader, TeamStandingsTable, PlayerStatsTable, GameResultsList } from '@/components/standings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Loader2, AlertCircle, BarChart3, Users, Calendar } from 'lucide-react';

interface SeasonDetailPageProps {
  params: Promise<{ seasonId: string }>;
}

export default function SeasonDetailPage({ params }: SeasonDetailPageProps) {
  const { seasonId } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuthV2();

  // Data hooks
  const { season, games, loading, error } = useSeasonDetails(seasonId);
  const { players, loading: playersLoading } = useSeasonPlayerStats(seasonId);
  
  // Calculate standings from games
  const standings = useStandings({
    games: games.map(g => ({
      home_score: g.home_score,
      away_score: g.away_score,
      status: g.status,
    })),
  });

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [authLoading, user, router]);

  const handleGameClick = (gameId: string) => {
    router.push(`/dashboard/coach/game/${gameId}`);
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-red-50/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  // Error state
  if (error || !season) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-red-50/30 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-600">{error || 'Season not found'}</p>
          <Button variant="outline" onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-red-50/30">
      {/* Back button */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        {/* Header */}
        <SeasonHeader
          name={season.name}
          logo={season.logo}
          leagueName={season.league_name}
          seasonType={season.season_type}
          seasonYear={season.season_year}
          conference={season.conference}
          homeVenue={season.home_venue}
          status={season.status}
          primaryColor={season.primary_color}
          wins={standings.wins}
          losses={standings.losses}
        />

        {/* Stats Overview */}
        <TeamStandingsTable
          teamName={season.name}
          teamLogo={season.logo}
          standings={standings}
          primaryColor={season.primary_color}
        />

        {/* Tabs */}
        <Tabs defaultValue="games" className="w-full">
          <TabsList className="w-full justify-start bg-white border border-gray-200 rounded-lg p-1">
            <TabsTrigger value="games" className="gap-2">
              <Calendar className="w-4 h-4" />
              Games
            </TabsTrigger>
            <TabsTrigger value="players" className="gap-2">
              <Users className="w-4 h-4" />
              Player Stats
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="games" className="mt-4">
            <GameResultsList
              games={games}
              onGameClick={handleGameClick}
            />
          </TabsContent>

          <TabsContent value="players" className="mt-4">
            {playersLoading ? (
              <div className="py-8 text-center">
                <Loader2 className="w-6 h-6 text-orange-500 animate-spin mx-auto" />
              </div>
            ) : players.length > 0 ? (
              <PlayerStatsTable players={players} />
            ) : (
              <div className="py-8 text-center text-gray-500">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p>No player stats available</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats" className="mt-4">
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Advanced analytics coming soon</p>
              <p className="text-xs text-gray-400 mt-1">
                Track trends, compare performance, and get AI insights
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

