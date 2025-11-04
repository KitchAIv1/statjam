/**
 * PlayTimeStamp Component
 * 
 * Displays quarter and game time for a play
 * Single responsibility: Show when play occurred
 * Follows .cursorrules: <200 lines, single purpose
 * 
 * @module PlayTimeStamp
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { formatGameTime, formatQuarter, getRelativeTime } from '@/lib/utils/gameViewerUtils';

interface PlayTimeStampProps {
  quarter: number;
  gameTimeMinutes: number;
  gameTimeSeconds: number;
  timestamp: string;
  compact?: boolean;
}

/**
 * PlayTimeStamp - Game time and quarter display
 * 
 * Features:
 * - Quarter badge
 * - Game clock
 * - Relative time
 * - Compact mode for mobile
 */
export const PlayTimeStamp: React.FC<PlayTimeStampProps> = ({ 
  quarter,
  gameTimeMinutes,
  gameTimeSeconds,
  timestamp,
  compact = false
}) => {
  
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-semibold">{formatQuarter(quarter)}</span>
        <span>•</span>
        <span>{formatGameTime(gameTimeMinutes, gameTimeSeconds)}</span>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 mb-2"
    >
      {/* Quarter Badge */}
      <div className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-md text-xs font-bold tracking-wider">
        {formatQuarter(quarter)}
      </div>
      
      {/* Game Time */}
      <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
        {formatGameTime(gameTimeMinutes, gameTimeSeconds)}
      </div>
      
      {/* Relative Time */}
      <div className="ml-auto text-xs text-muted-foreground">
        {getRelativeTime(timestamp)}
      </div>
    </motion.div>
  );
};

