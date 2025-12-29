'use client';

/**
 * ClipValidationBanner - Displays warning when clips exceed video duration
 * 
 * Shows a summary of valid vs invalid clips and allows user to proceed
 * with valid clips only or take corrective action.
 * 
 * @module ClipValidationBanner
 */

import React from 'react';
import { AlertTriangle, CheckCircle, Clock, Film } from 'lucide-react';
import type { ClipValidationResult } from '@/lib/services/clipService';

interface ClipValidationBannerProps {
  validation: ClipValidationResult;
  onProceedWithValid?: () => void;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function ClipValidationBanner({ 
  validation, 
  onProceedWithValid 
}: ClipValidationBannerProps) {
  const { videoDurationMs, totalClips, validClips, invalidClips, hasIssue } = validation;
  const validPercentage = totalClips > 0 ? Math.round((validClips / totalClips) * 100) : 0;

  // No issue - show success state
  if (!hasIssue) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800">
              All {totalClips} clips are within video range
            </p>
            <p className="text-xs text-green-600 mt-0.5">
              Video duration: {formatDuration(videoDurationMs)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Has issue - show warning
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-800">
            Video Duration Mismatch
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Some clips exceed the uploaded video length and will be skipped.
          </p>
          
          {/* Stats summary */}
          <div className="flex items-center gap-4 mt-3 text-xs">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-amber-800">
                Video: <strong>{formatDuration(videoDurationMs)}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-green-600" />
              <span className="text-green-700">
                Valid: <strong>{validClips}</strong> ({validPercentage}%)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-red-500" />
              <span className="text-red-600">
                Out of range: <strong>{invalidClips}</strong>
              </span>
            </div>
          </div>

          {/* Action hint */}
          <p className="text-xs text-amber-600 mt-3 italic">
            💡 Tip: Check if the correct video was uploaded or verify jumpball sync timing.
          </p>
        </div>
      </div>
    </div>
  );
}

