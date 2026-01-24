/**
 * useGamePlayers Hook
 * 
 * Fetches team rosters for a selected game using TeamServiceV3 as source of truth.
 * Returns players grouped by team for overlay controls.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { TeamServiceV3 } from '@/lib/services/teamServiceV3';

export interface GamePlayer {
  id: string;
  name: string;
  jerseyNumber?: number;
  profilePhotoUrl?: string;
  teamId: string;
  teamName: string;
  isCustomPlayer: boolean;
}

interface UseGamePlayersReturn {
  teamAPlayers: GamePlayer[];
  teamBPlayers: GamePlayer[];
  teamAName: string;
  teamBName: string;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useGamePlayers(gameId: string | null): UseGamePlayersReturn {
  const [teamAPlayers, setTeamAPlayers] = useState<GamePlayer[]>([]);
  const [teamBPlayers, setTeamBPlayers] = useState<GamePlayer[]>([]);
  const [teamAName, setTeamAName] = useState('Team A');
  const [teamBName, setTeamBName] = useState('Team B');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayers = useCallback(async () => {
    if (!gameId || !supabase) {
      setTeamAPlayers([]);
      setTeamBPlayers([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch game to get team IDs
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('team_a_id, team_b_id')
        .eq('id', gameId)
        .single();

      if (gameError || !game) {
        throw new Error('Game not found');
      }

      const { team_a_id, team_b_id } = game;

      // Fetch team names
      const { data: teams } = await supabase
        .from('teams')
        .select('id, name')
        .in('id', [team_a_id, team_b_id].filter(Boolean));

      const teamsMap = new Map((teams || []).map(t => [t.id, t.name]));
      const teamANameResolved = teamsMap.get(team_a_id) || 'Team A';
      const teamBNameResolved = teamsMap.get(team_b_id) || 'Team B';
      setTeamAName(teamANameResolved);
      setTeamBName(teamBNameResolved);

      // Use TeamServiceV3 as source of truth for players
      const [teamARoster, teamBRoster] = await Promise.all([
        team_a_id ? TeamServiceV3.getTeamPlayers(team_a_id) : Promise.resolve([]),
        team_b_id ? TeamServiceV3.getTeamPlayers(team_b_id) : Promise.resolve([]),
      ]);

      console.log('🏀 useGamePlayers: TeamServiceV3 returned', teamARoster.length, 'Team A,', teamBRoster.length, 'Team B');

      // Map to GamePlayer format
      const mapToGamePlayer = (player: any, teamId: string, teamName: string): GamePlayer => ({
        id: player.id,
        name: player.name || 'Unknown',
        jerseyNumber: player.jerseyNumber,
        profilePhotoUrl: player.photo_url || player.profile_photo_url,
        teamId,
        teamName,
        isCustomPlayer: player.is_custom_player === true,
      });

      // Sort by jersey number
      const sortByJersey = (a: GamePlayer, b: GamePlayer) =>
        (a.jerseyNumber || 99) - (b.jerseyNumber || 99);

      setTeamAPlayers(
        teamARoster.map(p => mapToGamePlayer(p, team_a_id, teamANameResolved)).sort(sortByJersey)
      );
      setTeamBPlayers(
        teamBRoster.map(p => mapToGamePlayer(p, team_b_id, teamBNameResolved)).sort(sortByJersey)
      );

    } catch (err) {
      console.error('❌ useGamePlayers error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load players');
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  return {
    teamAPlayers,
    teamBPlayers,
    teamAName,
    teamBName,
    loading,
    error,
    refresh: fetchPlayers,
  };
}
