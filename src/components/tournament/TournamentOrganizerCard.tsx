"use client";

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, Shield } from 'lucide-react';
import { useOrganizerProfile } from '@/hooks/useOrganizerProfile';

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

  if (!organizerId) {
    return null;
  }

  if (loading) {
    return (
      <section className="rounded-2xl border border-white/10 bg-[#121212] p-5">
        <header className="mb-3 text-sm font-semibold text-white">Organizer</header>
        <div className="animate-pulse space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 rounded bg-white/10" />
              <div className="h-3 w-32 rounded bg-white/5" />
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
    <section className="rounded-2xl border border-white/10 bg-[#121212] p-5">
      <header className="mb-3 text-sm font-semibold text-white">Organizer</header>
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12 shrink-0 border border-white/10">
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
          <div className="text-sm font-semibold text-white truncate">{organizer.name}</div>
          {organizer.bio && (
            <div className="text-xs text-[#B3B3B3] line-clamp-2 mt-0.5">{organizer.bio}</div>
          )}
        </div>
      </div>
    </section>
  );
}

