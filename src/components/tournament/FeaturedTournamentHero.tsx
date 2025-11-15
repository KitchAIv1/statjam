"use client";

import { Button } from '@/components/ui/Button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Calendar, MapPin, ArrowRight, User } from 'lucide-react';
import { formatTournamentDateRange, getPlayerInitials } from '@/lib/utils/tournamentUtils';
import { getCountry } from '@/data/countries';
import { ShareButtons } from '@/components/shared/ShareButtons';
import { useOrganizerProfile } from '@/hooks/useOrganizerProfile';
import { FeaturedTournamentQuickStats } from './FeaturedTournamentQuickStats';

interface TournamentWithStats {
  id: string;
  name: string;
  status?: string;
  start_date?: string | null;
  end_date?: string | null;
  venue?: string | null;
  country?: string | null;
  logo?: string | null;
  organizer_id?: string | null;
  description?: string | null;
  teamCount: number;
  gameCount: number;
  topPlayers?: Array<{ id: string; name: string; photoUrl?: string; pointsPerGame: number }>;
}

interface FeaturedTournamentHeroProps {
  tournament: TournamentWithStats;
  liveGameCount: number;
  onClick: () => void;
  onLiveGamesClick?: () => void;
  shareUrl?: string;
}

/**
 * FeaturedTournamentHero - Hero section for featured tournament
 * 
 * Purpose: Large display of featured tournament with stats and top players
 * Follows .cursorrules: <200 lines, single responsibility
 */
export function FeaturedTournamentHero({ tournament, liveGameCount, onClick, onLiveGamesClick, shareUrl }: FeaturedTournamentHeroProps) {
  const isLive = tournament.status === 'active' || tournament.status === 'live';
  const { organizer } = useOrganizerProfile(tournament.organizer_id || null);
  
  const descriptionPreview = tournament.description 
    ? tournament.description.length > 120 
      ? `${tournament.description.substring(0, 120)}...` 
      : tournament.description
    : null;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#121212] to-black max-w-4xl mx-auto">
      <div className="relative p-6 sm:p-8 lg:p-10 max-h-[500px] lg:max-h-[450px] overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 h-full">
          {/* Left: Tournament Info */}
          <div className="flex-1 space-y-3 lg:space-y-4 min-w-0 overflow-hidden">
            <div className="flex items-start gap-3 sm:gap-4">
              <Avatar className="h-14 w-14 shrink-0 border border-white/10 bg-[#121212] sm:h-16 sm:w-16 lg:h-18 lg:w-18">
                {tournament.logo ? (
                  <AvatarImage
                    src={tournament.logo}
                    alt={`${tournament.name} logo`}
                    className="object-contain"
                  />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10">
                  <Trophy className="h-7 w-7 text-[#FF3B30] sm:h-8 sm:w-8" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                  <h2 className="text-xl font-bold text-white sm:text-2xl lg:text-3xl truncate">
                    {tournament.name}
                  </h2>
                  {isLive && (
                    <span className="flex items-center gap-1.5 rounded-full bg-[#FF3B30] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shrink-0 sm:px-3 sm:text-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                      Live Now
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#B3B3B3] sm:text-sm sm:gap-3">
                  {tournament.country && getCountry(tournament.country) && (
                    <>
                      <span className="text-base sm:text-lg shrink-0" title={getCountry(tournament.country)?.name}>
                        {getCountry(tournament.country)?.flag}
                      </span>
                      <span className="shrink-0">·</span>
                    </>
                  )}
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate">{tournament.venue || 'Venue TBA'}</span>
                  </div>
                  <span>·</span>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatTournamentDateRange(tournament.start_date, tournament.end_date)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Organizer Info */}
            {organizer && (
              <div className="flex items-center gap-2 text-xs text-[#B3B3B3] sm:text-sm pt-2 border-t border-white/10">
                <User className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Organized by {organizer.name}</span>
              </div>
            )}

            {/* Description Preview */}
            {descriptionPreview && (
              <div className="text-xs text-[#B3B3B3] sm:text-sm pt-2 border-t border-white/10 line-clamp-2">
                {descriptionPreview}
              </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-3 border-t border-white/10">
              <div>
                <div className="text-xl font-bold text-white sm:text-2xl lg:text-3xl">{tournament.teamCount}</div>
                <div className="text-[10px] text-[#B3B3B3] uppercase tracking-wide mt-0.5 sm:text-xs sm:mt-1">Teams</div>
              </div>
              <div>
                <div className="text-xl font-bold text-white sm:text-2xl lg:text-3xl">{tournament.gameCount}</div>
                <div className="text-[10px] text-[#B3B3B3] uppercase tracking-wide mt-0.5 sm:text-xs sm:mt-1">Games</div>
              </div>
              <div>
                <div className="text-xl font-bold text-white sm:text-2xl lg:text-3xl">
                  {tournament.topPlayers?.length || 0}
                </div>
                <div className="text-[10px] text-[#B3B3B3] uppercase tracking-wide mt-0.5 sm:text-xs sm:mt-1">Top Players</div>
              </div>
            </div>

            {/* Top Players - Compact */}
            {tournament.topPlayers && tournament.topPlayers.length > 0 && (
              <div className="pt-3 border-t border-white/10">
                <div className="text-[10px] uppercase tracking-wide text-[#B3B3B3] mb-2 sm:text-xs sm:mb-3">Top Scorers</div>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {tournament.topPlayers.map((player) => (
                    <div key={player.id} className="flex items-center gap-1.5 sm:gap-2">
                      <Avatar className="h-8 w-8 border-2 border-white/10 sm:h-10 sm:w-10">
                        {player.photoUrl ? (
                          <AvatarImage src={player.photoUrl} alt={player.name} />
                        ) : null}
                        <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10 text-white text-[10px] sm:text-xs">
                          {getPlayerInitials(player.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-xs font-semibold text-white sm:text-sm">{player.name}</div>
                        <div className="text-[10px] text-[#FF3B30] sm:text-xs">{player.pointsPerGame.toFixed(1)} PPG</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-3 sm:mt-4">
              <Button
                onClick={onClick}
                className="rounded-full bg-[#FF3B30] px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-[#FF3B30]/30 transition hover:brightness-110 sm:px-6 sm:py-2 sm:text-sm"
              >
                View Tournament
                <ArrowRight className="ml-1.5 h-3.5 w-3.5 sm:ml-2 sm:h-4 sm:w-4" />
              </Button>
              <ShareButtons
                title={tournament.name}
                url={shareUrl || (typeof window !== 'undefined' ? `${window.location.origin}/tournament/${tournament.id}` : '')}
                description={`${tournament.teamCount} teams • ${tournament.gameCount} games`}
                variant="compact"
              />
            </div>
          </div>

          {/* Right: Quick Stats - Fixed Width */}
          <FeaturedTournamentQuickStats
            teamCount={tournament.teamCount}
            gameCount={tournament.gameCount}
            liveGameCount={liveGameCount}
            isLive={isLive}
            onLiveGamesClick={onLiveGamesClick || onClick}
          />
        </div>
      </div>
    </section>
  );
}

