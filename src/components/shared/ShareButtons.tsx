"use client";

import { Share2, Facebook, Twitter, Linkedin, MessageCircle, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { notify } from '@/lib/services/notificationService';
import { useState } from 'react';

interface ShareButtonsProps {
  title: string;
  url: string;
  description?: string;
  variant?: 'compact' | 'full';
  className?: string;
}

/**
 * ShareButtons - Platform-specific share buttons component
 * 
 * Purpose: Share content to social platforms
 * Follows .cursorrules: <200 lines, single responsibility, mobile responsive
 */
export function ShareButtons({ title, url, description, variant = 'compact', className = '' }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareText = description 
    ? `${title} - ${description}\n${url}`
    : `Check out ${title} on StatJam\n${url}`;

  const handleNativeShare = async () => {
    if (typeof window === 'undefined' || !navigator.share) {
      handleCopyLink();
      return;
    }

    try {
      await navigator.share({
        title,
        text: shareText,
        url,
      });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error);
        handleCopyLink();
      }
    }
  };

  const handleCopyLink = async () => {
    if (typeof window === 'undefined') return;
    
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      notify.success('Link copied!', 'Tournament link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      notify.error('Failed to copy link', 'Please try again');
    }
  };

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const handleLinkedInShare = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(linkedInUrl, '_blank', 'width=600,height=400');
  };

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNativeShare}
          className="h-7 rounded-full border-white/10 bg-[#121212] px-2.5 text-[10px] text-white/70 hover:border-white/30 hover:text-white sm:h-8 sm:px-3 sm:text-xs"
        >
          <Share2 className="mr-1 h-3 w-3 sm:mr-1.5 sm:h-3.5 sm:w-3.5" />
          <span className="hidden sm:inline">Share</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          className="h-7 rounded-full border-white/10 bg-[#121212] px-2.5 text-[10px] text-white/70 hover:border-white/30 hover:text-white sm:h-8 sm:px-3 sm:text-xs"
        >
          {copied ? (
            <>
              <Check className="mr-1 h-3 w-3 sm:mr-1.5 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">Copied</span>
            </>
          ) : (
            <>
              <Copy className="mr-1 h-3 w-3 sm:mr-1.5 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">Copy Link</span>
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={handleFacebookShare}
        className="h-8 rounded-full border-white/10 bg-[#121212] px-3 text-xs text-white/70 hover:border-blue-500/50 hover:text-white hover:bg-blue-500/10"
      >
        <Facebook className="mr-1.5 h-3.5 w-3.5" />
        <span className="hidden sm:inline">Facebook</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleTwitterShare}
        className="h-8 rounded-full border-white/10 bg-[#121212] px-3 text-xs text-white/70 hover:border-blue-400/50 hover:text-white hover:bg-blue-400/10"
      >
        <Twitter className="mr-1.5 h-3.5 w-3.5" />
        <span className="hidden sm:inline">Twitter</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleLinkedInShare}
        className="h-8 rounded-full border-white/10 bg-[#121212] px-3 text-xs text-white/70 hover:border-blue-600/50 hover:text-white hover:bg-blue-600/10"
      >
        <Linkedin className="mr-1.5 h-3.5 w-3.5" />
        <span className="hidden sm:inline">LinkedIn</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleWhatsAppShare}
        className="h-8 rounded-full border-white/10 bg-[#121212] px-3 text-xs text-white/70 hover:border-green-500/50 hover:text-white hover:bg-green-500/10"
      >
        <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
        <span className="hidden sm:inline">WhatsApp</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyLink}
        className="h-8 rounded-full border-white/10 bg-[#121212] px-3 text-xs text-white/70 hover:border-white/30 hover:text-white"
      >
        {copied ? (
          <>
            <Check className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden sm:inline">Copied</span>
          </>
        ) : (
          <>
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden sm:inline">Copy Link</span>
          </>
        )}
      </Button>
    </div>
  );
}

