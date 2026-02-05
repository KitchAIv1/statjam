'use client';

/**
 * VideoCreditsModal Component
 * 
 * Modal for purchasing video tracking credits (game packs).
 * Reusable for both Coach and Organizer roles.
 * Follows .cursorrules: <200 lines, single responsibility
 */

import { useState } from 'react';
import { Video, X, Check, Loader2, Sparkles, Film } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/Button';
import { VIDEO_CREDIT_PACKAGES } from '@/config/pricing';
import { StripeService } from '@/lib/services/stripeService';
import { saveCheckoutReturnUrl } from '@/lib/utils/checkoutSession';
import { useAuthV2 } from '@/hooks/useAuthV2';
import type { VideoCreditPackage } from '@/lib/types/subscription';
import type { UserRole } from '@/lib/types/subscription';

interface VideoCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: UserRole;
  currentCredits?: number;
  onPurchaseComplete?: () => void;
}

export function VideoCreditsModal({
  isOpen,
  onClose,
  role,
  currentCredits = 0,
}: VideoCreditsModalProps) {
  const { user } = useAuthV2();
  const [selectedPackage, setSelectedPackage] = useState<VideoCreditPackage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async (pkg: VideoCreditPackage) => {
    if (!pkg.stripePriceId) {
      setError('This package is not available yet');
      return;
    }

    if (!user?.id || !user?.email) {
      setError('Please sign in to purchase');
      return;
    }

    try {
      setIsLoading(true);
      setSelectedPackage(pkg);
      setError(null);

      // Save current URL for return after checkout
      saveCheckoutReturnUrl(window.location.pathname + window.location.search);

      // Organizer dashboard is at /dashboard, others at /dashboard/{role}
      const dashboardPath = role === 'organizer' ? '/dashboard' : `/dashboard/${role}`;

      await StripeService.redirectToCheckout({
        priceId: pkg.stripePriceId,
        userId: user.id,
        userEmail: user.email,
        role: role,
        tierId: `video_${pkg.id}`,
        mode: 'payment', // One-time payment for video credits
        successUrl: `${window.location.origin}${dashboardPath}?checkout=video_success`,
        cancelUrl: `${window.location.origin}${dashboardPath}?checkout=cancelled`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process purchase');
      setIsLoading(false);
      setSelectedPackage(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0 bg-white border-orange-200 overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Video Tracking Credits</DialogTitle>
          <DialogDescription>Purchase video tracking game packs</DialogDescription>
        </VisuallyHidden>

        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Film className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Video Tracking Credits</h2>
                <p className="text-white/80 text-sm">Full stats + AI-generated highlight clips</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {currentCredits > 0 && (
            <div className="mt-4 bg-white/20 rounded-lg px-4 py-2 inline-flex items-center gap-2">
              <Video className="w-4 h-4" />
              <span className="text-sm font-medium">Current Balance: {currentCredits} games</span>
            </div>
          )}
        </div>

        {/* Intro Badge */}
        <div className="px-6 pt-4">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg px-4 py-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span className="text-sm text-amber-800 font-medium">
              🎉 Introductory Pricing – Locked in for 6 months!
            </span>
          </div>
        </div>

        {/* Packages Grid */}
        <div className="p-6 grid grid-cols-2 gap-4">
          {VIDEO_CREDIT_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-lg ${
                pkg.isPopular 
                  ? 'border-orange-500 bg-orange-50/50' 
                  : 'border-gray-200 hover:border-orange-300'
              }`}
              onClick={() => !isLoading && handlePurchase(pkg)}
            >
              {pkg.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}

              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{pkg.games}</div>
                <div className="text-sm text-gray-500 mb-2">games</div>
                
                <div className="text-2xl font-bold text-orange-600">${pkg.price}</div>
                <div className="text-xs text-gray-500">${pkg.pricePerGame.toFixed(2)}/game</div>
                
                {pkg.savings > 0 && (
                  <div className="mt-2 inline-block bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                    Save {pkg.savings}%
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mt-2">{pkg.description}</p>
              </div>

              {isLoading && selectedPackage?.id === pkg.id && (
                <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* What's Included */}
        <div className="px-6 pb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Each game includes:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Full stat tracking
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                AI multi-clip generation
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Points, rebounds, assists clips
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Next-day turnaround by midnight EST
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-6 pb-4">
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg">
              {error}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

