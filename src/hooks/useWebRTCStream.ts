import { useEffect, useRef, useState, useCallback } from 'react';
import SimplePeer from 'simple-peer';
import { WebRTCSignalingService, PeerRole } from '@/lib/services/webrtcService';

export type ConnectionStatus = 
  | 'idle' 
  | 'connecting' 
  | 'connected' 
  | 'disconnected' 
  | 'error';

interface UseWebRTCStreamOptions {
  gameId: string | null;
  role: PeerRole;
  localStream?: MediaStream | null;
  onRemoteStream?: (stream: MediaStream) => void;
  onConnectionStatus?: (status: ConnectionStatus) => void;
}

interface UseWebRTCStreamReturn {
  connectionStatus: ConnectionStatus;
  remoteStream: MediaStream | null;
  error: string | null;
  reconnect: () => void;
  disconnect: () => void;
}

/**
 * Custom hook for managing WebRTC peer connections using Simple-Peer
 * Handles both mobile camera (initiator) and dashboard viewer (receiver) roles
 */
export function useWebRTCStream({
  gameId,
  role,
  localStream,
  onRemoteStream,
  onConnectionStatus,
}: UseWebRTCStreamOptions): UseWebRTCStreamReturn {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const peerRef = useRef<SimplePeer.Instance | null>(null);
  const signalingRef = useRef<WebRTCSignalingService | null>(null);
  const isInitializedRef = useRef(false);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Update parent component when status changes
  useEffect(() => {
    if (onConnectionStatus) {
      onConnectionStatus(connectionStatus);
    }
  }, [connectionStatus, onConnectionStatus]);

  // Update status helper
  const updateStatus = useCallback((status: ConnectionStatus) => {
    console.log(`🔄 [WebRTC Hook] Status changed: ${status}`);
    setConnectionStatus(status);
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    console.log('🧹 [WebRTC Hook] Cleaning up...');

    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch (err) {
        console.warn('⚠️ Error destroying peer:', err);
      }
      peerRef.current = null;
    }

    if (signalingRef.current) {
      signalingRef.current.leaveRoom().catch(err => {
        console.warn('⚠️ Error leaving signaling room:', err);
      });
      signalingRef.current = null;
    }

    isInitializedRef.current = false;
  }, []);

  // Initialize WebRTC connection
  const initializeConnection = useCallback(async () => {
    if (!gameId) {
      console.log('⏸️ [WebRTC Hook] No gameId, skipping initialization');
      return;
    }

    if (isInitializedRef.current) {
      console.log('⏸️ [WebRTC Hook] Already initialized');
      return;
    }

    console.log(`🚀 [WebRTC Hook] Initializing connection as ${role} for game:`, gameId);
    
    try {
      updateStatus('connecting');
      setError(null);
      isInitializedRef.current = true;

      // Initialize signaling service
      const signaling = new WebRTCSignalingService(role);
      signalingRef.current = signaling;
      await signaling.joinRoom(gameId);

      // Configure ICE servers (STUN for discovery + TURN for relay on localhost)
      const iceServers = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        // Free TURN server for localhost testing (relays connection)
        {
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject',
        },
        {
          urls: 'turn:openrelay.metered.ca:443',
          username: 'openrelayproject',
          credential: 'openrelayproject',
        },
      ];

      // Determine if this peer should initiate the connection
      const isInitiator = role === 'mobile';

      console.log(`🔧 [WebRTC Hook] Creating SimplePeer (initiator: ${isInitiator})`);

      // Create SimplePeer instance with optimized settings
      const peer = new SimplePeer({
        initiator: isInitiator,
        stream: localStream || undefined,
        trickle: true,
        config: { 
          iceServers,
          sdpSemantics: 'unified-plan',
          // Optimize for localhost connections
          iceTransportPolicy: 'all',
        },
      });

      peerRef.current = peer;

      // Handle signaling: send offer/answer
      peer.on('signal', async (signalData) => {
        console.log('📡 [WebRTC Hook] Signal generated:', signalData.type);

        try {
          if (signalData.type === 'offer') {
            await signaling.sendOffer(JSON.stringify(signalData));
          } else if (signalData.type === 'answer') {
            await signaling.sendAnswer(JSON.stringify(signalData));
          } else if (signalData.candidate) {
            // ICE candidate
            await signaling.sendCandidate(JSON.stringify(signalData));
          }
        } catch (err) {
          console.error('❌ [WebRTC Hook] Error sending signal:', err);
        }
      });

      // Handle incoming stream
      peer.on('stream', (stream: MediaStream) => {
        console.log('📹 [WebRTC Hook] Received remote stream');
        setRemoteStream(stream);
        if (onRemoteStream) {
          onRemoteStream(stream);
        }
      });

      // Handle connection events
      peer.on('connect', () => {
        console.log('✅ [WebRTC Hook] Peer connected');
        reconnectAttempts.current = 0; // Reset on successful connection
        updateStatus('connected');
      });

      peer.on('close', () => {
        console.log('👋 [WebRTC Hook] Peer connection closed');
        updateStatus('disconnected');
      });

      peer.on('error', (err) => {
        console.error('❌ [WebRTC Hook] Peer error:', err);
        setError(err.message || 'WebRTC connection error');
        updateStatus('error');
        
        // Auto-retry for "Connection failed" errors (common on localhost)
        if (err.message === 'Connection failed.' && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          console.log(`🔄 [WebRTC Hook] Auto-reconnect attempt ${reconnectAttempts.current}/${maxReconnectAttempts} in 2 seconds...`);
          
          setTimeout(() => {
            console.log('🔄 [WebRTC Hook] Retrying connection...');
            cleanup();
            isInitializedRef.current = false;
            initializeConnection();
          }, 2000);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.log('❌ [WebRTC Hook] Max reconnection attempts reached. Please try manual reconnect.');
          setError('Connection unstable. Click Reconnect to try again.');
        }
      });

      // Listen for signaling messages
      if (isInitiator) {
        // Mobile waits for answer from dashboard
        signaling.onAnswer((answerSdp) => {
          console.log('📥 [WebRTC Hook] Received answer, signaling peer');
          try {
            const answerData = JSON.parse(answerSdp);
            peer.signal(answerData);
          } catch (err) {
            console.error('❌ [WebRTC Hook] Error parsing answer:', err);
          }
        });
      } else {
        // Dashboard waits for offer from mobile
        signaling.onOffer((offerSdp) => {
          console.log('📥 [WebRTC Hook] Received offer, signaling peer');
          try {
            const offerData = JSON.parse(offerSdp);
            peer.signal(offerData);
          } catch (err) {
            console.error('❌ [WebRTC Hook] Error parsing offer:', err);
          }
        });
      }

      // Listen for ICE candidates
      signaling.onCandidate((candidateData) => {
        console.log('📥 [WebRTC Hook] Received ICE candidate');
        try {
          const candidate = JSON.parse(candidateData);
          peer.signal(candidate);
        } catch (err) {
          console.error('❌ [WebRTC Hook] Error parsing ICE candidate:', err);
        }
      });

      console.log('✅ [WebRTC Hook] Connection initialized successfully');
    } catch (err) {
      console.error('❌ [WebRTC Hook] Initialization error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize connection');
      updateStatus('error');
      isInitializedRef.current = false;
    }
  }, [gameId, role, localStream, onRemoteStream, updateStatus]);

  // Initialize on mount or when dependencies change
  useEffect(() => {
    if (gameId && !isInitializedRef.current) {
      initializeConnection();
    }

    return () => {
      cleanup();
    };
  }, [gameId, initializeConnection, cleanup]);

  // Reconnect function
  const reconnect = useCallback(() => {
    console.log('🔄 [WebRTC Hook] Manual reconnect triggered');
    reconnectAttempts.current = 0; // Reset counter on manual reconnect
    cleanup();
    setTimeout(() => {
      initializeConnection();
    }, 500);
  }, [cleanup, initializeConnection]);

  // Disconnect function
  const disconnect = useCallback(() => {
    console.log('🔌 [WebRTC Hook] Manual disconnect triggered');
    cleanup();
    updateStatus('idle');
  }, [cleanup, updateStatus]);

  return {
    connectionStatus,
    remoteStream,
    error,
    reconnect,
    disconnect,
  };
}

