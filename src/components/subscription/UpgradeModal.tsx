'use client';

/**
 * UpgradeModal Component
 * 
 * Main upgrade modal showing all available pricing tiers for a role.
 * Allows users to select and upgrade their subscription.
 */

import { useState } from 'react';
import { Crown, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
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
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white">
                  Upgrade Your {roleLabel} Plan
                </DialogTitle>
                <p className="text-white/80 text-sm mt-1">
                  {triggerReason ?? 'Unlock more features and remove limits'}
                </p>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Pricing Cards */}
        <div className="p-6">
          <div className={`grid gap-4 ${getGridCols(tiers.length)}`}>
            {tiers.map((tier) => (
              <PricingTierCard
                key={tier.id}
                tier={tier}
                isCurrentTier={tier.id === currentTier}
                onSelect={tier.id !== currentTier ? handleSelectTier : undefined}
                compact={tiers.length > 3}
              />
            ))}
          </div>

          {/* Trust Indicators */}
          <div className="mt-6 pt-4 border-t text-center">
            <p className="text-xs text-gray-500">
              🔒 Secure payment • Cancel anytime • 14-day money-back guarantee
            </p>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </DialogContent>
    </Dialog>
  );
}

function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'organizer': return 'Organizer';
    case 'coach': return 'Coach';
    case 'player': return 'Player';
    default: return 'User';
  }
}

function getGridCols(count: number): string {
  if (count <= 2) return 'md:grid-cols-2';
  if (count === 3) return 'md:grid-cols-3';
  return 'md:grid-cols-2 lg:grid-cols-4';
}
