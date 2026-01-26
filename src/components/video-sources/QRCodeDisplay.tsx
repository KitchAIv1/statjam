/**
 * QRCodeDisplay Component
 * 
 * Displays QR code for iPhone pairing.
 * Uses qrcode.react for QR generation.
 */

'use client';

import { useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { createSimplePairingUrl } from '@/lib/services/video-sources';
import { Button } from '@/components/ui/Button';

interface QRCodeDisplayProps {
  gameId: string;
  onConnect: () => void;
}

export function QRCodeDisplay({ gameId, onConnect }: QRCodeDisplayProps) {
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

  return (
    <div className="bg-white rounded-lg p-4 text-center">
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
      
      <Button
        variant="outline"
        size="sm"
        onClick={onConnect}
        className="mt-3 text-xs w-full"
      >
        I've scanned it - Connect
      </Button>
    </div>
  );
}
