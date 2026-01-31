/**
 * InfoBarManager - Manages info bar overlay items with priority system
 * 
 * PURPOSE: Single source of truth for what displays in the info bar
 * Handles priority, auto-hide timers, and user toggle preferences
 * 
 * Priority Stack (highest wins):
 * 1. TIMEOUT (100) - blocks all
 * 2. TEAM RUN (90) - 12-0+, (80) - 10-0, (70) - 8-0
 * 3. MILESTONE (85) - Triple-double, (75) - 30+ pts, (65) - other
 * 4. HALFTIME/OVERTIME (60)
 * 5. TOURNAMENT NAME (10) - default/fallback
 * 
 * @module InfoBarManager
 */

import { Milestone } from '@/lib/engines/milestoneEngine';
import { TeamRun } from '@/lib/engines/teamRunEngine';

export type InfoBarItemType = 
  | 'tournament_name'
  | 'halftime'
  | 'overtime'
  | 'timeout'
  | 'team_run'
  | 'milestone'
  | 'shot_made'
  | 'foul'
  | 'game_end';

export interface InfoBarItem {
  type: InfoBarItemType;
  label: string;          // Display text
  priority: number;       // Higher = shown first
  expiresAt?: number;     // Auto-hide timestamp (ms)
  teamId?: string;        // For team-specific items
  data?: unknown;         // Additional item-specific data
}

export interface InfoBarToggles {
  tournamentName: boolean;
  halftime: boolean;
  overtime: boolean;
  timeout: boolean;
  teamRun: boolean;
  milestone: boolean;
  shotMade: boolean;
  foul: boolean;
  gameEnd: boolean;
}

export interface InfoBarState {
  activeItem: InfoBarItem | null;
  queuedItems: InfoBarItem[];
  toggles: InfoBarToggles;
}

// Default toggle state - all enabled
export const DEFAULT_TOGGLES: InfoBarToggles = {
  tournamentName: true,
  halftime: true,
  overtime: true,
  timeout: true,
  teamRun: true,
  milestone: true,
  shotMade: true,
  foul: true,
  gameEnd: true,
};

// Auto-hide durations (milliseconds)
const AUTO_HIDE_DURATIONS: Partial<Record<InfoBarItemType, number>> = {
  team_run: 10000,    // 10 seconds
  milestone: 8000,    // 8 seconds
  shot_made: 5000,    // 5 seconds
  foul: 5000,         // 5 seconds
};

/**
 * Create a tournament name info bar item
 */
export function createTournamentNameItem(tournamentName: string): InfoBarItem {
  return {
    type: 'tournament_name',
    label: tournamentName.toUpperCase(),
    priority: 10, // Lowest priority - default fallback
  };
}

/**
 * Create a halftime info bar item
 */
export function createHalftimeItem(): InfoBarItem {
  return {
    type: 'halftime',
    label: 'HALFTIME',
    priority: 60,
    // No expiry - stays until Q3 starts
  };
}

/**
 * Create an overtime info bar item
 */
export function createOvertimeItem(otPeriod: number): InfoBarItem {
  return {
    type: 'overtime',
    label: otPeriod === 1 ? 'OVERTIME' : `${otPeriod}OT`,
    priority: 60,
  };
}

/**
 * Create a timeout info bar item
 */
export function createTimeoutItem(teamName: string, teamId: string): InfoBarItem {
  return {
    type: 'timeout',
    label: `TIMEOUT - ${teamName.toUpperCase()}`,
    priority: 100, // Highest priority
    teamId,
  };
}

/**
 * Create a team run info bar item
 */
export function createTeamRunItem(run: TeamRun): InfoBarItem {
  return {
    type: 'team_run',
    label: `🔥 ${run.teamName.toUpperCase()} ${run.points}-0 RUN`,
    priority: run.priority,
    expiresAt: Date.now() + (AUTO_HIDE_DURATIONS.team_run || 10000),
    teamId: run.teamId,
    data: run,
  };
}

/**
 * Create a milestone info bar item
 */
