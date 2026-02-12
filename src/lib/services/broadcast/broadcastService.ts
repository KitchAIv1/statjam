/**
 * Broadcast Service
 * 
 * Uses MediaRecorder to encode stream and send to relay server.
 * Relay server pipes to FFmpeg for RTMP output.
 * 
 * Limits: < 250 lines
 */

import * as Sentry from '@sentry/nextjs';
import { BroadcastConfig, BroadcastState, BroadcastCallbacks, QUALITY_PRESETS } from './types';

const LIVE_STREAM_TAGS = { feature: 'live-broadcast' } as const;

function captureBroadcastError(error: Error, failureType: string, extra?: Record<string, unknown>) {
  Sentry.captureException(error, {
    tags: { ...LIVE_STREAM_TAGS, failure_type: failureType },
    extra,
  });
}

function broadcastBreadcrumb(message: string, data?: Record<string, unknown>) {
  Sentry.addBreadcrumb({ category: 'live-broadcast', message, data });
}

export class BroadcastService {
  private ws: WebSocket | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private relayServerUrl: string;
  private callbacks: BroadcastCallbacks = {};
  private state: BroadcastState = {
    isBroadcasting: false,
    isConnecting: false,
    error: null,
    connectionStatus: 'idle',
  };
  
  // Store stream and quality for MediaRecorder restart during reconnection
  private currentStream: MediaStream | null = null;
  private currentQuality: typeof QUALITY_PRESETS['720p'] | null = null;

  constructor(relayServerUrl: string = 'ws://localhost:8080') {
    this.relayServerUrl = relayServerUrl;
  }

  /**
   * Start broadcasting to relay server
   */
  async startBroadcast(
    stream: MediaStream,
    config: BroadcastConfig,
    callbacks?: BroadcastCallbacks
  ): Promise<void> {
    if (this.state.isBroadcasting) {
      throw new Error('Broadcast already in progress');
    }

    this.callbacks = callbacks || {};
    this.updateState({ isConnecting: true, connectionStatus: 'connecting' });

    try {
      await this.connectToRelay(stream, config);
      this.updateState({ isBroadcasting: true, isConnecting: false, connectionStatus: 'connected' });
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to start broadcast';
      this.updateState({
        isBroadcasting: false,
        isConnecting: false,
        error,
        connectionStatus: 'error',
      });
      throw new Error(error);
    }
  }

  /**
   * Stop broadcasting
   */
  stopBroadcast(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.mediaRecorder = null;

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    // Clear stored stream and quality
    this.currentStream = null;
    this.currentQuality = null;

    this.updateState({
      isBroadcasting: false,
      isConnecting: false,
      connectionStatus: 'idle',
      error: null,
    });
  }

  /** Connection timeout (ms) - fail fast if relay unreachable or slow */
  private static readonly CONNECT_TIMEOUT_MS = 30000;

