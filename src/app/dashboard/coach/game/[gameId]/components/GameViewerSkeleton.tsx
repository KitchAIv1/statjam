/**
 * GameViewerSkeleton - Loading Skeleton for Game Viewer
 * 
 * PURPOSE: Show structured loading state instead of spinner.
 * Improves perceived performance by showing layout immediately.
 * 
 * @module GameViewerSkeleton
 */

'use client';

import React from 'react';

function SkeletonBox({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className || ''}`} />
  );
}

export function GameViewerSkeleton() {
  return (
    <div className="h-screen bg-gradient-to-br from-orange-50/50 via-white to-red-50/30 flex flex-col overflow-hidden">
      {/* Header Skeleton */}
      <div className="h-20 border-b border-orange-200 bg-white px-6 flex items-center justify-between">
        {/* Team A */}
        <div className="flex items-center gap-3">
          <SkeletonBox className="w-12 h-12 rounded-full" />
          <div>
            <SkeletonBox className="w-24 h-4 mb-2" />
            <SkeletonBox className="w-16 h-3" />
          </div>
        </div>
        
        {/* Score */}
        <div className="flex items-center gap-4">
          <SkeletonBox className="w-12 h-10" />
          <SkeletonBox className="w-8 h-6" />
          <SkeletonBox className="w-12 h-10" />
        </div>
        
        {/* Team B */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <SkeletonBox className="w-24 h-4 mb-2" />
            <SkeletonBox className="w-16 h-3 ml-auto" />
          </div>
          <SkeletonBox className="w-12 h-12 rounded-full" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Skeleton */}
        <aside className="hidden lg:flex w-[35%] min-w-[280px] max-w-[400px] border-r border-orange-200 flex-col bg-white p-4">
          <SkeletonBox className="w-32 h-5 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <SkeletonBox className="w-8 h-8 rounded-full" />
                <div className="flex-1">
                  <SkeletonBox className="w-full h-3 mb-2" />
                  <SkeletonBox className="w-2/3 h-2" />
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Right Panel Skeleton */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* Tab Bar */}
          <div className="h-12 border-b border-orange-200 flex items-center px-4 gap-2">
            {['Box Score', 'Clips', 'Team', 'Opponent'].map((tab) => (
              <SkeletonBox key={tab} className="w-20 h-8" />
            ))}
          </div>
          
          {/* Tab Content */}
          <div className="flex-1 p-4">
            <SkeletonBox className="w-full h-32 mb-4" />
            <div className="grid grid-cols-2 gap-4">
              <SkeletonBox className="h-24" />
              <SkeletonBox className="h-24" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

