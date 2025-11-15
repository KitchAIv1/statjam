"use client";

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, MapPin, Users, Play } from 'lucide-react';

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
}

interface LiveTournamentCardProps {
  tournament: TournamentWithStats;
  liveGameCount: number;
  onClick: () => void;
}

/**
 * LiveTournamentCard - Card component for live tournaments
 * 
 * Purpose: Display live tournament in horizontal scroll section
 * Follows .cursorrules: <200 lines, single responsibility
 */
export function LiveTournamentCard({ tournament, liveGameCount, onClick }: LiveTournamentCardProps) {
  return (
    <Card
      onClick={onClick}
      className="group cursor-pointer min-w-[280px] sm:min-w-0 rounded-2xl border border-white/10 bg-[#121212] p-5 transition-all hover:border-[#FF3B30]/50 hover:bg-[#121212]/80"
    >
      <div className="flex items-start gap-3 mb-4">
        <Avatar className="h-12 w-12 shrink-0 border border-white/10 bg-[#0A0A0A]">
          {tournament.logo ? (
            <AvatarImage
              src={tournament.logo}
              alt={`${tournament.name} logo`}
              className="object-contain"
            />
          ) : null}
          <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10">
            <Trophy className="h-6 w-6 text-[#FF3B30]" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white mb-1 truncate group-hover:text-[#FF3B30] transition-colors">
            {tournament.name}
          </h3>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1 rounded-full bg-[#FF3B30] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              Live
            </span>
            {liveGameCount > 0 && (
              <span className="text-xs text-[#B3B3B3]">{liveGameCount} game{liveGameCount !== 1 ? 's' : ''} live</span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2 text-sm text-[#B3B3B3] mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>{tournament.teamCount} teams</span>
        </div>
        <div className="flex items-center gap-2">
          <Play className="h-4 w-4" />
          <span>{tournament.gameCount} games</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span className="truncate">{tournament.venue || 'Venue TBA'}</span>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full rounded-full border-white/20 bg-white/5 text-white/70 hover:border-[#FF3B30]/50 hover:text-white hover:bg-[#FF3B30]/10"
      >
        Watch Live
      </Button>
    </Card>
  );
}

