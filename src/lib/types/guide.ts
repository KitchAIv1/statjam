// Organizer Guide Types

export interface GuideState {
  sessionCount: number;
  calloutDismissed: boolean;
  lastShown: string;
  panelOpenCount: number;
}

export interface GuideSection {
  id: string;
  title: string;
  content: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface GuideHookReturn {
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

// Default guide state
export const defaultGuideState: GuideState = {
  sessionCount: 0,
  calloutDismissed: false,
  lastShown: '',
  panelOpenCount: 0,
};

// Storage keys
export const GUIDE_STORAGE_KEY = 'statjam-organizer-guide';
