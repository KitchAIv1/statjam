/**
 * StatDeleteConfirmation - Delete Confirmation Modal
 * 
 * PURPOSE: Extract delete confirmation to keep StatEditModalV2 under 200 lines
 * 
 * Follows .cursorrules: <200 lines component
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';

interface StatDeleteConfirmationProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function StatDeleteConfirmation({
  isOpen,
  onCancel,
  onConfirm
}: StatDeleteConfirmationProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70">
      <div className="bg-white rounded-xl p-6 max-w-sm mx-4">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Stat?</h3>
        <p className="text-sm text-gray-600 mb-4">
          This action cannot be undone. The stat will be removed from the game and live viewers will update immediately.
        </p>
        <div className="flex gap-3">
          <Button onClick={onCancel} variant="secondary" className="flex-1">
            Cancel
          </Button>
          <Button onClick={onConfirm} className="flex-1 bg-red-600 hover:bg-red-700">
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

