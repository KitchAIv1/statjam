/**
 * TournamentCarouselCard - Individual tournament card for carousel
 * 
 * Purpose: Display tournament info with logo, stats, and CTA
 * Follows .cursorrules: <200 lines, UI component only
 */

'use client';

import { useRouter } from 'next/navigation';
import { Trophy, Users, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { TournamentCarouselData } from '@/lib/services/tournamentCarouselService';
import { getCountry } from '@/data/countries';

interface TournamentCarouselCardProps {
  tournament: TournamentCarouselData;
  isActive: boolean;
  onClick: () => void;
}

export function TournamentCarouselCard({ 
  tournament, 
  isActive, 
  onClick 
}: TournamentCarouselCardProps) {
  const router = useRouter();

  const handleClick = () => {
    onClick();
    router.push(`/tournament/${tournament.id}`);
  };

  return (
    <div
      className={`
        relative h-full w-full rounded-xl overflow-hidden
        bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900
        border-2 transition-all duration-300 cursor-pointer
        ${isActive 
          ? 'border-orange-500 shadow-xl shadow-orange-500/20' 
          : 'border-neutral-700 opacity-60'
        }
      `}
      onClick={handleClick}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,140,0,0.1),transparent_70%)]" />
      </div>

      {/* Content - Compact Layout */}
      <div className="relative h-full flex flex-col p-3 lg:p-4 overflow-hidden">
        {/* Header: Logo + Title Row */}
        <div className="flex items-start gap-4 mb-3 flex-shrink-0">
          {/* Logo - Extra Large */}
          <div className="flex-shrink-0">
            {tournament.logo ? (
              <div className="relative w-28 h-28 lg:w-32 lg:h-32 rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm border-2 border-white/20">
                <ImageWithFallback
                  src={tournament.logo}
                  alt={tournament.name}
                  className="w-full h-full object-contain p-3"
                />
              </div>
            ) : (
              <div className="w-28 h-28 lg:w-32 lg:h-32 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 flex items-center justify-center border-2 border-orange-500/30">
                <Trophy className="w-14 h-14 lg:w-16 lg:h-16 text-orange-400" />
              </div>
            )}
          </div>

          {/* Title + Feature Badge */}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl lg:text-2xl font-bold text-white mb-2.5 line-clamp-2 leading-tight">
              {tournament.name}
            </h3>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-500/20 text-orange-300 text-sm lg:text-base rounded-full border border-orange-500/30">
              <Trophy className="w-4 h-4" />
              <span className="truncate">{tournament.featureHighlight}</span>
            </span>
          </div>
        </div>

        {/* Stats - Horizontal Compact Layout */}
        <div className="flex flex-col gap-1.5 flex-1 min-h-0 overflow-hidden">
          {/* Top Section: Stats */}
          <div className="flex flex-col gap-1 flex-shrink-0">
            {/* First Row: Teams & Games */}
            <div className="flex items-center gap-5 text-neutral-300">
              <div className="flex items-center gap-2.5 min-w-0">
                <Users className="w-5 h-5 text-orange-400 flex-shrink-0" />
                <span className="text-base lg:text-lg whitespace-nowrap">
                  <span className="font-semibold text-white">{tournament.teamCount}</span> Teams
                </span>
              </div>
              <div className="flex items-center gap-2.5 min-w-0">
                <Calendar className="w-5 h-5 text-orange-400 flex-shrink-0" />
                <span className="text-base lg:text-lg whitespace-nowrap">
                  <span className="font-semibold text-white">{tournament.gameCount}</span> Games
                </span>
              </div>
            </div>

            {/* Live Games Badge */}
            {tournament.liveGameCount > 0 && (
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
                <span className="text-sm lg:text-base text-red-400 font-semibold">
                  {tournament.liveGameCount} Live Now
                </span>
              </div>
            )}

            {/* Venue */}
            {tournament.venue && (
              <div className="flex items-center gap-2 text-neutral-400 min-w-0">
                <MapPin className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm lg:text-base truncate">{tournament.venue}</span>
              </div>
            )}

            {/* Country & Organizer */}
            <div className="flex items-center gap-3 flex-wrap">
              {tournament.country && (
                <div className="flex items-center gap-1.5 text-neutral-300">
                  {tournament.countryFlag && (
                    <span className="text-base lg:text-lg" title={getCountry(tournament.country)?.name || tournament.country}>
                      {tournament.countryFlag}
                    </span>
                  )}
                  <span className="text-sm lg:text-base">
                    {getCountry(tournament.country)?.name || tournament.country}
                  </span>
                </div>
              )}
              {tournament.organizerName && (
                <div className="flex items-center gap-1.5 text-neutral-300">
                  <span className="text-sm lg:text-base">by {tournament.organizerName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Middle Section: Team Logos - 2 Rows Arrangement */}
          {tournament.teamLogos && tournament.teamLogos.length > 0 && (
            <div className="flex flex-col gap-1.5 justify-center flex-shrink-0 my-2">
              {/* First Row */}
              <div className="flex items-center justify-end gap-2 flex-wrap">
                {tournament.teamLogos.slice(0, 3).map((logoUrl, idx) => (
                  <div
                    key={idx}
                    className="relative w-12 h-12 lg:w-14 lg:h-14 rounded-lg overflow-hidden bg-white/10 backdrop-blur-sm border-2 border-white/20 flex-shrink-0 shadow-md hover:scale-110 transition-transform duration-200"
                  >
                    <ImageWithFallback
                      src={logoUrl}
                      alt={`Team ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              {/* Second Row */}
              <div className="flex items-center justify-end gap-2 flex-wrap">
                {tournament.teamLogos.slice(3, 6).map((logoUrl, idx) => (
                  <div
                    key={idx + 3}
                    className="relative w-12 h-12 lg:w-14 lg:h-14 rounded-lg overflow-hidden bg-white/10 backdrop-blur-sm border-2 border-white/20 flex-shrink-0 shadow-md hover:scale-110 transition-transform duration-200"
                  >
                    <ImageWithFallback
                      src={logoUrl}
                      alt={`Team ${idx + 4}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                {tournament.teamCount > tournament.teamLogos.length && (
                  <div 
                    className="relative w-12 h-12 lg:w-14 lg:h-14 rounded-lg bg-neutral-700/50 border-2 border-neutral-600 flex items-center justify-center flex-shrink-0 text-xs lg:text-sm text-neutral-400 font-semibold"
                  >
                    +{tournament.teamCount - tournament.teamLogos.length}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* CTA Button - Compact */}
        <button
          className={`
            w-full flex items-center justify-center gap-2.5
            px-5 py-3 rounded-lg font-semibold text-base lg:text-lg
            transition-all duration-200 flex-shrink-0
            ${isActive
              ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/30'
              : 'bg-neutral-700/50 text-neutral-400'
            }
          `}
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
        >
          View Tournament
          <ArrowRight className={`w-5 h-5 transition-transform ${isActive ? 'translate-x-0.5' : ''}`} />
        </button>
      </div>
    </div>
  );
}

