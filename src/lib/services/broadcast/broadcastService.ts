/**
 * Broadcast Service
 * 
 * Sends composed video stream to relay server via WebRTC.
 * Relay server converts to RTMP and pushes to YouTube/Twitch.
 * 
 * Limits: < 200 lines
 */

import { BroadcastConfig, BroadcastState, BroadcastCallbacks } from './types';

export class BroadcastService {
  private peerConnection: RTCPeerConnection | null = null;
  private ws: WebSocket | null = null;
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
      // Create WebRTC peer connection to relay server
      this.peerConnection = await this.createPeerConnection(stream, config);
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
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.updateState({
      isBroadcasting: false,
      isConnecting: false,
      connectionStatus: 'idle',
      error: null,
    });
  }

  /**
   * Create WebRTC peer connection to relay server
   */
  private async createPeerConnection(
    stream: MediaStream,
    config: BroadcastConfig
  ): Promise<RTCPeerConnection> {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    // Add all tracks from stream
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendIceCandidate(event.candidate);
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      this.updateState({ connectionStatus: state as BroadcastState['connectionStatus'] });
    };

    // Create offer and send to relay server
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    // Send offer and config to relay server via WebSocket
    await this.sendOfferToRelay(offer, config);

    return pc;
  }

  /**
   * Send offer to relay server via WebSocket
   */
  private async sendOfferToRelay(
    offer: RTCSessionDescriptionInit,
    config: BroadcastConfig
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.relayServerUrl);

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'offer',
          data: offer,
          config,
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'answer' && this.peerConnection) {
            this.peerConnection.setRemoteDescription(
              new RTCSessionDescription(message.data)
            ).then(() => resolve()).catch(reject);
          } else if (message.type === 'ice-candidate' && this.peerConnection) {
            this.peerConnection.addIceCandidate(
              new RTCIceCandidate(message.data)
            ).catch(reject);
          } else if (message.type === 'error') {
            reject(new Error(message.error));
          }
        } catch (err) {
          reject(err);
        }
      };

      ws.onerror = () => {
        reject(new Error('WebSocket connection failed'));
      };

      // Store WebSocket for ICE candidate forwarding
      this.ws = ws;
    });
  }

  /**
   * Send ICE candidate to relay server
   */
  private sendIceCandidate(candidate: RTCIceCandidate): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'ice-candidate',
        data: candidate,
      }));
    }
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

