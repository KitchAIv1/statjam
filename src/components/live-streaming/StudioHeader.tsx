/**
 * StudioHeader Component
 * 
 * Header with status indicators for the Live Stream Studio.
 * Pure UI component - no business logic.
 */

'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface StudioHeaderProps {
  hasGameSelected: boolean;
  hasVideoStream: boolean;
  isComposing: boolean;
  isBroadcasting: boolean;
  broadcastDuration: string;
}

export function StudioHeader({
  hasGameSelected,
  hasVideoStream,
  isComposing,
  isBroadcasting,
  broadcastDuration,
}: StudioHeaderProps) {
  return (
    <div className="px-4 py-2 border-b bg-card flex-shrink-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Live Stream Studio</h1>
          <p className="text-xs text-muted-foreground">Compose and broadcast with overlays</p>
        </div>
        
        {/* Quick Status Indicators */}
        <div className="flex items-center gap-4 text-xs">
          <StatusIndicator 
            isActive={hasGameSelected} 
            label="Game" 
            tooltip="Game selected for overlay data" 
          />
          <StatusIndicator 
            isActive={hasVideoStream} 
            label="Video" 
            tooltip="Video source active"
            subTooltip="Webcam or iPhone connected"
          />
          <StatusIndicator 
            isActive={isComposing} 
            label="Composing" 
            tooltip="Video composition active"
            subTooltip="Overlay rendering on video"
          />
          
          {isBroadcasting && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 text-red-600 cursor-help">
                  <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                  <span className="font-semibold">LIVE</span>
                  <span className="font-mono text-xs">{broadcastDuration}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Broadcasting live</p>
                <p className="text-[10px] opacity-80">Stream duration: {broadcastDuration}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}

interface StatusIndicatorProps {
  isActive: boolean;
  label: string;
  tooltip: string;
  subTooltip?: string;
}

function StatusIndicator({ isActive, label, tooltip, subTooltip }: StatusIndicatorProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 cursor-help">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span>{label}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
        {subTooltip && <p className="text-[10px] opacity-80">{subTooltip}</p>}
      </TooltipContent>
    </Tooltip>
  );
}
