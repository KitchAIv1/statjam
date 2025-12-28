/**
 * Video Composition Types
 * 
 * Type definitions for video composition service
 */

import { GameOverlayData } from '../canvas-overlay';

export interface VideoCompositionOptions {
  width?: number;
  height?: number;
  frameRate?: number;
}

export interface VideoCompositionState {
  isComposing: boolean;
  error: string | null;
  frameCount: number;
}

export interface VideoCompositionCallbacks {
  onStateChange?: (state: VideoCompositionState) => void;
  onError?: (error: Error) => void;
}

