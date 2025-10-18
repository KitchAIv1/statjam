import { useState, useEffect, useCallback } from 'react';
import { TeamService } from '@/lib/services/tournamentService';
import { Team, Player } from '@/lib/types/tournament';

interface TeamManagementState {
  teams: Team[];
  loading: boolean;
  error: string | null;
  stats: {
    totalTeams: number;
    totalPlayers: number;
    divisions: number;
  };
}

export function useTeamManagement(tournamentId: string, user: { id: string } | null) {
  const [state, setState] = useState<TeamManagementState>({
    teams: [],
    loading: true,
    error: null,
    stats: {
      totalTeams: 0,
      totalPlayers: 0,
      divisions: 0
    }
  });

  const fetchTeams = useCallback(async () => {
    if (!user?.id || !tournamentId) {
      console.log('🔍 useTeamManagement: No user ID or tournament ID, skipping fetch');
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    // Prevent multiple simultaneous fetches
    setState(prev => {
      if (prev.loading) {
        console.log('🔍 useTeamManagement: Already loading, skipping duplicate fetch');
        return prev;
      }
      return { ...prev, loading: true, error: null };
    });
    
    try {
      console.log('🔍 useTeamManagement: Fetching teams for tournament:', tournamentId);
      const teams = await TeamService.getTeamsByTournament(tournamentId);
      
      // Calculate stats
      const totalTeams = teams.length;
      const totalPlayers = teams.reduce((sum, team) => sum + team.players.length, 0);
      const divisions = new Set(teams.map(team => team.division || 'Unknown')).size;
      
      setState({
        teams,
        loading: false,
        error: null,
        stats: {
          totalTeams,
          totalPlayers,
          divisions
        }
      });
      
      console.log('🔍 useTeamManagement: Teams fetched successfully:', {
        teamsCount: teams.length,
        totalPlayers,
        divisions
      });
    } catch (error) {
      console.error('❌ useTeamManagement: Error fetching teams:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch teams'
      }));
    }
  }, [user?.id, tournamentId]);

  const createTeam = useCallback(async (teamData: { name: string; coach?: string }) => {
    if (!user?.id || !tournamentId) {
      throw new Error('User not authenticated or tournament ID missing');
    }

    try {
      console.log('🔍 useTeamManagement: Creating team:', teamData);
      const newTeam = await TeamService.createTeam({
        ...teamData,
        tournamentId
      });
      
      // Refresh teams list
      await fetchTeams();
      
      console.log('✅ useTeamManagement: Team created successfully:', newTeam.name);
      return newTeam;
    } catch (error) {
      console.error('❌ useTeamManagement: Error creating team:', error);
      throw error;
    }
  }, [user?.id, tournamentId, fetchTeams]);

  const deleteTeam = useCallback(async (teamId: string) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('🔍 useTeamManagement: Deleting team:', teamId);
      await TeamService.deleteTeam(teamId);
      
      // Refresh teams list to reflect the deletion
      await fetchTeams();
      
      console.log('✅ useTeamManagement: Team deleted successfully');
    } catch (error) {
      console.error('❌ useTeamManagement: Error deleting team:', error);
      throw error;
    }
  }, [user?.id, fetchTeams]);

  const addPlayerToTeam = useCallback(async (teamId: string, playerId: string) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('🔍 useTeamManagement: Adding player to team:', { teamId, playerId });
      await TeamService.addPlayerToTeam(teamId, playerId);
      
      // Refresh teams list
      await fetchTeams();
      
      console.log('✅ useTeamManagement: Player added to team successfully');
    } catch (error) {
      console.error('❌ useTeamManagement: Error adding player to team:', error);
      throw error;
    }
  }, [user?.id, fetchTeams]);

  const removePlayerFromTeam = useCallback(async (teamId: string, playerId: string) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('🔍 useTeamManagement: Removing player from team:', { teamId, playerId });
      await TeamService.removePlayerFromTeam(teamId, playerId);
      
      // Refresh teams list
      await fetchTeams();
      
      console.log('✅ useTeamManagement: Player removed from team successfully');
    } catch (error) {
      console.error('❌ useTeamManagement: Error removing player from team:', error);
      throw error;
    }
  }, [user?.id, fetchTeams]);

  // Initial data load
  useEffect(() => {
    if (user?.id && tournamentId) {
      fetchTeams();
    }
  }, [user?.id, tournamentId, fetchTeams]);

  return {
    ...state,
    refetch: fetchTeams,
    createTeam,
    deleteTeam,
    addPlayerToTeam,
    removePlayerFromTeam
  };
}
