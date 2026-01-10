// ============================================================================
// SOCIAL FOOTER COMPONENT
// ============================================================================
// Purpose: Reusable social media footer with StatJam links
// Follows .cursorrules: <200 lines, UI only, component pattern
// ============================================================================

'use client';

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Facebook, Instagram } from 'lucide-react';

interface SocialFooterProps {
  variant?: 'default' | 'compact'; // For different layouts
}

/**
 * SocialFooter - StatJam social media invitation component
 * 
 * Features:
 * - Facebook link
 * - Instagram link
 * - Responsive design
 * - Call-to-action text
 * 
 * Usage:
 * <SocialFooter /> - Default card style
 * <SocialFooter variant="compact" /> - Inline style
 */
export function SocialFooter({ variant = 'default' }: SocialFooterProps) {
  if (variant === 'compact') {
    return (
      <div className="border-t border-border/50 bg-muted/30 px-6 py-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Follow StatJam for tips & updates</span>
          <div className="flex items-center gap-2">
            <a
              href="https://www.facebook.com/people/Statjam/61583861420167/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-600 hover:bg-gray-700 text-white transition-colors"
            >
              <Facebook className="w-3 h-3" />
              <span className="hidden sm:inline">Facebook</span>
            </a>
            <a
              href="https://instagram.com/stat.jam"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-600 hover:bg-gray-700 text-white transition-colors"
            >
              <Instagram className="w-3 h-3" />
              <span className="hidden sm:inline">Instagram</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="border border-border/50 hover:border-primary/30 transition-colors">
      <CardContent className="px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-sm">Stay Connected with StatJam</h3>
            <p className="text-xs text-muted-foreground">
              Get the latest tips, updates, and basketball insights
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://www.facebook.com/people/Statjam/61583861420167/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-600 hover:bg-gray-700 text-white text-sm transition-colors"
            >
              <Facebook className="w-3.5 h-3.5" />
              <span className="font-medium hidden sm:inline">Facebook</span>
            </a>
            <a
              href="https://instagram.com/stat.jam"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-600 hover:bg-gray-700 text-white text-sm transition-colors"
            >
              <Instagram className="w-3.5 h-3.5" />
              <span className="font-medium hidden sm:inline">Instagram</span>
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

