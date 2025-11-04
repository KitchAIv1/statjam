'use client';

import { Suspense } from 'react';
import { useAuthV2 } from '@/hooks/useAuthV2';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GamepadIcon } from 'lucide-react';

function CoachGamesContent() {
  const { user, loading } = useAuthV2();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <GamepadIcon className="w-16 h-16 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold text-white">
                Game History
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-white/80 text-lg mb-2">Coming Soon</p>
              <p className="text-white/60 text-sm">
                Track your past games, view detailed stats, and analyze your team&apos;s performance.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CoachGamesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <CoachGamesContent />
    </Suspense>
  );
}
