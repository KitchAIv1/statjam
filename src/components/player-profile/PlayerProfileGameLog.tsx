"use client";

import type { GameStatsSummary } from '@/lib/services/playerGameStatsService';

interface PlayerProfileGameLogProps {
  games: GameStatsSummary[];
  tournamentName?: string;
}

/**
 * PlayerProfileGameLog - Complete game log with all stats
 * 
 * Reuses GameStatsSummary format from existing services
 * Light cream theme - matches public profile
 * 
 * Follows .cursorrules: <200 lines, single responsibility
 */
export function PlayerProfileGameLog({ games, tournamentName }: PlayerProfileGameLogProps) {
  const completedGames = games.filter(g => g.gameStatus === 'completed');
  const hasGames = completedGames.length > 0;

  if (!hasGames) return null;

  return (
    <div>
      {/* Game Log Container */}
      {hasGames && (
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-600">
              {tournamentName ? `${tournamentName} Game Log` : 'Game Log'}
            </h2>
            <span className="text-xs text-gray-400">
              {completedGames.length} game{completedGames.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="text-left py-2.5 px-3 font-semibold text-gray-500 text-xs">DATE</th>
                  <th className="text-left py-2.5 px-3 font-semibold text-gray-500 text-xs">OPPONENT</th>
                  <th className="text-center py-2.5 px-2 font-semibold text-gray-500 text-xs">RESULT</th>
                  <th className="text-center py-2.5 px-2 font-semibold text-gray-500 text-xs">MIN</th>
                  <th className="text-center py-2.5 px-2 font-semibold text-gray-500 text-xs">PTS</th>
                  <th className="text-center py-2.5 px-2 font-semibold text-gray-500 text-xs">REB</th>
                  <th className="text-center py-2.5 px-2 font-semibold text-gray-500 text-xs">AST</th>
                  <th className="text-center py-2.5 px-2 font-semibold text-gray-500 text-xs">STL</th>
                  <th className="text-center py-2.5 px-2 font-semibold text-gray-500 text-xs">BLK</th>
                  <th className="text-center py-2.5 px-2 font-semibold text-gray-500 text-xs">FG</th>
                  <th className="text-center py-2.5 px-2 font-semibold text-gray-500 text-xs">3P</th>
                  <th className="text-center py-2.5 px-2 font-semibold text-gray-500 text-xs">FT</th>
                </tr>
              </thead>
              <tbody>
                {completedGames.map((game, index) => (
                  <tr key={game.gameId} className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${index === 0 ? 'bg-orange-50/30' : ''}`}>
                    <td className="py-2.5 px-3 text-gray-600">{formatGameDate(game.gameDate)}</td>
                    <td className="py-2.5 px-3 text-gray-900 font-medium">
                      {game.isHome ? 'vs' : '@'} {game.opponent}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className={`text-xs font-bold ${game.result === 'W' ? 'text-green-600' : 'text-red-500'}`}>
                        {game.result} {game.finalScore}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center text-gray-600">{game.minutesPlayed}</td>
                    <td className="py-2.5 px-2 text-center font-bold text-gray-900">{game.points}</td>
                    <td className="py-2.5 px-2 text-center text-gray-700">{game.rebounds}</td>
                    <td className="py-2.5 px-2 text-center text-gray-700">{game.assists}</td>
                    <td className="py-2.5 px-2 text-center text-gray-700">{game.steals}</td>
                    <td className="py-2.5 px-2 text-center text-gray-700">{game.blocks}</td>
                    <td className="py-2.5 px-2 text-center text-gray-600 text-xs">
                      {game.fieldGoalsMade}-{game.fieldGoalsAttempted}
                    </td>
                    <td className="py-2.5 px-2 text-center text-gray-600 text-xs">
                      {game.threePointersMade}-{game.threePointersAttempted}
                    </td>
                    <td className="py-2.5 px-2 text-center text-gray-600 text-xs">
                      {game.freeThrowsMade}-{game.freeThrowsAttempted}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {completedGames.map((game, index) => (
              <div key={game.gameId} className={`p-4 ${index === 0 ? 'bg-orange-50/30' : ''}`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-xs text-gray-500">{formatGameDate(game.gameDate)}</div>
                    <div className="font-medium text-gray-900">{game.isHome ? 'vs' : '@'} {game.opponent}</div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    game.result === 'W' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {game.result} {game.finalScore}
                  </span>
                </div>
                {/* Stats Grid */}
                <div className="grid grid-cols-6 gap-1 text-center">
                  <StatCell value={game.minutesPlayed} label="MIN" />
                  <StatCell value={game.points} label="PTS" bold />
                  <StatCell value={game.rebounds} label="REB" />
                  <StatCell value={game.assists} label="AST" />
                  <StatCell value={game.steals} label="STL" />
                  <StatCell value={game.blocks} label="BLK" />
                </div>
                {/* Shooting Row */}
                <div className="grid grid-cols-3 gap-2 text-center mt-3 pt-3 border-t border-gray-100">
                  <div className="text-xs">
                    <span className="font-medium text-gray-900">{game.fieldGoalsMade}-{game.fieldGoalsAttempted}</span>
                    <span className="text-gray-500 ml-1">FG</span>
                  </div>
                  <div className="text-xs">
                    <span className="font-medium text-gray-900">{game.threePointersMade}-{game.threePointersAttempted}</span>
                    <span className="text-gray-500 ml-1">3P</span>
                  </div>
                  <div className="text-xs">
                    <span className="font-medium text-gray-900">{game.freeThrowsMade}-{game.freeThrowsAttempted}</span>
                    <span className="text-gray-500 ml-1">FT</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCell({ value, label, bold }: { value: number; label: string; bold?: boolean }) {
  return (
    <div>
      <div className={`text-sm ${bold ? 'font-bold text-gray-900' : 'text-gray-700'}`}>{value}</div>
      <div className="text-[10px] text-gray-500">{label}</div>
    </div>
  );
}

function formatGameDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
