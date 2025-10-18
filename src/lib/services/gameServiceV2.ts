import { supabase } from '@/lib/supabase';

/**
 * GameServiceV2 - RLS-Optimized service for Stat Admin Dashboard
 * 
 * OPTIMIZATION: Separate simple queries instead of complex JOINs
 * - RLS-friendly: Each query checks only one table's policies
 * - Fast: Simple queries with indexed columns (.eq, .in)
 * - Reliable: No timeout issues from complex JOINs
 * - Data combined client-side using Maps for O(1) lookups
 * 
 * WHY NOT JOINS: With RLS enabled, PostgreSQL checks policies on each
 * joined table, making 4-table JOINs extremely expensive (10-15s timeout).
 * Separate queries are faster and more reliable.
 * 
 * SCOPE: Only used by Stat Admin Dashboard (/dashboard/stat-admin)
 * All other components continue using GameService (V1)
 */
export class GameServiceV2 {
  /**
   * Get all games assigned to a stat admin with RLS-optimized separate queries
   * 
   * @param statAdminId - The ID of the stat admin user
   * @returns Promise<any[]> - Organized games grouped by organizer
   */
  static async getAssignedGames(statAdminId: string): Promise<any[]> {
    try {
      console.log('🚀 GameServiceV2: Fetching assigned games with RLS-optimized queries for:', statAdminId);
      
      // ⚠️ NOTE: Session sync happens asynchronously at client creation time
      // The custom storage adapter in supabase.ts handles this automatically
      // We just need to wait a bit for it to complete
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for session sync
      
      // ✅ STEP 1: Get games (simple, fast, RLS-friendly)
      console.log('📊 Step 1: Fetching games...');
      console.log('📊 Query: games WHERE stat_admin_id =', statAdminId);
      
      const gamesQueryPromise = supabase
        .from('games')
        .select('id, tournament_id, team_a_id, team_b_id, start_time, status, created_at')
        .eq('stat_admin_id', statAdminId);
      
      // Add timeout to diagnose hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => {
          console.error('⏰ GameServiceV2: Games query timed out after 10 seconds');
          reject(new Error('Games query timeout - RLS policy may be blocking'));
        }, 10000)
      );
      
      const { data: games, error: gamesError } = await Promise.race([
        gamesQueryPromise,
        timeoutPromise
      ]) as any;
      
      if (gamesError) {
        console.error('❌ GameServiceV2: Error fetching games:', gamesError);
        console.error('❌ Error details:', JSON.stringify(gamesError, null, 2));
        throw gamesError;
      }
      
      console.log('✅ Step 1 complete: Found', games?.length || 0, 'games');
      
      if (!games || games.length === 0) {
        console.log('📝 GameServiceV2: No games found for stat admin:', statAdminId);
        return [];
      }
      
      console.log('✅ GameServiceV2: Found', games.length, 'games');
      
      // ✅ STEP 2: Get unique tournament IDs and fetch tournaments
      const tournamentIds = [...new Set(games.map(g => g.tournament_id))];
      console.log('📊 Step 2: Fetching', tournamentIds.length, 'tournaments...');
      
      const { data: tournaments, error: tournamentsError } = await supabase
        .from('tournaments')
        .select('id, name, venue, organizer_id')
        .in('id', tournamentIds);
      
      if (tournamentsError) {
        console.error('❌ GameServiceV2: Error fetching tournaments:', tournamentsError);
        throw tournamentsError;
      }
      
      // ✅ STEP 3: Get unique organizer IDs and fetch organizers
      const organizerIds = [...new Set((tournaments || []).map(t => t.organizer_id))];
      console.log('📊 Step 3: Fetching', organizerIds.length, 'organizers...');
      
      const { data: organizers, error: organizersError } = await supabase
        .from('users')
        .select('id, email')
        .in('id', organizerIds);
      
      if (organizersError) {
        console.error('❌ GameServiceV2: Error fetching organizers:', organizersError);
        throw organizersError;
      }
      
      // ✅ STEP 4: Get unique team IDs and fetch teams
      const teamIds = [...new Set(games.flatMap(g => [g.team_a_id, g.team_b_id]).filter(Boolean))];
      console.log('📊 Step 4: Fetching', teamIds.length, 'teams...');
      
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name')
        .in('id', teamIds);
      
      if (teamsError) {
        console.error('❌ GameServiceV2: Error fetching teams:', teamsError);
        throw teamsError;
      }
      
      console.log('✅ GameServiceV2: All data fetched successfully');
      
      // ✅ STEP 5: Create lookup maps for fast access
      const tournamentMap = new Map((tournaments || []).map(t => [t.id, t]));
      const organizerMap = new Map((organizers || []).map(o => [o.id, o]));
      const teamMap = new Map((teams || []).map(t => [t.id, t]));
      
      // ✅ STEP 6: Transform data to match expected format
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
