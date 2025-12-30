'use client';

/**
 * Coach Dashboard Layout
 * 
 * Wraps all coach dashboard pages with:
 * - VideoUploadProvider for global upload state
 * - GlobalUploadBanner for persistent upload status
 * 
 * @module CoachLayout
 */

import { VideoUploadProvider } from '@/contexts/VideoUploadContext';
import { GlobalUploadBanner } from '@/components/video/GlobalUploadBanner';

interface CoachLayoutProps {
  children: React.ReactNode;
}

export default function CoachLayout({ children }: CoachLayoutProps) {
  return (
    <VideoUploadProvider>
      <GlobalUploadBanner />
      {/* Add top padding when banner is visible to prevent content overlap */}
      <div className="upload-banner-spacer">
        {children}
      </div>
    </VideoUploadProvider>
  );
}

