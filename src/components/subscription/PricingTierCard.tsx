'use client';

/**
 * PricingTierCard Component
 * 
 * Displays a single pricing tier with features and pricing info.
 * Used in upgrade modals and pricing pages.
 */

import { Check, Crown, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import type { PricingTier } from '@/lib/types/subscription';

interface PricingTierCardProps {
  tier: PricingTier;
  isCurrentTier?: boolean;
  onSelect?: (tier: PricingTier) => void;
  compact?: boolean;
}

export function PricingTierCard({ 
  tier, 
  isCurrentTier = false, 
  onSelect,
  compact = false 
}: PricingTierCardProps) {
  const priceDisplay = tier.price === 0 ? 'Free' : `$${tier.price}`;
  const periodDisplay = getBillingPeriodLabel(tier.billingPeriod);

  return (
    <div 
      className={`
        relative rounded-xl border-2 p-4 transition-all
        ${tier.isPopular ? 'border-orange-500 bg-orange-50/50' : 'border-gray-200 bg-white'}
        ${isCurrentTier ? 'ring-2 ring-orange-500 ring-offset-2' : ''}
        ${compact ? 'p-3' : 'p-6'}
      `}
    >
      {/* Popular Badge */}
      {tier.isPopular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white">
          <Star className="w-3 h-3 mr-1" /> Most Popular
        </Badge>
      )}

      {/* Current Badge */}
      {isCurrentTier && (
        <Badge className="absolute -top-3 right-4 bg-green-500 text-white">
          Current Plan
        </Badge>
      )}

      {/* Header */}
      <div className="text-center mb-4">
        <h3 className={`font-bold text-gray-900 ${compact ? 'text-lg' : 'text-xl'}`}>
          {tier.name}
        </h3>
        <div className="mt-2">
          <span className={`font-bold text-gray-900 ${compact ? 'text-2xl' : 'text-3xl'}`}>
            {priceDisplay}
          </span>
          {tier.price > 0 && (
            <span className="text-gray-500 text-sm">/{periodDisplay}</span>
          )}
        </div>
        {tier.durationMonths > 0 && tier.billingPeriod !== 'monthly' && (
          <p className="text-xs text-gray-500 mt-1">
            {tier.durationMonths} month{tier.durationMonths > 1 ? 's' : ''} access
          </p>
        )}
      </div>

      {/* Features */}
      <ul className={`space-y-2 ${compact ? 'text-sm' : ''}`}>
        {tier.features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      {/* Best For */}
      {!compact && tier.bestFor && (
        <p className="text-xs text-gray-500 mt-4 text-center italic">
          Best for: {tier.bestFor}
        </p>
      )}

      {/* Action Button */}
      {onSelect && !isCurrentTier && (
        <Button
          onClick={() => onSelect(tier)}
          className={`w-full mt-4 ${tier.isPopular ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
          variant={tier.isPopular ? 'default' : 'outline'}
        >
          {tier.price === 0 ? 'Get Started' : 'Upgrade'}
          {tier.isPopular && <Crown className="w-4 h-4 ml-2" />}
        </Button>
      )}

      {isCurrentTier && (
        <Button disabled className="w-full mt-4" variant="outline">
          Current Plan
        </Button>
      )}
    </div>
  );
}

function getBillingPeriodLabel(period: string): string {
  switch (period) {
    case 'monthly': return 'mo';
    case 'seasonal': return 'season';
    case 'annual': return 'year';
    default: return period;
  }
}
