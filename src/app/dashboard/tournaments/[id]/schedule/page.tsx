'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { TournamentService, TeamService } from '@/lib/services/tournamentService';
import { GameService } from '@/lib/services/gameService';
import { Tournament, Team } from '@/lib/types/tournament';
import { Game } from '@/lib/types/game';
import { 
  Calendar, 
  ArrowLeft, 
  Plus, 
  Filter, 
  Clock, 
  MapPin, 
  Users, 
  User,
  Edit,
  Trash2,
  Play,
  CheckCircle,
  X
} from 'lucide-react';

interface GameSchedulePageProps {
  params: { id: string };
}

const GameSchedulePage = ({ params }: GameSchedulePageProps) => {
  const { user, userRole, loading } = useAuthStore();
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [statAdmins, setStatAdmins] = useState<{ id: string; name: string; email: string }[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showCreateGame, setShowCreateGame] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'live' | 'completed'>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const [showBracketBuilder, setShowBracketBuilder] = useState(false);
  
  const tournamentId = params.id;

  useEffect(() => {
    if (!loading && (!user || userRole !== 'organizer')) {
      router.push('/auth');
      return;
    }

    const loadData = async () => {
      try {
        setLoadingData(true);
        
        // Load tournament details
        const tournamentData = await TournamentService.getTournament(tournamentId);
        setTournament(tournamentData);
        
        // Load teams for this tournament
        const teamsData = await TeamService.getTeamsByTournament(tournamentId);
        console.log('🔍 Schedule Page: Loaded teams from database:', teamsData.length, 'teams');
        teamsData.forEach((team, index) => {
          console.log(`   Team ${index + 1}: ${team.name} (ID: ${team.id})`);
        });
        setTeams(teamsData);
        
        // Load games for this tournament
        const gamesData = await GameService.getGamesByTournament(tournamentId);
        setGames(gamesData);
        
        // Load stat admins for assignment
        console.log('🔍 Schedule Page: Loading stat admins...');
        const statAdminsData = await TeamService.getStatAdmins();
        console.log('🔍 Schedule Page: Loaded stat admins:', statAdminsData.length, 'admins');
        console.log('🔍 Schedule Page: Stat admins data:', statAdminsData);
        setStatAdmins(statAdminsData);
        
      } catch (error) {
        console.error('Failed to load tournament data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user, userRole, loading, tournamentId, router]);

  const handleCreateGame = () => {
    setSelectedGame(null);
    setShowCreateGame(true);
  };

  const handleEditGame = (game: Game) => {
    setSelectedGame(game);
    setShowCreateGame(true);
  };

  const filteredGames = games.filter(game => {
    if (filterStatus !== 'all' && game.status !== filterStatus) return false;
    if (filterDate && !game.start_time.startsWith(filterDate)) return false;
    return true;
  });

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
          Loading Schedule...
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a' }}>
        <div style={{ color: '#ffffff', fontSize: '18px' }}>Tournament not found</div>
      </div>
    );
  }

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)',
      paddingTop: '100px',
      paddingBottom: '40px',
    },
    content: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '0 24px',
    },
    header: {
      marginBottom: '32px',
    },
    backButton: {
      background: 'rgba(255, 255, 255, 0.1)',
      border: 'none',
      borderRadius: '12px',
      padding: '12px 20px',
      color: '#ffffff',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '24px',
      transition: 'all 0.2s ease',
    },
    backButtonHover: {
      background: 'rgba(255, 255, 255, 0.2)',
      transform: 'translateY(-1px)',
    },
    titleSection: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: '24px',
      flexWrap: 'wrap' as const,
    },
    titleGroup: {
      flex: 1,
      minWidth: '300px',
    },
    title: {
      fontSize: '36px',
      fontWeight: '700',
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      marginBottom: '8px',
      fontFamily: "'Anton', system-ui, sans-serif",
    },
    subtitle: {
      fontSize: '16px',
      color: '#b3b3b3',
      marginBottom: '16px',
    },
    actionButtons: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
    },
    primaryButton: {
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      border: 'none',
      borderRadius: '12px',
      padding: '12px 24px',
      color: '#1a1a1a',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s ease',
    },
    primaryButtonHover: {
      background: 'linear-gradient(135deg, #FFA500, #FF8C00)',
      transform: 'translateY(-1px)',
    },
    filtersContainer: {
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '24px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    filtersGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      alignItems: 'end',
    },
    filterGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
    },
    filterLabel: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#ffffff',
    },
    filterSelect: {
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '8px',
      padding: '10px 12px',
      color: '#ffffff',
      fontSize: '14px',
      outline: 'none',
    },
    filterInput: {
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '8px',
      padding: '10px 12px',
      color: '#ffffff',
      fontSize: '14px',
      outline: 'none',
    },
    gamesContainer: {
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '16px',
      padding: '24px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    gamesHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
    },
    gamesTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#ffffff',
    },
    emptyState: {
      textAlign: 'center' as const,
      padding: '60px 20px',
      color: '#888',
    },
    emptyIcon: {
      width: '64px',
      height: '64px',
      margin: '0 auto 16px',
      color: '#444',
    },
    emptyTitle: {
      fontSize: '18px',
      fontWeight: '500',
      marginBottom: '8px',
      color: '#ffffff',
    },
    emptyDescription: {
      fontSize: '14px',
      color: '#888',
      marginBottom: '24px',
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

          <div style={styles.titleSection}>
            <div style={styles.titleGroup}>
              <h1 style={styles.title}>Game Schedule</h1>
              <p style={styles.subtitle}>{tournament.name} - Manage tournament fixtures</p>
            </div>

            <div style={styles.actionButtons}>
              <button
                style={styles.primaryButton}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.primaryButtonHover)}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.primaryButton)}
                onClick={handleCreateGame}
              >
                <Plus style={{ width: '16px', height: '16px' }} />
                Schedule Game
              </button>
              
              <button
                style={{
                  ...styles.primaryButton,
                  background: 'linear-gradient(135deg, #9D4EDD, #7B2CBF)',
                }}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, {
                  ...styles.primaryButtonHover,
                  background: 'linear-gradient(135deg, #7B2CBF, #5A189A)',
                })}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, {
                  ...styles.primaryButton,
                  background: 'linear-gradient(135deg, #9D4EDD, #7B2CBF)',
                })}
                onClick={() => setShowBracketBuilder(true)}
              >
                <Calendar style={{ width: '16px', height: '16px' }} />
                Generate Bracket
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={styles.filtersContainer}>
          <div style={styles.filtersGrid}>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Status</label>
              <select
                style={styles.filterSelect}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
              >
                <option value="all">All Games</option>
                <option value="scheduled">Scheduled</option>
                <option value="live">Live</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Date</label>
              <input
                type="date"
                style={styles.filterInput}
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Teams</label>
              <div style={{ color: '#888', fontSize: '14px', padding: '10px 0' }}>
                {teams.length} teams available
                {teams.length > 0 && (
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    {teams.slice(0, 3).map(team => team.name).join(', ')}
                    {teams.length > 3 && ` +${teams.length - 3} more`}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Games List */}
        <div style={styles.gamesContainer}>
          <div style={styles.gamesHeader}>
            <h2 style={styles.gamesTitle}>
              Scheduled Games ({filteredGames.length})
            </h2>
          </div>

          {filteredGames.length === 0 ? (
            <div style={styles.emptyState}>
              <Calendar style={styles.emptyIcon} />
              <h3 style={styles.emptyTitle}>No games scheduled yet</h3>
              <p style={styles.emptyDescription}>
                Start by scheduling your first game. You'll need at least 2 teams to create a match.
              </p>
              {teams.length >= 2 ? (
                <button
                  style={styles.primaryButton}
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.primaryButtonHover)}
                  onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.primaryButton)}
                  onClick={handleCreateGame}
                >
                  <Plus style={{ width: '16px', height: '16px' }} />
                  Schedule First Game
                </button>
              ) : (
                <div style={{ color: '#888', fontSize: '14px' }}>
                  <p>You need at least 2 teams to schedule games.</p>
                  <button
                    style={{
                      ...styles.primaryButton,
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                    }}
                    onClick={() => router.push(`/dashboard/tournaments/${tournamentId}/teams`)}
                  >
                    <Users style={{ width: '16px', height: '16px' }} />
                    Manage Teams
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  teams={teams}
                  onEdit={() => handleEditGame(game)}
                  onDelete={async () => {
                    try {
                      await GameService.deleteGame(game.id);
                      const updatedGames = await GameService.getGamesByTournament(tournamentId);
                      setGames(updatedGames);
                      console.log('✅ Game deleted successfully');
                    } catch (error) {
                      console.error('Failed to delete game:', error);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Create/Edit Game Modal */}
        {showCreateGame && (
          <CreateGameModal
            tournament={tournament}
            teams={teams}
            statAdmins={statAdmins}
            game={selectedGame}
            onClose={() => setShowCreateGame(false)}
            onSave={async (gameData) => {
              try {
                if (selectedGame) {
                  // Update existing game
                  await GameService.updateGame(selectedGame.id, {
                    teamAId: gameData.teamAId,
                    teamBId: gameData.teamBId,
                    startTime: gameData.startTime,
                    statAdminId: gameData.statAdminId || null,
                  });
                  console.log('✅ Game updated successfully');
                } else {
                  // Create new game
                  await GameService.createGame({
                    tournamentId: tournamentId,
                    teamAId: gameData.teamAId,
                    teamBId: gameData.teamBId,
                    startTime: gameData.startTime,
                    venue: gameData.venue,
                    statAdminId: gameData.statAdminId || null,
                  });
                  console.log('✅ Game created successfully');
                }
                
                // Reload games
                const updatedGames = await GameService.getGamesByTournament(tournamentId);
                setGames(updatedGames);
                setShowCreateGame(false);
              } catch (error) {
                console.error('Failed to save game:', error);
                // TODO: Show error to user
              }
            }}
          />
        )}

        {/* Bracket Builder Modal */}
        {showBracketBuilder && (
          <BracketBuilderModal
            tournament={tournament}
            teams={teams}
            onClose={() => setShowBracketBuilder(false)}
            onGenerate={async (bracketConfig) => {
              try {
                console.log('🔍 Generating bracket with config:', bracketConfig);
                
                // Generate games based on bracket configuration
                const generatedGames = generateBracketGames(
                  bracketConfig.tournamentType,
                  bracketConfig.teams,
                  bracketConfig.startDate,
                  bracketConfig.venue,
                  tournamentId
                );
                
                // Create all games in the database
                for (const gameData of generatedGames) {
                  await GameService.createGame(gameData);
                }
                
                // Reload games
                const updatedGames = await GameService.getGamesByTournament(tournamentId);
                setGames(updatedGames);
                setShowBracketBuilder(false);
                
                console.log('✅ Bracket generated successfully');
              } catch (error) {
                console.error('Failed to generate bracket:', error);
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

// Create Game Modal Component
function CreateGameModal({ 
  tournament, 
  teams, 
  statAdmins, 
  game, 
  onClose, 
  onSave 
}: { 
  tournament: Tournament; 
  teams: Team[]; 
  statAdmins: { id: string; name: string; email: string }[]; 
  game: Game | null; 
  onClose: () => void; 
  onSave: (data: any) => void; 
}) {
  console.log('🔍 CreateGameModal: Received teams:', teams.length, 'teams');
  teams.forEach((team, index) => {
    console.log(`   Modal Team ${index + 1}: ${team.name} (ID: ${team.id})`);
  });
  
  console.log('🔍 CreateGameModal: Received statAdmins:', statAdmins.length, 'admins');
  statAdmins.forEach((admin, index) => {
    console.log(`   Modal Admin ${index + 1}: ${admin.name} (${admin.email}) - ID: ${admin.id}`);
  });
  
  // Helper function to format date for datetime-local input
  const formatDateTimeLocal = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  
  const minDate = formatDateTimeLocal(tournament.startDate);
  const maxDate = formatDateTimeLocal(tournament.endDate);
  
  // Debug tournament dates
  console.log('🔍 Tournament dates for date picker constraints:');
  console.log('   Start Date:', tournament.startDate);
  console.log('   End Date:', tournament.endDate);
  console.log('   Min constraint (formatted):', minDate);
  console.log('   Max constraint (formatted):', maxDate);
  const [formData, setFormData] = useState({
    teamAId: game?.team_a_id || '',
    teamBId: game?.team_b_id || '',
    startTime: game?.start_time?.slice(0, 16) || minDate, // Default to tournament start if new game
    venue: tournament.venue || '',
    statAdminId: game?.stat_admin_id || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate date is within tournament range
    const gameDate = new Date(formData.startTime);
    const tournamentStart = new Date(tournament.startDate);
    const tournamentEnd = new Date(tournament.endDate);
    
    if (gameDate < tournamentStart || gameDate > tournamentEnd) {
      alert(`Game date must be between ${tournament.startDate.split('T')[0]} and ${tournament.endDate.split('T')[0]}`);
      return;
    }
    
    onSave(formData);
  };

  const styles = {
    overlay: {
      position: 'fixed' as const,
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
      background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
      borderRadius: '16px',
      padding: '32px',
      width: '90%',
      maxWidth: '500px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#ffffff',
      marginBottom: '24px',
      textAlign: 'center' as const,
    },
    form: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '20px',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
    },
    label: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#ffffff',
    },
    select: {
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '8px',
      padding: '12px',
      color: '#ffffff',
      fontSize: '14px',
      outline: 'none',
    },
    input: {
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '8px',
      padding: '12px',
      color: '#ffffff',
      fontSize: '14px',
      outline: 'none',
    },
    buttonGroup: {
      display: 'flex',
      gap: '12px',
      marginTop: '24px',
    },
    cancelButton: {
      flex: 1,
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '12px',
      padding: '12px 24px',
      color: '#ffffff',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
    },
    saveButton: {
      flex: 1,
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      border: 'none',
      borderRadius: '12px',
      padding: '12px 24px',
      color: '#1a1a1a',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
    },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.title}>
          {game ? 'Edit Game' : 'Schedule New Game'}
        </h2>
        
        <form style={styles.form} onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Team A ({teams.length} teams available)</label>
            <select
              style={styles.select}
              value={formData.teamAId}
              onChange={(e) => setFormData(prev => ({ ...prev, teamAId: e.target.value }))}
              required
            >
              <option value="">Select Team A</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Team B ({teams.filter(team => team.id !== formData.teamAId).length} teams available)</label>
            <select
              style={styles.select}
              value={formData.teamBId}
              onChange={(e) => setFormData(prev => ({ ...prev, teamBId: e.target.value }))}
              required
            >
              <option value="">Select Team B</option>
              {teams.filter(team => team.id !== formData.teamAId).map(team => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Date & Time 
              <span style={{ fontSize: '12px', color: '#FFD700', fontWeight: 'normal' }}>
                (Only {tournament.startDate.split('T')[0]} to {tournament.endDate.split('T')[0]} allowed)
              </span>
            </label>
            <input
              type="datetime-local"
              style={styles.input}
              value={formData.startTime}
              onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
              min={minDate} // Tournament start date (properly formatted)
              max={maxDate} // Tournament end date (properly formatted)
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Venue</label>
            <input
              type="text"
              style={styles.input}
              value={formData.venue}
              onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
              placeholder="Enter venue location"
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Stat Admin (Optional)</label>
            <select
              style={styles.select}
              value={formData.statAdminId}
              onChange={(e) => setFormData(prev => ({ ...prev, statAdminId: e.target.value }))}
            >
              <option value="">Assign later</option>
              {statAdmins.map(admin => (
                <option key={admin.id} value={admin.id}>
                  {admin.name} ({admin.email})
                </option>
              ))}
            </select>
          </div>

          {/* Show validation status */}
          {(!formData.teamAId || !formData.teamBId || !formData.startTime) && (
            <div style={{
              background: 'rgba(255, 107, 107, 0.1)',
              border: '1px solid rgba(255, 107, 107, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '14px',
              color: '#ff6b6b',
              marginBottom: '16px'
            }}>
              <strong>Required fields:</strong>
              {!formData.teamAId && <div>• Select Team A</div>}
              {!formData.teamBId && <div>• Select Team B</div>}
              {!formData.startTime && <div>• Select Date & Time</div>}
            </div>
          )}

          <div style={styles.buttonGroup}>
            <button
              type="button"
              style={styles.cancelButton}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                ...styles.saveButton,
                opacity: (!formData.teamAId || !formData.teamBId || !formData.startTime) ? 0.5 : 1,
                cursor: (!formData.teamAId || !formData.teamBId || !formData.startTime) ? 'not-allowed' : 'pointer',
              }}
              disabled={!formData.teamAId || !formData.teamBId || !formData.startTime}
              onClick={() => {
                console.log('🔍 Schedule Game button validation:', {
                  teamAId: formData.teamAId,
                  teamBId: formData.teamBId, 
                  startTime: formData.startTime,
                  hasTeamA: !!formData.teamAId,
                  hasTeamB: !!formData.teamBId,
                  hasStartTime: !!formData.startTime,
                  isDisabled: !formData.teamAId || !formData.teamBId || !formData.startTime
                });
              }}
            >
              {game ? 'Update Game' : 'Schedule Game'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Game Card Component
function GameCard({ 
  game, 
  teams, 
  onEdit, 
  onDelete 
}: { 
  game: Game; 
  teams: Team[]; 
  onEdit: () => void; 
  onDelete: () => void; 
}) {
  const teamA = teams.find(t => t.id === game.team_a_id);
  const teamB = teams.find(t => t.id === game.team_b_id);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return { bg: '#1a4b8c', text: '#87ceeb' };
      case 'in_progress': return { bg: '#1a5f1a', text: '#90ee90' };
      case 'completed': return { bg: '#4a4a4a', text: '#d3d3d3' };
      case 'cancelled': return { bg: '#5c1a1a', text: '#ff6b6b' };
      default: return { bg: '#333', text: '#ccc' };
    }
  };

  const statusColors = getStatusColor(game.status);

  const styles = {
    card: {
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      transition: 'all 0.2s ease',
    },
    cardHover: {
      background: 'rgba(255, 255, 255, 0.08)',
      borderColor: 'rgba(255, 215, 0, 0.3)',
      transform: 'translateY(-1px)',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '16px',
    },
    matchup: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      flex: 1,
    },
    team: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '18px',
      fontWeight: '600',
      color: '#ffffff',
    },
    vs: {
      color: '#888',
      fontSize: '14px',
      fontWeight: '500',
    },
    status: {
      background: statusColors.bg,
      color: statusColors.text,
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      textTransform: 'uppercase' as const,
    },
    details: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '16px',
      marginBottom: '16px',
    },
    detail: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: '#b3b3b3',
      fontSize: '14px',
    },
    actions: {
      display: 'flex',
      gap: '8px',
      justifyContent: 'flex-end',
    },
    actionButton: {
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '8px',
      padding: '8px 12px',
      color: '#ffffff',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      transition: 'all 0.2s ease',
    },
    editButton: {
      borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    deleteButton: {
      borderColor: 'rgba(255, 107, 107, 0.3)',
    },
  };

  return (
    <div
      style={styles.card}
      onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.cardHover)}
      onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.card)}
    >
      <div style={styles.header}>
        <div style={styles.matchup}>
          <div style={styles.team}>
            {teamA?.name || 'Team A'}
          </div>
          <div style={styles.vs}>vs</div>
          <div style={styles.team}>
            {teamB?.name || 'Team B'}
          </div>
        </div>
        <div style={styles.status}>
          {game.status}
        </div>
      </div>

      <div style={styles.details}>
        <div style={styles.detail}>
          <Clock style={{ width: '16px', height: '16px' }} />
          {formatDate(game.start_time)}
        </div>
        <div style={styles.detail}>
          <MapPin style={{ width: '16px', height: '16px' }} />
          Venue: TBD
        </div>
        {game.stat_admin_id && (
          <div style={styles.detail}>
            <User style={{ width: '16px', height: '16px' }} />
            Stat Admin Assigned
          </div>
        )}
      </div>

      <div style={styles.actions}>
        <button
          style={{ ...styles.actionButton, ...styles.editButton }}
          onClick={onEdit}
        >
          <Edit style={{ width: '14px', height: '14px' }} />
          Edit
        </button>
        <button
          style={{ ...styles.actionButton, ...styles.deleteButton }}
          onClick={onDelete}
        >
          <Trash2 style={{ width: '14px', height: '14px' }} />
          Delete
        </button>
      </div>
    </div>
  );
}

