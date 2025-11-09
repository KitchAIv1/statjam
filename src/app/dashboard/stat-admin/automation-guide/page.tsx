'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Button } from '@/components/ui/Button';
import { AutomationPresetsComparison } from '@/components/tracker-v3/AutomationPresetsComparison';
import { ArrowLeft, BookOpen } from 'lucide-react';

/**
 * Stat Admin Automation Guide Page
 * 
 * Dedicated page showing the automation presets comparison table.
 * Helps stat admins understand the differences between tracking modes.
 * 
 * Follows .cursorrules: <200 lines, single responsibility
 */
export default function StatAdminAutomationGuidePage() {
  const router = useRouter();
  const { user, loading } = useAuthContext();
  const userRole = user?.role;

  // Redirect if not stat admin
  React.useEffect(() => {
    if (!loading && (!user || userRole !== 'stat_admin')) {
      router.push('/auth');
    }
  }, [user, userRole, loading, router]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1a1a',
        color: '#ffffff'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          fontSize: '18px',
          fontWeight: '500'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: '#FFD700',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
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
              onClick={() => router.push('/dashboard/stat-admin')}
              variant="outline"
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
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
                  Understanding automation presets for efficient stat tracking
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
                Perfect for first-time trackers or when you want complete control. No automation prompts means you decide every action.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 lg:p-8 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-4">⚡</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Balanced Mode
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                The sweet spot for most games. Smart prompts help you track faster while you stay in control of the final decisions.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 lg:p-8 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-4">🚀</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Full Automation
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                NBA-level tracking with maximum automation. Best for experienced trackers who want the fastest possible workflow.
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
                <span className="leading-relaxed">You can change automation settings before each game using the Pre-Flight Check modal</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 flex-shrink-0">•</span>
                <span className="leading-relaxed">Start with Minimal mode to learn the tracker, then graduate to Balanced or Full</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 flex-shrink-0">•</span>
                <span className="leading-relaxed">Tournament organizers can set default automation levels for all games in their tournament</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 flex-shrink-0">•</span>
                <span className="leading-relaxed">Demo games are perfect for testing different automation modes without affecting real data</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

