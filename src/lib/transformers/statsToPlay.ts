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

function normalizeStatType(type: string | null | undefined): string {
  const t = (type || '').toLowerCase();
  if (t === 'three_point' || t === '3pt' || t === 'threepointer') return 'three_pointer';
  if (t === 'fg' || t === 'fieldgoal') return 'field_goal';
  if (t === 'ft' || t === 'freethrow') return 'free_throw';
  if (t === 'personal_foul' || t === 'pf') return 'foul';
  if (t === 'tech_foul' || t === 'technical_foul' || t === 'tf') return 'foul';
  if (t === 'off_rebound' || t === 'offensive_rebound') return 'rebound';
  if (t === 'def_rebound' || t === 'defensive_rebound') return 'rebound';
  return t;
}

export function transformStatsToPlay(stats: StatRow[], team: TeamMapping): { plays: PlayByPlayEntry[]; finalHome: number; finalAway: number; playerTallies: Record<string, { points: number; fgm: number; fga: number }>; } {
  let home = 0;
  let away = 0;
  const tallies: Record<string, { points: number; fgm: number; fga: number }> = {};

  const plays: PlayByPlayEntry[] = stats.map((raw) => {
    const s: StatRow = { ...raw, stat_type: normalizeStatType(raw.stat_type) as any };
    const pts = pointsFor(s);
    const isHome = s.team_id === team.teamAId;
    const isAway = s.team_id === team.teamBId;

    if (isHome) home += pts; else if (isAway) away += pts;

    // Player tallies (use player_id or custom_player_id)
    const playerId = s.player_id || (s as any).custom_player_id;
    const t = (tallies[playerId] = tallies[playerId] || { points: 0, fgm: 0, fga: 0 });
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

    // ✅ FIX: Extract player name - prioritize pre-enriched player_name field
    const playerName = (s as any).player_name || // Use pre-enriched field from useGameViewerV2
                      (s as any).custom_players?.name || // Fallback: Check custom_players nested object
                      s.users?.name || // Fallback: Then regular users nested object
                      (s.users?.email ? s.users.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').trim() : null) ||
                      `Player ${String(s.player_id || (s as any).custom_player_id || '').substring(0, 8)}`;
    
    // Reduced logging for performance
    if (process.env.NODE_ENV !== 'production' && Math.random() < 0.1) {
      console.log('🔍 Player name extraction sample:', {
        playerId: s.player_id,
        finalName: playerName
      });
    }

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
      playerId: s.player_id || (s as any).custom_player_id, // Use whichever ID is present
      playerName: playerName,
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

