import { useEffect, useRef, useState } from 'react';

/**
 * useShotClockViolation - Custom hook to detect shot clock violations
 * 
 * PURPOSE:
 * - Monitors shot clock countdown
 * - Detects when shot clock reaches 0 during active play
 * - Triggers violation callback to pause game clock
 * - Manages violation modal state
 * 
 * DETECTION LOGIC:
 * - Previous tick: 1 second
 * - Current tick: 0 seconds
 * - Shot clock is running
 * - Result: Violation detected
 * 
 * PHASE: Clock Automation Enhancement
 */

interface UseShotClockViolationProps {
  shotClockSeconds: number;
  shotClockRunning: boolean;
  shotClockVisible: boolean;
  possessionTeamId: string | null;
  onViolationDetected: () => void; // Callback to pause game clock
}

interface UseShotClockViolationReturn {
  showViolationModal: boolean;
  setShowViolationModal: (show: boolean) => void;
  violationTeamId: string | null;
}

export function useShotClockViolation({
  shotClockSeconds,
  shotClockRunning,
  shotClockVisible,
  possessionTeamId,
  onViolationDetected
}: UseShotClockViolationProps): UseShotClockViolationReturn {
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [violationTeamId, setViolationTeamId] = useState<string | null>(null);
  const prevSeconds = useRef(shotClockSeconds);
  const hasTriggered = useRef(false);

  useEffect(() => {
    // Reset trigger flag when shot clock resets or modal closes
    if (shotClockSeconds > 1 || !showViolationModal) {
      hasTriggered.current = false;
    }

    // Detect violation: Shot clock just reached 0
    // Conditions:
    // 1. Previous tick was 1 second
    // 2. Current tick is 0 seconds
    // 3. Shot clock is running
    // 4. Shot clock is visible (not disabled for FTs)
    // 5. Haven't already triggered (prevent duplicate)
    // 6. Team has possession (know who to attribute violation to)
    if (
      prevSeconds.current === 1 &&
      shotClockSeconds === 0 &&
      shotClockRunning &&
      shotClockVisible &&
      !hasTriggered.current &&
      possessionTeamId
    ) {
      console.log('🚨 SHOT CLOCK VIOLATION DETECTED');
      console.log(`🚨 Team with possession: ${possessionTeamId}`);
      
      // Mark as triggered to prevent duplicate
      hasTriggered.current = true;
      
      // Store violation team
      setViolationTeamId(possessionTeamId);
      
      // Show modal
      setShowViolationModal(true);
      
      // Trigger callback to pause game clock
      onViolationDetected();
    }

    // Update previous seconds for next tick
    prevSeconds.current = shotClockSeconds;
  }, [
    shotClockSeconds,
    shotClockRunning,
    shotClockVisible,
    possessionTeamId,
    onViolationDetected,
    showViolationModal
  ]);

  return {
    showViolationModal,
    setShowViolationModal,
    violationTeamId
  };
}

