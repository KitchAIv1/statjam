/**
 * Broadcast Controls Component
 * 
 * UI for managing YouTube/Twitch broadcasting.
 * Limits: < 200 lines
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Radio, Youtube, Twitch, Send, Gauge } from 'lucide-react';
import { BroadcastPlatform, QualityPreset, QUALITY_PRESETS } from '@/lib/services/broadcast/types';

interface BroadcastControlsProps {
  isBroadcasting: boolean;
  isConnecting: boolean;
  connectionStatus: string;
  error: string | null;
  onStart: (platform: BroadcastPlatform, streamKey: string, quality: QualityPreset) => void;
  onStop: () => void;
}

export function BroadcastControls({
  isBroadcasting,
  isConnecting,
  connectionStatus,
  error,
  onStart,
  onStop,
}: BroadcastControlsProps) {
  const [platform, setPlatform] = useState<BroadcastPlatform>('youtube');
  const [streamKey, setStreamKey] = useState('');
  const [quality, setQuality] = useState<QualityPreset>('720p');

  const handleStart = () => {
    if (!streamKey.trim()) {
      return;
    }
    onStart(platform, streamKey.trim(), quality);
  };

  const getRtmpUrl = (platform: BroadcastPlatform): string => {
    if (platform === 'youtube') {
      return 'rtmp://a.rtmp.youtube.com/live2';
    }
    return 'rtmp://live.twitch.tv/app';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Broadcast to YouTube/Twitch
        </CardTitle>
        <CardDescription>
          Enter your stream key to broadcast the composed video
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Platform Selection */}
        <div className="space-y-2">
          <Label>Platform</Label>
          <RadioGroup value={platform} onValueChange={(v) => setPlatform(v as BroadcastPlatform)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="youtube" id="youtube" />
              <Label htmlFor="youtube" className="flex items-center gap-2 cursor-pointer">
                <Youtube className="h-4 w-4" />
                YouTube
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="twitch" id="twitch" />
              <Label htmlFor="twitch" className="flex items-center gap-2 cursor-pointer">
                <Twitch className="h-4 w-4" />
                Twitch
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Quality Selection */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            Stream Quality
          </Label>
          <RadioGroup 
            value={quality} 
            onValueChange={(v) => setQuality(v as QualityPreset)}
            disabled={isBroadcasting || isConnecting}
          >
            {(Object.keys(QUALITY_PRESETS) as QualityPreset[]).map((preset) => (
              <div key={preset} className="flex items-center space-x-2">
                <RadioGroupItem value={preset} id={`quality-${preset}`} />
                <Label htmlFor={`quality-${preset}`} className="cursor-pointer">
                  <span className="font-medium">{QUALITY_PRESETS[preset].label}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {QUALITY_PRESETS[preset].description}
                  </span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Stream Key Input */}
        <div className="space-y-2">
          <Label htmlFor="streamKey">Stream Key</Label>
          <Input
            id="streamKey"
            type="password"
            placeholder={`Enter your ${platform} stream key`}
            value={streamKey}
            onChange={(e) => setStreamKey(e.target.value)}
            disabled={isBroadcasting || isConnecting}
          />
          <p className="text-xs text-muted-foreground">
            Get your stream key from {platform === 'youtube' ? 'YouTube Studio' : 'Twitch Dashboard'}
          </p>
        </div>

        {/* RTMP URL Display */}
        <div className="space-y-2">
          <Label>RTMP URL</Label>
          <Input
            value={getRtmpUrl(platform)}
            readOnly
            className="bg-muted"
          />
        </div>

        {/* Status */}
        {connectionStatus !== 'idle' && (
          <div className="flex items-center gap-2 text-sm">
            <Radio className={`h-4 w-4 ${connectionStatus === 'connected' ? 'text-green-500' : 'text-yellow-500'}`} />
            <span>Status: {connectionStatus}</span>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="text-sm text-destructive">{error}</div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2">
          {!isBroadcasting ? (
            <Button
              onClick={handleStart}
              disabled={!streamKey.trim() || isConnecting}
              className="flex-1"
            >
              {isConnecting ? 'Connecting...' : 'Start Broadcast'}
            </Button>
          ) : (
            <Button
              onClick={onStop}
              variant="destructive"
              className="flex-1"
            >
              Stop Broadcast
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

