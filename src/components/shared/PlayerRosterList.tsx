/**
 * Player Roster List
 * 
 * Purpose: Display current team roster with remove functionality
 * Extracted from PlayerManagementModal to follow .cursorrules
 * Follows .cursorrules: <200 lines, single responsibility (roster display only)
 * 
 * @module PlayerRosterList
 */

'use client';

import React from 'react';
import { Users, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { GenericPlayer } from '@/lib/types/playerManagement';

interface PlayerRosterListProps {
  players: GenericPlayer[];
  loading: boolean;
  removingPlayer: string | null;
  onRemovePlayer: (player: GenericPlayer) => void;
}

/**
 * PlayerRosterList - Current roster display component
 * 
 * Features:
 * - Loading skeleton
 * - Player list with details
 * - Remove button per player
 * - Empty state
 * 
 * Follows .cursorrules: <200 lines, single responsibility
 */
export function PlayerRosterList({
  players,
  loading,
  removingPlayer,
  onRemovePlayer
}: PlayerRosterListProps) {
  if (loading) {
    // Loading skeleton
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 border rounded-lg animate-pulse">
            <div className="w-8 h-8 bg-muted rounded-full" />
            <div className="flex-1 space-y-1">
              <div className="h-4 bg-muted rounded w-32" />
              <div className="h-3 bg-muted rounded w-48" />
            </div>
            <div className="w-16 h-6 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (players.length === 0) {
    // Empty state
    return (
      <div className="text-center py-8 text-muted-foreground border rounded-lg">
        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No players on this team yet</p>
        <p className="text-xs mt-1">Add players below to get started</p>
      </div>
    );
  }

  // Current players list
  return (
    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 game-viewer-scroll border rounded-lg p-2">
      {players.map((player) => (
        <div 
          key={player.id}
          className="flex items-center gap-3 p-3 border rounded-lg bg-green-50 border-green-200"
        >
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-green-600" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm">{player.name}</h4>
              {player.is_custom_player && (
                <Badge variant="outline" className="text-xs">Custom</Badge>
              )}
            </div>
            {player.email ? (
              <p className="text-xs text-muted-foreground truncate">{player.email}</p>
            ) : player.jersey_number ? (
              <p className="text-xs text-muted-foreground">#{player.jersey_number}</p>
            ) : (
              <p className="text-xs text-muted-foreground">Team-specific player</p>
            )}
          </div>

          {player.premium_status && (
            <Badge variant="secondary" className="text-xs">Premium</Badge>
          )}

          <Button
            size="sm"
            variant="destructive"
            onClick={() => onRemovePlayer(player)}
            disabled={removingPlayer === player.id}
            className="gap-1"
          >
            <Trash2 className="w-3 h-3" />
            {removingPlayer === player.id ? 'Removing...' : 'Remove'}
          </Button>
        </div>
      ))}
    </div>
  );
}

