'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCheckoutReturn } from '@/hooks/useCheckoutReturn';
import { PlayerDashboard } from '@/components/PlayerDashboard';
import { NavigationHeader } from '@/components/NavigationHeader';

const PlayerDashboardContent = () => {
  const { user, loading } = useAuthContext(); // ✅ NO API CALL - Uses context
  const router = useRouter();
  const userRole = user?.role;

  // Handle checkout return (success/cancel toast + subscription refresh)
  useCheckoutReturn({ role: 'player' });

  useEffect(() => {
    // ✅ Clear redirect flag when dashboard loads successfully
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

const PlayerDashboardPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex items-center gap-4 text-lg font-medium">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    }>
      <PlayerDashboardContent />
    </Suspense>
  );
};

export default PlayerDashboardPage;