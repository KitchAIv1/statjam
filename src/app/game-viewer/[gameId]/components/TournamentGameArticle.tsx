/**
 * TournamentGameArticle - Professional Sports Article Display
 * 
 * PURPOSE: Display NBA/ESPN-quality game recap articles for tournament games
 * Placed below the box score in the game viewer
 */

'use client';

import React from 'react';
import { Trophy, TrendingUp, Award, Zap, Target, Users } from 'lucide-react';

interface TournamentGameArticleProps {
  gameId: string;
  isDark?: boolean;
}

export function TournamentGameArticle({ gameId, isDark = true }: TournamentGameArticleProps) {
  // Only render for specific game IDs with articles
  if (gameId !== '7f743a36-8814-4932-b116-4ce22ab3afb9') {
    return null;
  }

  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-gray-600';
  const bgCard = isDark ? 'bg-slate-900/80' : 'bg-white';
  const borderColor = isDark ? 'border-slate-700' : 'border-orange-200';
  const accentColor = isDark ? 'text-orange-400' : 'text-orange-600';

  return (
    <article className={`${bgCard} rounded-xl border ${borderColor} overflow-hidden mt-4`}>
      {/* Article Header */}
      <div className={`px-6 py-4 border-b ${borderColor} ${isDark ? 'bg-gradient-to-r from-orange-500/10 to-transparent' : 'bg-gradient-to-r from-orange-100 to-transparent'}`}>
        <div className="flex items-center gap-2 mb-2">
          <Trophy className={`w-5 h-5 ${accentColor}`} />
          <span className={`text-xs font-bold uppercase tracking-wider ${accentColor}`}>
            Game Recap
          </span>
        </div>
        <h1 className={`text-2xl md:text-3xl font-black ${textPrimary} leading-tight`}>
          Magicians Rally From 7-Point Halftime Deficit to Edge Spartans 74-71
        </h1>
        <p className={`mt-2 text-sm ${textSecondary}`}>
          Third-quarter explosion and clutch free throws seal the comeback victory
        </p>
      </div>

      {/* Lede Paragraph */}
      <div className="px-6 py-5">
        <p className={`text-base md:text-lg leading-relaxed ${textPrimary}`}>
          <span className="font-bold">In a game that showcased the heart of champions</span>, the Magicians 
          overcame a seven-point halftime deficit to defeat the Spartans <span className={`font-bold ${accentColor}`}>74-71</span> in 
          a thriller that came down to the final minutes. Down 31-38 at the break, the Magicians unleashed 
          a devastating 24-13 third-quarter run that swung momentum and ultimately proved to be the difference.
        </p>
      </div>

      {/* Quarter-by-Quarter Breakdown */}
      <div className={`mx-6 mb-5 rounded-lg overflow-hidden border ${borderColor}`}>
        <div className={`grid grid-cols-5 text-center text-xs font-bold uppercase ${isDark ? 'bg-slate-800' : 'bg-orange-50'} ${textSecondary}`}>
          <div className="py-2">Team</div>
          <div className="py-2">Q1</div>
          <div className="py-2">Q2</div>
          <div className="py-2 bg-orange-500/20 text-orange-400">Q3</div>
          <div className="py-2">Q4</div>
        </div>
        <div className={`grid grid-cols-5 text-center font-semibold ${textPrimary}`}>
          <div className={`py-3 font-bold ${accentColor}`}>MAG</div>
          <div className="py-3">13</div>
          <div className="py-3">18</div>
          <div className={`py-3 bg-orange-500/10 font-black ${accentColor}`}>24</div>
          <div className="py-3">19</div>
        </div>
        <div className={`grid grid-cols-5 text-center ${textSecondary}`}>
          <div className="py-3 font-bold">SPA</div>
          <div className="py-3">19</div>
          <div className="py-3">19</div>
          <div className="py-3 bg-orange-500/10">13</div>
          <div className="py-3">20</div>
        </div>
      </div>

      {/* The Story Section */}
      <div className="px-6 pb-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className={`w-4 h-4 ${accentColor}`} />
          <h2 className={`text-lg font-bold ${textPrimary}`}>The Turning Point</h2>
        </div>
        <p className={`text-sm md:text-base leading-relaxed ${textSecondary} mb-4`}>
          The first half belonged to the Spartans. Their aggressive offense carved through the Magicians' 
          defense, building a 38-31 lead heading into the locker room. But whatever adjustments the Magicians 
          made at halftime transformed them into a different team.
        </p>
        <p className={`text-sm md:text-base leading-relaxed ${textSecondary} mb-4`}>
          The third quarter was a masterclass in two-way basketball. The Magicians' defense clamped down, 
          forcing turnovers and contested shots while the offense found its rhythm. An <span className={`font-semibold ${textPrimary}`}>11-point swing</span> in 
          the quarter gave the Magicians a 55-51 advantage—their first lead of the game—and set the stage 
          for a dramatic finish.
        </p>
      </div>

      {/* Key Stats Grid */}
      <div className={`mx-6 mb-5 grid grid-cols-2 md:grid-cols-4 gap-3`}>
        <StatHighlight 
          icon={<Target className="w-4 h-4" />}
          label="FT Shooting"
          value="90.5%"
          detail="19/21 from the line"
          isDark={isDark}
          isHighlight
        />
        <StatHighlight 
          icon={<Zap className="w-4 h-4" />}
          label="Steals"
          value="9"
          detail="Forced 18 turnovers"
          isDark={isDark}
        />
        <StatHighlight 
          icon={<Users className="w-4 h-4" />}
          label="Assists"
          value="11"
          detail="Team basketball"
          isDark={isDark}
        />
        <StatHighlight 
          icon={<TrendingUp className="w-4 h-4" />}
          label="Q3 Margin"
          value="+11"
          detail="24-13 explosion"
          isDark={isDark}
          isHighlight
        />
      </div>

      {/* The Difference Maker Section */}
      <div className="px-6 pb-5">
        <div className="flex items-center gap-2 mb-3">
          <Award className={`w-4 h-4 ${accentColor}`} />
          <h2 className={`text-lg font-bold ${textPrimary}`}>The Difference</h2>
        </div>
        <p className={`text-sm md:text-base leading-relaxed ${textSecondary} mb-4`}>
          While the Spartans dominated the glass with <span className={`font-semibold ${textPrimary}`}>29 rebounds</span> and 
          shot an impressive 72.7% from the field, their <span className={`font-semibold ${textPrimary}`}>18 turnovers</span> proved 
          fatal. The Magicians' relentless pressure, led by <span className={`font-semibold ${textPrimary}`}>9 team steals</span>, 
          disrupted the Spartans' rhythm throughout the second half.
        </p>
        <p className={`text-sm md:text-base leading-relaxed ${textSecondary}`}>
          Perhaps the biggest story was the Magicians' precision at the charity stripe. Converting 
          <span className={`font-semibold ${textPrimary}`}> 19 of 21 free throws (90.5%)</span> gave them a crucial 
          11-point advantage in that column—more than the final margin of victory. When the pressure was highest, 
          the Magicians delivered.
        </p>
      </div>

      {/* Player & Hustle Awards */}
      <div className={`mx-6 mb-5 grid grid-cols-1 md:grid-cols-2 gap-4`}>
        {/* Player of the Game would go here if individual player data was available */}
        
        {/* Hustle Player */}
        <div className={`rounded-lg p-4 border ${borderColor} ${isDark ? 'bg-slate-800/50' : 'bg-orange-50/50'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
              <Zap className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <div className={`text-xs uppercase tracking-wider ${textSecondary}`}>Hustle Player</div>
              <div className={`font-bold ${textPrimary}`}>Jake Kearney</div>
            </div>
          </div>
          <div className={`text-sm ${textSecondary}`}>
            <span className="font-semibold">4 STL</span> • <span className="font-semibold">8 REB</span> • 12 hustle plays
          </div>
          <p className={`text-xs mt-2 ${textSecondary}`}>
            Kearney's defensive intensity set the tone, with 4 steals that sparked the third-quarter turnaround.
          </p>
        </div>

        {/* Team Defense Highlight */}
        <div className={`rounded-lg p-4 border ${borderColor} ${isDark ? 'bg-slate-800/50' : 'bg-orange-50/50'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-green-500/20' : 'bg-green-100'}`}>
              <Target className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <div className={`text-xs uppercase tracking-wider ${textSecondary}`}>Clutch Stat</div>
              <div className={`font-bold ${textPrimary}`}>Free Throw Perfection</div>
            </div>
          </div>
          <div className={`text-sm ${textSecondary}`}>
            <span className="font-semibold">90.5%</span> from the line • <span className="font-semibold">+11</span> FT margin
          </div>
          <p className={`text-xs mt-2 ${textSecondary}`}>
            When the game tightened in the fourth, the Magicians kept their composure and cashed in at the stripe.
          </p>
        </div>
      </div>

      {/* Final Analysis */}
      <div className={`px-6 py-5 ${isDark ? 'bg-slate-800/50' : 'bg-gray-50'} border-t ${borderColor}`}>
        <h2 className={`text-lg font-bold ${textPrimary} mb-3`}>Final Analysis</h2>
        <p className={`text-sm md:text-base leading-relaxed ${textSecondary}`}>
          This victory exemplified championship DNA. Facing a deficit against a physically dominant Spartans team 
          that was shooting lights-out, the Magicians didn't panic. They trusted their defensive principles, 
          executed with precision at the free throw line, and played their best basketball when it mattered most. 
          The 24-13 third quarter wasn't just a run—it was a statement. This is a team that knows how to win.
        </p>
        <div className={`mt-4 pt-4 border-t ${borderColor}`}>
          <p className={`text-xs ${textSecondary} italic`}>
            Final Score: <span className={`font-bold ${accentColor}`}>Magicians 74</span> - Spartans 71
          </p>
        </div>
      </div>
    </article>
  );
}

/** Stat Highlight Card */
function StatHighlight({ 
  icon, 
  label, 
  value, 
  detail, 
  isDark,
  isHighlight = false 
}: { 
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  isDark: boolean;
  isHighlight?: boolean;
}) {
  const bgColor = isHighlight 
    ? (isDark ? 'bg-orange-500/10 border-orange-500/30' : 'bg-orange-100 border-orange-300')
    : (isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200');
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-gray-600';
  const accentColor = isHighlight ? 'text-orange-400' : (isDark ? 'text-slate-300' : 'text-gray-700');

  return (
    <div className={`rounded-lg p-3 border ${bgColor}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className={accentColor}>{icon}</span>
        <span className={`text-xs uppercase tracking-wider ${textSecondary}`}>{label}</span>
      </div>
      <div className={`text-2xl font-black ${isHighlight ? 'text-orange-400' : textPrimary}`}>{value}</div>
      <div className={`text-xs ${textSecondary}`}>{detail}</div>
    </div>
  );
}

