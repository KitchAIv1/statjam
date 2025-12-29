'use client';

/**
 * CompactTeamCard - Micro team card for mission control dashboard
 * 
 * Shows essential team info in a compact, clickable card format.
 * Designed for horizontal strip display.
 * 
 * Follows .cursorrules: <100 lines, UI only, single responsibility
 */

import React from 'react';
import { Users, PlayCircle, Video, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CoachTeam } from '@/lib/types/coach';

interface CompactTeamCardProps {
  team: CoachTeam;
  onQuickTrack: (team: CoachTeam) => void;
  onVideoTrack: (team: CoachTeam) => void;
  onManage: (team: CoachTeam) => void;
  onAnalytics: (team: CoachTeam) => void;
  hasVideoAccess: boolean;
}

export function CompactTeamCard({
  team,
  onQuickTrack,
  onVideoTrack,
  onManage,
  onAnalytics,
  hasVideoAccess,
}: CompactTeamCardProps) {
  const canTrack = (team.player_count || 0) >= 5;

  return (
    <div className="flex-shrink-0 w-[160px] bg-white border border-gray-200 rounded-xl p-3 hover:shadow-lg hover:border-orange-300 transition-all duration-200 group">
      {/* Team Logo/Icon + Name */}
      <div className="flex items-center gap-2 mb-2">
        {team.logo ? (
          <img 
            src={team.logo} 
            alt={team.name} 
            className="w-8 h-8 rounded-lg object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
            <Users className="w-4 h-4 text-orange-500" />
          </div>
        )}
        <h3 className="font-semibold text-sm text-gray-900 truncate flex-1">{team.name}</h3>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {team.player_count || 0}
        </span>
        <span className="flex items-center gap-1">
          <PlayCircle className="w-3 h-3" />
          {team.games_count || 0}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-1">
        <Button
          onClick={() => onQuickTrack(team)}
          size="sm"
          disabled={!canTrack}
          className="flex-1 h-7 text-xs px-2 gap-1"
        >
          <PlayCircle className="w-3 h-3" />
          Track
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 w-7 p-0 !border-gray-200">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {hasVideoAccess && (
              <DropdownMenuItem onClick={() => onVideoTrack(team)} disabled={!canTrack}>
                <Video className="w-4 h-4 mr-2" />
                Video Track
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onManage(team)}>
              <Users className="w-4 h-4 mr-2" />
              Manage Roster
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAnalytics(team)}>
              <PlayCircle className="w-4 h-4 mr-2" />
              Analytics
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Warning badge if not enough players */}
      {!canTrack && (
        <Badge variant="outline" className="mt-2 w-full justify-center text-[10px] text-amber-600 border-amber-300">
          Need 5+ players
        </Badge>
      )}
    </div>
  );
}

