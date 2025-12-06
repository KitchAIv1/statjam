"use client";

interface PlayerProfileCareerHighsProps {
  careerHighs: {
    points: number;
    rebounds: number;
    assists: number;
    blocks?: number;
    steals?: number;
    threes?: number;
    ftm?: number;
  };
}

/**
 * PlayerProfileCareerHighs - Career highs display (2x3 grid)
 * 
 * Contained card design for side-by-side layout
 * 
 * Follows .cursorrules: <200 lines, single responsibility
 */
export function PlayerProfileCareerHighs({ careerHighs }: PlayerProfileCareerHighsProps) {
  const hasCareerHighs = careerHighs.points > 0 || careerHighs.rebounds > 0 || careerHighs.assists > 0;

  if (!hasCareerHighs) return null;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden h-full">
      {/* Header Bar - Dark accent */}
      <div className="bg-gray-900 px-4 py-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-white">
          Career Highs
        </h2>
      </div>
      
      {/* Stats - 2x3 Grid */}
      <div className="bg-white px-4 py-4">
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <CareerHighItem value={careerHighs.points} label="PTS" emoji="🔥" />
          <CareerHighItem value={careerHighs.rebounds} label="REB" emoji="💪" />
          <CareerHighItem value={careerHighs.assists} label="AST" emoji="🎯" />
          <CareerHighItem value={careerHighs.blocks} label="BLK" emoji="🛡️" />
          <CareerHighItem value={careerHighs.steals} label="STL" emoji="🤏" />
          <CareerHighItem value={careerHighs.threes} label="3PM" emoji="👌" />
        </div>
      </div>
    </div>
  );
}

function CareerHighItem({ value, label, emoji }: { value?: number; label: string; emoji: string }) {
  const displayValue = value ?? 0;
  return (
    <div className="text-center">
      <div className="text-xl sm:text-2xl font-bold text-gray-900">{displayValue}</div>
      <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 flex items-center justify-center gap-1">
        <span>{emoji}</span> {label}
      </div>
    </div>
  );
}

