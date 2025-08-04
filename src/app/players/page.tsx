'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Users, Search, Filter } from 'lucide-react';

const PlayersPage = () => {
  const { user, userRole, loading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  if (loading || !user) {
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
          Loading Players...
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
    searchSection: {
      background: 'rgba(30, 30, 30, 0.8)',
      borderRadius: '20px',
      padding: '32px',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'rgba(255, 215, 0, 0.2)',
      marginBottom: '32px',
    },
    searchTitle: {
      fontSize: '24px',
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: '24px',
    },
    searchBar: {
      display: 'flex',
      gap: '16px',
      alignItems: 'center',
    },
    searchInput: {
      flex: '1',
      padding: '16px 20px',
      borderWidth: '2px',
      borderStyle: 'solid',
      borderColor: '#4a4a4a',
      borderRadius: '12px',
      background: '#2a2a2a',
      color: '#ffffff',
      fontSize: '16px',
      outline: 'none',
    },
    searchButton: {
      padding: '16px 24px',
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      color: '#1a1a1a',
      borderWidth: '0',
      borderStyle: 'none',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    filterButton: {
      padding: '16px 20px',
      background: 'transparent',
      color: '#ffffff',
      borderWidth: '2px',
      borderStyle: 'solid',
      borderColor: 'rgba(255, 215, 0, 0.3)',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
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
          <h1 style={styles.title}>PLAYERS DIRECTORY</h1>
          <p style={styles.subtitle}>
            Discover and connect with players from tournaments around the world
          </p>
        </div>

        {/* Search Section */}
        <div style={styles.searchSection}>
          <h2 style={styles.searchTitle}>Find Players</h2>
          <div style={styles.searchBar}>
            <input
              type="text"
              placeholder="Search by name, location, or tournament..."
              style={styles.searchInput}
            />
            <button style={styles.searchButton}>
              <Search style={{ width: '20px', height: '20px' }} />
              Search
            </button>
            <button style={styles.filterButton}>
              <Filter style={{ width: '20px', height: '20px' }} />
              Filters
            </button>
          </div>
        </div>

        {/* Coming Soon */}
        <div style={styles.comingSoon}>
          <div style={styles.comingSoonIcon}>
            <Users style={{ width: '32px', height: '32px', color: '#1a1a1a' }} />
          </div>
          <h3 style={styles.comingSoonTitle}>Player Directory</h3>
          <p style={styles.comingSoonText}>
            Comprehensive player profiles, statistics, tournament history, and 
            performance metrics coming soon. Connect with players, view their 
            achievements, and discover new talent in the basketball community.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlayersPage; 