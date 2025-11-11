'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Check, User, Crown, Mail, UserPlus, Users, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CoachPlayer, SearchPlayersRequest } from '@/lib/types/coach';
import { CoachPlayerService } from '@/lib/services/coachPlayerService';
import { CreateCustomPlayerForm } from './CreateCustomPlayerForm';
import { usePlayerProfileModal } from '@/hooks/usePlayerProfileModal';
import { PlayerProfileModal } from '@/components/player/PlayerProfileModal';
import { MigrationChecker } from '@/lib/utils/migrationChecker';

interface CoachPlayerSelectionListProps {
  teamId: string;
  onPlayerAdd: (player: CoachPlayer) => void;
  onPlayerRemove: (player: CoachPlayer) => void;
  className?: string;
}

/**
 * CoachPlayerSelectionList - Modern list UI for player selection
 * 
 * Features:
 * - Real-time search with debouncing
 * - List-based UI (not card-based) 
 * - Player selection with toggle states
 * - Premium status indicators
 * - Add/Remove actions
 * 
 * Follows .cursorrules: <200 lines, single responsibility
 */
export function CoachPlayerSelectionList({ 
  teamId, 
  onPlayerAdd, 
  onPlayerRemove, 
  className = '' 
}: CoachPlayerSelectionListProps) {
  const { isOpen, playerId, openModal, closeModal } = usePlayerProfileModal();
  // Mode state
  const [mode, setMode] = useState<'search' | 'create'>('search');
  
  // State
  const [players, setPlayers] = useState<CoachPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [processingPlayer, setProcessingPlayer] = useState<string | null>(null);
  
  // Migration status
  const [migrationStatus, setMigrationStatus] = useState<{
    isComplete: boolean;
    message?: string;
  } | null>(null);

  // Debounced search
  const searchPlayers = useCallback(async (query: string) => {
    try {
      setLoading(true);
      setError(null);

      const request: SearchPlayersRequest = {
        query: query.trim() || undefined,
        exclude_team_id: teamId,
        limit: 50
      };

      const results = await CoachPlayerService.searchAvailablePlayers(request);
      setPlayers(results);
    } catch (error) {
      console.error('❌ Error searching players:', error);
      setError('Failed to search players');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  // Check migration status on mount
  useEffect(() => {
    const checkMigration = async () => {
      const status = await MigrationChecker.hasCustomPlayersMigration();
      setMigrationStatus({
        isComplete: status.isComplete,
        message: status.message
      });
    };
    
    checkMigration();
  }, []);

  // Initial load and search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchPlayers(searchQuery);
    }, 300); // Debounce 300ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchPlayers]);

  // Handle player toggle
  const handlePlayerToggle = async (player: CoachPlayer) => {
    try {
      setProcessingPlayer(player.id);

      if (player.is_on_team) {
        // Remove player
        const response = await CoachPlayerService.removePlayerFromTeam({
          team_id: teamId,
          team_player_id: player.team_player_id!
        });

        if (response.success) {
          // Update local state
          setPlayers(prev => prev.map(p => 
            p.id === player.id ? { ...p, is_on_team: false, team_player_id: undefined } : p
          ));
          onPlayerRemove(player);
        } else {
          setError(response.message || 'Failed to remove player');
        }
      } else {
        // Add player
        const response = await CoachPlayerService.addPlayerToTeam({
          team_id: teamId,
          player_id: player.id
        });

        if (response.success) {
          // Update local state
          setPlayers(prev => prev.map(p => 
            p.id === player.id ? { ...p, is_on_team: true } : p
          ));
          onPlayerAdd(player);
        } else {
          setError(response.message || 'Failed to add player');
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
  const handleCustomPlayerCreated = (player: CoachPlayer) => {
    onPlayerAdd(player);
    setMode('search'); // Switch back to search mode
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
          
          {/* Mode Toggle */}
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
        /* Search Mode - Players List */
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {loading ? (
          // Loading skeleton
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 border rounded-lg animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-32" />
                  <div className="h-3 bg-muted rounded w-48" />
                </div>
                <div className="w-20 h-8 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : players.length > 0 ? (
          // Players list
          <>
            {players.map((player) => (
              <div 
                key={player.id}
                onClick={() => openModal(player.id)}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              >
              {/* Avatar */}
              <div className="relative">
                <Avatar className="w-10 h-10 border-2 border-primary/20">
                  {(player.profile_photo_url || player.photo_url) && (
                    <AvatarImage 
                      src={player.profile_photo_url || player.photo_url || ''} 
                      alt={player.name} 
                      className="object-cover" 
                    />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <User className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                {player.is_on_team && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {/* Player Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm truncate">{player.name}</h4>
                  {player.premium_status && (
                    <Crown className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
                
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{player.email}</span>
                </div>
              </div>

              {/* Status & Action */}
              <div className="flex items-center gap-2">
                {player.premium_status && (
                  <Badge variant="secondary" className="text-xs">
                    Premium
                  </Badge>
                )}
                
                <Button
                  size="sm"
                  variant={player.is_on_team ? "destructive" : "default"}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayerToggle(player);
                  }}
                  disabled={processingPlayer === player.id}
                  className="min-w-[80px]"
                >
                  {processingPlayer === player.id ? (
                    'Loading...'
                  ) : player.is_on_team ? (
                    'Remove'
                  ) : (
                    'Add'
                  )}
                </Button>
              </div>
            </div>
            ))}
            </>
        ) : searchQuery ? (
          // No results
          <div className="text-center py-8 text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No players found for "{searchQuery}"</p>
            <p className="text-xs mt-1">Try a different search term</p>
          </div>
        ) : (
          // Initial state
          <div className="text-center py-8 text-muted-foreground">
            <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Search for players to add to your team</p>
            <p className="text-xs mt-1">Start typing a name or email above</p>
          </div>
        )}
        </div>
      ) : (
        /* Create Mode - Custom Player Form */
        <div className="space-y-4">
          {migrationStatus && !migrationStatus.isComplete && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-orange-800 text-sm">
                <AlertCircle className="w-4 h-4" />
                <strong>Migration Required</strong>
              </div>
              <p className="text-orange-700 text-sm mt-1">
                {migrationStatus.message}
              </p>
              <p className="text-orange-600 text-xs mt-2">
                For now, you can add existing StatJam users to your team using the "Search Users" tab.
              </p>
            </div>
          )}
          
          <CreateCustomPlayerForm
            teamId={teamId}
            onPlayerCreated={handleCustomPlayerCreated}
            onCancel={() => setMode('search')}
          />
        </div>
      )}
    </div>
  );
}
