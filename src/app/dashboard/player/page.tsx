'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthV2 } from '@/hooks/useAuthV2';
import { PlayerDashboard } from '@/components/PlayerDashboard';
import { NavigationHeader } from '@/components/NavigationHeader';

const PlayerDashboardPage = () => {
  const { user, loading } = useAuthV2();
  const router = useRouter();
  const userRole = user?.role;

  useEffect(() => {
    // ✅ Clear redirect flag when dashboard loads successfully
    sessionStorage.removeItem('auth-redirecting');
    
    if (!loading && (!user || userRole !== 'player')) {
      router.push('/auth');
    }
  }, [user, userRole, loading, router]);

  if (loading || !user || userRole !== 'player') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex items-center gap-4 text-lg font-medium">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Loading Player Dashboard...
        </div>
      </div>
    );
  }

  return (
    <>
      <NavigationHeader />
      <PlayerDashboard />
    </>
  );
};

export default PlayerDashboardPage; 