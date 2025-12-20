'use client';

/**
 * UpgradePrompt Component
 * 
 * Inline upgrade call-to-action shown when a feature requires upgrade.
 * Can be used as a banner, inline message, or button.
 */

import { Crown, ArrowRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface UpgradePromptProps {
  message: string;
  onUpgrade: () => void;
  variant?: 'banner' | 'inline' | 'button';
  tierName?: string;
  price?: number;
}

export function UpgradePrompt({ 
  message, 
  onUpgrade, 
  variant = 'inline',
  tierName,
  price 
}: UpgradePromptProps) {
  if (variant === 'button') {
    return (
      <Button 
        onClick={onUpgrade}
        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
      >
        <Crown className="w-4 h-4 mr-2" />
        {tierName ? `Upgrade to ${tierName}` : 'Upgrade'}
        {price && <span className="ml-1">— ${price}</span>}
      </Button>
    );
  }

  if (variant === 'banner') {
    return (
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-3 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-full">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium">{message}</p>
            {tierName && price && (
              <p className="text-sm text-white/80">
                {tierName} — ${price}/{price < 50 ? 'mo' : 'season'}
              </p>
            )}
          </div>
        </div>
        <Button 
          onClick={onUpgrade}
          variant="secondary"
          className="bg-white text-orange-600 hover:bg-white/90"
        >
          Upgrade <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    );
  }

  // Default: inline variant
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 bg-orange-50 border border-orange-200 px-3 py-2 rounded-lg">
      <Lock className="w-4 h-4 text-orange-500" />
      <span>{message}</span>
      <button 
        onClick={onUpgrade}
        className="text-orange-600 font-medium hover:underline ml-auto flex items-center gap-1"
      >
        Upgrade <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
}
