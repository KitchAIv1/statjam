'use client';

/**
 * TeamLimitSelector Component
 * 
 * Subscription-aware team limit selector for tournament creation.
 * Shows upgrade prompts when selecting beyond free tier limits.
 */

import { useState } from 'react';
import { Crown, Lock, Users } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradeModal } from './UpgradeModal';

interface TeamLimitSelectorProps {
  value: number;
  onChange: (value: number) => void;
  style?: React.CSSProperties;
  error?: string;
}

const TEAM_OPTIONS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 16, 18, 24, 32];
const FREE_TIER_LIMIT = 6;

export function TeamLimitSelector({ 
  value, 
  onChange, 
  style,
  error 
}: TeamLimitSelectorProps) {
  const { tier, loading } = useSubscription('organizer');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [pendingValue, setPendingValue] = useState<number | null>(null);

  const isPaidTier = tier !== 'free';
  const isOverLimit = value > FREE_TIER_LIMIT && !isPaidTier;

  const handleChange = (newValue: number) => {
    if (newValue > FREE_TIER_LIMIT && !isPaidTier) {
      // Show upgrade modal
      setPendingValue(newValue);
      setShowUpgradeModal(true);
    } else {
      onChange(newValue);
    }
  };

  const handleUpgradeComplete = () => {
    // After upgrade, apply the pending value
    if (pendingValue) {
      onChange(pendingValue);
      setPendingValue(null);
    }
    setShowUpgradeModal(false);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Label with Free Tier Badge */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-900 dark:text-white">
          Maximum Teams *
        </label>
        {!isPaidTier && !loading && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
            <Users className="w-3 h-3" />
            Free: Up to {FREE_TIER_LIMIT} teams
          </span>
        )}
      </div>

      {/* Team Selection Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-2">
        {TEAM_OPTIONS.map((num) => {
          const isLocked = num > FREE_TIER_LIMIT && !isPaidTier;
          const isSelected = value === num;

          return (
            <button
              key={num}
              type="button"
              onClick={() => handleChange(num)}
              className={`
                relative p-3 rounded-lg border-2 text-center font-semibold transition-all
                ${isSelected 
                  ? 'border-orange-500 bg-orange-50 text-orange-700' 
                  : isLocked
                    ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-pointer hover:border-orange-300'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300'
                }
              `}
            >
              {num}
              {isLocked && (
                <Lock className="absolute top-1 right-1 w-3 h-3 text-gray-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Upgrade Hint */}
      {!isPaidTier && !loading && (
        <div className="flex items-center gap-2 mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <Crown className="w-4 h-4 text-orange-500 flex-shrink-0" />
          <p className="text-sm text-orange-700">
            <span className="font-medium">Need more teams?</span>{' '}
            Upgrade to Organizer Pro for unlimited teams.
          </p>
          <button
            type="button"
            onClick={() => setShowUpgradeModal(true)}
            className="ml-auto text-sm font-medium text-orange-600 hover:text-orange-700 underline"
          >
            View Plans
          </button>
        </div>
      )}

      {/* Over Limit Warning */}
      {isOverLimit && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <Lock className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">
            <span className="font-medium">Upgrade required:</span>{' '}
            {value} teams exceeds your free tier limit of {FREE_TIER_LIMIT}.
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <span className="text-xs text-red-500">{error}</span>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => {
          setShowUpgradeModal(false);
          setPendingValue(null);
        }}
        role="organizer"
        currentTier={tier}
        triggerReason={`You selected ${pendingValue} teams. Free tier allows up to ${FREE_TIER_LIMIT} teams.`}
        onSelectTier={handleUpgradeComplete}
      />
    </div>
  );
}


