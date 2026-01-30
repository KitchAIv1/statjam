'use client';

/**
 * Auth Error Boundary
 * 
 * Catches errors in the authentication page and provides
 * graceful recovery options.
 */

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report to Sentry with auth context
    Sentry.captureException(error, {
      tags: {
        errorType: 'auth_error',
        page: 'auth',
        digest: error.digest,
      },
    });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800 px-4">
      <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-lg p-6 text-center border border-gray-700">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-12 w-12 text-orange-500" />
        </div>
        
        <h1 className="text-xl font-semibold text-white mb-2">
          Authentication Error
        </h1>
        
        <p className="text-gray-400 mb-6">
          We encountered a problem with the login page. Please try refreshing
          or return to the home page.
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
