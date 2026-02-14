'use client';

import { Share2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import type { PublicTeamProfile } from '@/lib/services/publicTeamService';

export interface TeamProfileHeroProps {
  team: PublicTeamProfile | null;
  loading: boolean;
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

export function TeamProfileHero({ team, loading }: TeamProfileHeroProps) {
  const primaryColor = team?.primaryColor || '#FF3B30';
  const heroBg = team?.primaryColor
    ? `linear-gradient(135deg, ${team.primaryColor}18 0%, transparent 55%)`
    : 'linear-gradient(135deg, rgba(255,59,48,0.1) 0%, transparent 55%)';

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
      className="border-b border-gray-200"
      style={{ background: heroBg }}
    >
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-stretch gap-3 lg:gap-5 sm:min-h-[100px] py-3 sm:py-4">
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
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 tracking-tight leading-tight">
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
              <Button
                onClick={handleShare}
                variant="outline"
                size="sm"
                className="hidden sm:flex mt-2 w-fit h-7 px-3 border-gray-300 text-gray-600 hover:bg-gray-100 text-xs"
              >
                <Share2 className="w-3.5 h-3.5 mr-2" />
                Share
              </Button>
            </div>
          </div>

          <div className="hidden lg:flex flex-col justify-center shrink-0 gap-1.5 border-l border-gray-200 pl-5">
            <InfoRow label="DIVISION" value={team?.division} />
            <InfoRow label="TOURNAMENT" value={team?.tournamentName} />
            <InfoRow
              label="ROSTER"
              value={
                team?.players
                  ? `${team.players.length} Player${team.players.length !== 1 ? 's' : ''}`
                  : undefined
              }
            />
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
