/**
 * Device Enumeration Service
 * 
 * Handles detection and enumeration of video/audio devices.
 * Business logic only - no React dependencies.
 */

import { VideoDevice, DeviceEnumerationResult } from './types';

/** Detect if device label indicates rear camera */
function isRearCameraDevice(label: string): boolean {
  const lowerLabel = label.toLowerCase();
  return lowerLabel.includes('back') || 
         lowerLabel.includes('rear') || 
         lowerLabel.includes('environment');
}

/** Format device label for display */
function formatDeviceLabel(device: MediaDeviceInfo, index: number): string {
  if (device.label) return device.label;
  return device.kind === 'videoinput' ? `Camera ${index + 1}` : `Microphone ${index + 1}`;
}

/** Check if we already have device labels (permission granted) */
async function hasExistingPermission(): Promise<boolean> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    // If any device has a label, we have permission
    return devices.some(d => d.label !== '');
  } catch {
    return false;
  }
}

/** Request camera permission to get device labels */
async function requestCameraPermission(): Promise<void> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    stream.getTracks().forEach(track => track.stop());
  } catch {
    // Permission denied - continue without labels
  }
}

/** Enumerate all media devices */
export async function enumerateMediaDevices(): Promise<DeviceEnumerationResult> {
  try {
    // Only request permission if we don't already have it
    const alreadyHasPermission = await hasExistingPermission();
    if (!alreadyHasPermission) {
      await requestCameraPermission();
    }
    
    const devices = await navigator.mediaDevices.enumerateDevices();
    
    const videoDevices: VideoDevice[] = devices
      .filter(d => d.kind === 'videoinput')
      .map((device, index) => ({
        deviceId: device.deviceId,
        label: formatDeviceLabel(device, index),
        kind: 'videoinput' as const,
        isRearCamera: isRearCameraDevice(device.label),
      }));
    
    const audioDevices: VideoDevice[] = devices
      .filter(d => d.kind === 'audioinput')
      .map((device, index) => ({
        deviceId: device.deviceId,
        label: formatDeviceLabel(device, index),
        kind: 'audioinput' as const,
        isRearCamera: false,
      }));
    
    return {
      videoDevices,
      audioDevices,
      hasPermission: videoDevices.some(d => d.label !== '' && !d.label.startsWith('Camera ')),
    };
  } catch (error) {
    console.error('❌ Device enumeration failed:', error);
    return { videoDevices: [], audioDevices: [], hasPermission: false };
  }
}

/** Get stream from specific device */
export async function getDeviceStream(
  deviceId: string,
  constraints?: MediaTrackConstraints
): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    video: {
      deviceId: { exact: deviceId },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { ideal: 30 },
      ...constraints,
    },
    audio: false,
  });
}

/** Get screen capture stream */
export async function getScreenStream(): Promise<MediaStream> {
  return navigator.mediaDevices.getDisplayMedia({
    video: {
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { ideal: 30 },
    },
    audio: false,
  });
}
