'use client';

/**
 * UsageLimitWarning Component
 * 
 * Shows a warning when user is approaching or has reached their usage limit.
 * Used at trigger points (e.g., creating a team, tracking a game).
 */

import { AlertTriangle, Crown, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface UsageLimitWarningProps {
  resourceName: string;
  currentCount: number;
  maxAllowed: number;
  onUpgrade: () => void;
  onDismiss?: () => void;
}

export function UsageLimitWarning({
  resourceName,
  currentCount,
  maxAllowed,
  onUpgrade,
  onDismiss,
}: UsageLimitWarningProps) {
  const isAtLimit = currentCount >= maxAllowed;
  const isNearLimit = currentCount >= maxAllowed - 1;
  const remaining = Math.max(0, maxAllowed - currentCount);

  if (isAtLimit) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-100 rounded-full">
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-red-900">
              {resourceName} Limit Reached
            </h4>
            <p className="text-sm text-red-700 mt-1">
              You&apos;ve used all {maxAllowed} {resourceName.toLowerCase()}s in your free plan.
              Upgrade to continue creating more.
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                onClick={onUpgrade}
                size="sm"
                className="bg-red-600 hover:bg-red-700"
              >
                <Crown className="w-4 h-4 mr-1" />
                Upgrade Now
              </Button>
              {onDismiss && (
                <Button onClick={onDismiss} size="sm" variant="ghost">
                  Maybe Later
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isNearLimit) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-yellow-100 rounded-full">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-yellow-900">
              Almost at {resourceName} Limit
            </h4>
            <p className="text-sm text-yellow-700 mt-1">
              You have {remaining} {resourceName.toLowerCase()}{remaining !== 1 ? 's' : ''} remaining 
              in your free plan. Consider upgrading for unlimited access.
            </p>
            <div className="mt-3">
              <Button
                onClick={onUpgrade}
                size="sm"
                variant="outline"
                className="border-yellow-400 text-yellow-700 hover:bg-yellow-100"
              >
                <Crown className="w-4 h-4 mr-1" />
                View Upgrade Options
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}







