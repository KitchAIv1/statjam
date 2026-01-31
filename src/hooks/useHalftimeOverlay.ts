/** useHalftimeOverlay - Auto-shows HALFTIME when quarter transitions from 2 → 3 */
import { useState, useEffect, useRef } from 'react';
import { InfoBarItem, createHalftimeItem } from '@/lib/services/canvas-overlay/infoBarManager';

interface Options {
  quarter: number;
  isClockRunning: boolean;
}

/**
 * Detects halftime via quarter TRANSITION (2 → 3):
 * - Shows when quarter changes from 2 to 3
 * - Clears when Q3 clock starts running
 */
export function useHalftimeOverlay({
  quarter,
  isClockRunning,
}: Options): InfoBarItem | null {
  const [halftimeItem, setHalftimeItem] = useState<InfoBarItem | null>(null);
  const prevQuarterRef = useRef<number>(quarter);

  useEffect(() => {
    const prevQuarter = prevQuarterRef.current;

    // Detect transition from Q2 → Q3 (halftime trigger)
    if (prevQuarter === 2 && quarter === 3) {
      setHalftimeItem(createHalftimeItem());
    }

    // Clear halftime when Q3 clock starts running
    if (quarter >= 3 && isClockRunning && halftimeItem) {
      setHalftimeItem(null);
    }

    // Update ref for next comparison
    prevQuarterRef.current = quarter;
  }, [quarter, isClockRunning, halftimeItem]);

  return halftimeItem;
}
