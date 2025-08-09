'use client';

import { useState, useEffect } from 'react';

export type LayoutMode = 'mobile' | 'desktop';

export interface ResponsiveConfig {
  mode: LayoutMode;
  isMobile: boolean;
  isDesktop: boolean;
  breakpoint: number;
}

export function useResponsiveLayout(breakpoint: number = 768): ResponsiveConfig {
  const [mode, setMode] = useState<LayoutMode>('desktop');
  
  useEffect(() => {
    // Function to check window size
    const checkSize = () => {
      const isMobile = window.innerWidth < breakpoint;
      setMode(isMobile ? 'mobile' : 'desktop');
    };

    // Initial check
    checkSize();

    // Add event listener
    window.addEventListener('resize', checkSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkSize);
  }, [breakpoint]);

  return {
    mode,
    isMobile: mode === 'mobile',
    isDesktop: mode === 'desktop',
    breakpoint
  };
}