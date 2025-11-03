/**
 * Player Management Modal (Generic/Shared)
 * 
 * Purpose: Reusable player management interface for Coach and Organizer dashboards
 * Uses service injection pattern for flexibility
 * Follows .cursorrules: <200 lines, single responsibility (modal container only)
 * 
 * @module PlayerManagementModal
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { IPlayerManagementService, GenericPlayer, GenericTeam } from '@/lib/types/playerManagement';
import { PlayerRosterList } from './PlayerRosterList';
import { PlayerSelectionList } from './PlayerSelectionList';

interface PlayerManagementModalProps {
  team: GenericTeam;
  service: IPlayerManagementService;
  onClose: () => void;
  onUpdate: () => void;
  minPlayers?: number;
}

/**
 * PlayerManagementModal - Generic player management interface
 * 
 * Features:
 * - Current roster display with remove functionality
 * - Add new players section
 * - Real-time player count updates
 * - Minimum players validation
 * - Service injection for Coach/Organizer flexibility
 * 
 * Follows .cursorrules: <200 lines, single responsibility
 */
export function PlayerManagementModal({ 
  team, 
  service,
  onClose, 
  onUpdate,
  minPlayers = 5
}: PlayerManagementModalProps) {
  // 🔍 DEBUG: Verify new modal is loading
  console.log('✅ NEW PlayerManagementModal loaded for team:', team.name);
  
  // State
  const [currentPlayers, setCurrentPlayers] = useState<GenericPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingPlayer, setRemovingPlayer] = useState<string | null>(null);

  // Load current team players
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        setLoading(true);
        setError(null);
        const players = await service.getTeamPlayers(team.id);
        setCurrentPlayers(players);
      } catch (error) {
        console.error('❌ Error loading team players:', error);
        setError('Failed to load team players');
      } finally {
        setLoading(false);
      }
    };

    loadPlayers();
  }, [team.id, service]);

  // Handle player removal
  const handleRemovePlayer = async (player: GenericPlayer) => {
    if (!player.team_player_id) return;

    try {
      setRemovingPlayer(player.id);
      
      const response = await service.removePlayerFromTeam({
        team_id: team.id,
        team_player_id: player.team_player_id
      });

      if (response.success) {
        // Update local state
        setCurrentPlayers(prev => prev.filter(p => p.id !== player.id));
        onUpdate();
      } else {
        setError(response.message || response.error || 'Failed to remove player');
      }
    } catch (error) {
      console.error('❌ Error removing player:', error);
      setError('Failed to remove player');
    } finally {
      setRemovingPlayer(null);
    }
  };

  // Handle player addition
  const handlePlayerAdd = (player: GenericPlayer) => {
    setCurrentPlayers(prev => [...prev, { ...player, is_on_team: true }]);
    onUpdate();
  };

  // Handle player removal from selection list
  const handlePlayerRemove = (player: GenericPlayer) => {
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
            Add or remove players from your team. You need at least {minPlayers} players to start tracking games.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 overflow-y-auto flex-1">
          {/* Current Roster */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Current Roster</h3>
              <Badge variant={currentPlayers.length >= minPlayers ? "default" : "secondary"}>
                {currentPlayers.length} player{currentPlayers.length !== 1 ? 's' : ''}
                {currentPlayers.length >= minPlayers && ' ✓'}
              </Badge>
            </div>

            <PlayerRosterList
              players={currentPlayers}
              loading={loading}
              removingPlayer={removingPlayer}
              onRemovePlayer={handleRemovePlayer}
            />
          </div>

          {/* Add Players Section */}
          <div className="border-t pt-4">
            <PlayerSelectionList
              key={currentPlayers.map(p => p.id).join(',')}
              teamId={team.id}
              service={service}
              onPlayerAdd={handlePlayerAdd}
              onPlayerRemove={handlePlayerRemove}
              showCustomPlayerOption={false}
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
          {currentPlayers.length >= minPlayers && (
            <Button onClick={onClose} className="flex-1">
              Done - Ready to Track!
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

