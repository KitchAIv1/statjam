'use client';

import { Share2, Shield, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import type { PublicTeamProfile } from '@/lib/services/publicTeamService';

export interface TeamProfileHeroProps {
  team: PublicTeamProfile | null;
  loading: boolean;
  upcomingCount?: number;
  /** Pre-normalized display color (e.g. dark fallback when primary is white). Falls back to team.primaryColor when absent. */
  displayPrimaryColor?: string;
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0">
      <span className="text-[9px] font-medium uppercase tracking-wider text-gray-400">
        {label}
      </span>
      <span className="text-sm font-bold text-gray-900">{value}</span>
    </div>
  );
}

export function TeamProfileHero({
  team,
  loading,
  upcomingCount,
  displayPrimaryColor,
}: TeamProfileHeroProps) {
  const primaryColor = displayPrimaryColor ?? team?.primaryColor ?? '#FF3B30';
  const heroBg =
    displayPrimaryColor ?? team?.primaryColor
      ? `linear-gradient(135deg, ${primaryColor}40 0%, ${primaryColor}18 45%, transparent 75%)`
      : 'linear-gradient(135deg, rgba(255,59,48,0.18) 0%, transparent 75%)';

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${team?.name ?? 'Team'} - StatJam`,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <section
      className="overflow-hidden"
      style={{ background: heroBg }}
    >
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-stretch gap-3 lg:gap-5 sm:min-h-[88px] py-2 sm:py-3">
          <div className="flex items-center sm:items-stretch gap-3 lg:gap-5 flex-1">
            {loading ? (
              <div className="h-14 w-14 animate-pulse rounded-full bg-gray-200 shrink-0 sm:h-16 sm:w-16" />
            ) : (
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 sm:h-16 sm:w-16"
                style={{ borderColor: primaryColor }}
              >
                {team?.logoUrl ? (
                  <ImageWithFallback
                    src={team.logoUrl}
                    alt={team.name}
                    className="h-full w-full object-cover"
                    fallback={
                      <div
                        className="flex h-full w-full items-center justify-center text-lg font-bold text-white"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {team?.name?.substring(0, 2).toUpperCase() || '?'}
                      </div>
                    }
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center text-lg font-bold text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {team?.name?.substring(0, 2).toUpperCase() || '?'}
                  </div>
                )}
              </div>
            )}
            <div className="flex-1 min-w-0 flex flex-col justify-center py-1 sm:py-2">
              {loading ? (
                <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
              ) : (
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900 tracking-tight leading-tight">
                  {team?.name}
                </h1>
              )}
              <div className="flex items-center gap-2 mt-1.5">
                <Shield className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-sm sm:text-base text-gray-600">
                  {[team?.division, team?.tournamentName || 'StatJam']
                    .filter(Boolean)
                    .join(' • ')}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Button
                  onClick={handleShare}
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex h-7 px-3 border-gray-300 text-gray-600 hover:bg-gray-100 text-xs"
                >
                  <Share2 className="w-3.5 h-3.5 mr-2" />
                  Share
                </Button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="sm:hidden p-2 -m-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  aria-label="Share"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-4 shrink-0">
            <div className="flex flex-col justify-center gap-1.5 border-l border-gray-200 pl-5">
              <InfoRow label="DIVISION" value={team?.division} />
              <InfoRow label="TOURNAMENT" value={team?.tournamentName} />
            </div>
            {(team?.players || upcomingCount !== undefined) && (
              <div
                className="rounded-lg overflow-hidden shrink-0 shadow-md min-w-[140px]"
                style={{ borderLeft: `4px solid ${primaryColor}` }}
              >
                <div className="bg-white/90 backdrop-blur-sm px-4 py-2.5">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Users className="h-4 w-4 shrink-0" style={{ color: primaryColor }} />
                    <span className="font-semibold text-gray-900">
                      {team?.players?.length ?? 0} Player{(team?.players?.length ?? 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {upcomingCount !== undefined && (
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                      <Calendar className="h-3.5 w-3.5 shrink-0" style={{ color: primaryColor }} />
                      <span>{upcomingCount} Upcoming</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex lg:hidden flex-wrap gap-x-5 gap-y-1.5 text-xs w-full border-t border-gray-200 pt-2">
            {team?.division && (
              <div>
                <span className="text-gray-400 uppercase tracking-wider">Division</span>
                <span className="ml-1.5 font-medium text-gray-900">{team.division}</span>
              </div>
            )}
            {team?.tournamentName && (
              <div>
                <span className="text-gray-400 uppercase tracking-wider">Tournament</span>
                <span className="ml-1.5 font-medium text-gray-900">{team.tournamentName}</span>
              </div>
            )}
            {team?.players?.length !== undefined && (
              <div>
                <span className="text-gray-400 uppercase tracking-wider">Roster</span>
                <span className="ml-1.5 font-medium text-gray-900">
                  {team.players.length} Player{team.players.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
