import { getFirebaseDatabase } from '@/lib/firebase';
import { ref, set, get, onValue, off, remove, DatabaseReference } from 'firebase/database';

export type SignalType = 'offer' | 'answer' | 'candidate';
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
 * WebRTC signaling service using Firebase Realtime Database
 * Handles offer/answer/ICE candidate exchange between mobile camera and dashboard viewer
 */
export class WebRTCSignalingService {
  private gameId: string | null = null;
  private role: PeerRole;
  private roomRef: DatabaseReference | null = null;
  private listeners: Map<string, (snapshot: any) => void> = new Map();

  constructor(role: PeerRole) {
    this.role = role;
  }

  /**
   * Join a WebRTC signaling room for a specific game
   */
  async joinRoom(gameId: string): Promise<void> {
    console.log(`🔌 [WebRTC] ${this.role} joining room:`, gameId);
    
    this.gameId = gameId;
    const db = getFirebaseDatabase();
    this.roomRef = ref(db, `rooms/${gameId}`);

    // Clean up stale signaling data before joining
    console.log(`🧹 [WebRTC] Cleaning up stale data for ${this.role}`);
    await this.cleanupStaleData();

    // Update presence
    await this.updatePresence(true);

    console.log(`✅ [WebRTC] ${this.role} joined room successfully`);
  }

  /**
   * Clean up stale signaling data before connecting
   */
  private async cleanupStaleData(): Promise<void> {
    if (!this.gameId) return;

    const db = getFirebaseDatabase();
    
    // Clear own candidates
    const ownCandidatesRef = ref(db, `rooms/${this.gameId}/candidates/${this.role}`);
    await remove(ownCandidatesRef);

    // If mobile (initiator), clear offer and answer to start fresh
    if (this.role === 'mobile') {
      const offerRef = ref(db, `rooms/${this.gameId}/offer`);
      const answerRef = ref(db, `rooms/${this.gameId}/answer`);
      await remove(offerRef);
      await remove(answerRef);
    }
  }

  /**
   * Leave the current room and cleanup
   */
  async leaveRoom(): Promise<void> {
    if (!this.roomRef || !this.gameId) {
      return;
    }

    console.log(`👋 [WebRTC] ${this.role} leaving room:`, this.gameId);

    // Remove all listeners
    this.listeners.forEach((listener, path) => {
      const db = getFirebaseDatabase();
      const pathRef = ref(db, `rooms/${this.gameId}/${path}`);
      off(pathRef);
    });
    this.listeners.clear();

    // Update presence to false
    await this.updatePresence(false);

    // Clear local state
    this.roomRef = null;
    this.gameId = null;

    console.log('✅ [WebRTC] Left room successfully');
  }

  /**
   * Send WebRTC offer (mobile camera initiates)
   */
  async sendOffer(offerSdp: string): Promise<void> {
    if (!this.roomRef || !this.gameId) {
      throw new Error('Not connected to a room');
    }

    console.log('📤 [WebRTC] Sending offer...');
    
    const db = getFirebaseDatabase();
    const offerRef = ref(db, `rooms/${this.gameId}/offer`);
    
    await set(offerRef, {
      sdp: offerSdp,
      from: this.role,
      timestamp: Date.now(),
    });

    console.log('✅ [WebRTC] Offer sent');
  }

  /**
   * Send WebRTC answer (dashboard responds)
   */
  async sendAnswer(answerSdp: string): Promise<void> {
    if (!this.roomRef || !this.gameId) {
      throw new Error('Not connected to a room');
    }

    console.log('📤 [WebRTC] Sending answer...');
    
    const db = getFirebaseDatabase();
    const answerRef = ref(db, `rooms/${this.gameId}/answer`);
    
    await set(answerRef, {
      sdp: answerSdp,
      from: this.role,
      timestamp: Date.now(),
    });

    console.log('✅ [WebRTC] Answer sent');
  }

  /**
   * Send ICE candidate
   */
  async sendCandidate(candidateData: string): Promise<void> {
    if (!this.roomRef || !this.gameId) {
      throw new Error('Not connected to a room');
    }

    console.log('📤 [WebRTC] Sending ICE candidate...');
    
    const db = getFirebaseDatabase();
    const candidateRef = ref(db, `rooms/${this.gameId}/candidates/${this.role}/${Date.now()}`);
    
    await set(candidateRef, {
      candidate: candidateData,
      timestamp: Date.now(),
    });
  }

