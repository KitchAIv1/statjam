/**
 * Video Composition Service
 * 
 * Composites video stream with Canvas overlay into a single MediaStream.
 * Used for YouTube/Twitch broadcasting.
 * 
 * Architecture:
 * - Takes video source (webcam or WebRTC stream)
 * - Takes game overlay data
 * - Draws video frame + overlay on Canvas
 * - Captures Canvas as MediaStream using captureStream()
 */

import { CanvasOverlayRenderer, GameOverlayData, OverlayVariant } from '../canvas-overlay';
import { VideoCompositionOptions, VideoCompositionState, VideoCompositionCallbacks } from './types';
import { CompositionLoop } from './compositionLoop';
import { VideoSourceManager } from './videoSourceManager';

export class VideoComposer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private overlayRenderer: CanvasOverlayRenderer;
  private videoSourceManager: VideoSourceManager;
  private compositionLoop: CompositionLoop | null = null;
  private composedStream: MediaStream | null = null;
  private isComposing = false;
  private callbacks: VideoCompositionCallbacks = {};
  
  private readonly width: number;
  private readonly height: number;
  private readonly frameRate: number;
  
  constructor(options: VideoCompositionOptions = {}) {
    this.width = options.width || 1920;
    this.height = options.height || 1080;
    this.frameRate = options.frameRate || 30;
    
    // Create composition canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context for composition canvas');
    }
    this.ctx = ctx;
    
    // Initialize overlay renderer
    this.overlayRenderer = new CanvasOverlayRenderer(this.width, this.height);
    this.videoSourceManager = new VideoSourceManager();
  }
  
  /**
   * Initialize the composer
   */
  async initialize(): Promise<void> {
    await this.overlayRenderer.initialize();
  }
  
  /**
   * Set video source stream
   */
  async setVideoSource(stream: MediaStream | null): Promise<void> {
    await this.videoSourceManager.setSource(stream);
  }
  
  /**
   * Set overlay variant ('classic' or 'nba')
   */
  setOverlayVariant(variant: OverlayVariant): void {
    this.overlayRenderer.setVariant(variant);
  }
  
  /**
   * Get current overlay variant
   */
  getOverlayVariant(): OverlayVariant {
    return this.overlayRenderer.getVariant();
  }
  
  /**
   * Start composition loop
   */
  async startComposition(
    overlayData: GameOverlayData,
    callbacks?: VideoCompositionCallbacks
  ): Promise<MediaStream> {
    console.log('VideoComposer.startComposition: Starting...', { isComposing: this.isComposing });
    
    if (this.isComposing) {
      throw new Error('Composition already in progress');
    }
    
    const videoElement = this.videoSourceManager.getVideoElement();
    if (!videoElement) {
      console.error('VideoComposer.startComposition: No video element');
      throw new Error('No video source set');
    }
    
    console.log('VideoComposer.startComposition: Video element found', {
      readyState: videoElement.readyState,
      paused: videoElement.paused,
      videoWidth: videoElement.videoWidth,
      videoHeight: videoElement.videoHeight,
    });
    
    // Wait for video to be ready and playing
    console.log('VideoComposer.startComposition: Waiting for video to be ready...');
    const isReady = await this.videoSourceManager.waitForReady();
    if (!isReady) {
      console.error('VideoComposer.startComposition: Video not ready');
      throw new Error('Video source not ready');
    }
    
    console.log('VideoComposer.startComposition: Video is ready');
    
    // Ensure video is playing
    if (videoElement.paused) {
      console.log('VideoComposer.startComposition: Starting video playback...');
      await videoElement.play();
    }
    
    // Wait a bit for first frame
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.callbacks = callbacks || {};
    this.isComposing = true;
    
    console.log('VideoComposer.startComposition: Capturing canvas stream...');
    // Capture canvas as MediaStream
    this.composedStream = this.canvas.captureStream(this.frameRate);
    
    console.log('VideoComposer.startComposition: Creating composition loop...');
    // Check if video needs rotation (common with iPhone streams)
    const needsRotation = this.videoSourceManager.needsRotation();
    
    // Create and start composition loop
    this.compositionLoop = new CompositionLoop(
      this.ctx,
      this.overlayRenderer,
      videoElement,
      this.width,
      this.height,
      needsRotation
    );
    
    this.compositionLoop.start(overlayData, {
      onError: (err) => {
        console.error('CompositionLoop error callback:', err);
        this.handleError(err);
        // Don't auto-stop on error - let it keep trying
      },
      // Removed onStop callback - we don't want the loop to stop itself
    });
    
    console.log('VideoComposer.startComposition: Notifying state change...');
    this.notifyStateChange();
    
    console.log('VideoComposer.startComposition: Complete', { stream: this.composedStream });
    return this.composedStream;
  }
  
  /**
   * Update overlay data (called when game state changes)
   */
  updateOverlayData(overlayData: GameOverlayData): void {
    if (!this.isComposing || !this.compositionLoop) {
      return;
    }
    
    this.compositionLoop.updateOverlayData(overlayData);
  }
  
  /**
   * Stop composition
   */
  stopComposition(): void {
    if (!this.isComposing) {
      return;
    }
    
    this.isComposing = false;
    
    if (this.compositionLoop) {
      this.compositionLoop.stop();
      this.compositionLoop = null;
    }
    
    if (this.composedStream) {
      this.composedStream.getTracks().forEach(track => track.stop());
      this.composedStream = null;
    }
    
    this.notifyStateChange();
  }
  
  /**
   * Get current composed stream
   */
  getComposedStream(): MediaStream | null {
    return this.composedStream;
  }
  
  /**
   * Get composition state
   */
  getState(): VideoCompositionState {
    const frameCount = this.compositionLoop?.getFrameCount() || 0;
    
    return {
      isComposing: this.isComposing,
      error: null,
      frameCount,
    };
  }
  
  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopComposition();
    this.videoSourceManager.cleanup();
    this.overlayRenderer.destroy();
    this.compositionLoop = null;
    this.callbacks = {};
  }
  
  private notifyStateChange(): void {
    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange(this.getState());
    }
  }
  
  private handleError(error: Error): void {
    if (this.callbacks.onError) {
      this.callbacks.onError(error);
    }
  }
}

