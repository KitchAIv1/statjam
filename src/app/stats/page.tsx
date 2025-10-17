'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthV2 } from '@/hooks/useAuthV2';
import { Trophy, Users, TrendingUp, Activity } from 'lucide-react';

const StatsPage = () => {
  const { user, loading } = useAuthV2();
  const userRole = user?.role;
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || userRole !== 'stat_admin')) {
      router.push('/auth');
    }
  }, [user, userRole, loading, router]);

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
          Loading Stats Dashboard...
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
          <h1 style={styles.title}>STATISTICS DASHBOARD</h1>
          <p style={styles.subtitle}>
            Comprehensive analytics and insights for tournament performance tracking
          </p>
        </div>

        {/* Stats Overview */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Overview</h2>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <Trophy style={{ width: '24px', height: '24px', color: '#1a1a1a' }} />
              </div>
              <div style={styles.statTitle}>Active Tournaments</div>
              <div style={styles.statValue}>24</div>
              <div style={styles.statChange}>+12% from last month</div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <Users style={{ width: '24px', height: '24px', color: '#1a1a1a' }} />
              </div>
              <div style={styles.statTitle}>Total Players</div>
              <div style={styles.statValue}>1,247</div>
              <div style={styles.statChange}>+8% from last month</div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <Activity style={{ width: '24px', height: '24px', color: '#1a1a1a' }} />
              </div>
              <div style={styles.statTitle}>Live Games</div>
              <div style={styles.statValue}>8</div>
              <div style={styles.statChange}>+3 from yesterday</div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <TrendingUp style={{ width: '24px', height: '24px', color: '#1a1a1a' }} />
              </div>
              <div style={styles.statTitle}>Stats Recorded</div>
              <div style={styles.statValue}>45K+</div>
              <div style={styles.statChange}>+15% from last week</div>
            </div>
          </div>
        </div>

        {/* Advanced Analytics - Coming Soon */}
        <div style={styles.section}>
          <div style={styles.comingSoon}>
            <div style={styles.comingSoonIcon}>
              <TrendingUp style={{ width: '32px', height: '32px', color: '#1a1a1a' }} />
            </div>
            <h3 style={styles.comingSoonTitle}>Advanced Analytics</h3>
            <p style={styles.comingSoonText}>
              Detailed performance metrics, player statistics, tournament analytics, 
              and real-time data visualization coming soon. This will include 
              comprehensive reporting tools for tournament organizers and detailed 
              insights for players.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPage; 