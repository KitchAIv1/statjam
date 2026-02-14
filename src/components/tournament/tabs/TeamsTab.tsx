"use client";

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Shield } from 'lucide-react';
import { useTournamentTeams } from '@/hooks/useTournamentTeams';

interface TeamsTabProps {
  tournamentId: string;
}

export function TeamsTab({ tournamentId }: TeamsTabProps) {
  // ✅ OPTIMIZED: Use custom hook with cache-first loading (prevents flash)
  const { teams, loading } = useTournamentTeams(tournamentId);

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      <Card className="rounded-xl border border-white/10 bg-white/5 p-3 text-white/70 backdrop-blur sm:rounded-2xl sm:p-4 md:rounded-3xl md:p-6">
        <div className="flex flex-col gap-2 sm:gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-white sm:text-lg md:text-xl">Teams</h2>
            <p className="text-[10px] text-white/50 sm:text-xs md:text-sm">Profiles sync with roster builder and stat tracking.</p>
          </div>
          <button className="mt-2 w-full rounded-full border border-white/10 px-3 py-1.5 text-[9px] uppercase tracking-wide text-white/60 hover:border-white/30 hover:text-white sm:mt-0 sm:w-auto sm:px-4 sm:py-2 sm:text-[10px] md:text-xs">
            Filter Teams (coming soon)
          </button>
        </div>
      </Card>

      {loading ? (
        <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="h-32 animate-pulse rounded-xl border border-white/10 bg-white/5 sm:h-40 sm:rounded-2xl md:h-48 md:rounded-3xl" />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <Card className="rounded-xl border border-white/10 bg-white/5 p-4 text-center text-[10px] text-white/60 sm:rounded-2xl sm:p-6 sm:text-xs md:rounded-3xl md:p-8 md:text-sm">
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
                className="block transition hover:opacity-95"
              >
              <Card className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-white/80 backdrop-blur sm:gap-3 sm:rounded-2xl sm:p-4 md:gap-4 md:rounded-3xl md:p-6">
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                  <Avatar className="h-10 w-10 shrink-0 border border-white/10 sm:h-12 sm:w-12 md:h-14 md:w-14">
                    {logoUrl ? (
                      <AvatarImage
                        src={logoUrl}
                        alt={`${team.name} logo`}
                        className="object-cover"
                        loading="lazy"
                      />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10">
                      <Shield className="h-4 w-4 text-[#FF3B30] sm:h-5 sm:w-5 md:h-6 md:w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-white truncate sm:text-base md:text-lg">{team.name}</div>
                    <div className="text-[9px] text-white/50 sm:text-[10px] md:text-xs">
                      {team.players && team.players.length > 0
                        ? `${team.players.length} player${team.players.length !== 1 ? 's' : ''}`
                        : 'Division details coming soon'}
                    </div>
                  </div>
                </div>
                {team.players && team.players.length > 0 && (
                  <div className="rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-[9px] text-white/60 sm:rounded-xl sm:px-3 sm:py-2 sm:text-[10px] md:rounded-2xl md:px-4 md:py-3 md:text-xs">
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
