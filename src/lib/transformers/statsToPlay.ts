'use client';

import { PlayByPlayEntry } from '@/lib/types/playByPlay';
import { StatRow } from '@/lib/services/statsService';

export interface TeamMapping {
  teamAId: string;
  teamBId: string;
  teamAName: string;
  teamBName: string;
}

function pointsFor(stat: StatRow): number {
  if (stat.modifier !== 'made') return 0;
  if (stat.stat_type === 'three_pointer') return 3;
  if (stat.stat_type === 'field_goal') return 2;
  if (stat.stat_type === 'free_throw') return 1;
  return 0;
}

export function transformStatsToPlay(stats: StatRow[], team: TeamMapping): { plays: PlayByPlayEntry[]; finalHome: number; finalAway: number; playerTallies: Record<string, { points: number; fgm: number; fga: number }>; } {
  let home = 0;
  let away = 0;
  const tallies: Record<string, { points: number; fgm: number; fga: number }> = {};

  const plays: PlayByPlayEntry[] = stats.map((s) => {
    const pts = pointsFor(s);
    const isHome = s.team_id === team.teamAId;
    const isAway = s.team_id === team.teamBId;

    if (isHome) home += pts; else if (isAway) away += pts;

    // Player tallies
    const t = (tallies[s.player_id] = tallies[s.player_id] || { points: 0, fgm: 0, fga: 0 });
    if (s.stat_type === 'three_pointer' || s.stat_type === 'field_goal' || s.stat_type === 'free_throw') {
      t.fga += 1;
      if (s.modifier === 'made') t.fgm += 1;
      t.points += pts;
    }

    let teamName = 'Unknown Team';
    if (isHome) teamName = team.teamAName; else if (isAway) teamName = team.teamBName; else teamName = `Team ${String(s.team_id || '').substring(0, 8)}`;

    const descriptionBase = (() => {
      switch (s.stat_type) {
        case 'three_pointer': return s.modifier === 'made' ? 'made a 3-pointer' : 'missed a 3-pointer';
        case 'field_goal': return s.modifier === 'made' ? 'made a field goal' : 'missed a field goal';
        case 'free_throw': return s.modifier === 'made' ? 'made a free throw' : 'missed a free throw';
        case 'assist': return 'recorded an assist';
        case 'rebound': return `grabbed a ${s.modifier || ''} rebound`.trim();
        case 'steal': return 'recorded a steal';
        case 'block': return 'blocked a shot';
        case 'turnover': return 'committed a turnover';
        case 'foul': return `committed a ${s.modifier || ''} foul`.trim();
        default: return `recorded a ${s.stat_type}`;
      }
    })();

    return {
      id: s.id,
      gameId: s.game_id,
      timestamp: s.created_at || new Date().toISOString(),
      quarter: Number(s.quarter ?? 1),
      gameTimeMinutes: Number(s.game_time_minutes ?? 0),
      gameTimeSeconds: Number(s.game_time_seconds ?? 0),
      playType: 'stat_recorded',
      teamId: s.team_id,
      teamName,
      playerId: s.player_id,
      playerName: `Player ${String(s.player_id || '').substring(0, 8)}`,
      statType: s.stat_type,
      statValue: s.stat_value ?? 0,
      modifier: s.modifier ?? undefined,
      description: descriptionBase,
      scoreAfter: { home, away },
      createdAt: s.created_at || new Date().toISOString(),
    } as PlayByPlayEntry;
  });

  return { plays, finalHome: home, finalAway: away, playerTallies: tallies };
}

