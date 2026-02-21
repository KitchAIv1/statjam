import { GameServiceV3 } from './gameServiceV3';
import { cache, CacheKeys, CacheTTL } from '../utils/cache';

/**
 * StatAdminDashboardService - Optimized dashboard data fetching with caching
 * 
 * OPTIMIZATIONS:
 * 1. ✅ Caching with 5-minute TTL
 * 2. ✅ Parallel fetching for tournaments, organizers, teams
 * 3. ✅ Progressive loading (essential data first)
 */
export class StatAdminDashboardService {
  private static readonly SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  private static readonly SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  /**
   * Get access token from authServiceV2 localStorage
   */
  private static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('sb-access-token');
  }

  /**
   * Make authenticated HTTP request to Supabase REST API
   */
  private static async makeRequest<T>(
    table: string, 
    params: Record<string, string> = {}
  ): Promise<T[]> {
    const accessToken = this.getAccessToken();
    
    if (!accessToken) {
      throw new Error('No access token found - user not authenticated');
    }

    if (!this.SUPABASE_URL || !this.SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase configuration');
    }

    // Build query string
    const queryString = new URLSearchParams(params).toString();
    const url = `${this.SUPABASE_URL}/rest/v1/${table}${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': this.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ StatAdminDashboard: HTTP ${response.status}:`, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Get assigned games with OPTIMIZED PARALLEL FETCHING and CACHING
   */
  static async getAssignedGamesOptimized(statAdminId: string): Promise<any[]> {
    try {
      console.log('🚀 StatAdminDashboard: OPTIMIZED fetch for:', statAdminId);
      const startTime = performance.now();

      // ✅ CHECK CACHE FIRST
      const cacheKey = `stat-admin-games-${statAdminId}`;
      const cached = cache.get<any[]>(cacheKey);
      if (cached) {
        console.log('✅ StatAdminDashboard: Returning CACHED data (5min TTL)');
        return cached;
      }

      // ✅ STEP 1: Fetch assigned games AND demo games
      console.log('📊 Step 1: Fetching assigned + demo games...');
      const games = await this.makeRequest<any>('games', {
        'select': 'id,tournament_id,team_a_id,team_b_id,start_time,status,created_at,is_demo,quarter_length_minutes',
        'or': `(stat_admin_id.eq.${statAdminId},is_demo.eq.true)`
      });

      if (!games || games.length === 0) {
        console.log('📝 StatAdminDashboard: No games found');
        const emptyResult: any[] = [];
        cache.set(cacheKey, emptyResult, CacheTTL.FIVE_MINUTES);
        return emptyResult;
      }

      console.log('✅ Step 1: Found', games.length, 'games');

      // ✅ STEP 2: Extract unique IDs
      const tournamentIds = [...new Set(games.map(g => g.tournament_id))];
      const teamIds = [...new Set(games.flatMap(g => [g.team_a_id, g.team_b_id]).filter(Boolean))];

      // ✅ STEP 3: PARALLEL FETCH (tournaments + teams)
      console.log('🚀 Step 2: PARALLEL fetch - tournaments + teams');
      const parallelStart = performance.now();
      
      const [tournaments, teams] = await Promise.all([
        this.makeRequest<any>('tournaments', {
          'select': 'id,name,venue,organizer_id',
          'id': `in.(${tournamentIds.join(',')})`
        }),
        this.makeRequest<any>('teams', {
          'select': 'id,name',
          'id': `in.(${teamIds.join(',')})`
        })
      ]);

      console.log(`✅ Parallel fetch complete in ${Math.round(performance.now() - parallelStart)}ms`);

      // ✅ STEP 4: Fetch organizers (depends on tournament data)
      const organizerIds = [...new Set(tournaments.map(t => t.organizer_id))];
      console.log('📊 Step 3: Fetching', organizerIds.length, 'organizers');
      
      const organizers = await this.makeRequest<any>('users', {
        'select': 'id,email,name',
        'id': `in.(${organizerIds.join(',')})`
      });

      // ✅ STEP 5: Create lookup maps for O(1) access
      const tournamentMap = new Map(tournaments.map(t => [t.id, t]));
      const organizerMap = new Map(organizers.map(o => [o.id, o]));
      const teamMap = new Map(teams.map(t => [t.id, t]));

      // ✅ STEP 6: Transform data (optimized with maps)
      const transformedGames = games.map((game: any) => {
        const tournament = tournamentMap.get(game.tournament_id);
        const organizer = tournament ? organizerMap.get(tournament.organizer_id) : null;
        const teamA = teamMap.get(game.team_a_id);
        const teamB = teamMap.get(game.team_b_id);

        return {
          id: game.id,
          tournamentName: tournament?.name || 'Unknown Tournament',
          teamA: teamA?.name || 'Team A',
          teamB: teamB?.name || 'Team B',
          teamAId: game.team_a_id,
          teamBId: game.team_b_id,
          scheduledDate: game.start_time,
          venue: tournament?.venue || 'TBD',
          status: game.status,
          tournamentId: game.tournament_id,
          createdAt: game.created_at,
          is_demo: game.is_demo || false, // ✅ Include demo flag
          quarter_length_minutes: game.quarter_length_minutes,
          tournament: tournament, // Include full tournament object for automation flags
          organizer: organizer ? {
            id: organizer.id,
            name: organizer.name || organizer.email,
            email: organizer.email
          } : null
        };
      });

      // Sort: Demo games first, then by start_time ascending (1st game → last game of season)
      const sortedGames = transformedGames.sort((a: any, b: any) => {
        // Demo games always come first
        if (a.is_demo && !b.is_demo) return -1;
        if (!a.is_demo && b.is_demo) return 1;
        // Chronological order (earliest first = Game 1 → last)
        const dateA = new Date(a.scheduledDate || a.createdAt).getTime();
        const dateB = new Date(b.scheduledDate || b.createdAt).getTime();
        return dateA - dateB;
      });

      // Group by organizer
      const groupedByOrganizer = sortedGames.reduce((groups: any, game: any) => {
        const organizerKey = game.organizer?.id || 'unknown';
        const organizerName = game.organizer?.name || 'Unknown Organizer';

        if (!groups[organizerKey]) {
          groups[organizerKey] = {
            organizerId: organizerKey,
            organizerName: organizerName,
            organizerEmail: game.organizer?.email || '',
            games: []
          };
        }

        groups[organizerKey].games.push(game);
        return groups;
      }, {} as Record<string, { organizerId: string; organizerName: string; organizerEmail: string; games: any[] }>);

      // Convert to array and sort organizer groups by earliest game (1st → last)
      const organizedGames = Object.values(groupedByOrganizer).sort((a: any, b: any) => {
        const earliestA = new Date(a.games[0]?.scheduledDate || a.games[0]?.createdAt || 0).getTime();
        const earliestB = new Date(b.games[0]?.scheduledDate || b.games[0]?.createdAt || 0).getTime();
        return earliestA - earliestB;
      });

      const totalTime = Math.round(performance.now() - startTime);
      console.log(`✅ StatAdminDashboard: OPTIMIZED fetch complete in ${totalTime}ms`);
      console.log(`🎯 Organized ${organizedGames.length} organizer groups with ${games.length} total games`);

      // ✅ CACHE RESULTS (5-minute TTL)
      cache.set(cacheKey, organizedGames, CacheTTL.FIVE_MINUTES);
      console.log('💾 StatAdminDashboard: Cached results for 5 minutes');

      return organizedGames;

    } catch (error: any) {
      console.error('❌ StatAdminDashboard: Optimized fetch failed:', error);
      throw new Error(`Failed to load assigned games: ${error.message}`);
    }
  }

  /**
   * Clear cache for stat admin (useful for manual refresh)
   */
  static clearCache(statAdminId: string): void {
    const cacheKey = `stat-admin-games-${statAdminId}`;
    cache.delete(cacheKey);
    console.log('🗑️ StatAdminDashboard: Cache cleared for:', statAdminId);
  }
}