  /**
   * Listen for WebRTC offer
   */
  onOffer(callback: (offerSdp: string) => void): void {
    if (!this.gameId) {
      throw new Error('Not connected to a room');
    }

    console.log('👂 [WebRTC] Listening for offer...');
    
    const db = getFirebaseDatabase();
    const offerRef = ref(db, `rooms/${this.gameId}/offer`);
    
    const listener = (snapshot: any) => {
      const data = snapshot.val();
      if (data && data.sdp && data.from !== this.role) {
        console.log('📥 [WebRTC] Received offer');
        callback(data.sdp);
      }
    };

    onValue(offerRef, listener);
    this.listeners.set('offer', listener);
  }

  /**
   * Listen for WebRTC answer
   */
  onAnswer(callback: (answerSdp: string) => void): void {
    if (!this.gameId) {
      throw new Error('Not connected to a room');
    }

    console.log('👂 [WebRTC] Listening for answer...');
    
    const db = getFirebaseDatabase();
    const answerRef = ref(db, `rooms/${this.gameId}/answer`);
    
    const listener = (snapshot: any) => {
      const data = snapshot.val();
      if (data && data.sdp && data.from !== this.role) {
        console.log('📥 [WebRTC] Received answer');
        callback(data.sdp);
      }
    };

    onValue(answerRef, listener);
    this.listeners.set('answer', listener);
  }

  /**
   * Listen for ICE candidates from the other peer
   */
  onCandidate(callback: (candidateData: string) => void): void {
    if (!this.gameId) {
      throw new Error('Not connected to a room');
    }

    console.log('👂 [WebRTC] Listening for ICE candidates...');
    
    // Listen to the OTHER peer's candidates
    const otherRole = this.role === 'mobile' ? 'dashboard' : 'mobile';
    const db = getFirebaseDatabase();
    const candidatesRef = ref(db, `rooms/${this.gameId}/candidates/${otherRole}`);
    
    const listener = (snapshot: any) => {
      const data = snapshot.val();
      if (data) {
        // Firebase returns an object with timestamp keys
        Object.values(data).forEach((candidate: any) => {
          if (candidate && candidate.candidate) {
            console.log('📥 [WebRTC] Received ICE candidate');
            callback(candidate.candidate);
          }
        });
      }
    };

    onValue(candidatesRef, listener);
    this.listeners.set('candidates', listener);
  }

  /**
   * Get current room status
   */
  async getRoomStatus(): Promise<RoomStatus | null> {
    if (!this.gameId) {
      return null;
    }

    const db = getFirebaseDatabase();
    const statusRef = ref(db, `rooms/${this.gameId}/status`);
    const snapshot = await get(statusRef);
    
    return snapshot.val() as RoomStatus | null;
  }

  /**
   * Update presence status
   */
  private async updatePresence(connected: boolean): Promise<void> {
    if (!this.gameId) {
      return;
    }

    const db = getFirebaseDatabase();
    const presenceKey = this.role === 'mobile' ? 'mobileConnected' : 'dashboardConnected';
    const statusRef = ref(db, `rooms/${this.gameId}/status/${presenceKey}`);
    
    await set(statusRef, connected);

    // Update last activity
    const activityRef = ref(db, `rooms/${this.gameId}/status/lastActivity`);
    await set(activityRef, Date.now());
  }

  /**
   * Clean up old room data (optional, for cleanup tasks)
   */
  static async cleanupRoom(gameId: string): Promise<void> {
    console.log('🧹 [WebRTC] Cleaning up room:', gameId);
    
    const db = getFirebaseDatabase();
    const roomRef = ref(db, `rooms/${gameId}`);
    await remove(roomRef);
    
    console.log('✅ [WebRTC] Room cleaned up');
  }

  /**
   * Check if both peers are present in the room
   */
  onPeerPresence(callback: (status: RoomStatus) => void): void {
    if (!this.gameId) {
      throw new Error('Not connected to a room');
    }

    const db = getFirebaseDatabase();
    const statusRef = ref(db, `rooms/${this.gameId}/status`);
    
    const listener = (snapshot: any) => {
      const status = snapshot.val();
      if (status) {
        callback(status as RoomStatus);
      }
    };

    onValue(statusRef, listener);
    this.listeners.set('status', listener);
  }
}

