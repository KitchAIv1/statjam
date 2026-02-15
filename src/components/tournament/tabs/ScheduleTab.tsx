"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Clock, Play, Shield, Lock, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useScheduleData } from '@/hooks/useScheduleData';
import { Game } from '@/lib/types/game';
import { PhaseBadge } from '@/components/tournament/PhaseBadge';
import { useTournamentTheme } from '@/contexts/TournamentThemeContext';
import { getTournamentThemeClass } from '@/lib/utils/tournamentThemeClasses';

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
  const { theme } = useTournamentTheme();
  // ✅ OPTIMIZED: Use custom hook with batching and caching
  const { games, loading } = useScheduleData(tournamentId);
  const [showAll, setShowAll] = useState(false);
  const [openRounds, setOpenRounds] = useState<Set<number>>(() => new Set());
  const toggleRound = (roundIndex: number) => {
    setOpenRounds((prev) => {
      const next = new Set(prev);
      if (next.has(roundIndex)) next.delete(roundIndex);
      else next.add(roundIndex);
      return next;
    });
  };

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

  // Stable key to avoid infinite loop: rounds array is recreated every render
  // (displayedGames.slice creates new refs), but round indices only change when
  // games or showAll changes.
  const roundIndicesKey = rounds.length > 0 ? rounds.map((r) => r.roundIndex).join(',') : '';
  useEffect(() => {
    if (roundIndicesKey) {
      setOpenRounds(new Set(roundIndicesKey.split(',').map(Number)));
    }
  }, [roundIndicesKey]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {loading ? (
        <div className="space-y-3 sm:space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className={`h-24 animate-pulse rounded-2xl border sm:h-28 sm:rounded-3xl ${getTournamentThemeClass('cardBorder', theme)} ${getTournamentThemeClass('cardBgSubtle', theme)}`} />
          ))}
        </div>
      ) : sortedGames.length === 0 ? (
        <Card className={`rounded-2xl border p-6 text-center text-sm sm:rounded-3xl sm:p-8 ${getTournamentThemeClass('cardBorder', theme)} ${getTournamentThemeClass('cardBgSubtle', theme)} ${getTournamentThemeClass('cardTextMuted', theme)}`}>
          No games scheduled yet. Check back soon for live matchups.
        </Card>
      ) : (
        <div className={`overflow-hidden rounded-none border ${getTournamentThemeClass('cardBorder', theme)}`}>
          {rounds.map(({ roundIndex, games: roundGames }) => {
            const isOpen = openRounds.has(roundIndex);
            return (
              <div key={`round-${roundIndex}`} className={`border-b last:border-b-0 ${getTournamentThemeClass('cardBorder', theme)}`}>
                <button
                  type="button"
                  onClick={() => toggleRound(roundIndex)}
                  aria-expanded={isOpen}
                  aria-controls={`round-${roundIndex}-content`}
                  className={`flex w-full flex-wrap items-center justify-between gap-2 px-3 py-2 text-left sm:px-4 sm:py-2.5 ${getTournamentThemeClass('scheduleRoundHeaderBg', theme)} ${getTournamentThemeClass('scheduleRoundHeaderText', theme)}`}
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-medium uppercase tracking-wide sm:text-xs">
                      Round {roundIndex}
                    </span>
                    <span>•</span>
                    <span className="text-[10px] sm:text-xs">
                      {formatRoundDate(roundGames[0]?.start_time)}
                    </span>
                  </span>
                  {isOpen ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                </button>
                {isOpen && (
                  <div id={`round-${roundIndex}-content`} className={`${getTournamentThemeClass('divide', theme)} ${getTournamentThemeClass('cardBgSubtle', theme)}`} role="region" aria-label={`Round ${roundIndex} games`}>
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
                    if (isCompleted) return { icon: CheckCircle, text: 'View Final', className: getTournamentThemeClass('scheduleBtnCompleted', theme) };
                    if (isCancelled) return { icon: Lock, text: 'Cancelled', className: getTournamentThemeClass('scheduleBtnDisabled', theme) };
                    if (isScheduled && (hasStarted || hasStatsAdminStarted)) {
                      if (hasStatsAdminStarted) return { icon: Play, text: 'Watch Live', className: 'border-[#FF3B30]/50 text-[#FF3B30] hover:border-[#FF3B30] hover:bg-[#FF3B30]/10' };
                      return { icon: Clock, text: 'Starting Soon', className: 'border-orange-500/50 text-orange-500 hover:border-orange-500 hover:bg-orange-500/10' };
                    }
                    return { icon: Lock, text: 'Not Started', className: getTournamentThemeClass('scheduleBtnDisabled', theme) };
                  };
                  const buttonContent = getButtonContent();
                  const ButtonIcon = buttonContent.icon;
                  return (
                    <div
                      key={game.id}
                      className={`flex flex-col gap-2 px-3 py-3 transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 sm:py-3 md:px-5 ${getTournamentThemeClass('rowHover', theme)}`}
                    >
                      {/* Matchup: Team A — [equal gap] — VS — [equal gap] — Team B */}
                      <div className="flex min-w-0 items-center gap-3 sm:gap-4 md:gap-5">
                        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                          <Avatar className={`h-[30px] w-[30px] shrink-0 border sm:h-10 sm:w-10 md:h-[50px] md:w-[50px] ${getTournamentThemeClass('cardBorder', theme)}`}>
                            {game.teamALogo ? (
                              <AvatarImage src={game.teamALogo} alt={`${teamAName} logo`} className="object-cover" loading="lazy" />
                            ) : null}
                            <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10">
                              <Shield className="h-[15px] w-[15px] text-[#FF3B30] sm:h-5 sm:w-5 md:h-[25px] md:w-[25px]" />
                            </AvatarFallback>
                          </Avatar>
                          {game.team_a_id ? (
                            <Link href={`/t/${tournamentId}/team/${game.team_a_id}`} className={`truncate text-xs font-semibold sm:text-sm md:text-base hover:text-[#FF3B30] transition-colors ${getTournamentThemeClass('cardText', theme)}`} onClick={(e) => e.stopPropagation()}>
                              {teamAName}
                            </Link>
                          ) : (
                            <span className={`truncate text-xs font-semibold sm:text-sm md:text-base ${getTournamentThemeClass('cardText', theme)}`}>{teamAName}</span>
                          )}
                        </div>
                        <span className={`shrink-0 text-xs sm:text-sm ${getTournamentThemeClass('cardTextDim', theme)}`} aria-hidden>vs</span>
                        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                          <Avatar className={`h-[30px] w-[30px] shrink-0 border sm:h-10 sm:w-10 md:h-[50px] md:w-[50px] ${getTournamentThemeClass('cardBorder', theme)}`}>
                            {game.teamBLogo ? (
                              <AvatarImage src={game.teamBLogo} alt={`${teamBName} logo`} className="object-cover" loading="lazy" />
                            ) : null}
                            <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10">
                              <Shield className="h-[15px] w-[15px] text-[#FF3B30] sm:h-5 sm:w-5 md:h-[25px] md:w-[25px]" />
                            </AvatarFallback>
                          </Avatar>
                          {game.team_b_id ? (
                            <Link href={`/t/${tournamentId}/team/${game.team_b_id}`} className={`truncate text-xs font-semibold sm:text-sm md:text-base hover:text-[#FF3B30] transition-colors ${getTournamentThemeClass('cardText', theme)}`} onClick={(e) => e.stopPropagation()}>
                              {teamBName}
                            </Link>
                          ) : (
                            <span className={`truncate text-xs font-semibold sm:text-sm md:text-base ${getTournamentThemeClass('cardText', theme)}`}>{teamBName}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2 md:gap-3">
                        <div className={`text-[9px] uppercase tracking-wide sm:text-[10px] md:text-xs ${getTournamentThemeClass('cardTextDim', theme)}`}>{formatGameTime(game.start_time)}</div>
                        <Badge className={`w-fit text-[9px] sm:text-[10px] md:text-xs ${badgeClassForStatus(game.status, theme)}`}>{statusLabel(game.status)}</Badge>
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
                )}
              </div>
            );
          })}

          {hasMoreGames && (
            <Button
              variant="ghost"
              onClick={() => setShowAll(!showAll)}
              className={`w-full mt-2 ${getTournamentThemeClass('btnOutlineBorder', theme)} ${getTournamentThemeClass('btnOutlineText', theme)}`}
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

function badgeClassForStatus(status: Game['status'], theme: 'light' | 'dark') {
  switch (status) {
    case 'in_progress':
    case 'live':
      return 'bg-[#FF3B30] text-white';
    case 'completed':
      return getTournamentThemeClass('badgeCompleted', theme);
    default:
      return getTournamentThemeClass('badgeScheduled', theme);
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

function formatRoundDate(date?: string) {
  if (!date) return 'TBD';
  try {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (error) {
    console.error('Failed to format round date', error);
    return 'TBD';
  }
}

function formatGameTime(date?: string) {
  if (!date) return 'TBD';
  try {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('Failed to format game time', error);
    return 'TBD';
  }
}
