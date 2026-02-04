/**
 * Activity Monitor Service
 * Fetches activity data from existing tables for admin monitoring
 * Max 200 lines per service rule
 */

import { supabase } from '@/lib/supabase';
import {
  ActivityItem,
  ActivityFiltersState,
  ActivityAlerts,
  ActivityFeedResponse,
  TimeRangeFilter,
} from '@/lib/types/activityMonitor';

const PAGE_SIZE = 25;

export class ActivityMonitorService {
  /**
   * Get time cutoff based on filter
   */
  private static getTimeCutoff(timeRange: TimeRangeFilter): string {
    const now = new Date();
    switch (timeRange) {
      case '1h':
        now.setHours(now.getHours() - 1);
        break;
      case '24h':
        now.setDate(now.getDate() - 1);
        break;
      case '7d':
        now.setDate(now.getDate() - 7);
        break;
      case '30d':
        now.setDate(now.getDate() - 30);
        break;
    }
    return now.toISOString();
  }

  /**
   * Fetch tournaments created within time range
   */
  private static async fetchTournamentActivities(
    cutoff: string,
    search?: string
  ): Promise<ActivityItem[]> {
    let query = supabase
      .from('tournaments')
      .select('id, name, status, organizer_id, created_at')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching tournament activities:', error.message || error);
      return [];
    }

    // Get organizer info including role
    const organizerIds = [...new Set((data || []).map(t => t.organizer_id).filter(Boolean))];
    let organizerMap = new Map<string, { email: string; role: string }>();
    
    if (organizerIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, email, role')
        .in('id', organizerIds);
      
      if (users) {
        organizerMap = new Map(users.map(u => [u.id, { email: u.email, role: u.role }]));
      }
    }