// Bracket Builder Modal Component
function BracketBuilderModal({ 
  tournament, 
  teams, 
  onClose, 
  onGenerate 
}: { 
  tournament: Tournament; 
  teams: Team[]; 
  onClose: () => void; 
  onGenerate: (config: any) => void; 
}) {
  // Helper function to format date for datetime-local input
  const formatDateTimeLocal = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const minDate = formatDateTimeLocal(tournament.startDate);
  const maxDate = formatDateTimeLocal(tournament.endDate);

  const [bracketConfig, setBracketConfig] = useState({
    tournamentType: tournament.tournamentType,
    selectedTeams: teams.slice(0, Math.min(teams.length, 8)), // Max 8 teams for demo
    startDate: minDate, // Start with tournament start date
    venue: tournament.venue,
    gamesPerDay: 2,
    daysBetweenGames: 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate date is within tournament range
    const bracketStartDate = new Date(bracketConfig.startDate);
    const tournamentStart = new Date(tournament.startDate);
    const tournamentEnd = new Date(tournament.endDate);
    
    if (bracketStartDate < tournamentStart || bracketStartDate > tournamentEnd) {
      alert(`Bracket start date must be between ${tournament.startDate.split('T')[0]} and ${tournament.endDate.split('T')[0]}`);
      return;
    }
    
    onGenerate({
      tournamentType: bracketConfig.tournamentType,
      teams: bracketConfig.selectedTeams,
      startDate: bracketConfig.startDate,
      venue: bracketConfig.venue,
      gamesPerDay: bracketConfig.gamesPerDay,
      daysBetweenGames: bracketConfig.daysBetweenGames,
    });
  };

  const styles = {
    overlay: {
      position: 'fixed' as const,
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
      background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
      borderRadius: '16px',
      padding: '32px',
      width: '90%',
      maxWidth: '600px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      maxHeight: '90vh',
      overflowY: 'auto' as const,
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#ffffff',
      marginBottom: '24px',
      textAlign: 'center' as const,
    },
    form: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '20px',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
    },
    label: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#ffffff',
    },
    select: {
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '8px',
      padding: '12px',
      color: '#ffffff',
      fontSize: '14px',
      outline: 'none',
    },
    input: {
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '8px',
      padding: '12px',
      color: '#ffffff',
      fontSize: '14px',
      outline: 'none',
    },
    teamsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '12px',
      maxHeight: '200px',
      overflowY: 'auto' as const,
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      padding: '12px',
    },
    teamItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '6px',
      fontSize: '14px',
    },
    checkbox: {
      width: '16px',
      height: '16px',
    },
    buttonGroup: {
      display: 'flex',
      gap: '12px',
      marginTop: '24px',
    },
    cancelButton: {
      flex: 1,
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '12px',
      padding: '12px 24px',
      color: '#ffffff',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
    },
    generateButton: {
      flex: 1,
      background: 'linear-gradient(135deg, #9D4EDD, #7B2CBF)',
      border: 'none',
      borderRadius: '12px',
      padding: '12px 24px',
      color: '#ffffff',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
    },
    info: {
      background: 'rgba(157, 78, 221, 0.1)',
      border: '1px solid rgba(157, 78, 221, 0.3)',
      borderRadius: '8px',
      padding: '16px',
      fontSize: '14px',
      color: '#b3b3b3',
    },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.title}>Generate Tournament Bracket</h2>
        
        <form style={styles.form} onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Tournament Format</label>
            <select
              style={styles.select}
              value={bracketConfig.tournamentType}
              onChange={(e) => setBracketConfig(prev => ({ 
                ...prev, 
                tournamentType: e.target.value as any 
              }))}
            >
              <option value="single_elimination">Single Elimination</option>
              <option value="double_elimination">Double Elimination</option>
              <option value="round_robin">Round Robin</option>
              <option value="swiss">Swiss System</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Select Teams ({bracketConfig.selectedTeams.length} selected)
            </label>
            <div style={styles.teamsGrid}>
              {teams.map(team => (
                <label key={team.id} style={styles.teamItem}>
                  <input
                    type="checkbox"
                    style={styles.checkbox}
                    checked={bracketConfig.selectedTeams.some(t => t.id === team.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setBracketConfig(prev => ({
                          ...prev,
                          selectedTeams: [...prev.selectedTeams, team]
                        }));
                      } else {
                        setBracketConfig(prev => ({
                          ...prev,
                          selectedTeams: prev.selectedTeams.filter(t => t.id !== team.id)
                        }));
                      }
                    }}
                  />
                  {team.name}
                </label>
              ))}
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Tournament Start Date
              <span style={{ fontSize: '12px', color: '#9D4EDD', fontWeight: 'normal' }}>
                (Only {tournament.startDate.split('T')[0]} to {tournament.endDate.split('T')[0]} allowed)
              </span>
            </label>
            <input
              type="datetime-local"
              style={styles.input}
              value={bracketConfig.startDate}
              onChange={(e) => setBracketConfig(prev => ({ 
                ...prev, 
                startDate: e.target.value 
              }))}
              min={minDate} // Tournament start date (properly formatted)
              max={maxDate} // Tournament end date (properly formatted)
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Default Venue</label>
            <input
              type="text"
              style={styles.input}
              value={bracketConfig.venue}
              onChange={(e) => setBracketConfig(prev => ({ 
                ...prev, 
                venue: e.target.value 
              }))}
              placeholder="Enter default venue"
            />
          </div>

          <div style={styles.info}>
            <strong>Preview:</strong> This will generate a {bracketConfig.tournamentType.replace('_', ' ')} 
            bracket for {bracketConfig.selectedTeams.length} teams, starting on{' '}
            {new Date(bracketConfig.startDate).toLocaleDateString()}.
          </div>

          <div style={styles.buttonGroup}>
            <button
              type="button"
              style={styles.cancelButton}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={styles.generateButton}
              disabled={bracketConfig.selectedTeams.length < 2}
            >
              Generate Bracket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Bracket Generation Logic
