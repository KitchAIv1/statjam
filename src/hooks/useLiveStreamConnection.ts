import { useWebRTCStream } from '@/hooks/useWebRTCStream';

interface UseLiveStreamConnectionParams {
  gameId: string | null;
  role: 'mobile' | 'dashboard';
}

export function useLiveStreamConnection({
  gameId,
  role,
}: UseLiveStreamConnectionParams) {
  const { connectionStatus, remoteStream, error, reconnect } = useWebRTCStream({
    gameId,
    role,
    localStream: null,
  });

  return { connectionStatus, remoteStream, error, reconnect };
}

