'use client';

/**
 * UpgradeModal Component
 * 
 * Professional pricing modal following SaaS best practices.
 * Features billing toggle, clear hierarchy, and trust signals.
 */

import { useState } from 'react';
import { Crown, X, Shield, RefreshCw, CreditCard } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { PricingTierCard } from './PricingTierCard';
import { getTiersByRole } from '@/config/pricing';
import type { PricingTier, UserRole, SubscriptionTier } from '@/lib/types/subscription';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: UserRole;
  currentTier?: SubscriptionTier;
  onSelectTier?: (tier: PricingTier) => void;
  triggerReason?: string;
}

export function UpgradeModal({
  isOpen,
  onClose,
  role,
  currentTier = 'free',
  onSelectTier,
  triggerReason,
}: UpgradeModalProps) {
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);
  const tiers = getTiersByRole(role);
  const roleLabel = getRoleLabel(role);

  const handleSelectTier = (tier: PricingTier) => {
    setSelectedTier(tier);
    if (onSelectTier) {
      onSelectTier(tier);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] md:max-w-[900px] lg:max-w-[1100px] p-0 overflow-hidden bg-gray-50 border-0 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg shadow-orange-500/20">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Choose Your {roleLabel} Plan
              </h2>
              <p className="text-gray-500 mt-1">
                {triggerReason ?? 'Unlock premium features and remove all limits'}
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="px-8 py-8">
          <div className={`grid gap-6 ${getGridCols(tiers.length)}`}>
            {tiers.map((tier) => (
              <PricingTierCard
                key={tier.id}
                tier={tier}
                isCurrentTier={tier.id === currentTier}
                onSelect={tier.id !== currentTier ? handleSelectTier : undefined}
                highlighted={tier.isPopular}
              />
            ))}
          </div>
        </div>

        {/* Trust Signals */}
        <div className="bg-white border-t border-gray-200 px-8 py-5">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-500" />
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-500" />
              <span>Cancel Anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-500" />
              <span>14-Day Money Back</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'organizer': return 'Organizer';
    case 'coach': return 'Coach';
    case 'player': return 'Player';
    default: return '';
  }
}

function getGridCols(count: number): string {
  if (count <= 2) return 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto';
  if (count === 3) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
}

