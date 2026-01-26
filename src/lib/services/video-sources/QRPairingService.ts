/**
 * QR Pairing Service
 * 
 * Generates and validates QR codes for iPhone pairing.
 * Uses crypto for secure session IDs.
 */

import { QRPairingSession } from './types';

const SESSION_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

/** Generate a secure random session ID */
function generateSessionId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

/** Create a pairing session for QR code */
export function createPairingSession(gameId: string, baseUrl: string): QRPairingSession {
  const sessionId = generateSessionId();
  const expiresAt = Date.now() + SESSION_EXPIRY_MS;
  
  // Build the mobile camera URL with embedded session
  const pairingUrl = `${baseUrl}/dashboard/mobile-camera?session=${sessionId}&game=${gameId}`;
  
  return {
    sessionId,
    gameId,
    expiresAt,
    pairingUrl,
  };
}

/** Validate a pairing session */
export function validatePairingSession(session: QRPairingSession): boolean {
  return Date.now() < session.expiresAt;
}

/** Parse session from URL params */
export function parseSessionFromUrl(url: string): { sessionId: string; gameId: string } | null {
  try {
    const urlObj = new URL(url);
    const sessionId = urlObj.searchParams.get('session');
    const gameId = urlObj.searchParams.get('game');
    
    if (sessionId && gameId) {
      return { sessionId, gameId };
    }
    return null;
  } catch {
    return null;
  }
}

/** Generate a simplified pairing URL (without session for basic pairing) */
export function createSimplePairingUrl(gameId: string, baseUrl: string): string {
  return `${baseUrl}/dashboard/mobile-camera?game=${gameId}`;
}
