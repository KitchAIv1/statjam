'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { GameService } from '@/lib/services/gameService';
import { TeamService } from '@/lib/services/tournamentService';
import { TrendingUp, Database, BarChart3, Settings, Users, Activity, Play, Clock, Trophy } from 'lucide-react';

const StatAdminDashboard = () => {
  const { user, userRole, loading } = useAuthStore();
  const router = useRouter();
  
  // Real assigned games data
  const [assignedGames, setAssignedGames] = useState<any[]>([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [gamesError, setGamesError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || userRole !== 'stat_admin')) {
      router.push('/auth');
    }
  }, [user, userRole, loading, router]);

  // Load assigned games when user is available
  useEffect(() => {
    const loadAssignedGames = async () => {
      if (!user || userRole !== 'stat_admin') return;
      
      try {
        setGamesLoading(true);
        setGamesError(null);
        
        console.log('🔍 Loading assigned games for stat admin:', user.id);
        const games = await GameService.getAssignedGames(user.id);
        setAssignedGames(games);
        
        console.log('✅ Loaded assigned games:', games.length);
      } catch (error) {
        console.error('❌ Error loading assigned games:', error);
        setGamesError(error instanceof Error ? error.message : 'Failed to load assigned games');
      } finally {
        setGamesLoading(false);
      }
    };

    if (user && userRole === 'stat_admin') {
      loadAssignedGames();
    }
  }, [user, userRole]);

  if (loading || !user || userRole !== 'stat_admin') {
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
          Loading Stat Admin Dashboard...
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
      textAlign: 'center',
    },
    title: {
      fontSize: '48px',
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
      maxWidth: '600px',
      margin: '0 auto',
      lineHeight: '1.6',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '24px',
      marginBottom: '48px',
    },
    statCard: {
      background: 'rgba(30, 30, 30, 0.8)',
      borderRadius: '20px',
      padding: '32px',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'rgba(255, 215, 0, 0.2)',
      backdropFilter: 'blur(20px)',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden',
    },
    statCardHover: {
      transform: 'translateY(-4px)',
      borderColor: 'rgba(255, 215, 0, 0.4)',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
    },
    statIcon: {
      width: '48px',
      height: '48px',
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '16px',
    },
    statTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#888888',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: '8px',
    },
    statValue: {
      fontSize: '32px',
      fontWeight: '700',
      color: '#ffffff',
      marginBottom: '4px',
    },
    statChange: {
      fontSize: '14px',
      color: '#00ff88',
      fontWeight: '500',
    },
    section: {
      marginBottom: '48px',
    },
    sectionTitle: {
      fontSize: '24px',
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: '24px',
    },
    adminTools: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '24px',
      marginBottom: '48px',
    },
    toolCard: {
      background: 'rgba(30, 30, 30, 0.8)',
      borderRadius: '16px',
      padding: '32px',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'rgba(255, 215, 0, 0.2)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    toolCardHover: {
      transform: 'translateY(-2px)',
      borderColor: 'rgba(255, 215, 0, 0.4)',
      boxShadow: '0 12px 24px rgba(0, 0, 0, 0.2)',
    },
    toolIcon: {
      width: '48px',
      height: '48px',
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '20px',
    },
    toolTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: '12px',
    },
    toolDescription: {
      fontSize: '14px',
      color: '#b3b3b3',
      lineHeight: '1.6',
      marginBottom: '16px',
    },
    toolStatus: {
      fontSize: '12px',
      fontWeight: '500',
      padding: '4px 12px',
      borderRadius: '20px',
      display: 'inline-block',
    },
    statusActive: {
      background: 'rgba(0, 255, 136, 0.2)',
      color: '#00ff88',
    },
    statusPending: {
      background: 'rgba(255, 215, 0, 0.2)',
      color: '#FFD700',
    },
    comingSoon: {
      background: 'rgba(30, 30, 30, 0.8)',
      borderRadius: '20px',
      padding: '48px',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'rgba(255, 215, 0, 0.2)',
      textAlign: 'center',
    },
    comingSoonIcon: {
      width: '64px',
      height: '64px',
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 24px',
    },
    comingSoonTitle: {
      fontSize: '24px',
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: '12px',
    },
    comingSoonText: {
      fontSize: '16px',
      color: '#b3b3b3',
      lineHeight: '1.6',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>STAT ADMIN DASHBOARD</h1>
          <p style={styles.subtitle}>
            Manage statistics, analytics, and data integrity across all tournaments
          </p>
        </div>

        {/* System Stats */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>System Overview</h2>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <Database style={{ width: '24px', height: '24px', color: '#1a1a1a' }} />
              </div>
              <div style={styles.statTitle}>Data Records</div>
              <div style={styles.statValue}>2.4M+</div>
              <div style={styles.statChange}>+15% this week</div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <Activity style={{ width: '24px', height: '24px', color: '#1a1a1a' }} />
              </div>
              <div style={styles.statTitle}>Active Sessions</div>
              <div style={styles.statValue}>1,247</div>
              <div style={styles.statChange}>+8% from yesterday</div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <TrendingUp style={{ width: '24px', height: '24px', color: '#1a1a1a' }} />
              </div>
              <div style={styles.statTitle}>Data Accuracy</div>
              <div style={styles.statValue}>99.8%</div>
              <div style={styles.statChange}>+0.1% improvement</div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <Users style={{ width: '24px', height: '24px', color: '#1a1a1a' }} />
              </div>
              <div style={styles.statTitle}>Users Tracked</div>
              <div style={styles.statValue}>45K+</div>
              <div style={styles.statChange}>+2.3K this month</div>
            </div>
          </div>
        </div>

        {/* Admin Tools */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Administrative Tools</h2>
          <div style={styles.adminTools}>
            <div style={styles.toolCard}>
              <div style={styles.toolIcon}>
                <BarChart3 style={{ width: '24px', height: '24px', color: '#1a1a1a' }} />
              </div>
              <div style={styles.toolTitle}>Analytics Dashboard</div>
              <div style={styles.toolDescription}>
                Comprehensive analytics and reporting tools for tournament performance,
                player statistics, and system metrics.
              </div>
              <div style={{ ...styles.toolStatus, ...styles.statusActive }}>
                Active
              </div>
            </div>

            <div style={styles.toolCard}>
              <div style={styles.toolIcon}>
                <Database style={{ width: '24px', height: '24px', color: '#1a1a1a' }} />
              </div>
              <div style={styles.toolTitle}>Data Management</div>
              <div style={styles.toolDescription}>
                Manage data integrity, backup systems, and ensure statistical accuracy
                across all tournament data.
              </div>
              <div style={{ ...styles.toolStatus, ...styles.statusActive }}>
                Active
              </div>
            </div>

            <div style={styles.toolCard}>
              <div style={styles.toolIcon}>
                <Settings style={{ width: '24px', height: '24px', color: '#1a1a1a' }} />
              </div>
              <div style={styles.toolTitle}>System Configuration</div>
              <div style={styles.toolDescription}>
                Configure statistical parameters, data collection rules, and
                system-wide settings for optimal performance.
              </div>
              <div style={{ ...styles.toolStatus, ...styles.statusPending }}>
                Pending
              </div>
            </div>

            <div style={styles.toolCard}>
              <div style={styles.toolIcon}>
                <TrendingUp style={{ width: '24px', height: '24px', color: '#1a1a1a' }} />
              </div>
              <div style={styles.toolTitle}>Performance Monitoring</div>
              <div style={styles.toolDescription}>
                Real-time monitoring of system performance, data processing speeds,
                and statistical calculation accuracy.
              </div>
              <div style={{ ...styles.toolStatus, ...styles.statusActive }}>
                Active
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Games */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>My Assigned Games</h2>
          
          {gamesLoading ? (
            <div style={styles.toolCard}>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ color: '#FFD700', fontSize: '16px', marginBottom: '8px' }}>
                  Loading assigned games...
                </div>
                <div style={{ color: '#888', fontSize: '14px' }}>
                  Fetching your game assignments
                </div>
              </div>
            </div>
          ) : gamesError ? (
            <div style={styles.toolCard}>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ color: '#ff4444', fontSize: '16px', marginBottom: '8px' }}>
                  Error loading games
                </div>
                <div style={{ color: '#888', fontSize: '14px', marginBottom: '16px' }}>
                  {gamesError}
                </div>
                <button
                  onClick={() => {
                    if (user) {
                      setGamesLoading(true);
                      setGamesError(null);
                      GameService.getAssignedGames(user.id)
                        .then(setAssignedGames)
                        .catch((error) => setGamesError(error.message))
                        .finally(() => setGamesLoading(false));
                    }
                  }}
                  style={{
                    background: '#FFD700',
                    color: '#000',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Retry
                </button>
              </div>
            </div>
          ) : assignedGames.length === 0 ? (
            <div style={styles.toolCard}>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={styles.toolIcon}>
                  <Trophy style={{ width: '24px', height: '24px', color: '#1a1a1a' }} />
                </div>
                <div style={{ color: '#888', fontSize: '16px', marginBottom: '8px' }}>
                  No games assigned yet
                </div>
                <div style={{ color: '#666', fontSize: '14px' }}>
                  Tournament organizers will assign games to you. Check back later or contact your organizer.
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.adminTools}>
              {assignedGames.map((game) => (
              <div key={game.id} style={styles.toolCard}>
                <div style={styles.toolIcon}>
                  <Trophy style={{ width: '24px', height: '24px', color: '#1a1a1a' }} />
                </div>
                <div style={styles.toolTitle}>{game.tournamentName}</div>
                <div style={styles.toolDescription}>
                  <strong>{game.teamA}</strong> vs <strong>{game.teamB}</strong><br />
                  {new Date(game.scheduledDate).toLocaleDateString()} at {new Date(game.scheduledDate).toLocaleTimeString()}<br />
                  Venue: {game.venue}
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button
                    onClick={() => router.push(`/stat-tracker?gameId=${game.id}&tournamentId=${game.tournamentId}`)}
                    style={{
                      ...styles.toolStatus,
                      ...styles.statusActive,
                      cursor: 'pointer',
                      border: 'none',
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    <Play size={16} style={{ marginRight: '8px' }} />
                    Start Tracking
                  </button>
                  <div style={{ ...styles.toolStatus, ...styles.statusPending }}>
                    {game.status}
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}
        </div>

        {/* Coming Soon */}
        <div style={styles.comingSoon}>
          <div style={styles.comingSoonIcon}>
            <TrendingUp style={{ width: '32px', height: '32px', color: '#1a1a1a' }} />
          </div>
          <h3 style={styles.comingSoonTitle}>Advanced Stat Admin Features</h3>
          <p style={styles.comingSoonText}>
            Advanced data analytics, machine learning insights, automated reporting,
            and predictive analytics coming soon. Get deeper insights into player
            performance patterns and tournament trends.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatAdminDashboard; 