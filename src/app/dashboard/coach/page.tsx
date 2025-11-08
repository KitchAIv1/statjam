'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { NavigationHeader } from '@/components/NavigationHeader';
import { CoachDashboardOverview } from '@/components/coach/CoachDashboardOverview';
import { CoachTeamsSection } from '@/components/coach/CoachTeamsSection';
import { CoachQuickTrackSection } from '@/components/coach/CoachQuickTrackSection';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { WelcomeChecklist } from '@/components/onboarding/WelcomeChecklist';
import { HelpPanel } from '@/components/support/HelpPanel';
import { coachChecklistSteps, coachFAQs } from '@/config/onboarding/coachOnboarding';
import { useCoachTeams } from '@/hooks/useCoachTeams';

/**
 * CoachDashboardContent - Main dashboard content with search params
 */
const CoachDashboardContent = () => {
  const { user, loading: authLoading } = useAuthContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userRole = user?.role;
  
  // URL section parameter
  const section = searchParams.get('section') || 'overview';
  
  // ⚡ Use custom hook for teams data with caching
  const { teams, loading: teamsLoading, error, invalidateCache } = useCoachTeams(user);

  // Auth protection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth-redirecting');
    }
    
    if (!authLoading && (!user || userRole !== 'coach')) {
      console.log('🔄 Coach dashboard: Redirecting to auth...');
      router.push('/auth');
    }
  }, [user, userRole, authLoading, router]);

  // Loading state
  if (authLoading || !user || userRole !== 'coach') {
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
            loading={teamsLoading}
            error={error}
            onTeamUpdate={invalidateCache}
          />
        );
      
      case 'quick-track':
        return (
          <CoachQuickTrackSection
            teams={teams}
            loading={teamsLoading}
            error={error}
          />
        );
      
      case 'overview':
      default:
        return (
          <CoachDashboardOverview
            user={user}
            teams={teams}
            loading={teamsLoading}
            error={error}
            onTeamUpdate={invalidateCache}
          />
        );
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-background to-red-50/30 text-foreground">
        <NavigationHeader />
        
        <main className="pt-16 p-6">
          <div className="max-w-7xl mx-auto">
            <WelcomeChecklist
              role="coach"
              steps={coachChecklistSteps}
              subtitle="Complete these quick steps to get game-ready in minutes."
              className="mt-6 mb-8"
            />

            {/* Page Header */}
            <div className="mb-8 mt-6 text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
                Coach Dashboard
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Manage your teams, track games, and connect with tournaments
              </p>
            </div>

            {/* Section Content */}
            {renderSectionContent()}
          </div>
        </main>

        <HelpPanel
          role="coach"
          faqs={coachFAQs}
          checklistLink="/dashboard/coach"
          onChecklistOpen={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('open-onboarding-checklist', { detail: { role: 'coach' } }));
            }
          }}
        />
      </div>
    </ErrorBoundary>
  );
};

/**
 * CoachDashboard - Main dashboard page with Suspense wrapper
 */
const CoachDashboard = () => {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-background to-red-50/30 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading coach dashboard...</p>
      </div>
    </div>}>
      <CoachDashboardContent />
    </Suspense>
  );
};

export default CoachDashboard;
