'use client';

/**
 * UpgradeModal Component
 * 
 * Professional pricing modal following SaaS best practices.
 * Features billing toggle, clear hierarchy, and trust signals.
 */

import { useState } from 'react';
import { Crown, X, Shield, RefreshCw, CreditCard, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
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
      <DialogContent className="max-w-[95vw] md:max-w-[950px] lg:max-w-[1150px] p-0 overflow-hidden bg-gradient-to-b from-gray-50 to-white border-0 max-h-[90vh] overflow-y-auto rounded-2xl">
        {/* Accessibility: Hidden title and description for screen readers */}
        <VisuallyHidden>
          <DialogTitle>Choose Your {roleLabel} Plan</DialogTitle>
          <DialogDescription>
            {triggerReason ?? 'Unlock premium features and remove all limits'}
          </DialogDescription>
        </VisuallyHidden>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/80 hover:bg-white text-gray-500 hover:text-gray-700 transition-all shadow-sm border border-gray-200"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-8 py-7">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg shadow-orange-500/25">
              <Crown className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Choose Your {roleLabel} Plan
              </h2>
              <p className="text-gray-500 mt-1 flex items-center gap-2">
                {triggerReason ? (
                  <>
                    <Zap className="w-4 h-4 text-orange-500" />
                    <span>{triggerReason}</span>
                  </>
                ) : (
                  'Unlock premium features and remove all limits'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="px-6 md:px-8 py-10">
          <div className={`grid gap-5 ${getGridCols(tiers.length)} items-stretch`}>
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
        <div className="bg-gray-50 border-t border-gray-100 px-8 py-5">
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-100 rounded-full">
                <Shield className="w-4 h-4 text-green-600" />
              </div>
              <span className="font-medium">Secure Payment</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-full">
                <RefreshCw className="w-4 h-4 text-blue-600" />
              </div>
              <span className="font-medium">Cancel Anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-100 rounded-full">
                <CreditCard className="w-4 h-4 text-purple-600" />
              </div>
              <span className="font-medium">14-Day Money Back</span>
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
  if (count === 3) return 'grid-cols-1 md:grid-cols-3 max-w-4xl mx-auto';
  return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
}
