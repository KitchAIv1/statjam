'use client';

/**
 * VideoProcessingStatus - Display video processing progress
 * Shows encoding progress with option to continue in background
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Video, ArrowLeft } from 'lucide-react';

interface ProcessingStatus {
  encodeProgress?: number;
}

interface VideoProcessingStatusProps {
  processingStatus: ProcessingStatus | null;
  backUrl?: string;
}

export function VideoProcessingStatus({ 
  processingStatus, 
  backUrl = '/dashboard/coach' 
}: VideoProcessingStatusProps) {
  const router = useRouter();
  const progress = processingStatus?.encodeProgress;
  const hasProgress = progress !== undefined && progress > 0;

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full border border-white/10 text-center">
        {/* Animated spinner */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-purple-500/20" />
          <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
          <Video className="absolute inset-0 m-auto w-8 h-8 text-purple-400" />
        </div>
        
        <h2 className="text-xl font-semibold text-white">Processing Your Video</h2>
        
        {hasProgress ? (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Encoding</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="text-gray-400 mt-3 text-sm">
            Transcoding video for optimal playback...
          </p>
        )}
        
        <p className="text-gray-500 mt-4 text-xs">
          Large files may take 5-15 minutes. You can continue in the background.
        </p>
        
        <div className="mt-6 flex flex-col gap-3">
          <Button
            variant="outline"
            onClick={() => router.push(backUrl)}
            className="w-full gap-2 border-white/20 text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue in Background
          </Button>
          <p className="text-gray-500 text-xs">
            We&apos;ll save your progress. Come back anytime to check status.
          </p>
        </div>
      </div>
    </div>
  );
}

