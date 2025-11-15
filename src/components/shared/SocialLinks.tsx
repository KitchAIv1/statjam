"use client";

import { Facebook, Instagram, Twitter } from 'lucide-react';

interface SocialLinksProps {
  variant?: 'icon-only' | 'with-labels';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * SocialLinks - Platform social media links component
 * 
 * Purpose: Display StatJam platform social media links
 * Follows .cursorrules: <200 lines, single responsibility, mobile responsive
 */
export function SocialLinks({ variant = 'icon-only', size = 'md', className = '' }: SocialLinksProps) {
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const iconSize = iconSizes[size];
  const linkClass = variant === 'icon-only'
    ? `text-white/60 hover:text-[#FF3B30] transition-colors ${iconSize}`
    : `flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm`;

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <a
        href="https://www.facebook.com/people/Statjam/61583861420167/"
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
        aria-label="Facebook"
      >
        <Facebook className={iconSize} />
        {variant === 'with-labels' && <span className="hidden sm:inline">Facebook</span>}
      </a>
      <a
        href="https://instagram.com/stat.jam"
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
        aria-label="Instagram"
      >
        <Instagram className={iconSize} />
        {variant === 'with-labels' && <span className="hidden sm:inline">Instagram</span>}
      </a>
      <a
        href="#"
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
        aria-label="X (Twitter)"
      >
        <Twitter className={iconSize} />
        {variant === 'with-labels' && <span className="hidden sm:inline">Twitter</span>}
      </a>
    </div>
  );
}

