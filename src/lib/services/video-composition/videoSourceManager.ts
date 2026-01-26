/**
 * Video Source Manager
 * 
 * Manages video element and stream lifecycle.
 * Handles rotation detection for iPhone streams.
 * Extracted from VideoComposer to keep service under 200 lines.
 */

import { detectVideoOrientation, VideoOrientation } from '@/lib/utils/videoRotation';

export class VideoSourceManager {
  private videoElement: HTMLVideoElement | null = null;
  private videoStream: MediaStream | null = null;
  private orientation: VideoOrientation | null = null;
  
  setSource(stream: MediaStream | null): Promise<HTMLVideoElement | null> {
    this.cleanup();
    
    if (!stream) {
      return Promise.resolve(null);
    }
    
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      
      const handleLoadedMetadata = () => {
        video.play()
          .then(() => {
            this.videoElement = video;
            this.videoStream = stream;
            // Detect rotation after video metadata is loaded
            this.orientation = detectVideoOrientation(video);
            resolve(video);
          })
          .catch(err => {
            console.error('Error playing video:', err);
            resolve(null);
          });
      };
      
      video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
      
      // Fallback: if metadata already loaded
      if (video.readyState >= 1) {
        handleLoadedMetadata();
      }
    });
  }
  
  async waitForReady(): Promise<boolean> {
    if (!this.videoElement) {
      return false;
    }
    
    // If already ready and playing, return immediately
    if (this.videoElement.readyState >= 2 && !this.videoElement.paused) {
      return true;
    }
    
    return new Promise((resolve) => {
      let resolved = false;
      
      const handleCanPlay = async () => {
        if (resolved) return;
        resolved = true;
        
        // Ensure video is playing
        try {
          if (this.videoElement!.paused) {
            await this.videoElement!.play();
          }
          resolve(true);
        } catch (err) {
          console.error('Error playing video in waitForReady:', err);
          resolve(false);
        }
      };
      
      const handlePlaying = () => {
        if (resolved) return;
        resolved = true;
        resolve(true);
      };
      
      this.videoElement!.addEventListener('canplay', handleCanPlay, { once: true });
      this.videoElement!.addEventListener('playing', handlePlaying, { once: true });
      
      // If already can play, trigger immediately
      if (this.videoElement.readyState >= 2) {
        handleCanPlay();
      }
      
      // Timeout after 5 seconds
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(false);
        }
      }, 5000);
    });
  }
  
  getVideoElement(): HTMLVideoElement | null {
    return this.videoElement;
  }
  
  getOrientation(): VideoOrientation | null {
    return this.orientation;
  }
  
  needsRotation(): boolean {
    return this.orientation?.needsRotation ?? false;
  }
  
  cleanup(): void {
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
    
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
    }
  }
}

