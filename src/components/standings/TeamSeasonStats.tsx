// ============================================================================
// TEAM SEASON STATS - Aggregate team stats display (<150 lines)
// Purpose: Show team-wide season stats (FG%, 3P%, FT%, RPG, APG, etc.)
// Follows .cursorrules: Single responsibility, reusable, no extra containers
// ============================================================================

'use client';

import React, { useMemo } from 'react';
import { PlayerSeasonStats } from './PlayerStatsTable';
import { Target, Activity, Shield, Zap } from 'lucide-react';
import { TeamStatsGuide } from '@/components/shared/TeamStatsGuide';

interface TeamSeasonStatsProps {
  players: PlayerSeasonStats[];
  gamesPlayed: number;
}

interface TeamTotals {
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fgMade: number;
  fgAttempts: number;
  threePtMade: number;
  threePtAttempts: number;
  ftMade: number;
  ftAttempts: number;
}

export function TeamSeasonStats({ players, gamesPlayed }: TeamSeasonStatsProps) {
  // Aggregate all player stats into team totals
  const totals = useMemo<TeamTotals>(() => {
    return players.reduce((acc, p) => ({
      points: acc.points + p.points,
      rebounds: acc.rebounds + p.rebounds,
      assists: acc.assists + p.assists,
      steals: acc.steals + p.steals,
      blocks: acc.blocks + p.blocks,
      turnovers: acc.turnovers + p.turnovers,
      fgMade: acc.fgMade + p.fgMade,
      fgAttempts: acc.fgAttempts + p.fgAttempts,
      threePtMade: acc.threePtMade + p.threePtMade,
      threePtAttempts: acc.threePtAttempts + p.threePtAttempts,
      ftMade: acc.ftMade + p.ftMade,
      ftAttempts: acc.ftAttempts + p.ftAttempts,
    }), { points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0, fgMade: 0, fgAttempts: 0, threePtMade: 0, threePtAttempts: 0, ftMade: 0, ftAttempts: 0 });
  }, [players]);

  // Calculate percentages
  const fgPct = totals.fgAttempts > 0 ? ((totals.fgMade / totals.fgAttempts) * 100).toFixed(1) : '0.0';
  const threePct = totals.threePtAttempts > 0 ? ((totals.threePtMade / totals.threePtAttempts) * 100).toFixed(1) : '0.0';
  const ftPct = totals.ftAttempts > 0 ? ((totals.ftMade / totals.ftAttempts) * 100).toFixed(1) : '0.0';

  // Advanced Stats (accurate formulas matching industry standards)
  // eFG% = (FGM + 0.5 * 3PM) / FGA - weights 3s for their extra value
  const efgPct = totals.fgAttempts > 0 
    ? (((totals.fgMade + 0.5 * totals.threePtMade) / totals.fgAttempts) * 100).toFixed(1) 
    : '0.0';
  // TS% = PTS / (2 * (FGA + 0.44 * FTA)) - true scoring efficiency including FTs
  const tsPct = (totals.fgAttempts + 0.44 * totals.ftAttempts) > 0
    ? ((totals.points / (2 * (totals.fgAttempts + 0.44 * totals.ftAttempts))) * 100).toFixed(1)
    : '0.0';
  // AST/TO Ratio - ball security metric
  const astToRatio = totals.turnovers > 0 
    ? (totals.assists / totals.turnovers).toFixed(1) 
    : totals.assists > 0 ? totals.assists.toFixed(1) : '0.0';
  // 3PA Rate = 3PA / FGA - how often team shoots 3s
  const threePtRate = totals.fgAttempts > 0 
    ? ((totals.threePtAttempts / totals.fgAttempts) * 100).toFixed(1) 
    : '0.0';

  // Per-game averages
  const games = gamesPlayed || 1;
  const ppg = (totals.points / games).toFixed(1);
  const rpg = (totals.rebounds / games).toFixed(1);
  const apg = (totals.assists / games).toFixed(1);
  const spg = (totals.steals / games).toFixed(1);
  const bpg = (totals.blocks / games).toFixed(1);
  const topg = (totals.turnovers / games).toFixed(1);

  if (players.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Activity className="w-10 h-10 text-gray-300 mx-auto mb-2" />
        <p>No stats available yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Stats Guide */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">Team Season Stats</h3>
        <TeamStatsGuide />
      </div>

      {/* Shooting Stats */}
      <div className="flex items-center gap-2 mb-2">
        <Target className="w-4 h-4 text-orange-500" />
        <span className="text-sm font-semibold text-gray-700">Shooting</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <StatBox label="FG%" value={`${fgPct}%`} sub={`${totals.fgMade}/${totals.fgAttempts}`} />
        <StatBox label="3P%" value={`${threePct}%`} sub={`${totals.threePtMade}/${totals.threePtAttempts}`} />
        <StatBox label="FT%" value={`${ftPct}%`} sub={`${totals.ftMade}/${totals.ftAttempts}`} />
      </div>

      {/* Advanced Stats */}
      <div className="flex items-center gap-2 mb-2 mt-6">
        <Zap className="w-4 h-4 text-orange-500" />
        <span className="text-sm font-semibold text-gray-700">Advanced</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox label="eFG%" value={`${efgPct}%`} sub="Effective FG" />
        <StatBox label="TS%" value={`${tsPct}%`} sub="True Shooting" />
        <StatBox label="AST/TO" value={astToRatio} sub="Ball Security" />
        <StatBox label="3PA Rate" value={`${threePtRate}%`} sub="3PT Frequency" />
      </div>

      {/* Per Game Averages */}
      <div className="flex items-center gap-2 mb-2 mt-6">
        <Activity className="w-4 h-4 text-orange-500" />
        <span className="text-sm font-semibold text-gray-700">Per Game Averages</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        <StatBox label="PPG" value={ppg} highlight />
        <StatBox label="RPG" value={rpg} />
        <StatBox label="APG" value={apg} />
        <StatBox label="SPG" value={spg} />
        <StatBox label="BPG" value={bpg} />
        <StatBox label="TOPG" value={topg} negative />
      </div>

      {/* Season Totals */}
      <div className="flex items-center gap-2 mb-2 mt-6">
        <Shield className="w-4 h-4 text-orange-500" />
        <span className="text-sm font-semibold text-gray-700">Season Totals</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        <StatBox label="PTS" value={totals.points} />
        <StatBox label="REB" value={totals.rebounds} />
        <StatBox label="AST" value={totals.assists} />
        <StatBox label="STL" value={totals.steals} />
        <StatBox label="BLK" value={totals.blocks} />
        <StatBox label="TO" value={totals.turnovers} negative />
      </div>
    </div>
  );
}

// Minimal stat box - no heavy containers
function StatBox({ label, value, sub, highlight, negative }: { 
  label: string; 
  value: string | number; 
  sub?: string;
  highlight?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="text-center py-2 px-1 rounded-lg bg-gray-50 border border-gray-100">
      <p className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-lg font-bold ${highlight ? 'text-orange-600' : negative ? 'text-red-500' : 'text-gray-800'}`}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
    </div>
  );
}

