"use client";

import { TournamentPageData } from '@/lib/services/tournamentPublicService';
import { Card } from '@/components/ui/card';
import { useOrganizerProfile } from '@/hooks/useOrganizerProfile';
import { useTournamentTheme } from '@/contexts/TournamentThemeContext';
import { getTournamentThemeClass } from '@/lib/utils/tournamentThemeClasses';

interface InfoTabProps {
  data: TournamentPageData;
}

export function InfoTab({ data }: InfoTabProps) {
  const { theme } = useTournamentTheme();
  const { tournament } = data;
  const { organizer, loading: organizerLoading } = useOrganizerProfile(tournament.organizerId);

  const cardClass = `rounded-xl border p-3 backdrop-blur sm:rounded-2xl sm:p-4 md:rounded-3xl md:p-6 ${getTournamentThemeClass('cardBorder', theme)} ${getTournamentThemeClass('cardBgSubtle', theme)} ${getTournamentThemeClass('cardTextMuted', theme)}`;

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      <Card className={cardClass}>
        <h2 className={`text-base font-semibold sm:text-lg md:text-xl ${getTournamentThemeClass('cardText', theme)}`}>Tournament Details</h2>
        <div className={`mt-3 grid gap-2 text-[10px] sm:mt-4 sm:gap-3 sm:text-xs md:mt-6 md:gap-4 md:text-sm md:grid-cols-2 ${getTournamentThemeClass('cardTextMuted', theme)}`}>
          <InfoRow label="Status" value={toTitleCase(tournament.status)} theme={theme} />
          <InfoRow label="Start Date" value={formatDate(tournament.startDate)} theme={theme} />
          <InfoRow label="End Date" value={formatDate(tournament.endDate)} theme={theme} />
          <InfoRow label="Location" value={tournament.location || 'TBA'} theme={theme} />
          <InfoRow label="Venue" value={tournament.venue || 'TBA'} theme={theme} />
          <InfoRow label="Organizer" value={organizerLoading ? 'Loading...' : (organizer?.name || 'TBA')} theme={theme} />
        </div>
      </Card>

      <Card className={cardClass}>
        <h3 className={`text-sm font-semibold sm:text-base md:text-lg ${getTournamentThemeClass('cardText', theme)}`}>Rules & Officials</h3>
        <ul className={`mt-2 space-y-1 text-[10px] sm:mt-3 sm:space-y-1.5 sm:text-xs md:space-y-2 md:text-sm ${getTournamentThemeClass('cardTextMuted', theme)}`}>
          <li>• NCAA modified rules • 18-minute halves • Shot clock 30 seconds</li>
          <li>• Verified officials assigned per court with live feedback</li>
          <li>• Coaches challenge system available in semifinals and finals</li>
        </ul>
      </Card>

      <Card className={cardClass}>
        <h3 className={`text-sm font-semibold sm:text-base md:text-lg ${getTournamentThemeClass('cardText', theme)}`}>Contact & Logistics</h3>
        <div className={`mt-2 space-y-1 text-[10px] sm:mt-3 sm:space-y-1.5 sm:text-xs md:space-y-2 md:text-sm ${getTournamentThemeClass('cardTextMuted', theme)}`}>
          <p>Email: tournaments@statjam.com</p>
          <p>Check-in: Opens 90 minutes before first game</p>
          <p>Parking: Lot B + Overflow at North Deck</p>
          <p>Media Credential Requests: media@statjam.com</p>
        </div>
      </Card>
    </div>
  );
}

function InfoRow({ label, value, theme }: { label: string; value: string; theme: 'light' | 'dark' }) {
  return (
    <div className={`rounded-lg border p-2 sm:rounded-xl sm:p-3 md:rounded-2xl md:p-4 ${getTournamentThemeClass('cardBorder', theme)} ${getTournamentThemeClass('cardBg', theme)}`}>
      <div className={`text-[9px] uppercase tracking-wide sm:text-[10px] md:text-xs ${getTournamentThemeClass('cardTextDim', theme)}`}>{label}</div>
      <div className={`mt-0.5 text-xs sm:mt-1 sm:text-sm md:text-base ${getTournamentThemeClass('cardText', theme)}`}>{value}</div>
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
