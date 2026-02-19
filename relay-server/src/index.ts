/**
 * Relay Server Entry Point
 * 
 * Receives MediaRecorder chunks via WebSocket and pipes to FFmpeg for RTMP.
 * Supports multiple simultaneous users.
 */

import { initSentry, captureRelayError } from './sentry';

initSentry();

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { spawn, ChildProcess } from 'child_process';
import { RtmpReconnector, ReconnectorCallbacks } from './rtmpReconnector';

const PORT = process.env.PORT || 8080;

/** WebM/EBML header magic - relay must see this before piping to a respawned FFmpeg */
const EBML_HEADER = Buffer.from([0x1a, 0x45, 0xdf, 0xa3]);

type ReconnectState =
  | { phase: 'waiting_ebml'; signalSuccess: () => void }
  | { phase: 'verification'; signalSuccess: () => void; verificationTimeoutId: NodeJS.Timeout };

interface StreamSession {
  ffmpeg: ChildProcess | null;
  rtmpUrl: string;
  isActive: boolean;
  reconnector: RtmpReconnector;
  hasAudio: boolean;
  quality: QualityParams;
  /** Set on first reconnect attempt so respawned FFmpeg exit can retry */
  reconnectCallbacks: ReconnectorCallbacks | null;
  /** EBML gating + 5s verification; null when not reconnecting */
  reconnectState: ReconnectState | null;
}

const sessions = new Map<WebSocket, StreamSession>();

// Create HTTP server
const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'ok',
    service: 'StatJam Relay Server',
    version: '2.0.0',
    protocol: 'WebSocket + MediaRecorder',
    activeSessions: sessions.size,
  }));
});

// Attach WebSocket server
const wss = new WebSocketServer({ server: httpServer });

console.log(`🚀 Relay server starting on port ${PORT}...`);

interface QualityParams {
  bitrate: number;   // kbps
  maxrate: number;   // kbps
}

// Default quality (1080p standard)
const DEFAULT_QUALITY: QualityParams = { bitrate: 6000, maxrate: 7000 };

/**
 * Build FFmpeg args when WebM has real audio (mic enabled)
 * Uses quality params from client for flexible bitrate control
 */
function buildArgsWithAudio(rtmpUrl: string, quality: QualityParams): string[] {
  const bufsize = quality.maxrate * 2; // 2-second buffer
  
  return [
    '-f', 'webm',
    '-i', 'pipe:0',
    // Video settings - Sports optimized
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-tune', 'film',
    '-profile:v', 'high',
    '-level', '4.2',
    '-r', '60',
    '-g', '60',
    '-keyint_min', '30',
    `-b:v`, `${quality.bitrate}k`,
    `-maxrate`, `${quality.maxrate}k`,
    `-bufsize`, `${bufsize}k`,
    '-pix_fmt', 'yuv420p',
    '-x264-params', 'nal-hrd=cbr:force-cfr=1',
    // Audio from WebM (mic)
    '-c:a', 'aac',
    '-b:a', '192k',
    '-ar', '48000',
    '-map', '0:v:0',
    '-map', '0:a:0',
    '-f', 'flv',
    rtmpUrl,
  ];
}

/**
 * Build FFmpeg args when no audio (generates silent audio)
 * Uses quality params from client for flexible bitrate control
 */
function buildArgsWithSilentAudio(rtmpUrl: string, quality: QualityParams): string[] {
  const bufsize = quality.maxrate * 2;
  
  return [
    '-f', 'webm',
    '-i', 'pipe:0',
    '-f', 'lavfi',
    '-t', '36000',
    '-i', 'anullsrc=r=48000:cl=stereo',
    // Video settings - Sports optimized
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-tune', 'film',
    '-profile:v', 'high',
    '-level', '4.2',
    '-r', '60',
    '-g', '60',
    '-keyint_min', '30',
    `-b:v`, `${quality.bitrate}k`,
    `-maxrate`, `${quality.maxrate}k`,
    `-bufsize`, `${bufsize}k`,
    '-pix_fmt', 'yuv420p',
    '-x264-params', 'nal-hrd=cbr:force-cfr=1',
    // Audio settings
    '-c:a', 'aac',
    '-b:a', '192k',
    '-ar', '48000',
    '-map', '0:v:0',
    '-map', '1:a:0',
    '-shortest',
    '-async', '1',
    '-f', 'flv',
    rtmpUrl,
  ];
}

