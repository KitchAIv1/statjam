'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Eye, Filter, Trophy } from "lucide-react";
import { GameService } from '@/lib/services/gameService';
import { TournamentService } from '@/lib/services/tournamentService';
import { Game } from '@/lib/types/game';
import { Tournament } from '@/lib/types/tournament';

interface GameWithTournament extends Game {
  tournament_name?: string;
}

export function OrganizerGameScheduler() {
  const router = useRouter();
  const [games, setGames] = useState<GameWithTournament[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'live' | 'completed'>('all');

  useEffect(() => {
    loadGamesAndTournaments();
  }, []);

  const loadGamesAndTournaments = async () => {
    try {
      setLoading(true);
      // Get all tournaments for the organizer
      const tournamentsData = await TournamentService.getAllTournaments();
      setTournaments(tournamentsData);

      // Get all games from all tournaments
      const allGames: GameWithTournament[] = [];
      for (const tournament of tournamentsData) {
        const tournamentGames = await GameService.getGamesByTournament(tournament.id);
        // Add tournament name to each game
        const gamesWithTournament = tournamentGames.map(game => ({
          ...game,
          tournament_name: tournament.name
        }));
        allGames.push(...gamesWithTournament);
      }

      // Sort by start time (most recent first)
      allGames.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
      setGames(allGames);
    } catch (error) {
      console.error('Failed to load games:', error);
    } finally {
      setLoading(false);
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
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading games...</p>
            </CardContent>
          </Card>
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
