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
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              <Facebook className="w-3 h-3" />
              <span className="hidden sm:inline">Facebook</span>
            </a>
            <a
              href="https://instagram.com/stat.jam"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transition-colors"
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
    <Card className="border-2 border-border/50 hover:border-primary/30 transition-colors">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h3 className="font-semibold text-lg mb-1">Stay Connected with StatJam</h3>
            <p className="text-sm text-muted-foreground">
              Get the latest tips, updates, and basketball insights
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://www.facebook.com/people/Statjam/61583861420167/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all hover:scale-105 shadow-md"
            >
              <Facebook className="w-4 h-4" />
              <span className="font-medium">Facebook</span>
            </a>
            <a
              href="https://instagram.com/stat.jam"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transition-all hover:scale-105 shadow-md"
            >
              <Instagram className="w-4 h-4" />
              <span className="font-medium">Instagram</span>
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