wss.on('connection', (ws: WebSocket) => {
  console.log(`📡 New connection (total: ${wss.clients.size})`);

  ws.on('message', (message: Buffer, isBinary: boolean) => {
    try {
      // Text message = config, Binary message = video data
      if (!isBinary) {
        const config = JSON.parse(message.toString());
        handleConfig(ws, config);
      } else {
        handleVideoData(ws, message);
      }
    } catch (err) {
      console.error('❌ Message error:', err);
      captureRelayError(err instanceof Error ? err : new Error(String(err)), 'invalid_message');
      sendError(ws, 'Invalid message format');
    }
  });

  ws.on('close', () => {
    console.log(`📡 Connection closed (remaining: ${wss.clients.size - 1})`);
    cleanupSession(ws);
  });

  ws.on('error', (err) => {
    console.error('❌ WebSocket error:', err.message);
    captureRelayError(err, 'ws_error');
    cleanupSession(ws);
  });
});

/**
 * Handle config message - start FFmpeg process
 */
function handleConfig(ws: WebSocket, config: { 
  rtmpUrl: string; 
  streamKey: string; 
  hasAudio?: boolean;
  ffmpegBitrate?: number;
  ffmpegMaxrate?: number;
}): void {
  const { rtmpUrl, streamKey, hasAudio = false, ffmpegBitrate, ffmpegMaxrate } = config;
  
  if (!rtmpUrl || !streamKey) {
    captureRelayError(new Error('Missing rtmpUrl or streamKey'), 'config_invalid');
    sendError(ws, 'Missing rtmpUrl or streamKey');
    return;
  }

  // Use provided quality or defaults
  const quality: QualityParams = {
    bitrate: ffmpegBitrate || DEFAULT_QUALITY.bitrate,
    maxrate: ffmpegMaxrate || DEFAULT_QUALITY.maxrate,
  };

  const fullRtmpUrl = `${rtmpUrl}/${streamKey}`;
  const maskedUrl = fullRtmpUrl.replace(/\/[^/]+$/, '/***');
  console.log(`🎬 Starting stream to: ${maskedUrl} (audio: ${hasAudio ? 'mic' : 'silent'}, bitrate: ${quality.bitrate}kbps)`);

  // Build FFmpeg args with quality settings
  const ffmpegArgs = hasAudio 
    ? buildArgsWithAudio(fullRtmpUrl, quality)
    : buildArgsWithSilentAudio(fullRtmpUrl, quality);

  const ffmpeg = spawn('ffmpeg', ffmpegArgs, { stdio: ['pipe', 'pipe', 'pipe'] });
  const reconnector = new RtmpReconnector();
  const session: StreamSession = { 
    ffmpeg, 
    rtmpUrl: fullRtmpUrl, 
    isActive: true, 
    reconnector, 
    hasAudio, 
    quality,
    reconnectCallbacks: null,
    reconnectState: null,
  };
  sessions.set(ws, session);
  setupFfmpegHandlers(ws, ffmpeg, session);
  
  // Send ready immediately - client needs to start sending data for FFmpeg to process
  ws.send(JSON.stringify({ type: 'ready' }));
  console.log(`✅ FFmpeg spawned, ready for video data...`);
}

// Track bytes for logging
let totalBytesReceived = 0;
let lastLogTime = Date.now();

/**
 * EBML-gated piping during reconnection. Returns true if chunk was handled.
 */
function tryPipeReconnectChunk(session: StreamSession, videoData: Buffer): boolean {
  if (session.reconnectState?.phase !== 'waiting_ebml') return false;
  const idx = videoData.indexOf(EBML_HEADER);
  if (idx === -1) return true; // Discard chunk
  const from = videoData.subarray(idx);
  try {
    if (!session.ffmpeg!.stdin!.destroyed) session.ffmpeg!.stdin!.write(from);
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e?.code !== 'EPIPE') captureRelayError(err instanceof Error ? err : new Error(String(err)), 'ffmpeg_stdin_error');
    return true;
  }
  const signalSuccess = session.reconnectState.signalSuccess;
  const verificationTimeoutId = setTimeout(() => {
    if (session.reconnectState?.phase === 'verification' && session.ffmpeg) {
      signalSuccess();
      session.reconnectState = null;
    }
  }, 5000);
  session.reconnectState = { phase: 'verification', signalSuccess, verificationTimeoutId };
  totalBytesReceived += from.length;
  return true;
}

