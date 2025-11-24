/**
 * ErrorLoggingService - Centralized Error Logging with Sentry Integration Hook
 * 
 * PURPOSE:
 * - Centralized error logging across the application
 * - Ready for Sentry integration (one config change)
 * - Logs errors with context (user ID, game ID, action)
 * - Fallback to console in development
 * 
 * ARCHITECTURE:
 * - Lightweight service that can be enhanced with Sentry
 * - Context-aware logging (user, game, action)
 * - No external dependencies (Sentry optional)
 * 
 * Follows .cursorrules: <200 lines, single responsibility, PascalCase naming
 */

interface ErrorContext {
  userId?: string;
  gameId?: string;
  action?: string;
  metadata?: Record<string, any>;
}

class ErrorLoggingService {
  private currentUserId: string | null = null;

  /**
   * Set the current user ID for context
   */
  setUser(userId: string | null): void {
    this.currentUserId = userId;
  }

  /**
   * Log an error with context
   */
  logError(error: Error, context?: ErrorContext): void {
    const errorContext = {
      userId: context?.userId || this.currentUserId,
      gameId: context?.gameId,
      action: context?.action,
      ...context?.metadata
    };

    // Log to console in all environments (for debugging)
    console.error('❌ ErrorLoggingService:', {
      message: error.message,
      stack: error.stack,
      context: errorContext
    });

    // In production, send to error tracking service (Sentry)
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorService(error, errorContext);
    }
  }

  /**
   * Log a warning with context
   */
  logWarning(message: string, context?: ErrorContext): void {
    const warningContext = {
      userId: context?.userId || this.currentUserId,
      gameId: context?.gameId,
      action: context?.action,
      ...context?.metadata
    };

    console.warn('⚠️ ErrorLoggingService:', {
      message,
      context: warningContext
    });

    // In production, send warnings to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Sentry can capture warnings too
      this.sendToErrorService(new Error(message), warningContext, 'warning');
    }
  }

  /**
   * Send error to error tracking service (Sentry)
   */
  private sendToErrorService(
    error: Error, 
    context: Record<string, any>,
    level: 'error' | 'warning' = 'error'
  ): void {
    // Only send to Sentry in production and if DSN is configured
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
      try {
        // Dynamic import to avoid bundling Sentry in development
        import('@sentry/nextjs').then((Sentry) => {
          Sentry.captureException(error, {
            level: level === 'warning' ? 'warning' : 'error',
            tags: {
              action: context.action,
              gameId: context.gameId
            },
            user: context.userId ? { id: context.userId } : undefined,
            extra: context
          });
        }).catch((importError) => {
          // Fallback if Sentry import fails
          console.error('Failed to import Sentry:', importError);
        });
      } catch (sentryError) {
        // Fallback if Sentry is not available
        console.error(`[${level.toUpperCase()}] Production Error (Sentry unavailable):`, {
          error: error.message,
          stack: error.stack,
          context,
          sentryError
        });
      }
    } else if (process.env.NODE_ENV === 'production') {
      // Log if Sentry DSN is not configured
      console.error(`[${level.toUpperCase()}] Production Error (Sentry DSN not configured):`, {
        error: error.message,
        stack: error.stack,
        context
      });
    }
  }

  /**
   * Log React error boundary errors
   */
  logReactError(error: Error, errorInfo: React.ErrorInfo): void {
    this.logError(error, {
      action: 'react_error_boundary',
      metadata: {
        componentStack: errorInfo.componentStack
      }
    });
  }
}

// Export singleton instance
export const errorLoggingService = new ErrorLoggingService();

