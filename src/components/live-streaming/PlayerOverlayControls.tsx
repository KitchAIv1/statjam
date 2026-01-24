/**
 * PlayerOverlayControls Component
 * 
 * Controls for triggering NBA-style player stats overlays.
 * Displays team rosters and allows manual/auto triggering.
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/switch';
import { User, X, Zap } from 'lucide-react';
import { GamePlayer } from '@/hooks/useGamePlayers';
import { PlayerStatsOverlayData } from '@/lib/services/canvas-overlay';

interface PlayerOverlayControlsProps {
  teamAPlayers: GamePlayer[];
  teamBPlayers: GamePlayer[];
  teamAName: string;
  teamBName: string;
  teamAPrimaryColor?: string;
  teamBPrimaryColor?: string;
  activePlayerStats: PlayerStatsOverlayData | null;
  autoTriggerEnabled: boolean;
  loading?: boolean;
  onTriggerPlayer: (player: GamePlayer) => void;
  onHideOverlay: () => void;
  onToggleAutoTrigger: (enabled: boolean) => void;
}

export function PlayerOverlayControls({
  teamAPlayers,
  teamBPlayers,
  teamAName,
  teamBName,
  teamAPrimaryColor,
  teamBPrimaryColor,
  activePlayerStats,
  autoTriggerEnabled,
  loading,
  onTriggerPlayer,
  onHideOverlay,
  onToggleAutoTrigger,
}: PlayerOverlayControlsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Player Stats Overlay
            </CardTitle>
            <CardDescription>
              Show NBA-style player stats during free throws
            </CardDescription>
          </div>
          {activePlayerStats?.isVisible && (
            <Button
              variant="outline"
              size="sm"
              onClick={onHideOverlay}
              className="text-destructive"
            >
              <X className="h-4 w-4 mr-1" />
              Hide
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Auto-trigger toggle */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">Auto-trigger on Free Throws</span>
          </div>
          <Switch
            checked={autoTriggerEnabled}
            onCheckedChange={onToggleAutoTrigger}
          />
        </div>

        {/* Currently showing indicator */}
        {activePlayerStats?.isVisible && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-400">
              <span className="font-semibold">● Showing:</span>{' '}
              #{activePlayerStats.jerseyNumber} {activePlayerStats.playerName}
              <span className="text-muted-foreground ml-2">(auto-hides in 7s)</span>
            </p>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Loading players...
          </p>
        )}

        {/* Team rosters */}
        {!loading && (
          <div className="grid grid-cols-2 gap-4">
            {/* Team A */}
            <TeamRoster
              teamName={teamAName}
              players={teamAPlayers}
              teamColor={teamAPrimaryColor}
              activePlayerId={activePlayerStats?.playerId}
              onSelectPlayer={onTriggerPlayer}
              label="Away"
            />

            {/* Team B */}
            <TeamRoster
              teamName={teamBName}
              players={teamBPlayers}
              teamColor={teamBPrimaryColor}
              activePlayerId={activePlayerStats?.playerId}
              onSelectPlayer={onTriggerPlayer}
              label="Home"
            />
          </div>
        )}

        {/* Empty state */}
        {!loading && teamAPlayers.length === 0 && teamBPlayers.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No players found. Select a game with active rosters.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/** Team roster sub-component */
interface TeamRosterProps {
  teamName: string;
  players: GamePlayer[];
  teamColor?: string;
  activePlayerId?: string;
  label: string;
  onSelectPlayer: (player: GamePlayer) => void;
}

function TeamRoster({
  teamName,
  players,
  teamColor,
  activePlayerId,
  label,
  onSelectPlayer,
}: TeamRosterProps) {
  const borderColor = teamColor || '#6B7280';

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: borderColor }}
        />
        <span className="text-xs text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        <span className="text-sm font-semibold truncate">{teamName}</span>
      </div>

      <div className="space-y-1 max-h-48 overflow-y-auto">
        {players.map((player) => (
          <button
            key={player.id}
            onClick={() => onSelectPlayer(player)}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors
              ${activePlayerId === player.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/50 hover:bg-muted'
              }`}
            style={{
              borderLeft: `3px solid ${borderColor}`,
            }}
          >
            <span className="font-mono text-xs w-6">
              {player.jerseyNumber !== undefined ? `#${player.jerseyNumber}` : '--'}
            </span>
            <span className="truncate">{player.name}</span>
          </button>
        ))}
        {players.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            No players
          </p>
        )}
      </div>
    </div>
  );
}
