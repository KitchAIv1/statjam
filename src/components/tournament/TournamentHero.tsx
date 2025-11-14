"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { MapPin, Share2, Bell, Download, CheckCircle2, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { TournamentPageData } from '@/lib/services/tournamentPublicService';
import { ProfileService } from '@/lib/services/profileService';
import { notify } from '@/lib/services/notificationService';
import { getCountry } from '@/data/countries';

interface TournamentHeroProps {
  data: TournamentPageData;
  onPhaseChange?: (phase: 'upcoming' | 'live' | 'finals') => void;
  activePhase?: 'upcoming' | 'live' | 'finals';
}

export function TournamentHero({ data, onPhaseChange, activePhase }: TournamentHeroProps) {
  const { tournament } = data;
  const pathname = usePathname();
  const [organizerProfile, setOrganizerProfile] = useState<{ name: string; profilePhotoUrl?: string } | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  
  // Determine phase based on status (fallback if no activePhase prop)
  const currentPhase = activePhase || getPhaseFromStatus(tournament.status);

  useEffect(() => {
    let mounted = true;

    const loadOrganizer = async () => {
      if (!tournament.organizerId) return;

      try {
        const profile = await ProfileService.getOrganizerProfile(tournament.organizerId);
        if (mounted && profile) {
          setOrganizerProfile({
            name: profile.name,
            profilePhotoUrl: profile.profilePhotoUrl || undefined,
          });
        }
      } catch (error) {
        console.error('Failed to load organizer profile:', error);
      }
    };

    loadOrganizer();

    return () => {
      mounted = false;
    };
  }, [tournament.organizerId]);

  const dateRange = formatDateRange(tournament.startDate, tournament.endDate);
  const location = tournament.location || 'Venue TBA';
  const organizerName = organizerProfile?.name || 'Elite Sports Collective';
  const countryData = tournament.country ? getCountry(tournament.country) : null;
  const organizerInitials = organizerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const progress = getProgressFromStatus(tournament.status);

  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-[#121212] to-black">
      <div className="relative mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-3 py-4 sm:gap-5 sm:px-4 sm:py-5 md:flex-row md:items-center md:gap-6 md:px-6 md:py-8">
        {/* Left Column: Tournament Logo + Name + Location/Date */}
        <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-4 md:gap-6">
          <Avatar className="h-12 w-12 shrink-0 border border-white/10 bg-[#121212] sm:h-16 sm:w-16 md:h-20 md:w-20">
            {tournament.logo ? (
              <AvatarImage
                src={tournament.logo}
                alt={`${tournament.name} logo`}
                className="object-contain"
                loading="eager"
              />
            ) : null}
            <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10">
              <Trophy className="h-5 w-5 text-[#FF3B30] sm:h-6 sm:w-6 md:h-8 md:w-8" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl md:text-3xl lg:text-4xl">
              {tournament.name}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-[#B3B3B3] sm:gap-1.5 sm:text-sm md:gap-2 md:text-base">
              {countryData && (
                <>
                  <span className="text-sm shrink-0 sm:text-base md:text-lg" title={countryData.name}>{countryData.flag}</span>
                  <span className="shrink-0">·</span>
                </>
              )}
              <MapPin className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
              <span className="truncate">{location}</span>
              <span className="shrink-0">·</span>
              <span className="shrink-0">{dateRange}</span>
            </p>
          </div>
        </div>

        {/* Center Column: Phase Chips + Progress Bar */}
        <div className="flex min-w-0 flex-1 flex-col items-center gap-2.5 sm:gap-3 md:gap-4">
          <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 md:gap-2">
            {PHASES.map((p) => (
              <PhaseChip
                key={p.value}
                label={p.label}
                value={p.value}
                isActive={currentPhase === p.value}
                isCompleted={progress > p.progress}
                onClick={() => {
                  if (onPhaseChange) {
                    onPhaseChange(p.value);
                  }
                }}
              />
            ))}
          </div>
          <div className="w-full max-w-xs">
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/10 sm:h-1.5">
              <div
                className="h-full rounded-full bg-[#FF3B30] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Share, Follow, Organizer Badge */}
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end sm:gap-2.5 md:gap-3">
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 md:gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 rounded-full border-white/10 bg-[#121212] px-2.5 text-[10px] text-white/70 hover:border-white/30 hover:text-white sm:h-8 sm:px-3 sm:text-xs md:h-9 md:px-4 md:text-sm"
              onClick={async () => {
                // Get the full URL - construct from origin + pathname for reliability
                const currentUrl = typeof window !== 'undefined' 
                  ? `${window.location.origin}${pathname}`
                  : '';
                
                if (!currentUrl) {
                  notify.error('Unable to get URL', 'Please try again');
                  return;
                }
                
                // Construct share data with URL included in text as well for better compatibility
                // Some share targets (like Messages) prefer URL in text field
                const shareText = `Check out ${tournament.name} on StatJam\n${currentUrl}`;
                
                // Share functionality
                if (navigator.share) {
                  try {
                    await navigator.share({
                      title: tournament.name,
                      text: shareText,
                      url: currentUrl,
                    });
                  } catch (error) {
                    // User cancelled share or error occurred
                    if ((error as Error).name !== 'AbortError') {
                      console.error('Share failed:', error);
                      // Fallback to clipboard if share fails
                      try {
                        await navigator.clipboard.writeText(currentUrl);
                        notify.success('Link copied!', 'Tournament link copied to clipboard');
                      } catch (clipboardError) {
                        console.error('Failed to copy to clipboard:', clipboardError);
                        notify.error('Failed to share link', 'Please try again');
                      }
                    }
                  }
                } else {
                  // Fallback to clipboard copy
                  try {
                    await navigator.clipboard.writeText(currentUrl);
                    notify.success('Link copied!', 'Tournament link copied to clipboard');
                  } catch (error) {
                    console.error('Failed to copy to clipboard:', error);
                    notify.error('Failed to copy link', 'Please try again');
                  }
                }
              }}
            >
              <Share2 className="mr-1 h-3 w-3 sm:mr-1.5 sm:h-3.5 sm:w-3.5 md:mr-2 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`h-7 rounded-full border-white/10 bg-[#121212] px-2.5 text-[10px] hover:border-white/30 sm:h-8 sm:px-3 sm:text-xs md:h-9 md:px-4 md:text-sm ${
                isFollowing
                  ? 'border-[#FF3B30]/50 bg-[#FF3B30]/10 text-[#FF3B30] hover:text-[#FF3B30]'
                  : 'text-white/70 hover:text-white'
              }`}
              onClick={() => setIsFollowing(!isFollowing)}
            >
              <Bell className={`mr-1 h-3 w-3 sm:mr-1.5 sm:h-3.5 sm:w-3.5 md:mr-2 md:h-4 md:w-4 ${isFollowing ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">{isFollowing ? 'Following' : 'Follow'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="hidden h-9 rounded-full border-white/10 bg-[#121212] px-4 text-sm text-white/70 hover:border-white/30 hover:text-white md:flex"
            >
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-[#121212] px-2 py-0.5 sm:gap-1.5 sm:px-2.5 sm:py-1 md:gap-2 md:px-3 md:py-1.5">
            {organizerProfile?.profilePhotoUrl ? (
              <Avatar className="h-4 w-4 border border-white/10 sm:h-5 sm:w-5 md:h-6 md:w-6">
                <AvatarImage src={organizerProfile.profilePhotoUrl} alt={organizerName} />
                <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10 text-[10px] text-white sm:text-xs">
                  {organizerInitials}
                </AvatarFallback>
              </Avatar>
            ) : null}
            <span className="text-[9px] font-medium text-white/90 sm:text-[10px] md:text-xs">{organizerName}</span>
            <CheckCircle2 className="h-2.5 w-2.5 text-[#FF3B30] sm:h-3 sm:w-3 md:h-3.5 md:w-3.5" />
            <span className="hidden text-xs text-white/40 md:inline">Verified</span>
          </div>
        </div>
      </div>
    </section>
  );
}

const PHASES = [
  { label: 'Upcoming', value: 'upcoming', progress: 0 },
  { label: 'Live', value: 'live', progress: 50 },
  { label: 'Finals', value: 'finals', progress: 100 },
] as const;

function PhaseChip({ 
  label, 
  value, 
  isActive, 
  isCompleted, 
  onClick 
}: { 
  label: string; 
  value: 'upcoming' | 'live' | 'finals';
  isActive: boolean; 
  isCompleted: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide transition-all hover:scale-105 sm:px-2.5 sm:py-1 sm:text-[10px] md:px-4 md:py-1.5 md:text-xs ${
        isActive
          ? 'bg-[#FF3B30] text-white shadow-lg shadow-[#FF3B30]/30 cursor-default'
          : isCompleted
            ? 'bg-white/10 text-white/70 hover:bg-white/15 cursor-pointer'
            : 'bg-white/5 text-white/40 hover:bg-white/10 cursor-pointer'
      }`}
    >
      {label}
    </button>
  );
}

function getPhaseFromStatus(status: string): 'upcoming' | 'live' | 'finals' {
  const s = status.toLowerCase();
  if (s === 'active' || s === 'live') return 'live';
  if (s === 'completed') return 'finals';
  return 'upcoming';
}

function getProgressFromStatus(status: string): number {
  const s = status.toLowerCase();
  if (s === 'active' || s === 'live') return 50;
  if (s === 'completed') return 100;
  return 0;
}

function formatDateRange(start?: string | null, end?: string | null): string {
  if (!start && !end) return 'Date TBA';
  if (start && !end) return new Date(start).toLocaleDateString();
  if (!start && end) return new Date(end).toLocaleDateString();

  try {
    const startDate = new Date(start as string);
    const endDate = new Date(end as string);

    const sameMonth = startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear();
    const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

    if (sameMonth) {
      const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(startDate);
      return `${month} ${startDate.getDate()}–${endDate.getDate()}, ${startDate.getFullYear()}`;
    }

    return `${formatter.format(startDate)} – ${formatter.format(endDate)}, ${startDate.getFullYear()}`;
  } catch (error) {
    console.error('Failed to format date range:', error);
    return 'Date TBA';
  }
}

function statusToLabel(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
    case 'live':
      return 'Live Now';
    case 'completed':
      return 'Completed';
    case 'draft':
      return 'Upcoming';
    default:
      return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
