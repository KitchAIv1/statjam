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
  private needsRotation: boolean;
  private animationFrameId: number | null = null;
  private isRunning = false;
  private frameCount = 0;
  private currentOverlayData: GameOverlayData | null = null;
  private callbacks: CompositionLoopCallbacks = {};
  
  // Phase 2: Dirty flag optimization - only re-render overlay when data changes
  private cachedOverlayCanvas: HTMLCanvasElement | null = null;
  private lastOverlayDataHash: string | null = null;
  
  constructor(
    ctx: CanvasRenderingContext2D,
    overlayRenderer: CanvasOverlayRenderer,
    videoElement: HTMLVideoElement,
    width: number,
    height: number,
    needsRotation = false
  ) {
    this.ctx = ctx;
    this.overlayRenderer = overlayRenderer;
    this.videoElement = videoElement;
    this.width = width;
    this.height = height;
    this.needsRotation = needsRotation;
    
    if (needsRotation) {
      console.log('🔄 [CompositionLoop] Rotation enabled for portrait video stream');
    }
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
    
    // Clear overlay cache
    this.cachedOverlayCanvas = null;
    this.lastOverlayDataHash = null;
  }
  
  getFrameCount(): number {
    return this.frameCount;
  }
  
  /**
   * Invalidate overlay cache - call when variant or other render settings change
   */
  invalidateCache(): void {
    this.cachedOverlayCanvas = null;
    this.lastOverlayDataHash = null;
  }
  
  /**
   * Create lightweight hash of overlay data for dirty checking.
   * Only includes fields that affect visual rendering.
   */
  private getOverlayDataHash(data: GameOverlayData): string {
    return `${data.homeScore}-${data.awayScore}-${data.quarter}-${data.gameClockMinutes}:${data.gameClockSeconds}-${data.teamAFouls}-${data.teamBFouls}-${data.activePlayerStats?.playerId || 'none'}-${data.activePlayerStats?.isVisible || false}-${data.tournamentName || ''}-${data.infoBarLabel || ''}-${data.infoBarSecondaryLabel || ''}-${data.hideScoreBar ? '1' : '0'}-sched:${data.scheduleOverlayVisible ? '1' : '0'}-lineup:${data.lineupOverlayVisible ? '1' : '0'}-schedGames:${data.scheduleOverlayPayload?.games?.length || 0}`;
  }
  
  /**
   * Draw video frame with rotation correction if needed.
   * For portrait iPhone streams, rotates 90° clockwise to show landscape.
   */
  private drawVideoFrame(): void {
    if (this.needsRotation) {
      // Video is portrait but should be landscape - rotate 90° clockwise
      const { videoWidth, videoHeight } = this.videoElement;
      
      this.ctx.save();
      // Move to center, rotate, then draw offset so video fills canvas
      this.ctx.translate(this.width / 2, this.height / 2);
      this.ctx.rotate(Math.PI / 2); // 90° clockwise
      
      // After rotation, draw centered (swap width/height for drawing)
      const drawWidth = this.height;  // After rotation: canvas height becomes draw width
      const drawHeight = this.width;  // After rotation: canvas width becomes draw height
      
      this.ctx.drawImage(
        this.videoElement,
        -drawWidth / 2,
        -drawHeight / 2,
        drawWidth,
        drawHeight
      );
      this.ctx.restore();
    } else {
      // Normal draw - no rotation needed
      this.ctx.drawImage(
        this.videoElement,
        0,
        0,
        this.width,
        this.height
      );
    }
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
          this.drawVideoFrame();
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
      
      // Render overlay on top (with dirty flag optimization)
      try {
        const currentHash = this.getOverlayDataHash(dataToRender);
        
        // Check if 3PT animation is active (needs per-frame rendering for shake effect)
        const is3PTAnimating = dataToRender.shotMadeIs3Pointer && 
          dataToRender.shotMadeAnimationStart && 
          (Date.now() - dataToRender.shotMadeAnimationStart) < 1000; // 1 second shake duration
        
        // Only re-render overlay if data changed, no cache exists, or animating
        if (currentHash !== this.lastOverlayDataHash || !this.cachedOverlayCanvas || is3PTAnimating) {
          this.cachedOverlayCanvas = await this.overlayRenderer.render(dataToRender);
          this.lastOverlayDataHash = currentHash;
        }
        
        // Always draw cached overlay
        if (this.cachedOverlayCanvas) {
          this.ctx.drawImage(this.cachedOverlayCanvas, 0, 0);
        }
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

