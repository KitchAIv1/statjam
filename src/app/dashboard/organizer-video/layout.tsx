'use client';

/**
 * Organizer Video Dashboard Layout
 * 
 * Wraps organizer video pages with:
 * - VideoUploadProvider for global upload state
 * - GlobalUploadBanner for persistent upload status
 * 
 * @module OrganizerVideoLayout
 */

import { VideoUploadProvider } from '@/contexts/VideoUploadContext';
import { GlobalUploadBanner } from '@/components/video/GlobalUploadBanner';

interface OrganizerVideoLayoutProps {
  children: React.ReactNode;
}

export default function OrganizerVideoLayout({ children }: OrganizerVideoLayoutProps) {
  return (
    <VideoUploadProvider>
      <GlobalUploadBanner />
      <div className="upload-banner-spacer">
        {children}
      </div>
    </VideoUploadProvider>
  );
}

