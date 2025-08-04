'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Trophy, Users, Activity, Award, Calendar, Target } from 'lucide-react';

const PlayerDashboard = () => {
  const { user, userRole, loading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || userRole !== 'player')) {
      router.push('/auth');
    }
  }, [user, userRole, loading, router]);

  if (loading || !user || userRole !== 'player') {
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
          Loading Player Dashboard...
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
    quickActions: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
      marginBottom: '48px',
    },
    actionCard: {
      background: 'rgba(30, 30, 30, 0.8)',
      borderRadius: '16px',
      padding: '24px',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'rgba(255, 215, 0, 0.2)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      textDecoration: 'none',
      color: 'inherit',
    },
    actionCardHover: {
      transform: 'translateY(-2px)',
      borderColor: 'rgba(255, 215, 0, 0.4)',
      boxShadow: '0 12px 24px rgba(0, 0, 0, 0.2)',
    },
    actionIcon: {
      width: '40px',
      height: '40px',
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '16px',
    },
    actionTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: '8px',
    },
    actionDescription: {
      fontSize: '14px',
      color: '#b3b3b3',
      lineHeight: '1.5',
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
          <h1 style={styles.title}>PLAYER DASHBOARD</h1>
          <p style={styles.subtitle}>
            Track your performance, join tournaments, and compete with the best
          </p>
        </div>

        {/* Player Stats */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Your Performance</h2>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <Trophy style={{ width: '24px', height: '24px', color: '#1a1a1a' }} />
              </div>
              <div style={styles.statTitle}>Tournaments Joined</div>
              <div style={styles.statValue}>12</div>
              <div style={styles.statChange}>+3 this month</div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <Award style={{ width: '24px', height: '24px', color: '#1a1a1a' }} />
              </div>
              <div style={styles.statTitle}>Tournaments Won</div>
              <div style={styles.statValue}>4</div>
              <div style={styles.statChange}>+1 this month</div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <Target style={{ width: '24px', height: '24px', color: '#1a1a1a' }} />
              </div>
              <div style={styles.statTitle}>Win Rate</div>
              <div style={styles.statValue}>33%</div>
              <div style={styles.statChange}>+5% improvement</div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <Activity style={{ width: '24px', height: '24px', color: '#1a1a1a' }} />
              </div>
              <div style={styles.statTitle}>Games Played</div>
              <div style={styles.statValue}>48</div>
              <div style={styles.statChange}>+12 this month</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Quick Actions</h2>
          <div style={styles.quickActions}>
            <div style={styles.actionCard}>
              <div style={styles.actionIcon}>
                <Trophy style={{ width: '20px', height: '20px', color: '#1a1a1a' }} />
              </div>
              <div style={styles.actionTitle}>Join Tournament</div>
              <div style={styles.actionDescription}>
                Browse and join available tournaments in your area
              </div>
            </div>

            <div style={styles.actionCard}>
              <div style={styles.actionIcon}>
                <Calendar style={{ width: '20px', height: '20px', color: '#1a1a1a' }} />
              </div>
              <div style={styles.actionTitle}>My Schedule</div>
              <div style={styles.actionDescription}>
                View your upcoming games and tournament schedule
              </div>
            </div>

            <div style={styles.actionCard}>
              <div style={styles.actionIcon}>
                <Users style={{ width: '20px', height: '20px', color: '#1a1a1a' }} />
              </div>
              <div style={styles.actionTitle}>Find Team</div>
              <div style={styles.actionDescription}>
                Connect with other players and form teams
              </div>
            </div>

            <div style={styles.actionCard}>
              <div style={styles.actionIcon}>
                <Target style={{ width: '20px', height: '20px', color: '#1a1a1a' }} />
              </div>
              <div style={styles.actionTitle}>Performance Stats</div>
              <div style={styles.actionDescription}>
                View detailed statistics and performance metrics
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon */}
        <div style={styles.comingSoon}>
          <div style={styles.comingSoonIcon}>
            <Trophy style={{ width: '32px', height: '32px', color: '#1a1a1a' }} />
          </div>
          <h3 style={styles.comingSoonTitle}>Enhanced Player Features</h3>
          <p style={styles.comingSoonText}>
            Advanced statistics tracking, performance analytics, team formation tools, 
            and tournament recommendations coming soon. Get personalized insights 
            to improve your game and climb the rankings.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlayerDashboard; 