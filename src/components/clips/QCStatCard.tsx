'use client';

import React from 'react';
import { Check, X, Film, Clock, User, Edit2 } from 'lucide-react';
import { ClipEligibleStat } from '@/lib/services/clipService';

interface QCStatCardProps {
  stat: ClipEligibleStat;
  isSelected: boolean;
  onSelect: () => void;
  onSeekToTime: () => void;
  onEdit?: () => void;
}

/**
 * Individual stat card for QC review
 * Shows stat details and clip eligibility status
 */
export function QCStatCard({ stat, isSelected, onSelect, onSeekToTime, onEdit }: QCStatCardProps) {
  // Format stat type for display
  const formatStatType = (type: string, modifier: string | null, points: number | null): string => {
    if (type === 'field_goal') {
      if (modifier === 'made') return points === 3 ? '3PT Made' : '2PT Made';
      return points === 3 ? '3PT Miss' : '2PT Miss';
    }
    if (type === 'free_throw') {
      return modifier === 'made' ? 'FT Made' : 'FT Miss';
    }
    if (type === 'rebound') {
      return modifier === 'offensive' ? 'OREB' : 'DREB';
    }
    return type.toUpperCase().replace('_', ' ');
  };

  // Format video timestamp
  const formatVideoTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format game clock
  const formatGameClock = (minutes: number, seconds: number): string => {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const statLabel = formatStatType(stat.stat_type, stat.modifier, stat.points);

  return (
    <div
      className={`
        relative p-3 rounded-lg border transition-all cursor-pointer
        ${isSelected 
          ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200' 
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
        }
      `}
      onClick={() => {
        onSelect();
        onSeekToTime(); // Seek video when clicking stat card
      }}
    >
      {/* Clip Eligibility Badge */}
      <div className="absolute top-2 right-2">
        {stat.is_clip_eligible ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <Film className="w-3 h-3" />
            Clip
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
            <X className="w-3 h-3" />
            No Clip
          </span>
        )}
      </div>

      {/* Stat Type */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`
          text-sm font-semibold px-2 py-0.5 rounded
          ${stat.is_clip_eligible 
            ? 'bg-orange-100 text-orange-700' 
            : 'bg-gray-100 text-gray-600'
          }
        `}>
          {statLabel}
        </span>
        {stat.points && stat.points > 0 && (
          <span className="text-xs text-gray-500">+{stat.points} pts</span>
        )}
      </div>

      {/* Player Name */}
      <div className="flex items-center gap-1.5 text-sm text-gray-700 mb-2">
        <User className="w-3.5 h-3.5 text-gray-400" />
        <span className="font-medium">{stat.player_name}</span>
      </div>

      {/* Time Info */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSeekToTime();
          }}
          className="flex items-center gap-1 hover:text-orange-600 transition-colors"
        >
          <Clock className="w-3 h-3" />
          <span>{formatVideoTime(stat.video_timestamp_ms)}</span>
        </button>
        <div className="flex items-center gap-2">
          <span>Q{stat.quarter} {formatGameClock(stat.game_time_minutes, stat.game_time_seconds)}</span>
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1 hover:bg-orange-100 text-gray-400 hover:text-orange-600 rounded transition-colors"
              title="Edit stat"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-2 left-2">
          <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        </div>
      )}
    </div>
  );
}

