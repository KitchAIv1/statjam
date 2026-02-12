/**
 * BroadcastService Connection Tests
 *
 * Verifies timeout, reject-on-close, and settle-once behavior for relay connection.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BroadcastService } from '@/lib/services/broadcast';
import type { BroadcastConfig } from '@/lib/services/broadcast/types';

const WebSocketOPEN = 1;
const WebSocketCLOSED = 3;

function createMockMediaStream(): MediaStream {
  const track = {
    kind: 'video',
    enabled: true,
    muted: false,
    stop: vi.fn(),
  } as unknown as MediaStreamTrack;
  return {
    getVideoTracks: () => [track],
    getAudioTracks: () => [],
    getTracks: () => [track],
  } as unknown as MediaStream;
}

function createMockMediaRecorder() {
  return {
    state: 'recording',
    start: vi.fn(),
    stop: vi.fn(),
    ondataavailable: null,
    onerror: null,
    onstop: null,
  };
}

describe('BroadcastService - Connection Handling', () => {
  const defaultConfig: BroadcastConfig = {
    platform: 'youtube',
    streamKey: 'test-key',
    rtmpUrl: 'rtmp://a.rtmp.youtube.com/live2',
    quality: '720p',
  };

  beforeEach(() => {
    const MockMR = vi.fn(() => createMockMediaRecorder());
    (MockMR as { isTypeSupported?: (t: string) => boolean }).isTypeSupported = () => true;
    vi.stubGlobal('MediaRecorder', MockMR);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('rejects when connection closes before ready', async () => {
    vi.stubGlobal(
      'WebSocket',
      vi.fn(function MockWebSocket(_url: string) {
        const instance = {
          readyState: 0,
          send: vi.fn(),
          close: vi.fn(),
          onopen: null as (() => void) | null,
          onmessage: null as ((e: MessageEvent) => void) | null,
          onclose: null as (() => void) | null,
          onerror: null as (() => void) | null,
        };
        setTimeout(() => {
          instance.readyState = WebSocketOPEN;
          instance.onopen?.();
          setTimeout(() => {
            instance.readyState = WebSocketCLOSED;
            instance.onclose?.();
          }, 5);
        }, 0);
        return instance;
      })
    );

    const service = new BroadcastService('wss://test.relay');
    const stream = createMockMediaStream();

    await expect(service.startBroadcast(stream, defaultConfig)).rejects.toThrow(
      'Connection closed before stream could start'
    );
    expect(service.getState().isBroadcasting).toBe(false);
    expect(service.getState().connectionStatus).toBe('error');
  });

  it('rejects when connection times out', async () => {
    vi.useFakeTimers();

    vi.stubGlobal(
      'WebSocket',
      vi.fn(function MockWebSocket(_url: string) {
        const instance = {
          readyState: 0,
          send: vi.fn(),
          close: vi.fn(),
          onopen: null as (() => void) | null,
          onmessage: null as ((e: MessageEvent) => void) | null,
          onclose: null as (() => void) | null,
          onerror: null as (() => void) | null,
        };
        setTimeout(() => {
          instance.readyState = WebSocketOPEN;
          instance.onopen?.();
        }, 0);
        return instance;
      })
    );

    const service = new BroadcastService('wss://test.relay');
    const stream = createMockMediaStream();

    const expectPromise = expect(service.startBroadcast(stream, defaultConfig)).rejects.toThrow(
      'Connection timed out'
    );
    await vi.advanceTimersByTimeAsync(31000);
    await expectPromise;

    expect(service.getState().connectionStatus).toBe('error');

    vi.useRealTimers();
  });
});
