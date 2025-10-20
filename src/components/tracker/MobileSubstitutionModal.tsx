import React from 'react';
import { X } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  number?: string;
}

interface MobileSubstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerOut: Player | null;
  benchPlayers: Player[];
  onConfirm: (playerInId: string) => void;
}

export const MobileSubstitutionModal: React.FC<MobileSubstitutionModalProps> = ({
  isOpen,
  onClose,
  playerOut,
  benchPlayers,
  onConfirm
}) => {
  if (!isOpen || !playerOut) return null;

  const handlePlayerSelect = (playerId: string) => {
    onConfirm(playerId);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black/90">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-600">
        <h2 className="text-lg font-semibold text-white">
          Player Substitution
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-slate-700 transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Player Out Info */}
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-200 mb-1">Substituting Out:</p>
          <p className="text-lg font-semibold text-white">
            {playerOut.name}
          </p>
        </div>

        {/* Instructions */}
        <div className="mb-4">
          <p className="text-base text-gray-300 text-center">
            Select a player to substitute in:
          </p>
        </div>

        {/* Bench Players Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {benchPlayers.map((player) => (
            <button
              key={player.id}
              onClick={() => handlePlayerSelect(player.id)}
              className="flex flex-col items-center p-4 bg-slate-700 hover:bg-orange-600 border-2 border-slate-600 hover:border-orange-500 rounded-xl transition-all duration-200 active:scale-95"
            >
              <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center mb-3">
                <span className="text-white font-semibold text-sm">
                  {player.number || player.name.charAt(0)}
                </span>
              </div>
              <span className="text-white text-sm font-medium text-center leading-tight">
                {player.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-slate-800 border-t border-slate-600">
        <button
          onClick={onClose}
          className="w-full py-4 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
