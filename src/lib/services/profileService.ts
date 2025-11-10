// ============================================================================
// PROFILE SERVICE
// ============================================================================
// Purpose: Business logic for user profile management
// Follows .cursorrules: <200 lines, single responsibility
// ============================================================================

import { supabase } from '../supabase';
import {
  BaseProfile,
  OrganizerProfile,
  OrganizerStats,
  CoachProfile,
  CoachStats,
  StatAdminProfile,
  StatAdminStats,
  ProfileUpdateRequest,
  ProfileShareData,
  UserRole
} from '../types/profile';

export class ProfileService {
  /**
   * Get organizer profile with stats
   */
  static async getOrganizerProfile(userId: string): Promise<OrganizerProfile | null> {
    try {
      // Fetch user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, name, role, profile_photo_url, bio, location, social_links, created_at')
        .eq('id', userId)
        .eq('role', 'organizer')
        .single();

      if (userError || !userData) {
        console.error('❌ Error fetching organizer profile:', userError);
        return null;
      }

      // First, get all tournament IDs for this organizer
      const { data: tournamentsData, error: tournamentsError } = await supabase
        .from('tournaments')
        .select('id, status')
        .eq('organizer_id', userId);

      if (tournamentsError) {
        console.error('❌ Error fetching tournaments:', tournamentsError);
        return null;
      }

      const tournamentIds = tournamentsData?.map(t => t.id) || [];
      
      // Fetch stats in parallel (only if there are tournaments)
      let teamsData = { count: 0 };
      let gamesData = { count: 0 };

      if (tournamentIds.length > 0) {
        const [teamsResult, gamesResult] = await Promise.all([
          // Total teams across all tournaments
          supabase
            .from('teams')
            .select('id', { count: 'exact', head: true })
            .in('tournament_id', tournamentIds),
          
          // Total games across all tournaments
          supabase
            .from('games')
            .select('id', { count: 'exact', head: true })
            .in('tournament_id', tournamentIds)
        ]);

        teamsData = teamsResult;
        gamesData = gamesResult;
      }

      const totalTournaments = tournamentsData?.length || 0;
      const activeTournaments = tournamentsData?.filter(t => t.status === 'active').length || 0;
      const totalTeams = teamsData.count || 0;
      const totalGames = gamesData.count || 0;

      const stats: OrganizerStats = {
        totalTournaments,
        activeTournaments,
        totalTeams,
        totalGames
      };

      return {
        id: userData.id,
        email: userData.email,
        name: userData.name || userData.email.split('@')[0],
        role: 'organizer',
        profilePhotoUrl: userData.profile_photo_url,
        bio: userData.bio,
        location: userData.location,
        socialLinks: userData.social_links,
        createdAt: userData.created_at,
        stats
      };
    } catch (error) {
      console.error('❌ Error in getOrganizerProfile:', error);
      return null;
    }
  }

  /**
   * Get coach profile with stats
   */
  static async getCoachProfile(userId: string): Promise<CoachProfile | null> {
    try {
      // Fetch user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, name, role, profile_photo_url, bio, location, social_links, created_at')
        .eq('id', userId)
        .eq('role', 'coach')
        .single();

      if (userError || !userData) {
        console.error('❌ Error fetching coach profile:', userError);
        return null;
      }

      // First, get all team IDs for this coach
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('id', { count: 'exact', head: false })
        .eq('coach_id', userId);

      if (teamsError) {
        console.error('❌ Error fetching coach teams:', teamsError);
        return null;
      }

      const teamIds = teamsData?.map(t => t.id) || [];
      
      // Fetch stats in parallel
      const [gamesResult, playersResult] = await Promise.all([
        // Total games tracked
        supabase
          .from('games')
          .select('id', { count: 'exact', head: true })
          .eq('stat_admin_id', userId)
          .eq('is_coach_game', true),
        
        // Total players across all teams (only if there are teams)
        teamIds.length > 0
          ? supabase
              .from('team_players')
              .select('player_id', { count: 'exact', head: true })
              .in('team_id', teamIds)
          : Promise.resolve({ count: 0 })
      ]);

      const gamesData = gamesResult;
      const playersData = playersResult;

      const stats: CoachStats = {
        totalTeams: teamsData.count || 0,
        gamesTracked: gamesData.count || 0,
        totalPlayers: playersData.count || 0
      };

      return {
        id: userData.id,
        email: userData.email,
        name: userData.name || userData.email.split('@')[0],
        role: 'coach',
        profilePhotoUrl: userData.profile_photo_url,
        bio: userData.bio,
        location: userData.location,
        socialLinks: userData.social_links,
        createdAt: userData.created_at,
        stats
      };
    } catch (error) {
      console.error('❌ Error in getCoachProfile:', error);
      return null;
    }
  }

  /**
   * Get stat admin profile with stats
   */
  static async getStatAdminProfile(userId: string): Promise<StatAdminProfile | null> {
    try {
      // Fetch user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, name, role, profile_photo_url, bio, location, social_links, created_at')
        .eq('id', userId)
        .eq('role', 'stat_admin')
        .single();

      if (userError || !userData) {
        console.error('❌ Error fetching stat admin profile:', userError);
        return null;
      }

      // Get games where this stat admin is assigned
      const { data: gamesData, error: gamesError } = await supabase
        .from('games')
        .select('id, status')
        .eq('stat_admin_id', userId);

      if (gamesError) {
        console.error('❌ Error fetching stat admin games:', gamesError);
        return null;
      }

      const totalGamesAssigned = gamesData?.length || 0;
      const gamesCompleted = gamesData?.filter(g => g.status === 'completed').length || 0;
      const gamesPending = totalGamesAssigned - gamesCompleted;
      const completionRate = totalGamesAssigned > 0 
        ? Math.round((gamesCompleted / totalGamesAssigned) * 100)
        : 0;

      const stats: StatAdminStats = {
        totalGamesAssigned,
        gamesCompleted,
        gamesPending,
        completionRate
      };

      return {
        id: userData.id,
        email: userData.email,
        name: userData.name || userData.email.split('@')[0],
        role: 'stat_admin',
        profilePhotoUrl: userData.profile_photo_url,
        bio: userData.bio,
        location: userData.location,
        socialLinks: userData.social_links,
        createdAt: userData.created_at,
        stats
      };
    } catch (error) {
      console.error('❌ Error in getStatAdminProfile:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, updates: ProfileUpdateRequest): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: updates.name,
          bio: updates.bio,
          location: updates.location,
          social_links: updates.socialLinks,
          profile_photo_url: updates.profilePhotoUrl
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ Error updating profile:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Error in updateProfile:', error);
      return false;
    }
  }

  /**
   * Generate profile share data
   */
  static generateShareData(profileData: BaseProfile): ProfileShareData {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://statjam.com';
    const profileUrl = `${baseUrl}/profile/${profileData.role}/${profileData.id}`;
    
    let roleLabel = 'User';
    switch (profileData.role) {
      case 'organizer':
        roleLabel = 'Tournament Organizer';
        break;
      case 'coach':
        roleLabel = 'Coach';
        break;
      case 'stat_admin':
        roleLabel = 'Stat Admin';
        break;
    }
    
    const shareText = `Check out ${profileData.name}'s profile on StatJam! ${roleLabel} | ${profileUrl}`;

    return {
      profileUrl,
      shareText
    };
  }
}

