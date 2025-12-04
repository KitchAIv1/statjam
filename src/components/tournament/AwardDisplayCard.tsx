/**
 * AwardDisplayCard - Reusable Award Display Component
 * 
 * PURPOSE: Display Player of the Game or Hustle Player award
 * - Shows player photo, name, stats
 * - Award badge/icon
 * - Clickable to open player profile
 * 
 * Follows .cursorrules: <150 lines component
 */

'use client';

import React from 'react';
import { Trophy, Sparkles } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';

export interface AwardDisplayCardProps {
  playerId: string;
  playerName: string;
  awardType: 'player_of_the_game' | 'hustle_player';
  stats?: {
    points: number;
    rebounds: number;
    assists: number;
    steals?: number;
    blocks?: number;
  };
  profilePhotoUrl?: string | null;
  onClick?: () => void;
}

export function AwardDisplayCard({
  playerId,
  playerName,
  awardType,
  stats,
  profilePhotoUrl,
  onClick
}: AwardDisplayCardProps) {
  const router = useRouter();
  
  const awardLabel = awardType === 'player_of_the_game' 
    ? 'Player of the Game' 
    : 'Hustle Player';
  
  const Icon = awardType === 'player_of_the_game' ? Trophy : Sparkles;
  
  // ✅ Distinct color schemes for each award type
  const isPOTG = awardType === 'player_of_the_game';
  const avatarBgColor = isPOTG 
    ? 'bg-gradient-to-br from-amber-500 to-orange-600' 
    : 'bg-gradient-to-br from-cyan-500 to-teal-600';
  const accentColor = isPOTG ? 'text-amber-500' : 'text-cyan-400';
  const borderColor = isPOTG ? 'border-amber-500/30' : 'border-cyan-500/30';
  const hoverBorder = isPOTG ? 'hover:border-amber-500/50' : 'hover:border-cyan-500/50';

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Default: Navigate to player profile
      router.push(`/player/${playerId}`);
    }
  };

  const initials = playerName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      onClick={handleClick}
      className={`cursor-pointer rounded-xl border ${borderColor} bg-[#121212] p-4 transition ${hoverBorder} hover:bg-black/50`}
    >
      <div className="flex items-center gap-3">
        {/* Player Avatar - 30% larger (h-12 w-12 → h-16 w-16) */}
        <Avatar className={`h-16 w-16 border-2 ${isPOTG ? 'border-amber-500/40' : 'border-cyan-500/40'}`}>
          {profilePhotoUrl ? (
            <AvatarImage src={profilePhotoUrl} alt={playerName} />
          ) : null}
          <AvatarFallback className={`${avatarBgColor} text-white font-bold text-lg`}>
            {initials || '??'}
          </AvatarFallback>
        </Avatar>

        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Icon className={`w-4 h-4 ${accentColor}`} />
            <span className={`text-xs font-semibold ${accentColor} uppercase tracking-wide`}>
              {awardLabel}
            </span>
          </div>
          <div className="text-sm font-semibold text-white truncate">
            {playerName}
          </div>
          {stats && (
            <div className="text-xs text-[#B3B3B3] mt-1">
              {stats.points} PTS • {stats.rebounds} REB • {stats.assists} AST
              {stats.steals !== undefined && stats.steals > 0 && ` • ${stats.steals} STL`}
              {stats.blocks !== undefined && stats.blocks > 0 && ` • ${stats.blocks} BLK`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

