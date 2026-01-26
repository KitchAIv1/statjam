/**
 * DeviceListItem Component
 * 
 * Single device item in the device list.
 * Pure UI component - no business logic.
 */

import { Check } from 'lucide-react';
import { VideoDevice } from '@/lib/services/video-sources/types';

interface DeviceListItemProps {
  device: VideoDevice;
  isSelected: boolean;
  onClick: () => void;
}

export function DeviceListItem({ device, isSelected, onClick }: DeviceListItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-1.5 text-xs rounded transition-colors ${
        isSelected ? 'bg-primary/20 text-primary' : 'hover:bg-muted/50'
      }`}
      type="button"
    >
      <span className="truncate text-left">
        {device.label}
        {device.isRearCamera && (
          <span className="ml-1 text-[10px] text-muted-foreground">(rear)</span>
        )}
      </span>
      {isSelected && <Check className="h-3 w-3 flex-shrink-0 ml-1" />}
    </button>
  );
}
