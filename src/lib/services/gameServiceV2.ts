import { supabase } from '@/lib/supabase';

/**
 * GameServiceV2 - Optimized service for Stat Admin Dashboard
 * 
 * OPTIMIZATION: Single JOIN query instead of 3 separate queries
 * - Reduces database IO by 66% (3 queries → 1 query)
 * - Faster response times through server-side JOINs
 * - Better resource utilization
 * 
 * SCOPE: Only used by Stat Admin Dashboard (/dashboard/stat-admin)
 * All other components continue using GameService (V1)
 */
export class GameServiceV2 {
  /**
   * Get all games assigned to a stat admin with optimized single JOIN query
   * 
   * @param statAdminId - The ID of the stat admin user
   * @returns Promise<any[]> - Organized games grouped by organizer
   */
  static async getAssignedGames(statAdminId: string): Promise<any[]> {
    try {
      console.log('🚀 GameServiceV2: Fetching assigned games with single JOIN query for:', statAdminId);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 15000) // Slightly longer for JOIN
      );
      
      // OPTIMIZED: Single JOIN query to get all data at once
      const joinQueryPromise = supabase
        .from('games')
        .select(`
          id,
          tournament_id,
          team_a_id,
          team_b_id,
          start_time,
          status,
          created_at,
          tournaments!inner (
            id,
            name,
            venue,
            organizer_id,
            users!tournaments_organizer_id_fkey (
              id,
              email
            )
          ),
          team_a:teams!games_team_a_id_fkey (
            id,
            name
          ),
          team_b:teams!games_team_b_id_fkey (
            id,
            name
          )
        `)
        .eq('stat_admin_id', statAdminId);
      
      const { data: joinedGames, error: joinError } = await Promise.race([
        joinQueryPromise,
        timeoutPromise
      ]) as any;
      
      if (joinError) {
        console.warn('⚠️ GameServiceV2: JOIN query failed, falling back to V1:', joinError.message);
        
        // FALLBACK: Import and use V1 method if JOIN fails
        const { GameService } = await import('./gameService');
        return await GameService.getAssignedGames(statAdminId);
      }
      
      if (!joinedGames || joinedGames.length === 0) {
        console.log('📝 GameServiceV2: No games found for stat admin:', statAdminId);
        return [];
      }
      
      console.log('✅ GameServiceV2: JOIN query successful, processing', joinedGames.length, 'games');
      
      // Transform the joined data to match expected format
      const transformedGames = joinedGames.map((game: any) => {
        const tournament = game.tournaments;
        const organizer = tournament?.users;
        
        return {
          id: game.id,
          tournamentName: tournament?.name || 'Unknown Tournament',
          teamA: game.team_a?.name || 'Team A',
          teamB: game.team_b?.name || 'Team B',
          teamAId: game.team_a_id,
          teamBId: game.team_b_id,
          scheduledDate: game.start_time,
          venue: tournament?.venue || 'TBD',
          status: game.status,
          tournamentId: game.tournament_id,
          createdAt: game.created_at,
          organizer: organizer ? {
            id: organizer.id,
            name: organizer.email, // Using email as display name
            email: organizer.email
          } : null
        };
      });
      
      // Sort by creation date (newest first) - same logic as V1
      const sortedGames = transformedGames.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || a.scheduledDate);
        const dateB = new Date(b.createdAt || b.scheduledDate);
        return dateB.getTime() - dateA.getTime();
      });
      
      // Group by organizer - same logic as V1
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
      
      // Convert to array and sort organizer groups by most recent game - same logic as V1
      const organizedGames = Object.values(groupedByOrganizer).sort((a: any, b: any) => {
        const latestA = new Date(a.games[0]?.createdAt || a.games[0]?.scheduledDate || 0);
        const latestB = new Date(b.games[0]?.createdAt || b.games[0]?.scheduledDate || 0);
        return latestB.getTime() - latestA.getTime();
      });
      
      console.log('🎯 GameServiceV2: Successfully organized', organizedGames.length, 'organizer groups');
      
      return organizedGames;
      
    } catch (error) {
      console.error('❌ GameServiceV2: Error in optimized query:', error);
      
      // FALLBACK: Use V1 on any error
      console.log('🔄 GameServiceV2: Falling back to V1 implementation');
      try {
        const { GameService } = await import('./gameService');
        return await GameService.getAssignedGames(statAdminId);
      } catch (fallbackError) {
        console.error('❌ GameServiceV2: V1 fallback also failed:', fallbackError);
        throw new Error('Failed to load assigned games. Please try again.');
      }
    }
  }
}
