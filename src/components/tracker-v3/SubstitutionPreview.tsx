'use client';

import React from 'react';
import { RefreshCw, ArrowRight, X } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
  is_custom_player?: boolean;
}

interface SubstitutionPreviewProps {
  previewSubstitutions: Map<string, string>; // playerOutId -> playerInId
  onCourtPlayers: Player[];
  benchPlayers: Player[];
  onRemove: (playerOutId: string) => void;
}

export function SubstitutionPreview({
  previewSubstitutions,
  onCourtPlayers,
  benchPlayers,
  onRemove
}: SubstitutionPreviewProps) {
  if (previewSubstitutions.size === 0) return null;

  const substitutions = Array.from(previewSubstitutions.entries());

  return (
    <div className="p-4 rounded-xl border-2 border-green-500/50 bg-green-500/10">
      <div className="flex items-center gap-2 mb-3">
        <RefreshCw className="w-5 h-5 text-green-400" />
        <h4 className="text-sm font-semibold text-green-400 uppercase tracking-wide">
          Substitution Preview ({substitutions.length})
        </h4>
      </div>
      
      <div className="space-y-2">
        {substitutions.map(([playerOutId, playerInId]) => {
          const playerOut = onCourtPlayers.find(p => p.id === playerOutId);
          const playerIn = benchPlayers.find(p => p.id === playerInId);

          if (!playerOut || !playerIn) return null;

          return (
            <div
              key={`${playerOutId}-${playerInId}`}
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-600"
            >
              {/* Player Out */}
              <div className="flex items-center gap-2 flex-1">
                <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center text-white font-bold text-xs">
                  #{playerOut.jerseyNumber || '?'}
                </div>
                <span className="text-sm font-semibold text-white">{playerOut.name}</span>
                <span className="text-xs text-gray-400">(Out)</span>
              </div>

              {/* Arrow */}
              <ArrowRight className="w-4 h-4 text-green-400 flex-shrink-0" />

              {/* Player In */}
              <div className="flex items-center gap-2 flex-1">
                <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center text-white font-bold text-xs">
                  #{playerIn.jerseyNumber || '?'}
                </div>
                <span className="text-sm font-semibold text-white">{playerIn.name}</span>
                <span className="text-xs text-gray-400">(In)</span>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => onRemove(playerOutId)}
                className="w-6 h-6 rounded-full bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 flex items-center justify-center transition-all flex-shrink-0"
                title="Remove this substitution"
              >
                <X className="w-3 h-3 text-red-400" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

