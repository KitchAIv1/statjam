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
import { Users, Trash2, User } from 'lucide-react';
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { GenericPlayer } from '@/lib/types/playerManagement';
import { usePlayerProfileModal } from '@/hooks/usePlayerProfileModal';
import { PlayerProfileModal } from '@/components/player/PlayerProfileModal';

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
  const { isOpen, playerId, isCustomPlayer, openModal, closeModal } = usePlayerProfileModal();
  if (loading) {
    // Loading skeleton
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 border rounded-lg animate-pulse">
            <div className="w-10 h-10 bg-muted rounded-lg" />
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
    <>
      <div className="space-y-2 min-h-[320px] max-h-[400px] overflow-y-auto pr-2 game-viewer-scroll border rounded-lg p-3">
        {players.map((player) => (
          <div 
            key={player.id}
            onClick={() => openModal(player.id, { isCustomPlayer: player.is_custom_player || false })}
            className="flex items-center gap-3 p-3 border rounded-lg bg-green-50 border-green-200 cursor-pointer hover:bg-green-100 transition-colors"
          >
            <Avatar className="w-10 h-10 border-2 border-green-200">
              {(player.profile_photo_url || (player as any).photo_url) && (
                <AvatarImage 
                  src={player.profile_photo_url || (player as any).photo_url || ''} 
                  alt={player.name} 
                  className="object-cover" 
                />
              )}
              <AvatarFallback className="bg-green-100 text-green-600">
                <User className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>

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
              onClick={(e) => {
                e.stopPropagation();
                onRemovePlayer(player);
              }}
              disabled={removingPlayer === player.id}
              className="gap-1"
            >
              <Trash2 className="w-3 h-3" />
              {removingPlayer === player.id ? 'Removing...' : 'Remove'}
            </Button>
          </div>
        ))}
      </div>
      
      {/* Player Profile Modal */}
      {playerId && (
        <PlayerProfileModal isOpen={isOpen} onClose={closeModal} playerId={playerId || ''} isCustomPlayer={isCustomPlayer || false} />
      )}
    </>
  );
}

