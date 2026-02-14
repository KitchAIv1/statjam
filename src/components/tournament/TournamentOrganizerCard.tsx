"use client";

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { useOrganizerProfile } from '@/hooks/useOrganizerProfile';
import { useTournamentTheme } from '@/contexts/TournamentThemeContext';
import { getTournamentThemeClass } from '@/lib/utils/tournamentThemeClasses';

interface TournamentOrganizerCardProps {
  organizerId: string | null;
}

/**
 * TournamentOrganizerCard - Organizer info card component
 * 
 * Purpose: Display organizer information with avatar and name
 * Follows .cursorrules: <200 lines, single responsibility
 */
export function TournamentOrganizerCard({ organizerId }: TournamentOrganizerCardProps) {
  const { organizer, loading } = useOrganizerProfile(organizerId);
  const { theme } = useTournamentTheme();

  if (!organizerId) {
    return null;
  }

  if (loading) {
    return (
      <section className={`rounded-2xl border p-5 ${getTournamentThemeClass('railSectionBg', theme)} ${getTournamentThemeClass('cardBorder', theme)}`}>
        <header className={`mb-3 text-sm font-semibold ${getTournamentThemeClass('cardText', theme)}`}>Organizer</header>
        <div className="animate-pulse space-y-3">
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 rounded-full ${getTournamentThemeClass('cardBgSubtle', theme)}`} />
            <div className="flex-1 space-y-2">
              <div className={`h-4 w-24 rounded ${getTournamentThemeClass('cardBgSubtle', theme)}`} />
              <div className={`h-3 w-32 rounded ${getTournamentThemeClass('cardBgSubtle', theme)}`} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!organizer) {
    return null;
  }

  return (
    <section className={`rounded-2xl border p-5 ${getTournamentThemeClass('railSectionBg', theme)} ${getTournamentThemeClass('cardBorder', theme)}`}>
      <header className={`mb-3 text-sm font-semibold ${getTournamentThemeClass('cardText', theme)}`}>Organizer</header>
      <div className="flex items-center gap-3">
        <Avatar className={`h-12 w-12 shrink-0 border ${getTournamentThemeClass('cardBorder', theme)}`}>
          {organizer.profilePhotoUrl ? (
            <AvatarImage
              src={organizer.profilePhotoUrl}
              alt={organizer.name}
              className="object-cover"
            />
          ) : null}
          <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10">
            <User className="h-6 w-6 text-[#FF3B30]" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-semibold truncate ${getTournamentThemeClass('cardText', theme)}`}>{organizer.name}</div>
          {organizer.bio && (
            <div className={`text-xs line-clamp-2 mt-0.5 ${getTournamentThemeClass('cardTextMuted', theme)}`}>{organizer.bio}</div>
          )}
        </div>
      </div>
    </section>
  );
}

