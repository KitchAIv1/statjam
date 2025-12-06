/**
 * PrefetchService
 * 
 * PURPOSE: Prefetch data on hover for instant page transitions
 * - Warms cache before user clicks
 * - Debounced to prevent excessive calls
 * - Silent failures (non-blocking)
 * 
 * Follows .cursorrules: Service <200 lines
 */

import { cache, CacheKeys, CacheTTL } from '@/lib/utils/cache';
import { PlayerDashboardService } from '@/lib/services/playerDashboardService';
import { PlayerGameStatsService } from '@/lib/services/playerGameStatsService';
import { GameAwardsService } from '@/lib/services/gameAwardsService';
import { logger } from '@/lib/utils/logger';
import { buildTournamentStats, buildCareerHighs, countAwards, type PublicPlayerProfile } from '@/lib/services/publicPlayerProfileService';
import { supabase } from '@/lib/supabase';

// Track in-flight prefetches to avoid duplicates
const prefetchingPlayers = new Set<string>();

/**
 * Prefetch player profile data on hover
 * Silent, non-blocking - warms cache for instant load on click
 */
export async function prefetchPlayerProfile(playerId: string): Promise<void> {
  if (!playerId) return;
  
  // Skip if already cached or already prefetching
  const cacheKey = CacheKeys.publicPlayerProfile(playerId);
  if (cache.has(cacheKey) || prefetchingPlayers.has(playerId)) return;
  
  prefetchingPlayers.add(playerId);
  
  try {
    const [identity, teamPlayerData, seasonAverages, gameStats, awardsData] = await Promise.all([
      PlayerDashboardService.getIdentity(playerId, false),
      supabase!.from('team_players').select('team_id, teams!inner(id, name, logo_url)').eq('player_id', playerId).limit(1).single().then(r => r.data),
      PlayerDashboardService.getSeasonAverages(playerId, false),
      PlayerGameStatsService.getPlayerGameStats(playerId, false),
      GameAwardsService.getPlayerAwards(playerId, false),
    ]);

    if (!identity?.name || identity.isPublicProfile === false) return;

    const team = teamPlayerData?.teams as { name: string; logo_url?: string } | undefined;
    let tournamentStats = buildTournamentStats(gameStats);
    
    if (tournamentStats.length > 0) {
      const { data: logos } = await supabase!.from('tournaments').select('name, logo').in('name', tournamentStats.map(t => t.tournamentName));
      const logoMap = new Map(logos?.map(t => [t.name, t.logo]) || []);
      tournamentStats = tournamentStats.map(t => ({ ...t, tournamentLogo: logoMap.get(t.tournamentName) }));
    }

    const formatHeight = (h: string | number | undefined) => typeof h === 'number' && h > 0 ? `${Math.floor(h / 12)}'${h % 12}"` : undefined;
    const formatWeight = (w: string | number | undefined) => typeof w === 'number' && w > 0 ? `${w} lbs` : undefined;

    const profileData: PublicPlayerProfile = {
      identity: {
        playerId: identity.playerId, name: identity.name, jerseyNumber: identity.jerseyNumber,
        position: identity.position !== 'N/A' ? identity.position : undefined,
        teamName: team?.name || (identity.teamName !== 'N/A' ? identity.teamName : undefined),
        teamLogo: team?.logo_url,
        age: identity.age && identity.age > 0 ? identity.age : undefined,
        height: formatHeight(identity.height), weight: formatWeight(identity.weight),
        location: identity.location, profilePhotoUrl: identity.profilePhotoUrl, posePhotoUrl: identity.posePhotoUrl,
      },
      careerStats: {
        ppg: seasonAverages?.pointsPerGame || 0, rpg: seasonAverages?.reboundsPerGame || 0, apg: seasonAverages?.assistsPerGame || 0,
        fgPct: seasonAverages?.fieldGoalPct || 0, threePct: seasonAverages?.threePointPct || 0, ftPct: seasonAverages?.freeThrowPct || 0,
        mpg: seasonAverages?.minutesPerGame || 0,
      },
      gamesPlayed: gameStats.filter(g => g.gameStatus === 'completed').length,
      tournamentStats, allGames: gameStats, careerHighs: buildCareerHighs(gameStats), awards: countAwards(awardsData),
    };

    cache.set(cacheKey, profileData, CacheTTL.playerGameStats);
    logger.debug('⚡ Prefetched player profile:', playerId.slice(0, 8));
  } catch {
    // Silent failure - prefetch is optional enhancement
  } finally {
    prefetchingPlayers.delete(playerId);
  }
}

