// ============================================================================
// SEASON DETAIL PAGE (<200 lines)
// Purpose: ESPN-like season view with standings, player stats, game results
// Follows .cursorrules: Single responsibility, <200 lines, smooth transitions
// ============================================================================

'use client';

import React, { use, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthV2 } from '@/hooks/useAuthV2';
import { useSeasonDetails } from '@/hooks/useSeasonDetails';
import { useSeasonPlayerStats } from '@/hooks/useSeasonPlayerStats';
import { useStandings } from '@/hooks/useStandings';
import { 
  SeasonHeader, TeamStandingsTable, PlayerStatsTable, 
  GameResultsList, SeasonSkeleton, PageTransition 
} from '@/components/standings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, AlertCircle, BarChart3, Users, Calendar } from 'lucide-react';

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
  
  // Memoized standings calculation
  const standingsInput = useMemo(() => ({
    games: games.map(g => ({
      home_score: g.home_score,
      away_score: g.away_score,
      status: g.status,
    })),
  }), [games]);
  
  const standings = useStandings(standingsInput);

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [authLoading, user, router]);

  // Memoized click handler
  const handleGameClick = useCallback((gameId: string) => {
    router.push(`/dashboard/coach/game/${gameId}`);
  }, [router]);

  const handleBack = useCallback(() => router.back(), [router]);

  // Loading state with skeleton
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-red-50/30">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100">
          <div className="container mx-auto px-4 py-3">
            <div className="w-20 h-8 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <SeasonSkeleton />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !season) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-red-50/30 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-600">{error || 'Season not found'}</p>
          <Button variant="outline" onClick={handleBack} className="mt-4">
            Go Back
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-red-50/30">
      {/* Sticky back button */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-3">
          <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        {/* Header with animation */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
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
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <TeamStandingsTable
            teamName={season.name}
            teamLogo={season.logo}
            standings={standings}
            primaryColor={season.primary_color}
          />
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <Tabs defaultValue="games" className="w-full">
            <TabsList className="w-full justify-start bg-white border border-gray-200 rounded-lg p-1">
              <TabsTrigger value="games" className="gap-2 transition-all">
                <Calendar className="w-4 h-4" />
                Games ({games.length})
              </TabsTrigger>
              <TabsTrigger value="players" className="gap-2 transition-all">
                <Users className="w-4 h-4" />
                Players ({players.length})
              </TabsTrigger>
              <TabsTrigger value="stats" className="gap-2 transition-all">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="games" className="mt-4 focus:outline-none">
              <GameResultsList games={games} onGameClick={handleGameClick} />
            </TabsContent>

            <TabsContent value="players" className="mt-4 focus:outline-none">
              {playersLoading ? (
                <div className="rounded-xl border border-gray-200 p-8 bg-white">
                  <div className="space-y-3 animate-pulse">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200" />
                        <div className="flex-1 h-4 bg-gray-100 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : players.length > 0 ? (
                <PlayerStatsTable players={players} />
              ) : (
                <div className="py-8 text-center text-gray-500 rounded-xl border border-gray-200 bg-white">
                  <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p>No player stats available</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="stats" className="mt-4 focus:outline-none">
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Advanced analytics coming soon</p>
                <p className="text-xs text-gray-400 mt-1">
                  Track trends, compare performance, and get AI insights
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </PageTransition>
  );
}

