'use client';

import React from 'react';
import {
  Film,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  PlayCircle,
  Pause,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import { ClipGenerationJob } from '@/lib/services/clipService';

interface ClipJobProgressProps {
  job: ClipGenerationJob;
  gameName: string;
  onViewClips?: () => void;
  onRetry?: () => void;
  onCancel?: () => void;
}

/**
 * Clip job progress card
 * Shows status, progress bar, and actions
 */
export function ClipJobProgress({
  job,
  gameName,
  onViewClips,
  onRetry,
  onCancel,
}: ClipJobProgressProps) {
  // Calculate progress percentage
  const progress = job.total_clips > 0
    ? ((job.completed_clips + job.failed_clips) / job.total_clips) * 100
    : 0;

  // Status icon and color
  const getStatusInfo = () => {
    switch (job.status) {
      case 'pending':
        return {
          icon: <Clock className="w-5 h-5" />,
          color: 'text-yellow-600 bg-yellow-100',
          label: 'Awaiting QC Approval',
        };
      case 'approved':
        return {
          icon: <PlayCircle className="w-5 h-5" />,
          color: 'text-blue-600 bg-blue-100',
          label: 'Approved - Starting',
        };
      case 'processing':
        return {
          icon: <Loader2 className="w-5 h-5 animate-spin" />,
          color: 'text-purple-600 bg-purple-100',
          label: 'Processing',
        };
      case 'completed':
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          color: 'text-green-600 bg-green-100',
          label: 'Complete',
        };
      case 'failed':
        return {
          icon: <XCircle className="w-5 h-5" />,
          color: 'text-red-600 bg-red-100',
          label: 'Failed',
        };
      case 'cancelled':
        return {
          icon: <Pause className="w-5 h-5" />,
          color: 'text-gray-600 bg-gray-100',
          label: 'Cancelled',
        };
      default:
        return {
          icon: <AlertCircle className="w-5 h-5" />,
          color: 'text-gray-600 bg-gray-100',
          label: 'Unknown',
        };
    }
  };

  const statusInfo = getStatusInfo();

  // Format date
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Estimate remaining time
  const getEstimatedTime = (): string | null => {
    if (job.status !== 'processing' || job.completed_clips === 0) return null;
    
    const remaining = job.total_clips - job.completed_clips - job.failed_clips;
    // Assume ~30 seconds per clip
    const secondsRemaining = remaining * 30;
    const minutes = Math.ceil(secondsRemaining / 60);
    
    return minutes > 1 ? `~${minutes} min remaining` : '< 1 min remaining';
  };

  const estimatedTime = getEstimatedTime();

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:border-orange-200 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Status Icon */}
          <div className={`p-2 rounded-lg ${statusInfo.color}`}>
            {statusInfo.icon}
          </div>
          
          {/* Game Info */}
          <div>
            <h3 className="font-semibold text-gray-900">{gameName}</h3>
            <p className="text-sm text-gray-500">{statusInfo.label}</p>
          </div>
        </div>

        {/* Clip Count */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full">
          <Film className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            {job.completed_clips}/{job.total_clips}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      {job.status === 'processing' && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>{Math.round(progress)}% complete</span>
            {estimatedTime && <span>{estimatedTime}</span>}
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-orange-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {job.error_message && (
        <div className="mb-3 p-2 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-sm text-red-600">{job.error_message}</p>
        </div>
      )}

      {/* Stats Row */}
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
        {job.approved_at && (
          <span>Approved: {formatDate(job.approved_at)}</span>
        )}
        {job.completed_at && (
          <span>Completed: {formatDate(job.completed_at)}</span>
        )}
        {job.failed_clips > 0 && (
          <span className="text-red-500">{job.failed_clips} failed</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        {job.status === 'completed' && onViewClips && (
          <button
            onClick={onViewClips}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View Clips
          </button>
        )}

        {(job.status === 'failed' || job.status === 'cancelled') && onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            {job.status === 'cancelled' ? 'Retry Job' : 'Retry Failed'}
          </button>
        )}

        {(job.status === 'pending' || job.status === 'processing') && onCancel && (
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Pause className="w-4 h-4" />
            Cancel
          </button>
        )}

        {job.status === 'pending' && (
          <a
            href={`/dashboard/admin/qc-review/${job.game_id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors ml-auto"
          >
            <CheckCircle className="w-4 h-4" />
            Review & Approve
          </a>
        )}
      </div>
    </div>
  );
}

