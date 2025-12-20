'use client';

/**
 * PricingTierCard Component
 * 
 * Professional pricing tier card following SaaS best practices.
 * Features clear hierarchy, visual emphasis on popular plans.
 */

import { Check, Crown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TierBadge } from './TierBadge';
import type { PricingTier } from '@/lib/types/subscription';

interface PricingTierCardProps {
  tier: PricingTier;
  isCurrentTier?: boolean;
  onSelect?: (tier: PricingTier) => void;
  highlighted?: boolean;
}

export function PricingTierCard({ 
  tier, 
  isCurrentTier = false, 
  onSelect,
  highlighted = false
}: PricingTierCardProps) {
  const isPopular = tier.isPopular || highlighted;
  const isFree = tier.price === 0;

  return (
    <div 
      className={`
        relative flex flex-col rounded-2xl border-2 transition-all duration-200 min-w-[280px]
        ${isPopular 
          ? 'border-orange-500 bg-white shadow-lg shadow-orange-500/10 scale-[1.02]' 
          : 'border-gray-200 bg-white hover:border-gray-300'
        }
        ${isCurrentTier ? 'ring-2 ring-green-500 ring-offset-2' : ''}
      `}
    >
      {/* Top Badge */}
      {isPopular && !isCurrentTier && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <TierBadge variant="popular" size="md" />
        </div>
      )}
      {isCurrentTier && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <TierBadge variant="current" size="md" />
        </div>
      )}

      {/* Card Content */}
      <div className="p-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="text-center mb-6">
          {/* Tier Name with Badge */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <h3 className="text-lg font-bold text-gray-900">{tier.name}</h3>
            {!isFree && !isPopular && (
              <TierBadge variant="pro" size="sm" />
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline justify-center gap-1">
            {isFree ? (
              <span className="text-4xl font-bold text-gray-900">Free</span>
            ) : (
              <>
                <span className="text-4xl font-bold text-gray-900">${tier.price}</span>
                <span className="text-gray-500">/{getBillingLabel(tier.billingPeriod)}</span>
              </>
            )}
          </div>

          {/* Duration Note */}
          {tier.durationMonths > 1 && tier.billingPeriod !== 'monthly' && (
            <p className="text-sm text-gray-500 mt-1">
              {tier.durationMonths} months access
            </p>
          )}

          {/* Savings Badge for Annual */}
          {tier.billingPeriod === 'annual' && (
            <div className="mt-2">
              <TierBadge variant="best-value" size="sm" />
            </div>
          )}
        </div>

        {/* Features List */}
        <ul className="space-y-3 flex-1">
          {tier.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <div className={`
                flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5
                ${isPopular ? 'bg-orange-100' : 'bg-gray-100'}
              `}>
                <Check className={`w-3 h-3 ${isPopular ? 'text-orange-600' : 'text-gray-600'}`} />
              </div>
              <span className="text-sm text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>

        {/* Best For */}
        {tier.bestFor && (
          <p className="text-xs text-gray-500 mt-4 text-center border-t border-gray-100 pt-4">
            {tier.bestFor}
          </p>
        )}
      </div>

      {/* Action Button */}
      <div className="p-6 pt-0">
        {onSelect && !isCurrentTier ? (
          <Button
            onClick={() => onSelect(tier)}
            className={`w-full h-11 font-semibold ${
              isPopular 
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md' 
                : isFree
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {isFree ? 'Get Started Free' : 'Upgrade Now'}
            {isPopular && <Crown className="w-4 h-4 ml-2" />}
          </Button>
        ) : isCurrentTier ? (
          <Button disabled className="w-full h-11 bg-green-50 text-green-700 border-green-200">
            <Check className="w-4 h-4 mr-2" />
            Current Plan
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function getBillingLabel(period: string): string {
  switch (period) {
    case 'monthly': return 'month';
    case 'seasonal': return 'season';
    case 'annual': return 'year';
    default: return period;
  }
}

