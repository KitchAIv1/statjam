/**
 * Broadcast Controls Component
 * 
 * UI for managing YouTube/Twitch broadcasting.
 * Compact collapsible design for single-screen layout.
 * Limits: < 200 lines
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronDown, ChevronUp, Youtube, Twitch, Facebook } from 'lucide-react';
import { BroadcastPlatform, QualityPreset, RelayRegion, QUALITY_PRESETS } from '@/lib/services/broadcast/types';

interface BroadcastControlsProps {
  isBroadcasting: boolean;
  isConnecting: boolean;
  connectionStatus: string;
  error: string | null;
  onStart: (platform: BroadcastPlatform, streamKey: string, quality: QualityPreset, publicStreamUrl?: string, relayRegion?: RelayRegion) => void;
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
  const [publicStreamUrl, setPublicStreamUrl] = useState('');
  const [quality, setQuality] = useState<QualityPreset>('720p');
  const [relayRegion, setRelayRegion] = useState<RelayRegion>('us');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleStart = () => {
    if (!streamKey.trim()) {
      return;
    }
    onStart(platform, streamKey.trim(), quality, publicStreamUrl.trim() || undefined, relayRegion);
  };

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Broadcast</h3>
        {!isBroadcasting && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 text-xs"
              >
                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isExpanded ? 'Hide' : 'Show'} advanced settings</p>
              <p className="text-[10px] opacity-80">Quality and stream key</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {!isBroadcasting ? (
        <div className="space-y-2">
          {/* Platform Selection - Always Visible */}
          <div className="flex gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setPlatform('youtube')}
                  className={`flex-1 p-1.5 text-xs rounded transition-colors ${
                    platform === 'youtube' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}
                >
                  <Youtube className="h-3.5 w-3.5 mx-auto mb-0.5" />
                  YouTube
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Stream to YouTube</p>
                <p className="text-[10px] opacity-80">Get stream key from YouTube Studio</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setPlatform('twitch')}
                  className={`flex-1 p-1.5 text-xs rounded transition-colors ${
                    platform === 'twitch' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}
                >
                  <Twitch className="h-3.5 w-3.5 mx-auto mb-0.5" />
                  Twitch
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Stream to Twitch</p>
                <p className="text-[10px] opacity-80">Get stream key from Twitch Dashboard</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setPlatform('facebook')}
                  className={`flex-1 p-1.5 text-xs rounded transition-colors ${
                    platform === 'facebook' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}
                >
                  <Facebook className="h-3.5 w-3.5 mx-auto mb-0.5" />
                  Facebook
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Stream to Facebook Live</p>
                <p className="text-[10px] opacity-80">Get stream key from Facebook Live Producer</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Advanced Settings - Collapsible */}
          {isExpanded && (
            <div className="space-y-2 pt-2 border-t">
              {/* Streaming region */}
              <div className="space-y-1">
                <Label className="text-xs">Streaming Region</Label>
                <select
                  value={relayRegion}
                  onChange={(e) => setRelayRegion(e.target.value as RelayRegion)}
                  className="w-full text-xs px-2 py-1 bg-background border rounded"
                >
                  <option value="us">US (Default)</option>
                  <option value="au">Australia</option>
                </select>
              </div>

              {/* Quality selection - compact */}
              <div className="space-y-1">
                <Label className="text-xs">Quality</Label>
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value as QualityPreset)}
                  className="w-full text-xs px-2 py-1 bg-background border rounded"
                >
                  {Object.keys(QUALITY_PRESETS).map((preset) => (
                    <option key={preset} value={preset}>
                      {QUALITY_PRESETS[preset as QualityPreset].label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stream key */}
              <div className="space-y-1">
                <Label className="text-xs">Stream Key</Label>
                <Input
                  type="password"
                  placeholder="Enter key"
                  value={streamKey}
                  onChange={(e) => setStreamKey(e.target.value)}
                  className="h-7 text-xs"
                />
              </div>

              {/* Public Stream URL - for embedding on tournament page */}
              <div className="space-y-1">
                <Label className="text-xs">Public Watch URL (optional)</Label>
                <Input
                  type="url"
                  placeholder={
                    platform === 'youtube' ? 'youtube.com/watch?v=...' : 
                    platform === 'twitch' ? 'twitch.tv/channel' : 
                    'facebook.com/video/...'
                  }
                  value={publicStreamUrl}
                  onChange={(e) => setPublicStreamUrl(e.target.value)}
                  className="h-7 text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  Viewers will see this stream on the tournament page
                </p>
                {platform === 'youtube' && (
                  <div className="mt-1.5 p-2 bg-black/60 border border-[#FF3B30]/40 rounded text-[10px] text-white">
                    <span className="text-[#FF3B30] font-semibold">⚠️ Important:</span> Enable embedding in YouTube Studio → Go Live → Stream Settings → <span className="font-semibold">Allow embedding = ON</span>
                  </div>
                )}
                {platform === 'facebook' && (
                  <div className="mt-1.5 p-2 bg-black/60 border border-[#1877F2]/40 rounded text-[10px] text-white">
                    <span className="text-[#1877F2] font-semibold">ℹ️ Note:</span> Get stream key from Facebook Live Producer. Keys expire after each stream.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Start Button */}
          <Button
            onClick={handleStart}
            disabled={!streamKey.trim() || isConnecting}
            className="w-full h-7 text-xs"
          >
            {isConnecting ? 'Connecting...' : 'Start Broadcast'}
          </Button>

          {/* Error Display */}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      ) : (
        <div className="space-y-2">
          <Button onClick={onStop} variant="destructive" className="w-full h-7 text-xs">
            Stop Broadcast
          </Button>
          {connectionStatus !== 'idle' && (
            <p className="text-xs text-muted-foreground">
              Status: <span className={connectionStatus === 'connected' ? 'text-green-600' : 'text-yellow-600'}>{connectionStatus}</span>
            </p>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      )}
    </Card>
  );
}
