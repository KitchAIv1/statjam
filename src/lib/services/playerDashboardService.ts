/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase';
import { cache, CacheKeys, CacheTTL } from '@/lib/utils/cache';
import type {
  PlayerIdentity,
  SeasonAverages,
  CareerHighs,
  PerformanceKpis,
  PerformanceSeriesEntry,
  UpcomingGame,
  AchievementItem,
  NotificationItem,
  TrialState,
} from '@/lib/types/playerDashboard';

// Thin transformers to map snake_case from DB to camelCase for UI
function toIdentity(row: Record<string, unknown>): PlayerIdentity | null {
  if (!row) return null;
  console.log('🔄 Raw identity data from database:', JSON.stringify(row, null, 2));
  
  const transformed = {
    playerId: String(row.id ?? ''),
    name: String((row as any).name ?? (row as any).full_name ?? 'Player Name'),
    jerseyNumber: (row as any).jersey_number ?? 0,
    position: (row as any).position ?? 'N/A',
    teamId: (row as any).team_id ?? undefined,
    teamName: (row as any).team_name ?? 'N/A',
    age: (row as any).age ?? 0,
    height: (row as any).height ?? 'N/A',
    weight: (row as any).weight ?? 'N/A',
    country: (row as any).country ?? undefined,
    profilePhotoUrl: (row as any).profile_photo_url ?? undefined,
    posePhotoUrl: (row as any).pose_photo_url ?? undefined,
  };
  
  console.log('🔄 Transformed identity data:', JSON.stringify(transformed, null, 2));
  return transformed;
}

function toSeasonAverages(row: Record<string, unknown>): SeasonAverages | null {
  if (!row) return null;
  console.log('🔄 Raw season averages data from database:', JSON.stringify(row, null, 2));
  
  const transformed = {
    pointsPerGame: (row as any).ppg ?? (row as any).points_per_game ?? undefined,
    reboundsPerGame: (row as any).rpg ?? (row as any).rebounds_per_game ?? undefined,
    assistsPerGame: (row as any).apg ?? (row as any).assists_per_game ?? undefined,
    fieldGoalPct: (row as any).fg_pct ?? (row as any).field_goal_pct ?? undefined,
    threePointPct: (row as any).tp_pct ?? (row as any).three_point_pct ?? undefined,
    freeThrowPct: (row as any).ft_pct ?? (row as any).free_throw_pct ?? undefined,
    minutesPerGame: (row as any).mpg ?? (row as any).minutes_per_game ?? undefined,
  };
  
  console.log('🔄 Transformed season averages:', JSON.stringify(transformed, null, 2));
  return transformed;
}

function toCareerHighs(row: Record<string, unknown>): CareerHighs | null {
  if (!row) return null;
  console.log('🔄 Raw career highs data from database:', JSON.stringify(row, null, 2));
  
  const transformed = {
    points: (row as any).points ?? undefined,
    rebounds: (row as any).rebounds ?? undefined,
    assists: (row as any).assists ?? undefined,
    blocks: (row as any).blocks ?? undefined,
    steals: (row as any).steals ?? undefined,
    threes: (row as any).threes ?? (row as any).three_pointers ?? undefined,
    ftm: (row as any).ftm ?? (row as any).free_throws_made ?? undefined,
  };
  
  console.log('🔄 Transformed career highs:', JSON.stringify(transformed, null, 2));
  return transformed;
}

function toKpis(row: Record<string, unknown>): PerformanceKpis | null {
  if (!row) return null;
  console.log('🔄 Raw KPIs data from database:', JSON.stringify(row, null, 2));
  
  const transformed = {
    trendVsLastMonthPercent: (row as any).trend_vs_last_month_percent ?? undefined,
    seasonHighPoints: (row as any).season_high_points ?? undefined,
    overallRating: (row as any).overall_rating ?? undefined,
  };
  
  console.log('🔄 Transformed KPIs:', JSON.stringify(transformed, null, 2));
  return transformed;
}

function toSeries(rows: Array<Record<string, unknown>>): PerformanceSeriesEntry[] {
  return (rows || []).map((r) => ({
    date: String((r as any).date ?? ''),
    opponentTeamName: (r as any).opponent_team_name ?? undefined,
    points: (r as any).points ?? undefined,
    rebounds: (r as any).rebounds ?? undefined,
    assists: (r as any).assists ?? undefined,
    fgm: (r as any).fgm ?? undefined,
    fga: (r as any).fga ?? undefined,
    threePm: (r as any).three_pm ?? undefined,
    threePa: (r as any).three_pa ?? undefined,
    ftm: (r as any).ftm ?? undefined,
    fta: (r as any).fta ?? undefined,
    minutes: (r as any).minutes ?? undefined,
  }));
}

