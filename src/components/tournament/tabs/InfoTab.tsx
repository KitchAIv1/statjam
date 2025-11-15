"use client";

import { TournamentPageData } from '@/lib/services/tournamentPublicService';
import { Card } from '@/components/ui/card';
import { useOrganizerProfile } from '@/hooks/useOrganizerProfile';

interface InfoTabProps {
  data: TournamentPageData;
}

export function InfoTab({ data }: InfoTabProps) {
  const { tournament } = data;
  const { organizer, loading: organizerLoading } = useOrganizerProfile(tournament.organizerId);

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      <Card className="rounded-xl border border-white/10 bg-white/5 p-3 text-white/80 backdrop-blur sm:rounded-2xl sm:p-4 md:rounded-3xl md:p-6">
        <h2 className="text-base font-semibold text-white sm:text-lg md:text-xl">Tournament Details</h2>
        <div className="mt-3 grid gap-2 text-[10px] text-white/70 sm:mt-4 sm:gap-3 sm:text-xs md:mt-6 md:gap-4 md:text-sm md:grid-cols-2">
          <InfoRow label="Status" value={toTitleCase(tournament.status)} />
          <InfoRow label="Start Date" value={formatDate(tournament.startDate)} />
          <InfoRow label="End Date" value={formatDate(tournament.endDate)} />
          <InfoRow label="Location" value={tournament.location || 'TBA'} />
          <InfoRow label="Venue" value={tournament.venue || 'TBA'} />
          <InfoRow 
            label="Organizer" 
            value={organizerLoading ? 'Loading...' : (organizer?.name || 'TBA')} 
          />
        </div>
      </Card>

      <Card className="rounded-xl border border-white/10 bg-white/5 p-3 text-white/70 backdrop-blur sm:rounded-2xl sm:p-4 md:rounded-3xl md:p-6">
        <h3 className="text-sm font-semibold text-white sm:text-base md:text-lg">Rules & Officials</h3>
        <ul className="mt-2 space-y-1 text-[10px] sm:mt-3 sm:space-y-1.5 sm:text-xs md:space-y-2 md:text-sm">
          <li>• NCAA modified rules • 18-minute halves • Shot clock 30 seconds</li>
          <li>• Verified officials assigned per court with live feedback</li>
          <li>• Coaches challenge system available in semifinals and finals</li>
        </ul>
      </Card>

      <Card className="rounded-xl border border-white/10 bg-white/5 p-3 text-white/70 backdrop-blur sm:rounded-2xl sm:p-4 md:rounded-3xl md:p-6">
        <h3 className="text-sm font-semibold text-white sm:text-base md:text-lg">Contact & Logistics</h3>
        <div className="mt-2 space-y-1 text-[10px] sm:mt-3 sm:space-y-1.5 sm:text-xs md:space-y-2 md:text-sm">
          <p>Email: tournaments@statjam.com</p>
          <p>Check-in: Opens 90 minutes before first game</p>
          <p>Parking: Lot B + Overflow at North Deck</p>
          <p>Media Credential Requests: media@statjam.com</p>
        </div>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-2 sm:rounded-xl sm:p-3 md:rounded-2xl md:p-4">
      <div className="text-[9px] uppercase tracking-wide text-white/40 sm:text-[10px] md:text-xs">{label}</div>
      <div className="mt-0.5 text-xs text-white/80 sm:mt-1 sm:text-sm md:text-base">{value}</div>
    </div>
  );
}

function formatDate(date?: string | null) {
  if (!date) return 'TBA';
  try {
    return new Date(date).toLocaleDateString();
  } catch (error) {
    console.error('Failed to format date', error);
    return 'TBA';
  }
}

function toTitleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
