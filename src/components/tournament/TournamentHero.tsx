"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { MapPin, Share2, Bell, Download, CheckCircle2, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { TournamentPageData } from '@/lib/services/tournamentPublicService';
import { ProfileService } from '@/lib/services/profileService';
import { notify } from '@/lib/services/notificationService';

interface TournamentHeroProps {
  data: TournamentPageData;
}

export function TournamentHero({ data }: TournamentHeroProps) {
  const { tournament } = data;
  const pathname = usePathname();
  const [organizerProfile, setOrganizerProfile] = useState<{ name: string; profilePhotoUrl?: string } | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

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
  const organizerInitials = organizerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Determine phase based on status
  const phase = getPhaseFromStatus(tournament.status);
  const progress = getProgressFromStatus(tournament.status);

  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-[#121212] to-black">
      <div className="relative mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:gap-6 sm:px-6 sm:py-8">
        {/* Left Column: Tournament Logo + Name + Location/Date */}
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-6">
          <Avatar className="h-14 w-14 shrink-0 border border-white/10 bg-[#121212] sm:h-20 sm:w-20">
            {tournament.logo ? (
              <AvatarImage
                src={tournament.logo}
                alt={`${tournament.name} logo`}
                className="object-contain"
                loading="eager"
              />
            ) : null}
            <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10">
              <Trophy className="h-6 w-6 text-[#FF3B30] sm:h-8 sm:w-8" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
              {tournament.name}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-[#B3B3B3] sm:gap-2 sm:text-base">
              <MapPin className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span className="truncate">{location}</span>
              <span className="shrink-0">·</span>
              <span className="shrink-0">{dateRange}</span>
            </p>
          </div>
        </div>

        {/* Center Column: Phase Chips + Progress Bar */}
        <div className="flex min-w-0 flex-1 flex-col items-center gap-3 sm:gap-4">
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            {PHASES.map((p) => (
              <PhaseChip
                key={p.value}
                label={p.label}
                isActive={phase === p.value}
                isCompleted={progress > p.progress}
              />
            ))}
          </div>
          <div className="w-full max-w-xs">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#FF3B30] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Share, Follow, Organizer Badge */}
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end sm:gap-3">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-full border-white/10 bg-[#121212] px-3 text-xs text-white/70 hover:border-white/30 hover:text-white sm:h-9 sm:px-4 sm:text-sm"
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
              <Share2 className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`h-8 rounded-full border-white/10 bg-[#121212] px-3 text-xs hover:border-white/30 sm:h-9 sm:px-4 sm:text-sm ${
                isFollowing
                  ? 'border-[#FF3B30]/50 bg-[#FF3B30]/10 text-[#FF3B30] hover:text-[#FF3B30]'
                  : 'text-white/70 hover:text-white'
              }`}
              onClick={() => setIsFollowing(!isFollowing)}
            >
              <Bell className={`mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4 ${isFollowing ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">{isFollowing ? 'Following' : 'Follow'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="hidden h-9 rounded-full border-white/10 bg-[#121212] px-4 text-sm text-white/70 hover:border-white/30 hover:text-white sm:flex"
            >
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-[#121212] px-2 py-1 sm:gap-2 sm:px-3 sm:py-1.5">
            {organizerProfile?.profilePhotoUrl ? (
              <Avatar className="h-5 w-5 border border-white/10 sm:h-6 sm:w-6">
                <AvatarImage src={organizerProfile.profilePhotoUrl} alt={organizerName} />
                <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10 text-xs text-white">
                  {organizerInitials}
                </AvatarFallback>
              </Avatar>
            ) : null}
            <span className="text-[10px] font-medium text-white/90 sm:text-xs">{organizerName}</span>
            <CheckCircle2 className="h-3 w-3 text-[#FF3B30] sm:h-3.5 sm:w-3.5" />
            <span className="hidden text-xs text-white/40 sm:inline">Verified</span>
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

function PhaseChip({ label, isActive, isCompleted }: { label: string; isActive: boolean; isCompleted: boolean }) {
  return (
    <div
      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors sm:px-4 sm:py-1.5 sm:text-xs ${
        isActive
          ? 'bg-[#FF3B30] text-white shadow-lg shadow-[#FF3B30]/30'
          : isCompleted
            ? 'bg-white/10 text-white/70'
            : 'bg-white/5 text-white/40'
      }`}
    >
      {label}
    </div>
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
