'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { NavigationHeader } from '@/components/NavigationHeader';
import { OrganizerTournamentManager } from '@/components/OrganizerTournamentManager';

/**
 * Organizer Dashboard - CURRENT BRANDING (Orange/Red)
 * 
 * Simplified dashboard showing tournaments directly
 * NO section-based navigation - removed old UI architecture
 */
const OrganizerDashboardContent = () => {
  const { user, loading } = useAuthContext();
  const router = useRouter();
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
      }
    }
  }, [loading, user, userRole, router]);

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
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-background to-red-50/30">
      <NavigationHeader />
      
      {/* Main Content */}
      <main className="pt-20 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
              Organizer Dashboard
            </h1>
            <p className="text-lg text-muted-foreground">
              Manage your tournaments, teams, and schedules
            </p>
          </div>

          {/* Tournament Manager (Direct) */}
          <OrganizerTournamentManager user={user} />
        </div>
      </main>
    </div>
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
