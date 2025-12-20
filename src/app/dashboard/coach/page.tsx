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
import { ProfileCard, ProfileCardSkeleton } from '@/components/profile/ProfileCard';
import { CoachQuickStats, CoachQuickStatsSkeleton } from '@/components/coach/CoachQuickStats';
import { ProfileEditModal } from '@/components/profile/ProfileEditModal';
import { ProfileService } from '@/lib/services/profileService';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { BookOpen } from 'lucide-react';
import { AnnouncementModal } from '@/components/announcements';
import { PLAYER_CLAIM_ANNOUNCEMENT } from '@/config/announcements';

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
            userId={user?.id || ''}
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

            {/* Profile Card + Quick Stats - Side by side on desktop, stacked on mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              {/* Profile Card - Takes 2/3 width on desktop */}
              <div className="lg:col-span-2 relative">
                {profileLoading ? (
                  <ProfileCardSkeleton />
                ) : profileData ? (
                  <>
                    {/* Automation Guide Button - Inside Profile Card, Upper Right */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => router.push('/dashboard/coach/automation-guide')}
                          className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
                        >
                          <BookOpen className="w-4 h-4" />
                          <span className="text-xs font-medium">Guide</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-white/25 rounded">NEW</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="bg-gray-900 text-white px-3 py-2">
                        <p className="font-medium">Tracker Automation Guide</p>
                        <p className="text-xs text-gray-300">Learn Minimal, Balanced & Full presets</p>
                      </TooltipContent>
                    </Tooltip>
                    <ProfileCard
                      profileData={profileData}
                      shareData={ProfileService.generateShareData(profileData)}
                      onEdit={() => setShowEditModal(true)}
                      onShare={handleShare}
                    />
                  </>
                ) : null}
              </div>

              {/* Quick Stats - 2x2 grid of square cards, 1/3 width on desktop */}
              <div className="lg:col-span-1">
                {profileLoading || teamsLoading ? (
                  <CoachQuickStatsSkeleton />
                ) : (
                  <CoachQuickStats teams={teams} loading={teamsLoading} />
                )}
              </div>
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

        {/* Player Claim Announcement Modal - Shows once */}
        <AnnouncementModal
          config={{
            ...PLAYER_CLAIM_ANNOUNCEMENT,
            ctaAction: () => router.push('/dashboard/coach?section=teams&highlight=claim'),
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
