"use client";

import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Shield } from 'lucide-react';
import { useTournamentStandings } from '@/hooks/useTournamentStandings';

interface StandingsTabProps {
  tournamentId: string;
}

export function StandingsTab({ tournamentId }: StandingsTabProps) {
  // ✅ OPTIMIZED: Use custom hook with caching
  const { standings, loading } = useTournamentStandings(tournamentId);

  const formatPointDifferential = (diff: number): string => {
    return diff >= 0 ? `+${diff}` : `${diff}`;
  };

  return (
    <div className="space-y-4 text-white sm:space-y-6">
      <Card className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur sm:rounded-3xl sm:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white sm:text-xl">Standings</h2>
            <p className="text-xs text-white/50 sm:text-sm">Live W-L and point differentials update automatically.</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-white/40 sm:text-xs">
            <span>Division filters coming soon</span>
          </div>
        </div>

        {loading ? (
          <div className="mt-4 space-y-2.5 sm:mt-6 sm:space-y-3">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-14 animate-pulse rounded-xl border border-white/10 bg-white/5 sm:h-16 sm:rounded-2xl" />
            ))}
          </div>
        ) : standings.length === 0 ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-6 text-center text-sm text-white/60 sm:mt-6 sm:rounded-2xl sm:p-8">
            No completed games yet. Standings will appear as games finish.
          </div>
        ) : (
          <div className="mt-4 -mx-3 overflow-x-auto sm:mx-0 sm:mt-6 sm:rounded-xl md:rounded-2xl">
            <div className="min-w-[600px] rounded-xl border border-white/10 sm:min-w-0 sm:rounded-2xl">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8 text-[10px] text-white/50 sm:w-10 sm:text-xs md:w-12">#</TableHead>
                    <TableHead className="min-w-[120px] text-[10px] text-white/50 sm:min-w-[140px] sm:text-xs md:min-w-0">Team</TableHead>
                    <TableHead className="text-center text-[10px] text-white/50 sm:text-xs">W</TableHead>
                    <TableHead className="text-center text-[10px] text-white/50 sm:text-xs">L</TableHead>
                    <TableHead className="text-center text-[10px] text-white/50 sm:text-xs">PF</TableHead>
                    <TableHead className="text-center text-[10px] text-white/50 sm:text-xs">PA</TableHead>
                    <TableHead className="text-center text-[10px] text-white/50 sm:text-xs">Diff</TableHead>
                    <TableHead className="text-center text-[10px] text-white/50 sm:text-xs">Streak</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {standings.map((team) => {
                    return (
                      <TableRow key={team.teamId} className="border-white/5">
                        <TableCell className="font-semibold text-xs text-white/70 sm:text-sm md:text-base">{team.rank}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                            <Avatar className="h-8 w-8 shrink-0 border border-white/10 sm:h-10 sm:w-10 md:h-12 md:w-12">
                              {team.teamLogo ? (
                                <AvatarImage
                                  src={team.teamLogo}
                                  alt={`${team.teamName} logo`}
                                  className="object-cover"
                                  loading="lazy"
                                />
                              ) : null}
                              <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10">
                                <Shield className="h-4 w-4 text-[#FF3B30] sm:h-5 sm:w-5 md:h-6 md:w-6" />
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate text-xs font-medium text-white sm:text-sm md:text-base">{team.teamName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-xs text-white/80 sm:text-sm md:text-base">{team.wins}</TableCell>
                        <TableCell className="text-center text-xs text-white/80 sm:text-sm md:text-base">{team.losses}</TableCell>
                        <TableCell className="text-center text-[10px] text-white/70 sm:text-xs md:text-sm">{team.pointsFor}</TableCell>
                        <TableCell className="text-center text-[10px] text-white/70 sm:text-xs md:text-sm">{team.pointsAgainst}</TableCell>
                        <TableCell className="text-center text-[10px] font-semibold text-white/80 sm:text-xs md:text-sm">
                          {formatPointDifferential(team.pointDifferential)}
                        </TableCell>
                        <TableCell className="text-center text-[10px] text-white/70 sm:text-xs md:text-sm">{team.streak}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
