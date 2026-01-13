/**
 * Game Viewer API Route
 * Uses service role to bypass RLS for public game viewing
 * 
 * ✅ ALL GAMES ARE PUBLICLY VIEWABLE (spectator view)
 * - Coach games: Public (shareable link for parents/fans)
 * - Organizer games: Public (shareable link for spectators)
 * - Security: UUID-based (unguessable game IDs)
 * - Data: READ-ONLY spectator data (scores, stats, player names)
 * 
 * @module GameViewerAPI
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { computeTeamStats, computeOpponentStats } from '@/lib/services/publicGameStatsService';

// Lazy initialization to avoid build-time errors
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { gameId } = await params;
    
    // Fetch game data (bypasses RLS)
    const { data: game, error: gameError } = await supabaseAdmin
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();
    
    console.log(`📺 Game viewer API: Public access - ${gameId.substring(0, 8)}`);

    if (gameError || !game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Fetch teams
    const teamIds = [game.team_a_id, game.team_b_id].filter(Boolean);
    const { data: teams } = await supabaseAdmin
      .from('teams')
      .select('id, name, logo_url')
      .in('id', teamIds);

    // Fetch team players
    const { data: teamPlayers } = await supabaseAdmin
      .from('team_players')
      .select('id, team_id, player_id, custom_player_id, jersey_number, position')
      .in('team_id', teamIds);

    // Get player IDs from team_players
    const teamPlayerIds = teamPlayers?.filter(tp => tp.player_id).map(tp => tp.player_id) || [];
    const teamCustomPlayerIds = teamPlayers?.filter(tp => tp.custom_player_id).map(tp => tp.custom_player_id) || [];

    // Fetch game stats
    const { data: stats } = await supabaseAdmin
      .from('game_stats')
      .select('*')
      .eq('game_id', gameId);

    // Fetch substitutions
    const { data: substitutions } = await supabaseAdmin
      .from('game_substitutions')
      .select('*')
      .eq('game_id', gameId);

    // Fetch timeouts
    const { data: timeouts } = await supabaseAdmin
      .from('game_timeouts')
      .select('*')
      .eq('game_id', gameId);

    // Collect ALL player IDs from stats AND substitutions
    const statsPlayerIds = stats?.filter(s => s.player_id).map(s => s.player_id) || [];
    const statsCustomPlayerIds = stats?.filter(s => s.custom_player_id).map(s => s.custom_player_id) || [];
    const subPlayerInIds = substitutions?.filter(s => s.player_in_id).map(s => s.player_in_id) || [];
    const subPlayerOutIds = substitutions?.filter(s => s.player_out_id).map(s => s.player_out_id) || [];
    const subCustomPlayerInIds = substitutions?.filter(s => s.custom_player_in_id).map(s => s.custom_player_in_id) || [];
    const subCustomPlayerOutIds = substitutions?.filter(s => s.custom_player_out_id).map(s => s.custom_player_out_id) || [];
    
    // Combine all player IDs
    const allPlayerIds = [...new Set([...teamPlayerIds, ...statsPlayerIds, ...subPlayerInIds, ...subPlayerOutIds])];
    const allCustomPlayerIds = [...new Set([...teamCustomPlayerIds, ...statsCustomPlayerIds, ...subCustomPlayerInIds, ...subCustomPlayerOutIds])];

    // Fetch users for player_id values
    const { data: allUsers } = allPlayerIds.length > 0 
      ? await supabaseAdmin.from('users').select('id, name, email, avatar_url, profile_photo_url').in('id', allPlayerIds)
      : { data: [] };
    
    // Find player_ids NOT found in users (might be custom players)
    const foundUserIds = new Set((allUsers || []).map(u => u.id));
    const missingPlayerIds = allPlayerIds.filter(id => !foundUserIds.has(id));
    const allPossibleCustomPlayerIds = [...new Set([...allCustomPlayerIds, ...missingPlayerIds])];

    // Fetch custom players
    let allCustomPlayers: any[] = [];
    if (allPossibleCustomPlayerIds.length > 0) {
      const { data, error } = await supabaseAdmin
        .from('custom_players')
        .select('id, name, profile_photo_url, jersey_number')
        .in('id', allPossibleCustomPlayerIds);
      
      if (error) {
        console.error('❌ Game viewer API: custom_players query error:', error);
      } else {
        allCustomPlayers = data || [];
      }
    }

    // Compute team stats for coach games (public viewers)
    let computedTeamAStats = null;
    let computedTeamBStats = null;
    
    if (game.is_coach_game && stats && stats.length > 0) {
      const usersMap = new Map((allUsers || []).map(u => [u.id, u]));
      const customPlayersMap = new Map((allCustomPlayers || []).map(cp => [cp.id, cp]));
      
      computedTeamAStats = computeTeamStats(stats, game.team_a_id, true, usersMap, customPlayersMap);
      computedTeamBStats = computeOpponentStats(stats);
      
      console.log(`📺 Game viewer API: Computed coach stats - ${computedTeamAStats.players.length} players`);
    }

    return NextResponse.json({
      game,
      teams: teams || [],
      teamPlayers: teamPlayers || [],
      users: allUsers || [],
      customPlayers: allCustomPlayers || [],
      stats: stats || [],
      substitutions: substitutions || [],
      timeouts: timeouts || [],
      computedTeamAStats,
      computedTeamBStats
    });

  } catch (error: any) {
    console.error('❌ Game viewer API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
