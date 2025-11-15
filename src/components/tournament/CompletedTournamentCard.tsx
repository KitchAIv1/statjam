"use client";

import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, ExternalLink } from 'lucide-react';
import { formatTournamentDateRange } from '@/lib/utils/tournamentUtils';

interface TournamentWithStats {
  id: string;
  name: string;
  start_date?: string | null;
  end_date?: string | null;
  venue?: string | null;
  logo?: string | null;
  teamCount: number;
  gameCount: number;
}

interface CompletedTournamentCardProps {
  tournament: TournamentWithStats;
  onClick: () => void;
}

/**
 * CompletedTournamentCard - Card component for completed tournaments
 * 
 * Purpose: Display completed tournament in list layout
 * Follows .cursorrules: <200 lines, single responsibility
 */
export function CompletedTournamentCard({ tournament, onClick }: CompletedTournamentCardProps) {
  return (
    <Card
      onClick={onClick}
      className="group cursor-pointer rounded-xl border border-white/10 bg-[#121212] p-4 transition-all hover:border-white/20 hover:bg-[#121212]/80"
    >
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12 shrink-0 border border-white/10 bg-[#0A0A0A]">
          {tournament.logo ? (
            <AvatarImage
              src={tournament.logo}
              alt={`${tournament.name} logo`}
              className="object-contain"
            />
          ) : null}
          <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10">
            <Trophy className="h-6 w-6 text-[#B3B3B3]" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white mb-1 truncate group-hover:text-[#FF3B30] transition-colors">
            {tournament.name}
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-sm text-[#B3B3B3]">
            <span>{tournament.venue || 'Venue TBA'}</span>
            <span>·</span>
            <span>{formatTournamentDateRange(tournament.start_date, tournament.end_date)}</span>
            <span>·</span>
            <span>{tournament.teamCount} teams</span>
            <span>·</span>
            <span>{tournament.gameCount} games</span>
          </div>
        </div>
        <ExternalLink className="h-5 w-5 text-[#B3B3B3] group-hover:text-[#FF3B30] transition-colors shrink-0" />
      </div>
    </Card>
  );
}

