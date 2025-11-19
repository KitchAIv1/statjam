'use client';

import React from 'react';
import { X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SubstitutionModalHeaderProps {
  onClose: () => void;
  multiSelectMode: boolean;
  onMultiSelectToggle: (enabled: boolean) => void;
  selectedCount: number;
  onSelectAllBench: () => void;
  onDeselectAll: () => void;
  isMultiSelectEnabled?: boolean; // ✅ New prop to control if checkbox should be enabled
}

export function SubstitutionModalHeader({
  onClose,
  multiSelectMode,
  onMultiSelectToggle,
  selectedCount,
  onSelectAllBench,
  onDeselectAll,
  isMultiSelectEnabled = true // ✅ Default to enabled
}: SubstitutionModalHeaderProps) {
  return (
    <div className="pb-4 px-6 pt-6 border-b border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <RefreshCw className="w-5 h-5 text-orange-500" />
          Player Substitution
        </h3>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0 hover:bg-red-500/10 hover:border-red-500"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Multi-Select Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label 
            htmlFor="multi-select-checkbox"
            className={`flex items-center gap-2 select-none ${
              isMultiSelectEnabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
            }`}
            onClick={(e) => {
              // Prevent event bubbling to parent
              e.stopPropagation();
            }}
          >
            <input
              id="multi-select-checkbox"
              type="checkbox"
              checked={multiSelectMode}
              disabled={!isMultiSelectEnabled}
              onChange={(e) => {
                e.stopPropagation();
                if (isMultiSelectEnabled) {
                  onMultiSelectToggle(e.target.checked);
                }
              }}
              className={`w-4 h-4 rounded border-slate-600 bg-slate-700 text-green-500 focus:ring-green-500 ${
                isMultiSelectEnabled 
                  ? 'cursor-pointer hover:border-green-400' 
                  : 'cursor-not-allowed opacity-50'
              }`}
            />
            <span className="text-sm text-gray-300">Multi-Select Mode</span>
          </label>
        </div>

        {multiSelectMode && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectAllBench}
              className="text-xs py-1 px-2 h-auto bg-slate-700 border-slate-600 hover:bg-green-500/20 hover:border-green-500"
            >
              Select All Bench
            </Button>
            {selectedCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDeselectAll}
                className="text-xs py-1 px-2 h-auto bg-slate-700 border-slate-600 hover:bg-red-500/20 hover:border-red-500"
              >
                Deselect All ({selectedCount})
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

