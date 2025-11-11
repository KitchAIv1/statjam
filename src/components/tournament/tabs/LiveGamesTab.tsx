"use client";

import { useEffect, useState } from 'react';
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

  const filtered = games.filter((game) => game.tournament_id === tournamentId);

  useEffect(() => {
    let mounted = true;

    const loadLogos = async () => {
      if (filtered.length === 0) {
        setGamesWithLogos([]);
        return;
      }

      const gamesWithLogosData = await Promise.all(
        filtered.map(async (game) => {
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
        setGamesWithLogos(gamesWithLogosData);
      }
    };

    loadLogos();

    return () => {
      mounted = false;
    };
  }, [filtered]);

  if (loading) {
    return (
      <div className="space-y-3 sm:space-y-4">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-20 animate-pulse rounded-2xl border border-white/10 bg-white/5 sm:h-24 sm:rounded-3xl" />
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <Card className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/60 sm:rounded-3xl sm:p-8">
        No live games right now. Check the schedule tab for upcoming games.
      </Card>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {gamesWithLogos.map((game) => (
        <div key={game.id} className="space-y-2">
          {(game.teamALogo || game.teamBLogo) && (
            <div className="flex items-center justify-center gap-2 px-2 sm:gap-3">
              <Avatar className="h-8 w-8 shrink-0 border border-white/10 sm:h-10 sm:w-10">
                {game.teamALogo ? (
                  <AvatarImage
                    src={game.teamALogo}
                    alt={`${game.team_a_name || 'Team A'} logo`}
                    className="object-cover"
                    loading="lazy"
                  />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10">
                  <Shield className="h-4 w-4 text-[#FF3B30] sm:h-5 sm:w-5" />
                </AvatarFallback>
              </Avatar>
              <span className="text-[10px] text-white/40 sm:text-xs">vs</span>
              <Avatar className="h-8 w-8 shrink-0 border border-white/10 sm:h-10 sm:w-10">
                {game.teamBLogo ? (
                  <AvatarImage
                    src={game.teamBLogo}
                    alt={`${game.team_b_name || 'Team B'} logo`}
                    className="object-cover"
                    loading="lazy"
                  />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10">
                  <Shield className="h-4 w-4 text-[#FF3B30] sm:h-5 sm:w-5" />
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
            onClick={() => window.open(`/game-viewer/${game.id}`, '_blank')}
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
