/**
 * VideoSourceSelector Component
 * 
 * OBS-like video source selector with device enumeration.
 * Supports webcam, iPhone (WebRTC), and screen capture.
 * UI only - no business logic.
 * Limit: <200 lines
 */

'use client';

import { useState } from 'react';
import { Camera, Smartphone, Monitor, ChevronDown, RefreshCw, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useDeviceEnumeration } from '@/hooks/useDeviceEnumeration';
import { VideoSourceType, ConnectionStatus } from '@/lib/services/video-sources/types';
import { DeviceListItem } from './DeviceListItem';
import { SourceStatusBadge } from './SourceStatusBadge';
import { QRCodeDisplay } from './QRCodeDisplay';

interface VideoSourceSelectorProps {
  activeSource: VideoSourceType;
  connectionStatus: ConnectionStatus;
  selectedDeviceId: string | null;
  gameId: string | null;
  onSelectWebcam: (deviceId: string) => void;
  onSelectiPhone: () => void;
  onSelectScreen: () => void;
  onClear: () => void;
  error?: string | null;
}

export function VideoSourceSelector({
  activeSource,
  connectionStatus,
  selectedDeviceId,
  gameId,
  onSelectWebcam,
  onSelectiPhone,
  onSelectScreen,
  onClear,
  error,
}: VideoSourceSelectorProps) {
  const { videoDevices, isLoading, refresh } = useDeviceEnumeration();
  const [expandedSection, setExpandedSection] = useState<'webcam' | 'iphone' | null>(null);

  const handleWebcamToggle = () => {
    setExpandedSection(prev => prev === 'webcam' ? null : 'webcam');
  };

  const handleiPhoneToggle = () => {
    if (!gameId) return;
    setExpandedSection(prev => prev === 'iphone' ? null : 'iphone');
  };

  const isConnecting = connectionStatus === 'connecting';

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Video Source</h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={refresh} 
              disabled={isLoading}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Refresh devices</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="space-y-1.5">
        {/* Webcam Section */}
        <div>
          <button
            onClick={handleWebcamToggle}
            className={`w-full flex items-center justify-between p-2 text-xs rounded transition-all ${
              activeSource === 'webcam' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted hover:bg-muted/80'
            }`}
            type="button"
          >
            <div className="flex items-center gap-2">
              {activeSource === 'webcam' && isConnecting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
              <span>Webcam</span>
            </div>
            <div className="flex items-center gap-1">
              {activeSource === 'webcam' && <SourceStatusBadge status={connectionStatus} />}
              <ChevronDown 
                className={`h-3 w-3 transition-transform ${expandedSection === 'webcam' ? 'rotate-180' : ''}`} 
              />
            </div>
          </button>
          
          {expandedSection === 'webcam' && (
            <div className="mt-1 ml-4 space-y-1 animate-in slide-in-from-top-1 duration-200">
              {isLoading ? (
                <p className="text-xs text-muted-foreground py-2">Scanning devices...</p>
              ) : videoDevices.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">No cameras detected</p>
              ) : (
                videoDevices.map((device) => (
                  <DeviceListItem
                    key={device.deviceId}
                    device={device}
                    isSelected={activeSource === 'webcam' && selectedDeviceId === device.deviceId}
                    onClick={() => onSelectWebcam(device.deviceId)}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* iPhone Section */}
        <div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleiPhoneToggle}
                disabled={!gameId}
                className={`w-full flex items-center justify-between p-2 text-xs rounded transition-all ${
                  activeSource === 'iphone' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted hover:bg-muted/80'
                } ${!gameId ? 'opacity-50 cursor-not-allowed' : ''}`}
                type="button"
              >
                <div className="flex items-center gap-2">
                  {activeSource === 'iphone' && isConnecting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Smartphone className="h-3.5 w-3.5" />
                  )}
                  <span>iPhone Camera</span>
                </div>
                <div className="flex items-center gap-1">
                  {activeSource === 'iphone' && <SourceStatusBadge status={connectionStatus} />}
                  <ChevronDown 
                    className={`h-3 w-3 transition-transform ${expandedSection === 'iphone' ? 'rotate-180' : ''}`} 
                  />
                </div>
              </button>
            </TooltipTrigger>
            {!gameId && (
              <TooltipContent>
                <p>Select a game first</p>
              </TooltipContent>
            )}
          </Tooltip>
          
          {expandedSection === 'iphone' && gameId && (
            <div className="mt-2 animate-in slide-in-from-top-1 duration-200">
              <QRCodeDisplay gameId={gameId} onConnect={onSelectiPhone} />
            </div>
          )}
        </div>

        {/* Screen Capture */}
        <button
          onClick={onSelectScreen}
          className={`w-full flex items-center justify-between p-2 text-xs rounded transition-all ${
            activeSource === 'screen' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted hover:bg-muted/80'
          }`}
          type="button"
        >
          <div className="flex items-center gap-2">
            {activeSource === 'screen' && isConnecting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Monitor className="h-3.5 w-3.5" />
            )}
            <span>Screen Capture</span>
          </div>
          {activeSource === 'screen' && <SourceStatusBadge status={connectionStatus} />}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <p className="text-xs text-destructive mt-2 animate-in fade-in-0">{error}</p>
      )}
      
      {/* Clear Source Button */}
      {activeSource !== 'none' && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClear} 
          className="w-full mt-2 text-xs h-7"
        >
          Clear Source
        </Button>
      )}
    </Card>
  );
}
