"use client";

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Calendar, MapPin, CheckCircle2 } from 'lucide-react';
import { formatTournamentDateRange } from '@/lib/utils/tournamentUtils';
import { getCountry } from '@/data/countries';

interface TournamentWithStats {
  id: string;
  name: string;
  status?: string;
  start_date?: string | null;
  end_date?: string | null;
  venue?: string | null;
  country?: string | null;
  logo?: string | null;
  teamCount: number;
  gameCount: number;
  isVerified?: boolean;
}

interface UpcomingTournamentCardProps {
  tournament: TournamentWithStats;
  onClick: () => void;
}

/**
 * UpcomingTournamentCard - Card component for upcoming tournaments
 * 
 * Purpose: Display upcoming tournament in grid layout
 * Follows .cursorrules: <200 lines, single responsibility
 */
export function UpcomingTournamentCard({ tournament, onClick }: UpcomingTournamentCardProps) {
  return (
    <Card
      onClick={onClick}
      className="group cursor-pointer rounded-xl border border-white/10 bg-[#121212] p-4 transition-all hover:border-[#FF3B30]/30 hover:bg-[#121212]/80"
    >
      <div className="flex items-start gap-3 mb-3">
        <Avatar className="h-10 w-10 shrink-0 border border-white/10 bg-[#0A0A0A]">
          {tournament.logo ? (
            <AvatarImage
              src={tournament.logo}
              alt={`${tournament.name} logo`}
              className="object-contain"
            />
          ) : null}
          <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10">
            <Trophy className="h-5 w-5 text-[#FF3B30]" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-bold text-white truncate group-hover:text-[#FF3B30] transition-colors">
              {tournament.name}
            </h3>
            {tournament.isVerified && (
              <div title="Verified Tournament">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#FF3B30]" />
              </div>
            )}
          </div>
          <div className="mt-1 space-y-1 text-xs text-[#B3B3B3]">
            <div className="flex items-center gap-1.5 truncate">
              <Calendar className="h-3 w-3 shrink-0" />
              <span className="truncate">{formatTournamentDateRange(tournament.start_date, tournament.end_date)}</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              {tournament.country && getCountry(tournament.country) && (
                <>
                  <span className="text-sm shrink-0" title={getCountry(tournament.country)?.name}>
                    {getCountry(tournament.country)?.flag}
                  </span>
                  <span className="shrink-0">·</span>
                </>
              )}
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{tournament.venue || 'Venue TBA'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <div className="flex items-center gap-4 text-xs">
          <div>
            <div className="font-semibold text-white">{tournament.teamCount}</div>
            <div className="text-[#B3B3B3]">Teams</div>
          </div>
          <div>
            <div className="font-semibold text-white">{tournament.gameCount}</div>
            <div className="text-[#B3B3B3]">Games</div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 rounded-full border-white/20 bg-white/5 px-3 text-xs text-white/70 hover:border-[#FF3B30]/50 hover:text-white hover:bg-[#FF3B30]/10"
        >
          View
        </Button>
      </div>
    </Card>
  );
}

