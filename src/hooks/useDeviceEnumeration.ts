/**
 * useDeviceEnumeration Hook
 * 
 * Manages device enumeration state and refresh.
 * Listens for device changes (plug/unplug).
 * Limit: <100 lines
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  VideoDevice, 
  DeviceEnumerationResult,
  enumerateMediaDevices 
} from '@/lib/services/video-sources';

interface UseDeviceEnumerationReturn {
  videoDevices: VideoDevice[];
  audioDevices: VideoDevice[];
  hasPermission: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useDeviceEnumeration(): UseDeviceEnumerationReturn {
  const [devices, setDevices] = useState<DeviceEnumerationResult>({
    videoDevices: [],
    audioDevices: [],
    hasPermission: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await enumerateMediaDevices();
      setDevices(result);
      console.log('📹 Enumerated devices:', result.videoDevices.length, 'video,', result.audioDevices.length, 'audio');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to enumerate devices';
      setError(errorMessage);
      console.error('❌ Device enumeration error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial enumeration
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Listen for device changes (plug/unplug)
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) return;
    
    const handleDeviceChange = () => {
      console.log('🔄 Device change detected, refreshing...');
      refresh();
    };
    
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    return () => navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
  }, [refresh]);

  return {
    videoDevices: devices.videoDevices,
    audioDevices: devices.audioDevices,
    hasPermission: devices.hasPermission,
    isLoading,
    error,
    refresh,
  };
}
