'use client';

/**
 * GenerateClaimLinkButton Component
 * 
 * Button to generate and display claim links for custom players.
 * Used in PlayerRosterList for coaches to invite players.
 */

import React, { useState } from 'react';
import { Link2, Copy, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ClaimService } from '@/lib/services/claimService';

interface GenerateClaimLinkButtonProps {
  customPlayerId: string;
  playerName: string;
}

export function GenerateClaimLinkButton({ customPlayerId, playerName }: GenerateClaimLinkButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [claimUrl, setClaimUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    setStatus('loading');
    setErrorMessage(null);

    const result = await ClaimService.generateClaimToken(customPlayerId);

    if (result.success && result.claimUrl) {
      const fullUrl = `${window.location.origin}${result.claimUrl}`;
      setClaimUrl(fullUrl);
      setStatus('success');
    } else {
      setErrorMessage(result.error || 'Failed to generate link');
      setStatus('error');
    }
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!claimUrl) return;

    try {
      await navigator.clipboard.writeText(claimUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = claimUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Idle state - show generate button
  // ⚠️ TEMPORARILY DISABLED FOR TESTING
  const isDisabled = true; // Set to false when ready for production
  
  if (status === 'idle' || status === 'error') {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={isDisabled ? undefined : handleGenerate}
          disabled={isDisabled}
          className={`gap-1.5 whitespace-nowrap ${
            isDisabled 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300'
          }`}
          title={isDisabled ? 'Claim link generation disabled during testing' : `Generate claim link for ${playerName}`}
        >
          <Link2 className="w-4 h-4" />
          <span className="text-xs">Claim Link</span>
        </Button>
        {status === 'error' && (
          <span className="text-xs text-red-500">{errorMessage}</span>
        )}
      </div>
    );
  }

  // Loading state
  if (status === 'loading') {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled
        className="gap-1.5 whitespace-nowrap"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs">Generating...</span>
      </Button>
    );
  }

  // Success state - show copy button
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={handleCopy}
      className={`gap-1.5 whitespace-nowrap ${
        copied 
          ? 'bg-green-50 text-green-600 border-green-300' 
          : 'bg-orange-50 text-orange-600 border-orange-300'
      }`}
      title="Copy claim link"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" />
          <span className="text-xs">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          <span className="text-xs">Copy Link</span>
        </>
      )}
    </Button>
  );
}

