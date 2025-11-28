'use client';

/**
 * Stat Tracker Error Boundary
 * 
 * Catches errors in the stat tracker page and provides
 * graceful recovery options specific to stat tracking.
 */

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StatTrackerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Report to Sentry with stat tracker context
    Sentry.captureException(error, {
      tags: {
        errorType: 'stat_tracker_error',
        page: 'stat-tracker-v3',
        digest: error.digest,
      },
    });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="max-w-md w-full bg-gray-900 rounded-lg shadow-lg p-6 text-center border border-gray-800">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-12 w-12 text-orange-500" />
        </div>
        
        <h1 className="text-xl font-semibold text-white mb-2">
          Stat Tracker Error
        </h1>
        
        <p className="text-gray-400 mb-6">
          Something went wrong with the stat tracker. Your recorded stats are safe.
          Try refreshing to continue tracking.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
          
          <button
            onClick={() => router.push('/dashboard/stat-admin')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </div>

        {error.digest && (
          <p className="mt-6 text-xs text-gray-600">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}

