// ============================================================================
// VIDEO STATUS BADGE - Inline status indicator for video/tracking status
// Follows .cursorrules: Single responsibility, <50 lines, reusable
// ============================================================================

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, Loader2, AlertCircle, Upload, Play, Trophy } from 'lucide-react';

export type VideoStatus = 'uploading' | 'processing' | 'ready' | 'tracking' | 'completed' | 'failed';

interface VideoStatusBadgeProps {
  status: VideoStatus;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<VideoStatus, { 
  icon: React.ElementType; 
  label: string; 
  className: string;
  animate?: boolean;
}> = {
  uploading: { icon: Upload, label: 'Uploading', className: 'bg-blue-100 text-blue-700', animate: true },
  processing: { icon: Loader2, label: 'Processing', className: 'bg-amber-100 text-amber-700', animate: true },
  ready: { icon: Play, label: 'Ready', className: 'bg-cyan-100 text-cyan-700' },
  tracking: { icon: Loader2, label: 'Tracking', className: 'bg-orange-100 text-orange-700', animate: true },
  completed: { icon: Trophy, label: 'Completed', className: 'bg-green-100 text-green-700' },
  failed: { icon: AlertCircle, label: 'Failed', className: 'bg-red-100 text-red-700' },
};

export function VideoStatusBadge({ 
  status, 
  size = 'sm', 
  showLabel = true,
  className 
}: VideoStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1';

  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full font-medium',
      padding, textSize, config.className, className
    )}>
      <Icon className={cn(iconSize, config.animate && 'animate-spin')} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