function toAchievement(row: Record<string, unknown>): AchievementItem {
  return {
    id: String(row.id ?? ''),
    type: String(row.type ?? ''),
    label: (row as any).label ?? undefined,
    value: (row as any).value ?? undefined,
    unlockedAt: (row as any).unlocked_at ?? null,
  };
}

function toNotification(row: Record<string, unknown>): NotificationItem {
  return {
    id: String(row.id ?? ''),
    title: String(row.title ?? ''),
    message: String(row.message ?? ''),
    createdAt: String(row.created_at ?? ''),
    isRead: Boolean((row as any).is_read),
    type: String(row.type ?? ''),
  };
}

export class PlayerDashboardService {
  static async getIdentity(userId: string): Promise<PlayerIdentity | null> {
    if (!userId) {
      console.log('🔍 PlayerDashboard: No user ID provided');
      return null;
    }
    
    // Check cache first
    const cacheKey = CacheKeys.user(userId);
    const cachedIdentity = cache.get<PlayerIdentity>(cacheKey);
    if (cachedIdentity) {
      console.log('✅ PlayerDashboard: Returning cached identity for user:', userId);
      return cachedIdentity;
    }
    
    console.log('🔍 PlayerDashboard: Fetching identity for user:', userId);
    const { data, error } = await supabase
      .from('users')
      .select('id, name, jersey_number, position, age, height, weight, country, profile_photo_url, pose_photo_url')
      .eq('id', userId)
      .single();
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('🔍 PlayerDashboard: New user - no profile data yet');
        // Return a basic identity object for new users
        return {
          playerId: userId,
          name: '',
          jerseyNumber: undefined,
          position: '',
          teamId: undefined,
          teamName: '',
          age: undefined,
          height: '',
          weight: '',
          country: undefined,
          profilePhotoUrl: undefined,
          posePhotoUrl: undefined,
        };
      }
      console.error('🔍 PlayerDashboard: Identity fetch error:', error);
      return null;
    }
    console.log('🔍 PlayerDashboard: Identity data received:', data);
    const identity = toIdentity(data);
    
    // Cache the identity data
    if (identity) {
      cache.set(cacheKey, identity, CacheTTL.USER_DATA);
      console.log('💾 PlayerDashboard: Cached identity for user:', userId);
    }
    
    return identity;
  }

  static async getSeasonAverages(userId: string): Promise<SeasonAverages | null> {
    if (!userId) {
      console.log('🔍 PlayerDashboard: No user ID provided for season averages');
      return null;
    }
    console.log('🔍 PlayerDashboard: Fetching season averages for user:', userId);
    const { data, error } = await supabase
      .from('player_season_averages')
      .select('*')
      .eq('player_id', userId)
      .single();
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('🔍 PlayerDashboard: New user - no season averages yet');
        return null;
      }
      console.error('🔍 PlayerDashboard: Season averages fetch error:', error);
      return null;
    }
    console.log('🔍 PlayerDashboard: Season averages data received:', data);
    return toSeasonAverages(data);
  }

  static async getCareerHighs(userId: string): Promise<CareerHighs | null> {
    if (!userId) {
      console.log('🔍 PlayerDashboard: No user ID provided for career highs');
      return null;
    }
    console.log('🔍 PlayerDashboard: Fetching career highs for user:', userId);
    const { data, error } = await supabase
      .from('player_career_highs')
      .select('*')
      .eq('player_id', userId)
      .single();
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('🔍 PlayerDashboard: New user - no career highs yet');
        return null;
      }
      console.error('🔍 PlayerDashboard: Career highs fetch error:', error);
      return null;
    }
    console.log('🔍 PlayerDashboard: Career highs data received:', data);
    return toCareerHighs(data);
  }

  static async getPerformance(userId: string): Promise<{ kpis: PerformanceKpis | null; series: PerformanceSeriesEntry[] }> {
    if (!userId) {
      console.log('🔍 PlayerDashboard: No user ID provided for performance');
      return { kpis: null, series: [] };
    }
    
    try {
      console.log('🔍 PlayerDashboard: Fetching performance analytics for user:', userId);
      const { data, error } = await supabase
        .from('player_performance_analytics')
        .select('*')
        .eq('player_id', userId);
        
      console.log('🔍 PlayerDashboard: Raw response:', { data, error, hasData: !!data, dataLength: data?.length });
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log('🔍 PlayerDashboard: New user - no performance analytics yet');
        } else if (error.code === '42P01') {
          console.log('🔍 PlayerDashboard: Performance analytics table/view does not exist yet');
        } else {
          console.log('🔍 PlayerDashboard: Performance analytics query error:', error.message, error.code);
        }
        return { kpis: null, series: [] };
      }
      
      if (!data || data.length === 0) {
        console.log('🔍 PlayerDashboard: No performance data available for this user');
        return { kpis: null, series: [] };
      }
      
      console.log('🔍 PlayerDashboard: Performance analytics data received:', data);
      // Assume first row carries KPIs; all rows are series entries
      const kpis = toKpis(data[0]);
      const series = toSeries(data);
      return { kpis, series };
      
    } catch (err) {
      console.log('🔍 PlayerDashboard: Unexpected error in getPerformance:', err);
      return { kpis: null, series: [] };
    }
  }

  static async getAchievements(userId: string): Promise<AchievementItem[]> {
    if (!userId) return [];
    const { data, error } = await supabase
      .from('player_achievements')
      .select('*')
      .eq('player_id', userId)
      .order('unlocked_at', { ascending: false });
    if (error || !data) return [];
    return data.map(toAchievement);
  }

  static async getNotifications(userId: string): Promise<NotificationItem[]> {
    if (!userId) return [];
    const { data, error } = await supabase
      .from('player_notifications')
      .select('*')
      .eq('player_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error || !data) return [];
    return data.map(toNotification);
  }

  static async getUpcomingGames(userId: string): Promise<UpcomingGame[]> {
    if (!userId) return [];
    
    try {
      console.log('🔍 PlayerDashboard: Fetching upcoming games for player:', userId);

      // Step 1: Get player's team assignments
      const { data: teamPlayers, error: teamError } = await supabase
        .from('team_players')
        .select('team_id')
        .eq('player_id', userId);

      if (teamError) {
        console.error('❌ PlayerDashboard: Error fetching player teams:', teamError);
        return [];
      }

      if (!teamPlayers || teamPlayers.length === 0) {
        console.log('📝 PlayerDashboard: Player not assigned to any teams');
        return [];
      }

      const teamIds = teamPlayers.map(tp => tp.team_id);
      console.log('🏀 PlayerDashboard: Player belongs to', teamIds.length, 'teams');

      // Step 2: Get upcoming games for player's teams
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select(`
          id,
          start_time,
          status,
          tournament_id,
          team_a_id,
          team_b_id,
          team_a:teams!team_a_id (id, name),
          team_b:teams!team_b_id (id, name),
          tournaments:tournament_id (name, venue)
        `)
        .or(`team_a_id.in.(${teamIds.join(',')}),team_b_id.in.(${teamIds.join(',')})`)
        .gte('start_time', new Date().toISOString())
        .in('status', ['scheduled', 'in_progress'])
        .order('start_time', { ascending: true })
        .limit(10);

      if (gamesError) {
        console.error('❌ PlayerDashboard: Error fetching upcoming games:', gamesError);
        return [];
      }

      if (!games || games.length === 0) {
        console.log('📝 PlayerDashboard: No upcoming games found');
        return [];
      }

      // Step 3: Transform to UpcomingGame format
      const upcomingGames: UpcomingGame[] = games.map(game => {
        // Determine opponent team
        const playerTeamId = teamIds.find(id => id === game.team_a_id || id === game.team_b_id);
        const isTeamA = playerTeamId === game.team_a_id;
        const opponentTeamName = isTeamA ? game.team_b?.name : game.team_a?.name;
        const opponentTeamId = isTeamA ? game.team_b_id : game.team_a_id;

        return {
          gameId: game.id,
          tournamentId: game.tournament_id,
          tournamentName: game.tournaments?.name || 'Tournament',
          opponentTeamId: opponentTeamId,
          opponentTeamName: opponentTeamName || 'Unknown Team',
          scheduledAt: game.start_time,
          status: game.status,
          location: game.tournaments?.venue || 'TBD'
        };
      });

      console.log('✅ PlayerDashboard: Found', upcomingGames.length, 'upcoming games');
      return upcomingGames;

    } catch (error) {
      console.error('❌ PlayerDashboard: Error in getUpcomingGames:', error);
      return [];
    }
  }

  static async getTrialState(userId: string): Promise<TrialState> {
    if (!userId) return { isTrialActive: false };
    const { data } = await supabase
      .from('users')
      .select('trial_start')
      .eq('id', userId)
      .single();
    const trialStart = (data as any)?.trial_start as string | null | undefined;
    if (!trialStart) return { isTrialActive: false, trialStart: null };
    const start = new Date(trialStart).getTime();
    const now = Date.now();
    const days = 30 * 24 * 3600 * 1000;
    return { isTrialActive: now < start + days, trialStart };
  }
}


