'use client';

import { PlayByPlayEntry } from '@/lib/types/playByPlay';
import { SubstitutionRow } from '@/lib/services/substitutionsService';

export interface TeamMapping {
  teamAId: string;
  teamBId: string;
  teamAName: string;
  teamBName: string;
}

export function transformSubsToPlay(subs: SubstitutionRow[], team: TeamMapping): PlayByPlayEntry[] {
  return subs.map((sub) => {
    let teamName = 'Unknown Team';
    if (sub.team_id === team.teamAId) teamName = team.teamAName;
    else if (sub.team_id === team.teamBId) teamName = team.teamBName;
    else teamName = `Team ${String(sub.team_id || '').substring(0, 8)}`;

    // ✅ CUSTOM PLAYER SUPPORT: Use either regular or custom player ID
    const playerOutId = (sub as any).player_out_id || (sub as any).custom_player_out_id || '';
    const playerInId = (sub as any).player_in_id || (sub as any).custom_player_in_id || '';
    
    const playerOutName = `Player ${String(playerOutId).substring(0, 8)}`;
    const playerInName = `Player ${String(playerInId).substring(0, 8)}`;

    return {
      id: sub.id,
      gameId: sub.game_id,
      timestamp: sub.created_at || new Date().toISOString(),
      quarter: Number(sub.quarter ?? 1),
      gameTimeMinutes: Number(sub.game_time_minutes ?? 0),
      gameTimeSeconds: Number(sub.game_time_seconds ?? 0),
      playType: 'substitution',
      teamId: sub.team_id,
      teamName,
      description: `Substitution: ${playerOutName} → ${playerInName}`,
      scoreAfter: { home: 0, away: 0 },
      createdAt: sub.created_at || new Date().toISOString(),
    } as PlayByPlayEntry;
  });
}

