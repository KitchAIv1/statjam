'use client';

import React, { Suspense } from 'react';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Trophy, Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

/**
 * Coach Tournaments Page - Coming Soon
 * 
 * Purpose: Will display tournament connections and participation
 * Status: Placeholder for MVP2
 */
function CoachTournamentsContent() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-background to-red-50/30">
      <NavigationHeader />
      
      <main className="pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button
            onClick={() => router.push('/dashboard/coach')}
            variant="ghost"
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          {/* Coming Soon Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-border/50 p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center">
              <Trophy className="w-10 h-10 text-orange-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Tournament Connections
            </h1>
            
            <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
              Connect your teams to tournaments, track participation, and manage tournament schedules.
            </p>
            
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-orange-100 text-orange-800 rounded-full font-semibold mb-8">
              <Clock className="w-5 h-5" />
              Coming Soon
            </div>
            
            <p className="text-sm text-gray-500 mb-8">
              This feature is currently in development and will be available in the next release.
            </p>
            
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => router.push('/dashboard/coach?section=teams')}
                className="gap-2"
              >
                <Trophy className="w-4 h-4" />
                Manage Teams
              </Button>
              
              <Button
                onClick={() => router.push('/dashboard/coach')}
                variant="secondary"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CoachTournamentsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <CoachTournamentsContent />
    </Suspense>
  );
}
