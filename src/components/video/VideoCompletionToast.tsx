// ============================================================================
// VIDEO COMPLETION TOAST - Rich notification for completed video/tracking
// Follows .cursorrules: Single responsibility, <100 lines, reusable
// ============================================================================

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Play, X, Clock, Trophy, Copy, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CompletionType = 'video_ready' | 'tracking_complete';

interface VideoCompletionToastProps {
  type: CompletionType;
  gameName: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  gameViewerUrl?: string;
  onAction?: () => void;
  onCopyLink?: () => void;
  onDismiss: () => void;
}

const CONFIG: Record<CompletionType, { 
  title: string; 
  subtitle: string; 
  actionLabel: string;
  icon: React.ElementType;
  gradient: string;
}> = {
  video_ready: {
    title: 'Video Ready!',
    subtitle: 'is ready for stat tracking',
    actionLabel: 'Start Tracking',
    icon: Play,
    gradient: 'from-blue-500 to-cyan-500',
  },
  tracking_complete: {
    title: 'Game Complete!',
    subtitle: 'is now live on Game Viewer',
    actionLabel: 'View Game',
    icon: Trophy,
    gradient: 'from-green-500 to-emerald-500',
  },
};

export function VideoCompletionToast({
  type,
  gameName,
  thumbnailUrl,
  durationSeconds,
  gameViewerUrl,
  onAction,
  onCopyLink,
  onDismiss,
}: VideoCompletionToastProps) {
  const config = CONFIG[type];
  const Icon = config.icon;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="w-[380px] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
    >
      {/* Header */}
      <div className={cn('px-4 py-3 flex items-center justify-between bg-gradient-to-r', config.gradient)}>
        <div className="flex items-center gap-2 text-white">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-bold text-sm">{config.title}</span>
        </div>
        <button onClick={onDismiss} className="text-white/80 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex gap-3">
          {/* Thumbnail */}
          <div className="relative w-20 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200">
                <Icon className="w-6 h-6 text-orange-500" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{gameName}</p>
            <p className="text-xs text-gray-500 mt-0.5">{config.subtitle}</p>
            {durationSeconds && (
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" />
                {formatDuration(durationSeconds)}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          {onAction && (
            <button
              onClick={() => { onAction(); onDismiss(); }}
              className={cn(
                'flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all',
                'bg-gradient-to-r text-white flex items-center justify-center gap-2',
                config.gradient, 'hover:opacity-90'
              )}
            >
              <Icon className="w-4 h-4" />
              {config.actionLabel}
            </button>
          )}
          {type === 'tracking_complete' && onCopyLink && gameViewerUrl && (
            <button
              onClick={onCopyLink}
              className="px-3 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              title="Copy game viewer link"
            >
              <Copy className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
