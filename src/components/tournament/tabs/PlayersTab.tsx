"use client";

import { useEffect, useState, useMemo } from 'react';
import { TeamService } from '@/lib/services/tournamentService';
import { Team } from '@/lib/types/team';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { PlayerProfileModal } from '@/components/player/PlayerProfileModal';
import { usePlayerProfileModal } from '@/hooks/usePlayerProfileModal';

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
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const { isOpen, playerId, openModal, closeModal } = usePlayerProfileModal();

  useEffect(() => {
    let mounted = true;

    const loadTeams = async () => {
      try {
        const data = await TeamService.getTeamsByTournament(tournamentId);
        if (mounted) {
          setTeams(data);
        }
      } catch (error) {
        console.error('Failed to load teams:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadTeams();

    return () => {
      mounted = false;
    };
  }, [tournamentId]);

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
    <div className="space-y-4 sm:space-y-6">
        <Card className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80 backdrop-blur sm:rounded-3xl sm:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white sm:text-xl">Player Directory</h2>
            <p className="text-xs text-white/50 sm:text-sm">
              Player cards link into StatJam profiles with season averages, highlights, and college interest tracking.
            </p>
          </div>
          <span className="mt-2 rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-white/60 sm:mt-0 sm:px-4 sm:py-2 sm:text-xs">
            {players.length} player{players.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="mt-4 grid gap-3 sm:mt-6 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((index) => (
              <div key={index} className="h-16 animate-pulse rounded-2xl border border-white/10 bg-white/5 sm:h-20 sm:rounded-3xl" />
            ))}
          </div>
        ) : players.length === 0 ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-6 text-center text-sm text-white/60 sm:mt-6 sm:rounded-2xl sm:p-8">
            No players registered yet. Teams can add players from their roster management.
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:mt-6 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 transition hover:border-white/30 hover:bg-black/40 sm:gap-4 sm:rounded-3xl sm:px-5 sm:py-4"
                >
                  <Avatar className="h-10 w-10 border-2 border-white/10 sm:h-14 sm:w-14">
                    {player.profilePhotoUrl ? (
                      <AvatarImage
                        src={player.profilePhotoUrl}
                        alt={player.name}
                        className="object-cover"
                        loading="lazy"
                      />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10 text-white">
                      {initials || <User className="h-5 w-5 sm:h-6 sm:w-6" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-0.5 text-xs sm:space-y-1 sm:text-sm">
                    <div className="font-semibold text-white truncate">{player.name}</div>
                    <div className="text-[10px] text-white/50 truncate sm:text-xs">
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
