'use client';

import { useMemo } from 'react';
import { useGameViewerV3Context } from '@/providers/GameViewerV3Provider';
import { getPlayerName, getPlayerPhoto } from '@/lib/services/GameViewerStatsService';
import { getTeamName } from '@/lib/services/GameViewerPlayerService';
import { PlayFeedEntryV3, PlayEntry, PlayerRunningStats } from './PlayFeedEntryV3';

export function PlayFeedTabV3() {
  const { gameData, isDark } = useGameViewerV3Context();

  const plays = useMemo<PlayEntry[]>(() => {
    if (!gameData) return [];

    const teamAId = gameData.game.team_a_id;
    const teamBId = gameData.game.team_b_id;

    // Sort stats chronologically (oldest first) to compute running scores
    const sortedStats = [...gameData.stats].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    let teamAScore = 0;
    let teamBScore = 0;
    const playerStatsMap = new Map<string, PlayerRunningStats>();
    const playsWithScores: PlayEntry[] = [];

    const getOrCreateStats = (playerId: string): PlayerRunningStats => {
      if (!playerStatsMap.has(playerId)) {
        playerStatsMap.set(playerId, { 
          points: 0, fgMade: 0, fgAttempted: 0, threeMade: 0, threeAttempted: 0, 
          ftMade: 0, ftAttempted: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0 
        });
      }
      return playerStatsMap.get(playerId)!;
    };

    for (const stat of sortedStats) {
      const points = getPointsFromStat(stat.stat_type, stat.modifier);
      const playerId = stat.custom_player_id || stat.player_id || 'unknown';
      const pStats = getOrCreateStats(playerId);
      
      // Update player running stats
      if (stat.stat_type === 'field_goal') {
        pStats.fgAttempted++;
        if (stat.modifier === 'made') { pStats.fgMade++; pStats.points += 2; }
      } else if (stat.stat_type === 'three_pointer') {
        pStats.threeAttempted++;
        if (stat.modifier === 'made') { pStats.threeMade++; pStats.points += 3; }
      } else if (stat.stat_type === 'free_throw') {
        pStats.ftAttempted++;
        if (stat.modifier === 'made') { pStats.ftMade++; pStats.points += 1; }
      } else if (stat.stat_type === 'rebound') pStats.rebounds++;
      else if (stat.stat_type === 'assist') pStats.assists++;
      else if (stat.stat_type === 'steal') pStats.steals++;
      else if (stat.stat_type === 'block') pStats.blocks++;
      
      // Update team running score
      if (points && points > 0) {
        if (stat.team_id === teamAId) teamAScore += points;
        else if (stat.team_id === teamBId) teamBScore += points;
      }

      playsWithScores.push({
        id: stat.id,
        quarter: stat.quarter,
        clockMinutes: stat.game_time_minutes,
        clockSeconds: stat.game_time_seconds,
        teamId: stat.team_id,
        teamName: getTeamName(gameData, stat.team_id),
        playerName: getPlayerName(gameData, stat.player_id, stat.custom_player_id),
        playerPhotoUrl: getPlayerPhoto(gameData, stat.player_id, stat.custom_player_id),
        statType: stat.stat_type,
        modifier: stat.modifier,
        description: formatStatDescription(stat.stat_type, stat.modifier),
        points,
        createdAt: stat.created_at,
        scoreAfter: { teamA: teamAScore, teamB: teamBScore },
        playerStats: { ...pStats },
      });
    }

    // Return in reverse chronological order (newest first)
    return playsWithScores.reverse();
  }, [gameData]);

  if (!gameData) {
    return <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading plays...</div>;
  }

  if (plays.length === 0) {
    return <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No plays recorded yet</div>;
  }

  return (
    <div className="space-y-1">
      {plays.map((play, index) => (
        <PlayFeedEntryV3 
          key={play.id} 
          play={play} 
          isTeamA={play.teamId === gameData.game.team_a_id}
          isLatest={index === 0}
          isDark={isDark}
        />
      ))}
    </div>
  );
}

function formatStatDescription(statType: string, modifier?: string): string {
  const isMade = modifier === 'made';
  switch (statType) {
    case 'field_goal': return isMade ? '2PT Made' : '2PT Miss';
    case 'three_pointer': return isMade ? '3PT Made' : '3PT Miss';
    case 'free_throw': return isMade ? 'FT Made' : 'FT Miss';
    case 'rebound': return modifier === 'offensive' ? 'OFF REB' : 'DEF REB';
    case 'assist': return 'Assist';
    case 'steal': return 'Steal';
    case 'block': return 'Block';
    case 'turnover': return 'Turnover';
    case 'foul': return 'Foul';
    default: return statType.replace(/_/g, ' ');
  }
}

function getPointsFromStat(statType: string, modifier?: string): number | undefined {
  if (modifier !== 'made') return undefined;
  switch (statType) {
    case 'field_goal': return 2;
    case 'three_pointer': return 3;
    case 'free_throw': return 1;
    default: return undefined;
  }
}
