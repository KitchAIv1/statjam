'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface GuideState {
  sessionCount: number;
  calloutDismissed: boolean;
  panelOpenCount: number;
  lastShown?: string;
}

interface OrganizerGuideContextType {
  // State
  isGuideOpen: boolean;
  showCallout: boolean;
  showBadge: boolean;
  sessionCount: number;
  
  // Actions
  openGuide: () => void;
  closeGuide: () => void;
  dismissCallout: () => void;
  incrementSession: () => void;
}

const OrganizerGuideContext = createContext<OrganizerGuideContextType | null>(null);

const GUIDE_STORAGE_KEY = 'organizer_guide_state';

export function OrganizerGuideProvider({ children }: { children: React.ReactNode }) {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [guideState, setGuideState] = useState<GuideState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(GUIDE_STORAGE_KEY);
        return saved ? JSON.parse(saved) : {
          sessionCount: 0,
          calloutDismissed: false,
          panelOpenCount: 0,
        };
      } catch (error) {
        console.warn('Failed to load guide state from localStorage:', error);
      }
    }
    return {
      sessionCount: 0,
      calloutDismissed: false,
      panelOpenCount: 0,
    };
  });

  // Save to localStorage whenever guideState changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(GUIDE_STORAGE_KEY, JSON.stringify(guideState));
      } catch (error) {
        console.warn('Failed to save guide state to localStorage:', error);
      }
    }
  }, [guideState]);

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
      
      return {
        ...prevState,
        sessionCount: prevState.sessionCount + 1,
        lastShown: new Date().toISOString(),
      };
    });
  }, []);

  // Open guide panel
  const openGuide = useCallback(() => {
    setIsGuideOpen(true);
    setGuideState(prevState => ({
      ...prevState,
      panelOpenCount: prevState.panelOpenCount + 1,
    }));
  }, []);

  // Close guide panel
  const closeGuide = useCallback(() => {
    setIsGuideOpen(false);
  }, []);

  // Dismiss callout permanently
  const dismissCallout = useCallback(() => {
    setGuideState(prevState => ({
      ...prevState,
      calloutDismissed: true,
    }));
  }, []);

  // Computed properties
  const showCallout = guideState.sessionCount <= 3 && !guideState.calloutDismissed;
  const showBadge = guideState.sessionCount <= 3 && guideState.panelOpenCount === 0;

  const value: OrganizerGuideContextType = {
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

  return (
    <OrganizerGuideContext.Provider value={value}>
      {children}
    </OrganizerGuideContext.Provider>
  );
}

export function useOrganizerGuide() {
  const context = useContext(OrganizerGuideContext);
  if (!context) {
    throw new Error('useOrganizerGuide must be used within an OrganizerGuideProvider');
  }
  return context;
}

// Safe version that returns null if provider is not available
export function useOrganizerGuideSafe() {
  const context = useContext(OrganizerGuideContext);
  return context;
}
