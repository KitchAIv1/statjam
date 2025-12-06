/**
 * Production-Safe Logger Utility
 * 
 * - Silent in production builds (no console noise)
 * - Full emoji debug logs in development
 * - Errors and warnings always logged
 * 
 * Usage:
 *   import { logger } from '@/lib/utils/logger';
 *   logger.debug('🔍 Debug info', data);
 *   logger.info('✅ Success');
 *   logger.warn('⚠️ Warning');
 *   logger.error('❌ Error', error);
 */

const isDev = process.env.NODE_ENV === 'development';

type LogArgs = unknown[];

export const logger = {
  /** Debug logs - only in development */
  debug: (...args: LogArgs): void => {
    if (isDev) console.log(...args);
  },

  /** Info logs - only in development */
  info: (...args: LogArgs): void => {
    if (isDev) console.info(...args);
  },

  /** Warnings - always logged */
  warn: (...args: LogArgs): void => {
    console.warn(...args);
  },

  /** Errors - always logged */
  error: (...args: LogArgs): void => {
    console.error(...args);
  },

  /** Group logs - only in development */
  group: (label: string): void => {
    if (isDev) console.group(label);
  },

  /** Group end - only in development */
  groupEnd: (): void => {
    if (isDev) console.groupEnd();
  },

  /** Table logs - only in development */
  table: (data: unknown): void => {
    if (isDev) console.table(data);
  },
};

export default logger;

