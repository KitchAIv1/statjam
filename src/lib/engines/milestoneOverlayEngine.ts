/**
 * MilestoneOverlayEngine - Lightweight milestone detection for info bar overlay
 * 
 * PURPOSE: Detect broadcast-worthy milestones from game_stats
 * Trimmed to only show-stoppers (not spammy)
 * 
 * TRIMMED MILESTONES:
 * - 30+ PTS (dominant scoring)
 * - 15+ REB (beast on boards)
 * - 10+ AST (floor general)
 * - Double-Double (10+ in 2 categories)
 * - Triple-Double (10+ in 3 categories)
 * 
 * @module MilestoneOverlayEngine
 */

import type { InfoBarItem } from '@/lib/services/canvas-overlay/infoBarManager';

interface GameStat {
  player_id: string | null;
  custom_player_id?: string | null;
  team_id: string;
  stat_type: string;
  stat_value: number;
  modifier?: string;
  is_opponent_stat?: boolean;
}

interface PlayerStats {
  points: number;
  rebounds: number;
  assists: number;
  teamId: string;
}

type MilestoneType = 'PTS_30' | 'REB_15' | 'AST_10' | 'DOUBLE_DOUBLE' | 'TRIPLE_DOUBLE';

const MILESTONE_LABELS: Record<MilestoneType, string> = {
  PTS_30: '30+ POINTS',
  REB_15: '15+ REBOUNDS',
  AST_10: '10+ ASSISTS',
  DOUBLE_DOUBLE: 'DOUBLE-DOUBLE',
  TRIPLE_DOUBLE: 'TRIPLE-DOUBLE',
};

const MILESTONE_PRIORITY: Record<MilestoneType, number> = {
  TRIPLE_DOUBLE: 100,
  DOUBLE_DOUBLE: 85,
  PTS_30: 75,
  REB_15: 70,
  AST_10: 65,
};

/**
 * Aggregate stats per player from raw game_stats
 */
function aggregatePlayerStats(stats: GameStat[]): Map<string, PlayerStats> {
  const playerMap = new Map<string, PlayerStats>();

  for (const stat of stats) {
    // Skip opponent stats
    if (stat.is_opponent_stat) continue;
    
    // Use player_id or custom_player_id (one must exist)
    const playerId = stat.player_id || stat.custom_player_id;
    if (!playerId) continue;

    if (!playerMap.has(playerId)) {
      playerMap.set(playerId, { points: 0, rebounds: 0, assists: 0, teamId: stat.team_id });
    }

    const player = playerMap.get(playerId)!;

    // Points: field_goal, three_pointer, free_throw with modifier='made'
    if (
      ['field_goal', 'three_pointer', 'free_throw'].includes(stat.stat_type) &&
      stat.modifier === 'made'
    ) {
      player.points += stat.stat_value;
    }

    // Rebounds
    if (stat.stat_type === 'rebound') {
      player.rebounds += 1;
    }

    // Assists
    if (stat.stat_type === 'assist') {
      player.assists += 1;
    }
  }

  return playerMap;
}

/**
 * Check for combo milestones (double-double, triple-double)
 */
function checkComboMilestone(stats: PlayerStats): MilestoneType | null {
  let categoriesAt10Plus = 0;
  if (stats.points >= 10) categoriesAt10Plus++;
  if (stats.rebounds >= 10) categoriesAt10Plus++;
  if (stats.assists >= 10) categoriesAt10Plus++;

  if (categoriesAt10Plus >= 3) return 'TRIPLE_DOUBLE';
  if (categoriesAt10Plus >= 2) return 'DOUBLE_DOUBLE';
  return null;
}

/**
 * Check for single-stat milestones
 */
function checkSingleMilestone(stats: PlayerStats): MilestoneType | null {
  if (stats.points >= 30) return 'PTS_30';
  if (stats.rebounds >= 15) return 'REB_15';
  if (stats.assists >= 10) return 'AST_10';
  return null;
}

/**
 * Detect ALL qualifying milestones from game stats
 * Returns array sorted by priority (highest first)
 */
export function detectAllMilestonesFromStats(stats: GameStat[]): Array<{
  playerId: string;
  teamId: string;
  milestone: MilestoneType;
  priority: number;
}> {
  const playerStats = aggregatePlayerStats(stats);
  const milestones: Array<{ playerId: string; teamId: string; milestone: MilestoneType; priority: number }> = [];

  for (const [playerId, pStats] of playerStats) {
    // Check combo first (higher priority)
    const combo = checkComboMilestone(pStats);
    if (combo) {
      milestones.push({ playerId, teamId: pStats.teamId, milestone: combo, priority: MILESTONE_PRIORITY[combo] });
    }

    // Check single-stat milestones (only if no combo - avoid double counting)
    if (!combo) {
      const single = checkSingleMilestone(pStats);
      if (single) {
        milestones.push({ playerId, teamId: pStats.teamId, milestone: single, priority: MILESTONE_PRIORITY[single] });
      }
    }
  }

  // Sort by priority (highest first)
  return milestones.sort((a, b) => b.priority - a.priority);
}

/**
 * Create info bar item for milestone
 */
export function createMilestoneInfoBarItem(
  milestone: MilestoneType,
  playerName: string,
  teamId?: string
): InfoBarItem {
  return {
    type: 'milestone',
    label: `⭐ ${playerName.toUpperCase()} - ${MILESTONE_LABELS[milestone]}`,
    priority: MILESTONE_PRIORITY[milestone],
    expiresAt: Date.now() + 8000, // 8 seconds
    teamId,
  };
}
