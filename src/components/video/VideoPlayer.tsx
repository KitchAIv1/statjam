'use client';

/**
 * VideoPlayer - Custom video player for stat tracking
 * 
 * Provides video playback with custom controls overlay.
 * Supports frame-by-frame stepping, playback speed, and seek bar.
 * 
 * @module VideoPlayer
 */

import React, { useEffect, useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Slider } from '@/components/ui/slider';
import type { VideoPlayerState, VideoPlayerControls, PlaybackSpeed } from '@/lib/types/video';
import { VIDEO_CONFIG } from '@/lib/config/videoConfig';

interface VideoPlayerProps {
  videoUrl: string;
  state: VideoPlayerState;
  controls: VideoPlayerControls;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  showGameClock?: string;
  showVideoTime?: boolean;
  className?: string;
}

const PLAYBACK_SPEEDS: PlaybackSpeed[] = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

export function VideoPlayer({
  videoUrl,
  state,
  controls,
  videoRef,
  showGameClock,
  showVideoTime = true,
  className = '',
}: VideoPlayerProps) {
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Format time as MM:SS or HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Auto-hide controls after inactivity
  const resetControlsTimeout = () => {
    if (controlsTimeout) clearTimeout(controlsTimeout);
    setShowControls(true);
    
    const timeout = setTimeout(() => {
      if (state.playing) setShowControls(false);
    }, 3000);
    setControlsTimeout(timeout);
  };
  
  // Handle seek bar change
  const handleSeekChange = (value: number[]) => {
    const time = value[0];
    controls.seek(time);
  };
  
  // Handle playback speed change
  const handleSpeedChange = () => {
    const currentIndex = PLAYBACK_SPEEDS.indexOf(state.playbackRate);
    const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length;
    controls.setPlaybackRate(PLAYBACK_SPEEDS[nextIndex]);
  };
  
  useEffect(() => {
    return () => {
      if (controlsTimeout) clearTimeout(controlsTimeout);
    };
  }, [controlsTimeout]);
  
  return (
    <div 
      className={`relative bg-black rounded-lg overflow-hidden ${className}`}
      onMouseMove={resetControlsTimeout}
      onMouseEnter={() => setShowControls(true)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full"
        playsInline
        onClick={controls.togglePlayPause}
        onError={(e) => {
          console.error('Video load error:', e);
          console.error('Video URL:', videoUrl);
          const video = e.currentTarget;
          console.error('Video error code:', video.error?.code, video.error?.message);
        }}
      />
      
      {/* Buffering Indicator */}
      {state.buffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      )}
      
      {/* Time Display Overlay */}
      {(showVideoTime || showGameClock) && (
        <div className="absolute top-4 left-4 flex gap-3">
          {showVideoTime && (
            <div className="bg-black/70 text-white px-3 py-1.5 rounded-lg text-sm font-mono">
              Video: {formatTime(state.currentTime)}
            </div>
          )}
          {showGameClock && (
            <div className="bg-orange-500/90 text-white px-3 py-1.5 rounded-lg text-sm font-bold">
              {showGameClock}
            </div>
          )}
        </div>
      )}
      
      {/* Play/Pause Overlay (center) */}
      {!state.playing && !state.buffering && (
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={controls.togglePlayPause}
        >
          <div className="bg-black/50 rounded-full p-4">
            <Play className="w-12 h-12 text-white fill-white" />
          </div>
        </div>
      )}
      
      {/* Controls Overlay (bottom) */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-200 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Seek Bar */}
        <div className="mb-3">
          <Slider
            value={[isFinite(state.currentTime) ? state.currentTime : 0]}
            min={0}
            max={isFinite(state.duration) && state.duration > 0 ? state.duration : 100}
            step={0.1}
            onValueChange={handleSeekChange}
            className="cursor-pointer"
          />
        </div>
        
        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          {/* Left: Playback controls */}
          <div className="flex items-center gap-2">
            {/* Skip Back 10s */}
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              onClick={() => controls.seekRelative(-10)}
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            
            {/* Frame Back */}
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              onClick={() => controls.stepFrame('backward')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 h-10 w-10 p-0"
              onClick={controls.togglePlayPause}
            >
              {state.playing ? (
                <Pause className="w-5 h-5 fill-white" />
              ) : (
                <Play className="w-5 h-5 fill-white" />
              )}
            </Button>
            
            {/* Frame Forward */}
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              onClick={() => controls.stepFrame('forward')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            
            {/* Skip Forward 10s */}
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              onClick={() => controls.seekRelative(10)}
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Center: Time display */}
          <div className="text-white text-sm font-mono">
            {formatTime(state.currentTime)} / {formatTime(state.duration)}
          </div>
          
          {/* Right: Speed and Volume */}
          <div className="flex items-center gap-2">
            {/* Playback Speed */}
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 h-8 px-2 text-xs font-mono"
              onClick={handleSpeedChange}
            >
              {state.playbackRate}x
            </Button>
            
            {/* Volume */}
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              onClick={controls.toggleMute}
            >
              {state.muted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

