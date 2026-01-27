/**
 * 🔒 LOGIN RATE LIMITER SERVICE
 * 
 * Brute force protection for authentication endpoints.
 * Tracks failed login attempts by email and enforces lockout.
 * 
 * Single responsibility: Manage login attempt tracking and lockout state.
 * 
 * @filesize ~60 lines (compliant with .cursorrules < 200)
 */

import { logger } from '@/lib/utils/logger';

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
  maxAttempts: 5,              // Lock after 5 failed attempts
  lockoutDurationMs: 15 * 60 * 1000,  // 15 minutes lockout
  cleanupIntervalMs: 5 * 60 * 1000,   // Cleanup every 5 minutes
};

// ═══════════════════════════════════════════════════════════════
// ATTEMPT TRACKING (In-Memory)
// ═══════════════════════════════════════════════════════════════

interface AttemptRecord {
  attempts: number;
  lockedUntil: number | null;
  lastAttempt: number;
}

const attemptMap = new Map<string, AttemptRecord>();

// Periodic cleanup of expired records
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [email, record] of attemptMap.entries()) {
      // Remove if lockout expired and no recent attempts
      if (record.lockedUntil && record.lockedUntil < now) {
        attemptMap.delete(email);
      }
    }
  }, CONFIG.cleanupIntervalMs);
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

/**
 * Check if an email is currently locked out
 * Returns lockout info if locked, null if allowed
 */
export function checkLockout(email: string): { locked: boolean; remainingMs?: number; message?: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const record = attemptMap.get(normalizedEmail);
  
  if (!record || !record.lockedUntil) {
    return { locked: false };
  }
  
  const now = Date.now();
  if (record.lockedUntil > now) {
    const remainingMs = record.lockedUntil - now;
    const remainingMin = Math.ceil(remainingMs / 60000);
    logger.warn(`🔒 Login blocked for ${normalizedEmail} - ${remainingMin} min remaining`);
    return {
      locked: true,
      remainingMs,
      message: `Too many failed attempts. Please try again in ${remainingMin} minute${remainingMin > 1 ? 's' : ''}.`,
    };
  }
  
  // Lockout expired - clear record
  attemptMap.delete(normalizedEmail);
  return { locked: false };
}

/**
 * Record a failed login attempt
 * Returns true if account is now locked
 */
export function recordFailedAttempt(email: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  const now = Date.now();
  
  const record = attemptMap.get(normalizedEmail) || {
    attempts: 0,
    lockedUntil: null,
    lastAttempt: now,
  };
  
  record.attempts += 1;
  record.lastAttempt = now;
  
  if (record.attempts >= CONFIG.maxAttempts) {
    record.lockedUntil = now + CONFIG.lockoutDurationMs;
    logger.warn(`🔒 Account locked: ${normalizedEmail} after ${record.attempts} failed attempts`);
  }
  
  attemptMap.set(normalizedEmail, record);
  return record.lockedUntil !== null;
}

/**
 * Clear attempts on successful login
 */
export function clearAttempts(email: string): void {
  const normalizedEmail = email.trim().toLowerCase();
  attemptMap.delete(normalizedEmail);
  logger.debug(`✅ Login attempts cleared for: ${normalizedEmail}`);
}

/**
 * Get current attempt count (for testing/debugging)
 */
export function getAttemptCount(email: string): number {
  const normalizedEmail = email.trim().toLowerCase();
  return attemptMap.get(normalizedEmail)?.attempts || 0;
}

// ═══════════════════════════════════════════════════════════════
// EXPORT SERVICE OBJECT
// ═══════════════════════════════════════════════════════════════

export const LoginRateLimiter = {
  checkLockout,
  recordFailedAttempt,
  clearAttempts,
  getAttemptCount,
};
