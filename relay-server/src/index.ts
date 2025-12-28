/**
 * Relay Server Entry Point
 * 
 * WebSocket server that receives WebRTC from browser
 * and converts to RTMP for YouTube/Twitch.
 */

import { WebSocketServer, WebSocket } from 'ws';
import { WebRTCHandler } from './webrtcHandler';
import { WebSocketMessage } from './types';

const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: Number(PORT) });

console.log(`🚀 Relay server starting on port ${PORT}...`);

wss.on('connection', (ws: WebSocket) => {
  console.log('📡 New WebSocket connection');
  
  const handler = new WebRTCHandler();

  ws.on('message', async (data: Buffer) => {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString());

      switch (message.type) {
        case 'offer':
          if (message.data && message.config) {
            const answer = await handler.handleOffer(message.data, message.config);
            ws.send(JSON.stringify({ type: 'answer', data: answer }));
          }
          break;

        case 'ice-candidate':
          if (message.data) {
            await handler.handleIceCandidate(message.data);
          }
          break;

        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (err) {
      console.error('Error handling message:', err);
      ws.send(JSON.stringify({ type: 'error', error: String(err) }));
    }
  });

  ws.on('close', () => {
    console.log('📡 WebSocket connection closed');
    handler.cleanup();
  });
});

console.log(`✅ Relay server running on ws://localhost:${PORT}`);

