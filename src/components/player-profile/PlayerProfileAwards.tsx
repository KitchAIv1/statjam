"use client";

import { Trophy, Sparkles, Medal } from 'lucide-react';
import type { PlayerAward } from '@/hooks/usePublicPlayerProfile';

interface PlayerProfileAwardsProps {
  awards: PlayerAward[];
}

/**
 * PlayerProfileAwards - Awards badges display
 * 
 * Contained card design for side-by-side layout
 * 
 * Follows .cursorrules: <200 lines, single responsibility
 */
export function PlayerProfileAwards({ awards }: PlayerProfileAwardsProps) {
  if (!awards || awards.length === 0) return null;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden h-full">
      {/* Header Bar - Orange accent */}
      <div className="bg-[#FF6B35] px-4 py-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-white">
          Awards & Accolades
        </h2>
      </div>
      
      {/* Awards Grid */}
      <div className="bg-white px-4 py-5">
        <div className="flex flex-wrap justify-center gap-3">
          {awards.map((award, index) => (
            <AwardBadge key={`${award.type}-${index}`} award={award} />
          ))}
        </div>
      </div>
    </div>
  );
}

function AwardBadge({ award }: { award: PlayerAward }) {
  const config = getAwardConfig(award.type);

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${config.className}`}>
      <config.icon className="w-4 h-4" />
      <span className="font-medium text-sm">{config.label}</span>
      {award.count > 1 && (
        <span className="text-xs font-bold bg-white/20 px-1.5 py-0.5 rounded">×{award.count}</span>
      )}
    </div>
  );
}

function getAwardConfig(type: string): {
  icon: typeof Trophy;
  label: string;
  className: string;
} {
  switch (type) {
    case 'potg':
      return {
        icon: Trophy,
        label: 'Player of the Game',
        className: 'bg-amber-500/10 border-amber-500/30 text-amber-700',
      };
    case 'hustle':
      return {
        icon: Sparkles,
        label: 'Hustle Player',
        className: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-700',
      };
    case 'champion':
      return {
        icon: Medal,
        label: 'Tournament Champion',
        className: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700',
      };
    default:
      return {
        icon: Trophy,
        label: type,
        className: 'bg-gray-100 border-gray-200 text-gray-700',
      };
  }
}
