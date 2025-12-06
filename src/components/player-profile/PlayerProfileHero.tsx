"use client";

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/Button';
import { Share2, User, Shield } from 'lucide-react';
import { getCountryName } from '@/data/countries';
import type { PublicPlayerIdentity } from '@/hooks/usePublicPlayerProfile';

interface PlayerProfileHeroProps {
  identity: PublicPlayerIdentity;
  careerStats: {
    ppg: number;
    rpg: number;
    apg: number;
    fgPct: number;
  };
  gamesPlayed?: number;
}

/**
 * PlayerProfileHero - ESPN-style compact hero
 * 
 * Follows .cursorrules: <200 lines, single responsibility
 */
export function PlayerProfileHero({ identity, careerStats, gamesPlayed }: PlayerProfileHeroProps) {
  const initials = identity.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'P';

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${identity.name} - StatJam Profile`,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <section className="bg-[#FAF9F6] border-b border-gray-200">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Mobile: Stack vertically | Desktop: Horizontal layout */}
        <div className="flex flex-col sm:flex-row sm:items-stretch gap-4 lg:gap-6 sm:min-h-[140px] py-4 sm:py-0">
          
          {/* Photo + Name Section with Background Graphic */}
          <div className="flex items-center sm:items-stretch gap-4 lg:gap-6 flex-1 relative overflow-hidden">
            {/* Background Graphic - Behind photo and name */}
            {/* Mobile: Full cover centered | Desktop: Right-aligned partial */}
            <div
              className="absolute inset-0 bg-no-repeat opacity-20 pointer-events-none bg-cover bg-center sm:bg-right sm:bg-[length:auto_150%]"
              style={{ 
                backgroundImage: 'url(/images/basketball-splash.webp)',
              }}
            />
            
            {/* Photo */}
            <div className="shrink-0 self-center sm:self-end relative z-10">
              {identity.posePhotoUrl ? (
                <div className="relative w-20 sm:w-32 h-24 sm:h-40 overflow-hidden rounded-t-lg sm:rounded-t-lg rounded-lg sm:rounded-none">
                  <img
                    src={identity.posePhotoUrl}
                    alt={identity.name}
                    className="absolute top-0 left-0 w-full"
                    style={{ 
                      height: '166%',
                      objectFit: 'cover',
                      objectPosition: 'top center' 
                    }}
                  />
                </div>
              ) : (
                <Avatar className="w-16 h-20 sm:w-28 sm:h-32 rounded border border-gray-200">
                  <AvatarImage src={identity.profilePhotoUrl} alt={identity.name} className="object-cover" />
                  <AvatarFallback className="bg-gray-100 text-gray-500 text-xl rounded">
                    {initials || <User className="w-6 h-6" />}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>

            {/* Name & Team - Vertically centered */}
            <div className="flex-1 min-w-0 flex flex-col justify-center py-2 sm:py-4 relative z-10">
            {/* Name */}
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900 tracking-tight leading-tight">
              {identity.name}
            </h1>
            
            {/* Team with Logo */}
            <div className="flex items-center gap-2 mt-1.5">
              {identity.teamLogo ? (
                <img src={identity.teamLogo} alt="" className="w-5 h-5 object-contain" />
              ) : identity.teamName ? (
                <Shield className="w-4 h-4 text-gray-400" />
              ) : null}
              
              <span className="text-sm sm:text-base text-gray-600">
                {[
                  identity.teamName,
                  identity.jerseyNumber ? `#${identity.jerseyNumber}` : null,
                  identity.position
                ].filter(Boolean).join(' • ')}
              </span>
            </div>

            {/* Share Button - Hidden on mobile to save space */}
            <Button
              onClick={handleShare}
              variant="outline"
              size="sm"
              className="hidden sm:flex mt-3 w-fit h-8 px-4 border-gray-300 text-gray-600 hover:bg-gray-100 text-sm"
            >
              <Share2 className="w-3.5 h-3.5 mr-2" />
              Share
            </Button>
          </div>
          </div>

          {/* Right: Structured Info - Desktop: Side panel | Mobile: Below photo/name */}
          {/* Desktop version - vertical list with border */}
          <div className="hidden lg:flex flex-col justify-center shrink-0 space-y-1.5 text-sm border-l border-gray-200 pl-5">
            <InfoRow 
              label="HT/WT" 
              value={(identity.height || identity.weight) 
                ? [identity.height, identity.weight].filter(Boolean).join(', ')
                : undefined
              }
              placeholder="Add height & weight"
            />
            <InfoRow 
              label="SCHOOL" 
              value={identity.school}
              placeholder="Add school"
            />
            {identity.graduationYear && (
              <InfoRow label="CLASS" value={identity.graduationYear} />
            )}
            <InfoRow 
              label="LOCATION" 
              value={identity.location && identity.location !== 'N/A' ? getCountryName(identity.location) : undefined}
              placeholder="Add location"
            />
          </div>
          
          {/* Mobile version - horizontal compact row */}
          <div className="flex lg:hidden flex-wrap gap-x-4 gap-y-1 text-xs w-full border-t border-gray-200 pt-3 mt-1">
            <MobileInfoItem 
              label="HT/WT" 
              value={(identity.height || identity.weight) 
                ? [identity.height, identity.weight].filter(Boolean).join(', ')
                : undefined
              }
              placeholder="Add height & weight"
            />
            <MobileInfoItem 
              label="SCHOOL" 
              value={identity.school} 
              placeholder="Add school"
            />
            {identity.graduationYear && (
              <MobileInfoItem label="CLASS" value={identity.graduationYear} />
            )}
            <MobileInfoItem 
              label="LOCATION" 
              value={identity.location && identity.location !== 'N/A' ? getCountryName(identity.location) : undefined}
              placeholder="Add location"
            />
          </div>

          {/* Far Right: Career Stats Box - Larger, ESPN-style */}
          {/* Mobile: Full width below name | Desktop: Right side */}
          <div className="shrink-0 self-center w-full sm:w-auto">
            <div className="bg-[#FF6B35] rounded-lg overflow-hidden sm:min-w-[220px] shadow-lg">
              <div className="px-3 py-1.5 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-white uppercase tracking-wide">
                  Career Stats
                </span>
                {gamesPlayed !== undefined && gamesPlayed > 0 && (
                  <span className="text-[10px] text-white/80">{gamesPlayed} GP</span>
                )}
              </div>
              <div className="bg-white px-4 py-3">
                <div className="grid grid-cols-4 gap-3 text-center">
                  <StatCell value={careerStats.ppg.toFixed(1)} label="PTS" />
                  <StatCell value={careerStats.rpg.toFixed(1)} label="REB" />
                  <StatCell value={careerStats.apg.toFixed(1)} label="AST" />
                  <StatCell value={`${careerStats.fgPct.toFixed(0)}%`} label="FG%" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoRow({ label, value, placeholder }: { label: string; value?: string; placeholder?: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-gray-400 uppercase tracking-wide w-16 text-xs">{label}</span>
      {value ? (
        <span className="text-gray-900 font-medium">{value}</span>
      ) : placeholder ? (
        <span className="text-gray-300 text-xs italic">{placeholder}</span>
      ) : null}
    </div>
  );
}

function StatCell({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-xl sm:text-2xl font-bold text-gray-900 leading-none">{value}</div>
      <div className="text-[10px] text-gray-500 uppercase mt-1">{label}</div>
    </div>
  );
}

function MobileInfoItem({ label, value, placeholder }: { label: string; value?: string; placeholder?: string }) {
  // Show placeholder if no value but placeholder provided
  if (!value && !placeholder) return null;
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-gray-400 uppercase tracking-wide text-[10px]">{label}</span>
      {value ? (
        <span className="text-gray-700 font-medium">{value}</span>
      ) : (
        <span className="text-gray-300 text-[10px] italic">{placeholder}</span>
      )}
    </div>
  );
}
