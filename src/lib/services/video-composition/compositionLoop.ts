/**
 * Composition Loop
 * 
 * Handles the frame-by-frame composition logic.
 * Extracted from VideoComposer to keep service under 200 lines.
 */

import { GameOverlayData } from '../canvas-overlay';
import { CanvasOverlayRenderer } from '../canvas-overlay';

export interface CompositionLoopCallbacks {
  onError?: (error: Error) => void;
  onStop?: () => void;
}

export class CompositionLoop {
  private ctx: CanvasRenderingContext2D;
  private overlayRenderer: CanvasOverlayRenderer;
  private videoElement: HTMLVideoElement;
  private width: number;
  private height: number;
  private animationFrameId: number | null = null;
  private isRunning = false;
  private frameCount = 0;
  private currentOverlayData: GameOverlayData | null = null;
  private callbacks: CompositionLoopCallbacks = {};
  
  constructor(
    ctx: CanvasRenderingContext2D,
    overlayRenderer: CanvasOverlayRenderer,
    videoElement: HTMLVideoElement,
    width: number,
    height: number
  ) {
    this.ctx = ctx;
    this.overlayRenderer = overlayRenderer;
    this.videoElement = videoElement;
    this.width = width;
    this.height = height;
  }
  
  start(initialOverlayData: GameOverlayData, callbacks?: CompositionLoopCallbacks): void {
    if (this.isRunning) {
      console.warn('CompositionLoop: Already running');
      return;
    }
    
    console.log('CompositionLoop.start: Starting composition loop');
    this.isRunning = true;
    this.frameCount = 0;
    this.currentOverlayData = initialOverlayData;
    this.callbacks = callbacks || {};
    
    this.composeFrame(initialOverlayData);
  }
  
  updateOverlayData(overlayData: GameOverlayData): void {
    if (!this.isRunning) {
      return;
    }
    
    this.currentOverlayData = overlayData;
  }
  
  stop(): void {
    if (!this.isRunning) {
      return;
    }
    
    console.log('CompositionLoop.stop: Stopping composition loop');
    this.isRunning = false;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  getFrameCount(): number {
    return this.frameCount;
  }
  
  private async composeFrame(overlayData: GameOverlayData): Promise<void> {
    if (!this.isRunning) {
      return;
    }
    
    try {
      // Check if video is ready to draw
      if (this.videoElement.readyState < 2) {
        // Video not ready yet, schedule next frame without drawing
        this.animationFrameId = requestAnimationFrame(() => {
          this.composeFrame(overlayData);
        });
        return;
      }
      
      // Check if video is playing
      if (this.videoElement.paused) {
        try {
          await this.videoElement.play();
        } catch (playError) {
          console.warn('Video play error (non-fatal):', playError);
          // Continue anyway - video might still have frames
        }
      }
      
      const dataToRender = this.currentOverlayData || overlayData;
      
      // Draw video frame (only if video has dimensions)
      if (this.videoElement.videoWidth > 0 && this.videoElement.videoHeight > 0) {
        try {
          this.ctx.drawImage(
            this.videoElement,
            0,
            0,
            this.width,
            this.height
          );
        } catch (drawError) {
          console.warn('Video drawImage error (non-fatal):', drawError);
          // Fill with black if draw fails
          this.ctx.fillStyle = '#000000';
          this.ctx.fillRect(0, 0, this.width, this.height);
        }
      } else {
        // Video not ready, fill with black
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);
      }
      
      // Render overlay on top
      try {
        const overlayCanvas = await this.overlayRenderer.render(dataToRender);
        this.ctx.drawImage(overlayCanvas, 0, 0);
      } catch (overlayError) {
        console.warn('Overlay render error (non-fatal):', overlayError);
        // Continue without overlay if render fails
      }
      
      this.frameCount++;
      
      // Schedule next frame
      this.animationFrameId = requestAnimationFrame(() => {
        const nextData = this.currentOverlayData || dataToRender;
        this.composeFrame(nextData);
      });
      
    } catch (error) {
      console.error('Composition frame error:', error);
      console.error('Error details:', {
        error,
        videoReadyState: this.videoElement.readyState,
        videoPaused: this.videoElement.paused,
        videoWidth: this.videoElement.videoWidth,
        videoHeight: this.videoElement.videoHeight,
        isRunning: this.isRunning,
      });
      
      const err = error instanceof Error ? error : new Error('Unknown composition error');
      
      // Report error but don't stop - continue trying
      if (this.callbacks.onError) {
        this.callbacks.onError(err);
      }
      
      // Don't auto-stop - keep trying
      // Schedule next frame anyway
      if (this.isRunning) {
        this.animationFrameId = requestAnimationFrame(() => {
          this.composeFrame(overlayData);
        });
      }
    }
  }
}

