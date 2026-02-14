'use client';

import Link from 'next/link';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { getCountryName } from '@/data/countries';
import type { PublicTeamPlayer } from '@/lib/services/publicTeamService';

export interface PlayerRosterCardProps {
  player: PublicTeamPlayer;
  teamPrimaryColor?: string;
  href: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
}

function parseFirstLastName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return { firstName: fullName, lastName: '' };
  const lastName = parts.pop() || '';
  const firstName = parts.join(' ');
  return { firstName, lastName };
}

function StatRow({
  label,
  value,
  onDark = false,
}: {
  label: string;
  value: string | number | undefined;
  onDark?: boolean;
}) {
  const labelClass = onDark ? 'text-white/80' : 'text-gray-400';
  const valueClass = onDark ? 'text-white' : 'text-gray-900';
  return (
    <div className="flex flex-col gap-0">
      <span className={`text-[9px] font-medium uppercase tracking-wider ${labelClass}`}>{label}</span>
      <span className={`text-xs font-bold leading-tight ${valueClass}`}>{value ?? '—'}</span>
    </div>
  );
}

export function PlayerRosterCard({ player, teamPrimaryColor, href }: PlayerRosterCardProps) {
  const primaryColor = teamPrimaryColor || '#007A33';
  const { firstName, lastName } = parseFirstLastName(player.name);
  const originDisplay = player.country ? getCountryName(player.country) : undefined;

  return (
    <Link
      href={href}
      className="block overflow-hidden rounded-xl bg-white shadow-md transition hover:shadow-lg"
    >
      <div className="flex h-[229px] overflow-hidden">
        {/* Left: Jersey block + stats (wider) */}
        <div
          className="flex w-24 flex-shrink-0 flex-col items-center py-2"
          style={{ backgroundColor: primaryColor }}
        >
          <span className="text-4xl font-bold text-white">{player.jerseyNumber ?? '—'}</span>
          <div className="mt-4 flex flex-1 flex-col gap-1 px-2">
            <StatRow label="POS" value={player.position} onDark />
            <StatRow label="ORIGIN" value={originDisplay} onDark />
            <StatRow label="HT" value={player.height} onDark />
            <StatRow label="WT" value={player.weight} onDark />
          </div>
        </div>

        {/* Right: Photo edge-to-edge + name (Celtics-style) */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Image: head-and-shoulders crop, object-top for faces */}
          <div className="relative h-[179px] w-full overflow-hidden bg-white">
            <Avatar className="h-full w-full rounded-none">
              {player.profilePhotoUrl ? (
                <AvatarImage
                  src={player.profilePhotoUrl}
                  alt={player.name}
                  className="object-cover object-top"
                />
              ) : null}
              <AvatarFallback className="bg-gray-100 text-gray-500 rounded-none">
                {getInitials(player.name) || <User className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>
          </div>
          {/* Name details: left-aligned, Celtics-style */}
          <div className="border-t border-gray-200 px-3 pt-2 pb-2 text-left">
            {firstName && (
              <span className="block text-xs font-normal uppercase tracking-wide text-gray-700">
                {firstName}
              </span>
            )}
            {lastName && (
              <span
                className="block text-sm font-bold uppercase tracking-wide"
                style={{ color: primaryColor }}
              >
                {lastName}
              </span>
            )}
            <span className="mt-0.5 block text-[10px] font-medium uppercase text-gray-400">
              {player.position || '—'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
