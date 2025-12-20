'use client';

/**
 * FeatureLockedOverlay Component
 * 
 * Blurs content and shows an upgrade prompt when a feature is locked.
 * Wraps any component that requires subscription upgrade.
 */

import { Lock, Crown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface FeatureLockedOverlayProps {
  children: React.ReactNode;
  isLocked: boolean;
  featureName: string;
  upgradeMessage?: string;
  onUpgrade: () => void;
  blurIntensity?: 'light' | 'medium' | 'heavy';
}

export function FeatureLockedOverlay({
  children,
  isLocked,
  featureName,
  upgradeMessage,
  onUpgrade,
  blurIntensity = 'medium',
}: FeatureLockedOverlayProps) {
  if (!isLocked) {
    return <>{children}</>;
  }

  const blurClass = {
    light: 'blur-sm',
    medium: 'blur-md',
    heavy: 'blur-lg',
  }[blurIntensity];

  return (
    <div className="relative">
      {/* Blurred Content */}
      <div className={`${blurClass} pointer-events-none select-none`}>
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-white/90 flex items-center justify-center">
        <div className="text-center p-6 max-w-sm">
          {/* Lock Icon */}
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-orange-500" />
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {featureName} is Locked
          </h3>

          {/* Message */}
          <p className="text-gray-600 text-sm mb-4">
            {upgradeMessage ?? `Upgrade your plan to access ${featureName}.`}
          </p>

          {/* Features Preview */}
          <div className="bg-orange-50 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-orange-700">
              <Sparkles className="w-4 h-4" />
              <span>Unlock all premium features</span>
            </div>
          </div>

          {/* Upgrade Button */}
          <Button
            onClick={onUpgrade}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade Now
          </Button>
        </div>
      </div>
    </div>
  );
}

