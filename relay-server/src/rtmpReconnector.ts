/**
 * RTMP Reconnector
 * 
 * Handles automatic FFmpeg reconnection with exponential backoff.
 * Notifies client of connection status changes.
 * 
 * Limits: < 100 lines (Single Responsibility)
 */

import { ChildProcess, spawn } from 'child_process';
import { WebSocket } from 'ws';
import { captureRelayError } from './sentry';

export interface ReconnectorConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export interface ReconnectorCallbacks {
  buildFfmpegArgs: () => string[];
  onFfmpegReady: (ffmpeg: ChildProcess) => void;
  onReconnectFailed: () => void;
}

const DEFAULT_CONFIG: ReconnectorConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 8000,
};

/**
 * Handles RTMP reconnection with exponential backoff
 */
export class RtmpReconnector {
  private retryCount = 0;
  private isReconnecting = false;
  private config: ReconnectorConfig;

  constructor(config: Partial<ReconnectorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Attempt reconnection when FFmpeg dies unexpectedly
   */
  async attemptReconnect(
    ws: WebSocket,
    exitCode: number | null,
    callbacks: ReconnectorCallbacks
  ): Promise<boolean> {
    // Only reconnect on unexpected exits (non-zero, not manual stop)
    if (exitCode === 0 || this.isReconnecting) {
      return false;
    }

    if (this.retryCount >= this.config.maxRetries) {
      console.log(`❌ Max reconnect attempts (${this.config.maxRetries}) reached`);
      captureRelayError(
        new Error(`RTMP reconnect exhausted after ${this.retryCount} attempts`),
        'rtmp_reconnect_exhausted',
        { retries: this.retryCount }
      );
      this.sendMessage(ws, { type: 'rtmp_failed', retries: this.retryCount });
      callbacks.onReconnectFailed();
      return false;
    }

    this.isReconnecting = true;
    this.retryCount++;

    const delay = Math.min(
      this.config.baseDelayMs * Math.pow(2, this.retryCount - 1),
      this.config.maxDelayMs
    );

    console.log(`🔄 Reconnecting (${this.retryCount}/${this.config.maxRetries}) in ${delay}ms...`);
    this.sendMessage(ws, { type: 'rtmp_reconnecting', attempt: this.retryCount, maxRetries: this.config.maxRetries });

    await this.sleep(delay);

    try {
      // CRITICAL: Request client to restart MediaRecorder BEFORE spawning new FFmpeg
      // MediaRecorder only sends init segment once at start - new FFmpeg needs it
      console.log('📤 Requesting client to restart MediaRecorder...');
      this.sendMessage(ws, { type: 'rtmp_needs_restart' });
      
      // Wait for client to restart MediaRecorder and send fresh init segment
      await this.sleep(1500);
      
      // NOW spawn FFmpeg - it will receive fresh init segment from restarted MediaRecorder
      const ffmpegArgs = callbacks.buildFfmpegArgs();
      const ffmpeg = spawn('ffmpeg', ffmpegArgs, { stdio: ['pipe', 'pipe', 'pipe'] });

      ffmpeg.on('error', (err) => {
        console.error('❌ FFmpeg respawn error:', err.message);
        captureRelayError(err, 'ffmpeg_respawn_error');
        this.isReconnecting = false;
      });

      console.log(`✅ FFmpeg respawned successfully`);
      this.sendMessage(ws, { type: 'rtmp_reconnected' });
      this.isReconnecting = false;
      callbacks.onFfmpegReady(ffmpeg);
      return true;
    } catch (err) {
      console.error('❌ FFmpeg respawn failed:', err);
      captureRelayError(err instanceof Error ? err : new Error(String(err)), 'ffmpeg_respawn_exception');
      this.isReconnecting = false;
      return this.attemptReconnect(ws, 1, callbacks); // Retry
    }
  }

  /** Reset retry counter (call on successful manual start) */
  reset(): void {
    this.retryCount = 0;
    this.isReconnecting = false;
  }

  private sendMessage(ws: WebSocket, message: object): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
