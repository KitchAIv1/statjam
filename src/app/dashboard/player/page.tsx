'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { PlayerDashboard } from '@/components/PlayerDashboard';
import { NavigationHeader } from '@/components/NavigationHeader';

const PlayerDashboardPage = () => {
  const { user, userRole, loading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
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