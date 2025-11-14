'use client';

import React, { useState, useEffect, use, useMemo } from 'react';
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
  Shield,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PhotoUploadField } from '@/components/ui/PhotoUploadField';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';

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
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  
  // ✅ NEW: Inline player management state
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [currentPlayers, setCurrentPlayers] = useState<GenericPlayer[]>([]);
  const [removingPlayer, setRemovingPlayer] = useState<string | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Logo loading states per team
  const [teamLogosLoaded, setTeamLogosLoaded] = useState<Record<string, boolean>>({});
  const [teamLogosError, setTeamLogosError] = useState<Record<string, boolean>>({});
  
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

  // Separate pending and approved teams (exclude rejected teams)
  const pendingTeams = teams.filter(team => team.approval_status === 'pending');
  const approvedTeams = teams.filter(team => !team.approval_status || team.approval_status === 'approved');
  const rejectedTeams = teams.filter(team => team.approval_status === 'rejected'); // Track but don't display

  // Calculate division statistics
  const divisionStats = useMemo(() => {
    if (!tournament?.has_divisions || !tournament.division_names) {
      return null;
    }
    
    const stats: Record<string, { count: number; teams: Team[] }> = {};
    tournament.division_names.forEach(divName => {
      stats[divName] = { count: 0, teams: [] };
    });
    stats['unassigned'] = { count: 0, teams: [] };
    
    approvedTeams.forEach(team => {
      if (team.division && stats[team.division]) {
        stats[team.division].count++;
        stats[team.division].teams.push(team);
      } else {
        stats['unassigned'].count++;
        stats['unassigned'].teams.push(team);
      }
    });
    
    return stats;
  }, [tournament, approvedTeams]);

  const filteredTeams = approvedTeams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.players.some(player => player.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    let matchesFilter = true;
    if (filterStatus === 'full') {
      matchesFilter = team.players.length >= 12;
    } else if (filterStatus === 'open') {
      matchesFilter = team.players.length < 12;
    }
    
    // Division filter
    if (selectedDivision) {
      if (selectedDivision === 'unassigned') {
        matchesFilter = matchesFilter && (!team.division || team.division === '');
      } else {
        matchesFilter = matchesFilter && team.division === selectedDivision;
      }
    }
    
    return matchesSearch && matchesFilter;
  });

  const handleApproveTeam = async (teamId: string) => {
    try {
      await TeamService.approveTeam(teamId);
      // Refresh teams list
      const teamsData = await TeamService.getTeamsByTournament(tournamentId);
      setTeams(teamsData);
    } catch (error) {
      console.error('❌ Error approving team:', error);
    }
  };

  const handleRejectTeam = async (teamId: string) => {
    try {
      await TeamService.rejectTeam(teamId);
      // Refresh teams list
      const teamsData = await TeamService.getTeamsByTournament(tournamentId);
      setTeams(teamsData);
    } catch (error) {
      console.error('❌ Error rejecting team:', error);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-background to-red-50/30 pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto animate-pulse">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-9 bg-muted rounded w-40 mb-6"></div>
            <div className="h-10 bg-muted rounded w-80 mb-2"></div>
            <div className="h-6 bg-muted rounded w-96"></div>
          </div>

          {/* Controls Skeleton */}
          <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="flex-1 h-10 bg-muted rounded-lg"></div>
              <div className="h-10 bg-muted rounded-lg w-40"></div>
            </div>
            <div className="h-10 bg-muted rounded-lg w-32"></div>
          </div>

          {/* Teams Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border rounded-xl p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 bg-muted rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-5 bg-muted rounded w-32 mb-2"></div>
                      <div className="h-4 bg-muted rounded w-24"></div>
                    </div>
                  </div>
                  <div className="h-6 bg-muted rounded w-16"></div>
                </div>
                <div className="h-4 bg-muted rounded w-40"></div>
                <div className="h-10 bg-muted rounded w-full"></div>
              </div>
            ))}
          </div>
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
            {tournament.has_divisions && tournament.division_names && tournament.division_names.length > 0 && (
              <select
                value={selectedDivision || 'all'}
                onChange={(e) => setSelectedDivision(e.target.value === 'all' ? null : e.target.value)}
                className="px-4 py-2.5 bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Divisions</option>
                {tournament.division_names.map(div => (
                  <option key={div} value={div}>Division {div}</option>
                ))}
                {divisionStats && divisionStats['unassigned']?.count > 0 && (
                  <option value="unassigned">Unassigned ({divisionStats['unassigned'].count})</option>
                )}
              </select>
            )}
          </div>

          <button
            onClick={() => setShowCreateTeam(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5" />
            Create Team
          </button>
        </div>

        {/* Division Overview Section */}
        {tournament.has_divisions && divisionStats && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-orange-600" />
              <h2 className="text-xl font-bold text-gray-900">Division Overview</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {tournament.division_names?.map((divName) => {
                const stats = divisionStats[divName];
                return (
                  <div
                    key={divName}
                    onClick={() => setSelectedDivision(selectedDivision === divName ? null : divName)}
                    className={`bg-white border-2 rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg ${
                      selectedDivision === divName
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-border hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">Division {divName}</h3>
                      <Badge variant={stats.count > 0 ? 'default' : 'secondary'} className="text-xs">
                        {stats.count} {stats.count === 1 ? 'team' : 'teams'}
                      </Badge>
                    </div>
                    {stats.count > 0 && (
                      <div className="mt-2 space-y-1">
                        {stats.teams.slice(0, 3).map((team) => (
                          <div key={team.id} className="text-sm text-muted-foreground truncate">
                            {team.name}
                          </div>
                        ))}
                        {stats.teams.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{stats.teams.length - 3} more
                          </div>
                        )}
                      </div>
                    )}
                    {stats.count === 0 && (
                      <p className="text-xs text-muted-foreground mt-2">No teams assigned</p>
                    )}
                  </div>
                );
              })}
              {divisionStats['unassigned'] && divisionStats['unassigned'].count > 0 && (
                <div
                  onClick={() => setSelectedDivision(selectedDivision === 'unassigned' ? null : 'unassigned')}
                  className={`bg-white border-2 rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg ${
                    selectedDivision === 'unassigned'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-orange-200 hover:border-orange-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-orange-900">Unassigned</h3>
                    <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                      {divisionStats['unassigned'].count} {divisionStats['unassigned'].count === 1 ? 'team' : 'teams'}
                    </Badge>
                  </div>
                  <div className="mt-2 space-y-1">
                    {divisionStats['unassigned'].teams.slice(0, 3).map((team) => (
                      <div key={team.id} className="text-sm text-muted-foreground truncate">
                        {team.name}
                      </div>
                    ))}
                    {divisionStats['unassigned'].teams.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{divisionStats['unassigned'].teams.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pending Teams Section */}
        {pendingTeams.length > 0 && (
          <div className="mb-8 bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-orange-600" />
              <h2 className="text-xl font-bold text-orange-900">
                Pending Team Requests ({pendingTeams.length})
              </h2>
            </div>
            <p className="text-sm text-orange-700 mb-4">
              These teams are waiting for your approval to join the tournament
            </p>
            <div className="space-y-3">
              {pendingTeams.map((team) => (
                <div key={team.id} className="bg-white border border-orange-200 rounded-lg p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{team.name}</h3>
                      <p className="text-sm text-gray-500">
                        {team.players.length} player{team.players.length !== 1 ? 's' : ''}
                        {team.coach && <span className="mx-2">•</span>}
                        {team.coach && <span>Coach: {team.coach}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveTeam(team.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      <Shield className="w-4 h-4" />
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectTeam(team.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Teams Grid */}
        {filteredTeams.length > 0 ? (
          <div className="space-y-4">
            {filteredTeams.map((team) => {
              const isSelected = selectedTeam?.id === team.id;
              const isCoachOwned = !!team.coach_id; // Check if team is owned by a coach
              
              return (
                <div key={team.id} className="bg-white border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* Team Header (Always Visible) */}
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3 sm:gap-4 flex-1">
                        {/* Team Logo */}
                        {team.logo ? (
                          <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-muted shrink-0">
                            {!teamLogosLoaded[team.id] && !teamLogosError[team.id] && (
                              <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-muted via-muted-foreground/10 to-muted" />
                            )}
                            {!teamLogosError[team.id] ? (
                              <img
                                src={team.logo}
                                alt={`${team.name} logo`}
                                className={`w-full h-full object-cover transition-opacity duration-300 ${
                                  teamLogosLoaded[team.id] ? 'opacity-100' : 'opacity-0'
                                }`}
                                onLoad={() => setTeamLogosLoaded(prev => ({ ...prev, [team.id]: true }))}
                                onError={() => {
                                  setTeamLogosError(prev => ({ ...prev, [team.id]: true }));
                                  setTeamLogosLoaded(prev => ({ ...prev, [team.id]: false }));
                                }}
                                loading="eager"
                                decoding="async"
                              />
                            ) : (
                              <div className={`w-full h-full flex items-center justify-center ${
                                isCoachOwned 
                                  ? 'bg-gradient-to-br from-blue-500 to-purple-500' 
                                  : 'bg-gradient-to-br from-orange-500 to-red-500'
                              }`}>
                                <Shield className="w-6 h-6 text-white" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shrink-0 ${
                            isCoachOwned 
                              ? 'bg-gradient-to-br from-blue-500 to-purple-500' 
                              : 'bg-gradient-to-br from-orange-500 to-red-500'
                          }`}>
                            <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg sm:text-xl font-bold text-foreground truncate">{team.name}</h3>
                            {isCoachOwned && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                Coach-Managed
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 sm:gap-4 mt-1 text-xs sm:text-sm">
                            <span className="text-muted-foreground">{team.players.length} players</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">{team.wins}W - {team.losses}L</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleSelectTeam(team)}
                          className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                            isCoachOwned
                              ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                              : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                          }`}
                          title={isCoachOwned ? 'View coach-managed team roster' : 'Manage team players'}
                        >
                          <UserPlus className="w-4 h-4" />
                          <span className="hidden xs:inline">{isCoachOwned ? 'View Roster' : 'Manage Players'}</span>
                          <span className="xs:hidden">{isCoachOwned ? 'View' : 'Manage'}</span>
                          {isSelected ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => {
                            if (!isCoachOwned) {
                              setEditingTeam(team);
                              setShowEditModal(true);
                            }
                          }}
                          disabled={isCoachOwned}
                          className={`p-2 rounded-lg transition-colors ${
                            isCoachOwned
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                          title={isCoachOwned ? 'Coach-managed teams cannot be edited' : 'Edit team'}
                        >
                          <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ✅ INLINE Player Management (Expandable) */}
                  {isSelected && (
                    <div className="border-t border-border bg-gradient-to-br from-orange-50/30 to-red-50/30 p-4 sm:p-6">
                      {isCoachOwned ? (
                        /* Coach-Owned Team: View Only */
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                          <Shield className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                          <h4 className="text-lg font-semibold text-blue-900 mb-2">
                            Coach-Managed Team
                          </h4>
                          <p className="text-sm text-blue-700 mb-4 max-w-md mx-auto">
                            This team is managed by the coach and cannot be edited by tournament organizers. 
                            The coach has full control over their team roster.
                          </p>
                          <div className="bg-white rounded-lg p-4 border border-blue-200">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-600" />
                                Current Roster (View Only)
                              </h5>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {currentPlayers.length} player{currentPlayers.length !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                            {currentPlayers.length > 0 ? (
                              <div className="space-y-2">
                                {currentPlayers.map((player) => (
                                  <div key={player.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                      <Users className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">{player.name}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 text-center py-4">
                                No players added yet
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Organizer-Owned Team: Full Edit Access */
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                          {/* Current Roster */}
                          <div className="bg-white rounded-xl p-4 sm:p-6 border border-border">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-base sm:text-lg font-semibold flex items-center gap-2">
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
                          <div className="bg-white rounded-xl p-4 sm:p-6 border border-border">
                            <h4 className="text-base sm:text-lg font-semibold flex items-center gap-2 mb-4">
                              <UserPlus className="w-5 h-5 text-orange-600" />
                              Add Players
                            </h4>
                            
                            {/* Reusable Component - NO LOGIC CHANGE */}
                            <PlayerSelectionList
                              key={currentPlayers.map(p => p.id).join(',')}
                              teamId={team.id}
                              tournamentId={tournamentId}
                              service={service}
                              onPlayerAdd={handlePlayerAdd}
                              onPlayerRemove={handlePlayerRemove}
                              showCustomPlayerOption={false}
                            />
                          </div>
                        </div>
                      )}
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
      {showCreateTeam && user && (
        <TeamCreationModal
          tournamentId={tournamentId}
          userId={user.id}
          service={service}
          onClose={() => setShowCreateTeam(false)}
          onTeamCreated={async (team) => {
            const teamsData = await TeamService.getTeamsByTournament(tournamentId);
            setTeams(teamsData);
            setShowCreateTeam(false);
          }}
        />
      )}

      {/* Edit Team Modal */}
      {showEditModal && editingTeam && user && <TeamEditModal
        team={editingTeam}
        userId={user.id}
        onClose={() => {
          setShowEditModal(false);
          setEditingTeam(null);
        }}
        onTeamUpdated={async () => {
          const teamsData = await TeamService.getTeamsByTournament(tournamentId);
          setTeams(teamsData);
          setShowEditModal(false);
          setEditingTeam(null);
        }}
      />}
    </div>
  );
};

// Team Edit Modal Component
function TeamEditModal({ team, userId, onClose, onTeamUpdated }: {
  team: Team;
  userId: string;
  onClose: () => void;
  onTeamUpdated: () => void;
}) {
  const [teamName, setTeamName] = useState(team.name);
  const [selectedDivision, setSelectedDivision] = useState<string>(team.division || '');
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoRemoved, setLogoRemoved] = useState(false); // Track if logo was explicitly removed

  // Reset removal state when modal opens or team changes
  useEffect(() => {
    setLogoRemoved(false);
  }, [team.id]);

  // Fetch tournament to check if divisions are enabled
  useEffect(() => {
    const loadTournament = async () => {
      try {
        const t = await TournamentService.getTournament(team.tournamentId);
        setTournament(t);
      } catch (error) {
        console.error('Failed to load tournament:', error);
      }
    };
    loadTournament();
  }, [team.tournamentId]);

  // Generate division options
  const divisionOptions = useMemo(() => {
    if (!tournament?.has_divisions) return [];
    
    if (tournament.division_names && tournament.division_names.length > 0) {
      return tournament.division_names;
    }
    
    const count = tournament.division_count || 2;
    return Array.from({ length: count }, (_, i) => 
      String.fromCharCode(65 + i)
    );
  }, [tournament]);

  const logoUpload = usePhotoUpload({
    userId: userId,
    photoType: 'team_logo',
    teamId: team.id,
    currentPhotoUrl: team.logo || null,
    onSuccess: (url) => {
      console.log('✅ Team logo updated:', url);
      setLogoRemoved(false); // Reset removal flag when new logo is uploaded
    },
    onError: (err) => {
      console.error('❌ Logo upload error:', err);
      setError(`Logo upload failed: ${err}`);
    },
  });

  // Custom remove handler that tracks removal intent and cleans up storage
  const handleLogoRemove = async () => {
    try {
      // Clear preview first
      logoUpload.clearPreview();
      setLogoRemoved(true);
      
      // Delete from storage if there's an existing logo
      if (team.logo) {
        try {
          const { deleteTeamLogo } = await import('@/lib/services/imageUploadService');
          await deleteTeamLogo(team.logo);
          console.log('✅ Old team logo deleted from storage');
        } catch (deleteErr) {
          // Don't block removal if delete fails - just log it
          console.warn('⚠️ Failed to delete old logo from storage (continuing with removal):', deleteErr);
        }
      }
    } catch (err) {
      console.error('❌ Error removing logo:', err);
      setError('Failed to remove logo. Please try again.');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!teamName.trim()) {
        setError('Team name is required');
        return;
      }

      // Determine logo value based on removal intent and upload state
      const updateData: { name: string; logo?: string | null; division?: string } = {
        name: teamName,
      };

      // Handle logo updates
      if (logoRemoved) {
        // Logo was explicitly removed - send null to clear it
        updateData.logo = null;
      } else if (logoUpload.previewUrl) {
        // New logo was uploaded - use the new URL
        updateData.logo = logoUpload.previewUrl;
      }
      // If neither removed nor new upload, don't include logo in update (keeps existing)

      // Include division if tournament uses divisions
      if (tournament?.has_divisions) {
        updateData.division = selectedDivision || null;
      }

      // Update team via service
      await TeamService.updateTeam(team.id, updateData);

      onTeamUpdated();
    } catch (err) {
      console.error('❌ Error updating team:', err);
      setError(err instanceof Error ? err.message : 'Failed to update team');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Team</DialogTitle>
          <DialogDescription>
            Update team information and division assignment
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Team Logo */}
          <div className="space-y-2">
            <Label>Team Logo</Label>
            <PhotoUploadField
              label="Upload Team Logo"
              value={logoRemoved ? null : (team.logo || null)} // Existing logo (null if removed)
              previewUrl={logoUpload.previewUrl} // New upload preview (separate from existing)
              uploading={logoUpload.uploading}
              progress={logoUpload.progress}
              error={logoUpload.error}
              onFileSelect={logoUpload.handleFileSelect}
              onRemove={handleLogoRemove} // Custom handler with cleanup
              onClearError={logoUpload.clearError}
            />
          </div>

          {/* Team Name */}
          <div className="space-y-2">
            <Label htmlFor="team-name">Team Name *</Label>
            <Input
              id="team-name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g., Warriors, Lakers"
              className="bg-white border-gray-300 focus:border-primary focus:ring-primary/20"
            />
          </div>

          {/* Division Selector (only if tournament uses divisions) */}
          {tournament?.has_divisions && divisionOptions.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="team-division">Division</Label>
              <Select 
                value={selectedDivision ? selectedDivision : 'none'} 
                onValueChange={(value) => setSelectedDivision(value === 'none' ? '' : value)}
              >
                <SelectTrigger className="bg-white border-gray-300 focus:border-primary focus:ring-primary/20">
                  <SelectValue placeholder="Select division (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Division</SelectItem>
                  {divisionOptions.map((div) => (
                    <SelectItem key={div} value={div}>
                      Division {div}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select which division this team belongs to (optional)
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1"
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !teamName.trim()}
            className="flex-1"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TeamManagementPage;
