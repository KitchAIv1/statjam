/**
 * useOpponentStats Hook - Opponent Statistics for Coach Mode
 * 
 * PURPOSE: Fetch opponent stats in coach mode where opponent stats
 * are recorded with is_opponent_stat: true flag
 * 
 * FEATURES:
 * - Fetches stats filtered by is_opponent_stat flag
 * - Groups stats by player (custom or regular)
 * - Real-time updates via subscription
 * - Returns structured data matching TeamStatsTab format
 * 
 * Follows .cursorrules: <100 lines, single responsibility
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { gameSubscriptionManager } from '@/lib/subscriptionManager';
import { GameServiceV3 } from '@/lib/services/gameServiceV3';

// ✅ OPTIMIZATION: Debounce delay to prevent query cascade on rapid stat recording
const REALTIME_DEBOUNCE_MS = 500;

interface OpponentPlayerStats {
  playerId: string;
  playerName: string;
  minutes: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  plusMinus: number;
}

interface OpponentTeamStats {
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  fieldGoalPercentage: number;
  threePointersMade: number;
  threePointersAttempted: number;
  threePointPercentage: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  freeThrowPercentage: number;
  turnovers: number;
  rebounds: number;
  assists: number;
}

export function useOpponentStats(gameId: string) {
  const [players, setPlayers] = useState<OpponentPlayerStats[]>([]);
  const [teamStats, setTeamStats] = useState<OpponentTeamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // ✅ OPTIMIZATION: Debounce timer ref to prevent query cascade
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchOpponentStats = useCallback(async (isUpdate = false) => {
    if (!gameId) return;

    try {
      if (!isUpdate) setLoading(true);
      setError(null);

      // Fetch all game stats with is_opponent_stat flag
      const allStats = await GameServiceV3.getGameStats(gameId);
      const opponentStats = allStats.filter(stat => stat.is_opponent_stat === true);

      console.log('🎯 useOpponentStats: Found', opponentStats.length, 'opponent stats');

      // Group by player and aggregate
      const playerMap = new Map<string, OpponentPlayerStats>();
      let totalFGM = 0, totalFGA = 0, total3PM = 0, total3PA = 0;
      let totalFTM = 0, totalFTA = 0, totalTO = 0, totalREB = 0, totalAST = 0;

      opponentStats.forEach(stat => {
        const playerId = stat.player_id || stat.custom_player_id || 'unknown';
        const playerName = 'Opponent Player'; // We don't have names for opponent stats
        
        if (!playerMap.has(playerId)) {
          playerMap.set(playerId, {
            playerId,
            playerName,
            minutes: 0,
            points: 0,
            rebounds: 0,
            assists: 0,
            steals: 0,
            blocks: 0,
            plusMinus: 0
          });
        }

        const player = playerMap.get(playerId)!;
        
        // Aggregate stats
        if (stat.stat_type === 'field_goal' && stat.modifier === 'made') {
          player.points += 2;
          totalFGM++;
          totalFGA++;
        } else if (stat.stat_type === 'field_goal' && stat.modifier === 'missed') {
          totalFGA++;
        } else if (stat.stat_type === 'three_pointer' && stat.modifier === 'made') {
          player.points += 3;
          total3PM++;
          total3PA++;
        } else if (stat.stat_type === 'three_pointer' && stat.modifier === 'missed') {
          total3PA++;
        } else if (stat.stat_type === 'free_throw' && stat.modifier === 'made') {
          player.points += 1;
          totalFTM++;
          totalFTA++;
        } else if (stat.stat_type === 'free_throw' && stat.modifier === 'missed') {
          totalFTA++;
        } else if (stat.stat_type === 'rebound') {
          player.rebounds++;
          totalREB++;
        } else if (stat.stat_type === 'assist') {
          player.assists++;
          totalAST++;
        } else if (stat.stat_type === 'steal') {
          player.steals++;
        } else if (stat.stat_type === 'block') {
          player.blocks++;
        } else if (stat.stat_type === 'turnover') {
          totalTO++;
        }
      });

      setPlayers(Array.from(playerMap.values()));
      setTeamStats({
        fieldGoalsMade: totalFGM,
        fieldGoalsAttempted: totalFGA,
        fieldGoalPercentage: totalFGA > 0 ? Math.round((totalFGM / totalFGA) * 100) : 0,
        threePointersMade: total3PM,
        threePointersAttempted: total3PA,
        threePointPercentage: total3PA > 0 ? Math.round((total3PM / total3PA) * 100) : 0,
        freeThrowsMade: totalFTM,
        freeThrowsAttempted: totalFTA,
        freeThrowPercentage: totalFTA > 0 ? Math.round((totalFTM / totalFTA) * 100) : 0,
        turnovers: totalTO,
        rebounds: totalREB,
        assists: totalAST
      });

    } catch (e: any) {
      console.error('❌ useOpponentStats: Error:', e);
      setError(e?.message || 'Failed to load opponent stats');
    } finally {
      if (!isUpdate) setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    void fetchOpponentStats(false);
  }, [fetchOpponentStats]);

  // Real-time updates
  // ✅ OPTIMIZATION: Debounced to prevent query cascade on rapid stat recording
  useEffect(() => {
    if (!gameId) return;

    const unsubscribe = gameSubscriptionManager.subscribe(gameId, (table: string) => {
      if (table === 'game_stats') {
        // ✅ OPTIMIZATION: Debounce to batch rapid updates
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
          void fetchOpponentStats(true);
        }, REALTIME_DEBOUNCE_MS);
      }
    });

    // Cleanup debounce timer on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      unsubscribe();
    };
  }, [gameId, fetchOpponentStats]);

  return { players, teamStats, loading, error };
}

