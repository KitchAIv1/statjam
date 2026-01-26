/**
 * Video Source Types
 * 
 * Type definitions for video source management.
 * Supports webcam, iPhone (WebRTC), and screen capture sources.
 */

export type VideoSourceType = 'webcam' | 'iphone' | 'screen' | 'none';

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

export interface VideoDevice {
  deviceId: string;
  label: string;
  kind: 'videoinput' | 'audioinput';
  isRearCamera: boolean;
}

export interface VideoSourceState {
  activeSource: VideoSourceType;
  selectedDeviceId: string | null;
  stream: MediaStream | null;
  connectionStatus: ConnectionStatus;
  error: string | null;
}

export interface QRPairingSession {
  sessionId: string;
  gameId: string;
  expiresAt: number;
  pairingUrl: string;
}

export interface DeviceEnumerationResult {
  videoDevices: VideoDevice[];
  audioDevices: VideoDevice[];
  hasPermission: boolean;
}
