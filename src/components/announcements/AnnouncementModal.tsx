'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';
import Image from 'next/image';

export interface AnnouncementConfig {
  id: string;                    // Unique ID for localStorage tracking
  imageUrl: string;              // Image to display
  title?: string;                // Optional overlay title
  ctaText?: string;              // CTA button text
  ctaAction?: () => void;        // CTA button action
  dismissText?: string;          // Dismiss button text
  showOnce?: boolean;            // Show only once per user (default: true)
}

interface AnnouncementModalProps {
  config: AnnouncementConfig;
  isOpen?: boolean;              // External control (optional)
  onClose?: () => void;          // External close handler (optional)
}

const STORAGE_PREFIX = 'statjam_announcement_seen_';

/**
 * AnnouncementModal - Reusable announcement modal with image
 * 
 * Features:
 * - Full-screen image display
 * - Optional CTA button
 * - Shows once per user (localStorage)
 * - Lazy loads image
 * - Clean dismiss UX
 * 
 * Follows .cursorrules: <200 lines, UI only
 */
export function AnnouncementModal({ 
  config, 
  isOpen: externalIsOpen, 
  onClose: externalOnClose 
}: AnnouncementModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Determine if controlled externally or internally
  const isControlled = externalIsOpen !== undefined;
  const isOpen = isControlled ? externalIsOpen : internalIsOpen;

  // Check if announcement should show (on mount)
  useEffect(() => {
    if (isControlled) return; // Skip if externally controlled

    const storageKey = `${STORAGE_PREFIX}${config.id}`;
    const hasSeenAnnouncement = localStorage.getItem(storageKey);

    if (!hasSeenAnnouncement || config.showOnce === false) {
      // Small delay for smooth page load
      const timer = setTimeout(() => setInternalIsOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, [config.id, config.showOnce, isControlled]);

  // Handle close
  const handleClose = () => {
    if (config.showOnce !== false) {
      const storageKey = `${STORAGE_PREFIX}${config.id}`;
      localStorage.setItem(storageKey, 'true');
    }

    if (externalOnClose) {
      externalOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  // Handle CTA click
  const handleCta = () => {
    if (config.ctaAction) {
      config.ctaAction();
    }
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent 
        className="max-w-2xl p-0 border-0 overflow-hidden bg-transparent shadow-2xl"
        aria-describedby={undefined}
      >
        {/* Accessibility: Hidden title for screen readers */}
        <VisuallyHidden>
          <DialogTitle>{config.title || 'Announcement'}</DialogTitle>
        </VisuallyHidden>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-50 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
          aria-label="Close announcement"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content Container - No gaps */}
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          {/* Image Container */}
          <div className="relative w-full aspect-[4/3]">
            {/* Loading Skeleton */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse flex items-center justify-center">
                <div className="w-12 h-12 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Announcement Image */}
            <Image
              src={config.imageUrl}
              alt={config.title || 'Announcement'}
              fill
              sizes="(max-width: 768px) 100vw, 672px"
              className={`object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              priority
            />
          </div>

          {/* CTA Button - Directly below image, no gap */}
          {config.ctaAction && (
            <div className="p-4">
              <Button
                onClick={handleCta}
                className="w-full py-3 text-base font-semibold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg"
              >
                {config.ctaText || 'Learn More'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Helper to reset announcement viewed status (for testing)
 */
export function resetAnnouncementSeen(announcementId: string) {
  localStorage.removeItem(`${STORAGE_PREFIX}${announcementId}`);
}

/**
 * Helper to check if announcement was seen
 */
export function hasSeenAnnouncement(announcementId: string): boolean {
  return localStorage.getItem(`${STORAGE_PREFIX}${announcementId}`) === 'true';
}

