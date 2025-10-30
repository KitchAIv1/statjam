/**
 * Player List Item
 * 
 * Purpose: Individual player row in search results
 * Extracted to follow .cursorrules modular design
 * Follows .cursorrules: <100 lines, single responsibility (player row only)
 * 
 * @module PlayerListItem
 */

'use client';

import React from 'react';
import { Check, User, Crown, Mail } from 'lucide-react';
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { GenericPlayer } from '@/lib/types/playerManagement';

interface PlayerListItemProps {
  player: GenericPlayer;
  processingPlayer: string | null;
  onToggle: (player: GenericPlayer) => void;
}

/**
 * PlayerListItem - Individual player row component
 * 
 * Features:
 * - Player avatar with on-team indicator
 * - Player info (name, email, premium status)
 * - Add/Remove button
 * 
 * Follows .cursorrules: <100 lines, single responsibility
 */
export function PlayerListItem({
  player,
  processingPlayer,
  onToggle
}: PlayerListItemProps) {
  return (
    <div 
      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
    >
      {/* Avatar */}
      <div className="relative">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-primary" />
        </div>
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
        
        {player.email && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Mail className="w-3 h-3" />
            <span className="truncate">{player.email}</span>
          </div>
        )}
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
          onClick={() => onToggle(player)}
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
  );
}

