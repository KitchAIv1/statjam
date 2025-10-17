'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthV2 } from '@/hooks/useAuthV2';
import { useTournaments } from '@/lib/hooks/useTournaments';
import { Tournament } from '@/lib/types/tournament';
import { 
  Trophy, 
  ArrowLeft, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  Users,
  Play,
  Pause,
  CheckCircle
} from 'lucide-react';

const TournamentsPage = () => {
  const { user, loading } = useAuthV2();
  const userRole = user?.role;
  const router = useRouter();
  const { tournaments, loading: tournamentsLoading, error, filter, setFilter } = useTournaments();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!loading && (!user || userRole !== 'organizer')) {
      router.push('/auth');
      return;
    }
  }, [user, userRole, loading, router]);

  useEffect(() => {
    setFilter({ search: searchTerm });
  }, [searchTerm, setFilter]);

  if (loading || !user || userRole !== 'organizer') {
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
          Loading Tournaments...
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

  const getStatusColor = (status: Tournament['status']) => {
    switch (status) {
      case 'active':
        return {
          background: 'rgba(34, 197, 94, 0.1)',
          color: '#22c55e',
          borderColor: '#22c55e',
        };
      case 'draft':
        return {
          background: 'rgba(59, 130, 246, 0.1)',
          color: '#3b82f6',
          borderColor: '#3b82f6',
        };
      case 'completed':
        return {
          background: 'rgba(168, 85, 247, 0.1)',
          color: '#a855f7',
          borderColor: '#a855f7',
        };
      case 'cancelled':
        return {
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#ef4444',
          borderColor: '#ef4444',
        };
      default:
        return {
          background: 'rgba(156, 163, 175, 0.1)',
          color: '#9ca3af',
          borderColor: '#9ca3af',
        };
    }
  };

  const getStatusIcon = (status: Tournament['status']) => {
    switch (status) {
      case 'active':
        return <Play style={{ width: '14px', height: '14px' }} />;
      case 'draft':
        return <Edit style={{ width: '14px', height: '14px' }} />;
      case 'completed':
        return <CheckCircle style={{ width: '14px', height: '14px' }} />;
      case 'cancelled':
        return <Pause style={{ width: '14px', height: '14px' }} />;
      default:
        return null;
    }
  };

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
    tournamentsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
      gap: '24px',
    },
    tournamentCard: {
      background: 'rgba(30, 30, 30, 0.8)',
      borderRadius: '20px',
      padding: '24px',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'rgba(255, 215, 0, 0.1)',
      transition: 'all 0.3s ease',
    },
    tournamentCardHover: {
      borderColor: 'rgba(255, 215, 0, 0.3)',
      transform: 'translateY(-4px)',
      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.3)',
    },
    tournamentHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '20px',
    },
    tournamentInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    tournamentIcon: {
      width: '48px',
      height: '48px',
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    tournamentName: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#ffffff',
      marginBottom: '4px',
    },
    tournamentMeta: {
      fontSize: '14px',
      color: '#888888',
    },
    statusBadge: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      borderWidth: '1px',
      borderStyle: 'solid',
    },
    tournamentStats: {
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
    tournamentActions: {
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
            onClick={() => router.push('/dashboard')}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.backButtonHover)}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.backButton)}
          >
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
            Back to Dashboard
          </button>

          <h1 style={styles.title}>MY TOURNAMENTS</h1>
          <p style={styles.subtitle}>
            Manage all your tournaments and track their progress
          </p>
        </div>

        {/* Controls */}
        <div style={styles.controls}>
          <div style={styles.searchContainer}>
            <Search style={{ width: '20px', height: '20px', color: '#888' }} />
            <input
              type="text"
              placeholder="Search tournaments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <select
            value={filter.status}
            onChange={(e) => setFilter({ status: e.target.value as any })}
            style={styles.filterSelect}
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button
            style={styles.createButton}
            onClick={() => router.push('/dashboard/create-tournament')}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.createButtonHover)}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.createButton)}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            Create Tournament
          </button>
        </div>

        {/* Tournaments Grid */}
        <div style={styles.tournamentsGrid}>
          {tournaments.length > 0 ? (
            tournaments.map((tournament) => {
              const statusColors = getStatusColor(tournament.status);
              return (
                <div
                  key={tournament.id}
                  style={styles.tournamentCard}
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.tournamentCardHover)}
                  onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.tournamentCard)}
                >
                  <div style={styles.tournamentHeader}>
                    <div style={styles.tournamentInfo}>
                      <div style={styles.tournamentIcon}>
                        <Trophy style={{ width: '24px', height: '24px', color: '#1a1a1a' }} />
                      </div>
                      <div>
                        <div style={styles.tournamentName}>{tournament.name}</div>
                        <div style={styles.tournamentMeta}>
                          {tournament.venue} • {tournament.tournamentType.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        ...styles.statusBadge,
                        background: statusColors.background,
                        color: statusColors.color,
                        borderColor: statusColors.borderColor,
                      }}
                    >
                      {getStatusIcon(tournament.status)}
                      {tournament.status}
                    </div>
                  </div>

                  <div style={styles.tournamentStats}>
                    <div style={styles.stat}>
                      <Users style={{ width: '16px', height: '16px' }} />
                      {tournament.currentTeams}/{tournament.maxTeams} teams
                    </div>
                    <div style={styles.stat}>
                      <Calendar style={{ width: '16px', height: '16px' }} />
                      {new Date(tournament.startDate).toLocaleDateString()}
                    </div>
                    <div style={styles.stat}>
                      <MapPin style={{ width: '16px', height: '16px' }} />
                      {tournament.country}
                    </div>
                  </div>

                  <div style={styles.tournamentActions}>
                    <button
                      style={styles.actionButton}
                      onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.actionButtonHover)}
                      onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.actionButton)}
                      onClick={() => router.push(`/dashboard/tournaments/${tournament.id}`)}
                    >
                      <Eye style={{ width: '14px', height: '14px' }} />
                      View
                    </button>
                    <button
                      style={styles.actionButton}
                      onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.actionButtonHover)}
                      onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.actionButton)}
                      onClick={() => router.push(`/dashboard/tournaments/${tournament.id}/teams`)}
                    >
                      <Users style={{ width: '14px', height: '14px' }} />
                      Teams
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
              );
            })
          ) : (
            <div style={styles.emptyState}>
              <div style={styles.emptyStateIcon}>
                <Trophy style={{ width: '64px', height: '64px' }} />
              </div>
              <div style={styles.emptyStateTitle}>No tournaments yet</div>
              <div style={styles.emptyStateDesc}>
                Create your first tournament to start organizing basketball events
              </div>
              <button
                style={styles.createButton}
                onClick={() => router.push('/dashboard/create-tournament')}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.createButtonHover)}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.createButton)}
              >
                <Plus style={{ width: '16px', height: '16px' }} />
                Create First Tournament
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentsPage; 