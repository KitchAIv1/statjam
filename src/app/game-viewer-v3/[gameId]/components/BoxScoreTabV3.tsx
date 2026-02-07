'use client';

import { useMemo, useCallback } from 'react';
import { useGameViewerV3Context } from '@/providers/GameViewerV3Provider';
import { computeTeamBoxScore, TeamBoxScore, PlayerBoxScore } from '@/lib/services/GameViewerStatsService';
import { PlayerRowV3 } from './PlayerRowV3';
import { usePlayerProfileModal } from '@/hooks/usePlayerProfileModal';
import { PlayerProfileModal } from '@/components/player/PlayerProfileModal';

export function BoxScoreTabV3() {
  const { gameData, isDark } = useGameViewerV3Context();
  const { isOpen, playerId, isCustomPlayer, gameStats, gameId, awardType, openModal, closeModal } = usePlayerProfileModal();

  const teamABoxScore = useMemo<TeamBoxScore | null>(() => {
    if (!gameData) return null;
    return computeTeamBoxScore(gameData, gameData.game.team_a_id);
  }, [gameData]);

  const teamBBoxScore = useMemo<TeamBoxScore | null>(() => {
    if (!gameData) return null;
    return computeTeamBoxScore(gameData, gameData.game.team_b_id);
  }, [gameData]);

  const handlePlayerClick = useCallback((player: PlayerBoxScore) => {
    openModal(player.playerId, {
      isCustomPlayer: player.isCustomPlayer,
      stats: {
        points: player.points,
        rebounds: player.rebounds,
        assists: player.assists,
        steals: player.steals,
        blocks: player.blocks,
      },
      gameId: gameData?.game.id,
    });
  }, [openModal, gameData?.game.id]);

  if (!gameData || !teamABoxScore || !teamBBoxScore) {
    return <div className="text-gray-400 text-center py-8">Loading box score...</div>;
  }

  return (
    <>
      <div className="space-y-8">
        <TeamBoxScoreTable teamBoxScore={teamABoxScore} onPlayerClick={handlePlayerClick} isDark={isDark} />
        <TeamBoxScoreTable teamBoxScore={teamBBoxScore} onPlayerClick={handlePlayerClick} isDark={isDark} />
      </div>

      {/* Player Profile Modal */}
      <PlayerProfileModal
        isOpen={isOpen}
        onClose={closeModal}
        playerId={playerId || ''}
        isCustomPlayer={isCustomPlayer}
        gameStats={gameStats || undefined}
        gameId={gameId || undefined}
        awardType={awardType || undefined}
      />
    </>
  );
}

interface TeamBoxScoreTableProps {
  teamBoxScore: TeamBoxScore;
  onPlayerClick?: (player: PlayerBoxScore) => void;
  isDark?: boolean;
}

