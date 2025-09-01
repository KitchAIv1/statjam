'use client';

import React, { use, useEffect, useState } from 'react';
import { useGameViewerData } from '@/hooks/useGameViewerData';
import ResponsiveContainer from '@/components/layout/ResponsiveContainer';
import GameHeader from './components/GameHeader';
import PlayByPlayFeed from './components/PlayByPlayFeed';
import { figmaColors, figmaTypography } from '@/lib/design/figmaTokens';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


interface GameViewerPageProps {
  params: Promise<{ gameId: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
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
 * - Mobile-responsive design
 * - Social engagement ready
 */
const GameViewerPage: React.FC<GameViewerPageProps> = ({ params }) => {
  const { gameId } = use(params);
  
  // Use unified game viewer data hook
  const {
    gameData,
    loading,
    error,
    isLive,
    user,
    initialized,
    authLoading,
    isMobile,
    isTablet,
    isDesktop,
    enableViewerV2,
    playerStatsMap,
    calculatePlayerStats,
    calculatePlayerPoints,
    v2Data
  } = useGameViewerData(gameId);

  // V1 always provides game data now, V2 just provides better stats/feed

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
      <div className="container mx-auto px-4">
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner} />
          <div style={styles.loadingText}>Loading Game...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4">
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
      <div className="container mx-auto px-4">
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
    <ResponsiveContainer>
      {/* Game Header - Score, Teams, Status */}
      <GameHeader 
        game={{
          ...gameData?.game,
          // Use V2 scores when available (real-time), fallback to V1 scores
          homeScore: enableViewerV2 && v2Data ? v2Data.homeScore : gameData?.game?.homeScore,
          awayScore: enableViewerV2 && v2Data ? v2Data.awayScore : gameData?.game?.awayScore,
        }}
        isLive={isLive}
        lastUpdated={gameData?.lastUpdated || ''}
        isMobile={isMobile}
      />

      {/* Tabs: Feed / Game / Teams */}
      <div style={styles.tabsContainer}>
        <Tabs defaultValue="feed" className="w-full">
          <TabsList className="w-full bg-gray-800 border-b border-gray-700 rounded-none h-auto p-0">
            <TabsTrigger value="feed" className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-400 rounded-none py-3 text-white">
              Feed
            </TabsTrigger>
            <TabsTrigger value="game" className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-400 rounded-none py-3 text-white">
              Game
            </TabsTrigger>
            <TabsTrigger value="teamA" className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-400 rounded-none py-3 text-white">
              {gameData.game.teamAName}
            </TabsTrigger>
            <TabsTrigger value="teamB" className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-400 rounded-none py-3 text-white">
              {gameData.game.teamBName}
            </TabsTrigger>
          </TabsList>

          {/* Feed Tab */}
          <TabsContent value="feed" className="mt-0">
            <div style={styles.playByPlayContainer}>
              {enableViewerV2 && v2Data ? (
                <PlayByPlayFeed
                  playByPlay={v2Data.plays}
                  game={{
                    teamAName: v2Data.teamMap.teamAName,
                    teamBName: v2Data.teamMap.teamBName,
                    homeScore: v2Data.homeScore,
                    awayScore: v2Data.awayScore,
                  }}
                  isLive={isLive}
                  isMobile={isMobile}
                  calculatePlayerStats={calculatePlayerStats}
                  calculatePlayerPoints={calculatePlayerPoints}
                />
              ) : (
                gameData && (
                  <PlayByPlayFeed 
                    playByPlay={gameData.playByPlay}
                    game={gameData.game}
                    isLive={isLive}
                    isMobile={isMobile}
                    calculatePlayerStats={calculatePlayerStats}
                    calculatePlayerPoints={calculatePlayerPoints}
                  />
                )
              )}
            </div>
          </TabsContent>

          {/* Game Tab (real data from hook) */}
          <TabsContent value="game" className="mt-0">
            <div style={styles.gameSummarySection}>
              <div style={styles.gameSummaryCard}>
                <div style={styles.gameSummaryHeader}>Game Summary</div>
                <div style={styles.gameSummaryRow}>
                  <div style={styles.gameSummaryTeam}>{gameData.game.teamAName}</div>
                  <div style={styles.gameSummaryScore}>
                    {enableViewerV2 && v2Data ? v2Data.homeScore : gameData.game.homeScore}
                  </div>
                </div>
                <div style={styles.gameSummaryRow}>
                  <div style={styles.gameSummaryTeam}>{gameData.game.teamBName}</div>
                  <div style={styles.gameSummaryScore}>
                    {enableViewerV2 && v2Data ? v2Data.awayScore : gameData.game.awayScore}
                  </div>
                </div>
                <div style={styles.gameSummaryMeta}>
                  <span>Status: {gameData.game.status}</span>
                  <span>Quarter: {gameData.game.quarter}</span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Team A Tab (placeholder for real roster; logic stays in hooks/services) */}
          <TabsContent value="teamA" className="mt-0">
            <div style={styles.teamSection}>
              <div style={styles.teamHeader}>{gameData.game.teamAName}</div>
              <div style={styles.teamPlaceholder}>Team roster and stats coming soon.</div>
            </div>
          </TabsContent>

          {/* Team B Tab (placeholder for real roster; logic stays in hooks/services) */}
          <TabsContent value="teamB" className="mt-0">
            <div style={styles.teamSection}>
              <div style={styles.teamHeader}>{gameData.game.teamBName}</div>
              <div style={styles.teamPlaceholder}>Team roster and stats coming soon.</div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Live Indicator */}
      {isLive && (
        <div style={styles.liveIndicator}>
          <div style={styles.liveDot} />
          <span style={styles.liveText}>LIVE</span>
        </div>
      )}
    </ResponsiveContainer>
  );
};



const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: figmaColors.primary,
    color: figmaColors.text.primary,
    fontFamily: figmaTypography.fontFamily.primary
  },
  content: {
    paddingBottom: '60px' // Space for live indicator
  },
  playByPlayContainer: {
    padding: '0',
    paddingBottom: '80px' // Space for live indicator
  },
  tabsContainer: {
    backgroundColor: figmaColors.secondary,
    borderBottom: `1px solid ${figmaColors.border.primary}`,
  },
  gameSummarySection: {
    padding: '16px',
  },
  gameSummaryCard: {
    backgroundColor: figmaColors.secondary,
    border: `1px solid ${figmaColors.border.primary}`,
    borderRadius: '8px',
    padding: '16px',
    maxWidth: '640px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  gameSummaryHeader: {
    fontSize: '16px',
    fontWeight: 700,
  },
  gameSummaryRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gameSummaryTeam: {
    fontSize: '14px',
    color: '#d1d5db',
  },
  gameSummaryScore: {
    fontSize: '20px',
    fontWeight: 800,
  },
  gameSummaryMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    fontSize: '12px',
    color: '#9ca3af',
  },
  teamSection: {
    padding: '16px',
  },
  teamHeader: {
    fontSize: '16px',
    fontWeight: 700,
    marginBottom: '8px',
  },
  teamPlaceholder: {
    fontSize: '14px',
    color: '#9ca3af',
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