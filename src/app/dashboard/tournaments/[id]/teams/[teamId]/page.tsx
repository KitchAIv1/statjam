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
import { 
  ArrowLeft, 
  Users, 
  Trophy,
  Shield
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TeamManagementDetailPageProps {
  params: Promise<{ id: string; teamId: string }>;
}

/**
 * Team Management Detail Page
 * 
 * Full-page view for managing a specific team's roster
 * NO LOGIC CHANGES - Uses existing reusable components:
 * - PlayerRosterList (current roster)
 * - PlayerSelectionList (add players)
 * - OrganizerPlayerManagementService (business logic)
 * 
 * ONLY UI/LAYOUT CHANGES:
 * - Removed modal wrapper
 * - Side-by-side grid layout
 * - Full-page experience
 * - Matches dashboard design system
 */
const TeamManagementDetailPage = ({ params }: TeamManagementDetailPageProps) => {
  const { id: tournamentId, teamId } = use(params);
  const { user, loading } = useAuthV2();
  const userRole = user?.role;
  const router = useRouter();
  
  // State
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [currentPlayers, setCurrentPlayers] = useState<GenericPlayer[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingPlayer, setRemovingPlayer] = useState<string | null>(null);
  
  const service = new OrganizerPlayerManagementService();
  const minPlayers = 5;

  // Load tournament and team data
  useEffect(() => {
    if (!loading && (!user || userRole !== 'organizer')) {
      router.push('/auth');
      return;
    }

    const loadData = async () => {
      try {
        setLoadingData(true);
        setError(null);

        // Load tournament and team data
        const [tournamentData, teamData] = await Promise.all([
          TournamentService.getTournament(tournamentId),
          TeamService.getTeam(teamId)
        ]);

        setTournament(tournamentData);
        setTeam(teamData);

        // Load current roster
        const players = await service.getTeamPlayers(teamId);
        setCurrentPlayers(players);
      } catch (error) {
        console.error('❌ Failed to load team data:', error);
        setError('Failed to load team data');
      } finally {
        setLoadingData(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user, userRole, loading, tournamentId, teamId, router]);

  // Handle player removal (NO LOGIC CHANGE - same as modal)
  const handleRemovePlayer = async (player: GenericPlayer) => {
    if (!player.team_player_id) return;

    try {
      setRemovingPlayer(player.id);
      
      const response = await service.removePlayerFromTeam({
        team_id: teamId,
        team_player_id: player.team_player_id
      });

      if (response.success) {
        setCurrentPlayers(prev => prev.filter(p => p.id !== player.id));
      } else {
        setError(response.message || response.error || 'Failed to remove player');
      }
    } catch (error) {
      console.error('❌ Error removing player:', error);
      setError('Failed to remove player');
    } finally {
      setRemovingPlayer(null);
    }
  };

  // Handle player addition (NO LOGIC CHANGE - same as modal)
  const handlePlayerAdd = (player: GenericPlayer) => {
    setCurrentPlayers(prev => [...prev, { ...player, is_on_team: true }]);
  };

  // Handle player removal from selection (NO LOGIC CHANGE - same as modal)
  const handlePlayerRemove = (player: GenericPlayer) => {
    setCurrentPlayers(prev => prev.filter(p => p.id !== player.id));
  };

  // Loading state
  if (loading || loadingData) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)',
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
          Loading Team...
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

  if (!tournament || !team) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)',
        color: '#ffffff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Team Not Found</h2>
          <p style={{ color: '#888', marginBottom: '24px' }}>The team you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push(`/dashboard/tournaments/${tournamentId}/teams`)}
            style={{
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              color: '#1a1a1a',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Back to Teams
          </button>
        </div>
      </div>
    );
  }

  // Styles matching dashboard design system
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
      border: '1px solid rgba(255, 215, 0, 0.3)',
    },
    header: {
      marginBottom: '48px',
    },
    titleRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '16px',
    },
    teamIcon: {
      width: '64px',
      height: '64px',
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: '42px',
      fontWeight: '700',
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      fontFamily: "'Anton', system-ui, sans-serif",
      letterSpacing: '1px',
    },
    subtitle: {
      fontSize: '18px',
      color: '#b3b3b3',
      marginBottom: '16px',
    },
    statsRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '24px',
      marginBottom: '16px',
    },
    stat: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '16px',
      color: '#b3b3b3',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '32px',
      marginTop: '48px',
    },
    section: {
      background: 'rgba(30, 30, 30, 0.8)',
      borderRadius: '20px',
      padding: '32px',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'rgba(255, 215, 0, 0.1)',
      minHeight: '600px',
    },
    sectionHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '24px',
    },
    sectionTitle: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    errorBanner: {
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      borderRadius: '12px',
      padding: '16px',
      color: '#ef4444',
      fontSize: '14px',
      marginBottom: '24px',
    },
  };

  // Responsive styles
  const mediaQuery = '@media (max-width: 1024px)';

  return (
    <>
      <style jsx>{`
        ${mediaQuery} {
          .player-management-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      
      <div style={styles.container}>
        <div style={styles.content}>
          {/* Back Button */}
          <button
            style={styles.backButton}
            onClick={() => router.push(`/dashboard/tournaments/${tournamentId}/teams`)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
              e.currentTarget.style.borderColor = '#FFD700';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.3)';
            }}
          >
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
            Back to Teams
          </button>

          {/* Header */}
          <div style={styles.header}>
            <div style={styles.titleRow}>
              <div style={styles.teamIcon}>
                <Shield style={{ width: '32px', height: '32px', color: '#1a1a1a' }} />
              </div>
              <h1 style={styles.title}>{team.name}</h1>
            </div>
            
            <p style={styles.subtitle}>
              Manage players for {tournament.name}
            </p>

            <div style={styles.statsRow}>
              <div style={styles.stat}>
                <Users style={{ width: '20px', height: '20px' }} />
                {currentPlayers.length} players
              </div>
              <div style={styles.stat}>
                <Trophy style={{ width: '20px', height: '20px' }} />
                {team.wins}W - {team.losses}L
              </div>
              <Badge variant={currentPlayers.length >= minPlayers ? "default" : "secondary"}>
                {currentPlayers.length >= minPlayers ? '✓ Ready' : `Need ${minPlayers - currentPlayers.length} more`}
              </Badge>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div style={styles.errorBanner}>
              {error}
            </div>
          )}

          {/* Side-by-Side Grid Layout */}
          <div style={styles.grid} className="player-management-grid">
            {/* Current Roster Section */}
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>
                  <Users style={{ width: '20px', height: '20px' }} />
                  Current Roster
                </h2>
                <Badge variant={currentPlayers.length >= minPlayers ? "default" : "secondary"}>
                  {currentPlayers.length} player{currentPlayers.length !== 1 ? 's' : ''}
                  {currentPlayers.length >= minPlayers && ' ✓'}
                </Badge>
              </div>

              {/* Reusable Component - NO LOGIC CHANGE */}
              <PlayerRosterList
                players={currentPlayers}
                loading={loadingData}
                removingPlayer={removingPlayer}
                onRemovePlayer={handleRemovePlayer}
              />
            </div>

            {/* Add Players Section */}
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>
                  <Users style={{ width: '20px', height: '20px' }} />
                  Add Players
                </h2>
              </div>

              {/* Reusable Component - NO LOGIC CHANGE */}
              <PlayerSelectionList
                key={currentPlayers.map(p => p.id).join(',')}
                teamId={teamId}
                service={service}
                onPlayerAdd={handlePlayerAdd}
                onPlayerRemove={handlePlayerRemove}
                showCustomPlayerOption={false}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TeamManagementDetailPage;

