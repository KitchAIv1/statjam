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

// ICE servers configuration
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
];

/**
 * Custom hook for managing WebRTC peer connections using Simple-Peer
 * Handles both mobile camera (initiator) and dashboard viewer (receiver) roles
 * Supports bidirectional reconnection sync
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
    if (onConnectionStatus) onConnectionStatus(connectionStatus);
  }, [connectionStatus, onConnectionStatus]);

  const updateStatus = useCallback((status: ConnectionStatus) => {
    console.log(`🔄 [WebRTC Hook] Status changed: ${status}`);
    setConnectionStatus(status);
  }, []);

  // Cleanup peer only (keep signaling channel open)
  const cleanupPeerOnly = useCallback(() => {
    if (peerRef.current) {
      try { peerRef.current.destroy(); } catch (e) { console.warn('⚠️ Error destroying peer:', e); }
      peerRef.current = null;
    }
  }, []);

  // Full cleanup (peer + signaling)
  const cleanup = useCallback(() => {
    console.log('🧹 [WebRTC Hook] Full cleanup...');
    cleanupPeerOnly();
    if (signalingRef.current) {
      signalingRef.current.leaveRoom().catch(e => console.warn('⚠️ Error leaving room:', e));
      signalingRef.current = null;
    }
    isInitializedRef.current = false;
  }, [cleanupPeerOnly]);

  // Create a new SimplePeer instance with existing signaling
  const createPeer = useCallback((signaling: WebRTCSignalingService) => {
    const isInitiator = role === 'mobile';
    console.log(`🔧 [WebRTC Hook] Creating SimplePeer (initiator: ${isInitiator})`);

    const peer = new SimplePeer({
      initiator: isInitiator,
      stream: localStream || undefined,
      trickle: true,
      config: { iceServers: ICE_SERVERS, sdpSemantics: 'unified-plan', iceTransportPolicy: 'all' },
    });

    peerRef.current = peer;

    // Signal handler
    peer.on('signal', async (signalData) => {
      console.log('📡 [WebRTC Hook] Signal generated:', signalData.type || 'candidate');
      try {
        if (signalData.type === 'offer') await signaling.sendOffer(JSON.stringify(signalData));
        else if (signalData.type === 'answer') await signaling.sendAnswer(JSON.stringify(signalData));
        else if (signalData.candidate) await signaling.sendCandidate(JSON.stringify(signalData));
      } catch (err) {
        console.error('❌ [WebRTC Hook] Error sending signal:', err);
      }
    });

    // Stream handler
    peer.on('stream', (stream: MediaStream) => {
      console.log('📹 [WebRTC Hook] Received remote stream');
      setRemoteStream(stream);
      if (onRemoteStream) onRemoteStream(stream);
    });

    // Connection success
    peer.on('connect', () => {
      console.log('✅ [WebRTC Hook] Peer connected');
      reconnectAttempts.current = 0;
      updateStatus('connected');
    });

    // Connection closed
    peer.on('close', () => {
      console.log('👋 [WebRTC Hook] Peer connection closed');
      updateStatus('disconnected');
    });

    // Error handler with bidirectional reconnect
    peer.on('error', (err) => {
      console.error('❌ [WebRTC Hook] Peer error:', err);
      setError(err.message || 'WebRTC connection error');
      updateStatus('error');
      
      if (err.message === 'Connection failed.' && reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++;
        console.log(`🔄 [WebRTC Hook] Reconnect attempt ${reconnectAttempts.current}/${maxReconnectAttempts}`);
        
        // Tell the other peer to restart too
        signaling.sendReconnectRequest().catch(e => console.warn('⚠️ Failed to send reconnect:', e));
        
        setTimeout(() => {
          console.log('🔄 [WebRTC Hook] Recreating peer...');
          cleanupPeerOnly();
          createPeer(signaling);
        }, 2000);
      } else if (reconnectAttempts.current >= maxReconnectAttempts) {
        setError('Connection unstable. Click Reconnect to try again.');
      }
    });

    return peer;
  }, [role, localStream, onRemoteStream, updateStatus, cleanupPeerOnly]);

  // Initialize full connection (signaling + peer)
  const initializeConnection = useCallback(async () => {
    if (!gameId || isInitializedRef.current) return;

    console.log(`🚀 [WebRTC Hook] Initializing as ${role} for game:`, gameId);
    
    try {
      updateStatus('connecting');
      setError(null);
      isInitializedRef.current = true;

      const signaling = new WebRTCSignalingService(role);
      signalingRef.current = signaling;
      
      await signaling.joinRoom(gameId);
      if (!signalingRef.current) throw new Error('Signaling cleared during join');

      const peer = createPeer(signaling);
      const isInitiator = role === 'mobile';

      // Helper to safely signal peer (guards against destroyed peer)
      const safeSignal = (data: string, type: string) => {
        const currentPeer = peerRef.current;
        if (!currentPeer || currentPeer.destroyed) {
          console.log(`⏸️ [WebRTC Hook] Ignoring ${type} - peer not ready or destroyed`);
          return;
        }
        try {
          currentPeer.signal(JSON.parse(data));
        } catch (e) {
          console.error(`❌ [WebRTC Hook] Error signaling ${type}:`, e);
        }
      };

      // Set up signaling listeners (use peerRef.current via safeSignal for reconnect support)
      if (isInitiator) {
        signaling.onAnswer((answerSdp) => {
          console.log('📥 [WebRTC Hook] Received answer');
          safeSignal(answerSdp, 'answer');
        });
      } else {
        signaling.onOffer((offerSdp) => {
          console.log('📥 [WebRTC Hook] Received offer');
          safeSignal(offerSdp, 'offer');
        });
      }

      // ICE candidates listener
      signaling.onCandidate((candidateData) => {
        console.log('📥 [WebRTC Hook] Received ICE candidate');
        safeSignal(candidateData, 'candidate');
      });

      // CRITICAL: Listen for reconnect requests from the other peer
      signaling.onReconnectRequest(() => {
        console.log('🔄 [WebRTC Hook] Peer requested reconnect - restarting...');
        reconnectAttempts.current = 0;
        cleanupPeerOnly();
        
        // Small delay to allow both sides to cleanup
        setTimeout(() => {
          if (signalingRef.current) {
            createPeer(signalingRef.current);
            updateStatus('connecting');
          }
        }, 500);
      });

      console.log('✅ [WebRTC Hook] Connection initialized');
    } catch (err) {
      console.error('❌ [WebRTC Hook] Init error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize');
      updateStatus('error');
      isInitializedRef.current = false;
    }
  }, [gameId, role, updateStatus, createPeer, cleanupPeerOnly]);

  // Initialize on mount
  useEffect(() => {
    if (gameId && !isInitializedRef.current) initializeConnection();
    return () => { cleanup(); };
  }, [gameId, initializeConnection, cleanup]);

  // Manual reconnect (both sides restart)
  const reconnect = useCallback(() => {
    console.log('🔄 [WebRTC Hook] Manual reconnect');
    reconnectAttempts.current = 0;
    
    // Notify peer to restart too
    if (signalingRef.current) {
      signalingRef.current.sendReconnectRequest().catch(() => {});
    }
    
    cleanup();
    setTimeout(() => initializeConnection(), 500);
  }, [cleanup, initializeConnection]);

  // Disconnect
  const disconnect = useCallback(() => {
    console.log('🔌 [WebRTC Hook] Disconnect');
    cleanup();
    updateStatus('idle');
  }, [cleanup, updateStatus]);

  return { connectionStatus, remoteStream, error, reconnect, disconnect };
}
