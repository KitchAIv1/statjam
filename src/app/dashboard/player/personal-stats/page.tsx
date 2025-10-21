'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { NavigationHeader } from '@/components/NavigationHeader';
import { PersonalStatTracker } from '@/components/player-dashboard/PersonalStatTracker';

/**
 * Personal Stats Page - Standalone route for personal player stat tracking
 * 
 * This provides a dedicated page for the personal stat tracker feature,
 * accessible at /dashboard/player/personal-stats
 */
const PersonalStatsPage = () => {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const userRole = user?.role;

  useEffect(() => {
    // Clear redirect flag when page loads successfully
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth-redirecting');
    }
    
    if (!loading && (!user || userRole !== 'player')) {
      router.push('/auth');
    }
  }, [user, userRole, loading, router]);

  if (loading || !user || userRole !== 'player') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex items-center gap-4 text-lg font-medium">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Loading Personal Stats...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <PersonalStatTracker />
      </main>
    </div>
  );
};

export default PersonalStatsPage;
