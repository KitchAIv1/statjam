'use client';

import React, { use, useEffect } from 'react';
import { useGameViewerV2 } from '@/hooks/useGameViewerV2';
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
  
  // ✅ ENTERPRISE SOLUTION: Use V2 raw fetch (Supabase client is broken)
  const { game: gameV2, stats: statsV2, plays: playsV2, loading: loadingV2, error: errorV2 } = useGameViewerV2(gameId);

  // Use V2 data directly
  const actualGame = gameV2;
  const actualLoading = loadingV2;
  const actualError = errorV2;

  // Clean V2-only implementation

  if (actualLoading) {
    return (
      <div className="container mx-auto px-4">
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner} />
          <div style={styles.loadingText}>Loading Game...</div>
        </div>
      </div>
    );
  }

  if (actualError) {
    return (
      <div className="container mx-auto px-4">
        <div style={styles.errorContainer}>
          <div style={styles.errorText}>⚠️ {actualError}</div>
          <div style={styles.errorSubtext}>
            Please check the game ID and try again
          </div>
        </div>
      </div>
    );
  }

  if (!actualGame) {
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
          ...actualGame,
          // Map V2 field names to expected format
          teamAName: actualGame.team_a_name || 'Team A',
          teamBName: actualGame.team_b_name || 'Team B',
          homeScore: actualGame.home_score || 0,
          awayScore: actualGame.away_score || 0,
          status: actualGame.status || 'Unknown',
          quarter: actualGame.quarter || 1,
        }}
        isLive={actualGame.status?.toLowerCase().includes('live') || actualGame.status?.toLowerCase().includes('progress')}
        lastUpdated={actualGame.updated_at || ''}
        isMobile={false}
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
              {actualGame.team_a_name || 'Team A'}
            </TabsTrigger>
            <TabsTrigger value="teamB" className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-400 rounded-none py-3 text-white">
              {actualGame.team_b_name || 'Team B'}
            </TabsTrigger>
          </TabsList>

              {/* Feed Tab - NBA-Level Play-by-Play */}
              <TabsContent value="feed" className="mt-0">
                <PlayByPlayFeed
                  playByPlay={playsV2 || []}
                  game={{
                    teamAName: actualGame?.team_a_name || 'Team A',
                    teamBName: actualGame?.team_b_name || 'Team B',
                    homeScore: actualGame?.home_score || 0,
                    awayScore: actualGame?.away_score || 0
                  }}
                  isLive={actualGame?.status?.toLowerCase().includes('live') || actualGame?.status?.toLowerCase().includes('in_progress') || false}
                  isMobile={false}
                />
              </TabsContent>

          {/* Game Tab (real data from hook) */}
          <TabsContent value="game" className="mt-0">
            <div style={styles.gameSummarySection}>
              <div style={styles.gameSummaryCard}>
                <div style={styles.gameSummaryHeader}>Game Summary</div>
                <div style={styles.gameSummaryRow}>
                  <div style={styles.gameSummaryTeam}>{actualGame.team_a_name || 'Team A'}</div>
                  <div style={styles.gameSummaryScore}>
                    {actualGame.home_score || 0}
                  </div>
                </div>
                <div style={styles.gameSummaryRow}>
                  <div style={styles.gameSummaryTeam}>{actualGame.team_b_name || 'Team B'}</div>
                  <div style={styles.gameSummaryScore}>
                    {actualGame.away_score || 0}
                  </div>
                </div>
                <div style={styles.gameSummaryMeta}>
                  <span>Status: {actualGame.status}</span>
                  <span>Quarter: {actualGame.quarter}</span>
                  <span>Time: {String(actualGame.game_clock_minutes || 0).padStart(2, '0')}:{String(actualGame.game_clock_seconds || 0).padStart(2, '0')}</span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Team A Tab (placeholder for real roster; logic stays in hooks/services) */}
          <TabsContent value="teamA" className="mt-0">
            <div style={styles.teamSection}>
              <div style={styles.teamHeader}>{actualGame.team_a_name || 'Team A'}</div>
              <div style={styles.teamPlaceholder}>Team roster and stats coming soon.</div>
            </div>
          </TabsContent>

          {/* Team B Tab (placeholder for real roster; logic stays in hooks/services) */}
          <TabsContent value="teamB" className="mt-0">
            <div style={styles.teamSection}>
              <div style={styles.teamHeader}>{actualGame.team_b_name || 'Team B'}</div>
              <div style={styles.teamPlaceholder}>Team roster and stats coming soon.</div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Live Indicator */}
      {(actualGame.status?.toLowerCase().includes('live') || actualGame.status?.toLowerCase().includes('progress')) && (
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