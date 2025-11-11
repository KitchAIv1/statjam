"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hybridSupabaseService } from '@/lib/services/hybridSupabaseService';
import { Card } from '@/components/ui/card';
import { Trophy, Calendar, MapPin, Users, Shield } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface Tournament {
  id: string;
  name: string;
  status?: string;
  start_date?: string | null;
  end_date?: string | null;
  venue?: string | null;
  logo?: string | null;
  organizer_id?: string | null;
}

export function TournamentsListPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [logoLoadStates, setLogoLoadStates] = useState<Record<string, { loaded: boolean; error: boolean }>>({});

  useEffect(() => {
    let mounted = true;

    const loadTournaments = async () => {
      try {
        // Fetch tournaments - RLS policies will handle visibility for unauthenticated users
        // Removed is_public filter to avoid query syntax issues - RLS should filter automatically
        const data = await hybridSupabaseService.query<Tournament>(
          'tournaments',
          'id, name, status, start_date, end_date, venue, logo, organizer_id',
          {}
        );

        if (mounted) {
          setTournaments(data);
          const initialStates: Record<string, { loaded: boolean; error: boolean }> = {};
          data.forEach((tournament) => {
            initialStates[tournament.id] = { loaded: false, error: false };
          });
          setLogoLoadStates(initialStates);
        }
      } catch (error) {
        console.error('Failed to load tournaments:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadTournaments();

    return () => {
      mounted = false;
    };
  }, []);

  const handleLogoLoad = (tournamentId: string) => {
    setLogoLoadStates((prev) => ({ ...prev, [tournamentId]: { loaded: true, error: false } }));
  };

  const handleLogoError = (tournamentId: string) => {
    setLogoLoadStates((prev) => ({ ...prev, [tournamentId]: { loaded: false, error: true } }));
  };

  const handleTournamentClick = (tournament: Tournament) => {
    router.push(`/tournament/${tournament.id}`);
  };

  const formatDateRange = (start?: string | null, end?: string | null): string => {
    if (!start && !end) return 'Date TBA';
    if (start && !end) {
      try {
        return new Date(start).toLocaleDateString();
      } catch {
        return 'Date TBA';
      }
    }
    if (!start && end) {
      try {
        return new Date(end).toLocaleDateString();
      } catch {
        return 'Date TBA';
      }
    }

    try {
      const startDate = new Date(start as string);
      const endDate = new Date(end as string);
      const sameMonth = startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear();

      if (sameMonth) {
        const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(startDate);
        return `${month} ${startDate.getDate()}–${endDate.getDate()}, ${startDate.getFullYear()}`;
      }

      const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
      return `${formatter.format(startDate)} – ${formatter.format(endDate)}, ${startDate.getFullYear()}`;
    } catch (error) {
      return 'Date TBA';
    }
  };

  const statusToLabel = (status?: string): string => {
    if (!status) return 'Upcoming';
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
  };

  const statusToColor = (status?: string): string => {
    if (!status) return 'bg-white/10 text-white/60';
    switch (status.toLowerCase()) {
      case 'active':
      case 'live':
        return 'bg-[#FF3B30] text-white';
      case 'completed':
        return 'bg-white/10 text-white/60';
      default:
        return 'bg-white/10 text-white/60';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-[1400px] px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Tournaments</h1>
          <p className="text-lg text-white/60">Discover and follow live basketball tournaments</p>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="h-64 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
            ))}
          </div>
        ) : tournaments.length === 0 ? (
          <Card className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center text-white/60">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-white/40" />
            <h2 className="text-xl font-semibold text-white mb-2">No tournaments yet</h2>
            <p>Check back soon for upcoming tournaments and live events.</p>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((tournament) => {
              const logoState = logoLoadStates[tournament.id] || { loaded: false, error: false };
              const dateRange = formatDateRange(tournament.start_date, tournament.end_date);
              const location = tournament.venue || 'Venue TBA';
              const statusLabel = statusToLabel(tournament.status);
              const statusColor = statusToColor(tournament.status);

              return (
                <Card
                  key={tournament.id}
                  onClick={() => handleTournamentClick(tournament)}
                  className="group cursor-pointer rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur transition-all hover:border-white/20 hover:bg-white/10"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                      {tournament.logo && !logoState.error ? (
                        <>
                          {!logoState.loaded && (
                            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                          )}
                          <img
                            src={tournament.logo}
                            alt={`${tournament.name} logo`}
                            className={`h-12 w-12 object-contain transition-opacity duration-300 ${
                              logoState.loaded ? 'opacity-100' : 'opacity-0'
                            }`}
                            loading="lazy"
                            decoding="async"
                            onLoad={() => handleLogoLoad(tournament.id)}
                            onError={() => handleLogoError(tournament.id)}
                          />
                        </>
                      ) : (
                        <Trophy className="h-8 w-8 text-white/60" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl font-semibold text-white mb-1 truncate group-hover:text-[#FF3B30] transition-colors">
                        {tournament.name}
                      </h3>
                      <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusColor}`}>
                        {statusLabel}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-white/60">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{dateRange}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{location}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10">
                    <button className="w-full rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70 transition hover:border-white/40 hover:text-white hover:bg-white/10">
                      View Tournament
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

