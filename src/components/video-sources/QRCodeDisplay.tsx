/**
 * QRCodeDisplay Component
 * 
 * Displays QR code for iPhone pairing.
 * Uses qrcode.react for QR generation.
 */

'use client';

import { useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, ExternalLink, Loader2, CheckCircle } from 'lucide-react';
import { createSimplePairingUrl } from '@/lib/services/video-sources';
import { ConnectionStatus } from '@/lib/services/video-sources/types';
import { Button } from '@/components/ui/Button';

interface QRCodeDisplayProps {
  gameId: string;
  onConnect: () => void;
  isActive?: boolean;
  connectionStatus?: ConnectionStatus;
}

export function QRCodeDisplay({ 
  gameId, 
  onConnect, 
  isActive = false,
  connectionStatus = 'idle' 
}: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false);
  
  const pairingUrl = useMemo(() => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return createSimplePairingUrl(gameId, baseUrl);
  }, [gameId]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(pairingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const isConnected = connectionStatus === 'connected';
  const isConnecting = connectionStatus === 'connecting';
  const isWaiting = isActive && !isConnected;

  return (
    <div className="bg-white rounded-lg p-4 text-center">
      {/* Connection Status Banner */}
      {isActive && (
        <div className={`mb-3 py-2 px-3 rounded text-xs font-medium ${
          isConnected 
            ? 'bg-green-100 text-green-700' 
            : isConnecting 
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-blue-100 text-blue-700'
        }`}>
          {isConnected ? (
            <span className="flex items-center justify-center gap-1">
              <CheckCircle className="h-3 w-3" />
              iPhone Connected!
            </span>
          ) : isConnecting ? (
            <span className="flex items-center justify-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Connecting to iPhone...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Waiting for iPhone to scan QR...
            </span>
          )}
        </div>
      )}
      
      <QRCodeSVG
        value={pairingUrl}
        size={140}
        level="M"
        className="mx-auto"
        includeMargin={false}
      />
      
      <p className="text-xs text-gray-600 mt-3 font-medium">
        Scan with iPhone camera
      </p>
      <p className="text-[10px] text-gray-400 mt-1">
        Opens mobile camera page automatically
      </p>
      
      {/* URL Copy Option */}
      <div className="mt-3 flex items-center gap-1 justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyUrl}
          className="text-[10px] h-6 px-2 text-gray-500"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 mr-1 text-green-500" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1" />
              Copy URL
            </>
          )}
        </Button>
        <a 
          href={pairingUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[10px] text-gray-500 hover:text-gray-700 flex items-center gap-0.5 px-2"
        >
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      
      {/* Show different button state based on connection */}
      {!isActive ? (
        <Button
          variant="outline"
          size="sm"
          onClick={onConnect}
          className="mt-3 text-xs w-full"
        >
          Use iPhone Camera
        </Button>
      ) : isWaiting ? (
        <p className="mt-3 text-[10px] text-amber-600">
          Have iPhone scan QR code, then wait for connection
        </p>
      ) : null}
    </div>
  );
}
