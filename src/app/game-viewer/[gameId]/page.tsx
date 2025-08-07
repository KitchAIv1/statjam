'use client';

import React, { use, useEffect } from 'react';
import { useGameStream } from '@/hooks/useGameStream';
import { useAuthStore } from '@/store/authStore';
import GameHeader from './components/GameHeader';
import PlayByPlayFeed from './components/PlayByPlayFeed';
import TabNavigation from './components/TabNavigation';

interface GameViewerPageProps {
  params: Promise<{ gameId: string }>;
}

/**
 * NBA-Style Game Viewer
 * 
 * Real-time play-by-play viewer for live games.
 * Inspired by NBA.com live game feeds with premium design.
 * 
 * Features:
 * - Live score updates
 * - Real-time play-by-play feed  
 * - NBA-style premium UI
 * - Team branding integration
 * - Social engagement ready
 */
const GameViewerPage: React.FC<GameViewerPageProps> = ({ params }) => {
  const { gameId } = use(params);
  const { user, initialized, loading: authLoading } = useAuthStore();
  const { gameData, loading, error, isLive } = useGameStream(gameId);

  // Initialize auth store
  useEffect(() => {
    console.log('🔧 GameViewer: Auth state:', {
      user: !!user,
      initialized,
      authLoading
    });
  }, [user, initialized, authLoading]);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner} />
          <div style={styles.loadingText}>Loading Game...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <div style={styles.errorText}>⚠️ {error}</div>
          <div style={styles.errorSubtext}>
            Please check the game ID and try again
          </div>
        </div>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <div style={styles.errorText}>Game Not Found</div>
          <div style={styles.errorSubtext}>
            The requested game could not be loaded
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Game Header - Score, Teams, Status */}
      <GameHeader 
        game={gameData.game}
        isLive={isLive}
        lastUpdated={gameData.lastUpdated}
      />

      {/* Tab Navigation - Feed, Game, Stats */}
      <TabNavigation activeTab="Feed" />

      {/* Main Content - Play by Play Feed */}
      <div style={styles.content}>
        <PlayByPlayFeed 
          playByPlay={gameData.playByPlay}
          game={gameData.game}
          isLive={isLive}
        />
      </div>

      {/* Live Indicator */}
      {isLive && (
        <div style={styles.liveIndicator}>
          <div style={styles.liveDot} />
          <span style={styles.liveText}>LIVE</span>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#121212',
    color: '#ffffff',
    fontFamily: 'Poppins, system-ui, sans-serif'
  },
  content: {
    paddingBottom: '60px' // Space for live indicator
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    gap: '20px'
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #333',
    borderTop: '3px solid #FFD700',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    fontSize: '18px',
    fontWeight: '500',
    color: '#b3b3b3'
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    padding: '20px',
    textAlign: 'center' as const
  },
  errorText: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#ff4444',
    marginBottom: '12px'
  },
  errorSubtext: {
    fontSize: '16px',
    color: '#b3b3b3',
    lineHeight: '1.5'
  },
  liveIndicator: {
    position: 'fixed' as const,
    bottom: '20px',
    right: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#ff0000',
    padding: '8px 16px',
    borderRadius: '20px',
    boxShadow: '0 4px 12px rgba(255, 0, 0, 0.3)',
    zIndex: 1000
  },
  liveDot: {
    width: '8px',
    height: '8px',
    background: '#ffffff',
    borderRadius: '50%',
    animation: 'pulse 2s infinite'
  },
  liveText: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#ffffff'
  }
};

// Add CSS animations
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `;
  document.head.appendChild(style);
}

export default GameViewerPage;