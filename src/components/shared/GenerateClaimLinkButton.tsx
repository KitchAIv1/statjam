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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
  // ✅ ENABLED FOR TESTING
  const isDisabled = false;
  
  if (status === 'idle' || status === 'error') {
    return (
      <div className="flex flex-col items-end gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
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
            >
              <Link2 className="w-4 h-4" />
              <span className="text-xs">Claim Link</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs bg-gray-900 text-white border-gray-700">
            <p className="font-medium text-white">Generate Claim Link</p>
            <p className="text-xs text-gray-300">
              Create a unique link for {playerName} to claim their player profile and access their stats.
            </p>
          </TooltipContent>
        </Tooltip>
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
    <Tooltip>
      <TooltipTrigger asChild>
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
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs bg-gray-900 text-white border-gray-700">
        <p className="font-medium text-white">{copied ? 'Link Copied!' : 'Copy Claim Link'}</p>
        <p className="text-xs text-gray-300">
          {copied 
            ? 'Share this link with the player via text, email, or any messaging app.' 
            : 'Click to copy the claim link to your clipboard.'}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

