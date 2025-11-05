'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Eye, Filter, Trophy } from "lucide-react";
import { GameService } from '@/lib/services/gameService';
import { useTournaments } from '@/lib/hooks/useTournaments';
import { Game } from '@/lib/types/game';

interface GameWithTournament extends Game {
  tournament_name?: string;
}

interface OrganizerGameSchedulerProps {
  user: { id: string } | null;
}

export function OrganizerGameScheduler({ user }: OrganizerGameSchedulerProps) {
  const router = useRouter();
  const { tournaments, loading: tournamentsLoading } = useTournaments(user);
  const [games, setGames] = useState<GameWithTournament[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'live' | 'completed'>('all');

  useEffect(() => {
    if (tournaments.length > 0) {
      loadGames();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournaments.length]); // Only re-run when tournament count changes, not array reference

  const loadGames = async () => {
    try {
      setLoadingGames(true);
      
      // ⚡ PERFORMANCE: Start timing
      const perfStart = performance.now();
      console.log(`⚡ Loading games for ${tournaments.length} tournaments in parallel...`);
      
      // ⚡ OPTIMIZED: Fetch all tournament games in parallel using Promise.all
      const tournamentGamesPromises = tournaments.map(tournament => 
        GameService.getGamesByTournament(tournament.id)
          .then(games => games.map(game => ({
            ...game,
            tournament_name: tournament.name
          })))
          .catch(error => {
            console.error(`Failed to load games for tournament ${tournament.name}:`, error);
            return []; // Return empty array on error, don't block other tournaments
          })
      );

      const tournamentGamesArrays = await Promise.all(tournamentGamesPromises);
      
      // Flatten all games into single array
      const allGames: GameWithTournament[] = tournamentGamesArrays.flat();

      // Sort by start time (most recent first)
      allGames.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
      
      const totalTime = performance.now() - perfStart;
      console.log(`⚡ Loaded ${allGames.length} games in ${totalTime.toFixed(0)}ms (avg ${(totalTime / tournaments.length).toFixed(0)}ms per tournament)`);
      
      setGames(allGames);
    } catch (error) {
      console.error('Failed to load games:', error);
    } finally {
      setLoadingGames(false);
    }
  };

  const filteredGames = games.filter(game => {
    if (filterStatus === 'all') return true;
    return game.status === filterStatus;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { label: 'Scheduled', class: 'bg-blue-100 text-blue-800 border-blue-200' },
      live: { label: 'Live', class: 'bg-green-100 text-green-800 border-green-200' },
      in_progress: { label: 'Live', class: 'bg-green-100 text-green-800 border-green-200' },
      completed: { label: 'Completed', class: 'bg-gray-100 text-gray-800 border-gray-200' },
      cancelled: { label: 'Cancelled', class: 'bg-red-100 text-red-800 border-red-200' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    return <Badge className={config.class}>{config.label}</Badge>;
  };

  const loading = tournamentsLoading || loadingGames;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
          All Games
        </h2>
        <p className="text-muted-foreground">View all games across your tournaments</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="w-5 h-5 text-muted-foreground" />
        <div className="flex gap-2">
          {(['all', 'scheduled', 'live', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-orange-600 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Games List */}
      <div className="space-y-4">
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Tournament badge skeleton */}
                      <div className="h-4 bg-muted rounded w-40"></div>
                      {/* Teams skeleton */}
                      <div className="flex items-center gap-3">
                        <div className="h-6 bg-muted rounded w-32"></div>
                        <div className="h-4 bg-muted rounded w-8"></div>
                        <div className="h-6 bg-muted rounded w-32"></div>
                        <div className="h-6 bg-muted rounded w-20"></div>
                      </div>
                      {/* Details skeleton */}
                      <div className="flex gap-4">
                        <div className="h-4 bg-muted rounded w-32"></div>
                        <div className="h-4 bg-muted rounded w-24"></div>
                        <div className="h-4 bg-muted rounded w-28"></div>
                      </div>
                    </div>
                    {/* Actions skeleton */}
                    <div className="flex gap-2">
                      <div className="h-9 bg-muted rounded w-20"></div>
                      <div className="h-9 bg-muted rounded w-9"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : filteredGames.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="font-semibold text-foreground mb-2">No Games Found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {filterStatus === 'all' 
                  ? 'Schedule games from your tournament pages to see them here.' 
                  : `No ${filterStatus} games at this time.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredGames.map((game) => (
            <Card key={game.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  {/* Game Info */}
                  <div className="flex-1 space-y-3">
                    {/* Tournament Badge */}
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-600">{game.tournament_name}</span>
                    </div>

                    {/* Teams */}
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold">{game.team_a_name || 'Team A'}</span>
                      <span className="text-muted-foreground">vs</span>
                      <span className="text-lg font-semibold">{game.team_b_name || 'Team B'}</span>
                      {getStatusBadge(game.status)}
                    </div>

                    {/* Details */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDate(game.start_time)}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {game.venue || 'Venue TBD'}
                      </div>
                    </div>
                  </div>

                  {/* View Button */}
                  <button
                    onClick={() => router.push(`/game-viewer/${game.id}`)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
