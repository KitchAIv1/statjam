/**
 * OverlayControlPanel Component
 * 
 * Unified control panel for all overlay types:
 * - Player Stats (NBA-style)
 * - Upcoming Events (placeholder)
 * - Season Stats (placeholder)
 * - Player of Game (placeholder)
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Calendar, BarChart3, Trophy, Zap, X } from 'lucide-react';
import { GamePlayer } from '@/hooks/useGamePlayers';
import { PlayerStatsOverlayData } from '@/lib/services/canvas-overlay';

interface OverlayControlPanelProps {
  teamAPlayers: GamePlayer[];
  teamBPlayers: GamePlayer[];
  teamAName: string;
  teamBName: string;
  teamAPrimaryColor?: string;
  teamBPrimaryColor?: string;
  activePlayerStats: PlayerStatsOverlayData | null;
  autoTriggerEnabled: boolean;
  playersLoading?: boolean;
  onTriggerPlayer: (player: GamePlayer) => void;
  onHideOverlay: () => void;
  onToggleAutoTrigger: (enabled: boolean) => void;
}

export function OverlayControlPanel({
  teamAPlayers,
  teamBPlayers,
  teamAName,
  teamBName,
  teamAPrimaryColor,
  teamBPrimaryColor,
  activePlayerStats,
  autoTriggerEnabled,
  playersLoading,
  onTriggerPlayer,
  onHideOverlay,
  onToggleAutoTrigger,
}: OverlayControlPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Overlay Controls</CardTitle>
            <CardDescription className="text-xs">
              Manage broadcast overlays
            </CardDescription>
          </div>
          {activePlayerStats?.isVisible && (
            <Button variant="outline" size="sm" onClick={onHideOverlay} className="h-7 text-xs">
              <X className="h-3 w-3 mr-1" />
              Hide Active
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs defaultValue="player-stats" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-8">
            <TabsTrigger value="player-stats" className="text-xs px-2">
              <User className="h-3 w-3 mr-1" />
              Player
            </TabsTrigger>
            <TabsTrigger value="events" className="text-xs px-2" disabled>
              <Calendar className="h-3 w-3 mr-1" />
              Events
            </TabsTrigger>
            <TabsTrigger value="season" className="text-xs px-2" disabled>
              <BarChart3 className="h-3 w-3 mr-1" />
              Season
            </TabsTrigger>
            <TabsTrigger value="potg" className="text-xs px-2" disabled>
              <Trophy className="h-3 w-3 mr-1" />
              POTG
            </TabsTrigger>
          </TabsList>

          {/* Player Stats Tab */}
          <TabsContent value="player-stats" className="mt-3 space-y-3">
            {/* Auto-trigger toggle */}
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
              <div className="flex items-center gap-2">
                <Zap className="h-3 w-3 text-yellow-500" />
                <span className="text-xs">Auto on Free Throws</span>
              </div>
              <Switch
                checked={autoTriggerEnabled}
                onCheckedChange={onToggleAutoTrigger}
              />
            </div>

            {/* Active indicator */}
            {activePlayerStats?.isVisible && (
              <div className="p-2 bg-green-500/10 border border-green-500/30 rounded-md">
                <p className="text-xs text-green-600 dark:text-green-400">
                  ● #{activePlayerStats.jerseyNumber} {activePlayerStats.playerName}
                </p>
              </div>
            )}

            {/* Loading state */}
            {playersLoading && (
              <p className="text-xs text-muted-foreground text-center py-2">Loading...</p>
            )}

            {/* Team rosters */}
            {!playersLoading && (
              <div className="grid grid-cols-2 gap-3">
                <TeamRosterCompact
                  teamName={teamAName}
                  players={teamAPlayers}
                  teamColor={teamAPrimaryColor}
                  activePlayerId={activePlayerStats?.playerId}
                  onSelectPlayer={onTriggerPlayer}
                />
                <TeamRosterCompact
                  teamName={teamBName}
                  players={teamBPlayers}
                  teamColor={teamBPrimaryColor}
                  activePlayerId={activePlayerStats?.playerId}
                  onSelectPlayer={onTriggerPlayer}
                />
              </div>
            )}

            {/* Empty state */}
            {!playersLoading && teamAPlayers.length === 0 && teamBPlayers.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                No players found
              </p>
            )}
          </TabsContent>

          {/* Placeholder Tabs */}
          <TabsContent value="events" className="mt-3">
            <PlaceholderContent
              icon={<Calendar className="h-8 w-8" />}
              title="Upcoming Events"
              description="Show upcoming plays, timeouts, substitutions"
            />
          </TabsContent>

          <TabsContent value="season" className="mt-3">
            <PlaceholderContent
              icon={<BarChart3 className="h-8 w-8" />}
              title="Season Team Stats"
              description="Display team season averages and standings"
            />
          </TabsContent>

          <TabsContent value="potg" className="mt-3">
            <PlaceholderContent
              icon={<Trophy className="h-8 w-8" />}
              title="Player of the Game"
              description="Highlight the MVP of the current game"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

/** Compact team roster for tabs */
interface TeamRosterCompactProps {
  teamName: string;
  players: GamePlayer[];
  teamColor?: string;
  activePlayerId?: string;
  onSelectPlayer: (player: GamePlayer) => void;
}

function TeamRosterCompact({
  teamName,
  players,
  teamColor,
  activePlayerId,
  onSelectPlayer,
}: TeamRosterCompactProps) {
  const borderColor = teamColor || '#6B7280';

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 mb-1">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: borderColor }} />
        <span className="text-xs font-medium truncate">{teamName}</span>
      </div>
      <div className="space-y-0.5 max-h-52 overflow-y-auto">
        {players.map((player) => (
          <button
            key={player.id}
            onClick={() => onSelectPlayer(player)}
            className={`w-full flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors
              ${activePlayerId === player.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/30 hover:bg-muted'
              }`}
            style={{ borderLeft: `2px solid ${borderColor}` }}
          >
            <span className="font-mono w-5 text-[10px]">
              {player.jerseyNumber !== undefined ? `#${player.jerseyNumber}` : '--'}
            </span>
            <span className="truncate">{player.name}</span>
          </button>
        ))}
        {players.length === 0 && (
          <p className="text-[10px] text-muted-foreground text-center py-1">No players</p>
        )}
      </div>
    </div>
  );
}

/** Placeholder for future features */
function PlaceholderContent({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
      <div className="opacity-30 mb-2">{icon}</div>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-center">{description}</p>
      <span className="mt-2 text-[10px] bg-muted px-2 py-0.5 rounded">Coming Soon</span>
    </div>
  );
}
