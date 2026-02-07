'use client';

import Image from 'next/image';
import { PlayerBoxScore } from '@/lib/services/GameViewerStatsService';

interface PlayerRowV3Props {
  playerStats: PlayerBoxScore;
  isExpanded?: boolean;
  onClick?: () => void;
  isDark?: boolean;
}

export function PlayerRowV3({ playerStats, isExpanded = false, onClick, isDark = true }: PlayerRowV3Props) {
  const {
    playerName,
    profilePhotoUrl,
    jerseyNumber,
    points,
    fieldGoalsMade,
    fieldGoalsAttempted,
    threePointersMade,
    threePointersAttempted,
    freeThrowsMade,
    freeThrowsAttempted,
    rebounds,
    assists,
    steals,
    blocks,
    turnovers,
    fouls,
    minutes,
    plusMinus,
  } = playerStats;

  const fgPct = fieldGoalsAttempted > 0 ? ((fieldGoalsMade / fieldGoalsAttempted) * 100).toFixed(0) : '-';
  const tpPct = threePointersAttempted > 0 ? ((threePointersMade / threePointersAttempted) * 100).toFixed(0) : '-';
  const ftPct = freeThrowsAttempted > 0 ? ((freeThrowsMade / freeThrowsAttempted) * 100).toFixed(0) : '-';

  const textColor = isDark ? 'text-gray-300' : 'text-gray-700';
  const mutedColor = isDark ? 'text-gray-500' : 'text-gray-400';

  return (
    <tr 
      className={`border-b transition-colors ${onClick ? 'cursor-pointer' : ''} ${
        isDark ? 'border-gray-700 hover:bg-gray-800/50' : 'border-orange-200/50 hover:bg-orange-50/50'
      }`}
      onClick={onClick}
    >
      {/* Player Info */}
      <td className="py-3 px-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ${isDark ? 'bg-gray-700' : 'bg-orange-100'}`}>
            {profilePhotoUrl ? (
              <Image
                src={profilePhotoUrl}
                alt={playerName}
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center text-xs ${mutedColor}`}>
                {jerseyNumber ?? '-'}
              </div>
            )}
          </div>
          <span className={`text-sm truncate max-w-[100px] ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{playerName}</span>
        </div>
      </td>

      {/* Minutes */}
      <td className={`py-3 px-2 text-center ${textColor}`}>{minutes}</td>

      {/* Points */}
      <td className="py-3 px-2 text-center font-bold text-orange-400">{points}</td>

      {/* Field Goals */}
      <td className={`py-3 px-2 text-center text-sm ${textColor}`}>
        {fieldGoalsMade}/{fieldGoalsAttempted}
        {isExpanded && <span className={`ml-1 ${mutedColor}`}>({fgPct}%)</span>}
      </td>

      {/* 3-Pointers */}
      <td className={`py-3 px-2 text-center text-sm ${textColor}`}>
        {threePointersMade}/{threePointersAttempted}
        {isExpanded && <span className={`ml-1 ${mutedColor}`}>({tpPct}%)</span>}
      </td>

      {/* Free Throws */}
      <td className={`py-3 px-2 text-center text-sm ${textColor}`}>
        {freeThrowsMade}/{freeThrowsAttempted}
        {isExpanded && <span className={`ml-1 ${mutedColor}`}>({ftPct}%)</span>}
      </td>

      {/* Rebounds */}
      <td className={`py-3 px-2 text-center ${textColor}`}>{rebounds}</td>

      {/* Assists */}
      <td className={`py-3 px-2 text-center ${textColor}`}>{assists}</td>

      {/* Steals */}
      <td className={`py-3 px-2 text-center ${textColor}`}>{steals}</td>

      {/* Blocks */}
      <td className={`py-3 px-2 text-center ${textColor}`}>{blocks}</td>

      {/* Turnovers */}
      <td className={`py-3 px-2 text-center ${textColor}`}>{turnovers}</td>

      {/* Fouls */}
      <td className={`py-3 px-2 text-center ${textColor}`}>{fouls}</td>

      {/* Plus/Minus */}
      <td className={`py-3 px-2 text-center font-medium ${
        plusMinus > 0 ? 'text-green-500' : plusMinus < 0 ? 'text-red-500' : mutedColor
      }`}>
        {plusMinus > 0 ? `+${plusMinus}` : plusMinus}
      </td>
    </tr>
  );
}
