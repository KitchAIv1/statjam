'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { OrganizerDashboard } from '@/components/OrganizerDashboard';
import { NavigationHeader } from '@/components/NavigationHeader';
import { OrganizerGuidePanel } from '@/components/guide';
import { OrganizerGuideProvider } from '@/contexts/OrganizerGuideContext';

const OrganizerDashboardContent = () => {
  const { user, loading } = useAuthContext(); // ✅ NO API CALL - Uses context
  const router = useRouter();
  const searchParams = useSearchParams();
  const userRole = user?.role;

  // Handle redirects in useEffect - wait for auth to fully initialize
  useEffect(() => {
    // ✅ Clear redirect flag when dashboard loads successfully
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth-redirecting');
    }
    
    // Only redirect after auth is fully initialized
    if (!loading && !user) {
      router.push('/auth');
      return;
    }
    
    if (!loading && user && userRole && userRole !== 'organizer') {
      if (userRole === 'player') {
        router.push('/dashboard/player');
      } else if (userRole === 'stat_admin') {
        router.push('/dashboard/stat-admin');
      } else if (userRole === 'admin') {
        router.push('/dashboard'); // Admin templates temporarily disabled
      }
    }

    // If no section is specified, default to overview
    if (!loading && user && userRole === 'organizer' && !searchParams.get('section')) {
      router.replace('/dashboard?section=overview');
    }
  }, [loading, user, userRole, router, searchParams]);

  // Show loading screen only while auth is initializing
  if (loading || !user || !userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex items-center gap-4 text-lg font-medium">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex items-center gap-4 text-lg font-medium">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Loading Dashboard...
        </div>
      </div>
    }>
      <OrganizerDashboardContent />
    </Suspense>
  );
};

export default OrganizerDashboardPage;