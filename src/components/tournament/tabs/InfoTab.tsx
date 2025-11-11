import { TournamentPageData } from '@/lib/services/tournamentPublicService';
import { Card } from '@/components/ui/card';

interface InfoTabProps {
  data: TournamentPageData;
}

export function InfoTab({ data }: InfoTabProps) {
  const { tournament } = data;

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80 backdrop-blur sm:rounded-3xl sm:p-6">
        <h2 className="text-lg font-semibold text-white sm:text-xl">Tournament Details</h2>
        <div className="mt-4 grid gap-3 text-xs text-white/70 sm:mt-6 sm:gap-4 sm:text-sm md:grid-cols-2">
          <InfoRow label="Status" value={toTitleCase(tournament.status)} />
          <InfoRow label="Start Date" value={formatDate(tournament.startDate)} />
          <InfoRow label="End Date" value={formatDate(tournament.endDate)} />
          <InfoRow label="Location" value={tournament.location || 'TBA'} />
          <InfoRow label="Venue" value={tournament.venue || 'TBA'} />
          <InfoRow label="Organizer" value="Elite Sports Federation" />
        </div>
      </Card>

      <Card className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/70 backdrop-blur sm:rounded-3xl sm:p-6">
        <h3 className="text-base font-semibold text-white sm:text-lg">Rules & Officials</h3>
        <ul className="mt-3 space-y-1.5 text-xs sm:space-y-2 sm:text-sm">
          <li>• NCAA modified rules • 18-minute halves • Shot clock 30 seconds</li>
          <li>• Verified officials assigned per court with live feedback</li>
          <li>• Coaches challenge system available in semifinals and finals</li>
        </ul>
      </Card>

      <Card className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/70 backdrop-blur sm:rounded-3xl sm:p-6">
        <h3 className="text-base font-semibold text-white sm:text-lg">Contact & Logistics</h3>
        <div className="mt-3 space-y-1.5 text-xs sm:space-y-2 sm:text-sm">
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
    <div className="rounded-xl border border-white/10 bg-black/30 p-3 sm:rounded-2xl sm:p-4">
      <div className="text-[10px] uppercase tracking-wide text-white/40 sm:text-xs">{label}</div>
      <div className="mt-1 text-sm text-white/80 sm:text-base">{value}</div>
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
