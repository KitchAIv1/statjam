'use client';

/**
 * Coach Dashboard - Mission Control Layout
 * 
 * Compact, single-screen dashboard showing all essential information:
 * - Profile Card (existing)
 * - Live Action Hub (CTAs + live game + status)
 * - Teams Strip (horizontal compact cards)
 * - Video Tracking Widget
 * - Recent Games Widget
 * - Tournaments Widget
 * 
 * Follows .cursorrules: <250 lines, page component
 */

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCheckoutReturn } from '@/hooks/useCheckoutReturn';
import { NavigationHeader } from '@/components/NavigationHeader';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { WelcomeChecklist } from '@/components/onboarding/WelcomeChecklist';
import { HelpPanel } from '@/components/support/HelpPanel';
import { coachChecklistSteps, coachFAQs } from '@/config/onboarding/coachOnboarding';
import { useCoachTeams } from '@/hooks/useCoachTeams';
import { useCoachProfile } from '@/hooks/useCoachProfile';
import { ProfileEditModal } from '@/components/profile/ProfileEditModal';
import { CoachMissionControl } from '@/components/coach/CoachMissionControl';
import { CoachTeamsSection } from '@/components/coach/CoachTeamsSection';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { BookOpen } from 'lucide-react';
import { AnnouncementModal } from '@/components/announcements';
import { PLAYER_CLAIM_ANNOUNCEMENT } from '@/config/announcements';

/**
 * CoachDashboardContent - Main dashboard content
 */
const CoachDashboardContent = () => {
  const { user, loading: authLoading } = useAuthContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userRole = user?.role;

  // Handle checkout return (success/cancel toast + subscription refresh)
  useCheckoutReturn({ role: 'coach' });
  
  // URL section parameter - only used for legacy team management view
  const section = searchParams.get('section');
  
  // ⚡ Use custom hook for teams data with caching
  const { teams, loading: teamsLoading, error, invalidateCache } = useCoachTeams(user);
  
  // ⚡ Use custom hook for profile data
  const { profileData, loading: profileLoading, updateProfile } = useCoachProfile(user?.id || '');
  
  // Profile edit modal state
  const [showEditModal, setShowEditModal] = useState(false);

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50/50 via-background to-red-50/30">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-gray-300 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
          <div className="text-gray-600">Loading coach dashboard...</div>
        </div>
      </div>
    );
  }

  // Render content based on section (legacy support for teams management)
  const renderContent = () => {
    // Only show legacy teams section if explicitly requested
    if (section === 'teams') {
      return (
        <CoachTeamsSection
          teams={teams}
          loading={teamsLoading}
          error={error}
          userId={user?.id || ''}
          onTeamUpdate={invalidateCache}
        />
      );
    }
    
    // Default: Mission Control layout
    return (
      <CoachMissionControl
        user={user}
        teams={teams}
        teamsLoading={teamsLoading}
        profileData={profileData}
        profileLoading={profileLoading}
        onTeamUpdate={invalidateCache}
        onEditProfile={() => setShowEditModal(true)}
      />
    );
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-background to-red-50/30 text-foreground">
        <NavigationHeader />
        
        <main className="pt-24 px-4 sm:px-6 pb-6">
          <div className="max-w-7xl mx-auto space-y-4">
            {/* Welcome Checklist - Collapsible onboarding */}
            <WelcomeChecklist
              role="coach"
              steps={coachChecklistSteps}
              subtitle="Complete these quick steps to get game-ready in minutes."
            />

            {/* Automation Guide Button - Floating */}
            <div className="flex justify-end">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => router.push('/dashboard/coach/automation-guide')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
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
            </div>

            {/* Main Content */}
            {renderContent()}
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
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-background to-red-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading coach dashboard...</p>
        </div>
      </div>
    }>
      <CoachDashboardContent />
    </Suspense>
  );
};

export default CoachDashboard;
