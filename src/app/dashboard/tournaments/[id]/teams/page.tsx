'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthV2 } from '@/hooks/useAuthV2';
import { TournamentService, TeamService } from '@/lib/services/tournamentService';
import { Tournament, Team, Player } from '@/lib/types/tournament';
import { 
  Users, 
  Plus, 
  UserPlus, 
  Upload, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Eye,
  ArrowLeft,
  Trophy,
  Crown,
  Shield,
  Star
} from 'lucide-react';

interface TeamManagementPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

const TeamManagementPage = ({ params }: TeamManagementPageProps) => {
  const { id: tournamentId } = use(params);
  const { user, loading } = useAuthV2();
  const userRole = user?.role;
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'full' | 'open'>('all');
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFullRoster, setShowFullRoster] = useState(false);
  const [selectedTeamForRoster, setSelectedTeamForRoster] = useState<Team | null>(null);
  
  // Tournament ID extracted from params above

  useEffect(() => {
    if (!loading && (!user || userRole !== 'organizer')) {
      router.push('/auth');
      return;
    }

    const loadData = async () => {
      try {
        console.log('🔍 Loading tournament data for ID:', tournamentId);
        
        // Load tournament details
        const tournamentData = await TournamentService.getTournament(tournamentId);
        console.log('🔍 Tournament data loaded:', tournamentData);
        setTournament(tournamentData);
        
        // Load teams for this tournament
        const teamsData = await TeamService.getTeamsByTournament(tournamentId);
        console.log('🔍 Teams data loaded:', teamsData);
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

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.players.some(player => player.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    let matchesFilter = true;
    if (filterStatus === 'full') {
      matchesFilter = team.players.length >= 12; // Assuming max 12 players per team
    } else if (filterStatus === 'open') {
      matchesFilter = team.players.length < 12;
    }
    
    return matchesSearch && matchesFilter;
  });

  const handleCreateTeam = async (teamData: any) => {
    setCreatingTeam(true);
    setError(null);
    
    try {
      const newTeam = await TeamService.createTeam({
        name: teamData.name,
        coach: teamData.coach,
        tournamentId: tournamentId,
      });
      setTeams(prev => [...prev, newTeam]);
      setShowCreateTeam(false);
    } catch (error) {
      console.error('Failed to create team:', error);
      setError(error instanceof Error ? error.message : 'Failed to create team');
    } finally {
      setCreatingTeam(false);
    }
  };

  const handleAddPlayer = async (playerData: any) => {
    try {
      console.log('Adding player to team:', playerData);
      
      const playerToAdd = playerData.player;
      const teamId = playerData.teamId;
      
      // Check if player is already in the team
      const currentTeam = teams.find(team => team.id === teamId);
      if (currentTeam) {
        const isPlayerAlreadyInTeam = currentTeam.players.some(p => p.id === playerToAdd.id);
        if (isPlayerAlreadyInTeam) {
          throw new Error('Player is already in this team');
        }
      }
      
      // Save to database first
      await TeamService.addPlayerToTeam(
        teamId,
        playerToAdd.id,
        playerToAdd.position,
        playerToAdd.jerseyNumber
      );
      
      // Update local state after successful database save
      const updatedTeams = teams.map(team => {
        if (team.id === teamId) {
          return {
            ...team,
            players: [...team.players, playerToAdd]
          };
        }
        return team;
      });
      
      setTeams(updatedTeams);
      setShowAddPlayer(false);
      
      console.log('✅ Player added successfully to team and saved to database');
    } catch (error) {
      console.error('❌ Failed to add player:', error);
      setError(error instanceof Error ? error.message : 'Failed to add player');
      // Don't close modal on error so user can try again
    }
  };

  if (loading || loadingData) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1a1a',
        color: '#ffffff'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          fontSize: '18px',
          fontWeight: '500'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: '#FFD700',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          Loading Team Management...
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1a1a',
        color: '#ffffff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Tournament Not Found</h2>
          <p style={{ color: '#888' }}>The tournament you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  // CLEAN SLATE STYLING - AUTH V2 BRANDING CONSISTENCY
  const styles: any = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)',
      paddingTop: '100px',
      paddingBottom: '60px',
    },
    content: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '0 24px',
    },
    header: {
      marginBottom: '48px',
    },
    backButton: {
      background: 'transparent',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'rgba(255, 215, 0, 0.3)',
      borderRadius: '10px',
      padding: '12px 16px',
      color: '#FFD700',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '24px',
    },
    backButtonHover: {
      background: 'rgba(255, 215, 0, 0.1)',
      borderColor: '#FFD700',
    },
    title: {
      fontSize: '42px',
      fontWeight: '700',
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      fontFamily: "'Anton', system-ui, sans-serif",
      marginBottom: '16px',
      letterSpacing: '1px',
    },
    subtitle: {
      fontSize: '18px',
      color: '#b3b3b3',
      fontWeight: '400',
      marginBottom: '32px',
    },
    controls: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '32px',
      gap: '16px',
      flexWrap: 'wrap' as const,
    },
    searchContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flex: 1,
      maxWidth: '400px',
    },
    searchInput: {
      flex: 1,
      background: 'rgba(30, 30, 30, 0.8)',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'rgba(255, 215, 0, 0.2)',
      borderRadius: '12px',
      padding: '12px 16px',
      color: '#ffffff',
      fontSize: '14px',
      outline: 'none',
    },
    filterSelect: {
      background: 'rgba(30, 30, 30, 0.8)',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'rgba(255, 215, 0, 0.2)',
      borderRadius: '12px',
      padding: '12px 16px',
      color: '#ffffff',
      fontSize: '14px',
      outline: 'none',
      cursor: 'pointer',
    },
    createButton: {
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      border: 'none',
      borderRadius: '12px',
      padding: '12px 24px',
      color: '#1a1a1a',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s ease',
    },
    createButtonHover: {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 20px rgba(255, 215, 0, 0.3)',
    },
    teamsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
      gap: '24px',
    },
    teamCard: {
      background: 'rgba(30, 30, 30, 0.8)',
      borderRadius: '20px',
      padding: '24px',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'rgba(255, 215, 0, 0.1)',
      transition: 'all 0.3s ease',
    },
    teamCardHover: {
      borderColor: 'rgba(255, 215, 0, 0.3)',
      transform: 'translateY(-4px)',
      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.3)',
    },
    teamHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '20px',
    },
    teamInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    teamIcon: {
      width: '48px',
      height: '48px',
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    teamName: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#ffffff',
      marginBottom: '4px',
    },
    teamMeta: {
      fontSize: '14px',
      color: '#888888',
    },
    teamStats: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '20px',
    },
    stat: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '14px',
      color: '#b3b3b3',
    },
    playersList: {
      marginBottom: '20px',
    },
    playersTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    playerItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 12px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '8px',
      marginBottom: '8px',
    },
    playerInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    playerName: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#ffffff',
    },
    playerPosition: {
      fontSize: '12px',
      color: '#888888',
      background: 'rgba(255, 215, 0, 0.1)',
      padding: '2px 6px',
      borderRadius: '4px',
    },
    captainBadge: {
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      color: '#1a1a1a',
      fontSize: '10px',
      fontWeight: '700',
      padding: '2px 6px',
      borderRadius: '4px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    premiumBadge: {
      fontSize: '10px',
      fontWeight: '600',
      color: '#FFD700',
      marginLeft: '8px',
    },
    teamActions: {
      display: 'flex',
      gap: '8px',
    },
    actionButton: {
      background: 'transparent',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'rgba(255, 215, 0, 0.3)',
      borderRadius: '8px',
      padding: '8px 12px',
      color: '#FFD700',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    actionButtonHover: {
      background: 'rgba(255, 215, 0, 0.1)',
      borderColor: '#FFD700',
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      color: '#888888',
    },
    emptyStateIcon: {
      marginBottom: '24px',
      opacity: 0.5,
    },
    emptyStateTitle: {
      fontSize: '24px',
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: '12px',
    },
    emptyStateDesc: {
      fontSize: '16px',
      marginBottom: '32px',
      lineHeight: '1.6',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <button
            style={styles.backButton}
            onClick={() => router.push(`/dashboard/tournaments/${tournamentId}`)}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.backButtonHover)}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.backButton)}
          >
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
            Back to Tournament
          </button>

          <h1 style={styles.title}>TEAM MANAGEMENT</h1>
          <p style={styles.subtitle}>
            Manage teams and players for {tournament.name}
          </p>
        </div>

        {/* Controls */}
        <div style={styles.controls}>
          <div style={styles.searchContainer}>
            <Search style={{ width: '20px', height: '20px', color: '#888' }} />
            <input
              type="text"
              placeholder="Search teams or players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            style={styles.filterSelect}
          >
            <option value="all">All Teams</option>
            <option value="open">Open for Players</option>
            <option value="full">Full Teams</option>
          </select>

          <button
            style={styles.createButton}
            onClick={() => setShowCreateTeam(true)}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.createButtonHover)}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.createButton)}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            Create Team
          </button>
        </div>

        {/* Teams Grid */}
        <div style={styles.teamsGrid}>
          {filteredTeams.length > 0 ? (
            filteredTeams.map((team) => (
              <div
                key={team.id}
                style={styles.teamCard}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.teamCardHover)}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.teamCard)}
              >
                <div style={styles.teamHeader}>
                  <div style={styles.teamInfo}>
                    <div style={styles.teamIcon}>
                      <Shield style={{ width: '24px', height: '24px', color: '#1a1a1a' }} />
                    </div>
                    <div>
                      <div style={styles.teamName}>{team.name}</div>
                      <div style={styles.teamMeta}>
                        {team.players.length} players • {team.wins}W - {team.losses}L
                      </div>
                    </div>
                  </div>
                  <div style={styles.teamActions}>
                    <button
                      style={styles.actionButton}
                      onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.actionButtonHover)}
                      onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.actionButton)}
                      onClick={() => {
                        setSelectedTeam(team);
                        setShowAddPlayer(true);
                      }}
                    >
                      <UserPlus style={{ width: '14px', height: '14px' }} />
                      Add Player
                    </button>
                    <button
                      style={styles.actionButton}
                      onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.actionButtonHover)}
                      onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.actionButton)}
                    >
                      <Edit style={{ width: '14px', height: '14px' }} />
                      Edit
                    </button>
                  </div>
                </div>

                <div style={styles.teamStats}>
                  <div style={styles.stat}>
                    <Users style={{ width: '16px', height: '16px' }} />
                    {team.players.length}/12 players
                  </div>
                  <div style={styles.stat}>
                    <Trophy style={{ width: '16px', height: '16px' }} />
                    {team.wins} wins
                  </div>
                </div>

                <div style={styles.playersList}>
                  <div style={styles.playersTitle}>
                    <Users style={{ width: '16px', height: '16px' }} />
                    Roster ({team.players.length})
                  </div>
                  {team.players
                    .sort((a, b) => {
                      // Sort by premium status first (premium players first)
                      if (a.isPremium && !b.isPremium) return -1;
                      if (!a.isPremium && b.isPremium) return 1;
                      // Then by name
                      return a.name.localeCompare(b.name);
                    })
                    .slice(0, 5)
                    .map((player) => (
                    <div key={player.id} style={styles.playerItem}>
                      <div style={styles.playerInfo}>
                        <div style={styles.playerName}>
                          {player.name}
                          {player.isPremium && (
                            <span style={styles.premiumBadge}>⭐ PREMIUM</span>
                          )}
                        </div>
                        <div style={styles.playerPosition}>{player.position} • #{player.jerseyNumber}</div>
                        {team.captain.id && player.id === team.captain.id && (
                          <div style={styles.captainBadge}>
                            <Crown style={{ width: '10px', height: '10px' }} />
                            CAPTAIN
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {team.players.length > 5 && (
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#888', 
                      textAlign: 'center' as const, 
                      padding: '8px',
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '8px'
                    }}>
                      <span>+{team.players.length - 5} more players</span>
                      <button
                        onClick={() => {
                          setSelectedTeamForRoster(team);
                          setShowFullRoster(true);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#FFD700',
                          cursor: 'pointer',
                          fontSize: '12px',
                          textDecoration: 'underline'
                        }}
                      >
                        View Full Roster
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div style={styles.emptyState}>
              <div style={styles.emptyStateIcon}>
                <Users style={{ width: '64px', height: '64px' }} />
              </div>
              <div style={styles.emptyStateTitle}>No teams yet</div>
              <div style={styles.emptyStateDesc}>
                Create your first team to start building your tournament roster
              </div>
              <button
                style={styles.createButton}
                onClick={() => setShowCreateTeam(true)}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.createButtonHover)}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.createButton)}
              >
                <Plus style={{ width: '16px', height: '16px' }} />
                Create First Team
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Team Modal */}
      {showCreateTeam && (
        <CreateTeamModal
          onClose={() => setShowCreateTeam(false)}
          onSave={handleCreateTeam}
          creatingTeam={creatingTeam}
          error={error}
        />
      )}

      {/* Add Player Modal */}
      {showAddPlayer && selectedTeam && (
        <AddPlayerModal
          team={selectedTeam}
          teams={teams}
          onClose={() => {
            setShowAddPlayer(false);
            setSelectedTeam(null);
          }}
          onSave={handleAddPlayer}
        />
      )}

      {/* Full Roster Modal */}
      {showFullRoster && selectedTeamForRoster && (
        <FullRosterModal
          team={selectedTeamForRoster}
          onClose={() => setShowFullRoster(false)}
        />
      )}
    </div>
  );
};

