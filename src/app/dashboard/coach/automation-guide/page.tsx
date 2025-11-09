'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Button } from '@/components/ui/Button';
import { AutomationPresetsComparison } from '@/components/tracker-v3/AutomationPresetsComparison';
import { ArrowLeft, BookOpen } from 'lucide-react';

/**
 * Coach Automation Guide Page
 *
 * Mirrors the stat admin guide so coaches can review Minimal / Balanced / Full presets
 * before launching official or Quick Track games.
 */
export default function CoachAutomationGuidePage() {
  const router = useRouter();
  const { user, loading } = useAuthContext();
  const userRole = user?.role;

  React.useEffect(() => {
    if (!loading && (!user || userRole !== 'coach')) {
      router.push('/auth');
    }
  }, [user, userRole, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="flex items-center gap-3 text-lg font-medium">
          <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavigationHeader />

      <main className="pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <div className="mb-8">
            <Button
              onClick={() => router.push('/dashboard/coach')}
              variant="outline"
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Coach Dashboard
            </Button>
          </div>

          {/* Page Header */}
          <div className="mb-10 sm:mb-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-2">
                  Tracker Automation Guide
                </h1>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
                  Compare Minimal, Balanced, and Full presets before launching Quick Track or official games.
                </p>
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 sm:p-8 lg:p-10 mb-8 sm:mb-10">
            <AutomationPresetsComparison />
          </div>

          {/* Additional Tips */}
          <div className="mb-8 sm:mb-10 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 lg:p-8 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Minimal Mode
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                Perfect for scrimmages and training sessions. Automation prompts stay off so you can teach the workflow step-by-step.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 lg:p-8 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-4">⚡</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Balanced Mode
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                Recommended for official games. Smart prompts speed up tracking while keeping coaches in control of final decisions.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 lg:p-8 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-4">🚀</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Full Automation
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                Max automation with foul enforcement and undo history. Perfect for experienced crews and showcase events.
              </p>
            </div>
          </div>

          {/* Pro Tips */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-6 sm:p-8 lg:p-10 border border-orange-200 dark:border-orange-800">
            <h3 className="text-lg sm:text-xl font-semibold text-orange-900 dark:text-orange-300 mb-4 sm:mb-6 flex items-center gap-2">
              <span className="text-2xl">💡</span>
              Pro Tips
            </h3>
            <ul className="space-y-3 sm:space-y-4 text-sm sm:text-base text-orange-800 dark:text-orange-400">
              <li className="flex items-start gap-3">
                <span className="mt-1 flex-shrink-0">•</span>
                <span className="leading-relaxed">Use Minimal mode during coaching clinics to teach new stat admins without automation prompts.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 flex-shrink-0">•</span>
                <span className="leading-relaxed">Balanced mode mirrors official tournament automation—great for practice games that simulate live events.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 flex-shrink-0">•</span>
                <span className="leading-relaxed">Full automation is ideal when you have a dedicated stat admin and want the fastest workflow possible.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 flex-shrink-0">•</span>
                <span className="leading-relaxed">Automation presets are saved per game—set it once before launching the tracker.</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

