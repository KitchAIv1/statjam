'use client';

import React from 'react';
import { Check, X } from 'lucide-react';

/**
 * AutomationPresetsComparison - Visual comparison table for tracker automation presets
 * 
 * Shows stat admins the exact differences between Minimal, Balanced, and Full automation modes.
 * Helps users understand what each preset enables/disables before launching the tracker.
 * 
 * Follows .cursorrules: <200 lines, single responsibility, reusable component
 */

interface FeatureRow {
  category: string;
  feature: string;
  minimal: boolean;
  balanced: boolean;
  full: boolean;
  description?: string;
}

const FEATURES: FeatureRow[] = [
  // Clock Automation
  { category: 'Clock', feature: 'Auto-Pause on Events', minimal: false, balanced: true, full: true, description: 'Automatically pause clock on baskets, fouls, etc.' },
  { category: 'Clock', feature: 'Auto-Reset Between Quarters', minimal: false, balanced: true, full: true, description: 'Reset clock automatically when quarter changes' },
  { category: 'Clock', feature: 'Free Throw Mode', minimal: false, balanced: true, full: true, description: 'Special clock handling during free throws' },
  
  // Possession
  { category: 'Possession', feature: 'Auto-Flip Arrow', minimal: true, balanced: true, full: true, description: 'Automatically switch possession indicator' },
  { category: 'Possession', feature: 'Persist State', minimal: true, balanced: true, full: true, description: 'Remember possession across page reloads' },
  { category: 'Possession', feature: 'Jump Ball Arrow', minimal: false, balanced: false, full: true, description: 'Track alternating possession for jump balls' },
  
  // Sequences (Prompts)
  { category: 'Sequences', feature: 'Assist Prompts', minimal: false, balanced: true, full: true, description: 'Prompt to record assists after made baskets' },
  { category: 'Sequences', feature: 'Rebound Prompts', minimal: false, balanced: true, full: true, description: 'Prompt to record rebounds after missed shots' },
  { category: 'Sequences', feature: 'Block Prompts', minimal: false, balanced: true, full: true, description: 'Prompt to record blocks after missed shots' },
  { category: 'Sequences', feature: 'Link Events', minimal: false, balanced: true, full: true, description: 'Connect related events (shot → rebound → putback)' },
  { category: 'Sequences', feature: 'Free Throw Sequences', minimal: false, balanced: true, full: true, description: 'Automatic free throw attempt tracking' },
  
  // Fouls
  { category: 'Fouls', feature: 'Bonus Free Throws', minimal: false, balanced: false, full: true, description: 'Auto-trigger free throws when team in bonus' },
  { category: 'Fouls', feature: 'Foul Out Enforcement', minimal: false, balanced: false, full: true, description: 'Automatically bench players with 5+ fouls' },
  { category: 'Fouls', feature: 'Technical Ejection', minimal: false, balanced: false, full: true, description: 'Auto-eject players with 2 technical fouls' },
  
  // Undo
  { category: 'Undo', feature: 'Undo History', minimal: false, balanced: false, full: true, description: 'Enable undo/redo for stat corrections' },
];

const FeatureIcon = ({ enabled }: { enabled: boolean }) => {
  if (enabled) {
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30">
        <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800">
      <X className="w-5 h-5 text-gray-400 dark:text-gray-600" />
    </div>
  );
};

export function AutomationPresetsComparison() {
  // Group features by category
  const categories = Array.from(new Set(FEATURES.map(f => f.category)));
  
  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Automation Presets Comparison
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Choose the right automation level for your tracking needs. Each preset enables different features to balance speed and control.
        </p>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          {/* Table Header */}
          <thead>
            <tr className="border-b-2 border-gray-200 dark:border-gray-700">
              <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-gray-300">
                Feature
              </th>
              <th className="text-center py-4 px-4 font-semibold text-gray-700 dark:text-gray-300">
                🎯 Minimal<br />
                <span className="text-xs font-normal text-gray-500">(Beginner)</span>
              </th>
              <th className="text-center py-4 px-4 font-semibold text-gray-700 dark:text-gray-300">
                ⚡ Balanced<br />
                <span className="text-xs font-normal text-gray-500">(Recommended)</span>
              </th>
              <th className="text-center py-4 px-4 font-semibold text-gray-700 dark:text-gray-300">
                🚀 Full<br />
                <span className="text-xs font-normal text-gray-500">(Advanced)</span>
              </th>
            </tr>
          </thead>

          {/* Table Body - Grouped by Category */}
          <tbody>
            {categories.map((category, categoryIndex) => {
              const categoryFeatures = FEATURES.filter(f => f.category === category);
              
              return (
                <React.Fragment key={category}>
                  {/* Category Header Row */}
                  <tr className={categoryIndex > 0 ? 'border-t-2 border-gray-200 dark:border-gray-700' : ''}>
                    <td 
                      colSpan={4} 
                      className="py-3 px-4 bg-gray-50 dark:bg-gray-800/50 font-semibold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wide"
                    >
                      {category}
                    </td>
                  </tr>
                  
                  {/* Feature Rows */}
                  {categoryFeatures.map((feature, featureIndex) => (
                    <tr 
                      key={`${category}-${featureIndex}`}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {feature.feature}
                          </span>
                          {feature.description && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {feature.description}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center">
                          <FeatureIcon enabled={feature.minimal} />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center">
                          <FeatureIcon enabled={feature.balanced} />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center">
                          <FeatureIcon enabled={feature.full} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
          Which preset should I use?
        </h3>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
          <li>
            <strong>🎯 Minimal:</strong> Best for learning the tracker or when you want full manual control. No automation prompts.
          </li>
          <li>
            <strong>⚡ Balanced (Recommended):</strong> Smart automation that speeds up tracking while keeping you in control. Perfect for most games.
          </li>
          <li>
            <strong>🚀 Full:</strong> Maximum automation for experienced trackers. NBA-level features including foul enforcement and undo history.
          </li>
        </ul>
      </div>
    </div>
  );
}

