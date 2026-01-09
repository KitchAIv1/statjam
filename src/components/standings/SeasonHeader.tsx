// ============================================================================
// SEASON HEADER - Reusable (<100 lines)
// Purpose: Display season/tournament header with branding - Reusable
// Follows .cursorrules: Single responsibility, reusable, <100 lines
// ============================================================================

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Calendar, Trophy, MapPin, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SeasonStatus, SeasonType } from '@/lib/types/season';

interface SeasonHeaderProps {
  name: string;
  logo?: string;
  leagueName?: string;
  seasonType: SeasonType;
  seasonYear?: string;
  conference?: string;
  homeVenue?: string;
  status: SeasonStatus;
  primaryColor?: string;
  wins: number;
  losses: number;
  className?: string;
}

const typeLabels: Record<SeasonType, string> = {
  regular: 'Regular Season',
  playoffs: 'Playoffs',
  preseason: 'Preseason',
  summer: 'Summer League',
  tournament: 'Tournament',
};

const statusColors: Record<SeasonStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
};

export function SeasonHeader({
  name, logo, leagueName, seasonType, seasonYear, conference, homeVenue,
  status, primaryColor = '#FF6B00', wins, losses, className,
}: SeasonHeaderProps) {
  return (
    <div 
      className={cn('rounded-xl overflow-hidden', className)}
      style={{ background: `linear-gradient(135deg, ${primaryColor}, ${adjustColor(primaryColor, -30)})` }}
    >
      <div className="px-6 py-5 flex items-center gap-4">
        {/* Logo */}
        {logo ? (
          <img src={logo} alt={name} className="w-16 h-16 rounded-xl object-cover border-2 border-white/20" />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
            <Trophy className="w-8 h-8 text-white/80" />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 text-white">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold">{name}</h1>
            <Badge className={cn('text-[10px]', statusColors[status])}>{status.toUpperCase()}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/80">
            {leagueName && <span>{leagueName}</span>}
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {typeLabels[seasonType]} {seasonYear && `• ${seasonYear}`}
            </span>
            {conference && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{conference}</span>}
            {homeVenue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{homeVenue}</span>}
          </div>
        </div>

        {/* Record */}
        <div className="text-right text-white">
          <p className="text-3xl font-black">{wins}-{losses}</p>
          <p className="text-xs text-white/70 uppercase tracking-wide">Record</p>
        </div>
      </div>
    </div>
  );
}

// Darken color for gradient
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