// Create Team Modal Component
function CreateTeamModal({ onClose, onSave, creatingTeam, error }: { 
  onClose: () => void; 
  onSave: (data: any) => void;
  creatingTeam: boolean;
  error: string | null;
}) {
  const [formData, setFormData] = useState({
    name: '',
    coach: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modal: {
      background: 'rgba(30, 30, 30, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      padding: '32px',
      maxWidth: '500px',
      width: '90%',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'rgba(255, 215, 0, 0.2)',
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#FFD700',
      marginBottom: '24px',
      textAlign: 'center' as const,
    },
    form: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '20px',
    },
    input: {
      background: 'rgba(255, 255, 255, 0.05)',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'rgba(255, 215, 0, 0.2)',
      borderRadius: '12px',
      padding: '16px',
      color: '#ffffff',
      fontSize: '16px',
      outline: 'none',
    },
    buttons: {
      display: 'flex',
      gap: '12px',
      marginTop: '24px',
    },
    button: {
      flex: 1,
      padding: '12px 24px',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      border: 'none',
      transition: 'all 0.2s ease',
    },
    cancelButton: {
      background: 'transparent',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      color: '#ffffff',
    },
    saveButton: {
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      color: '#1a1a1a',
    },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.title}>Create New Team</h2>
        <form style={styles.form} onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Team Name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            style={styles.input}
            required
          />
          <input
            type="text"
            placeholder="Coach Name (Optional)"
            value={formData.coach}
            onChange={(e) => setFormData(prev => ({ ...prev, coach: e.target.value }))}
            style={styles.input}
          />
          
          {error && (
            <div style={{
              background: 'rgba(255, 0, 0, 0.1)',
              border: '1px solid rgba(255, 0, 0, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              color: '#ff6b6b',
              fontSize: '14px',
            }}>
              {error}
            </div>
          )}
          
          <div style={styles.buttons}>
            <button
              type="button"
              onClick={onClose}
              disabled={creatingTeam}
              style={{ ...styles.button, ...styles.cancelButton }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creatingTeam}
              style={{ 
                ...styles.button, 
                ...styles.saveButton,
                opacity: creatingTeam ? 0.6 : 1,
                cursor: creatingTeam ? 'not-allowed' : 'pointer'
              }}
            >
              {creatingTeam ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add Player Modal Component
function AddPlayerModal({ team, teams, onClose, onSave }: { team: Team; teams: Team[]; onClose: () => void; onSave: (data: any) => void }) {
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingPlayer, setAddingPlayer] = useState<string | null>(null); // Track which player is being added
  const [draftedPlayers, setDraftedPlayers] = useState<Set<string>>(new Set()); // Track drafted players

  // Load all available players on mount
  useEffect(() => {
    const loadAvailablePlayers = async () => {
      try {
        setLoading(true);
        console.log('🔍 AddPlayerModal: Loading real players from database');
        
        // Fetch real players from database
        const players = await TeamService.getAllPlayers();
        console.log('🔍 AddPlayerModal: Loaded players:', players);
        
        setAvailablePlayers(players);
      } catch (error) {
        console.error('❌ Failed to load players:', error);
        // Set empty array on error - no fallback to mock data
        setAvailablePlayers([]);
      } finally {
        setLoading(false);
      }
    };

    loadAvailablePlayers();
  }, []);

  // Initialize drafted players from existing teams
  useEffect(() => {
    const initializeDraftedPlayers = () => {
      const allDraftedPlayerIds = new Set<string>();
      
      // Collect all player IDs from all teams
      teams.forEach(t => {
        t.players.forEach(player => {
          allDraftedPlayerIds.add(player.id);
        });
      });
      
      console.log('🔍 Initialized drafted players:', Array.from(allDraftedPlayerIds));
      setDraftedPlayers(allDraftedPlayerIds);
    };

    initializeDraftedPlayers();
  }, [teams]);

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modal: {
      background: 'rgba(30, 30, 30, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      padding: '32px',
      maxWidth: '600px',
      width: '90%',
      maxHeight: '80vh',
      overflow: 'auto',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'rgba(255, 215, 0, 0.2)',
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#FFD700',
      marginBottom: '16px',
    },
    subtitle: {
      fontSize: '16px',
      color: '#b3b3b3',
      marginBottom: '24px',
    },

    resultsList: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px',
    },
    playerItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '12px',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'rgba(255, 215, 0, 0.1)',
    },
    playerInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    playerName: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#ffffff',
    },
    playerEmail: {
      fontSize: '14px',
      color: '#888888',
    },
    inviteButton: {
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      border: 'none',
      borderRadius: '8px',
      padding: '8px 16px',
      color: '#1a1a1a',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '600',
    },
    closeButton: {
      background: 'transparent',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: '12px',
      padding: '12px 24px',
      color: '#ffffff',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      marginTop: '24px',
      width: '100%',
    },
    premiumBadge: {
      fontSize: '10px',
      fontWeight: '600',
      color: '#FFD700',
      marginLeft: '8px',
    },
    // ✅ PHASE 2 OPTIMIZATION: Skeleton loading styles
    skeletonContainer: {
      padding: '16px 0',
    },
    skeletonPlayerItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '12px 0',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    },
    skeletonAvatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      backgroundColor: '#374151',
      marginRight: '12px',
      animation: 'pulse 1.5s ease-in-out infinite',
    },
    skeletonContent: {
      flex: 1,
    },
    skeletonName: {
      height: '16px',
      backgroundColor: '#374151',
      borderRadius: '4px',
      marginBottom: '8px',
      width: '60%',
      animation: 'pulse 1.5s ease-in-out infinite',
    },
    skeletonEmail: {
      height: '12px',
      backgroundColor: '#374151',
      borderRadius: '4px',
      width: '80%',
      animation: 'pulse 1.5s ease-in-out infinite',
    },
    skeletonButton: {
      width: '80px',
      height: '32px',
      backgroundColor: '#374151',
      borderRadius: '8px',
      animation: 'pulse 1.5s ease-in-out infinite',
    },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.title}>Add Player to {team.name}</h2>
        <p style={styles.subtitle}>Available Players Roster - Premium players listed first</p>
        
        {loading ? (
          <div style={styles.skeletonContainer}>
            {/* ✅ PHASE 2 OPTIMIZATION: Skeleton loading instead of spinner */}
            {[1, 2, 3, 4, 5].map((index) => (
              <div key={index} style={styles.skeletonPlayerItem}>
                <div style={styles.skeletonAvatar} />
                <div style={styles.skeletonContent}>
                  <div style={styles.skeletonName} />
                  <div style={styles.skeletonEmail} />
                </div>
                <div style={styles.skeletonButton} />
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.resultsList}>
            {availablePlayers
              .sort((a, b) => {
                // Sort by premium status first (premium players first)
                if (a.isPremium && !b.isPremium) return -1;
                if (!a.isPremium && b.isPremium) return 1;
                // Then by name
                return a.name.localeCompare(b.name);
              })
              .map((player) => (
              <div key={player.id} style={styles.playerItem}>
                <div style={styles.playerInfo}>
                  <div>
                    <div style={styles.playerName}>
                      {player.name}
                      {player.isPremium && (
                        <span style={styles.premiumBadge}>⭐ PREMIUM</span>
                      )}
                    </div>
                    <div style={styles.playerEmail}>
                      {player.email} • {player.position} • #{player.jerseyNumber} • {player.country}
                    </div>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (draftedPlayers.has(player.id)) return; // Prevent clicking drafted players
                    
                    console.log('🚀 Add to Team button clicked (optimized):', { playerId: player.id, teamId: team.id, playerName: player.name });
                    
                    // ✅ PHASE 2 OPTIMIZATION: Optimistic update - mark as drafted immediately
                    setDraftedPlayers(prev => new Set([...prev, player.id]));
                    setAddingPlayer(player.id);
                    
                    try {
                      await onSave({ player: player, teamId: team.id });
                      console.log('✅ Player successfully added to team:', player.name);
                    } catch (error) {
                      console.error('❌ Failed to add player:', error);
                      // ✅ PHASE 2 OPTIMIZATION: Rollback optimistic update on error
                      setDraftedPlayers(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(player.id);
                        return newSet;
                      });
                    } finally {
                      setAddingPlayer(null);
                    }
                  }}
                  disabled={addingPlayer === player.id || draftedPlayers.has(player.id)}
                  style={{
                    ...styles.inviteButton,
                    opacity: draftedPlayers.has(player.id) ? 0.4 : (addingPlayer === player.id ? 0.6 : 1),
                    cursor: draftedPlayers.has(player.id) ? 'not-allowed' : (addingPlayer === player.id ? 'not-allowed' : 'pointer'),
                    background: draftedPlayers.has(player.id) ? '#666' : styles.inviteButton.background,
                  }}
                >
                  {draftedPlayers.has(player.id) ? 'DRAFTED' : (addingPlayer === player.id ? 'Adding...' : 'Add to Team')}
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          style={styles.closeButton}
        >
          Close
        </button>
      </div>
    </div>
  );
}

// Full Roster Modal Component
function FullRosterModal({ team, onClose }: { team: Team; onClose: () => void }) {
  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modal: {
      background: 'rgba(30, 30, 30, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      padding: '32px',
      maxWidth: '700px',
      width: '90%',
      maxHeight: '80vh',
      overflow: 'auto',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'rgba(255, 215, 0, 0.2)',
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#FFD700',
      marginBottom: '8px',
    },
    subtitle: {
      fontSize: '16px',
      color: '#b3b3b3',
      marginBottom: '24px',
    },
    rosterList: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px',
    },
    playerItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '12px',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'rgba(255, 215, 0, 0.1)',
    },
    playerInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    playerName: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#ffffff',
    },
    playerDetails: {
      fontSize: '14px',
      color: '#888888',
    },
    premiumBadge: {
      fontSize: '10px',
      fontWeight: '600',
      color: '#FFD700',
      marginLeft: '8px',
    },
    captainBadge: {
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      color: '#1a1a1a',
      fontSize: '10px',
      fontWeight: '700',
      padding: '2px 6px',
      borderRadius: '4px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    closeButton: {
      background: 'transparent',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: '12px',
      padding: '12px 24px',
      color: '#ffffff',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      marginTop: '24px',
      width: '100%',
    },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.title}>Full Roster - {team.name}</h2>
        <p style={styles.subtitle}>
          {team.players.length} players • {team.wins}W - {team.losses}L
        </p>
        
        <div style={styles.rosterList}>
          {team.players
            .sort((a, b) => {
              // Sort by premium status first (premium players first)
              if (a.isPremium && !b.isPremium) return -1;
              if (!a.isPremium && b.isPremium) return 1;
              // Then by name
              return a.name.localeCompare(b.name);
            })
            .map((player) => (
            <div key={player.id} style={styles.playerItem}>
              <div style={styles.playerInfo}>
                <div>
                  <div style={styles.playerName}>
                    {player.name}
                    {player.isPremium && (
                      <span style={styles.premiumBadge}>⭐ PREMIUM</span>
                    )}
                  </div>
                  <div style={styles.playerDetails}>
                    {player.position} • #{player.jerseyNumber} • {player.email} • {player.country}
                  </div>
                </div>
              </div>
              {team.captain.id && player.id === team.captain.id && (
                <div style={styles.captainBadge}>
                  <Crown style={{ width: '10px', height: '10px' }} />
                  CAPTAIN
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          style={styles.closeButton}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default TeamManagementPage; 