function generateBracketGames(
  tournamentType: string,
  teams: Team[],
  startDate: string,
  venue: string,
  tournamentId: string
): any[] {
  const games: any[] = [];
  const startDateTime = new Date(startDate);
  
  switch (tournamentType) {
    case 'single_elimination':
      return generateSingleEliminationBracket(teams, startDateTime, venue, tournamentId);
    
    case 'round_robin':
      return generateRoundRobinBracket(teams, startDateTime, venue, tournamentId);
    
    case 'double_elimination':
      return generateDoubleEliminationBracket(teams, startDateTime, venue, tournamentId);
    
    case 'swiss':
      return generateSwissBracket(teams, startDateTime, venue, tournamentId);
    
    default:
      return generateRoundRobinBracket(teams, startDateTime, venue, tournamentId);
  }
}

function generateSingleEliminationBracket(
  teams: Team[],
  startDate: Date,
  venue: string,
  tournamentId: string
): any[] {
  const games: any[] = [];
  const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
  let gameTime = new Date(startDate);
  
  // Round 1 - Pair up teams
  for (let i = 0; i < shuffledTeams.length; i += 2) {
    if (i + 1 < shuffledTeams.length) {
      games.push({
        tournamentId,
        teamAId: shuffledTeams[i].id,
        teamBId: shuffledTeams[i + 1].id,
        startTime: gameTime.toISOString(),
        venue,
      });
      
      // Space games 2 hours apart
      gameTime = new Date(gameTime.getTime() + 2 * 60 * 60 * 1000);
    }
  }
  
  return games;
}

