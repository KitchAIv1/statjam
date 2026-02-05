/**
 * Test Sentry Error Capture
 * Visit /api/test-sentry to trigger a test error
 * DELETE THIS FILE after confirming Sentry works
 */

import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';

export async function GET() {
  // Capture a test message first
  Sentry.captureMessage('Sentry test message from StatJam API', 'info');
  
  // Then throw an error to test error capture
  throw new Error('Intentional Sentry test error from StatJam');
}
