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

import React, { useState } from 'react';
import { Users, Trash2, User, Edit } from 'lucide-react';
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { GenericPlayer } from '@/lib/types/playerManagement';
import { usePlayerProfileModal } from '@/hooks/usePlayerProfileModal';
import { PlayerProfileModal } from '@/components/player/PlayerProfileModal';
import { EditCustomPlayerModal } from '@/components/shared/EditCustomPlayerModal';
import { GenerateClaimLinkButton } from '@/components/shared/GenerateClaimLinkButton';

interface PlayerRosterListProps {
  players: GenericPlayer[];
  loading: boolean;
  removingPlayer: string | null;
  onRemovePlayer: (player: GenericPlayer) => void;
  onEditPlayer?: (player: GenericPlayer) => void; // Optional: for custom player editing
  showEditButton?: boolean; // Optional: show edit button for custom players
  showClaimButton?: boolean; // Optional: show claim link button for custom players
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
  onRemovePlayer,
  onEditPlayer,
  showEditButton = false,
  showClaimButton = false
}: PlayerRosterListProps) {
  const { isOpen, playerId, isCustomPlayer, openModal, closeModal } = usePlayerProfileModal();
  const [editingPlayer, setEditingPlayer] = useState<GenericPlayer | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
    // Empty state - flexible height
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-lg min-h-[200px] flex flex-col items-center justify-center">
        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm font-medium">No players on this team yet</p>
        <p className="text-xs mt-1">Add players below to get started</p>
      </div>
    );
  }

  // Current players list
  return (
    <>
      <div className="space-y-2 min-h-[200px] max-h-[400px] overflow-y-auto pr-2 game-viewer-scroll border rounded-lg p-3">
        {players.map((player) => (
          <div 
            key={player.id}
            onClick={() => openModal(player.id, { isCustomPlayer: player.is_custom_player || false })}
            className="flex items-center gap-3 p-3 border rounded-lg bg-green-50 border-green-200 cursor-pointer hover:bg-green-100 transition-colors relative overflow-visible"
          >
            <Avatar className="w-10 h-10 border-2 border-green-200 flex-shrink-0">
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

            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm truncate">{player.name}</h4>
                {player.is_custom_player && (
                  <Badge variant="outline" className="text-xs flex-shrink-0">Custom</Badge>
                )}
              </div>
              {player.email ? (
                <p className="text-xs text-muted-foreground truncate">{player.email}</p>
              ) : player.jersey_number !== undefined && player.jersey_number !== null ? (
                <p className="text-xs text-muted-foreground">#{player.jersey_number}</p>
              ) : player.is_custom_player ? (
                <p className="text-xs text-muted-foreground">&nbsp;</p>
              ) : (
                <p className="text-xs text-muted-foreground">Team-specific player</p>
              )}
            </div>

            {player.premium_status && (
              <Badge variant="secondary" className="text-xs flex-shrink-0">Premium</Badge>
            )}

            <div className="flex items-center gap-2 flex-shrink-0 relative z-10">
              {/* Claim Link button - only for custom players when showClaimButton is true */}
              {showClaimButton && player.is_custom_player === true && (
                <GenerateClaimLinkButton
                  customPlayerId={player.id}
                  playerName={player.name}
                />
              )}

              {/* Edit button - only for custom players when showEditButton is true */}
              {showEditButton && player.is_custom_player === true ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    console.log('✏️ Edit button clicked for custom player:', player.id, player.name);
                    setEditingPlayer(player);
                    setIsEditModalOpen(true);
                  }}
                  className="gap-1.5 hover:bg-primary/10 hover:text-primary hover:border-primary/50 whitespace-nowrap"
                  title="Edit Player"
                >
                  <Edit className="w-4 h-4" />
                  <span className="text-xs">Edit</span>
                </Button>
              ) : null}

              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onRemovePlayer(player);
                }}
                disabled={removingPlayer === player.id}
                className="gap-1.5 whitespace-nowrap"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-xs">{removingPlayer === player.id ? 'Removing...' : 'Remove'}</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Player Profile Modal */}
      {playerId && (
        <PlayerProfileModal isOpen={isOpen} onClose={closeModal} playerId={playerId || ''} isCustomPlayer={isCustomPlayer || false} />
      )}

      {/* Edit Custom Player Modal */}
      {editingPlayer && editingPlayer.is_custom_player && (
        <EditCustomPlayerModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingPlayer(null);
          }}
          customPlayer={{
            id: editingPlayer.id,
            name: editingPlayer.name,
            jersey_number: editingPlayer.jersey_number,
            position: editingPlayer.position,
            profile_photo_url: editingPlayer.profile_photo_url || null,
            pose_photo_url: (editingPlayer as any).pose_photo_url || null
          }}
          onSave={async (updatedPlayer) => {
            // Call parent callback if provided
            if (onEditPlayer) {
              onEditPlayer(updatedPlayer as GenericPlayer);
            }
            setIsEditModalOpen(false);
            setEditingPlayer(null);
          }}
        />
      )}
    </>
  );
}

