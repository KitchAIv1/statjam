/**
 * Stat Edit Handlers - Delete and Update Logic
 * 
 * PURPOSE: Extract handler logic to keep components under 200 lines
 * 
 * Follows .cursorrules: Functions <40 lines each
 */

import { StatEditServiceV2 } from '@/lib/services/statEditServiceV2';
import { GameStatRecord } from '@/lib/services/statEditService';
import { cache, CacheKeys } from '@/lib/utils/cache';

/**
 * Delete a stat (handles timeouts, substitutions, regular stats)
 */
export async function deleteStatHandler(
  statId: string,
  stat: GameStatRecord | undefined,
  gameId: string,
  teamAId?: string,
  teamBId?: string,
  onSuccess?: () => void
): Promise<void> {
  if (stat?.stat_type === 'timeout') {
    const actualTimeoutId = statId.replace('timeout_', '');
    try {
      const accessToken = localStorage.getItem('sb-access-token');
      if (!accessToken) throw new Error('Not authenticated');

      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/game_timeouts?id=eq.${actualTimeoutId}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error(`Failed to delete timeout: ${response.status}`);

      if (teamAId) cache.delete(CacheKeys.teamStats(gameId, teamAId));
      if (teamBId) cache.delete(CacheKeys.teamStats(gameId, teamBId));
      onSuccess?.();
    } catch (err) {
      console.error('Failed to delete timeout:', err);
      throw err;
    }
    return;
  }

  await StatEditServiceV2.deleteStat(statId, gameId);
  if (teamAId) cache.delete(CacheKeys.teamStats(gameId, teamAId));
  if (teamBId) cache.delete(CacheKeys.teamStats(gameId, teamBId));
  onSuccess?.();
}

/**
 * Invalidate team stats cache after update
 */
export function invalidateTeamStatsCache(
  gameId: string,
  teamAId?: string,
  teamBId?: string
): void {
  if (teamAId) cache.delete(CacheKeys.teamStats(gameId, teamAId));
  if (teamBId) cache.delete(CacheKeys.teamStats(gameId, teamBId));
}