function generateRoundRobinBracket(
  teams: Team[],
  startDate: Date,
  venue: string,
  tournamentId: string
): any[] {
  const games: any[] = [];
  let gameTime = new Date(startDate);
  
  // Generate all possible matchups
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      games.push({
        tournamentId,
        teamAId: teams[i].id,
        teamBId: teams[j].id,
        startTime: gameTime.toISOString(),
        venue,
      });
      
      // Space games 2 hours apart, start new day after 4 games
      gameTime = new Date(gameTime.getTime() + 2 * 60 * 60 * 1000);
      
      // Start new day after 4 games
      if (games.length % 4 === 0) {
        const nextDay = new Date(startDate.getTime() + Math.floor(games.length / 4) * 24 * 60 * 60 * 1000);
        gameTime = new Date(nextDay.setHours(startDate.getHours(), startDate.getMinutes(), 0, 0));
      }
    }
  }
  
  return games;
}

function generateDoubleEliminationBracket(
  teams: Team[],
  startDate: Date,
  venue: string,
  tournamentId: string
): any[] {
  // For now, implement as single elimination (simplified)
  // TODO: Implement full double elimination logic
  return generateSingleEliminationBracket(teams, startDate, venue, tournamentId);
}

function generateSwissBracket(
  teams: Team[],
  startDate: Date,
  venue: string,
  tournamentId: string
): any[] {
  // For now, implement as round robin (simplified)
  // TODO: Implement Swiss system logic
  return generateRoundRobinBracket(teams, startDate, venue, tournamentId);
}

export default GameSchedulePage;