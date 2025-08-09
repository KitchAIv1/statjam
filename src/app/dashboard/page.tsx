'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Users, Calendar, Activity, Plus, BarChart3, Eye, ArrowRight, Check, X } from 'lucide-react';
import { useTournaments, useTournamentStats } from '@/lib/hooks/useTournaments';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const DashboardV2 = () => {
  const { user, userRole, loading, initialized } = useAuthStore();
  const { tournaments, loading: tournamentsLoading } = useTournaments();
  const { stats, loading: statsLoading } = useTournamentStats();
  const router = useRouter();
  
  // Debug tournament loading (reduced logging)
  if (tournaments.length > 0) {
    console.log('✅ Tournaments loaded:', tournaments.length);
  }
  
  // Check for success message from tournament creation
  const [showSuccess, setShowSuccess] = useState(false);
  
  useEffect(() => {
    // Check if user just came from tournament creation
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('created') === 'true') {
      setShowSuccess(true);
      // Remove the parameter from URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, []);

  // Handle redirects in useEffect - wait for auth to fully initialize
  useEffect(() => {
    // Only redirect after auth is fully initialized
    if (initialized && !loading && !user) {
      router.push('/auth');
      return;
    }
    
    if (initialized && !loading && user && userRole && userRole !== 'organizer') {
      if (userRole === 'player') {
        router.push('/dashboard/player');
      } else if (userRole === 'stat_admin') {
        router.push('/dashboard/stat-admin');
      }
    }
  }, [initialized, loading, user, userRole, router]);

  // Show loading screen only while auth is initializing
  if (!initialized || loading || !user || !userRole) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--dashboard-bg)',
        color: 'var(--dashboard-text-primary)',
        gap: '32px'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
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
                          borderColor: 'var(--dashboard-primary)',
            borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            Loading Dashboard...
          </div>
          <div style={{
            fontSize: '14px',
            color: '#888',
            textAlign: 'center'
          }}>
            {loading ? 'Initializing...' : !user ? 'No user found' : `Role: ${userRole || 'Unknown'}`}
          </div>
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

  // CLEAN SLATE STYLING - AUTH V2 BRANDING CONSISTENCY
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
    statValue: {
      fontSize: '36px',
      fontWeight: '700',
      color: 'var(--dashboard-text-primary)',
      marginBottom: '8px',
      fontFamily: "'Anton', system-ui, sans-serif",
    },
    statLabel: {
      fontSize: '16px',
      color: 'var(--dashboard-text-secondary)',
      marginBottom: '12px',
      fontWeight: '500',
    },
    statTrend: {
      fontSize: '14px',
      color: '#FFD700',
      fontWeight: '500',
    },
    sectionsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
      gap: '32px',
    },
    section: {
      background: 'var(--dashboard-card)',
      borderRadius: '20px',
      padding: '32px',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'var(--dashboard-border)',
      backdropFilter: 'blur(20px)',
    },
    sectionHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '32px',
    },
    sectionTitle: {
      fontSize: '24px',
      fontWeight: '700',
      color: 'var(--dashboard-text-primary)',
      fontFamily: "'Anton', system-ui, sans-serif",
    },
    quickActionGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '16px',
    },
    quickAction: {
      background: 'rgba(249, 115, 22, 0.1)',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'var(--dashboard-border)',
      borderRadius: '16px',
      padding: '24px',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      textDecoration: 'none',
      color: 'var(--dashboard-text-primary)',
    },
    quickActionHover: {
      background: 'var(--dashboard-gradient)',
      color: 'white',
      transform: 'translateY(-2px)',
      boxShadow: '0 12px 28px rgba(249, 115, 22, 0.3)',
    },
    quickActionIcon: {
      marginBottom: '16px',
    },
    quickActionTitle: {
      fontSize: '16px',
      fontWeight: '600',
      marginBottom: '8px',
    },
    quickActionDesc: {
      fontSize: '14px',
      opacity: 0.8,
      lineHeight: '1.4',
    },
    tournamentsList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    tournamentItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '20px',
      background: 'rgba(249, 115, 22, 0.05)',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'rgba(249, 115, 22, 0.1)',
      borderRadius: '12px',
      transition: 'all 0.2s ease',
    },
    tournamentItemHover: {
      background: 'rgba(249, 115, 22, 0.1)',
      borderColor: 'var(--dashboard-border-hover)',
    },
    tournamentInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
    tournamentIcon: {
      width: '40px',
      height: '40px',
      background: 'var(--dashboard-gradient)',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    tournamentName: {
      fontSize: '16px',
      fontWeight: '600',
      color: 'var(--dashboard-text-primary)',
      marginBottom: '4px',
    },
    tournamentMeta: {
      fontSize: '14px',
      color: 'var(--dashboard-text-secondary)',
    },
    viewButton: {
      background: 'transparent',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'var(--dashboard-border)',
      borderRadius: '8px',
      padding: '8px 16px',
      color: 'var(--dashboard-primary)',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    viewButtonHover: {
      background: 'var(--dashboard-gradient)',
      color: 'white',
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px 20px',
      color: 'var(--dashboard-text-secondary)',
    },
    emptyStateIcon: {
      marginBottom: '16px',
      opacity: 0.5,
    },
    emptyStateTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: 'var(--dashboard-text-primary)',
      marginBottom: '8px',
    },
    emptyStateDesc: {
      fontSize: '14px',
      lineHeight: '1.5',
      marginBottom: '24px',
    },
    primaryButton: {
      background: 'var(--dashboard-gradient)',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      padding: '12px 24px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
    },
    primaryButtonHover: {
      transform: 'translateY(-1px)',
      boxShadow: '0 8px 20px rgba(249, 115, 22, 0.4)',
    },
  };

  const quickActions = [
    {
      title: 'Create Tournament',
      description: 'Start a new tournament',
      icon: <Plus style={{ width: '24px', height: '24px' }} />,
      action: () => router.push('/dashboard/create-tournament'),
    },
    {
      title: 'Manage Teams',
      description: 'Add and organize teams',
      icon: <Users style={{ width: '24px', height: '24px' }} />,
      action: () => console.log('Manage teams'),
    },
    {
      title: 'View Analytics',
      description: 'Performance insights',
      icon: <BarChart3 style={{ width: '24px', height: '24px' }} />,
      action: () => console.log('View analytics'),
    },
  ];

  const statsData = [
    {
      label: 'Active Tournaments',
      value: stats.activeTournaments.toString(),
      trend: '+1 this month',
      icon: <Trophy style={{ width: '24px', height: '24px', color: '#1a1a1a' }} />,
    },
    {
      label: 'Total Teams',
      value: stats.totalTeams.toString(),
      trend: '+6 this week',
      icon: <Users style={{ width: '24px', height: '24px', color: '#1a1a1a' }} />,
    },
    {
      label: 'Prize Pool',
      value: `$${stats.totalPrizePool.toLocaleString()}`,
      trend: 'Total rewards',
      icon: <Activity style={{ width: '24px', height: '24px', color: '#1a1a1a' }} />,
    },
  ];

  return (
    <div style={styles.container}>
      {/* Success Notification */}
      {showSuccess && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
          color: '#1a1a1a',
          padding: '16px 24px',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0, 255, 136, 0.3)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'slideInRight 0.3s ease-out'
        }}>
          <Check style={{ width: '20px', height: '20px' }} />
          <div>
            <div style={{ fontWeight: '600', fontSize: '14px' }}>Tournament Created!</div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>Your tournament has been saved successfully.</div>
          </div>
          <button
            onClick={() => setShowSuccess(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#1a1a1a',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              marginLeft: '8px'
            }}
          >
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      )}
      
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
      
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px'
          }}>
            <div>
              <h1 style={styles.title}>TOURNAMENT COMMAND CENTER</h1>
              <p style={styles.subtitle}>
                Manage your tournaments, teams, and players with professional-grade tools
              </p>
            </div>
            <button
              onClick={async () => {
                try {
                  await supabase.auth.signOut();
                  router.push('/auth');
                } catch (error) {
                  console.error('Sign out error:', error);
                }
              }}
              style={{
                background: 'rgba(255, 0, 0, 0.1)',
                border: '1px solid rgba(255, 0, 0, 0.3)',
                borderRadius: '8px',
                padding: '12px 20px',
                color: '#ff6b6b',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 0, 0, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(255, 0, 0, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 0, 0, 0.3)';
              }}
            >
              <X style={{ width: '16px', height: '16px' }} />
              Sign Out
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={styles.statsGrid}>
          {statsData.map((stat, index) => (
            <div
              key={index}
              style={styles.statCard}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.statCardHover)}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.statCard)}
            >
              <div style={styles.statIcon}>
                {stat.icon}
              </div>
              <div style={styles.statValue}>{stat.value}</div>
              <div style={styles.statLabel}>{stat.label}</div>
              <div style={styles.statTrend}>{stat.trend}</div>
            </div>
          ))}
        </div>

        {/* Sections Grid */}
        <div style={styles.sectionsGrid}>
          {/* Quick Actions */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>QUICK ACTIONS</h2>
            </div>
            <div style={styles.quickActionGrid}>
              {quickActions.map((action, index) => (
                <div
                  key={index}
                  style={styles.quickAction}
                  onClick={action.action}
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.quickActionHover)}
                  onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.quickAction)}
                >
                  <div style={styles.quickActionIcon}>
                    {action.icon}
                  </div>
                  <div style={styles.quickActionTitle}>{action.title}</div>
                  <div style={styles.quickActionDesc}>{action.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Tournaments */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>RECENT TOURNAMENTS</h2>
              <button
                style={styles.viewButton}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.viewButtonHover)}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.viewButton)}
                onClick={() => router.push('/dashboard/tournaments')}
              >
                View All
                <ArrowRight style={{ width: '14px', height: '14px' }} />
              </button>
            </div>
            
            <div style={styles.tournamentsList}>
              {tournaments.length > 0 ? (
                tournaments.slice(0, 4).map((tournament) => (
                  <div
                    key={tournament.id}
                    style={styles.tournamentItem}
                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.tournamentItemHover)}
                    onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.tournamentItem)}
                  >
                    <div style={styles.tournamentInfo}>
                      <div style={styles.tournamentIcon}>
                        <Trophy style={{ width: '20px', height: '20px', color: '#1a1a1a' }} />
                      </div>
                      <div>
                        <div style={styles.tournamentName}>{tournament.name}</div>
                        <div style={styles.tournamentMeta}>
                          {tournament.currentTeams}/{tournament.maxTeams} teams • {tournament.venue}
                        </div>
                      </div>
                    </div>
                    <button
                      style={styles.viewButton}
                      onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.viewButtonHover)}
                      onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.viewButton)}
                      onClick={() => router.push(`/dashboard/tournaments/${tournament.id}`)}
                    >
                      <Eye style={{ width: '14px', height: '14px' }} />
                      View
                    </button>
                  </div>
                ))
              ) : (
                <div style={styles.emptyState}>
                  <div style={styles.emptyStateIcon}>
                    <Trophy style={{ width: '48px', height: '48px' }} />
                  </div>
                  <div style={styles.emptyStateTitle}>No tournaments yet</div>
                  <div style={styles.emptyStateDesc}>
                    Create your first tournament to get started with StatJam
                  </div>
                  <button
                    style={styles.primaryButton}
                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.primaryButtonHover)}
                    onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.primaryButton)}
                    onClick={() => router.push('/dashboard/create-tournament')}
                  >
                    <Plus style={{ width: '16px', height: '16px' }} />
                    Create Tournament
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardV2;