function TeamBoxScoreTable({ teamBoxScore, onPlayerClick, isDark = true }: TeamBoxScoreTableProps) {
  const { teamName, totalPoints, players } = teamBoxScore;

  return (
    <div className={`rounded-lg overflow-hidden ${isDark ? 'bg-gray-800/50' : 'bg-white shadow-md border border-orange-200/50'}`}>
      {/* Team Header */}
      <div className={`px-4 py-3 flex items-center justify-between ${isDark ? 'bg-gray-700/50' : 'bg-orange-50/50 border-b border-orange-200/50'}`}>
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{teamName}</h3>
        <span className="text-2xl font-bold text-orange-400">{totalPoints}</span>
      </div>

      {/* Stats Table - Mobile scrollable */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className={`text-[10px] sm:text-xs uppercase ${isDark ? 'bg-gray-700/30 text-gray-400' : 'bg-orange-50/30 text-gray-600'}`}>
              <th className="py-2 px-1 sm:px-2 text-left whitespace-nowrap">Player</th>
              <th className="py-2 px-1 sm:px-2 text-center">MIN</th>
              <th className="py-2 px-1 sm:px-2 text-center">PTS</th>
              <th className="py-2 px-1 sm:px-2 text-center">FG</th>
              <th className="py-2 px-1 sm:px-2 text-center">3PT</th>
              <th className="py-2 px-1 sm:px-2 text-center">FT</th>
              <th className="py-2 px-1 sm:px-2 text-center">REB</th>
              <th className="py-2 px-1 sm:px-2 text-center">AST</th>
              <th className="py-2 px-1 sm:px-2 text-center">STL</th>
              <th className="py-2 px-1 sm:px-2 text-center">BLK</th>
              <th className="py-2 px-1 sm:px-2 text-center">TO</th>
              <th className="py-2 px-1 sm:px-2 text-center">PF</th>
              <th className="py-2 px-1 sm:px-2 text-center">+/-</th>
            </tr>
          </thead>
          <tbody>
            {players.length > 0 ? (
              players.map((playerStats) => (
                <PlayerRowV3 
                  key={playerStats.playerId} 
                  playerStats={playerStats} 
                  onClick={onPlayerClick ? () => onPlayerClick(playerStats) : undefined}
                  isDark={isDark}
                />
              ))
            ) : (
              <tr>
                <td colSpan={13} className={`py-4 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  No player stats recorded
                </td>
              </tr>
            )}
          </tbody>
          {players.length > 0 && (
            <tfoot>
              <TeamTotalsRow players={players} isDark={isDark} />
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

interface TeamTotalsRowProps {
  players: TeamBoxScore['players'];
  isDark?: boolean;
}

function TeamTotalsRow({ players, isDark = true }: TeamTotalsRowProps) {
  const totals = players.reduce(
    (acc, p) => ({
      minutes: acc.minutes + p.minutes,
      points: acc.points + p.points,
      fgm: acc.fgm + p.fieldGoalsMade,
      fga: acc.fga + p.fieldGoalsAttempted,
      tpm: acc.tpm + p.threePointersMade,
      tpa: acc.tpa + p.threePointersAttempted,
      ftm: acc.ftm + p.freeThrowsMade,
      fta: acc.fta + p.freeThrowsAttempted,
      reb: acc.reb + p.rebounds,
      ast: acc.ast + p.assists,
      stl: acc.stl + p.steals,
      blk: acc.blk + p.blocks,
      to: acc.to + p.turnovers,
      pf: acc.pf + p.fouls,
    }),
    { minutes: 0, points: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, pf: 0 }
  );

  return (
    <tr className={`font-semibold text-xs sm:text-sm ${isDark ? 'bg-gray-700/20 text-gray-200' : 'bg-orange-50/50 text-gray-700'}`}>
      <td className="py-2 sm:py-3 px-1 sm:px-2">TOTALS</td>
      <td className="py-2 sm:py-3 px-1 sm:px-2 text-center">{totals.minutes}</td>
      <td className="py-2 sm:py-3 px-1 sm:px-2 text-center text-orange-400">{totals.points}</td>
      <td className="py-2 sm:py-3 px-1 sm:px-2 text-center">{totals.fgm}/{totals.fga}</td>
      <td className="py-2 sm:py-3 px-1 sm:px-2 text-center">{totals.tpm}/{totals.tpa}</td>
      <td className="py-2 sm:py-3 px-1 sm:px-2 text-center">{totals.ftm}/{totals.fta}</td>
      <td className="py-2 sm:py-3 px-1 sm:px-2 text-center">{totals.reb}</td>
      <td className="py-2 sm:py-3 px-1 sm:px-2 text-center">{totals.ast}</td>
      <td className="py-2 sm:py-3 px-1 sm:px-2 text-center">{totals.stl}</td>
      <td className="py-2 sm:py-3 px-1 sm:px-2 text-center">{totals.blk}</td>
      <td className="py-2 sm:py-3 px-1 sm:px-2 text-center">{totals.to}</td>
      <td className="py-2 sm:py-3 px-1 sm:px-2 text-center">{totals.pf}</td>
      <td className="py-2 sm:py-3 px-1 sm:px-2 text-center">-</td>
    </tr>
  );
}
