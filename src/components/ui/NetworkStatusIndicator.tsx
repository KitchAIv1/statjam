/**
 * NetworkStatusIndicator - Visual Network Status Component
 * 
 * PURPOSE:
 * - Shows online/offline status to users
 * - Displays offline queue size when offline
 * - Non-intrusive (small badge, auto-hides when online)
 * 
 * ARCHITECTURE:
 * - Pure UI component
 * - Uses browser Network API
 * - Integrates with OfflineSyncService for queue size
 * 
 * Follows .cursorrules: <200 lines, single responsibility, PascalCase naming
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, CheckCircle, AlertCircle } from 'lucide-react';
import { OfflineSyncService } from '@/lib/services/offlineSyncService';

interface NetworkStatusIndicatorProps {
  /**
   * Position of the indicator
   * @default 'top-right'
   */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  
  /**
   * Auto-hide when online (after delay)
   * @default true
   */
  autoHide?: boolean;
  
  /**
   * Delay before auto-hiding (ms)
   * @default 3000
   */
  autoHideDelay?: number;
}

export function NetworkStatusIndicator({
  position = 'top-right',
  autoHide = true,
  autoHideDelay = 3000
}: NetworkStatusIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [queueSize, setQueueSize] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Initialize online status
    setIsOnline(navigator.onLine);
    setIsVisible(!navigator.onLine); // Show immediately if offline

    // Update queue size (with error handling)
    const updateQueueSize = () => {
      try {
        const status = OfflineSyncService.getOfflineQueueStatus();
        setQueueSize(status.pending);
      } catch (error) {
        // Silently fail - don't crash the app if queue service has issues
        console.warn('⚠️ NetworkStatusIndicator: Failed to get queue status:', error);
      }
    };
    updateQueueSize();

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      updateQueueSize();
      
      // Auto-hide after delay when back online
      if (autoHide) {
        setTimeout(() => {
          setIsVisible(false);
        }, autoHideDelay);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsVisible(true);
      updateQueueSize();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // ✅ RELIABILITY: Poll queue size less frequently (every 5 seconds instead of 2)
    // Reduces potential performance impact
    const queueInterval = setInterval(updateQueueSize, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(queueInterval);
    };
  }, [autoHide, autoHideDelay]);

  // Don't render if online and auto-hide is enabled
  if (isOnline && !isVisible) {
    return null;
  }

  // Position classes
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  // Status styling
  const statusConfig = isOnline
    ? {
        icon: CheckCircle,
        text: 'Online',
        bgColor: 'bg-green-500',
        textColor: 'text-white'
      }
    : {
        icon: WifiOff,
        text: queueSize > 0 ? `${queueSize} queued` : 'Offline',
        bgColor: 'bg-red-500',
        textColor: 'text-white'
      };

  const Icon = statusConfig.icon;

  return (
    <div
      className={`fixed ${positionClasses[position]} z-50 flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg ${statusConfig.bgColor} ${statusConfig.textColor} transition-all duration-300`}
      role="status"
      aria-live="polite"
      aria-label={isOnline ? 'Network online' : `Network offline, ${queueSize} items queued`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{statusConfig.text}</span>
    </div>
  );
}

