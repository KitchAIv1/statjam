/**
 * NotificationService - Platform-agnostic notification layer
 * 
 * This service wraps Sonner (web) to provide a consistent notification API.
 * Future: Can be swapped for react-native-toast-message on mobile without
 * changing caller code.
 * 
 * Usage:
 *   import { notify } from '@/lib/services/notificationService';
 *   notify.success('Player added successfully');
 *   notify.error('Failed to save', 'Please check your connection');
 */

import { toast } from 'sonner';

/**
 * Notification service with platform abstraction
 */
export const notify = {
  /**
   * Show success notification
   * @param message - Main message
   * @param description - Optional additional details
   */
  success: (message: string, description?: string) => {
    return toast.success(message, { 
      description,
      duration: 4000,
    });
  },

  /**
   * Show error notification
   * @param message - Main error message
   * @param description - Optional error details or suggestion
   */
  error: (message: string, description?: string) => {
    return toast.error(message, { 
      description,
      duration: 6000, // Longer for errors
    });
  },

  /**
   * Show warning notification
   * @param message - Warning message
   * @param description - Optional warning details
   */
  warning: (message: string, description?: string) => {
    return toast.warning(message, { 
      description,
      duration: 5000,
    });
  },

  /**
   * Show info notification
   * @param message - Info message
   * @param description - Optional additional info
   */
  info: (message: string, description?: string) => {
    return toast.info(message, { 
      description,
      duration: 4000,
    });
  },

  /**
   * Show loading notification
   * @param message - Loading message
   * @returns Toast ID that can be used to dismiss or update
   */
  loading: (message: string) => {
    return toast.loading(message);
  },

  /**
   * Dismiss a specific toast
   * @param id - Toast ID returned from other methods
   */
  dismiss: (id: string | number) => {
    toast.dismiss(id);
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    toast.dismiss();
  },

  /**
   * Show a promise-based toast (auto-updates on resolve/reject)
   * @param promise - Promise to track
   * @param messages - Messages for each state
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return toast.promise(promise, messages);
  },
};

/**
 * Common notification patterns for reuse
 */
export const commonNotifications = {
  // Network errors
  networkError: () => notify.error(
    'No internet connection',
    'Please check your network and try again'
  ),

  // Session errors
  sessionExpired: () => notify.error(
    'Session expired',
    'Please sign in again to continue'
  ),

  // Permission errors
  permissionDenied: () => notify.error(
    'Permission denied',
    'You don\'t have permission to perform this action'
  ),

  // Generic success
  saveSuccess: () => notify.success('Saved successfully'),

  // Generic errors
  saveFailed: () => notify.error(
    'Failed to save',
    'Please try again in a moment'
  ),

  serverError: () => notify.error(
    'Server error',
    'Our server encountered an error. Please try again'
  ),
};

