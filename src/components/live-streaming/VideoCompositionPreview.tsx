/**
 * VideoCompositionPreview Component
 * 
 * Displays composed video stream with overlay.
 * Shows preview of what will be broadcast.
 * 
 * Limits: < 200 lines
 */

'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Video, AlertCircle, Loader2 } from 'lucide-react';

interface VideoCompositionPreviewProps {
  composedStream: MediaStream | null;
  isComposing: boolean;
  error: string | null;
  onStart?: () => void;
  onStop?: () => void;
}

export function VideoCompositionPreview({
  composedStream,
  isComposing,
  error,
  onStart,
  onStop,
}: VideoCompositionPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Update video element when stream changes
  useEffect(() => {
    if (videoRef.current && composedStream) {
      videoRef.current.srcObject = composedStream;
      videoRef.current.play().catch(err => {
        console.error('Error playing composed stream:', err);
      });
    } else if (videoRef.current && !composedStream) {
      videoRef.current.srcObject = null;
    }
  }, [composedStream]);
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Composition Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Broadcast Preview
        </CardTitle>
        <CardDescription>
          Preview of composed stream (video + overlay)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          {isComposing && composedStream ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />
              <div className="absolute top-2 right-2">
                <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  LIVE
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                {isComposing ? (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Starting composition...</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Click "Start Composition" to begin</p>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex gap-2">
          {!isComposing ? (
            <Button onClick={onStart} className="w-full">
              Start Composition
            </Button>
          ) : (
            <Button onClick={onStop} variant="destructive" className="w-full">
              Stop Composition
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

