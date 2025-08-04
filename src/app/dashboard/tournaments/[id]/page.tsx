'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { TournamentService } from '@/lib/services/tournamentService';
import { Tournament } from '@/lib/types/tournament';
import { 
  Trophy, 
  ArrowLeft, 
  Users, 
  Calendar, 
  Settings, 
  Eye, 
  Play, 
  Pause, 
  CheckCircle,
  MapPin,
  DollarSign,
  Globe,
  Lock,
  Edit,
  Plus
} from 'lucide-react';

interface TournamentDetailPageProps {
  params: { id: string };
}

const TournamentDetailPage = ({ params }: TournamentDetailPageProps) => {
  const { user, userRole, loading } = useAuthStore();
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loadingTournament, setLoadingTournament] = useState(true);
  
  // Get tournament ID from params
  const tournamentId = params.id;

  useEffect(() => {
    if (!loading && (!user || (userRole !== 'organizer' && userRole !== 'stat_admin'))) {
      router.push('/auth');
      return;
    }

    const loadTournament = async () => {
      try {
        const tournamentData = await TournamentService.getTournament(tournamentId);
        setTournament(tournamentData);
      } catch (error) {
        console.error('Failed to load tournament:', error);
      } finally {
        setLoadingTournament(false);
      }
    };

    if (user) {
      loadTournament();
    }
  }, [user, userRole, loading, tournamentId, router]);

  if (loading || loadingTournament) {
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
          Loading Tournament...
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
        color: '#ffffff',
        textAlign: 'center'
      }}>
        <div>
          <Trophy style={{ width: '48px', height: '48px', margin: '0 auto 16px', color: '#888888' }} />
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>Tournament Not Found</h2>
          <p style={{ color: '#888888', marginBottom: '24px' }}>The tournament you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              color: '#1a1a1a',
              borderWidth: '0',
              borderStyle: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // CLEAN SLATE STYLING - AUTH V2 BRANDING CONSISTENCY
  const styles = {
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
    titleSection: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: '24px',
      marginBottom: '32px',
    },
    titleGroup: {
      flex: 1,
    },
    title: {
      fontSize: '42px',
      fontWeight: '700',
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      fontFamily: "'Anton', system-ui, sans-serif",
      marginBottom: '8px',
      letterSpacing: '1px',
    },
    subtitle: {
      fontSize: '18px',
      color: '#b3b3b3',
      marginBottom: '16px',
    },
    statusBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      borderRadius: '20px',
      fontSize: '14px',
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    actionButtons: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      minWidth: '200px',
    },
    primaryButton: {
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      color: '#1a1a1a',
      borderWidth: '0',
      borderStyle: 'none',
      borderRadius: '12px',
      padding: '16px 24px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
    },
    primaryButtonHover: {
      transform: 'translateY(-1px)',
      boxShadow: '0 8px 20px rgba(255, 215, 0, 0.4)',
    },
    secondaryButton: {
      background: 'transparent',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'rgba(255, 215, 0, 0.3)',
      color: '#FFD700',
      borderRadius: '12px',
      padding: '16px 24px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
    },
    secondaryButtonHover: {
      background: 'rgba(255, 215, 0, 0.1)',
      borderColor: '#FFD700',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
      gap: '32px',
      marginBottom: '48px',
    },
    card: {
      background: 'rgba(30, 30, 30, 0.8)',
      borderRadius: '20px',
      padding: '32px',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'rgba(255, 215, 0, 0.2)',
      backdropFilter: 'blur(20px)',
      transition: 'all 0.3s ease',
    },
    cardHover: {
      borderColor: 'rgba(255, 215, 0, 0.4)',
      transform: 'translateY(-4px)',
      boxShadow: '0 20px 40px rgba(255, 215, 0, 0.1)',
    },
    cardHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '24px',
    },
    cardIcon: {
      width: '48px',
      height: '48px',
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 8px 24px rgba(255, 215, 0, 0.3)',
    },
    cardTitle: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#ffffff',
      fontFamily: "'Anton', system-ui, sans-serif",
    },
    infoGrid: {
      display: 'grid',
      gap: '16px',
    },
    infoItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 0',
      borderBottom: '1px solid rgba(255, 215, 0, 0.1)',
    },
    infoLabel: {
      fontSize: '14px',
      color: '#888888',
      fontWeight: '500',
    },
    infoValue: {
      fontSize: '14px',
      color: '#ffffff',
      fontWeight: '600',
    },
    quickActions: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '24px',
    },
    actionCard: {
      background: 'rgba(255, 215, 0, 0.05)',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'rgba(255, 215, 0, 0.2)',
      borderRadius: '16px',
      padding: '24px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      textAlign: 'center',
    },
    actionCardHover: {
      background: 'rgba(255, 215, 0, 0.1)',
      borderColor: 'rgba(255, 215, 0, 0.4)',
      transform: 'translateY(-2px)',
    },
    actionIcon: {
      width: '40px',
      height: '40px',
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 16px',
    },
    actionTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: '8px',
    },
    actionDesc: {
      fontSize: '14px',
      color: '#888888',
      lineHeight: '1.4',
    },
  };

  const getStatusColor = (status: Tournament['status']) => {
    switch (status) {
      case 'active':
        return {
          background: 'rgba(34, 197, 94, 0.2)',
          color: '#22c55e',
          borderColor: '#22c55e',
        };
      case 'draft':
        return {
          background: 'rgba(251, 191, 36, 0.2)',
          color: '#fbbf24',
          borderColor: '#fbbf24',
        };
      case 'completed':
        return {
          background: 'rgba(59, 130, 246, 0.2)',
          color: '#3b82f6',
          borderColor: '#3b82f6',
        };
      case 'cancelled':
        return {
          background: 'rgba(239, 68, 68, 0.2)',
          color: '#ef4444',
          borderColor: '#ef4444',
        };
      default:
        return {
          background: 'rgba(156, 163, 175, 0.2)',
          color: '#9ca3af',
          borderColor: '#9ca3af',
        };
    }
  };

  const statusColors = getStatusColor(tournament.status);

  const quickActions = [
    {
      title: 'Manage Teams',
      description: 'Add, edit, and organize tournament teams',
      icon: <Users style={{ width: '20px', height: '20px', color: '#1a1a1a' }} />,
      action: () => router.push(`/dashboard/tournaments/${tournamentId}/teams`),
    },
    {
      title: 'Schedule Games',
      description: 'Set up matches and tournament brackets',
      icon: <Calendar style={{ width: '20px', height: '20px', color: '#1a1a1a' }} />,
      action: () => console.log('Schedule games'),
    },
    {
      title: 'Tournament Settings',
      description: 'Edit tournament configuration',
      icon: <Settings style={{ width: '20px', height: '20px', color: '#1a1a1a' }} />,
      action: () => console.log('Edit settings'),
    },
    {
      title: 'Public View',
      description: 'See how fans will view your tournament',
      icon: <Eye style={{ width: '20px', height: '20px', color: '#1a1a1a' }} />,
      action: () => console.log('Public view'),
    },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <button
            style={styles.backButton}
            onClick={() => router.push('/dashboard')}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.backButtonHover)}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.backButton)}
          >
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
            Back to Dashboard
          </button>

          <div style={styles.titleSection}>
            <div style={styles.titleGroup}>
              <h1 style={styles.title}>{tournament.name}</h1>
              <p style={styles.subtitle}>{tournament.description}</p>
              <div
                style={{
                  ...styles.statusBadge,
                  background: statusColors.background,
                  color: statusColors.color,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: statusColors.borderColor,
                }}
              >
                {tournament.status === 'active' && <Play style={{ width: '14px', height: '14px' }} />}
                {tournament.status === 'draft' && <Edit style={{ width: '14px', height: '14px' }} />}
                {tournament.status === 'completed' && <CheckCircle style={{ width: '14px', height: '14px' }} />}
                {tournament.status === 'cancelled' && <Pause style={{ width: '14px', height: '14px' }} />}
                {tournament.status}
              </div>
            </div>

            <div style={styles.actionButtons}>
              {tournament.status === 'draft' && (
                <button
                  style={styles.primaryButton}
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.primaryButtonHover)}
                  onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.primaryButton)}
                  onClick={() => console.log('Start tournament')}
                >
                  <Play style={{ width: '16px', height: '16px' }} />
                  Start Tournament
                </button>
              )}
              <button
                style={styles.secondaryButton}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.secondaryButtonHover)}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.secondaryButton)}
                onClick={() => console.log('Edit tournament')}
              >
                <Edit style={{ width: '16px', height: '16px' }} />
                Edit Details
              </button>
            </div>
          </div>
        </div>

        {/* Info Cards Grid */}
        <div style={styles.grid}>
          {/* Basic Information */}
          <div
            style={styles.card}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.cardHover)}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.card)}
          >
            <div style={styles.cardHeader}>
              <div style={styles.cardIcon}>
                <Trophy style={{ width: '24px', height: '24px', color: '#1a1a1a' }} />
              </div>
              <div style={styles.cardTitle}>Tournament Details</div>
            </div>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Format</span>
                <span style={styles.infoValue}>
                  {tournament.tournamentType.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Teams</span>
                <span style={styles.infoValue}>
                  {tournament.currentTeams} / {tournament.maxTeams}
                </span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Visibility</span>
                <span style={styles.infoValue}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {tournament.isPublic ? (
                      <Globe style={{ width: '14px', height: '14px' }} />
                    ) : (
                      <Lock style={{ width: '14px', height: '14px' }} />
                    )}
                    {tournament.isPublic ? 'Public' : 'Private'}
                  </div>
                </span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Country</span>
                <span style={styles.infoValue}>{tournament.country}</span>
              </div>
            </div>
          </div>

          {/* Schedule & Venue */}
          <div
            style={styles.card}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.cardHover)}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.card)}
          >
            <div style={styles.cardHeader}>
              <div style={styles.cardIcon}>
                <Calendar style={{ width: '24px', height: '24px', color: '#1a1a1a' }} />
              </div>
              <div style={styles.cardTitle}>Schedule & Venue</div>
            </div>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Start Date</span>
                <span style={styles.infoValue}>
                  {new Date(tournament.startDate).toLocaleDateString()}
                </span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>End Date</span>
                <span style={styles.infoValue}>
                  {new Date(tournament.endDate).toLocaleDateString()}
                </span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Venue</span>
                <span style={styles.infoValue}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin style={{ width: '14px', height: '14px' }} />
                    {tournament.venue}
                  </div>
                </span>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div
            style={styles.card}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.cardHover)}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.card)}
          >
            <div style={styles.cardHeader}>
              <div style={styles.cardIcon}>
                <DollarSign style={{ width: '24px', height: '24px', color: '#1a1a1a' }} />
              </div>
              <div style={styles.cardTitle}>Financial Overview</div>
            </div>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Entry Fee</span>
                <span style={styles.infoValue}>${tournament.entryFee}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Prize Pool</span>
                <span style={styles.infoValue}>${tournament.prizePool}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Total Revenue</span>
                <span style={styles.infoValue}>
                  ${tournament.entryFee * tournament.currentTeams}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.cardIcon}>
              <Settings style={{ width: '24px', height: '24px', color: '#1a1a1a' }} />
            </div>
            <div style={styles.cardTitle}>Quick Actions</div>
          </div>
          <div style={styles.quickActions}>
            {quickActions.map((action, index) => (
              <div
                key={index}
                style={styles.actionCard}
                onClick={action.action}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.actionCardHover)}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.actionCard)}
              >
                <div style={styles.actionIcon}>
                  {action.icon}
                </div>
                <div style={styles.actionTitle}>{action.title}</div>
                <div style={styles.actionDesc}>{action.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentDetailPage;