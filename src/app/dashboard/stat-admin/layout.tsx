'use client';

/**
 * Stat Admin Dashboard Layout
 *
 * Wraps stat-admin pages with:
 * - VideoUploadProvider for global upload state (required by stat-admin/video/[gameId])
 * - GlobalUploadBanner for persistent upload status
 *
 * @module StatAdminLayout
 */

import { VideoUploadProvider } from '@/contexts/VideoUploadContext';
import { GlobalUploadBanner } from '@/components/video/GlobalUploadBanner';

interface StatAdminLayoutProps {
  children: React.ReactNode;
}

export default function StatAdminLayout({ children }: StatAdminLayoutProps) {
  return (
    <VideoUploadProvider>
      <GlobalUploadBanner />
      <div className="upload-banner-spacer">
        {children}
      </div>
    </VideoUploadProvider>
  );
}
