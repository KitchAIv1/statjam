/**
 * ImpactFormulaExplainer - Explains IMPACT score calculation
 * 
 * PURPOSE: Display how IMPACT scores are derived for player performance
 * 
 * Follows .cursorrules: <100 lines, single responsibility
 */

'use client';

import React from 'react';
import { Calculator, Info } from 'lucide-react';

interface ImpactFormulaExplainerProps {
  className?: string;
}

export function ImpactFormulaExplainer({ className = '' }: ImpactFormulaExplainerProps) {
  return (
    <div className={`bg-gradient-to-br from-orange-50 to-amber-50 p-5 rounded-lg border border-orange-200 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-orange-100 rounded-lg">
          <Calculator className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Understanding IMPACT Scores</h3>
          <p className="text-xs text-slate-500">How player performance is measured</p>
        </div>
      </div>

      {/* Formula Display */}
      <div className="bg-white p-4 rounded-lg border border-orange-100 mb-4">
        <p className="text-sm font-mono text-orange-800 text-center leading-relaxed">
          <span className="font-bold">IMPACT</span> = Points + (1.2 × Rebounds) + (1.5 × Assists) + (2 × Steals) + (2 × Blocks) − Turnovers − (0.5 × Fouls)
        </p>
      </div>

      {/* Explanation */}
      <div className="space-y-3 text-sm">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-slate-700">
              <strong>Why these weights?</strong> The formula rewards actions that directly influence winning:
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="bg-orange-50 p-3 rounded-lg">
            <p className="text-orange-800 font-medium text-xs uppercase mb-1">High Value (2×)</p>
            <ul className="text-orange-700 text-xs space-y-1">
              <li>• <strong>Steals</strong> – Create extra possessions</li>
              <li>• <strong>Blocks</strong> – Deny easy baskets</li>
            </ul>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-gray-800 font-medium text-xs uppercase mb-1">Medium Value (1.2-1.5×)</p>
            <ul className="text-gray-700 text-xs space-y-1">
              <li>• <strong>Rebounds</strong> (1.2×) – Possessions matter</li>
              <li>• <strong>Assists</strong> (1.5×) – Team play wins games</li>
            </ul>
          </div>
        </div>

        <div className="bg-red-50 p-3 rounded-lg mt-3">
          <p className="text-red-800 font-medium text-xs uppercase mb-1">Penalties</p>
          <ul className="text-red-700 text-xs space-y-1">
            <li>• <strong>Turnovers</strong> (−1×) – Lost possessions hurt</li>
            <li>• <strong>Fouls</strong> (−0.5×) – Put opponent on the line</li>
          </ul>
        </div>

        <div className="pt-3 border-t border-orange-100">
          <p className="text-slate-600 text-xs italic">
            💡 <strong>Pro Tip:</strong> A player with high IMPACT doesn't just score—they help the team win through defense, rebounding, and ball movement.
          </p>
        </div>
      </div>
    </div>
  );
}
