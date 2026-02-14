"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { CalendarDays, Clock, MapPin, Play, Shield, Lock, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useScheduleData } from '@/hooks/useScheduleData';
import { Game } from '@/lib/types/game';
import { PhaseBadge } from '@/components/tournament/PhaseBadge';

// Max games to show initially (covers multiple months: Feb, Mar, Apr, May...)
const INITIAL_DISPLAY_LIMIT = 24;
// Option B: rounds derived from order (chunk by N games)
const GAMES_PER_ROUND = 6;

type ScheduleGame = ReturnType<typeof useScheduleData>['games'][number];

interface RoundGroup {
  roundIndex: number;
  games: ScheduleGame[];
}

interface ScheduleTabProps {
  tournamentId: string;
}

export function ScheduleTab({ tournamentId }: ScheduleTabProps) {
  // ✅ OPTIMIZED: Use custom hook with batching and caching
  const { games, loading } = useScheduleData(tournamentId);
  const [showAll, setShowAll] = useState(false);

  // Sort games: earliest first (chronological)
  const sortedGames = useMemo(() => {
    return [...games].sort((a, b) => {
      const dateA = a.start_time ? new Date(a.start_time).getTime() : 0;
      const dateB = b.start_time ? new Date(b.start_time).getTime() : 0;
      return dateA - dateB; // Ascending (earliest first)
    });
  }, [games]);

  // Apply display limit
  const displayedGames = showAll ? sortedGames : sortedGames.slice(0, INITIAL_DISPLAY_LIMIT);
  const hasMoreGames = sortedGames.length > INITIAL_DISPLAY_LIMIT;

  // Group displayed games into rounds (Option B: derived from order)
  const rounds = useMemo((): RoundGroup[] => {
    const result: RoundGroup[] = [];
    for (let i = 0; i < displayedGames.length; i += GAMES_PER_ROUND) {
      result.push({
        roundIndex: Math.floor(i / GAMES_PER_ROUND) + 1,
        games: displayedGames.slice(i, i + GAMES_PER_ROUND),
      });
    }
    return result;
  }, [displayedGames]);

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
        <div className="space-y-3 sm:space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/5 sm:h-28 sm:rounded-3xl" />
          ))}
        </div>
      ) : sortedGames.length === 0 ? (
        <Card className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/60 sm:rounded-3xl sm:p-8">
          No games scheduled yet. Check back soon for live matchups.
        </Card>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {rounds.map(({ roundIndex, games: roundGames }) => (
            <Card
              key={`round-${roundIndex}`}
              className="rounded-xl border border-white/10 bg-white/5 overflow-hidden backdrop-blur sm:rounded-2xl md:rounded-3xl"
            >
              <div className="border-b border-white/10 px-3 py-2 sm:px-4 sm:py-2.5">
                <span className="text-[10px] font-medium uppercase tracking-wide text-white/50 sm:text-xs">
                  Round {roundIndex}
                </span>
              </div>
              <div className="divide-y divide-white/10">
                {roundGames.map((game) => {
                  const teamAName = game.teamAName || 'Team A';
                  const teamBName = game.teamBName || 'Team B';
                  const isLive = game.status === 'in_progress' || game.status === 'overtime';
                  const isCompleted = game.status === 'completed';
                  const isCancelled = game.status === 'cancelled';
                  const isScheduled = game.status === 'scheduled';
                  const gameStartTime = game.start_time ? new Date(game.start_time) : null;
                  const hasStarted = gameStartTime ? gameStartTime <= new Date() : false;
                  const hasStatsAdminStarted = (game.home_score > 0 || game.away_score > 0 || game.is_clock_running);
                  const canView = isLive || isCompleted || (isScheduled && (hasStarted || hasStatsAdminStarted));
                  const getButtonContent = () => {
                    if (isLive) return { icon: Play, text: 'Watch Live', className: 'border-[#FF3B30]/50 text-[#FF3B30] hover:border-[#FF3B30] hover:bg-[#FF3B30]/10' };
                    if (isCompleted) return { icon: CheckCircle, text: 'View Final', className: 'border-white/20 text-white/60 hover:border-white/30 hover:text-white/80' };
                    if (isCancelled) return { icon: Lock, text: 'Cancelled', className: 'border-white/10 text-white/30 cursor-not-allowed opacity-50' };
                    if (isScheduled && (hasStarted || hasStatsAdminStarted)) {
                      if (hasStatsAdminStarted) return { icon: Play, text: 'Watch Live', className: 'border-[#FF3B30]/50 text-[#FF3B30] hover:border-[#FF3B30] hover:bg-[#FF3B30]/10' };
                      return { icon: Clock, text: 'Starting Soon', className: 'border-orange-500/50 text-orange-500 hover:border-orange-500 hover:bg-orange-500/10' };
                    }
                    return { icon: Lock, text: 'Not Started', className: 'border-white/10 text-white/30 cursor-not-allowed opacity-50' };
                  };
                  const buttonContent = getButtonContent();
                  const ButtonIcon = buttonContent.icon;
                  return (
                    <div
                      key={game.id}
                      className="flex flex-col gap-2 px-3 py-3 transition-colors hover:bg-white/5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 sm:py-3 md:px-5"
                    >
                      {/* Matchup: Team A — [equal gap] — VS — [equal gap] — Team B */}
                      <div className="flex min-w-0 items-center gap-3 sm:gap-4 md:gap-5">
                        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                          <Avatar className="h-[30px] w-[30px] shrink-0 border border-white/10 sm:h-10 sm:w-10 md:h-[50px] md:w-[50px]">
                            {game.teamALogo ? (
                              <AvatarImage src={game.teamALogo} alt={`${teamAName} logo`} className="object-cover" loading="lazy" />
                            ) : null}
                            <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10">
                              <Shield className="h-[15px] w-[15px] text-[#FF3B30] sm:h-5 sm:w-5 md:h-[25px] md:w-[25px]" />
                            </AvatarFallback>
                          </Avatar>
                          {game.team_a_id ? (
                            <Link href={`/t/${tournamentId}/team/${game.team_a_id}`} className="truncate text-xs font-semibold text-white sm:text-sm md:text-base hover:text-[#FF3B30] transition-colors" onClick={(e) => e.stopPropagation()}>
                              {teamAName}
                            </Link>
                          ) : (
                            <span className="truncate text-xs font-semibold text-white sm:text-sm md:text-base">{teamAName}</span>
                          )}
                        </div>
                        <span className="shrink-0 text-white/40 text-xs sm:text-sm" aria-hidden>vs</span>
                        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                          <Avatar className="h-[30px] w-[30px] shrink-0 border border-white/10 sm:h-10 sm:w-10 md:h-[50px] md:w-[50px]">
                            {game.teamBLogo ? (
                              <AvatarImage src={game.teamBLogo} alt={`${teamBName} logo`} className="object-cover" loading="lazy" />
                            ) : null}
                            <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10">
                              <Shield className="h-[15px] w-[15px] text-[#FF3B30] sm:h-5 sm:w-5 md:h-[25px] md:w-[25px]" />
                            </AvatarFallback>
                          </Avatar>
                          {game.team_b_id ? (
                            <Link href={`/t/${tournamentId}/team/${game.team_b_id}`} className="truncate text-xs font-semibold text-white sm:text-sm md:text-base hover:text-[#FF3B30] transition-colors" onClick={(e) => e.stopPropagation()}>
                              {teamBName}
                            </Link>
                          ) : (
                            <span className="truncate text-xs font-semibold text-white sm:text-sm md:text-base">{teamBName}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2 md:gap-3">
                        <div className="text-[9px] uppercase tracking-wide text-white/40 sm:text-[10px] md:text-xs">{formatDate(game.start_time)}</div>
                        <Badge className={`w-fit text-[9px] sm:text-[10px] md:text-xs ${badgeClassForStatus(game.status)}`}>{statusLabel(game.status)}</Badge>
                        <PhaseBadge phase={game.game_phase} size="sm" />
                        <button
                          onClick={() => canView && window.open(`/game-viewer-v3/${game.id}`, '_blank')}
                          disabled={!canView}
                          className={`inline-flex w-fit items-center justify-center gap-1 rounded-full border px-2 py-1 text-[9px] font-semibold transition sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-[10px] md:gap-2 md:px-4 md:py-2 md:text-xs ${buttonContent.className} ${!canView ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                          title={!canView && isScheduled && !hasStarted ? 'Game has not started yet' : canView ? 'Click to view game' : ''}
                        >
                          <ButtonIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4" />
                          {buttonContent.text}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}

          {hasMoreGames && (
            <Button
              variant="ghost"
              onClick={() => setShowAll(!showAll)}
              className="w-full mt-2 text-white/60 hover:text-white hover:bg-white/10 border border-white/10"
            >
              {showAll ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  View All {sortedGames.length} Games
                </>
              )}
            </Button>
          )}
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
