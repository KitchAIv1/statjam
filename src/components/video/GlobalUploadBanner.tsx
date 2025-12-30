'use client';

/**
 * GlobalUploadBanner - Persistent upload status indicator
 * 
 * Shows upload progress across all coach dashboard pages.
 * Displays warning to not close browser during upload.
 * Shows resume prompt if previous upload was interrupted.
 * 
 * @module GlobalUploadBanner
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { Upload, AlertTriangle, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/Button';
import { useVideoUpload } from '@/contexts/VideoUploadContext';

export function GlobalUploadBanner() {
  const router = useRouter();
  const {
    isUploading,
    progress,
    fileName,
    pendingResume,
    clearPendingResume,
  } = useVideoUpload();

  // Format file size for display
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // Show reminder if there's a pending session (upload was interrupted)
  if (pendingResume && !isUploading) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-50 border-b border-amber-200 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Previous upload was interrupted
              </p>
              <p className="text-xs text-amber-600">
                {pendingResume.fileName} — You may need to restart the upload
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={clearPendingResume}
              className="text-amber-700 border-amber-300 hover:bg-amber-100"
            >
              <X className="w-4 h-4 mr-1" />
              Dismiss
            </Button>
            <Button
              size="sm"
              onClick={() => {
                clearPendingResume();
                // Navigate to the upload page for this game (client-side)
                router.push(`/dashboard/coach/video/${pendingResume.gameId}`);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Upload className="w-4 h-4 mr-1" />
              Go to Upload
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show upload progress if uploading
  if (isUploading && progress && progress.status === 'uploading') {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-blue-50 border-b border-blue-200 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Upload className="w-5 h-5 text-blue-600" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Uploading: {fileName}
                </p>
                <p className="text-xs text-blue-600">
                  {formatSize(progress.bytesUploaded)} / {formatSize(progress.totalBytes)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-blue-700">
                {progress.percentage}%
              </span>
              <div className="flex items-center gap-1 text-amber-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-medium">Do not close this tab</span>
              </div>
            </div>
          </div>
          <Progress value={progress.percentage} className="h-1.5" />
        </div>
      </div>
    );
  }

  // Show processing status
  if (isUploading && progress && progress.status === 'processing') {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-orange-50 border-b border-orange-200 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-orange-800">
            Processing video: {fileName}
          </p>
        </div>
      </div>
    );
  }

  return null;
}

