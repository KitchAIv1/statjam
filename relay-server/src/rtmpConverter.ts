/**
 * RTMP Converter
 * 
 * Converts WebRTC MediaStream to RTMP using FFmpeg.
 * Limits: < 200 lines
 */

import ffmpeg from 'fluent-ffmpeg';
import { BroadcastConfig } from './types';

export class RTMPConverter {
  private ffmpegProcess: ffmpeg.FfmpegCommand | null = null;
  private isRunning = false;

  /**
   * Start RTMP conversion from WebRTC stream
   * TODO: mediaStream type will be from wrtc package when implemented
   */
  async startConversion(
    _mediaStream: unknown,
    config: BroadcastConfig
  ): Promise<void> {
    if (this.isRunning) {
      throw new Error('RTMP conversion already in progress');
    }

    // TODO: Convert MediaStream to Node.js stream
    // This requires additional setup for WebRTC in Node.js
    // For now, this is a placeholder structure

    const rtmpUrl = `${config.rtmpUrl}/${config.streamKey}`;

    this.ffmpegProcess = ffmpeg()
      .inputFormat('webm')
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-preset veryfast',
        '-tune zerolatency',
        '-f flv',
      ])
      .output(rtmpUrl)
      .on('start', () => {
        console.log('FFmpeg started:', rtmpUrl);
        this.isRunning = true;
      })
      .on('error', (err: Error) => {
        console.error('FFmpeg error:', err);
        this.isRunning = false;
      })
      .on('end', () => {
        console.log('FFmpeg ended');
        this.isRunning = false;
      });

    // Start FFmpeg process
    if (this.ffmpegProcess) {
      this.ffmpegProcess.run();
    }
  }

  /**
   * Stop RTMP conversion
   */
  stopConversion(): void {
    if (this.ffmpegProcess) {
      this.ffmpegProcess.kill('SIGTERM');
      this.ffmpegProcess = null;
    }
    this.isRunning = false;
  }

  /**
   * Check if conversion is running
   */
  isActive(): boolean {
    return this.isRunning;
  }
}

