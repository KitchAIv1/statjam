/**
 * Stat Edit Utilities - Memoized Helper Functions
 * 
 * PURPOSE: Expensive operations memoized to prevent re-computation on every render
 * 
 * Follows .cursorrules: Utility functions <40 lines each
 */

import { GameStatRecord } from '@/lib/services/statEditService';

interface Player {
  id: string;
  name: string;
}

/**
 * Memoized player name lookup map
 */
function createPlayerMap(players: Player[]): Map<string, string> {
  const map = new Map<string, string>();
  players.forEach(player => {
    map.set(player.id, player.name);
  });
  return map;
}

/**
 * Get player name for a stat (memoized)
 */
export function getPlayerName(
  stat: GameStatRecord,
  playerMap: Map<string, string>,
  teamAName: string,
  teamBName: string
): string {
  if (stat.stat_type === 'timeout') {
    return stat.team_side === 'A' ? teamAName : teamBName;
  }
  
  if (stat.stat_type === 'substitution') {
    const playerOutId = stat.player_id || stat.custom_player_id;
    const playerOutName = playerMap.get(playerOutId || '') || 'Unknown Player';
    const playerInName = playerMap.get(stat.modifier || '') || 'Unknown Player';
    return `${playerOutName} → ${playerInName}`;
  }
  
  if (stat.is_opponent_stat) return 'Opponent Team';
  
  const playerId = stat.player_id || stat.custom_player_id;
  return playerMap.get(playerId || '') || 'Unknown Player';
}

/**
 * Format stat display string (memoized)
 */
export function formatStatDisplay(stat: GameStatRecord): string {
  if (stat.stat_type === 'timeout') {
    const timeoutType = stat.modifier === '30_second' ? '30-SECOND' : 'FULL';
    return `TIMEOUT (${timeoutType})`;
  }
  
  if (stat.stat_type === 'substitution') {
    return 'SUBSTITUTION';
  }
  
  if (stat.stat_type === 'foul') {
    const foulType = stat.modifier?.toUpperCase() || 'FOUL';
    const value = stat.stat_value > 0 ? ` +${stat.stat_value}` : '';
    
    const foulTypeMap: Record<string, string> = {
      'shooting': 'SHOOTING FOUL',
      'personal': 'PERSONAL FOUL',
      'offensive': 'OFFENSIVE FOUL',
      'technical': 'TECHNICAL FOUL',
      'flagrant': 'FLAGRANT FOUL'
    };
    
    return foulTypeMap[stat.modifier || ''] 
      ? `${foulTypeMap[stat.modifier || '']}${value}`
      : `${foulType} FOUL${value}`;
  }
  
  if (stat.stat_type === 'rebound') {
    const reboundType = stat.modifier?.toLowerCase();
    if (reboundType === 'offensive') return 'REBOUND (OFFENSIVE)';
    if (reboundType === 'defensive') return 'REBOUND (DEFENSIVE)';
    return 'REBOUND (UNKNOWN)';
  }
  
  const type = stat.stat_type.replace(/_/g, ' ').toUpperCase();
  const modifier = stat.modifier ? ` (${stat.modifier.toUpperCase()})` : '';
  const value = stat.stat_value > 0 ? ` +${stat.stat_value}` : '';
  return `${type}${modifier}${value}`;
}

/**
 * Create player map from player array (memoized)
 */
export function createPlayerNameMap(players: Player[]): Map<string, string> {
  return createPlayerMap(players);
}

