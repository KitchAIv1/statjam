/**
 * Game Viewer API Route
 * Uses service role to bypass RLS for public game viewing
 * 
 * ✅ ALL GAMES ARE PUBLICLY VIEWABLE (spectator view)
 * - Coach games: Public (shareable link for parents/fans)
 * - Organizer games: Public (shareable link for spectators)
 * - Security: UUID-based (unguessable game IDs)
 * - Data: READ-ONLY spectator data (scores, stats, player names)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    
    // ✅ ALL GAMES ARE PUBLIC - No auth required for spectator view
    // Fetch full game data with service role (bypasses RLS)
    const { data: game, error: gameError } = await supabaseAdmin
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();
    
    // Log access for debugging
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

    // Fetch team players for both teams
    const { data: teamPlayers } = await supabaseAdmin
      .from('team_players')
      .select(`
        id,
        team_id,
        player_id,
        custom_player_id,
        jersey_number,
        position
      `)
      .in('team_id', teamIds);

    // Get player IDs from team_players (will combine with stats later)
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

    // ✅ FIX: Also get player IDs from stats (in case some players are not in team_players)
    const statsPlayerIds = stats?.filter(s => s.player_id).map(s => s.player_id) || [];
    const statsCustomPlayerIds = stats?.filter(s => s.custom_player_id).map(s => s.custom_player_id) || [];
    
    // Combine all player IDs (team_players + stats)
    const allPlayerIds = [...new Set([...teamPlayerIds, ...statsPlayerIds])];
    const allCustomPlayerIds = [...new Set([...teamCustomPlayerIds, ...statsCustomPlayerIds])];

    // Fetch ALL users (from team_players + stats)
    const { data: allUsers } = allPlayerIds.length > 0 
      ? await supabaseAdmin.from('users').select('id, name, email, avatar_url, profile_photo_url').in('id', allPlayerIds)
      : { data: [] };

    // Fetch ALL custom players (from team_players + stats)
    const { data: allCustomPlayers } = allCustomPlayerIds.length > 0
      ? await supabaseAdmin.from('custom_players').select('id, name, photo_url, profile_photo_url, jersey_number').in('id', allCustomPlayerIds)
      : { data: [] };

    return NextResponse.json({
      game,
      teams: teams || [],
      teamPlayers: teamPlayers || [],
      users: allUsers || [],
      customPlayers: allCustomPlayers || [],
      stats: stats || [],
      substitutions: substitutions || [],
      timeouts: timeouts || []
    });

  } catch (error: any) {
    console.error('❌ Game viewer API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

