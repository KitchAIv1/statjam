'use client';

import React, { useEffect, useState, Suspense } from 'react';
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
import { useCoachProfile } from '@/hooks/useCoachProfile';
import { ProfileCard } from '@/components/profile/ProfileCard';
import { ProfileEditModal } from '@/components/profile/ProfileEditModal';
import { ProfileService } from '@/lib/services/profileService';
import { Card } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

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
  
  // ⚡ Use custom hook for profile data
  const { profileData, loading: profileLoading, updateProfile } = useCoachProfile(user?.id || '');
  
  // Profile edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Handle profile share
  const handleShare = async () => {
    if (!profileData) return;
    
    const shareData = ProfileService.generateShareData(profileData);
    
    try {
      await navigator.clipboard.writeText(shareData.profileUrl);
      alert('✅ Profile link copied to clipboard!');
    } catch (error) {
      console.error('❌ Error copying to clipboard:', error);
      alert('Failed to copy link. Please try again.');
    }
  };

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
        
        <main className="pt-24 px-6 pb-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Welcome Checklist - Collapsible onboarding */}
            <WelcomeChecklist
              role="coach"
              steps={coachChecklistSteps}
              subtitle="Complete these quick steps to get game-ready in minutes."
            />

            {/* Profile Card - Replaces old page header with richer profile display */}
            {!profileLoading && profileData && (
              <ProfileCard
                profileData={profileData}
                shareData={ProfileService.generateShareData(profileData)}
                onEdit={() => setShowEditModal(true)}
                onShare={handleShare}
              />
            )}

            {/* Automation Guide Quick Link */}
            <div>
              <Card
                className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 border-orange-200 dark:border-orange-800 cursor-pointer overflow-hidden"
                onClick={() => router.push('/dashboard/coach/automation-guide')}
              >
                <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg flex-shrink-0">
                      <BookOpen className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          Tracker Automation Guide
                        </h3>
                        <span className="text-xs px-2 py-1 bg-orange-500 text-white rounded-full font-medium flex-shrink-0">NEW</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Learn how Minimal, Balanced, and Full presets adapt to Quick Track and official games
                      </p>
                    </div>
                    <div className="text-orange-600 dark:text-orange-400 flex-shrink-0">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Card>
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

        {/* Profile Edit Modal */}
        {profileData && (
          <ProfileEditModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            profileData={profileData}
            onSave={updateProfile}
          />
        )}
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
