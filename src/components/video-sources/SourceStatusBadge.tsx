/**
 * SourceStatusBadge Component
 * 
 * Shows connection status indicator dot.
 * Pure UI component - no business logic.
 */

import { ConnectionStatus } from '@/lib/services/video-sources/types';

interface SourceStatusBadgeProps {
  status: ConnectionStatus;
}

const STATUS_CONFIG: Record<ConnectionStatus, { color: string; animate: boolean }> = {
  connected: { color: 'bg-green-500', animate: false },
  connecting: { color: 'bg-yellow-500', animate: true },
  error: { color: 'bg-red-500', animate: false },
  idle: { color: 'bg-gray-400', animate: false },
};

export function SourceStatusBadge({ status }: SourceStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.idle;

  return (
    <div 
      className={`w-2 h-2 rounded-full ${config.color} ${config.animate ? 'animate-pulse' : ''}`} 
      aria-label={`Status: ${status}`}
    />
  );
}
