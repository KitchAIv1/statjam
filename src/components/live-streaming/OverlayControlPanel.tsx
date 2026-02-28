/**
 * OverlayControlPanel Component
 * 
 * Unified control panel for all overlay types:
 * - Player Stats (NBA-style)
 * - Upcoming Events (placeholder)
 * - Season Stats (placeholder)
 * - Player of Game (placeholder)
 * Compact design for single-screen layout.
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Calendar, BarChart3, Trophy, Zap, X, Tv2, Lock, Crown, LayoutGrid, List, Users2, BarChart2, Users } from 'lucide-react';
import { GamePlayer } from '@/hooks/useGamePlayers';
import { PlayerStatsOverlayData, InfoBarToggles } from '@/lib/services/canvas-overlay';
import { toScheduleDateString, parseScheduleDateString } from '@/lib/utils/scheduleOverlayUtils';

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
  // Info Bar (NBA mode only)
  showInfoBarTab?: boolean;
  infoBarToggles?: InfoBarToggles;
  onInfoBarToggleChange?: (toggles: InfoBarToggles) => void;
  // Premium feature gating
  overlaysLocked?: boolean;
  onUpgrade?: () => void;
  // Manual overlays
  boxScoreVisible?: boolean;
  onBoxScoreToggle?: () => void;
  scheduleVisible?: boolean;
  onScheduleToggle?: () => void;
  scheduleAvailableDates?: Date[];
  selectedScheduleDate?: Date | null;
  onScheduleDateSelect?: (date: Date | null) => void;
  startingLineupVisible?: boolean;
  onStartingLineupToggle?: () => void;
  // Team Stats & On-Court Players overlays
  onTeamStatsToggle?: () => void;
  teamStatsVisible?: boolean;
  onOnCourtPlayersToggle?: () => void;
  onCourtPlayersVisible?: boolean;
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
  showInfoBarTab = false,
  infoBarToggles,
  onInfoBarToggleChange,
  overlaysLocked = false,
  onUpgrade,
  boxScoreVisible = false,
  onBoxScoreToggle,
  scheduleVisible = false,
  onScheduleToggle,
  scheduleAvailableDates = [],
  selectedScheduleDate = null,
  onScheduleDateSelect,
  startingLineupVisible = false,
  onStartingLineupToggle,
  onTeamStatsToggle,
  teamStatsVisible = false,
  onOnCourtPlayersToggle,
  onCourtPlayersVisible = false,
}: OverlayControlPanelProps) {
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Overlays</h3>
        {activePlayerStats?.isVisible && (
          <Button variant="ghost" size="sm" onClick={onHideOverlay} className="h-6 text-xs px-2">
            <X className="h-3 w-3 mr-1" />
            Hide
          </Button>
        )}
      </div>
      
      <Tabs defaultValue="player-stats" className="w-full">
        <TabsList className={`grid w-full ${showInfoBarTab ? 'grid-cols-5' : 'grid-cols-4'} h-7 mb-2`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="player-stats" className="text-[10px] px-1">
                <User className="h-3 w-3" />
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Player Stats</p>
              <p className="text-[10px] opacity-80">NBA-style player overlay</p>
            </TooltipContent>
          </Tooltip>
          {showInfoBarTab && (
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="info-bar" className="text-[10px] px-1">
                  <Tv2 className="h-3 w-3" />
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Info Bar</p>
                <p className="text-[10px] opacity-80">Scoreboard notifications</p>
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="events" className="text-[10px] px-1" disabled>
                <Calendar className="h-3 w-3" />
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Upcoming Events</p>
              <p className="text-[10px] opacity-80">Coming soon</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="season" className="text-[10px] px-1" disabled>
                <BarChart3 className="h-3 w-3" />
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Season Stats</p>
              <p className="text-[10px] opacity-80">Coming soon</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="potg" className="text-[10px] px-1" disabled>
                <Trophy className="h-3 w-3" />
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Player of the Game</p>
              <p className="text-[10px] opacity-80">Coming soon</p>
            </TooltipContent>
          </Tooltip>
        </TabsList>

        <TabsContent value="player-stats" className="mt-2 space-y-2">
          {/* Auto-trigger - Compact */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-between p-1.5 bg-muted/50 rounded text-xs cursor-help">
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3 w-3 text-yellow-500" />
                  <span>Auto FT</span>
                </div>
                <Switch checked={autoTriggerEnabled} onCheckedChange={onToggleAutoTrigger} />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Auto-trigger on free throws</p>
              <p className="text-[10px] opacity-80">
                {autoTriggerEnabled 
                  ? 'Player stats overlay shows automatically when free throw is recorded'
                  : 'Manually click players to show stats overlay'}
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Active indicator - Compact */}
          {activePlayerStats?.isVisible && (
            <div className="p-1.5 bg-green-500/10 border border-green-500/30 rounded text-xs">
              <p className="text-green-600 dark:text-green-400">
                #{activePlayerStats.jerseyNumber} {activePlayerStats.playerName}
              </p>
            </div>
          )}

          {/* Team rosters - Compact */}
          {!playersLoading && (
            <div className="grid grid-cols-2 gap-2 animate-in fade-in-0 duration-200">
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

          {/* Loading state - Skeleton */}
          {playersLoading && (
            <div className="grid grid-cols-2 gap-2 animate-in fade-in-0">
              {/* Team A Skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-5 w-20" />
                <div className="space-y-1.5 max-h-64 overflow-hidden">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2 p-1.5">
                      <Skeleton className="h-6 w-6 rounded" />
                      <Skeleton className="h-4 flex-1" />
                    </div>
                  ))}
                </div>
              </div>
              {/* Team B Skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-5 w-20" />
                <div className="space-y-1.5 max-h-64 overflow-hidden">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2 p-1.5">
                      <Skeleton className="h-6 w-6 rounded" />
                      <Skeleton className="h-4 flex-1" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!playersLoading && teamAPlayers.length === 0 && teamBPlayers.length === 0 && (
            <div className="py-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">No players found</p>
              <p className="text-[10px] text-muted-foreground">Players will appear when rosters are loaded</p>
            </div>
          )}
        </TabsContent>

        {/* Info Bar Tab (NBA mode) */}
        {showInfoBarTab && (
          <TabsContent value="info-bar" className="mt-2 space-y-2">
            {overlaysLocked ? (
              <LockedOverlayContent onUpgrade={onUpgrade} />
            ) : infoBarToggles && onInfoBarToggleChange ? (
              <>
                <p className="text-[10px] text-muted-foreground">
                  Toggle which notifications appear in the scoreboard bar.
                </p>
                <InfoBarToggleList
                  toggles={infoBarToggles}
                  onChange={onInfoBarToggleChange}
                />
              </>
            ) : null}
          </TabsContent>
        )}

        {/* Placeholder Tabs */}
        <TabsContent value="events" className="mt-2">
          <PlaceholderContent
            icon={<Calendar className="h-6 w-6" />}
            title="Upcoming Events"
            description="Show upcoming plays, timeouts, substitutions"
          />
        </TabsContent>

        <TabsContent value="season" className="mt-2">
          <PlaceholderContent
            icon={<BarChart3 className="h-6 w-6" />}
            title="Season Team Stats"
            description="Display team season averages and standings"
          />
        </TabsContent>

        <TabsContent value="potg" className="mt-2">
          <PlaceholderContent
            icon={<Trophy className="h-6 w-6" />}
            title="Player of the Game"
            description="Highlight the MVP of the current game"
          />
        </TabsContent>
      </Tabs>

      {/* MANUAL Overlays Section */}
      {(onBoxScoreToggle || onScheduleToggle || onStartingLineupToggle || onTeamStatsToggle || onOnCourtPlayersToggle) && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Manual</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {onBoxScoreToggle && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onBoxScoreToggle}
                    size="sm"
                    variant={boxScoreVisible ? 'default' : 'outline'}
                    className="w-full h-7 text-xs"
                    disabled
                  >
                    <LayoutGrid className="h-3 w-3 mr-1.5" />
                    Box Score
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Show Box Score overlay</p>
                  <p className="text-[10px] opacity-80">Display top scorers for both teams (disabled for now)</p>
                </TooltipContent>
              </Tooltip>
            )}
            {onStartingLineupToggle && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onStartingLineupToggle}
                    size="sm"
                    variant={startingLineupVisible ? 'default' : 'outline'}
                    className="w-full h-7 text-xs"
                  >
                    <Users2 className="h-3 w-3 mr-1.5" />
                    Starting Lineup
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Show Starting Lineup overlay</p>
                  <p className="text-[10px] opacity-80">Display 5v5 starters for both teams</p>
                </TooltipContent>
              </Tooltip>
            )}
            {onTeamStatsToggle && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onTeamStatsToggle}
                    size="sm"
                    variant={teamStatsVisible ? 'default' : 'outline'}
                    className="w-full h-7 text-xs"
                  >
                    <BarChart2 className="h-3 w-3 mr-1.5" />
                    Team Stats
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Show Team Stats comparison overlay</p>
                  <p className="text-[10px] opacity-80">ESPN-style team stats lower third</p>
                </TooltipContent>
              </Tooltip>
            )}
            {onOnCourtPlayersToggle && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onOnCourtPlayersToggle}
                    size="sm"
                    variant={onCourtPlayersVisible ? 'default' : 'outline'}
                    className="w-full h-7 text-xs"
                  >
                    <Users className="h-3 w-3 mr-1.5" />
                    On-Court Players
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Show On-Court Players overlay</p>
                  <p className="text-[10px] opacity-80">Live stats for current 5v5</p>
                </TooltipContent>
              </Tooltip>
            )}
            {onScheduleToggle && (
              <>
                {onScheduleDateSelect && scheduleAvailableDates.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground">Day</span>
                    <select
                      value={selectedScheduleDate ? toScheduleDateString(selectedScheduleDate) : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) {
                          onScheduleDateSelect?.(null);
                          return;
                        }
                        const parsed = parseScheduleDateString(val);
                        if (parsed) onScheduleDateSelect(parsed);
                      }}
                      className="w-full h-7 text-xs px-2 rounded border bg-background"
                    >
                      <option value="">Select day</option>
                      {scheduleAvailableDates.map((d, i) => (
                        <option key={`${toScheduleDateString(d)}-${i}`} value={toScheduleDateString(d)}>
                          {d.toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={onScheduleToggle}
                      size="sm"
                      variant={scheduleVisible ? 'default' : 'outline'}
                      className="w-full h-7 text-xs"
                    >
                      <List className="h-3 w-3 mr-1.5" />
                      Day Schedule
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Show Day Schedule overlay</p>
                    <p className="text-[10px] opacity-80">Display games for selected day</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        </div>
      )}
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
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: borderColor }} />
        <span className="text-[10px] font-medium truncate">{teamName}</span>
      </div>
      <div className="space-y-0.5 max-h-64 overflow-y-auto">
        {players.map((player) => (
          <button
            key={player.id}
            onClick={() => onSelectPlayer(player)}
            className={`w-full flex items-center gap-1 px-1.5 py-1 text-[11px] rounded transition-colors
              ${activePlayerId === player.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/30 hover:bg-muted'
              }`}
            style={{ borderLeft: `2px solid ${borderColor}` }}
          >
            <span className="font-mono w-4 text-[10px]">
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
    <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
      <div className="opacity-30 mb-1">{icon}</div>
      <p className="text-xs font-medium">{title}</p>
      <p className="text-[10px] text-center">{description}</p>
      <span className="mt-1 text-[10px] bg-muted px-2 py-0.5 rounded">Coming Soon</span>
    </div>
  );
}

/** Compact info bar toggle list for tabs */
interface InfoBarToggleListProps {
  toggles: InfoBarToggles;
  onChange: (toggles: InfoBarToggles) => void;
}

const INFO_BAR_ITEMS: Array<{ key: keyof InfoBarToggles; label: string; hint: string }> = [
  { key: 'tournamentName', label: 'Tournament', hint: 'Default display' },
  { key: 'halftime', label: 'Halftime', hint: 'End of 2nd quarter' },
  { key: 'overtime', label: 'Overtime', hint: 'OT periods' },
  { key: 'timeout', label: 'Timeout', hint: 'When timeout called' },
  { key: 'teamRun', label: 'Team Run', hint: '8+ unanswered pts' },
  { key: 'milestone', label: 'Milestones', hint: '30+ pts, double-double' },
];

function InfoBarToggleList({ toggles, onChange }: InfoBarToggleListProps) {
  const handleToggle = (key: keyof InfoBarToggles, checked: boolean) => {
    onChange({ ...toggles, [key]: checked });
  };

  return (
    <div className="space-y-1">
      {INFO_BAR_ITEMS.map((item) => (
        <div
          key={item.key}
          className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-[11px] font-medium cursor-help">{item.label}</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{item.hint}</p>
            </TooltipContent>
          </Tooltip>
          <Switch
            checked={toggles[item.key]}
            onCheckedChange={(checked) => handleToggle(item.key, checked)}
            className="scale-75"
          />
        </div>
      ))}
    </div>
  );
}

/** Premium locked state for Info Bar overlays */
function LockedOverlayContent({ onUpgrade }: { onUpgrade?: () => void }) {
  return (
    <div className="py-4 px-2 text-center space-y-3">
      <div className="mx-auto w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
        <Lock className="w-5 h-5 text-orange-500" />
      </div>
      <div>
        <p className="text-xs font-semibold text-foreground">Premium Feature</p>
        <p className="text-[10px] text-muted-foreground mt-1">
          Automatic overlays (Team Run, Milestones, Timeout) are available for Pro organizers.
        </p>
      </div>
      {onUpgrade && (
        <Button
          onClick={onUpgrade}
          size="sm"
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-xs h-8"
        >
          <Crown className="w-3 h-3 mr-1.5" />
          Upgrade to Pro
        </Button>
      )}
    </div>
  );
}
