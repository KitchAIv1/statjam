"use client";

import { useMemo } from 'react';
import { Team } from '@/lib/types/team';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { PlayerProfileModal } from '@/components/player/PlayerProfileModal';
import { usePlayerProfileModal } from '@/hooks/usePlayerProfileModal';
import { useTournamentTeams } from '@/hooks/useTournamentTeams';

interface PlayersTabProps {
  tournamentId: string;
}

interface PlayerWithTeam {
  id: string;
  name: string;
  profilePhotoUrl?: string;
  teamName: string;
  teamId: string;
  position?: string;
  jerseyNumber?: number;
}

export function PlayersTab({ tournamentId }: PlayersTabProps) {
  // ✅ OPTIMIZED: Use custom hook with cache-first loading (prevents flash)
  const { teams, loading } = useTournamentTeams(tournamentId);
  const { isOpen, playerId, openModal, closeModal } = usePlayerProfileModal();

  const players = useMemo(() => {
    const allPlayers: PlayerWithTeam[] = [];
    teams.forEach((team) => {
      if (team.players && team.players.length > 0) {
        team.players.forEach((player) => {
          allPlayers.push({
            id: player.id,
            name: player.name,
            profilePhotoUrl: player.profilePhotoUrl,
            teamName: team.name,
            teamId: team.id,
            position: player.position,
            jerseyNumber: player.jerseyNumber,
          });
        });
      }
    });
    return allPlayers.sort((a, b) => a.name.localeCompare(b.name));
  }, [teams]);

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
        <Card className="rounded-xl border border-white/10 bg-white/5 p-3 text-white/80 backdrop-blur sm:rounded-2xl sm:p-4 md:rounded-3xl md:p-6">
        <div className="flex flex-col gap-2 sm:gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-white sm:text-lg md:text-xl">Player Directory</h2>
            <p className="text-[10px] text-white/50 sm:text-xs md:text-sm">
              Player cards link into StatJam profiles with season averages, highlights, and college interest tracking.
            </p>
          </div>
          <span className="mt-2 rounded-full border border-white/10 px-2.5 py-1 text-[9px] text-white/60 sm:mt-0 sm:px-3 sm:py-1.5 sm:text-[10px] md:px-4 md:py-2 md:text-xs">
            {players.length} player{players.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="mt-3 grid gap-2 sm:mt-4 sm:gap-3 md:mt-6 md:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((index) => (
              <div key={index} className="h-14 animate-pulse rounded-xl border border-white/10 bg-white/5 sm:h-16 sm:rounded-2xl md:h-20 md:rounded-3xl" />
            ))}
          </div>
        ) : players.length === 0 ? (
          <div className="mt-3 rounded-lg border border-white/10 bg-black/30 p-4 text-center text-[10px] text-white/60 sm:mt-4 sm:rounded-xl sm:p-6 sm:text-xs md:mt-6 md:rounded-2xl md:p-8 md:text-sm">
            No players registered yet. Teams can add players from their roster management.
          </div>
        ) : (
          <div className="mt-3 grid gap-2 sm:mt-4 sm:gap-3 md:mt-6 md:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {players.map((player) => {
              const initials = player.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

              return (
                <div
                  key={`${player.teamId}-${player.id}`}
                  onClick={() => openModal(player.id)}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 transition hover:border-white/30 hover:bg-black/40 sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3 md:gap-4 md:rounded-3xl md:px-5 md:py-4"
                >
                  <Avatar className="h-8 w-8 border-2 border-white/10 sm:h-10 sm:w-10 md:h-14 md:w-14">
                    {player.profilePhotoUrl ? (
                      <AvatarImage
                        src={player.profilePhotoUrl}
                        alt={player.name}
                        className="object-cover"
                        loading="lazy"
                      />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10 text-white">
                      {initials || <User className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-0.5 text-[10px] sm:space-y-1 sm:text-xs md:text-sm">
                    <div className="font-semibold text-white truncate">{player.name}</div>
                    <div className="text-[9px] text-white/50 truncate sm:text-[10px] md:text-xs">
                      {player.teamName}
                      {player.position && ` • ${player.position}`}
                      {player.jerseyNumber && ` #${player.jerseyNumber}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Player Profile Modal */}
      {playerId && (
        <PlayerProfileModal isOpen={isOpen} onClose={closeModal} playerId={playerId} />
      )}
    </div>
  );
}
