/**
 * Player Search Results
 * 
 * Purpose: Display search results with loading and empty states
 * Extracted to follow .cursorrules modular design
 * Follows .cursorrules: <100 lines, single responsibility (results display only)
 * 
 * @module PlayerSearchResults
 */

'use client';

import React from 'react';
import { Search, User } from 'lucide-react';
import { GenericPlayer } from '@/lib/types/playerManagement';
import { PlayerListItem } from './PlayerListItem';

interface PlayerSearchResultsProps {
  players: GenericPlayer[];
  loading: boolean;
  searchQuery: string;
  processingPlayer: string | null;
  onPlayerToggle: (player: GenericPlayer) => void;
}

/**
 * PlayerSearchResults - Search results display component
 * 
 * Features:
 * - Loading skeleton
 * - Player list
 * - No results state
 * - Initial state
 * 
 * Follows .cursorrules: <100 lines, single responsibility
 */
export function PlayerSearchResults({
  players,
  loading,
  searchQuery,
  processingPlayer,
  onPlayerToggle
}: PlayerSearchResultsProps) {
  if (loading) {
    // Loading skeleton
    return (
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
    );
  }

  // ✅ FIX: Filter out players already on team from the add players list
  const availablePlayers = players.filter(p => !p.is_on_team);
  
  if (availablePlayers.length > 0) {
    // Players list (only showing available players, not those already on team)
    return (
      <>
        {availablePlayers.map((player) => (
          <PlayerListItem
            key={player.id}
            player={player}
            processingPlayer={processingPlayer}
            onToggle={onPlayerToggle}
          />
        ))}
      </>
    );
  }

  if (searchQuery) {
    // No results
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No players found for "{searchQuery}"</p>
        <p className="text-xs mt-1">Try a different search term</p>
      </div>
    );
  }

  // Initial state
  return (
    <div className="text-center py-8 text-muted-foreground">
      <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
      <p className="text-sm">Search for players to add to your team</p>
      <p className="text-xs mt-1">Start typing a name or email above</p>
    </div>
  );
}