/**
 * Handle binary video data - pipe to FFmpeg (with EBML gating during reconnection)
 */
function handleVideoData(ws: WebSocket, videoData: Buffer): void {
  const session = sessions.get(ws);
  if (!session?.ffmpeg?.stdin || !session.isActive) return;
  if (tryPipeReconnectChunk(session, videoData)) return;

  try {
    if (!session.ffmpeg.stdin.destroyed) {
      session.ffmpeg.stdin.write(videoData);
      totalBytesReceived += videoData.length;
      const now = Date.now();
      if (now - lastLogTime > 5000) {
        console.log(`📊 Received ${(totalBytesReceived / 1024 / 1024).toFixed(2)} MB total`);
        lastLogTime = now;
      }
    }
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e?.code !== 'EPIPE') {
      captureRelayError(err instanceof Error ? err : new Error(String(err)), 'ffmpeg_stdin_error');
    }
  }
}

/**
 * Setup FFmpeg event handlers (used for initial and reconnected instances)
 */
function setupFfmpegHandlers(ws: WebSocket, ffmpeg: ChildProcess, session: StreamSession): void {
  ffmpeg.stderr?.on('data', (chunk: Buffer) => {
    let msg = chunk.toString();
    msg = msg.replace(/live2\/[^\s'"]+/g, 'live2/***');
    msg = msg.replace(/app\/[^\s'"]+/g, 'app/***');
    console.log('📺 FFmpeg:', msg.slice(0, 300));
  });

  ffmpeg.on('error', (err) => {
    console.error('❌ FFmpeg process error:', err.message);
    captureRelayError(err, 'ffmpeg_error');
    sendError(ws, 'FFmpeg failed');
  });

  ffmpeg.on('close', (code) => {
    console.log(`🏁 FFmpeg exited (code: ${code})`);
    if (session) {
      session.isActive = false;
      if (code !== 0 && code !== null) {
        if (session.reconnectState?.phase === 'verification' && session.reconnectState.verificationTimeoutId) {
          clearTimeout(session.reconnectState.verificationTimeoutId);
        }
        session.reconnectState = null;

        const callbacks: ReconnectorCallbacks = {
          buildFfmpegArgs: () => session.hasAudio
            ? buildArgsWithAudio(session.rtmpUrl, session.quality)
            : buildArgsWithSilentAudio(session.rtmpUrl, session.quality),
          onFfmpegReady: (newFfmpeg, signalReconnectSuccess) => {
            session.ffmpeg = newFfmpeg;
            session.isActive = true;
            if (signalReconnectSuccess) {
              session.reconnectState = { phase: 'waiting_ebml', signalSuccess: signalReconnectSuccess };
            }
            setupFfmpegHandlers(ws, newFfmpeg, session);
          },
          onReconnectFailed: () => {
            session.isActive = false;
          },
        };
        if (!session.reconnectCallbacks) session.reconnectCallbacks = callbacks;
        session.reconnector.attemptReconnect(ws, code, session.reconnectCallbacks);
      }
    }
  });

  ffmpeg.stdin?.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code !== 'EPIPE') {
      console.error('❌ FFmpeg stdin error:', err.message);
      captureRelayError(err, 'ffmpeg_stdin_error');
    }
  });
}

/**
 * Cleanup session on disconnect
 */
function cleanupSession(ws: WebSocket): void {
  const session = sessions.get(ws);
  if (session?.ffmpeg) {
    console.log(`🧹 Cleaning up session`);
    session.ffmpeg.stdin?.end();
    session.ffmpeg.kill('SIGTERM');
  }
  sessions.delete(ws);
}

/**
 * Send error message to client
 */
function sendError(ws: WebSocket, error: string): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'error', error }));
  }
}

// Start server
httpServer.listen(PORT, () => {
  console.log(`✅ Relay server running:`);
  console.log(`   HTTP: http://localhost:${PORT}`);
  console.log(`   WS:   ws://localhost:${PORT}`);
});
