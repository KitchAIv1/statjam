'use client';

/**
 * JumpballSyncModal - Clock sync setup wizard
 * 
 * Guides user through marking the jumpball timestamp to sync
 * video time with game clock.
 * 
 * Uses iframe embed for video display with manual time input
 * (Bunny.net postMessage events are unreliable).
 * 
 * @module JumpballSyncModal
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft,
  Loader2,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { ClockSyncConfig } from '@/lib/types/video';
import { VIDEO_CONFIG, getBunnyConfig } from '@/lib/config/videoConfig';

interface JumpballSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (config: ClockSyncConfig) => void;
  videoId: string;
}

type QuarterLength = 8 | 10 | 12;

export function JumpballSyncModal({
  isOpen,
  onClose,
  onComplete,
  videoId,
}: JumpballSyncModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [quarterLength, setQuarterLength] = useState<QuarterLength>(12);
  const [jumpballTimestamp, setJumpballTimestamp] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Manual time input state
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  
  // Get embed URL for iframe
  const config = getBunnyConfig();
  const embedUrl = `https://iframe.mediadelivery.net/embed/${config.libraryId}/${videoId}?autoplay=false&preload=true`;

  // Reset loading state when iframe loads
  useEffect(() => {
    if (step === 2) {
      setIsLoading(true);
    }
  }, [step]);

  // Parse manual time input to milliseconds
  const parseManualTime = (): number | null => {
    const mins = parseInt(minutes) || 0;
    const secs = parseInt(seconds) || 0;
    
    if (mins < 0 || secs < 0 || secs >= 60) {
      return null;
    }
    
    return (mins * 60 + secs) * 1000;
  };
  
  // Mark jumpball from manual input
  const markJumpball = () => {
    const timeMs = parseManualTime();
    if (timeMs !== null && timeMs >= 0) {
      setJumpballTimestamp(timeMs);
    }
  };
  
  // Format time for display
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Go to next step
  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2 && jumpballTimestamp !== null) {
      console.log(`🎯 JUMPBALL SYNC COMPLETE: inputMins=${minutes}, inputSecs=${seconds}, jumpballMs=${jumpballTimestamp}, quarterLen=${quarterLength}`);
      onComplete({
        jumpballTimestampMs: jumpballTimestamp,
        halftimeTimestampMs: null,
        quarterLengthMinutes: quarterLength,
      });
    }
  };
  
  // Go back
  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      onClose();
    }
  };
  
  // Reset state on close
  const handleClose = () => {
    setStep(1);
    setJumpballTimestamp(null);
    setMinutes('');
    setSeconds('');
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Clock className="w-5 h-5 text-orange-500" />
            Sync Game Clock to Video
          </DialogTitle>
          <DialogDescription>
            {step === 1 
              ? 'Step 1: Select the quarter length for this game'
              : 'Step 2: Find and mark the jumpball (tip-off) moment'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-6">
          {/* Step 1: Quarter Length */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Quarter Length
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {VIDEO_CONFIG.quarterLengths.map((length) => (
                    <button
                      key={length}
                      onClick={() => setQuarterLength(length)}
                      className={`
                        p-4 rounded-xl border-2 text-center transition-all
                        ${quarterLength === length
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="text-2xl font-bold mb-1">{length}</div>
                      <div className="text-sm text-gray-500">minutes</div>
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-sm text-gray-500">
                  Select the length of each quarter. Most youth leagues use 8 minutes,
                  high school uses 8 minutes, college uses 20-minute halves (set to 10),
                  and NBA uses 12 minutes.
                </p>
              </div>
            </div>
          )}
          
          {/* Step 2: Mark Jumpball */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Video Player - Bunny.net Embed */}
              <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
                <iframe
                  ref={iframeRef}
                  src={embedUrl}
                  className="w-full h-full"
                  style={{ border: 'none' }}
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  onLoad={() => setIsLoading(false)}
                />
              </div>
              
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800 mb-1">
                      How to Mark the Jumpball
                    </h4>
                    <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
                      <li>Use the video player above to find the jumpball moment</li>
                      <li>Pause when the referee tosses the ball</li>
                      <li>Look at the timestamp shown in the video player</li>
                      <li>Enter that time below (minutes and seconds)</li>
                    </ol>
                  </div>
                </div>
              </div>
              
              {/* Manual Time Input */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Enter Jumpball Timestamp
                </label>
                <div className="flex items-center justify-center gap-2">
                  <div className="flex flex-col items-center">
                    <input
                      type="number"
                      min="0"
                      max="999"
                      placeholder="0"
                      value={minutes}
                      onChange={(e) => setMinutes(e.target.value)}
                      className="w-20 h-12 text-center text-2xl font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    <span className="text-xs text-gray-500 mt-1">minutes</span>
                  </div>
                  <span className="text-3xl font-bold text-gray-400 mb-4">:</span>
                  <div className="flex flex-col items-center">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="00"
                      value={seconds}
                      onChange={(e) => setSeconds(e.target.value)}
                      className="w-20 h-12 text-center text-2xl font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    <span className="text-xs text-gray-500 mt-1">seconds</span>
                  </div>
                </div>
              </div>
              
              {/* Mark Button */}
              <div className="flex flex-col items-center gap-3">
                <Button
                  size="lg"
                  onClick={markJumpball}
                  disabled={!minutes && !seconds}
                  className={`
                    px-8 py-6 text-lg
                    ${jumpballTimestamp !== null
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-orange-500 hover:bg-orange-600'
                    }
                  `}
                >
                  {jumpballTimestamp !== null ? (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Jumpball Marked at {formatTime(jumpballTimestamp)}
                    </>
                  ) : (
                    `Mark Jumpball (Q1 ${quarterLength}:00)`
                  )}
                </Button>
                {jumpballTimestamp !== null && (
                  <p className="text-sm text-gray-500">
                    Update the time above and click again to change
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-6 pt-4 border-t bg-gray-50 flex justify-between">
          <Button variant="outline" onClick={handleBack}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={step === 2 && jumpballTimestamp === null}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {step === 1 ? 'Next' : 'Confirm & Start Tracking'}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