    return (data || []).map((t: any) => ({
      id: `tournament-${t.id}`,
      type: 'tournament_created' as const,
      userEmail: organizerMap.get(t.organizer_id)?.email || 'Unknown',
      userId: t.organizer_id,
      userRole: organizerMap.get(t.organizer_id)?.role || 'organizer',
      entityName: t.name,
      entityId: t.id,
      createdAt: t.created_at,
    }));
  }

  /**
   * Fetch games scheduled within time range
   */
  private static async fetchGameActivities(
    cutoff: string,
    search?: string
  ): Promise<ActivityItem[]> {
    const { data, error } = await supabase
      .from('games')
      .select(`
        id, created_at, tournament_id,
        team_a:teams!team_a_id(name),
        team_b:teams!team_b_id(name),
        tournaments:tournament_id(id, name, organizer_id)
      `)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching game activities:', error.message || error);
      return [];
    }

    // Get organizer info including role
    const organizerIds = [...new Set((data || []).map((g: any) => g.tournaments?.organizer_id).filter(Boolean))];
    let organizerMap = new Map<string, { email: string; role: string }>();
    
    if (organizerIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, email, role')
        .in('id', organizerIds);
      
      if (users) {
        organizerMap = new Map(users.map(u => [u.id, { email: u.email, role: u.role }]));
      }
    }

    return (data || [])
      .filter((g: any) => {
        if (!search) return true;
        const matchTerm = search.toLowerCase();
        return (
          g.team_a?.name?.toLowerCase().includes(matchTerm) ||
          g.team_b?.name?.toLowerCase().includes(matchTerm) ||
          g.tournaments?.name?.toLowerCase().includes(matchTerm)
        );
      })
      .map((g: any) => ({
        id: `game-${g.id}`,
        type: 'game_scheduled' as const,
        userEmail: organizerMap.get(g.tournaments?.organizer_id)?.email || 'Unknown',
        userId: g.tournaments?.organizer_id || '',
        userRole: organizerMap.get(g.tournaments?.organizer_id)?.role || 'organizer',
        entityName: `${g.team_a?.name || 'TBD'} vs ${g.team_b?.name || 'TBD'}`,
        entityId: g.id,
        parentEntityName: g.tournaments?.name,
        parentEntityId: g.tournaments?.id,
        createdAt: g.created_at,
      }));
  }

  /**
   * Fetch teams created within time range
   */
  private static async fetchTeamActivities(
    cutoff: string,
    search?: string
  ): Promise<ActivityItem[]> {
    let query = supabase
      .from('teams')
      .select(`
        id, name, created_at, tournament_id, coach_id,
        tournaments:tournament_id(id, name, organizer_id)
      `)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching team activities:', error.message || error);
      return [];
    }

    // Collect all user IDs (organizers from tournaments + coaches)
    const organizerIds = (data || []).map((t: any) => t.tournaments?.organizer_id).filter(Boolean);
    const coachIds = (data || []).map((t: any) => t.coach_id).filter(Boolean);
    const allUserIds = [...new Set([...organizerIds, ...coachIds])];
    
    let userMap = new Map<string, { email: string; role: string }>();
    
    if (allUserIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, email, role')
        .in('id', allUserIds);
      
      if (users) {
        userMap = new Map(users.map(u => [u.id, { email: u.email, role: u.role }]));
      }
    }

    return (data || []).map((t: any) => {
      // Determine creator: organizer (via tournament) or coach (direct)
      const creatorId = t.tournaments?.organizer_id || t.coach_id;
      const creatorInfo = userMap.get(creatorId);
      const defaultRole = t.tournaments?.organizer_id ? 'organizer' : 'coach';
      
      return {
        id: `team-${t.id}`,
        type: 'team_created' as const,
        userEmail: creatorInfo?.email || 'Unknown',
        userId: creatorId || '',
        userRole: creatorInfo?.role || defaultRole,
        entityName: t.name,
        entityId: t.id,
        parentEntityName: t.tournaments?.name,
        parentEntityId: t.tournaments?.id,
        createdAt: t.created_at,
      };
    });
  }

  /**
   * Fetch currently live streaming tournaments
   */
  private static async fetchStreamingActivities(search?: string): Promise<ActivityItem[]> {
    const { data, error } = await supabase
      .from('tournaments')
      .select('id, name, organizer_id, updated_at')
      .eq('is_streaming', true);

    if (error) {
      console.error('Error fetching streaming activities:', error.message || error);
      return [];
    }

    const organizerIds = [...new Set((data || []).map(t => t.organizer_id).filter(Boolean))];
    let organizerMap = new Map<string, { email: string; role: string }>();
    if (organizerIds.length > 0) {
      const { data: users } = await supabase.from('users').select('id, email, role').in('id', organizerIds);
      if (users) organizerMap = new Map(users.map(u => [u.id, { email: u.email, role: u.role }]));
    }

    return (data || [])
      .filter((t: any) => !search || t.name?.toLowerCase().includes(search.toLowerCase()))
      .map((t: any) => ({
        id: `stream-${t.id}`,
        type: 'live_stream_started' as const,
        userEmail: organizerMap.get(t.organizer_id)?.email || 'Unknown',
        userId: t.organizer_id,
        userRole: organizerMap.get(t.organizer_id)?.role || 'organizer',
        entityName: t.name,
        entityId: t.id,
        createdAt: t.updated_at || new Date().toISOString(),
      }));
  }

  /**
   * Fetch games currently being tracked (in_progress)
   */
  private static async fetchTrackingActivities(search?: string): Promise<ActivityItem[]> {
    const { data, error } = await supabase
      .from('games')
      .select(`
        id, updated_at, stat_admin_id,
        team_a:teams!team_a_id(name),
        team_b:teams!team_b_id(name),
        tournaments:tournament_id(id, name)
      `)
      .eq('status', 'in_progress');

    if (error) {
      console.error('Error fetching tracking activities:', error.message || error);
      return [];
    }

    const statAdminIds = [...new Set((data || []).map((g: any) => g.stat_admin_id).filter(Boolean))];
    let adminMap = new Map<string, { email: string; role: string }>();
    if (statAdminIds.length > 0) {
      const { data: users } = await supabase.from('users').select('id, email, role').in('id', statAdminIds);
      if (users) adminMap = new Map(users.map(u => [u.id, { email: u.email, role: u.role }]));
    }

    return (data || [])
      .filter((g: any) => {
        if (!search) return true;
        const term = search.toLowerCase();
        return g.team_a?.name?.toLowerCase().includes(term) || 
               g.team_b?.name?.toLowerCase().includes(term) ||
               g.tournaments?.name?.toLowerCase().includes(term);
      })
      .map((g: any) => ({
        id: `tracking-${g.id}`,
        type: 'manual_tracking_started' as const,
        userEmail: adminMap.get(g.stat_admin_id)?.email || 'Unknown',
        userId: g.stat_admin_id || '',
        userRole: adminMap.get(g.stat_admin_id)?.role || 'stat_admin',
        entityName: `${g.team_a?.name || 'TBD'} vs ${g.team_b?.name || 'TBD'}`,
        entityId: g.id,
        parentEntityName: g.tournaments?.name,
        parentEntityId: g.tournaments?.id,
        createdAt: g.updated_at || new Date().toISOString(),
      }));
  }

  /**
   * Fetch video tracking requests within time range
   */
  private static async fetchVideoActivities(
    cutoff: string,
    search?: string
  ): Promise<ActivityItem[]> {
    const { data, error } = await supabase
      .from('game_videos')
      .select(`
        id, status, created_at, uploaded_by, game_id,
        games:game_id(
          id,
          team_a:teams!team_a_id(name),
          team_b:teams!team_b_id(name),
          tournaments:tournament_id(id, name)
        )
      `)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching video activities:', error.message || error);
      return [];
    }

    // Get uploader info
    const uploaderIds = [...new Set((data || []).map((v: any) => v.uploaded_by).filter(Boolean))];
    let userMap = new Map<string, { email: string; role: string }>();
    
    if (uploaderIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, email, role')
        .in('id', uploaderIds);
      
      if (users) {
        userMap = new Map(users.map(u => [u.id, { email: u.email, role: u.role }]));
      }
    }

    return (data || [])
      .filter((v: any) => {
        if (!search) return true;
        const term = search.toLowerCase();
        const game = v.games;
        return game?.team_a?.name?.toLowerCase().includes(term) ||
               game?.team_b?.name?.toLowerCase().includes(term) ||
               game?.tournaments?.name?.toLowerCase().includes(term);
      })
      .map((v: any) => {
        const uploaderInfo = userMap.get(v.uploaded_by);
        const game = v.games;
        const gameName = game 
          ? `${game.team_a?.name || 'TBD'} vs ${game.team_b?.name || 'TBD'}`
          : 'Unknown Game';
        
        return {
          id: `video-${v.id}`,
          type: 'video_uploaded' as const,
          userEmail: uploaderInfo?.email || 'Unknown',
          userId: v.uploaded_by || '',
          userRole: uploaderInfo?.role || 'coach',
          entityName: gameName,
          entityId: v.game_id,
          parentEntityName: game?.tournaments?.name,
          parentEntityId: game?.tournaments?.id,
          createdAt: v.created_at,
        };
      });
  }

  /**
   * Fetch user signups within time range
   */
  private static async fetchUserActivities(
    cutoff: string,
    search?: string
  ): Promise<ActivityItem[]> {
    let query = supabase
      .from('users')
      .select('id, email, role, created_at')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.ilike('email', `%${search}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching user activities:', error.message || error);
      return [];
    }

    return (data || []).map((u: any) => ({
      id: `user-${u.id}`,
      type: 'user_signup' as const,
      userEmail: u.email,
      userId: u.id,
      userRole: u.role,
      entityName: u.email,
      entityId: u.id,
      createdAt: u.created_at,
    }));
  }

  /**
   * Get activity feed with filters and pagination
   */
  static async getActivityFeed(
    filters: ActivityFiltersState,
    page: number = 0
  ): Promise<ActivityFeedResponse> {
    const cutoff = this.getTimeCutoff(filters.timeRange);
    const search = filters.search?.trim() || undefined;

    // Fetch activities based on filter
    const activities: ActivityItem[] = [];

    if (filters.activityType === 'all' || filters.activityType === 'tournaments') {
      activities.push(...await this.fetchTournamentActivities(cutoff, search));
    }
    if (filters.activityType === 'all' || filters.activityType === 'games') {
      activities.push(...await this.fetchGameActivities(cutoff, search));
    }
    if (filters.activityType === 'all' || filters.activityType === 'teams') {
      activities.push(...await this.fetchTeamActivities(cutoff, search));
    }
    if (filters.activityType === 'all' || filters.activityType === 'users') {
      activities.push(...await this.fetchUserActivities(cutoff, search));
    }
    if (filters.activityType === 'all' || filters.activityType === 'streaming') {
      activities.push(...await this.fetchStreamingActivities(search));
    }
    if (filters.activityType === 'all' || filters.activityType === 'tracking') {
      activities.push(...await this.fetchTrackingActivities(search));
    }
    if (filters.activityType === 'all' || filters.activityType === 'videos') {
      activities.push(...await this.fetchVideoActivities(cutoff, search));
    }

    // Filter by user type
    let filtered = activities;
    if (filters.userType !== 'all') {
      const roleMap: Record<string, string> = {
        organizer: 'organizer',
        coach: 'coach',
        player: 'player',
        stat_admin: 'stat_admin',
      };
      filtered = activities.filter(a => a.userRole === roleMap[filters.userType]);
    }

    // Sort by date descending
    filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Paginate
    const start = page * PAGE_SIZE;
    const items = filtered.slice(start, start + PAGE_SIZE);

    return {
      items,
      total: filtered.length,
      hasMore: start + PAGE_SIZE < filtered.length,
    };
  }

  /**
   * Get alert counts for dashboard banner
   */
  static async getAlerts(): Promise<ActivityAlerts> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const [tournaments, streams, users, videos] = await Promise.all([
      supabase
        .from('tournaments')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayISO),
      supabase
        .from('tournaments')
        .select('id', { count: 'exact', head: true })
        .eq('is_streaming', true),
      supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayISO),
      supabase
        .from('game_videos')
        .select('id', { count: 'exact', head: true })
        .in('status', ['pending', 'processing', 'ready']),
    ]);

    return {
      newTournaments: tournaments.count || 0,
      liveStreams: streams.count || 0,
      videosPending: videos.count || 0,
      newUsers: users.count || 0,
    };
  }
}
