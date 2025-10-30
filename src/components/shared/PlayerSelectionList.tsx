/**
 * Player Selection List (Generic/Shared)
 * 
 * Purpose: Reusable player search and selection interface
 * Uses service injection for Coach/Organizer flexibility
 * Follows .cursorrules: <200 lines, single responsibility (selection UI only)
 * 
 * @module PlayerSelectionList
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, UserPlus, Users } from 'lucide-react';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { IPlayerManagementService, GenericPlayer } from '@/lib/types/playerManagement';
import { PlayerSearchResults } from './PlayerSearchResults';
import { CustomPlayerForm } from './CustomPlayerForm';

interface PlayerSelectionListProps {
  teamId: string;
  service: IPlayerManagementService;
  onPlayerAdd: (player: GenericPlayer) => void;
  onPlayerRemove: (player: GenericPlayer) => void;
  className?: string;
  showCustomPlayerOption?: boolean; // Optional: hide for Organizer
  deferPersistence?: boolean; // If true, don't call service - just track locally (for team creation)
  initialSelectedPlayers?: GenericPlayer[]; // Pre-selected players (for team creation when going back)
}

/**
 * PlayerSelectionList - Player search and selection component
 * 
 * Features:
 * - Real-time search with debouncing (300ms)
 * - Mode toggle: Search / Create Custom
 * - Player list with add/remove
 * - Loading states
 * - Empty states
 * 
 * Follows .cursorrules: <200 lines, single responsibility
 */
export function PlayerSelectionList({ 
  teamId, 
  service,
  onPlayerAdd, 
  onPlayerRemove, 
  className = '',
  showCustomPlayerOption = true,
  deferPersistence = false,
  initialSelectedPlayers = []
}: PlayerSelectionListProps) {
  // Mode state
  const [mode, setMode] = useState<'search' | 'create'>('search');
  
  // State
  const [players, setPlayers] = useState<GenericPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [processingPlayer, setProcessingPlayer] = useState<string | null>(null);

  // Debounced search
  const searchPlayers = useCallback(async (query: string, selectedPlayerIds: string[] = []) => {
    try {
      setLoading(true);
      setError(null);

      const results = await service.searchAvailablePlayers({
        query: query.trim() || undefined,
        exclude_team_id: teamId,
        limit: 50
      });
      
      // Mark initially selected players as is_on_team
      const resultsWithSelection = results.map(player => {
        const isSelected = selectedPlayerIds.includes(player.id);
        return {
          ...player,
          is_on_team: isSelected
        };
      });
      
      setPlayers(resultsWithSelection);
    } catch (error) {
      console.error('❌ Error searching players:', error);
      setError('Failed to search players');
    } finally {
      setLoading(false);
    }
  }, [teamId, service]);

  // Initial load with selected players
  useEffect(() => {
    const selectedIds = initialSelectedPlayers.map(p => p.id);
    searchPlayers('', selectedIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Search effect with debouncing (for search query changes)
  useEffect(() => {
    if (searchQuery === '') return; // Skip empty search (handled by initial load)
    
    const timeoutId = setTimeout(() => {
      // Get current selections without triggering re-render
      setPlayers(currentPlayers => {
        const currentSelectedIds = currentPlayers.filter(p => p.is_on_team).map(p => p.id);
        searchPlayers(searchQuery, currentSelectedIds);
        return currentPlayers; // Return unchanged to avoid re-render
      });
    }, 300); // Debounce 300ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchPlayers]);

  // Handle player toggle
  const handlePlayerToggle = async (player: GenericPlayer) => {
    try {
      setProcessingPlayer(player.id);

      if (deferPersistence) {
        // Team creation mode: just track locally, don't persist yet
        if (player.is_on_team) {
          // Remove from local selection
          setPlayers(prev => prev.map(p => 
            p.id === player.id ? { ...p, is_on_team: false } : p
          ));
          onPlayerRemove(player);
        } else {
          // Add to local selection
          setPlayers(prev => prev.map(p => 
            p.id === player.id ? { ...p, is_on_team: true } : p
          ));
          onPlayerAdd(player);
        }
      } else {
        // Normal mode: persist to database immediately
        if (player.is_on_team && player.team_player_id) {
          // Remove player
          const response = await service.removePlayerFromTeam({
            team_id: teamId,
            team_player_id: player.team_player_id
          });

          if (response.success) {
            setPlayers(prev => prev.map(p => 
              p.id === player.id ? { ...p, is_on_team: false, team_player_id: undefined } : p
            ));
            onPlayerRemove(player);
          } else {
            setError(response.message || response.error || 'Failed to remove player');
          }
        } else {
          // Add player
          const response = await service.addPlayerToTeam({
            team_id: teamId,
            player_id: player.id
          });

          if (response.success) {
            setPlayers(prev => prev.map(p => 
              p.id === player.id ? { ...p, is_on_team: true } : p
            ));
            onPlayerAdd(player);
          } else {
            setError(response.message || response.error || 'Failed to add player');
          }
        }
      }
    } catch (error) {
      console.error('❌ Error toggling player:', error);
      setError('Failed to update player');
    } finally {
      setProcessingPlayer(null);
    }
  };

  // Handle custom player creation
  const handleCustomPlayerCreated = (player: GenericPlayer) => {
    onPlayerAdd(player);
    setMode('search');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with Mode Toggle */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {mode === 'search' ? (
              <Search className="w-5 h-5 text-muted-foreground" />
            ) : (
              <UserPlus className="w-5 h-5 text-muted-foreground" />
            )}
            <h3 className="text-lg font-semibold">
              {mode === 'search' ? 'Add Players' : 'Create Custom Player'}
            </h3>
          </div>
          
          {/* Mode Toggle - Only show if custom players supported */}
          {showCustomPlayerOption && (
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              <Button
                size="sm"
                variant={mode === 'search' ? 'default' : 'ghost'}
                onClick={() => setMode('search')}
                className="gap-2 h-8"
              >
                <Users className="w-4 h-4" />
                Search Users
              </Button>
              <Button
                size="sm"
                variant={mode === 'create' ? 'default' : 'ghost'}
                onClick={() => setMode('create')}
                className="gap-2 h-8"
              >
                <UserPlus className="w-4 h-4" />
                Create Custom
              </Button>
            </div>
          )}
        </div>
        
        {mode === 'search' && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search players by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      )}

      {/* Content Area */}
      {mode === 'search' ? (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          <PlayerSearchResults
            players={players}
            loading={loading}
            searchQuery={searchQuery}
            processingPlayer={processingPlayer}
            onPlayerToggle={handlePlayerToggle}
          />
        </div>
      ) : (
        // Create mode
        <CustomPlayerForm
          teamId={teamId}
          service={service}
          onPlayerCreated={handleCustomPlayerCreated}
          onCancel={() => setMode('search')}
        />
      )}
    </div>
  );
}

