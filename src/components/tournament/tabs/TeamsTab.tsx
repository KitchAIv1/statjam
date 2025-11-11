"use client";

import { useEffect, useState } from 'react';
import { TeamService } from '@/lib/services/tournamentService';
import { Team } from '@/lib/types/team';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Shield } from 'lucide-react';

interface TeamsTabProps {
  tournamentId: string;
}

export function TeamsTab({ tournamentId }: TeamsTabProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/70 backdrop-blur sm:rounded-3xl sm:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white sm:text-xl">Teams</h2>
            <p className="text-xs text-white/50 sm:text-sm">Profiles sync with roster builder and stat tracking.</p>
          </div>
          <button className="mt-2 w-full rounded-full border border-white/10 px-4 py-2 text-[10px] uppercase tracking-wide text-white/60 hover:border-white/30 hover:text-white sm:mt-0 sm:w-auto sm:text-xs">
            Filter Teams (coming soon)
          </button>
        </div>
      </Card>

      {loading ? (
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="h-40 animate-pulse rounded-2xl border border-white/10 bg-white/5 sm:h-48 sm:rounded-3xl" />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <Card className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/60 sm:rounded-3xl sm:p-8">
          Teams have not been added yet. Organizers can publish rosters from the dashboard.
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {teams.map((team) => {
            const logoUrl = (team as any).logo_url || (team as any).logo;

            return (
              <Card key={team.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80 backdrop-blur sm:gap-4 sm:rounded-3xl sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <Avatar className="h-12 w-12 shrink-0 border border-white/10 sm:h-14 sm:w-14">
                    {logoUrl ? (
                      <AvatarImage
                        src={logoUrl}
                        alt={`${team.name} logo`}
                        className="object-cover"
                        loading="lazy"
                      />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10">
                      <Shield className="h-5 w-5 text-[#FF3B30] sm:h-6 sm:w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-base font-semibold text-white truncate sm:text-lg">{team.name}</div>
                    <div className="text-[10px] text-white/50 sm:text-xs">
                      {team.players && team.players.length > 0
                        ? `${team.players.length} player${team.players.length !== 1 ? 's' : ''}`
                        : 'Division details coming soon'}
                    </div>
                  </div>
                </div>
                {team.players && team.players.length > 0 && (
                  <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[10px] text-white/60 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-xs">
                    Captains, coaches, and roster stats surface here once connected to player profiles.
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
