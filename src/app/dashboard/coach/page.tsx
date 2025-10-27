'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { NavigationHeader } from '@/components/NavigationHeader';
import { CoachDashboardOverview } from '@/components/coach/CoachDashboardOverview';
import { CoachTeamsSection } from '@/components/coach/CoachTeamsSection';
import { CoachQuickTrackSection } from '@/components/coach/CoachQuickTrackSection';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CoachTeam } from '@/lib/types/coach';

/**
 * CoachDashboard - Main dashboard page for coaches
 * 
 * Features:
 * - Team management with cards grid
 * - Quick track game launching
 * - Tournament integration
 * - Import token sharing
 * 
 * Follows .cursorrules: <200 lines, single responsibility
 */
const CoachDashboard = () => {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userRole = user?.role;
  
  // URL section parameter
  const section = searchParams.get('section') || 'overview';
  
  // Dashboard state
  const [teams, setTeams] = useState<CoachTeam[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth protection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth-redirecting');
    }
    
    if (!loading && (!user || userRole !== 'coach')) {
      console.log('🔄 Coach dashboard: Redirecting to auth...');
      router.push('/auth');
    }
  }, [user, userRole, loading, router]);

  // Load coach data
  useEffect(() => {
    const loadCoachData = async () => {
      if (!user || userRole !== 'coach') {
        return;
      }
      
      try {
        setDashboardLoading(true);
        setError(null);
        
        // Import coach service dynamically
        const { CoachTeamService } = await import('@/lib/services/coachTeamService');
        const coachTeams = await CoachTeamService.getCoachTeams(user.id);
        
        setTeams(coachTeams);
      } catch (error) {
        console.error('❌ Error loading coach data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load coach data';
        setError(errorMessage);
      } finally {
        setDashboardLoading(false);
      }
    };

    if (user && userRole === 'coach') {
      loadCoachData();
    } else {
      setDashboardLoading(false);
    }
  }, [user, userRole]);

  // Handle team updates
  const handleTeamUpdate = () => {
    // Reload teams when changes occur
    if (user && userRole === 'coach') {
      const loadTeams = async () => {
        try {
          const { CoachTeamService } = await import('@/lib/services/coachTeamService');
          const coachTeams = await CoachTeamService.getCoachTeams(user.id);
          setTeams(coachTeams);
        } catch (error) {
          console.error('❌ Error reloading teams:', error);
        }
      };
      loadTeams();
    }
  };

  // Loading state
  if (loading || !user || userRole !== 'coach') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1a1a',
        color: '#ffffff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid #333', 
            borderTop: '3px solid #f97316',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <div>Loading coach dashboard...</div>
        </div>
      </div>
    );
  }

  // Render section content
  const renderSectionContent = () => {
    switch (section) {
      case 'teams':
        return (
          <CoachTeamsSection
            teams={teams}
            loading={dashboardLoading}
            error={error}
            onTeamUpdate={handleTeamUpdate}
          />
        );
      
      case 'quick-track':
        return (
          <CoachQuickTrackSection
            teams={teams}
            loading={dashboardLoading}
            error={error}
          />
        );
      
      case 'overview':
      default:
        return (
          <CoachDashboardOverview
            user={user}
            teams={teams}
            loading={dashboardLoading}
            error={error}
            onTeamUpdate={handleTeamUpdate}
          />
        );
    }
  };

  return (
    <ErrorBoundary>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        color: '#ffffff'
      }}>
        <NavigationHeader user={user} />
        
        <main style={{
          padding: '24px',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          {/* Page Header */}
          <div style={{
            marginBottom: '32px',
            textAlign: 'center'
          }}>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px'
            }}>
              Coach Dashboard
            </h1>
            <p style={{
              fontSize: '1.1rem',
              color: '#a1a1aa',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Manage your teams, track games, and connect with tournaments
            </p>
          </div>

          {/* Section Content */}
          {renderSectionContent()}
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default CoachDashboard;
