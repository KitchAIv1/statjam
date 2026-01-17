// ============================================================================
// VIDEO NOTIFICATION SERVICE - Trigger video/tracking completion notifications
// Follows .cursorrules: Single responsibility, <80 lines, extends notificationService
// ============================================================================

import { toast } from 'sonner';
import { VideoCompletionToast, CompletionType } from '@/components/video/VideoCompletionToast';
import { createElement } from 'react';

export interface VideoNotificationData {
  gameId: string;
  gameName: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
}

/**
 * Video-specific notification service
 * Extends base notificationService with rich video completion toasts
 */
export const videoNotify = {
  /**
   * Show notification when video processing is complete (ready for tracking)
   */
  videoReady: (data: VideoNotificationData, onStartTracking?: () => void) => {
    return toast.custom(
      (t) => createElement(VideoCompletionToast, {
        type: 'video_ready' as CompletionType,
        gameName: data.gameName,
        thumbnailUrl: data.thumbnailUrl,
        durationSeconds: data.durationSeconds,
        onAction: onStartTracking,
        onDismiss: () => toast.dismiss(t),
      }),
      {
        duration: 10000,
        position: 'bottom-right',
      }
    );
  },

  /**
   * Show notification when stat admin completes game tracking
   */
  trackingComplete: (
    data: VideoNotificationData, 
    onViewGame?: () => void,
    onCopyLink?: () => void
  ) => {
    const gameViewerUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/game-viewer/${data.gameId}`;
    
    return toast.custom(
      (t) => createElement(VideoCompletionToast, {
        type: 'tracking_complete' as CompletionType,
        gameName: data.gameName,
        thumbnailUrl: data.thumbnailUrl,
        durationSeconds: data.durationSeconds,
        gameViewerUrl,
        onAction: onViewGame,
        onCopyLink: onCopyLink || (() => {
          navigator.clipboard.writeText(gameViewerUrl);
          toast.success('Link copied!', { duration: 2000 });
        }),
        onDismiss: () => toast.dismiss(t),
      }),
      {
        duration: 15000, // Longer for important completion
        position: 'bottom-right',
      }
    );
  },

  /**
   * Show simple success notification for tracking milestones
   */
  milestone: (message: string, description?: string) => {
    return toast.success(message, {
      description,
      duration: 4000,
    });
  },
};
