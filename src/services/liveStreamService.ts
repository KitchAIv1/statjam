import { supabase } from '@/lib/supabase';
import { GameService } from '@/lib/services/gameService';
import { LiveGame, GameStat } from '@/types/liveStream';

function filterLiveGames(games: any[]): any[] {
  return games.filter(game => {
    const status = String(game.status || '').toLowerCase();
    return status === 'live' || status === 'in_progress';
  });
}

async function fetchTeamsData(teamIds: string[]) {
  if (teamIds.length === 0) return new Map();
  
  const { data: teamsData } = await supabase
    .from('teams')
    .select('id, name, logo_url, primary_color, secondary_color, accent_color')
    .in('id', teamIds);
  
  return new Map((teamsData || []).map(t => [t.id, t]));
}

function mapGameToLiveGame(game: any, teamsMap: Map<string, any>): LiveGame {
  const teamA = teamsMap.get(game.team_a_id);
  const teamB = teamsMap.get(game.team_b_id);
  
  return {
    id: game.id,
    team_a_id: game.team_a_id,
    team_b_id: game.team_b_id,
    team_a_name: teamA?.name || 'Team A',
    team_b_name: teamB?.name || 'Team B',
    home_score: game.home_score || 0,
    away_score: game.away_score || 0,
    quarter: game.quarter || 1,
    status: game.status,
    game_clock_minutes: game.game_clock_minutes || 10,
    game_clock_seconds: game.game_clock_seconds || 0,
    team_a_logo: teamA?.logo_url,
    team_b_logo: teamB?.logo_url,
    team_a_primary_color: teamA?.primary_color,
    team_b_primary_color: teamB?.primary_color,
    team_a_fouls: game.team_a_fouls,
    team_b_fouls: game.team_b_fouls,
    team_a_timeouts: game.team_a_timeouts_remaining,
    team_b_timeouts: game.team_b_timeouts_remaining,
    current_possession_team_id: game.current_possession_team_id,
    jump_ball_arrow_team_id: game.jump_ball_arrow_team_id,
    venue: game.venue,
  };
}

function sortGamesByCreatedAt(games: LiveGame[], allGames: any[]): LiveGame[] {
  return games.sort((a, b) => {
    const gameA = allGames.find(g => g.id === a.id);
    const gameB = allGames.find(g => g.id === b.id);
    const dateA = gameA?.created_at ? new Date(gameA.created_at).getTime() : 0;
    const dateB = gameB?.created_at ? new Date(gameB.created_at).getTime() : 0;
    return dateB - dateA;
  });
}

interface FetchGamesParams {
  tournamentId?: string;
  user?: { id: string } | null;
  tournaments: any[];
}

export const liveStreamService = {
  async fetchGames({ tournamentId, user, tournaments }: FetchGamesParams): Promise<LiveGame[]> {
    if (tournamentId) {
      return this.fetchGamesByTournament(tournamentId);
    }
    
    if (user?.id && tournaments.length > 0) {
      return this.fetchGamesByOrganizer(tournaments);
    }
    
    return [];
  },

  async fetchGamesByTournament(tournamentId: string): Promise<LiveGame[]> {
    const allGames = await GameService.getGamesByTournament(tournamentId);
    const liveGames = filterLiveGames(allGames);
    const teamIds = [...new Set(liveGames.flatMap(g => [g.team_a_id, g.team_b_id]).filter(Boolean))];
    const teamsMap = await fetchTeamsData(teamIds);
    return sortGamesByCreatedAt(
      liveGames.map(game => mapGameToLiveGame(game, teamsMap)),
      liveGames
    );
  },

  async fetchGamesByOrganizer(tournaments: any[]): Promise<LiveGame[]> {
    const tournamentGamesPromises = tournaments.map(tournament =>
      GameService.getGamesByTournament(tournament.id)
        .then(filterLiveGames)
        .catch(() => [])
    );
    
    const tournamentGamesArrays = await Promise.all(tournamentGamesPromises);
    const allGames = tournamentGamesArrays.flat();
    const teamIds = [...new Set(allGames.flatMap(g => [g.team_a_id, g.team_b_id]).filter(Boolean))];
    const teamsMap = await fetchTeamsData(teamIds);
    return sortGamesByCreatedAt(
      allGames.map(game => mapGameToLiveGame(game, teamsMap)),
      allGames
    );
  },

  async fetchGameStats(gameId: string): Promise<GameStat[]> {
    const { data, error } = await supabase
      .from('game_stats')
      .select('id, game_id, player_id, team_id, stat_type, stat_value, modifier, is_opponent_stat')
      .eq('game_id', gameId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  subscribeToUpdates(gameId: string, callbacks: {
    onStatsChange: () => void;
    onGameUpdate: (update: any) => void;
  }) {
    const statsChannel = supabase
      .channel(`game_stats:${gameId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_stats',
        filter: `game_id=eq.${gameId}`,
      }, () => callbacks.onStatsChange())
      .subscribe();

    const gamesChannel = supabase
      .channel(`game:${gameId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'games',
        filter: `id=eq.${gameId}`,
      }, (payload) => callbacks.onGameUpdate(payload.new))
      .subscribe();

    return () => {
      supabase.removeChannel(statsChannel);
      supabase.removeChannel(gamesChannel);
    };
  },
};

