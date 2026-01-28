/**
 * OnboardingBanner - First-time user instructions for streaming studio
 * 
 * Dismissible banner with key setup steps.
 * Uses localStorage to persist dismissal state.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { X, Info } from 'lucide-react';

const STORAGE_KEY = 'statjam_streaming_onboarding_dismissed';

interface OnboardingBannerProps {
  className?: string;
}

export function OnboardingBanner({ className = '' }: OnboardingBannerProps) {
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY) === 'true';
    setIsDismissed(dismissed);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsDismissed(true);
  };

  if (isDismissed) return null;

  return (
    <Card className={`p-3 flex-shrink-0 ${className}`}>
      <div className="flex items-start gap-2.5">
        <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="text-xs font-semibold">Getting Started</h3>
            <span className="text-[10px] px-1.5 py-0.5 bg-green-500/15 text-green-600 rounded">
              FREE BETA
            </span>
          </div>
          
          <ol className="text-[11px] text-muted-foreground space-y-1 mb-2">
            <li><span className="font-medium">1.</span> Launch game tracker from Stat Admin</li>
            <li><span className="font-medium">2.</span> Select Tournament → Live Game</li>
            <li><span className="font-medium">3.</span> Choose video source</li>
            <li><span className="font-medium">4.</span> Start Composition</li>
          </ol>
          
          <p className="text-[10px] text-muted-foreground">
            Free during beta. Premium feature coming soon.
          </p>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="h-5 w-5 p-0 flex-shrink-0 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
          <span className="sr-only">Dismiss</span>
        </Button>
      </div>
    </Card>
  );
}
