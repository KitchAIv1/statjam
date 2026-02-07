'use client';

import { useMemo } from 'react';
import { Star } from 'lucide-react';
import { useGameViewerV3Context, GameViewerV3APIResponse } from '@/providers/GameViewerV3Provider';
import { AwardDisplayCard } from '@/components/tournament/AwardDisplayCard';
import { usePlayerProfileModal } from '@/hooks/usePlayerProfileModal';
import { PlayerProfileModal } from '@/components/player/PlayerProfileModal';

interface AwardPlayer {
  id: string;
  name: string;
  profilePhotoUrl?: string;
  isCustomPlayer: boolean;
  stats: { points: number; rebounds: number; assists: number; steals: number; blocks: number };
}

/** Compute player stats from game_stats */
function computePlayerStats(
  gameData: GameViewerV3APIResponse,
  playerId: string
): { points: number; rebounds: number; assists: number; steals: number; blocks: number } {
  let points = 0, rebounds = 0, assists = 0, steals = 0, blocks = 0;

  for (const stat of gameData.stats) {
    const isPlayer = stat.player_id === playerId || stat.custom_player_id === playerId;
    if (!isPlayer) continue;

    if (stat.stat_type === 'field_goal' && stat.modifier === 'made') points += 2;
    else if (stat.stat_type === 'three_pointer' && stat.modifier === 'made') points += 3;
    else if (stat.stat_type === 'free_throw' && stat.modifier === 'made') points += 1;
    else if (stat.stat_type === 'rebound') rebounds += 1;
    else if (stat.stat_type === 'assist') assists += 1;
    else if (stat.stat_type === 'steal') steals += 1;
    else if (stat.stat_type === 'block') blocks += 1;
  }

  return { points, rebounds, assists, steals, blocks };
}

/** Find player by ID from users or customPlayers arrays */
function findAwardPlayer(gameData: GameViewerV3APIResponse, playerId: string): AwardPlayer | null {
  const stats = computePlayerStats(gameData, playerId);
  
  // Check users first
  const user = gameData.users.find((u) => u.id === playerId);
  if (user) {
    return { id: user.id, name: user.name, profilePhotoUrl: user.profile_photo_url, isCustomPlayer: false, stats };
  }
  // Check custom players
  const customPlayer = gameData.customPlayers.find((cp) => cp.id === playerId);
  if (customPlayer) {
    return { id: customPlayer.id, name: customPlayer.name, profilePhotoUrl: customPlayer.profile_photo_url, isCustomPlayer: true, stats };
  }
  return null;
}

export function GameAwardsV3() {
  const { gameData, isDark } = useGameViewerV3Context();
  const { isOpen, playerId, isCustomPlayer, gameStats, gameId, awardType, openModal, closeModal } = usePlayerProfileModal();

  // Memoize award lookups
  const { playerOfGame, hustlePlayer, pogId, hustleId } = useMemo(() => {
    if (!gameData || gameData.game.status !== 'completed') {
      return { playerOfGame: null, hustlePlayer: null, pogId: null, hustleId: null };
    }

    const game = gameData.game as Record<string, unknown>;
    const pog = (game.player_of_the_game_id || game.custom_player_of_the_game_id) as string | null;
    const hustle = (game.hustle_player_of_the_game_id || game.custom_hustle_player_of_the_game_id) as string | null;

    return {
      pogId: pog,
      hustleId: hustle,
      playerOfGame: pog ? findAwardPlayer(gameData, pog) : null,
      hustlePlayer: hustle ? findAwardPlayer(gameData, hustle) : null,
    };
  }, [gameData]);

  if (!gameData || gameData.game.status !== 'completed' || (!pogId && !hustleId)) {
    return null;
  }

  return (
    <>
      <div className={`rounded-lg p-4 mb-6 border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-orange-200 shadow-md'}`}>
        <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <Star className="w-5 h-5 text-amber-500" />
          Game Awards
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {playerOfGame && (
            <AwardDisplayCard
              playerId={playerOfGame.id}
              playerName={playerOfGame.name}
              awardType="player_of_the_game"
              stats={playerOfGame.stats}
              profilePhotoUrl={playerOfGame.profilePhotoUrl}
              isDark={isDark}
              onClick={() => openModal(playerOfGame.id, {
                gameId: gameData.game.id,
                stats: playerOfGame.stats,
                awardType: 'player_of_the_game',
                isCustomPlayer: playerOfGame.isCustomPlayer
              })}
            />
          )}
          {hustlePlayer && (
            <AwardDisplayCard
              playerId={hustlePlayer.id}
              playerName={hustlePlayer.name}
              awardType="hustle_player"
              stats={hustlePlayer.stats}
              profilePhotoUrl={hustlePlayer.profilePhotoUrl}
              isDark={isDark}
              onClick={() => openModal(hustlePlayer.id, {
                gameId: gameData.game.id,
                stats: hustlePlayer.stats,
                awardType: 'hustle_player',
                isCustomPlayer: hustlePlayer.isCustomPlayer
              })}
            />
          )}
        </div>
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
