'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { NavigationHeader } from '@/components/NavigationHeader';
import { OrganizerDashboard } from '@/components/OrganizerDashboard';
import { OrganizerGuidePanel } from '@/components/guide';
import { OrganizerGuideProvider } from '@/contexts/OrganizerGuideContext';

/**
 * Organizer Dashboard - CURRENT BRANDING (Orange/Red)
 * 
 * Shows overview page with stats cards by default
 * Section-based navigation: ?section=overview|tournaments|teams|games
 */
const OrganizerDashboardContent = () => {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userRole = user?.role;

  // Handle auth and role redirects
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth-redirecting');
    }
    
    if (!loading && !user) {
      router.push('/auth');
      return;
    }
    
    // Role-based redirects
    if (!loading && user && userRole && userRole !== 'organizer') {
      if (userRole === 'player') {
        router.push('/dashboard/player');
      } else if (userRole === 'stat_admin') {
        router.push('/dashboard/stat-admin');
      } else if (userRole === 'coach') {
        router.push('/dashboard/coach');
      } else if (userRole === 'admin') {
        router.push('/admin/dashboard');
      }
    }

    // ✅ Default to overview section if no section specified
    if (!loading && user && userRole === 'organizer' && !searchParams.get('section')) {
      router.replace('/dashboard?section=overview');
    }
  }, [loading, user, userRole, router, searchParams]);

  // Loading state
  if (loading || !user || !userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50/50 via-background to-red-50/30">
        <div className="flex items-center gap-4 text-lg font-medium">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          Loading Organizer Dashboard...
        </div>
      </div>
    );
  }

  return (
    <OrganizerGuideProvider>
      <NavigationHeader />
      <OrganizerDashboard user={user} />
      {userRole === 'organizer' && <OrganizerGuidePanel />}
    </OrganizerGuideProvider>
  );
};

const OrganizerDashboardPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50/50 via-background to-red-50/30">
        <div className="flex items-center gap-4 text-lg font-medium">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          Loading Dashboard...
        </div>
      </div>
    }>
      <OrganizerDashboardContent />
    </Suspense>
  );
};

export default OrganizerDashboardPage;
