'use client';

/**
 * PricingTierCard Component
 * 
 * Professional pricing tier card following SaaS best practices.
 * Features clear hierarchy, visual emphasis on popular plans.
 */

import { Check, Crown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
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
  const isAnnual = tier.billingPeriod === 'annual';

  // Determine card styling based on state
  const getCardClasses = () => {
    const base = 'relative flex flex-col rounded-2xl transition-all duration-200 h-full';
    
    if (isCurrentTier) {
      return `${base} border-2 border-green-500 bg-green-50/30`;
    }
    if (isPopular) {
      return `${base} border-2 border-orange-500 bg-gradient-to-b from-orange-50/50 to-white shadow-xl shadow-orange-500/10`;
    }
    return `${base} border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md`;
  };

  // Checkmark color based on tier
  const getCheckColor = () => {
    if (isPopular) return 'bg-orange-100 text-orange-600';
    if (isCurrentTier) return 'bg-green-100 text-green-600';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className={getCardClasses()}>
      {/* Top Badge - Better positioning */}
      {(isPopular || isCurrentTier) && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
          {isCurrentTier ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-green-500 text-white shadow-sm">
              <Check className="w-3.5 h-3.5" />
              Current Plan
            </span>
          ) : isPopular ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
              Most Popular
            </span>
          ) : null}
        </div>
      )}

      {/* Card Content */}
      <div className="p-6 pt-8 flex-1 flex flex-col">
        {/* Header */}
        <div className="text-center mb-6">
          {/* Tier Name */}
          <h3 className="text-xl font-bold text-gray-900 mb-1">{tier.name}</h3>

          {/* Price Display */}
          <div className="mt-3">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold text-gray-900">
                ${tier.price}
              </span>
              {!isFree && (
                <span className="text-gray-500 text-base">
                  /{getBillingLabel(tier.billingPeriod)}
                </span>
              )}
            </div>
            
            {/* Duration Note */}
            {tier.durationMonths > 1 && (
              <p className="text-sm text-gray-500 mt-1">
                {tier.durationMonths} months access
              </p>
            )}
          </div>

          {/* Best Value Badge for Annual */}
          {isAnnual && !isCurrentTier && (
            <div className="mt-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                <Sparkles className="w-3 h-3" />
                Best Value
              </span>
            </div>
          )}
        </div>

        {/* Features List */}
        <ul className="space-y-3 flex-1">
          {tier.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <div className={`
                flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5
                ${getCheckColor()}
              `}>
                <Check className="w-3 h-3" />
              </div>
              <span className="text-sm text-gray-700 leading-tight">{feature}</span>
            </li>
          ))}
        </ul>

        {/* Best For - Subtle footer */}
        {tier.bestFor && (
          <p className="text-xs text-gray-500 mt-5 text-center italic">
            {tier.bestFor}
          </p>
        )}
      </div>

      {/* Action Button */}
      <div className="p-6 pt-0">
        {isCurrentTier ? (
          <Button 
            disabled 
            className="w-full h-12 bg-green-100 text-green-700 border border-green-300 font-semibold cursor-default"
          >
            <Check className="w-4 h-4 mr-2" />
            Current Plan
          </Button>
        ) : onSelect ? (
          <Button
            onClick={() => onSelect(tier)}
            className={`w-full h-12 font-semibold transition-all ${
              isPopular 
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30' 
                : isFree
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {isFree ? 'Stay on Free' : 'Upgrade Now'}
            {isPopular && <Crown className="w-4 h-4 ml-2" />}
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

