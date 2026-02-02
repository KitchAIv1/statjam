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
import { ALLOW_UNCLAIMED_PROFILES_TOURNAMENTS } from '@/lib/constants/publicProfileWhitelist';

export type { PublicPlayerProfile, PublicPlayerIdentity, TournamentStat, PlayerAward };

interface ProfileState { 
  profile: PublicPlayerProfile | null; 
  loading: boolean; 
  error: string | null; 
  notFound: boolean;
  /** If set, the page should redirect to this user ID (claimed profile) */
  redirectTo: string | null;
}

export function usePublicPlayerProfile(playerId: string) {
  const [state, setState] = useState<ProfileState>({ 
    profile: null, loading: true, error: null, notFound: false, redirectTo: null 
  });

  const fetchProfile = useCallback(async (skipCache = false) => {
    if (!playerId) { 
      setState({ profile: null, loading: false, error: null, notFound: false, redirectTo: null }); 
      return; 
    }

    // ═══════════════════════════════════════════════════════════════
    // CLAIMED PROFILE REDIRECT CHECK
    // If this playerId is a claimed custom_player, redirect to new user ID
    // ═══════════════════════════════════════════════════════════════
    const { data: claimedPlayer } = await supabase
      .from('custom_players')
      .select('claimed_by_user_id')
      .eq('id', playerId)
      .not('claimed_by_user_id', 'is', null)
      .single();

    if (claimedPlayer?.claimed_by_user_id) {
      console.log('🔄 usePublicPlayerProfile: Detected claimed profile, redirecting to:', claimedPlayer.claimed_by_user_id);
      setState({ profile: null, loading: false, error: null, notFound: false, redirectTo: claimedPlayer.claimed_by_user_id });
      return;
    }

    const cacheKey = CacheKeys.publicPlayerProfile(playerId);
    if (!skipCache) {
      const cached = cache.get<PublicPlayerProfile>(cacheKey);
      if (cached) { setState({ profile: cached, loading: false, error: null, notFound: false, redirectTo: null }); return; }
    }
    setState(prev => ({ ...prev, loading: true, error: null, notFound: false, redirectTo: null }));

    try {
      // First, try regular player path
      let identity = await PlayerDashboardService.getIdentity(playerId, false);
      let isCustomPlayer = false;
      let teamPlayerData = await supabase.from('team_players').select('team_id, teams!inner(id, name, logo_url, tournament_id)').eq('player_id', playerId).limit(1).single().then(r => r.data);

      // If regular player not found or not public, check for whitelisted custom player
      if (!identity?.name || identity.isPublicProfile === false) {
        // Check if this is a custom player in a whitelisted tournament
        const customPlayerData = await supabase
          .from('team_players')
          .select('custom_player_id, team_id, teams!inner(id, name, logo_url, tournament_id)')
          .eq('custom_player_id', playerId)
          .limit(1)
          .single()
          .then(r => r.data);

        if (customPlayerData) {
          const tournamentId = (customPlayerData.teams as any)?.tournament_id;
          if (tournamentId && ALLOW_UNCLAIMED_PROFILES_TOURNAMENTS.includes(tournamentId)) {
            // ✅ Whitelisted tournament - fetch custom player identity
            identity = await PlayerDashboardService.getIdentity(playerId, true);
            isCustomPlayer = true;
            teamPlayerData = customPlayerData as any;
          }
        }

        // Still not found after whitelist check
        if (!identity?.name) {
          setState({ profile: null, loading: false, error: null, notFound: true, redirectTo: null });
          return;
        }
      }

      // Fetch remaining data (use custom player flag for correct queries)
      const [seasonAverages, gameStats, awardsData] = await Promise.all([
        PlayerDashboardService.getSeasonAverages(playerId, isCustomPlayer),
        PlayerGameStatsService.getPlayerGameStats(playerId, isCustomPlayer),
        GameAwardsService.getPlayerAwards(playerId, isCustomPlayer),
      ]);

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
      setState({ profile: profileData, loading: false, error: null, notFound: false, redirectTo: null });
    } catch (err) {
      console.error('❌ usePublicPlayerProfile:', err);
      setState({ profile: null, loading: false, error: 'Failed to load profile', notFound: false, redirectTo: null });
    }
  }, [playerId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);
  return { ...state, refetch: () => fetchProfile(true) };
}
