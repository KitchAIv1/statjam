"use client";

import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { PlayerProfileModal } from '@/components/player/PlayerProfileModal';
import { usePlayerProfileModal } from '@/hooks/usePlayerProfileModal';
import { useTournamentTeams } from '@/hooks/useTournamentTeams';
import { prefetchPlayerProfile } from '@/lib/services/prefetchService';
import { useTournamentTheme } from '@/contexts/TournamentThemeContext';
import { getTournamentThemeClass } from '@/lib/utils/tournamentThemeClasses';

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
  is_custom_player?: boolean; // ✅ FIX: Include custom player flag
}

export function PlayersTab({ tournamentId }: PlayersTabProps) {
  const { theme } = useTournamentTheme();
  const { teams, loading } = useTournamentTeams(tournamentId);
  const { isOpen, playerId, isCustomPlayer, openModal, closeModal } = usePlayerProfileModal();

  const players = useMemo(() => {
    const allPlayers: PlayerWithTeam[] = [];
    teams.forEach((team) => {
      if (team.players && team.players.length > 0) {
        team.players.forEach((player: { id: string; name: string; profilePhotoUrl?: string; position?: string; jerseyNumber?: number; is_custom_player?: boolean }) => {
          allPlayers.push({
            id: player.id,
            name: player.name,
            profilePhotoUrl: player.profilePhotoUrl,
            teamName: team.name,
            teamId: team.id,
            position: player.position,
            jerseyNumber: player.jerseyNumber,
            is_custom_player: player.is_custom_player || false, // ✅ FIX: Preserve custom player flag
          });
        });
      }
    });
    return allPlayers.sort((a, b) => a.name.localeCompare(b.name));
  }, [teams]);

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
        <Card className={`rounded-xl border p-3 backdrop-blur sm:rounded-2xl sm:p-4 md:rounded-3xl md:p-6 ${getTournamentThemeClass('cardBorder', theme)} ${getTournamentThemeClass('cardBgSubtle', theme)} ${getTournamentThemeClass('cardTextMuted', theme)}`}>
        <div className="flex flex-col gap-2 sm:gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className={`text-base font-semibold sm:text-lg md:text-xl ${getTournamentThemeClass('cardText', theme)}`}>Player Directory</h2>
            <p className={`text-[10px] sm:text-xs md:text-sm ${getTournamentThemeClass('cardTextDim', theme)}`}>
              Player cards link into StatJam profiles with season averages, highlights, and college interest tracking.
            </p>
          </div>
          <span className={`mt-2 rounded-full border px-2.5 py-1 text-[9px] sm:mt-0 sm:px-3 sm:py-1.5 sm:text-[10px] md:px-4 md:py-2 md:text-xs ${getTournamentThemeClass('cardBorder', theme)} ${getTournamentThemeClass('cardTextDim', theme)}`}>
            {players.length} player{players.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="mt-3 grid gap-2 sm:mt-4 sm:gap-3 md:mt-6 md:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((index) => (
              <div key={index} className={`h-14 animate-pulse rounded-none sm:h-16 md:h-20 ${getTournamentThemeClass('cardBorder', theme)} ${getTournamentThemeClass('cardBgSubtle', theme)}`} />
            ))}
          </div>
        ) : players.length === 0 ? (
          <div className={`mt-3 rounded-lg border p-4 text-center text-[10px] sm:mt-4 sm:rounded-xl sm:p-6 sm:text-xs md:mt-6 md:rounded-2xl md:p-8 md:text-sm ${getTournamentThemeClass('cardBorder', theme)} ${getTournamentThemeClass('cardBg', theme)} ${getTournamentThemeClass('cardTextMuted', theme)}`}>
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
                  onClick={() => openModal(player.id, { isCustomPlayer: player.is_custom_player || false })}
                  onMouseEnter={() => !player.is_custom_player && prefetchPlayerProfile(player.id)}
                  className={`flex h-14 cursor-pointer overflow-hidden rounded-none border transition sm:h-16 md:h-20 ${getTournamentThemeClass('cardBorder', theme)} ${getTournamentThemeClass('cardBg', theme)} ${getTournamentThemeClass('rowHover', theme)}`}
                >
                  {/* Photo: full height, snapped to left edge */}
                  <div className={`relative h-full w-14 shrink-0 overflow-hidden sm:w-16 md:w-20`}>
                    <Avatar className={`h-full w-full rounded-none border-0 ${getTournamentThemeClass('cardBorder', theme)}`}>
                      {player.profilePhotoUrl ? (
                        <AvatarImage
                          src={player.profilePhotoUrl}
                          alt={player.name}
                          className="object-cover object-left h-full w-full"
                          loading="lazy"
                        />
                      ) : null}
                      <AvatarFallback className="rounded-none bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10 text-white">
                        {initials || <User className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5 px-3 py-2 text-[10px] sm:space-y-1 sm:px-4 sm:py-3 sm:text-xs md:px-5 md:py-4 md:text-sm">
                    <div className={`font-semibold truncate ${getTournamentThemeClass('cardText', theme)}`}>{player.name}</div>
                    <div className={`text-[9px] truncate sm:text-[10px] md:text-xs ${getTournamentThemeClass('cardTextDim', theme)}`}>
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
        <PlayerProfileModal isOpen={isOpen} onClose={closeModal} playerId={playerId || ''} isCustomPlayer={isCustomPlayer || false} />
      )}
    </div>
  );
}
