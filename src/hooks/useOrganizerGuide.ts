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


  // Increment session count (call on dashboard load)
  const incrementSession = useCallback(() => {
    setGuideState(prevState => {
      // Only increment if it's a new day or first time
      const today = new Date().toDateString();
      const lastShownDate = prevState.lastShown ? new Date(prevState.lastShown).toDateString() : '';
      
      if (lastShownDate === today) {
        // Same day, don't increment
        return prevState;
      }
      
      const newState = {
        ...prevState,
        sessionCount: prevState.sessionCount + 1,
        lastShown: new Date().toISOString(),
      };
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(GUIDE_STORAGE_KEY, JSON.stringify(newState));
        } catch (error) {
          console.warn('Failed to save guide state to localStorage:', error);
        }
      }
      
      return newState;
    });
  }, []); // No dependencies - uses functional state update

  // Open guide panel
  const openGuide = useCallback(() => {
    setIsGuideOpen(true);
    setGuideState(prevState => {
      const newState = {
        ...prevState,
        panelOpenCount: prevState.panelOpenCount + 1,
      };
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(GUIDE_STORAGE_KEY, JSON.stringify(newState));
        } catch (error) {
          console.warn('Failed to save guide state to localStorage:', error);
        }
      }
      
      return newState;
    });
  }, []);

  // Close guide panel
  const closeGuide = useCallback(() => {
    setIsGuideOpen(false);
  }, []);

  // Dismiss callout permanently
  const dismissCallout = useCallback(() => {
    setGuideState(prevState => {
      const newState = {
        ...prevState,
        calloutDismissed: true,
      };
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(GUIDE_STORAGE_KEY, JSON.stringify(newState));
        } catch (error) {
          console.warn('Failed to save guide state to localStorage:', error);
        }
      }
      
      return newState;
    });
  }, []);

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
