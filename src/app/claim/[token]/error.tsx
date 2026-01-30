'use client';

/**
 * Claim Error Boundary
 * 
 * Catches errors in the player claim page and provides
 * graceful recovery options.
 */

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function ClaimError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report to Sentry with claim context
    Sentry.captureException(error, {
      tags: {
        errorType: 'claim_error',
        page: 'claim',
        digest: error.digest,
      },
    });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-950 px-4">
      <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-xl p-6 text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-12 w-12 text-orange-500" />
        </div>
        
        <h1 className="text-xl font-semibold text-white mb-2">
          Claim Error
        </h1>
        
        <p className="text-gray-400 mb-6">
          Something went wrong while processing your claim. Please try refreshing
          or contact support if the issue persists.
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
            onClick={() => window.location.href = '/'}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
          >
            <Home className="h-4 w-4" />
            Go Home
          </button>
        </div>

        {error.digest && (
          <p className="mt-6 text-xs text-gray-500">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
