"use client";

import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Shield } from 'lucide-react';
import { useTournamentStandings } from '@/hooks/useTournamentStandings';
import { useTournamentTheme } from '@/contexts/TournamentThemeContext';
import { getTournamentThemeClass } from '@/lib/utils/tournamentThemeClasses';

interface StandingsTabProps {
  tournamentId: string;
}

export function StandingsTab({ tournamentId }: StandingsTabProps) {
  const { theme } = useTournamentTheme();
  const { standings, loading } = useTournamentStandings(tournamentId);

  const formatPointDifferential = (diff: number): string => {
    return diff >= 0 ? `+${diff}` : `${diff}`;
  };

  const thClass = `text-[10px] sm:text-xs ${getTournamentThemeClass('cardTextDim', theme)}`;
  const tdClass = `text-xs sm:text-sm md:text-base ${getTournamentThemeClass('cardText', theme)}`;
  const tdMutedClass = `text-[10px] sm:text-xs md:text-sm ${getTournamentThemeClass('cardTextMuted', theme)}`;

  return (
    <div className={`space-y-4 sm:space-y-6 ${getTournamentThemeClass('cardText', theme)}`}>
      <Card className={`rounded-2xl border p-4 backdrop-blur sm:rounded-3xl sm:p-6 ${getTournamentThemeClass('cardBorder', theme)} ${getTournamentThemeClass('cardBgSubtle', theme)}`}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className={`text-lg font-semibold sm:text-xl ${getTournamentThemeClass('cardText', theme)}`}>Standings</h2>
            <p className={`text-xs sm:text-sm ${getTournamentThemeClass('cardTextDim', theme)}`}>Live W-L and point differentials update automatically.</p>
          </div>
          <div className={`flex items-center gap-2 text-[10px] sm:text-xs ${getTournamentThemeClass('cardTextDim', theme)}`}>
            <span>Division filters coming soon</span>
          </div>
        </div>

        {loading ? (
          <div className="mt-4 space-y-2.5 sm:mt-6 sm:space-y-3">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className={`h-14 animate-pulse rounded-xl border sm:h-16 sm:rounded-2xl ${getTournamentThemeClass('cardBorder', theme)} ${getTournamentThemeClass('cardBgSubtle', theme)}`} />
            ))}
          </div>
        ) : standings.length === 0 ? (
          <div className={`mt-4 rounded-xl border p-6 text-center text-sm sm:mt-6 sm:rounded-2xl sm:p-8 ${getTournamentThemeClass('cardBorder', theme)} ${getTournamentThemeClass('cardBg', theme)} ${getTournamentThemeClass('cardTextMuted', theme)}`}>
            No completed games yet. Standings will appear as games finish.
          </div>
        ) : (
          <div className="mt-4 -mx-3 overflow-x-auto sm:mx-0 sm:mt-6 sm:rounded-xl md:rounded-2xl">
            <div className={`min-w-[600px] rounded-xl border sm:min-w-0 sm:rounded-2xl ${getTournamentThemeClass('cardBorder', theme)}`}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className={`w-8 sm:w-10 md:w-12 ${thClass}`}>#</TableHead>
                    <TableHead className={`min-w-[120px] sm:min-w-[140px] md:min-w-0 ${thClass}`}>Team</TableHead>
                    <TableHead className={`text-center ${thClass}`}>W</TableHead>
                    <TableHead className={`text-center ${thClass}`}>L</TableHead>
                    <TableHead className={`text-center ${thClass}`}>PF</TableHead>
                    <TableHead className={`text-center ${thClass}`}>PA</TableHead>
                    <TableHead className={`text-center ${thClass}`}>Diff</TableHead>
                    <TableHead className={`text-center ${thClass}`}>Streak</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {standings.map((team) => (
                    <TableRow key={team.teamId} className={getTournamentThemeClass('borderLight', theme)}>
                      <TableCell className={`font-semibold ${tdClass}`}>{team.rank}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                          <Avatar className={`h-8 w-8 shrink-0 border sm:h-10 sm:w-10 md:h-12 md:w-12 ${getTournamentThemeClass('cardBorder', theme)}`}>
                            {team.teamLogo ? (
                              <AvatarImage src={team.teamLogo} alt={`${team.teamName} logo`} className="object-cover" loading="lazy" />
                            ) : null}
                            <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10">
                              <Shield className="h-4 w-4 text-[#FF3B30] sm:h-5 sm:w-5 md:h-6 md:w-6" />
                            </AvatarFallback>
                          </Avatar>
                          <span className={`truncate font-medium ${tdClass}`}>{team.teamName}</span>
                        </div>
                      </TableCell>
                      <TableCell className={`text-center ${tdClass}`}>{team.wins}</TableCell>
                      <TableCell className={`text-center ${tdClass}`}>{team.losses}</TableCell>
                      <TableCell className={`text-center ${tdMutedClass}`}>{team.pointsFor}</TableCell>
                      <TableCell className={`text-center ${tdMutedClass}`}>{team.pointsAgainst}</TableCell>
                      <TableCell className={`text-center font-semibold ${tdClass}`}>{formatPointDifferential(team.pointDifferential)}</TableCell>
                      <TableCell className={`text-center ${tdMutedClass}`}>{team.streak}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
