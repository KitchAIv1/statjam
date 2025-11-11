"use client";

import { useEffect, useState } from 'react';
import { GameService } from '@/lib/services/gameService';
import { TeamService } from '@/lib/services/tournamentService';
import { Game } from '@/lib/types/game';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { CalendarDays, Clock, MapPin, Play, Shield } from 'lucide-react';

interface ScheduleTabProps {
  tournamentId: string;
}

interface GameWithLogos extends Game {
  teamALogo?: string;
  teamBLogo?: string;
}

export function ScheduleTab({ tournamentId }: ScheduleTabProps) {
  const [games, setGames] = useState<GameWithLogos[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadGames = async () => {
      try {
        const data = await GameService.getGamesByTournament(tournamentId);
        if (!mounted) return;

        // Load team logos for each game
        const gamesWithLogos = await Promise.all(
          data.map(async (game) => {
            const [teamAInfo, teamBInfo] = await Promise.all([
              game.team_a_id ? TeamService.getTeamInfo(game.team_a_id) : Promise.resolve(null),
              game.team_b_id ? TeamService.getTeamInfo(game.team_b_id) : Promise.resolve(null),
            ]);

            return {
              ...game,
              teamALogo: teamAInfo?.logo,
              teamBLogo: teamBInfo?.logo,
            };
          })
        );

        if (mounted) {
          setGames(gamesWithLogos);
        }
      } catch (error) {
        console.error('Failed to load schedule:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadGames();
    return () => {
      mounted = false;
    };
  }, [tournamentId]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur sm:rounded-3xl sm:p-6">
        <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wide text-white/50 sm:gap-4 sm:text-xs">
          <span className="flex items-center gap-1.5 sm:gap-2"><CalendarDays className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Filter by Date</span><span className="sm:hidden">Date</span> <span className="hidden sm:inline">(coming soon)</span></span>
          <span className="flex items-center gap-1.5 sm:gap-2"><MapPin className="h-3 w-3 sm:h-4 sm:w-4" /> Court</span>
          <span className="flex items-center gap-1.5 sm:gap-2"><Clock className="h-3 w-3 sm:h-4 sm:w-4" /> Status</span>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:gap-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/5 sm:h-28 sm:rounded-3xl" />
          ))}
        </div>
      ) : games.length === 0 ? (
        <Card className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/60 sm:rounded-3xl sm:p-8">
          No games scheduled yet. Check back soon for live matchups.
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {games.map((game) => {
            const teamAName = game.team_a_name || 'Team A';
            const teamBName = game.team_b_name || 'Team B';

            return (
              <Card key={game.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/80 backdrop-blur sm:rounded-3xl sm:p-5 sm:text-sm">
                <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Avatar className="h-8 w-8 shrink-0 border border-white/10 sm:h-10 sm:w-10">
                        {game.teamALogo ? (
                          <AvatarImage
                            src={game.teamALogo}
                            alt={`${teamAName} logo`}
                            className="object-cover"
                            loading="lazy"
                          />
                        ) : null}
                        <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10">
                          <Shield className="h-4 w-4 text-[#FF3B30] sm:h-5 sm:w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-semibold text-white sm:text-base">{teamAName}</span>
                    </div>
                    <span className="text-white/40">vs</span>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Avatar className="h-8 w-8 shrink-0 border border-white/10 sm:h-10 sm:w-10">
                        {game.teamBLogo ? (
                          <AvatarImage
                            src={game.teamBLogo}
                            alt={`${teamBName} logo`}
                            className="object-cover"
                            loading="lazy"
                          />
                        ) : null}
                        <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10">
                          <Shield className="h-4 w-4 text-[#FF3B30] sm:h-5 sm:w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-semibold text-white sm:text-base">{teamBName}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <div className="text-[10px] uppercase tracking-wide text-white/40 sm:text-xs">{formatDate(game.start_time)}</div>
                    <Badge className={`text-[10px] sm:text-xs ${badgeClassForStatus(game.status)}`}>{statusLabel(game.status)}</Badge>
                    <button
                      onClick={() => window.open(`/game-viewer/${game.id}`, '_blank')}
                      className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-[10px] font-semibold text-white/70 transition hover:border-white/40 hover:text-white sm:gap-2 sm:px-4 sm:py-2 sm:text-xs"
                    >
                      <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                      View Game
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function badgeClassForStatus(status: Game['status']) {
  switch (status) {
    case 'in_progress':
    case 'live':
      return 'bg-[#FF3B30] text-white';
    case 'completed':
      return 'bg-white/10 text-white/60';
    default:
      return 'bg-[#1f2937] text-white/60';
  }
}

function statusLabel(status: Game['status']) {
  switch (status) {
    case 'in_progress':
      return 'Live';
    case 'completed':
      return 'Final';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Scheduled';
  }
}

function formatDate(date?: string) {
  if (!date) return 'TBD';
  try {
    return new Date(date).toLocaleString();
  } catch (error) {
    console.error('Failed to format game date', error);
    return 'TBD';
  }
}
