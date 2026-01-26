import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export type SignalType = 'offer' | 'answer' | 'candidate' | 'reconnect' | 'ready';
export type PeerRole = 'mobile' | 'dashboard';

export interface SignalData {
  type: SignalType;
  data: string;
  from: PeerRole;
  timestamp: number;
}

export interface RoomStatus {
  mobileConnected: boolean;
  dashboardConnected: boolean;
  lastActivity: number;
}

/**
 * WebRTC signaling service using Supabase Realtime
 * Handles offer/answer/ICE candidate exchange between mobile camera and dashboard viewer
 */
export class WebRTCSignalingService {
  private gameId: string | null = null;
  private role: PeerRole;
  private channel: RealtimeChannel | null = null;
  private presenceState: Record<string, any> = {};

  constructor(role: PeerRole) {
    this.role = role;
  }

  /**
   * Join a WebRTC signaling room for a specific game
   */
  async joinRoom(gameId: string): Promise<void> {
    console.log(`🔌 [WebRTC] ${this.role} joining room:`, gameId);
    
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    this.gameId = gameId;

    // Create a Realtime channel for this game
    this.channel = supabase.channel(`webrtc:${gameId}`, {
      config: {
        broadcast: { self: false }, // Don't receive own broadcasts
        presence: { key: this.role },
      },
    });

    // Track presence
    await this.channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`✅ [WebRTC] ${this.role} subscribed to channel`);
        
