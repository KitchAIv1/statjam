/**
 * Broadcast Service
 * 
 * Uses MediaRecorder to encode stream and send to relay server.
 * Relay server pipes to FFmpeg for RTMP output.
 * 
 * Limits: < 200 lines
 */

import { BroadcastConfig, BroadcastState, BroadcastCallbacks, QUALITY_PRESETS } from './types';

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

    this.updateState({
      isBroadcasting: false,
      isConnecting: false,
      connectionStatus: 'idle',
      error: null,
    });
  }

  /**
   * Connect to relay server and start MediaRecorder
   */
  private async connectToRelay(stream: MediaStream, config: BroadcastConfig): Promise<void> {
    const quality = QUALITY_PRESETS[config.quality || '1080p'];
    
    console.log('🔌 Connecting to relay server:', this.relayServerUrl);
    
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.relayServerUrl);

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
            this.startMediaRecorder(stream, ws, quality);
            resolve();
          } else if (message.type === 'error') {
            reject(new Error(message.error));
          }
        } catch (err) {
          // Non-JSON message, ignore
        }
      };

      ws.onerror = (event) => {
        console.error('❌ WebSocket connection failed to relay server:', this.relayServerUrl, event);
        reject(new Error('WebSocket connection failed'));
      };

      ws.onclose = () => {
        if (this.state.isBroadcasting) {
          this.updateState({ connectionStatus: 'disconnected', isBroadcasting: false });
        }
      };

      this.ws = ws;
    });
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
}
