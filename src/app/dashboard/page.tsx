'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthV2 } from '@/hooks/useAuthV2';
import { OrganizerDashboard } from '@/components/OrganizerDashboard';
import { NavigationHeader } from '@/components/NavigationHeader';

const OrganizerDashboardContent = () => {
  const { user, userRole, loading, initialized } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle redirects in useEffect - wait for auth to fully initialize
  useEffect(() => {
    // Only redirect after auth is fully initialized
    if (initialized && !loading && !user) {
      router.push('/auth');
      return;
    }
    
    if (initialized && !loading && user && userRole && userRole !== 'organizer') {
      if (userRole === 'player') {
        router.push('/dashboard/player');
      } else if (userRole === 'stat_admin') {
        router.push('/dashboard/stat-admin');
      } else if (userRole === 'admin') {
        router.push('/admin/templates');
      }
    }

    // If no section is specified, default to overview
    if (initialized && !loading && user && userRole === 'organizer' && !searchParams.get('section')) {
      router.replace('/dashboard?section=overview');
    }
  }, [initialized, loading, user, userRole, router, searchParams]);

  // Show loading screen only while auth is initializing
  if (!initialized || loading || !user || !userRole) {
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
    <>
      <NavigationHeader />
      <OrganizerDashboard />
    </>
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