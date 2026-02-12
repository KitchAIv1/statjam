/**
 * useBroadcast Hook
 * 
 * Manages broadcasting state and connection to relay server.
 * Limits: < 100 lines
 */

import { useState, useCallback, useRef } from 'react';
import * as Sentry from '@sentry/nextjs';
import { BroadcastService } from '@/lib/services/broadcast';
import { BroadcastConfig, BroadcastState } from '@/lib/services/broadcast/types';

interface UseBroadcastOptions {
  relayServerUrl?: string;
}

interface UseBroadcastReturn {
  state: BroadcastState;
  start: (stream: MediaStream, config: BroadcastConfig) => Promise<void>;
  stop: () => void;
}

export function useBroadcast(options: UseBroadcastOptions = {}): UseBroadcastReturn {
  const [state, setState] = useState<BroadcastState>({
    isBroadcasting: false,
    isConnecting: false,
    error: null,
    connectionStatus: 'idle',
  });

  const serviceRef = useRef<BroadcastService | null>(null);

  // Initialize service
  if (!serviceRef.current) {
    serviceRef.current = new BroadcastService(options.relayServerUrl);
  }

  const start = useCallback(async (stream: MediaStream, config: BroadcastConfig) => {
    if (!serviceRef.current) return;

    // Clear previous error before starting new broadcast attempt
    setState(prev => ({ ...prev, error: null }));

    try {
      await serviceRef.current.startBroadcast(stream, config, {
        onStateChange: setState,
        onError: (err) => {
          setState(prev => ({ ...prev, error: err.message }));
        },
      });
    } catch (err) {
      Sentry.captureException(err, { tags: { feature: 'live-broadcast', source: 'useBroadcast' } });
      const error = err instanceof Error ? err.message : 'Failed to start broadcast';
      setState(prev => ({ ...prev, error, connectionStatus: 'error' }));
    }
  }, []);

  const stop = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.stopBroadcast();
      setState({
        isBroadcasting: false,
        isConnecting: false,
        error: null,
        connectionStatus: 'idle',
      });
    }
  }, []);

  return {
    state,
    start,
    stop,
  };
}

