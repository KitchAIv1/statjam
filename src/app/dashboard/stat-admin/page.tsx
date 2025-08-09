'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { GameService } from '@/lib/services/gameService';
import { TeamService } from '@/lib/services/tournamentService';
import { NavigationHeader } from '@/components/NavigationHeader';
import { TrendingUp, Database, BarChart3, Settings, Users, Activity, Play, Clock, Trophy, Zap } from 'lucide-react';

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
      background: 'var(--dashboard-bg)',
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
      background: 'var(--dashboard-gradient)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      fontFamily: "'Anton', system-ui, sans-serif",
      marginBottom: '16px',
      letterSpacing: '1px',
    },
    subtitle: {
      fontSize: '18px',
      color: 'var(--dashboard-text-secondary)',
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
      background: 'var(--dashboard-card)',
      borderRadius: '20px',
      padding: '32px',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'var(--dashboard-border)',
      backdropFilter: 'blur(20px)',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden',
    },
    statCardHover: {
      transform: 'translateY(-4px)',
      borderColor: 'var(--dashboard-border-hover)',
      boxShadow: '0 20px 40px rgba(249, 115, 22, 0.1)',
    },
    statIcon: {
      width: '56px',
      height: '56px',
      background: 'var(--dashboard-gradient)',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '24px',
      boxShadow: '0 8px 24px rgba(249, 115, 22, 0.3)',
    },
    statTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: 'var(--dashboard-text-secondary)',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: '8px',
    },
    statValue: {
      fontSize: '36px',
      fontWeight: '700',
      color: 'var(--dashboard-text-primary)',
      marginBottom: '8px',
      fontFamily: "'Anton', system-ui, sans-serif",
    },
    statChange: {
      fontSize: '14px',
      color: 'var(--dashboard-primary)',
      fontWeight: '500',
    },
    section: {
      marginBottom: '48px',
    },
    sectionTitle: {
      fontSize: '24px',
      fontWeight: '600',
      color: 'var(--dashboard-text-primary)',
      marginBottom: '24px',
    },
    adminTools: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '24px',
      marginBottom: '48px',
    },
    toolCard: {
      background: 'var(--dashboard-card)',
      borderRadius: '16px',
      padding: '32px',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'var(--dashboard-border)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    toolCardHover: {
      transform: 'translateY(-2px)',
      borderColor: 'var(--dashboard-border-hover)',
      boxShadow: '0 12px 24px rgba(249, 115, 22, 0.1)',
    },
    toolIcon: {
      width: '56px',
      height: '56px',
      background: 'var(--dashboard-gradient)',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '24px',
      boxShadow: '0 8px 24px rgba(249, 115, 22, 0.3)',
    },
    toolTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: 'var(--dashboard-text-primary)',
      marginBottom: '12px',
    },
    toolDescription: {
      fontSize: '14px',
      color: 'var(--dashboard-text-secondary)',
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
      background: 'rgba(34, 197, 94, 0.2)',
      color: '#22c55e',
    },
    statusPending: {
      background: 'rgba(249, 115, 22, 0.2)',
      color: 'var(--dashboard-primary)',
    },
    comingSoon: {
      background: 'var(--dashboard-card)',
      borderRadius: '20px',
      padding: '48px',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'var(--dashboard-border)',
      textAlign: 'center',
    },
    comingSoonIcon: {
      width: '64px',
      height: '64px',
      background: 'var(--dashboard-gradient)',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 24px',
      boxShadow: '0 8px 24px rgba(249, 115, 22, 0.3)',
    },
    comingSoonTitle: {
      fontSize: '24px',
      fontWeight: '600',
      color: 'var(--dashboard-text-primary)',
      marginBottom: '12px',
    },
    comingSoonText: {
      fontSize: '16px',
      color: 'var(--dashboard-text-secondary)',
      lineHeight: '1.6',
    },
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--dashboard-bg)' }}>
      <NavigationHeader />
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
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => router.push(`/stat-tracker-v3?gameId=${game.id}&teamAId=${game.teamAId}&teamBId=${game.teamBId}`)}
                    style={{
                      background: 'var(--dashboard-gradient)',
                      color: '#1a1a1a',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 16px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(249, 115, 22, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(249, 115, 22, 0.3)';
                    }}
                  >
                    <Zap size={16} />
                    Launch V3 Tracker
                  </button>
                  <button
                    onClick={() => router.push(`/stat-tracker?gameId=${game.id}&tournamentId=${game.tournamentId}`)}
                    style={{
                      background: 'var(--dashboard-card)',
                      color: 'var(--dashboard-text-secondary)',
                      border: `1px solid var(--dashboard-border)`,
                      borderRadius: '8px',
                      padding: '10px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--dashboard-border-hover)';
                      e.currentTarget.style.color = 'var(--dashboard-text-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--dashboard-border)';
                      e.currentTarget.style.color = 'var(--dashboard-text-secondary)';
                    }}
                  >
                    <Play size={16} />
                    Legacy Tracker
                  </button>
                  <div style={{ 
                    ...styles.toolStatus, 
                    ...styles.statusPending,
                    alignSelf: 'center'
                  }}>
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
    </div>
  );
};

export default StatAdminDashboard; 