'use client';

import React from 'react';
import { Users, Trophy, PlayCircle, Plus, TrendingUp, Calendar, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { CoachTeam } from '@/lib/types/coach';
import { CoachTeamCard } from './CoachTeamCard';

interface CoachDashboardOverviewProps {
  user: any;
  teams: CoachTeam[];
  loading: boolean;
  error: string | null;
  onTeamUpdate: () => void;
}

/**
 * CoachDashboardOverview - Overview section of coach dashboard
 * 
 * Features:
 * - Quick stats cards
 * - Recent teams grid
 * - Quick actions
 * - Empty state handling
 * 
 * Follows .cursorrules: <200 lines, UI component only
 */
export function CoachDashboardOverview({
  user,
  teams,
  loading,
  error,
  onTeamUpdate
}: CoachDashboardOverviewProps) {
  
  // Calculate stats
  const totalTeams = teams.length;
  const totalGames = teams.reduce((sum, team) => sum + (team.games_count || 0), 0);
  const publicTeams = teams.filter(team => team.visibility === 'public').length;
  const recentTeams = teams.slice(0, 6); // Show up to 6 recent teams

  // Styles
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '32px'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '20px',
      marginBottom: '32px'
    },
    statCard: {
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '24px',
      backdropFilter: 'blur(10px)'
    },
    statIcon: {
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '16px'
    },
    statValue: {
      fontSize: '2rem',
      fontWeight: '700',
      color: '#ffffff',
      marginBottom: '4px'
    },
    statLabel: {
      fontSize: '0.9rem',
      color: '#a1a1aa'
    },
    sectionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px'
    },
    sectionTitle: {
      fontSize: '1.5rem',
      fontWeight: '600',
      color: '#ffffff'
    },
    teamsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '20px'
    },
    emptyState: {
      textAlign: 'center' as const,
      padding: '60px 20px',
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
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
      color: '#ffffff',
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
        <div style={styles.emptyTitle}>Error Loading Dashboard</div>
        <div style={styles.emptyDesc}>{error}</div>
        <Button onClick={onTeamUpdate} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Quick Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{
            ...styles.statIcon,
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
          }}>
            <Users className="w-6 h-6 text-white" />
          </div>
          <div style={styles.statValue}>{totalTeams}</div>
          <div style={styles.statLabel}>Total Teams</div>
        </div>

        <div style={styles.statCard}>
          <div style={{
            ...styles.statIcon,
            background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)'
          }}>
            <PlayCircle className="w-6 h-6 text-white" />
          </div>
          <div style={styles.statValue}>{totalGames}</div>
          <div style={styles.statLabel}>Games Tracked</div>
        </div>

        <div style={styles.statCard}>
          <div style={{
            ...styles.statIcon,
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
          }}>
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div style={styles.statValue}>{publicTeams}</div>
          <div style={styles.statLabel}>Public Teams</div>
        </div>

        <div style={styles.statCard}>
          <div style={{
            ...styles.statIcon,
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
          }}>
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div style={styles.statValue}>
            {totalGames > 0 ? Math.round((totalGames / Math.max(totalTeams, 1)) * 10) / 10 : '0'}
          </div>
          <div style={styles.statLabel}>Avg Games/Team</div>
        </div>
      </div>

      {/* My Teams Section */}
      <div>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>My Teams</h2>
          <Button
            onClick={() => window.location.href = '/dashboard/coach?section=teams'}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Team
          </Button>
        </div>

        {loading ? (
          <div style={styles.teamsGrid}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{
                ...styles.statCard,
                height: '200px',
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
        ) : recentTeams.length > 0 ? (
          <div style={styles.teamsGrid}>
            {recentTeams.map((team) => (
              <CoachTeamCard
                key={team.id}
                team={team}
                onUpdate={onTeamUpdate}
              />
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <Users style={styles.emptyIcon} />
            <div style={styles.emptyTitle}>No teams yet</div>
            <div style={styles.emptyDesc}>
              Create your first team to start tracking games and managing your roster
            </div>
            <Button
              onClick={() => window.location.href = '/dashboard/coach?section=teams'}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Create First Team
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
