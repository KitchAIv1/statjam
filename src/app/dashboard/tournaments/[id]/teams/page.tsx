'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthV2 } from '@/hooks/useAuthV2';
import { TournamentService, TeamService } from '@/lib/services/tournamentService';
import { Tournament, Team } from '@/lib/types/tournament';
import { GenericPlayer } from '@/lib/types/playerManagement';
import { OrganizerPlayerManagementService } from '@/lib/services/organizerPlayerManagementService';
import { PlayerRosterList } from '@/components/shared/PlayerRosterList';
import { PlayerSelectionList } from '@/components/shared/PlayerSelectionList';
import { TeamCreationModal } from '@/components/shared/TeamCreationModal';
import { 
  Users, 
  Plus, 
  UserPlus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  ArrowLeft,
  Trophy,
  Crown,
  Shield,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TeamManagementPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Team Management Page - CURRENT BRANDING (Orange/Red)
 * 
 * Shows team list + inline player management on same page
 * NO navigation - expands player management inline when team clicked
 * 100% UI changes only - reuses existing components
 */
const TeamManagementPage = ({ params }: TeamManagementPageProps) => {
  const { id: tournamentId } = use(params);
  const { user, loading } = useAuthV2();
  const userRole = user?.role;
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'full' | 'open'>('all');
  
  // ✅ NEW: Inline player management state
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [currentPlayers, setCurrentPlayers] = useState<GenericPlayer[]>([]);
  const [removingPlayer, setRemovingPlayer] = useState<string | null>(null);
  
  const service = new OrganizerPlayerManagementService();
  const minPlayers = 5;

  useEffect(() => {
    if (!loading && (!user || userRole !== 'organizer')) {
      router.push('/auth');
      return;
    }

    const loadData = async () => {
      try {
        setLoadingData(true);
        const [tournamentData, teamsData] = await Promise.all([
          TournamentService.getTournament(tournamentId),
          TeamService.getTeamsByTournament(tournamentId)
        ]);
        setTournament(tournamentData);
        setTeams(teamsData);
      } catch (error) {
        console.error('❌ Failed to load tournament data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user, userRole, loading, tournamentId, router]);

  // ✅ NEW: Load players when team selected
  useEffect(() => {
    const loadPlayers = async () => {
      if (!selectedTeam) {
        setCurrentPlayers([]);
        return;
      }
      
      try {
        const players = await service.getTeamPlayers(selectedTeam.id);
        setCurrentPlayers(players);
      } catch (error) {
        console.error('❌ Error loading players:', error);
      }
    };
    
    loadPlayers();
  }, [selectedTeam]);

  // ✅ NEW: Handle team selection for inline player management
  const handleSelectTeam = (team: Team) => {
    if (selectedTeam?.id === team.id) {
      setSelectedTeam(null); // Toggle off
    } else {
      setSelectedTeam(team); // Select team
    }
  };

  // Player management handlers (NO LOGIC CHANGE)
  const handleRemovePlayer = async (player: GenericPlayer) => {
    if (!player.team_player_id || !selectedTeam) return;

    try {
      setRemovingPlayer(player.id);
      const response = await service.removePlayerFromTeam({
        team_id: selectedTeam.id,
        team_player_id: player.team_player_id
      });

      if (response.success) {
        setCurrentPlayers(prev => prev.filter(p => p.id !== player.id));
        // Refresh teams list
        const teamsData = await TeamService.getTeamsByTournament(tournamentId);
        setTeams(teamsData);
      }
    } catch (error) {
      console.error('❌ Error removing player:', error);
    } finally {
      setRemovingPlayer(null);
    }
  };

  const handlePlayerAdd = (player: GenericPlayer) => {
    setCurrentPlayers(prev => [...prev, { ...player, is_on_team: true }]);
  };

  const handlePlayerRemove = (player: GenericPlayer) => {
    setCurrentPlayers(prev => prev.filter(p => p.id !== player.id));
  };

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.players.some(player => player.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    let matchesFilter = true;
    if (filterStatus === 'full') {
      matchesFilter = team.players.length >= 12;
    } else if (filterStatus === 'open') {
      matchesFilter = team.players.length < 12;
    }
    
    return matchesSearch && matchesFilter;
  });

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50/50 via-background to-red-50/30">
        <div className="flex items-center gap-4 text-lg font-medium">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          Loading Team Management...
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50/50 via-background to-red-50/30">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Tournament Not Found</h2>
          <p className="text-muted-foreground mb-6">The tournament you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/dashboard?section=tournaments')}
            className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            Back to Tournaments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-background to-red-50/30 pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard?section=tournaments')}
            className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-medium text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tournaments
          </button>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
            TEAM MANAGEMENT
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage teams and players for {tournament.name}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search teams or players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2.5 bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Teams</option>
              <option value="open">Open for Players</option>
              <option value="full">Full Teams</option>
            </select>
          </div>

          <button
            onClick={() => setShowCreateTeam(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5" />
            Create Team
          </button>
        </div>

        {/* Teams Grid */}
        {filteredTeams.length > 0 ? (
          <div className="space-y-4">
            {filteredTeams.map((team) => {
              const isSelected = selectedTeam?.id === team.id;
              
              return (
                <div key={team.id} className="bg-white border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* Team Header (Always Visible) */}
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                          <Shield className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-foreground">{team.name}</h3>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm text-muted-foreground">{team.players.length} players</span>
                            <span className="text-sm text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground">{team.wins}W - {team.losses}L</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSelectTeam(team)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-lg font-medium hover:bg-orange-100 transition-colors"
                        >
                          <UserPlus className="w-4 h-4" />
                          Manage Players
                          {isSelected ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
                          <Edit className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ✅ INLINE Player Management (Expandable) */}
                  {isSelected && (
                    <div className="border-t border-border bg-gradient-to-br from-orange-50/30 to-red-50/30 p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Current Roster */}
                        <div className="bg-white rounded-xl p-6 border border-border">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold flex items-center gap-2">
                              <Users className="w-5 h-5 text-orange-600" />
                              Current Roster
                            </h4>
                            <Badge variant={currentPlayers.length >= minPlayers ? "default" : "secondary"}>
                              {currentPlayers.length} player{currentPlayers.length !== 1 ? 's' : ''}
                              {currentPlayers.length >= minPlayers && ' ✓'}
                            </Badge>
                          </div>
                          
                          {/* Reusable Component - NO LOGIC CHANGE */}
                          <PlayerRosterList
                            players={currentPlayers}
                            loading={false}
                            removingPlayer={removingPlayer}
                            onRemovePlayer={handleRemovePlayer}
                          />
                        </div>

                        {/* Add Players */}
                        <div className="bg-white rounded-xl p-6 border border-border">
                          <h4 className="text-lg font-semibold flex items-center gap-2 mb-4">
                            <Users className="w-5 h-5 text-orange-600" />
                            Add Players
                          </h4>
                          
                          {/* Reusable Component - NO LOGIC CHANGE */}
                          <PlayerSelectionList
                            key={currentPlayers.map(p => p.id).join(',')}
                            teamId={team.id}
                            service={service}
                            onPlayerAdd={handlePlayerAdd}
                            onPlayerRemove={handlePlayerRemove}
                            showCustomPlayerOption={false}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-border">
            <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">No teams yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first team to start building your tournament roster
            </p>
            <button
              onClick={() => setShowCreateTeam(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              <Plus className="w-5 h-5" />
              Create First Team
            </button>
          </div>
        )}
      </div>

      {/* Create Team Modal */}
      {showCreateTeam && (
        <TeamCreationModal
          tournamentId={tournamentId}
          service={service}
          onClose={() => setShowCreateTeam(false)}
          onTeamCreated={async (team) => {
            const teamsData = await TeamService.getTeamsByTournament(tournamentId);
            setTeams(teamsData);
            setShowCreateTeam(false);
          }}
        />
      )}
    </div>
  );
};

export default TeamManagementPage;
