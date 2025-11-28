'use client';

/**
 * ClaimPreviewCard Component
 * 
 * Displays a preview of the custom player profile being claimed.
 * Shows player info, team, and stats summary.
 */

import Image from 'next/image';
import { ClaimPreview } from '@/lib/services/claimService';
import { User, Trophy, Target } from 'lucide-react';

interface ClaimPreviewCardProps {
  preview: ClaimPreview;
}

export function ClaimPreviewCard({ preview }: ClaimPreviewCardProps) {
  const { name, jerseyNumber, position, teamName, profilePhotoUrl, gamesPlayed, totalPoints } = preview;

  return (
    <div className="text-center">
      {/* Player Photo */}
      <div className="mb-4">
        {profilePhotoUrl ? (
          <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-orange-500">
            <Image
              src={profilePhotoUrl}
              alt={name}
              width={96}
              height={96}
              className="object-cover w-full h-full"
            />
          </div>
        ) : (
          <div className="w-24 h-24 mx-auto rounded-full bg-gray-700 flex items-center justify-center border-4 border-orange-500">
            <User className="w-12 h-12 text-gray-400" />
          </div>
        )}
      </div>

      {/* Player Name & Jersey */}
      <h2 className="text-2xl font-bold text-white mb-1">{name}</h2>
      <div className="flex items-center justify-center gap-2 text-gray-400 mb-4">
        {jerseyNumber !== null && <span className="text-orange-500 font-semibold">#{jerseyNumber}</span>}
        {position && <span>• {position}</span>}
      </div>

      {/* Team */}
      <div className="bg-gray-700/50 rounded-lg px-4 py-2 inline-block mb-6">
        <span className="text-gray-300">{teamName}</span>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4">
        <StatBox
          icon={<Target className="w-5 h-5 text-orange-500" />}
          value={gamesPlayed}
          label="Games Played"
        />
        <StatBox
          icon={<Trophy className="w-5 h-5 text-orange-500" />}
          value={totalPoints}
          label="Total Points"
        />
      </div>

      {/* Info Text */}
      <p className="text-gray-500 text-sm mt-6">
        Claiming this profile will transfer all game stats and awards to your StatJam account.
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

interface StatBoxProps {
  icon: React.ReactNode;
  value: number;
  label: string;
}

function StatBox({ icon, value, label }: StatBoxProps) {
  return (
    <div className="bg-gray-700/50 rounded-lg p-4">
      <div className="flex items-center justify-center gap-2 mb-1">
        {icon}
        <span className="text-2xl font-bold text-white">{value}</span>
      </div>
      <span className="text-gray-400 text-sm">{label}</span>
    </div>
  );
}

