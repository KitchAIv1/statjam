"use client";

import { useEffect, useState, useMemo } from 'react';
import { useLiveGamesHybrid } from '@/hooks/useLiveGamesHybrid';
import { TeamService } from '@/lib/services/tournamentService';
import LiveGameCard from '@/components/LiveGameCard';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Shield } from 'lucide-react';

interface LiveGamesTabProps {
  tournamentId: string;
}

interface GameWithLogos {
  id: string;
  team_a_name?: string;
  team_b_name?: string;
  team_a_id?: string;
  team_b_id?: string;
  home_score?: number;
  away_score?: number;
  quarter?: number;
  game_clock_minutes?: number;
  game_clock_seconds?: number;
  teamALogo?: string;
  teamBLogo?: string;
}

export function LiveGamesTab({ tournamentId }: LiveGamesTabProps) {
  const { games, loading } = useLiveGamesHybrid();
  const [gamesWithLogos, setGamesWithLogos] = useState<GameWithLogos[]>([]);

  // ✅ FIX: Memoize filtered array to prevent infinite loop
  const filtered = useMemo(() => {
    return games.filter((game) => game.tournament_id === tournamentId);
  }, [games, tournamentId]);

  // ✅ FIX: Create stable game IDs array for dependency tracking
  const filteredGameIds = useMemo(() => {
    return filtered.map(g => g.id).sort().join(',');
  }, [filtered]);

  // 🔍 DEBUG: Log for troubleshooting (only log when data changes)
  useEffect(() => {
    console.log('🔍 [LiveGamesTab]', {
      tournamentId,
      totalGames: games.length,
      filteredCount: filtered.length,
      filteredGameIds: filtered.map(g => g.id)
    });
  }, [tournamentId, games.length, filtered.length, filteredGameIds]);

  useEffect(() => {
    let mounted = true;

    const loadLogos = async () => {
      if (filtered.length === 0) {
        if (mounted) {
          setGamesWithLogos([]);
        }
        return;
      }

      // ✅ OPTIMIZATION: Batch fetch all team info (same optimization as ScheduleTab)
      const teamIds = new Set<string>();
      filtered.forEach(game => {
        if (game.team_a_id) teamIds.add(game.team_a_id);
        if (game.team_b_id) teamIds.add(game.team_b_id);
      });

      // Batch fetch all team info at once
      const teamInfoMap = await TeamService.getBatchTeamInfo(Array.from(teamIds));

      // Map team info to games
      const gamesWithLogosData = filtered.map(game => {
        const teamAInfo = game.team_a_id ? teamInfoMap.get(game.team_a_id) : null;
        const teamBInfo = game.team_b_id ? teamInfoMap.get(game.team_b_id) : null;

        return {
          ...game,
          teamALogo: teamAInfo?.logo,
          teamBLogo: teamBInfo?.logo,
        };
      });

      if (mounted) {
        setGamesWithLogos(gamesWithLogosData);
      }
    };

    loadLogos();

    return () => {
      mounted = false;
    };
  }, [filteredGameIds, filtered]); // ✅ OPTIMIZATION: Use stable game IDs and filtered array

  if (loading) {
    return (
      <div className="space-y-2 sm:space-y-3 md:space-y-4">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-16 animate-pulse rounded-xl border border-white/10 bg-white/5 sm:h-20 sm:rounded-2xl md:h-24 md:rounded-3xl" />
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <Card className="rounded-xl border border-white/10 bg-white/5 p-4 text-center text-[10px] text-white/60 sm:rounded-2xl sm:p-6 sm:text-xs md:rounded-3xl md:p-8 md:text-sm">
        No live games right now. Check the schedule tab for upcoming games.
      </Card>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-3 md:space-y-4">
      {gamesWithLogos.map((game) => (
        <div key={game.id} className="space-y-1.5 sm:space-y-2">
          {(game.teamALogo || game.teamBLogo) && (
            <div className="flex items-center justify-center gap-1.5 px-2 sm:gap-2 md:gap-3">
              <Avatar className="h-6 w-6 shrink-0 border border-white/10 sm:h-8 sm:w-8 md:h-10 md:w-10">
                {game.teamALogo ? (
                  <AvatarImage
                    src={game.teamALogo}
                    alt={`${game.team_a_name || 'Team A'} logo`}
                    className="object-cover"
                    loading="lazy"
                  />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10">
                  <Shield className="h-3 w-3 text-[#FF3B30] sm:h-4 sm:w-4 md:h-5 md:w-5" />
                </AvatarFallback>
              </Avatar>
              <span className="text-[9px] text-white/40 sm:text-[10px] md:text-xs">vs</span>
              <Avatar className="h-6 w-6 shrink-0 border border-white/10 sm:h-8 sm:w-8 md:h-10 md:w-10">
                {game.teamBLogo ? (
                  <AvatarImage
                    src={game.teamBLogo}
                    alt={`${game.team_b_name || 'Team B'} logo`}
                    className="object-cover"
                    loading="lazy"
                  />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10">
                  <Shield className="h-3 w-3 text-[#FF3B30] sm:h-4 sm:w-4 md:h-5 md:w-5" />
                </AvatarFallback>
              </Avatar>
            </div>
          )}
          <LiveGameCard
            gameId={game.id}
            teamLeftName={game.team_a_name || 'Team A'}
            teamRightName={game.team_b_name || 'Team B'}
            leftScore={game.home_score || 0}
            rightScore={game.away_score || 0}
            timeLabel={formatClock(game.quarter, game.game_clock_minutes, game.game_clock_seconds)}
            onClick={() => window.open(`/game-viewer-v3/${game.id}`, '_blank')}
            isLive
          />
        </div>
      ))}
    </div>
  );
}

function formatClock(quarter?: number, minutes?: number, seconds?: number) {
  const q = !quarter || quarter <= 4 ? `Q${quarter ?? 1}` : `OT${(quarter ?? 5) - 4}`;
  const mm = String(minutes ?? 0).padStart(2, '0');
  const ss = String(seconds ?? 0).padStart(2, '0');
  return `${q} ${mm}:${ss}`;
}
