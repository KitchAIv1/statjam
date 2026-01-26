/**
 * useVideoSourceSelector Hook
 * 
 * Manages video source selection state (OBS-like behavior).
 * Handles webcam, iPhone (WebRTC), and screen capture sources.
 * Limit: <100 lines
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  VideoSourceType, 
  VideoSourceState,
  ConnectionStatus,
  getDeviceStream,
  getScreenStream 
} from '@/lib/services/video-sources';

interface UseVideoSourceSelectorOptions {
  iphoneStream: MediaStream | null;
  iphoneConnectionStatus: ConnectionStatus;
}

interface UseVideoSourceSelectorReturn {
  state: VideoSourceState;
  selectWebcam: (deviceId: string) => Promise<void>;
  selectiPhone: () => void;
  selectScreen: () => Promise<void>;
  clearSource: () => void;
}

export function useVideoSourceSelector({
  iphoneStream,
  iphoneConnectionStatus,
}: UseVideoSourceSelectorOptions): UseVideoSourceSelectorReturn {
  const [state, setState] = useState<VideoSourceState>({
    activeSource: 'none',
    selectedDeviceId: null,
    stream: null,
    connectionStatus: 'idle',
    error: null,
  });

  // Update iPhone stream when it changes
  useEffect(() => {
    if (state.activeSource === 'iphone') {
      setState(s => ({
        ...s,
        stream: iphoneStream,
        connectionStatus: iphoneConnectionStatus,
      }));
    }
  }, [iphoneStream, iphoneConnectionStatus, state.activeSource]);

  const cleanup = useCallback(() => {
    if (state.stream && state.activeSource !== 'iphone') {
      state.stream.getTracks().forEach(track => track.stop());
    }
  }, [state.stream, state.activeSource]);

  const selectWebcam = useCallback(async (deviceId: string) => {
    cleanup();
    setState(s => ({ ...s, connectionStatus: 'connecting', error: null }));
    
    try {
      const stream = await getDeviceStream(deviceId);
      setState({
        activeSource: 'webcam',
        selectedDeviceId: deviceId,
        stream,
        connectionStatus: 'connected',
        error: null,
      });
      console.log('✅ Webcam connected:', deviceId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access camera';
      setState(s => ({ ...s, connectionStatus: 'error', error: errorMessage }));
      console.error('❌ Webcam error:', err);
    }
  }, [cleanup]);

  const selectiPhone = useCallback(() => {
    cleanup();
    setState({
      activeSource: 'iphone',
      selectedDeviceId: null,
      stream: iphoneStream,
      connectionStatus: iphoneConnectionStatus,
      error: null,
    });
    console.log('📱 iPhone source selected');
  }, [cleanup, iphoneStream, iphoneConnectionStatus]);

  const selectScreen = useCallback(async () => {
    cleanup();
    setState(s => ({ ...s, connectionStatus: 'connecting', error: null }));
    
    try {
      const stream = await getScreenStream();
      setState({
        activeSource: 'screen',
        selectedDeviceId: null,
        stream,
        connectionStatus: 'connected',
        error: null,
      });
      console.log('🖥️ Screen capture started');
    } catch {
      // User cancelled - reset to idle, not error
      setState(s => ({ ...s, connectionStatus: 'idle', error: null }));
    }
  }, [cleanup]);

  const clearSource = useCallback(() => {
    cleanup();
    setState({
      activeSource: 'none',
      selectedDeviceId: null,
      stream: null,
      connectionStatus: 'idle',
      error: null,
    });
    console.log('🗑️ Video source cleared');
  }, [cleanup]);

  return { state, selectWebcam, selectiPhone, selectScreen, clearSource };
}
