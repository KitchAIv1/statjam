import { useState, useEffect, useCallback } from 'react';
import { GuideState, GuideHookReturn, defaultGuideState, GUIDE_STORAGE_KEY } from '@/lib/types/guide';

export function useOrganizerGuide(): GuideHookReturn {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [guideState, setGuideState] = useState<GuideState>(defaultGuideState);

  // Load state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(GUIDE_STORAGE_KEY);
        if (stored) {
          const parsedState = JSON.parse(stored);
          setGuideState(parsedState);
        }
      } catch (error) {
        console.warn('Failed to load guide state from localStorage:', error);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  const saveState = useCallback((newState: GuideState) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(GUIDE_STORAGE_KEY, JSON.stringify(newState));
        setGuideState(newState);
      } catch (error) {
        console.warn('Failed to save guide state to localStorage:', error);
      }
    }
  }, []);

  // Increment session count (call on dashboard load)
  const incrementSession = useCallback(() => {
    const newState = {
      ...guideState,
      sessionCount: guideState.sessionCount + 1,
      lastShown: new Date().toISOString(),
    };
    saveState(newState);
  }, [guideState, saveState]);

  // Open guide panel
  const openGuide = useCallback(() => {
    setIsGuideOpen(true);
    const newState = {
      ...guideState,
      panelOpenCount: guideState.panelOpenCount + 1,
    };
    saveState(newState);
  }, [guideState, saveState]);

  // Close guide panel
  const closeGuide = useCallback(() => {
    setIsGuideOpen(false);
  }, []);

  // Dismiss callout permanently
  const dismissCallout = useCallback(() => {
    const newState = {
      ...guideState,
      calloutDismissed: true,
    };
    saveState(newState);
  }, [guideState, saveState]);

  // Computed properties
  const showCallout = guideState.sessionCount <= 3 && !guideState.calloutDismissed;
  const showBadge = guideState.sessionCount <= 3 && guideState.panelOpenCount === 0;

  return {
    // State
    isGuideOpen,
    showCallout,
    showBadge,
    sessionCount: guideState.sessionCount,
    
    // Actions
    openGuide,
    closeGuide,
    dismissCallout,
    incrementSession,
  };
}
