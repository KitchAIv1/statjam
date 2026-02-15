"use client";

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Shield, ChevronRight } from 'lucide-react';
import { useTournamentTeams } from '@/hooks/useTournamentTeams';
import { useTournamentTheme } from '@/contexts/TournamentThemeContext';
import { getTournamentThemeClass } from '@/lib/utils/tournamentThemeClasses';

interface TeamsTabProps {
  tournamentId: string;
}

export function TeamsTab({ tournamentId }: TeamsTabProps) {
  const { theme } = useTournamentTheme();
  const { teams, loading } = useTournamentTeams(tournamentId);

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      <Card className={`rounded-xl border p-3 backdrop-blur sm:rounded-2xl sm:p-4 md:rounded-3xl md:p-6 ${getTournamentThemeClass('cardBorder', theme)} ${getTournamentThemeClass('cardBgSubtle', theme)} ${getTournamentThemeClass('cardTextMuted', theme)}`}>
        <div className="flex flex-col gap-2 sm:gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className={`text-base font-semibold sm:text-lg md:text-xl ${getTournamentThemeClass('cardText', theme)}`}>Teams</h2>
            <p className={`text-[10px] sm:text-xs md:text-sm ${getTournamentThemeClass('cardTextDim', theme)}`}>Select a team to view its profile, roster, and schedule.</p>
          </div>
          <button className={`mt-2 w-full rounded-full border px-3 py-1.5 text-[9px] uppercase tracking-wide sm:mt-0 sm:w-auto sm:px-4 sm:py-2 sm:text-[10px] md:text-xs ${getTournamentThemeClass('btnOutlineBorder', theme)} ${getTournamentThemeClass('btnOutlineText', theme)}`}>
            Filter Teams (coming soon)
          </button>
        </div>
      </Card>

      {loading ? (
        <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className={`h-20 animate-pulse rounded-none sm:h-24 md:h-28 ${getTournamentThemeClass('cardBorder', theme)} ${getTournamentThemeClass('cardBgSubtle', theme)}`} />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <Card className={`rounded-xl border p-4 text-center text-[10px] sm:rounded-2xl sm:p-6 sm:text-xs md:rounded-3xl md:p-8 md:text-sm ${getTournamentThemeClass('cardBorder', theme)} ${getTournamentThemeClass('cardBgSubtle', theme)} ${getTournamentThemeClass('cardTextMuted', theme)}`}>
          Teams have not been added yet. Organizers can publish rosters from the dashboard.
        </Card>
      ) : (
        <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {teams.map((team) => {
            const logoUrl = (team as any).logo_url || (team as any).logo;

            return (
              <Link
                key={team.id}
                href={`/t/${tournamentId}/team/${team.id}`}
                className="block cursor-pointer transition hover:opacity-95"
              >
                <Card className={`flex flex-col gap-0 overflow-hidden rounded-none border shadow-md backdrop-blur ${getTournamentThemeClass('cardBorder', theme)} ${getTournamentThemeClass('cardBgSubtle', theme)} ${getTournamentThemeClass('cardTextMuted', theme)}`}>
                  {/* Main row: logo full-height left + content */}
                  <div className="flex h-16 overflow-hidden sm:h-20 md:h-24">
                    {/* Logo: full height, snapped to left edge */}
                    <div className="relative h-full w-16 shrink-0 overflow-hidden sm:w-20 md:w-24">
                      <Avatar className={`h-full w-full rounded-none border-0 ${getTournamentThemeClass('cardBorder', theme)}`}>
                        {logoUrl ? (
                          <AvatarImage
                            src={logoUrl}
                            alt={`${team.name} logo`}
                            className="object-cover object-left h-full w-full"
                            loading="lazy"
                          />
                        ) : null}
                        <AvatarFallback className="rounded-none bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10">
                          <Shield className="h-4 w-4 text-[#FF3B30] sm:h-5 sm:w-5 md:h-6 md:w-6" />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-3 md:px-5 md:py-4">
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className={`truncate text-sm font-semibold sm:text-base md:text-lg ${getTournamentThemeClass('cardText', theme)}`}>{team.name}</div>
                        <div className={`text-[9px] sm:text-[10px] md:text-xs ${getTournamentThemeClass('cardTextDim', theme)}`}>
                          {team.players && team.players.length > 0
                            ? `${team.players.length} player${team.players.length !== 1 ? 's' : ''}`
                            : 'Division details coming soon'}
                        </div>
                        <div className={`text-[9px] sm:text-[10px] md:text-xs ${getTournamentThemeClass('cardTextDim', theme)}`}>
                          View team profile →
                        </div>
                      </div>
                      <ChevronRight className={`h-4 w-4 shrink-0 sm:h-5 sm:w-5 ${getTournamentThemeClass('cardTextDim', theme)}`} aria-hidden />
                    </div>
                  </div>
                  {team.players && team.players.length > 0 && (
                    <div className={`rounded-none border-t px-2.5 py-1.5 text-[9px] sm:px-3 sm:py-2 sm:text-[10px] md:px-4 md:py-3 md:text-xs ${getTournamentThemeClass('cardBorder', theme)} ${getTournamentThemeClass('cardBg', theme)} ${getTournamentThemeClass('cardTextMuted', theme)}`}>
                      Captains, coaches, and roster stats surface here once connected to player profiles.
                    </div>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
