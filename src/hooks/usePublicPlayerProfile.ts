/**
 * usePublicPlayerProfile Hook
 * Fetches public player profile data with cache-first loading
 * Follows .cursorrules: Hook <100 lines, delegates to service
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { PlayerDashboardService } from '@/lib/services/playerDashboardService';
import { PlayerGameStatsService } from '@/lib/services/playerGameStatsService';
import { GameAwardsService } from '@/lib/services/gameAwardsService';
import { cache, CacheKeys, CacheTTL } from '@/lib/utils/cache';
import { buildTournamentStats, buildCareerHighs, countAwards, type PublicPlayerProfile, type PublicPlayerIdentity, type TournamentStat, type PlayerAward } from '@/lib/services/publicPlayerProfileService';

export type { PublicPlayerProfile, PublicPlayerIdentity, TournamentStat, PlayerAward };

interface ProfileState { profile: PublicPlayerProfile | null; loading: boolean; error: string | null; notFound: boolean; }

export function usePublicPlayerProfile(playerId: string) {
  const [state, setState] = useState<ProfileState>({ profile: null, loading: true, error: null, notFound: false });

  const fetchProfile = useCallback(async (skipCache = false) => {
    if (!playerId) { setState({ profile: null, loading: false, error: null, notFound: false }); return; }

    const cacheKey = CacheKeys.publicPlayerProfile(playerId);
    if (!skipCache) {
      const cached = cache.get<PublicPlayerProfile>(cacheKey);
      if (cached) { setState({ profile: cached, loading: false, error: null, notFound: false }); return; }
    }
    setState(prev => ({ ...prev, loading: true, error: null, notFound: false }));

    try {
      const [identity, teamPlayerData, seasonAverages, gameStats, awardsData] = await Promise.all([
        PlayerDashboardService.getIdentity(playerId, false),
        supabase.from('team_players').select('team_id, teams!inner(id, name, logo_url)').eq('player_id', playerId).limit(1).single().then(r => r.data),
        PlayerDashboardService.getSeasonAverages(playerId, false),
        PlayerGameStatsService.getPlayerGameStats(playerId, false),
        GameAwardsService.getPlayerAwards(playerId, false),
      ]);

      if (!identity?.name || identity.isPublicProfile === false) { setState({ profile: null, loading: false, error: null, notFound: true }); return; }

      const team = teamPlayerData?.teams as { name: string; logo_url?: string } | undefined;
      let tournamentStats = buildTournamentStats(gameStats);
      
      if (tournamentStats.length > 0) {
        const { data: logos } = await supabase.from('tournaments').select('name, logo').in('name', tournamentStats.map(t => t.tournamentName));
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
          bio: identity.bio, // ✅ Pass bio/about me to public profile
          isPublicProfile: identity.isPublicProfile,
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
      setState({ profile: profileData, loading: false, error: null, notFound: false });
    } catch (err) {
      console.error('❌ usePublicPlayerProfile:', err);
      setState({ profile: null, loading: false, error: 'Failed to load profile', notFound: false });
    }
  }, [playerId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);
  return { ...state, refetch: () => fetchProfile(true) };
}
