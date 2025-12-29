'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, X, Maximize2, Volume2, VolumeX } from 'lucide-react';

interface ClipPlayerProps {
  clipUrl: string;
  title: string;
  onClose?: () => void;
  autoPlay?: boolean;
}

/**
 * Video player component for clips
 * Supports inline and modal playback
 */
export function ClipPlayer({ clipUrl, title, onClose, autoPlay = false }: ClipPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Auto-play when video is loaded (muted first to bypass browser restrictions)
  useEffect(() => {
    if (autoPlay && videoRef.current && isLoaded) {
      videoRef.current.muted = true;
      videoRef.current.play().then(() => {
        // Unmute after successful play
        if (videoRef.current) {
          videoRef.current.muted = false;
          setIsMuted(false);
        }
      }).catch((err) => {
        console.log('Autoplay blocked:', err);
      });
    }
  }, [autoPlay, isLoaded]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const percent = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(percent);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = percent * videoRef.current.duration;
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div className="relative bg-black rounded-lg overflow-hidden group">
      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Video */}
      <video
        ref={videoRef}
        src={clipUrl}
        className="w-full aspect-video"
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onLoadedData={() => setIsLoaded(true)}
        onCanPlay={() => setIsLoaded(true)}
        playsInline
        preload="auto"
      />

      {/* Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Progress Bar */}
        <div
          className="h-1 bg-white/30 rounded-full mb-2 cursor-pointer"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-orange-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayPause}
              className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-white" />
              ) : (
                <Play className="w-4 h-4 text-white" />
              )}
            </button>
            <button
              onClick={handleMuteToggle}
              className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-white" />
              ) : (
                <Volume2 className="w-4 h-4 text-white" />
              )}
            </button>
          </div>

          <span className="text-xs text-white/70 truncate max-w-[150px]">{title}</span>

          <button
            onClick={handleFullscreen}
            className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
          >
            <Maximize2 className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Play Button Overlay (when paused) */}
      {!isPlaying && (
        <button
          onClick={handlePlayPause}
          className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors"
        >
          <div className="w-16 h-16 rounded-full bg-orange-500/90 flex items-center justify-center">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </button>
      )}
    </div>
  );
}

