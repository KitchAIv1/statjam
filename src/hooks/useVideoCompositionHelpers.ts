/**
 * useVideoComposition Helpers
 * 
 * Helper functions extracted from useVideoComposition hook
 * to keep hook under 100 lines.
 */

import { VideoComposer, VideoCompositionState } from '@/lib/services/video-composition';
import { GameOverlayData, OverlayVariant } from '@/lib/services/canvas-overlay';

export function initializeComposer(): VideoComposer {
  const composer = new VideoComposer({
    width: 1920,
    height: 1080,
    frameRate: 30,
  });
  
  composer.initialize().catch(err => {
    console.error('Failed to initialize composer:', err);
  });
  
  return composer;
}

export async function startComposition(
  composer: VideoComposer,
  overlayData: GameOverlayData,
  setState: (state: VideoCompositionState) => void,
  setError: (error: string | null) => void
): Promise<MediaStream | null> {
  try {
    console.log('startCompositionHelper: Starting...', { overlayData });
    
    const stream = await composer.startComposition(overlayData, {
      onStateChange: (newState) => {
        console.log('Composition state changed:', newState);
        setState(newState);
      },
      onError: (err) => {
        console.error('Composition error callback:', err);
        setError(err.message);
      },
    });
    
    console.log('startCompositionHelper: Stream created', stream);
    setError(null);
    return stream;
  } catch (err) {
    console.error('startCompositionHelper: Error caught', err);
    const errorMessage = err instanceof Error ? err.message : 'Failed to start composition';
    setError(errorMessage);
    return null;
  }
}

