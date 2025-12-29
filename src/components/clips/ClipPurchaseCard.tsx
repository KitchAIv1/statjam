'use client';

import React from 'react';
import { Film, Play, Lock, Clock, ShoppingCart } from 'lucide-react';
import { GeneratedClip } from '@/lib/services/clipService';

interface ClipPurchaseCardProps {
  gameTitle: string;
  playerName: string;
  clipCount: number;
  previewClip?: GeneratedClip;
  isPurchased: boolean;
  onPurchase: () => void;
  onPreview: () => void;
}

/**
 * Purchase card for player clip packages
 * Shows preview option and purchase button
 */
export function ClipPurchaseCard({
  gameTitle,
  playerName,
  clipCount,
  previewClip,
  isPurchased,
  onPurchase,
  onPreview,
}: ClipPurchaseCardProps) {
  const price = 5.00; // $5.00 per game

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-orange-200 hover:shadow-lg transition-all">
      {/* Preview Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Preview Button */}
        {previewClip && (
          <button
            onClick={onPreview}
            className="absolute inset-0 flex items-center justify-center group"
          >
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
            <span className="absolute bottom-3 left-3 text-xs text-white/80 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Preview clip
            </span>
          </button>
        )}

        {/* Purchase Badge */}
        {!isPurchased && (
          <div className="absolute top-3 right-3">
            <div className="flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full">
              <Lock className="w-3 h-3 text-orange-400" />
              <span className="text-xs text-white font-medium">${price.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Purchased Badge */}
        {isPurchased && (
          <div className="absolute top-3 right-3">
            <div className="flex items-center gap-1 px-2 py-1 bg-green-500 rounded-full">
              <Film className="w-3 h-3 text-white" />
              <span className="text-xs text-white font-medium">Purchased</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Game Title */}
        <h3 className="font-semibold text-gray-900 mb-1">{gameTitle}</h3>
        
        {/* Player & Clip Count */}
        <p className="text-sm text-gray-500 mb-3">
          {playerName} • {clipCount} highlights
        </p>

        {/* Stat Summary (placeholder) */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded">
            Shots
          </span>
          <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
            Rebounds
          </span>
          <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
            Assists
          </span>
        </div>

        {/* Action Button */}
        {isPurchased ? (
          <button
            onClick={onPreview}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Film className="w-4 h-4" />
            View All Clips
          </button>
        ) : (
          <button
            onClick={onPurchase}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            Purchase for ${price.toFixed(2)}
          </button>
        )}
      </div>
    </div>
  );
}

