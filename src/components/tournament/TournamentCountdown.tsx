"use client";

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface TournamentCountdownProps {
  targetDate: string | null;
  fallbackDate?: string | null;
  className?: string;
}

/**
 * Displays countdown to target date (first game or tournament start).
 * Shows "X days", "Tomorrow", "Today", or "Live" when past.
 */
export function TournamentCountdown({ targetDate, fallbackDate, className = '' }: TournamentCountdownProps) {
  const dateToUse = targetDate || fallbackDate;
  const [label, setLabel] = useState<string>('');

  useEffect(() => {
    if (!dateToUse) {
      setLabel('');
      return;
    }

    const update = () => {
      const now = new Date();
      const target = new Date(dateToUse);
      const diffMs = target.getTime() - now.getTime();
      const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
      const diffHours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

      if (diffDays < 0) {
        setLabel('Live');
      } else if (diffDays === 0) {
        setLabel(diffHours > 0 ? `Today in ${diffHours}h` : 'Today');
      } else if (diffDays === 1) {
        setLabel('Tomorrow');
      } else if (diffDays <= 7) {
        setLabel(`${diffDays} days`);
      } else {
        setLabel(`${diffDays} days`);
      }
    };

    update();
    const id = setInterval(update, 60 * 1000);
    return () => clearInterval(id);
  }, [dateToUse]);

  if (!label) return null;

  return (
    <div className={`flex items-center gap-1.5 text-[10px] text-white/70 sm:text-xs ${className}`}>
      <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
      <span className="font-medium">{label}</span>
    </div>
  );
}