export function createMilestoneItem(
  milestone: Milestone,
  playerName: string,
  value?: number
): InfoBarItem {
  // Determine priority based on milestone type
  let priority = 65;
  if (milestone.type === 'TRIPLE_DOUBLE') priority = 85;
  else if (milestone.type === 'DOUBLE_DOUBLE') priority = 80;
  else if (milestone.type.startsWith('PTS_30') || milestone.type.startsWith('PTS_40') || milestone.type.startsWith('PTS_50')) {
    priority = 75;
  }

  const displayValue = value !== undefined ? ` - ${value}` : '';
  
  return {
    type: 'milestone',
    label: `${playerName.toUpperCase()}${displayValue} ${milestone.label}`,
    priority,
    expiresAt: Date.now() + (AUTO_HIDE_DURATIONS.milestone || 8000),
    data: milestone,
  };
}

/**
 * Create a shot made info bar item
 */
export interface ShotMadeData {
  playerId: string;
  playerName: string;      // "#23 J. SMITH"
  points: number;          // 2 or 3
  is3Pointer: boolean;
  animationStart: number;  // Timestamp for shake animation
}

export function createShotMadeItem(
  data: ShotMadeData,
  teamId: string
): InfoBarItem {
  const pointsText = data.is3Pointer ? '+3' : `+${data.points}`;
  return {
    type: 'shot_made',
    label: `${data.playerName} ${pointsText}`,
    priority: 50, // Below team run/milestone, above tournament name
    expiresAt: Date.now() + (AUTO_HIDE_DURATIONS.shot_made || 5000),
    teamId,
    data,
  };
}

/**
 * Create a foul info bar item
 */
export interface FoulData {
  playerId: string;
  playerName: string;      // "#23 J. SMITH"
  foulType: 'personal' | 'shooting' | 'offensive' | 'technical' | 'flagrant';
  foulCount: number;       // Player's total fouls in game
}

export function createFoulItem(
  data: FoulData,
  teamId: string
): InfoBarItem {
  const foulLabel = data.foulType === 'personal' ? 'FOUL' 
    : data.foulType === 'shooting' ? 'SHOOTING FOUL'
    : data.foulType === 'offensive' ? 'OFFENSIVE FOUL'
    : data.foulType === 'technical' ? 'TECH FOUL'
    : 'FLAGRANT FOUL';
  
  return {
    type: 'foul',
    label: `${foulLabel} - ${data.playerName}`,
    priority: 55, // Above shot_made (50), below halftime (60)
    expiresAt: Date.now() + (AUTO_HIDE_DURATIONS.foul || 5000),
    teamId,
    data,
  };
}

/**
 * Create a game end (FINAL) info bar item
 */
export function createGameEndItem(): InfoBarItem {
  return {
    type: 'game_end',
    label: 'FINAL',
    priority: 95, // High priority - just below timeout (100)
    // No expiry - stays until dismissed or page closed
  };
}

/**
 * Determine active info bar item based on priority and toggles
 */
export function getActiveInfoBarItem(
  items: InfoBarItem[],
  toggles: InfoBarToggles
): InfoBarItem | null {
  const now = Date.now();
  
  // Filter by toggles and expiry
  const validItems = items.filter(item => {
    // Check if toggle is enabled for this type
    const toggleKey = getToggleKey(item.type);
    if (!toggles[toggleKey]) return false;
    
    // Check if item has expired
    if (item.expiresAt && item.expiresAt < now) return false;
    
    return true;
  });

  if (validItems.length === 0) return null;
  
  // Sort by priority (highest first) and return top item
  validItems.sort((a, b) => b.priority - a.priority);
  return validItems[0];
}

/**
 * Map item type to toggle key
 */
function getToggleKey(type: InfoBarItemType): keyof InfoBarToggles {
  const mapping: Record<InfoBarItemType, keyof InfoBarToggles> = {
    tournament_name: 'tournamentName',
    halftime: 'halftime',
    overtime: 'overtime',
    timeout: 'timeout',
    team_run: 'teamRun',
    milestone: 'milestone',
    shot_made: 'shotMade',
    foul: 'foul',
    game_end: 'gameEnd',
  };
  return mapping[type];
}

/**
 * Check if we're at halftime
 */
export function isHalftime(quarter: number, clockMinutes: number, clockSeconds: number): boolean {
  return quarter === 2 && clockMinutes === 0 && clockSeconds === 0;
}

/**
 * Check if we're in overtime
 */
export function isOvertime(quarter: number): boolean {
  return quarter > 4;
}

/**
 * Get overtime period number (1, 2, 3, etc.)
 */
export function getOvertimePeriod(quarter: number): number {
  return quarter > 4 ? quarter - 4 : 0;
}
