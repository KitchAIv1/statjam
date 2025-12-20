'use client';

import React, { useState } from 'react';
import { PlayCircle, Users, Clock, Trophy } from 'lucide-react';
import { Button } from "@/components/ui/Button";
import { CoachTeam } from '@/lib/types/coach';
import { CoachQuickTrackModal } from './CoachQuickTrackModal';
import { UpgradeModal } from '@/components/subscription';
import { useSubscription } from '@/hooks/useSubscription';

interface CoachQuickTrackSectionProps {
  teams: CoachTeam[];
  loading: boolean;
  error: string | null;
}

/**
 * CoachQuickTrackSection - Quick track game section
 * 
 * Features:
 * - Team selection for quick tracking
 * - Recent games display
 * - Quick launch functionality
 * - Empty state handling
 * 
 * Follows .cursorrules: <200 lines, UI component only
 */
export function CoachQuickTrackSection({ teams, loading, error }: CoachQuickTrackSectionProps) {
  // State
  const [selectedTeam, setSelectedTeam] = useState<CoachTeam | null>(null);
  const [showQuickTrack, setShowQuickTrack] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Subscription gatekeeping
  const { tier: subscriptionTier } = useSubscription('coach');
  const FREE_GAME_LIMIT = 6;
  
  // Calculate total games tracked across all teams
  const totalGamesTracked = teams.reduce((sum, team) => sum + (team.games_count || 0), 0);

  // Handle team selection and quick track with subscription check
  const handleQuickTrack = (team: CoachTeam) => {
    const isFreeTier = subscriptionTier === 'free';
    const atLimit = isFreeTier && totalGamesTracked >= FREE_GAME_LIMIT;
    
    if (atLimit) {
      setShowUpgradeModal(true);
    } else {
      setSelectedTeam(team);
      setShowQuickTrack(true);
    }
  };

  // Handle game created
  const handleGameCreated = () => {
    setShowQuickTrack(false);
    setSelectedTeam(null);
  };

  // Styles
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '24px'
    },
    header: {
      textAlign: 'center' as const,
      marginBottom: '32px'
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: '600',
      color: '#18181b', // Dark text for light background
      marginBottom: '8px'
    },
    subtitle: {
      fontSize: '1rem',
      color: '#a1a1aa',
      maxWidth: '600px',
      margin: '0 auto'
    },
    teamsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '20px'
    },
    teamCard: {
      background: 'rgba(255, 255, 255, 0.8)', // More opaque white background
      border: '1px solid rgba(0, 0, 0, 0.1)', // Darker border for contrast
      borderRadius: '12px',
      padding: '20px',
      backdropFilter: 'blur(10px)',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    },
    teamCardHover: {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 32px rgba(249, 115, 22, 0.2)',
      borderColor: 'rgba(249, 115, 22, 0.3)'
    },
    teamName: {
      fontSize: '1.125rem',
      fontWeight: '600',
      color: '#18181b', // Dark text for light background
      marginBottom: '8px'
    },
    teamMeta: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '16px',
      fontSize: '0.875rem',
      color: '#a1a1aa'
    },
    metaItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    quickTrackButton: {
      width: '100%',
      background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
      border: 'none',
      color: '#ffffff',
      fontWeight: '600'
    },
    emptyState: {
      textAlign: 'center' as const,
      padding: '60px 20px',
      background: 'rgba(255, 255, 255, 0.8)', // More opaque white background
      border: '1px solid rgba(0, 0, 0, 0.1)', // Darker border for contrast
      borderRadius: '12px',
      backdropFilter: 'blur(10px)'
    },
    emptyIcon: {
      width: '64px',
      height: '64px',
      margin: '0 auto 24px',
      color: '#6b7280'
    },
    emptyTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: '#18181b', // Dark text for light background
      marginBottom: '8px'
    },
    emptyDesc: {
      fontSize: '1rem',
      color: '#a1a1aa',
      marginBottom: '24px',
      maxWidth: '400px',
      margin: '0 auto 24px'
    }
  };

  // Error state
  if (error) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>⚠️</div>
        <div style={styles.emptyTitle}>Error Loading Teams</div>
        <div style={styles.emptyDesc}>{error}</div>
      </div>
    );
  }

  return (
    <>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Quick Track Game</h2>
          <p style={styles.subtitle}>
            Select a team to start tracking a non-tournament game. 
            Perfect for practice games, scrimmages, or local league matches.
          </p>
        </div>

        {/* Teams Selection */}
        {loading ? (
          <div style={styles.teamsGrid}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{
                ...styles.teamCard,
                height: '150px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '3px solid #333',
                  borderTop: '3px solid #f97316',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              </div>
            ))}
          </div>
        ) : teams.length > 0 ? (
          <div style={styles.teamsGrid}>
            {teams.map((team) => (
              <div
                key={team.id}
                style={styles.teamCard}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.teamCardHover)}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0px)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <div style={styles.teamName}>{team.name}</div>
                
                <div style={styles.teamMeta}>
                  <div style={styles.metaItem}>
                    <Users className="w-4 h-4" />
                    <span>{team.player_count || 0} players</span>
                  </div>
                  
                  <div style={styles.metaItem}>
                    <Trophy className="w-4 h-4" />
                    <span>{team.games_count || 0} games</span>
                  </div>
                </div>

                <Button
                  onClick={() => handleQuickTrack(team)}
                  style={styles.quickTrackButton}
                  className="gap-2"
                >
                  <PlayCircle className="w-4 h-4" />
                  Start Tracking
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <Users style={styles.emptyIcon} />
            <div style={styles.emptyTitle}>No teams available</div>
            <div style={styles.emptyDesc}>
              Create a team first before you can start tracking games
            </div>
            <Button
              onClick={() => window.location.href = '/dashboard/coach?section=teams'}
              className="gap-2"
            >
              <Users className="w-4 h-4" />
              Create Team
            </Button>
          </div>
        )}

        {/* Recent Games Section */}
        {teams.length > 0 && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '24px',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#ffffff',
              marginBottom: '16px'
            }}>
              Recent Games
            </h3>
            
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#a1a1aa'
            }}>
              <Clock style={{ width: '48px', height: '48px', margin: '0 auto 16px' }} />
              <p>Your recent games will appear here</p>
              <p style={{ fontSize: '0.875rem', marginTop: '8px' }}>
                Start tracking games to build your game history
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Track Modal */}
      {showQuickTrack && selectedTeam && (
        <CoachQuickTrackModal
          team={selectedTeam}
          onClose={() => {
            setShowQuickTrack(false);
            setSelectedTeam(null);
          }}
          onGameCreated={handleGameCreated}
        />
      )}

      {/* Subscription Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        role="coach"
        currentTier={subscriptionTier}
        triggerReason={`You've tracked ${totalGamesTracked} games. Free tier allows ${FREE_GAME_LIMIT} games. Upgrade for unlimited.`}
      />
    </>
  );
}
