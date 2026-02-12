/**
 * Sentry configuration for relay server.
 * Captures FFmpeg/RTMP/WebSocket errors for livestream debugging.
 */

import * as Sentry from '@sentry/node';

const RELAY_TAGS = { service: 'relay-server', feature: 'live-broadcast' } as const;

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    debug: false,
    environment: process.env.NODE_ENV || 'production',
    initialScope: {
      tags: { ...RELAY_TAGS },
    },
    beforeSend(event) {
      if (process.env.NODE_ENV === 'development') return null;
      return event;
    },
  });
}

export function captureRelayError(
  error: Error,
  failureType: string,
  extra?: Record<string, unknown>
): void {
  if (!process.env.SENTRY_DSN) return;

  Sentry.captureException(error, {
    tags: { ...RELAY_TAGS, failure_type: failureType },
    extra,
  });
}