  /**
   * Connect to relay server and start MediaRecorder
   */
  private async connectToRelay(stream: MediaStream, config: BroadcastConfig): Promise<void> {
    const quality = QUALITY_PRESETS[config.quality || '1080p'];
    
    // Store for potential MediaRecorder restart during reconnection
    this.currentStream = stream;
    this.currentQuality = quality;
    
    console.log('🔌 Connecting to relay server:', this.relayServerUrl);
    broadcastBreadcrumb('connecting', { relay: this.getRelayHost() });

    return new Promise((resolve, reject) => {
      let settled = false;
      const settle = (fn: () => void) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        fn();
      };

      const ws = new WebSocket(this.relayServerUrl);
      const timeoutId = setTimeout(() => {
        const err = new Error('Connection timed out. Check your network or try again.');
        captureBroadcastError(err, 'timeout', { relay: this.getRelayHost() });
        settle(() => reject(err));
        ws.close();
      }, BroadcastService.CONNECT_TIMEOUT_MS);

      ws.onopen = () => {
        console.log('📡 Connected to relay server');
        const hasAudio = stream.getAudioTracks().length > 0;
        console.log(`🎤 Audio tracks: ${hasAudio ? 'Yes' : 'No (silent)'}`);
        console.log(`📊 Quality preset: ${config.quality || '1080p'} (${quality.label})`);
        
        // Send config with quality settings for relay server
        ws.send(JSON.stringify({
          rtmpUrl: config.rtmpUrl,
          streamKey: config.streamKey,
          hasAudio,
          ffmpegBitrate: quality.ffmpegBitrate,
          ffmpegMaxrate: quality.ffmpegMaxrate,
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'ready') {
            console.log('✅ Relay ready, starting MediaRecorder');
            broadcastBreadcrumb('connected');
            this.startMediaRecorder(stream, ws, quality);
            settle(() => resolve());
          } else if (message.type === 'error') {
            const err = new Error(message.error);
            captureBroadcastError(err, 'relay_error', { relay: this.getRelayHost(), message: message.error });
            settle(() => reject(err));
          } else if (message.type === 'rtmp_reconnecting') {
            console.log(`🔄 RTMP reconnecting (${message.attempt}/${message.maxRetries})...`);
            broadcastBreadcrumb('reconnecting', { attempt: message.attempt, maxRetries: message.maxRetries });
            this.updateState({ 
              connectionStatus: 'reconnecting',
              reconnectAttempt: message.attempt,
              maxReconnectAttempts: message.maxRetries,
            });
          } else if (message.type === 'rtmp_needs_restart') {
            // CRITICAL: Relay server needs us to restart MediaRecorder for fresh init segment
            console.log('🔄 Restarting MediaRecorder for RTMP reconnection...');
            this.restartMediaRecorder();
          } else if (message.type === 'rtmp_reconnected') {
            console.log('✅ RTMP reconnected successfully');
            broadcastBreadcrumb('reconnected');
            this.updateState({ 
              connectionStatus: 'connected',
              reconnectAttempt: undefined,
              maxReconnectAttempts: undefined,
            });
          } else if (message.type === 'rtmp_failed') {
            console.error(`❌ RTMP reconnection failed after ${message.retries} attempts`);
            const err = new Error(`Stream connection lost after ${message.retries} reconnect attempts`);
            captureBroadcastError(err, 'rtmp_failed', {
              relay: this.getRelayHost(),
              retries: message.retries,
            });
            this.updateState({ 
              connectionStatus: 'error',
              error: err.message,
              isBroadcasting: false,
            });
          }
        } catch (err) {
          // Non-JSON message, ignore
        }
      };

      ws.onerror = (event) => {
        console.error('❌ WebSocket connection failed to relay server:', this.relayServerUrl, event);
        const err = new Error('WebSocket connection failed');
        captureBroadcastError(err, 'ws_error', { relay: this.getRelayHost() });
        settle(() => reject(err));
      };

      ws.onclose = () => {
        if (!settled) {
          const err = new Error('Connection closed before stream could start');
          captureBroadcastError(err, 'ws_close_before_ready', { relay: this.getRelayHost() });
          settle(() => reject(err));
        } else if (this.state.isBroadcasting) {
          broadcastBreadcrumb('disconnected');
          this.updateState({ connectionStatus: 'disconnected', isBroadcasting: false });
        }
      };

      this.ws = ws;
    });
  }
  
  /**
   * Restart MediaRecorder to send fresh init segment for RTMP reconnection
   * MediaRecorder only sends WebM init segment at start - new FFmpeg needs it
   */
  private restartMediaRecorder(): void {
    if (!this.ws || !this.currentStream || !this.currentQuality) {
      console.error('❌ Cannot restart MediaRecorder - missing stream or quality');
      captureBroadcastError(
        new Error('Cannot restart MediaRecorder - missing stream or quality'),
        'restart_failed',
        { relay: this.getRelayHost() }
      );
      return;
    }
    
    // Stop current MediaRecorder
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      console.log('🛑 Stopping current MediaRecorder...');
      this.mediaRecorder.stop();
    }
    
    // Start fresh MediaRecorder - this sends new init segment
    console.log('🎬 Starting fresh MediaRecorder with new init segment...');
    this.startMediaRecorder(this.currentStream, this.ws, this.currentQuality);
  }

  /**
   * Start MediaRecorder with quality-based settings
   */
  private startMediaRecorder(
    stream: MediaStream, 
    ws: WebSocket, 
    quality: typeof QUALITY_PRESETS['720p']
  ): void {
    const mimeType = this.getSupportedMimeType();
    
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: quality.videoBitrate * 1000,
      audioBitsPerSecond: quality.audioBitrate * 1000,
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
        ws.send(event.data);
      }
    };

    this.mediaRecorder.onerror = (event) => {
      console.error('❌ MediaRecorder error:', event);
      const err = new Error('Recording failed');
      captureBroadcastError(err, 'mediarecorder_error', { relay: this.getRelayHost() });
      this.updateState({ error: 'Recording failed', connectionStatus: 'error' });
    };

    this.mediaRecorder.onstop = () => {
      console.log('🛑 MediaRecorder stopped');
    };

    // 500ms chunks for lower latency
    this.mediaRecorder.start(500);
    console.log(`🎬 MediaRecorder started (${mimeType}) - ${quality.label}: ${quality.videoBitrate}kbps`);
  }

  /**
   * Get supported MIME type for MediaRecorder
   */
  private getSupportedMimeType(): string {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/webm',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'video/webm';
  }

  /**
   * Update state and notify callbacks
   */
  private updateState(updates: Partial<BroadcastState>): void {
    this.state = { ...this.state, ...updates };
    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange(this.state);
    }
  }

  /**
   * Get current state
   */
  getState(): BroadcastState {
    return { ...this.state };
  }

  /** Sanitized relay host for logging (no credentials) */
  private getRelayHost(): string {
    try {
      return new URL(this.relayServerUrl.replace(/^ws/, 'http')).hostname;
    } catch {
      return 'unknown';
    }
  }
}
