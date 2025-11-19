'use client';

import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CoachTeam, CoachPlayer } from '@/lib/types/coach';
import { CoachPlayerService } from '@/lib/services/coachPlayerService';
import { CoachPlayerSelectionList } from './CoachPlayerSelectionList';
import { usePlayerProfileModal } from '@/hooks/usePlayerProfileModal';
import { PlayerProfileModal } from '@/components/player/PlayerProfileModal';

interface CoachPlayerManagementModalProps {
  team: CoachTeam;
  onClose: () => void;
  onUpdate: () => void;
}

/**
 * CoachPlayerManagementModal - Full player management interface
 * 
 * Features:
 * - Current roster display with remove functionality
 * - Add new players section
 * - Real-time player count updates
 * - Minimum players validation
 * 
 * Follows .cursorrules: <200 lines, single responsibility
 */
export function CoachPlayerManagementModal({ 
  team, 
  onClose, 
  onUpdate 
}: CoachPlayerManagementModalProps) {
  const { isOpen, playerId, isCustomPlayer, openModal, closeModal } = usePlayerProfileModal();
  // State
  const [currentPlayers, setCurrentPlayers] = useState<CoachPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingPlayer, setRemovingPlayer] = useState<string | null>(null);

  // Load current team players
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        setLoading(true);
        setError(null);
        const players = await CoachPlayerService.getCoachTeamPlayers(team.id);
        setCurrentPlayers(players);
      } catch (error) {
        console.error('❌ Error loading team players:', error);
        setError('Failed to load team players');
      } finally {
        setLoading(false);
      }
    };

    loadPlayers();
  }, [team.id]);

  // Handle player removal
  const handleRemovePlayer = async (player: CoachPlayer) => {
    if (!player.team_player_id) return;

    try {
      setRemovingPlayer(player.id);
      
      const response = await CoachPlayerService.removePlayerFromTeam({
        team_id: team.id,
        team_player_id: player.team_player_id
      });

      if (response.success) {
        // Update local state
        setCurrentPlayers(prev => prev.filter(p => p.id !== player.id));
        onUpdate();
      } else {
        setError(response.message || 'Failed to remove player');
      }
    } catch (error) {
      console.error('❌ Error removing player:', error);
      setError('Failed to remove player');
    } finally {
      setRemovingPlayer(null);
    }
  };

  // Handle player addition
  const handlePlayerAdd = (player: CoachPlayer) => {
    setCurrentPlayers(prev => [...prev, { ...player, is_on_team: true }]);
    onUpdate();
  };

  // Handle player removal from selection list
  const handlePlayerRemove = (player: CoachPlayer) => {
    setCurrentPlayers(prev => prev.filter(p => p.id !== player.id));
    onUpdate();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Manage Players - {team.name}
          </DialogTitle>
          <DialogDescription>
            Add or remove players from your team. You need at least 5 players to start tracking games.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 overflow-y-auto flex-1">
          {/* Current Roster */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Current Roster</h3>
              <Badge variant={currentPlayers.length >= 5 ? "default" : "secondary"}>
                {currentPlayers.length} player{currentPlayers.length !== 1 ? 's' : ''}
                {currentPlayers.length >= 5 && ' ✓'}
              </Badge>
            </div>

            {loading ? (
              // Loading skeleton
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
            ) : currentPlayers.length > 0 ? (
              // Current players list
              <>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {currentPlayers.map((player) => (
                    <div 
                      key={player.id}
                      onClick={() => openModal(player.id, { isCustomPlayer: player.is_custom_player || false })}
                      className="flex items-center gap-3 p-3 border rounded-lg bg-green-50 border-green-200 cursor-pointer hover:bg-green-100 transition-colors"
                    >
                      <Avatar className="w-10 h-10 border-2 border-green-200">
                        {(player.profile_photo_url || player.photo_url) && (
                          <AvatarImage 
                            src={player.profile_photo_url || player.photo_url || ''} 
                            alt={player.name} 
                            className="object-cover" 
                          />
                        )}
                        <AvatarFallback className="bg-green-100 text-green-600">
                          <Users className="w-4 h-4" />
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
                          handleRemovePlayer(player);
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
            ) : (
              // Empty state
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No players on this team yet</p>
                <p className="text-xs mt-1">Add players below to get started</p>
              </div>
            )}
          </div>

          {/* Add Players Section */}
          <div className="border-t pt-4">
            <CoachPlayerSelectionList
              teamId={team.id}
              onPlayerAdd={handlePlayerAdd}
              onPlayerRemove={handlePlayerRemove}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
          {currentPlayers.length >= 5 && (
            <Button onClick={onClose} className="flex-1">
              Done - Ready to Track!
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
