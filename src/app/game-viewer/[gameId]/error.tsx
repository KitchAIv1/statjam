'use client';

/**
 * Game Viewer Error Boundary
 * 
 * Catches errors in the game viewer page and provides
 * graceful recovery options for viewers.
 */

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GameViewerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Report to Sentry with game viewer context
    Sentry.captureException(error, {
      tags: {
        errorType: 'game_viewer_error',
        page: 'game-viewer',
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
          Unable to Load Game
        </h1>
        
        <p className="text-gray-400 mb-6">
          We couldn't load the game data. This might be a temporary issue.
          Please try refreshing the page.
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
            onClick={() => router.push('/')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <Home className="h-4 w-4" />
            Go Home
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

