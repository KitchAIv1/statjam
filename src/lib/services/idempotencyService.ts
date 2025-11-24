/**
 * IdempotencyService - Prevent Duplicate Writes
 * 
 * PURPOSE:
 * - Generate unique idempotency keys for stat writes
 * - Prevent duplicate recordings on retry or network failure
 * - Ensure idempotent operations (same key = same result)
 * 
 * ARCHITECTURE:
 * - Client-side UUID generation (v4)
 * - Database unique constraint prevents duplicates
 * - Returns existing record if duplicate key found
 * 
 * Follows .cursorrules: <200 lines, single responsibility, PascalCase naming
 */

/**
 * Generate a unique idempotency key for a stat write
 * Uses UUID v4 (random) for uniqueness
 */
export function generateIdempotencyKey(): string {
  // Use crypto.randomUUID() if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for older browsers (shouldn't happen in modern Next.js)
  // Generate UUID v4 manually
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Check if an error is a duplicate key error (idempotency violation)
 * PostgreSQL error code 23505 = unique_violation
 */
export function isDuplicateKeyError(error: any): boolean {
  if (!error) return false;
  
  // Check for PostgreSQL unique constraint violation
  if (error.code === '23505') {
    return true;
  }
  
  // Check error message for duplicate key indicators
  const errorMessage = error.message || error.toString() || '';
  return (
    errorMessage.includes('duplicate key') ||
    errorMessage.includes('unique constraint') ||
    errorMessage.includes('idempotency_key')
  );
}

/**
 * Extract existing record ID from duplicate key error (if available)
 * Some databases return the existing record in error details
 */
export function extractExistingRecordId(error: any): string | null {
  if (!error) return null;
  
  // Check error details for existing record ID
  if (error.details?.id) {
    return error.details.id;
  }
  
  // Check error hint for record ID
  if (error.hint) {
    const idMatch = error.hint.match(/id[=:]\s*([a-f0-9-]+)/i);
    if (idMatch) {
      return idMatch[1];
    }
  }
  
  return null;
}

/**
 * IdempotencyService - Main service class
 */
export class IdempotencyService {
  /**
   * Generate idempotency key for stat recording
   * Key should be generated BEFORE the write attempt
   */
  static generateKey(): string {
    return generateIdempotencyKey();
  }

  /**
   * Check if error indicates duplicate (idempotent operation already completed)
   */
  static isDuplicateError(error: any): boolean {
    return isDuplicateKeyError(error);
  }

  /**
   * Handle duplicate key error - return success (idempotent operation)
   * The write already succeeded, so we treat this as success
   */
  static handleDuplicateError(error: any): { isDuplicate: boolean; existingRecordId?: string } {
    if (!this.isDuplicateError(error)) {
      return { isDuplicate: false };
    }

    const existingRecordId = extractExistingRecordId(error);
    return {
      isDuplicate: true,
      existingRecordId: existingRecordId || undefined
    };
  }
}

