/**
 * Avatar Preload Service
 * Preloads user avatars on sign-in for Facebook-like instant loading
 */

import { avatarCache } from '@/lib/utils/avatarCache';
import { supabase } from '@/lib/supabase';

export class AvatarPreloadService {
  /**
   * Preload current user's avatar immediately on sign-in
   */
  static async preloadCurrentUserAvatar(userId: string): Promise<void> {
    try {
      // Fetch user profile photo URL
      const { data, error } = await supabase
        .from('users')
        .select('profile_photo_url')
        .eq('id', userId)
        .single();

      if (error || !data?.profile_photo_url) {
        return;
      }

      // Preload avatar in background
      await avatarCache.preloadAvatar(data.profile_photo_url);
    } catch (error) {
      console.warn('Failed to preload current user avatar:', error);
    }
  }

  /**
   * Preload avatars for dashboard users (teammates, coaches, etc.)
   */
  static async preloadDashboardAvatars(userId: string, userRole: string): Promise<void> {
    try {
      const avatarUrls: string[] = [];

      if (userRole === 'player') {
        // Preload team avatars, coach avatar
        const { data: teamData } = await supabase
          .from('team_players')
          .select('player_id, team_id')
          .eq('player_id', userId)
          .limit(1)
          .single();

        if (teamData?.team_id) {
          // Get teammates
          const { data: teammates } = await supabase
            .from('team_players')
            .select('player_id')
            .eq('team_id', teamData.team_id)
            .limit(10);

          if (teammates) {
            const playerIds = teammates.map(t => t.player_id);
            const { data: players } = await supabase
              .from('users')
              .select('profile_photo_url')
              .in('id', playerIds);

            if (players) {
              avatarUrls.push(...players.map(p => p.profile_photo_url).filter(Boolean));
            }
          }

          // Get coach avatar
          const { data: team } = await supabase
            .from('teams')
            .select('coach_id')
            .eq('id', teamData.team_id)
            .single();

          if (team?.coach_id) {
            const { data: coach } = await supabase
              .from('users')
              .select('profile_photo_url')
              .eq('id', team.coach_id)
              .single();

            if (coach?.profile_photo_url) {
              avatarUrls.push(coach.profile_photo_url);
            }
          }
        }
      } else if (userRole === 'coach') {
        // Preload team player avatars
        const { data: teams } = await supabase
          .from('teams')
          .select('id')
          .eq('coach_id', userId)
          .limit(5);

        if (teams) {
          const teamIds = teams.map(t => t.id);
          const { data: teamPlayers } = await supabase
            .from('team_players')
            .select('player_id')
            .in('team_id', teamIds)
            .limit(20);

          if (teamPlayers) {
            const playerIds = teamPlayers.map(tp => tp.player_id);
            const { data: players } = await supabase
              .from('users')
              .select('profile_photo_url')
              .in('id', playerIds);

            if (players) {
              avatarUrls.push(...players.map(p => p.profile_photo_url).filter(Boolean));
            }
          }
        }
      } else if (userRole === 'organizer') {
        // Preload tournament participant avatars
        const { data: tournaments } = await supabase
          .from('tournaments')
          .select('id')
          .eq('organizer_id', userId)
          .limit(3);

        if (tournaments) {
          const tournamentIds = tournaments.map(t => t.id);
          const { data: teams } = await supabase
            .from('teams')
            .select('id')
            .in('tournament_id', tournamentIds)
            .limit(10);

          if (teams) {
            const teamIds = teams.map(t => t.id);
            const { data: teamPlayers } = await supabase
              .from('team_players')
              .select('player_id')
              .in('team_id', teamIds)
              .limit(30);

            if (teamPlayers) {
              const playerIds = teamPlayers.map(tp => tp.player_id);
              const { data: players } = await supabase
                .from('users')
                .select('profile_photo_url')
                .in('id', playerIds);

              if (players) {
                avatarUrls.push(...players.map(p => p.profile_photo_url).filter(Boolean));
              }
            }
          }
        }
      }

      // Preload all avatars in parallel (non-blocking)
      if (avatarUrls.length > 0) {
        avatarCache.preloadAvatars(avatarUrls).catch(err => {
          console.warn('Background avatar preload failed:', err);
        });
      }
    } catch (error) {
      console.warn('Failed to preload dashboard avatars:', error);
    }
  }

  /**
   * Preload avatars for a specific list of user IDs
   */
  static async preloadUserAvatars(userIds: string[]): Promise<void> {
    if (userIds.length === 0) return;

    try {
      const { data: users } = await supabase
        .from('users')
        .select('profile_photo_url')
        .in('id', userIds);

      if (users) {
        const avatarUrls = users.map(u => u.profile_photo_url).filter(Boolean);
        await avatarCache.preloadAvatars(avatarUrls);
      }
    } catch (error) {
      console.warn('Failed to preload user avatars:', error);
    }
  }
}
