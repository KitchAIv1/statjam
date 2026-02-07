/**
 * Relay Server Entry Point
 * 
 * Receives MediaRecorder chunks via WebSocket and pipes to FFmpeg for RTMP.
 * Supports multiple simultaneous users.
 */

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { spawn, ChildProcess } from 'child_process';
import { RtmpReconnector } from './rtmpReconnector';

const PORT = process.env.PORT || 8080;

interface StreamSession {
  ffmpeg: ChildProcess | null;
  rtmpUrl: string;
  isActive: boolean;
  reconnector: RtmpReconnector;
  hasAudio: boolean;
  quality: QualityParams;
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
      sendError(ws, 'Invalid message format');
    }
  });

  ws.on('close', () => {
    console.log(`📡 Connection closed (remaining: ${wss.clients.size - 1})`);
    cleanupSession(ws);
  });

  ws.on('error', (err) => {
    console.error('❌ WebSocket error:', err.message);
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
    quality 
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
 * Handle binary video data - pipe to FFmpeg
 */
function handleVideoData(ws: WebSocket, videoData: Buffer): void {
  const session = sessions.get(ws);
  
  if (!session?.ffmpeg?.stdin || !session.isActive) {
    return; // Silently ignore if no active session
  }

  try {
    if (!session.ffmpeg.stdin.destroyed) {
      session.ffmpeg.stdin.write(videoData);
      totalBytesReceived += videoData.length;
      
      // Log every 5 seconds
      const now = Date.now();
      if (now - lastLogTime > 5000) {
        console.log(`📊 Received ${(totalBytesReceived / 1024 / 1024).toFixed(2)} MB total`);
        lastLogTime = now;
      }
    }
  } catch (err) {
    // Ignore write errors (stream may have closed)
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
    sendError(ws, 'FFmpeg failed');
  });

  ffmpeg.on('close', (code) => {
    console.log(`🏁 FFmpeg exited (code: ${code})`);
    if (session) {
      session.isActive = false;
      if (code !== 0 && code !== null) {
        session.reconnector.attemptReconnect(ws, code, {
          buildFfmpegArgs: () => session.hasAudio 
            ? buildArgsWithAudio(session.rtmpUrl, session.quality)
            : buildArgsWithSilentAudio(session.rtmpUrl, session.quality),
          onFfmpegReady: (newFfmpeg) => {
            session.ffmpeg = newFfmpeg;
            session.isActive = true;
            setupFfmpegHandlers(ws, newFfmpeg, session);
          },
          onReconnectFailed: () => {
            session.isActive = false;
          },
        });
      }
    }
  });

  ffmpeg.stdin?.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code !== 'EPIPE') {
      console.error('❌ FFmpeg stdin error:', err.message);
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
