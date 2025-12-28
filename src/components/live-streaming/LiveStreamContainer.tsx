'use client';

import React, { useRef, useEffect, useState } from 'react';
import { LiveStreamSize } from './LiveStreamPlayer';

interface LiveStreamContainerProps {
  size: LiveStreamSize;
  className?: string;
  children: React.ReactNode;
  onFullscreen?: () => void;
}

export function LiveStreamContainer({
  size,
  className = '',
  children,
  onFullscreen,
}: LiveStreamContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const sizeClasses = {
    compact: 'w-full',
    expanded: 'w-full max-w-[800px]',
    fullscreen: 'fixed inset-0 z-50 w-screen h-screen',
  };

  const aspectRatioStyle = size === 'fullscreen' 
    ? {} 
    : { aspectRatio: '16/9' };

  return (
    <div
      ref={containerRef}
      className={`${sizeClasses[size]} ${className}`}
      style={{
        '--container-width': `${containerWidth}px`,
        ...aspectRatioStyle,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