        // Track presence
        await this.channel?.track({
          role: this.role,
          online_at: new Date().toISOString(),
        });
      }
    });

    console.log(`✅ [WebRTC] ${this.role} joined room successfully`);
  }

  /**
   * Leave the current room and cleanup
   */
  async leaveRoom(): Promise<void> {
    if (!this.channel || !this.gameId) {
      return;
    }

    console.log(`👋 [WebRTC] ${this.role} leaving room:`, this.gameId);

    try {
      await this.channel.untrack();
      await supabase?.removeChannel(this.channel);
    } catch (err) {
      console.warn('⚠️ Error leaving room:', err);
    }

    this.channel = null;
    this.gameId = null;

    console.log('✅ [WebRTC] Left room successfully');
  }

  /**
   * Send WebRTC offer (mobile camera initiates)
   */
  async sendOffer(offerSdp: string): Promise<void> {
    if (!this.channel || !this.gameId) {
      throw new Error('Not connected to a room');
    }

    console.log('📤 [WebRTC] Sending offer...');
    
    await this.channel.send({
      type: 'broadcast',
      event: 'offer',
      payload: {
        sdp: offerSdp,
        from: this.role,
        timestamp: Date.now(),
      },
    });

    console.log('✅ [WebRTC] Offer sent');
  }

  /**
   * Send WebRTC answer (dashboard responds)
   */
  async sendAnswer(answerSdp: string): Promise<void> {
    if (!this.channel || !this.gameId) {
      throw new Error('Not connected to a room');
    }

    console.log('📤 [WebRTC] Sending answer...');
    
    await this.channel.send({
      type: 'broadcast',
      event: 'answer',
      payload: {
        sdp: answerSdp,
        from: this.role,
        timestamp: Date.now(),
      },
    });

    console.log('✅ [WebRTC] Answer sent');
  }

  /**
   * Send ICE candidate
   */
  async sendCandidate(candidateData: string): Promise<void> {
    if (!this.channel || !this.gameId) {
      throw new Error('Not connected to a room');
    }

    console.log('📤 [WebRTC] Sending ICE candidate...');
    
    await this.channel.send({
      type: 'broadcast',
      event: 'candidate',
      payload: {
        candidate: candidateData,
        from: this.role,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Listen for WebRTC offer
   */
  onOffer(callback: (offerSdp: string) => void): void {
    if (!this.channel) {
      throw new Error('Not connected to a room');
    }

    console.log('👂 [WebRTC] Listening for offer...');
    
    this.channel.on('broadcast', { event: 'offer' }, (payload) => {
      const data = payload.payload;
      if (data && data.sdp && data.from !== this.role) {
        console.log('📥 [WebRTC] Received offer');
        callback(data.sdp);
      }
    });
  }

  /**
   * Listen for WebRTC answer
   */
  onAnswer(callback: (answerSdp: string) => void): void {
    if (!this.channel) {
      throw new Error('Not connected to a room');
    }

    console.log('👂 [WebRTC] Listening for answer...');
    
    this.channel.on('broadcast', { event: 'answer' }, (payload) => {
      const data = payload.payload;
      if (data && data.sdp && data.from !== this.role) {
        console.log('📥 [WebRTC] Received answer');
        callback(data.sdp);
      }
    });
  }

  /**
   * Listen for ICE candidates from the other peer
   */
  onCandidate(callback: (candidateData: string) => void): void {
    if (!this.channel) {
      throw new Error('Not connected to a room');
    }

    console.log('👂 [WebRTC] Listening for ICE candidates...');
    
    this.channel.on('broadcast', { event: 'candidate' }, (payload) => {
      const data = payload.payload;
      if (data && data.candidate && data.from !== this.role) {
        console.log('📥 [WebRTC] Received ICE candidate');
        callback(data.candidate);
      }
    });
  }

  /**
   * Send reconnect request to the other peer
   * This tells them to restart their peer connection for a fresh handshake
   */
  async sendReconnectRequest(): Promise<void> {
    if (!this.channel || !this.gameId) {
      throw new Error('Not connected to a room');
    }

    console.log('🔄 [WebRTC] Sending reconnect request...');
    
    await this.channel.send({
      type: 'broadcast',
      event: 'reconnect',
      payload: {
        from: this.role,
        timestamp: Date.now(),
      },
    });

    console.log('✅ [WebRTC] Reconnect request sent');
  }

  /**
   * Listen for reconnect requests from the other peer
   */
  onReconnectRequest(callback: () => void): void {
    if (!this.channel) {
      throw new Error('Not connected to a room');
    }

    console.log('👂 [WebRTC] Listening for reconnect requests...');
    
    this.channel.on('broadcast', { event: 'reconnect' }, (payload) => {
      const data = payload.payload;
      if (data && data.from !== this.role) {
        console.log('📥 [WebRTC] Received reconnect request from', data.from);
        callback();
      }
    });
  }

  /**
   * Send ready signal indicating this peer is ready for handshake
   */
  async sendReady(): Promise<void> {
    if (!this.channel || !this.gameId) {
      throw new Error('Not connected to a room');
    }

    console.log('✋ [WebRTC] Sending ready signal...');
    
    await this.channel.send({
      type: 'broadcast',
      event: 'ready',
      payload: {
        from: this.role,
        timestamp: Date.now(),
      },
    });

    console.log('✅ [WebRTC] Ready signal sent');
  }

  /**
   * Listen for ready signals from the other peer
   */
  onPeerReady(callback: (peerRole: PeerRole) => void): void {
    if (!this.channel) {
      throw new Error('Not connected to a room');
    }

    console.log('👂 [WebRTC] Listening for peer ready signals...');
    
    this.channel.on('broadcast', { event: 'ready' }, (payload) => {
      const data = payload.payload;
      if (data && data.from !== this.role) {
        console.log('📥 [WebRTC] Peer is ready:', data.from);
        callback(data.from as PeerRole);
      }
    });
  }

  /**
   * Get current room status from presence
   */
  async getRoomStatus(): Promise<RoomStatus | null> {
    if (!this.channel) {
      return null;
    }

    const presenceState = this.channel.presenceState();
    
    return {
      mobileConnected: !!presenceState['mobile']?.length,
      dashboardConnected: !!presenceState['dashboard']?.length,
      lastActivity: Date.now(),
    };
  }

  /**
   * Check if both peers are present in the room
   */
  onPeerPresence(callback: (status: RoomStatus) => void): void {
    if (!this.channel) {
      throw new Error('Not connected to a room');
    }

    this.channel.on('presence', { event: 'sync' }, () => {
      const presenceState = this.channel?.presenceState() || {};
      
      const status: RoomStatus = {
        mobileConnected: !!presenceState['mobile']?.length,
        dashboardConnected: !!presenceState['dashboard']?.length,
        lastActivity: Date.now(),
      };
      
      callback(status);
    });

    this.channel.on('presence', { event: 'join' }, ({ key }) => {
      console.log(`👋 [WebRTC] ${key} joined the room`);
    });

    this.channel.on('presence', { event: 'leave' }, ({ key }) => {
      console.log(`👋 [WebRTC] ${key} left the room`);
    });
  }

  /**
   * Clean up room data (no-op for Supabase - channels are ephemeral)
   */
  static async cleanupRoom(gameId: string): Promise<void> {
    console.log('🧹 [WebRTC] Cleaning up room:', gameId);
    // Supabase Realtime channels are ephemeral - no cleanup needed
    console.log('✅ [WebRTC] Room cleaned up');
  }
}

/**
 * Check if Supabase Realtime is configured
 */
export function isRealtimeConfigured(): boolean {
  return !!supabase;
}