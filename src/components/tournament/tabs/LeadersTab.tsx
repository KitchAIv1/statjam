"use client";

import { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { PlayerProfileModal } from '@/components/player/PlayerProfileModal';
import { usePlayerProfileModal } from '@/hooks/usePlayerProfileModal';
import { useTournamentLeaders } from '@/hooks/useTournamentLeaders';
import { LeaderboardTable, SortColumn, GamePhase } from '@/components/leaderboard';
import { useTournamentTheme } from '@/contexts/TournamentThemeContext';
import { getTournamentThemeClass } from '@/lib/utils/tournamentThemeClasses';

interface LeadersTabProps {
  tournamentId: string;
}

type LeaderCategory = 'points' | 'rebounds' | 'assists' | 'steals' | 'blocks';

// Map SortColumn to LeaderCategory for the hook
const SORT_TO_CATEGORY: Record<SortColumn, LeaderCategory> = {
  pts: 'points',
  reb: 'rebounds',
  ast: 'assists',
  stl: 'steals',
  blk: 'blocks',
  tov: 'points', // Fallback - TOV sorting is client-side only
  gp: 'points',  // Fallback - GP sorting is client-side only
};

/**
 * LeadersTab - Tournament leaders page with NBA-style leaderboard
 * Follows .cursorrules: <200 lines, single responsibility
 */
export function LeadersTab({ tournamentId }: LeadersTabProps) {
  const { theme } = useTournamentTheme();
  const [selectedCategory, setSelectedCategory] = useState<LeaderCategory>('points');
  const [minGames, setMinGames] = useState(1);
  const [gamePhase, setGamePhase] = useState<GamePhase>('all');
  const { isOpen, playerId, isCustomPlayer, openModal, closeModal } = usePlayerProfileModal();

  // ✅ OPTIMIZED: Use custom hook with batching and caching (now includes gamePhase)
  const { leaders, loading } = useTournamentLeaders(tournamentId, selectedCategory, minGames, gamePhase);

  // Handle filter changes from LeaderboardTable
  const handleFilterChange = useCallback((sortColumn: SortColumn, games: number) => {
    const category = SORT_TO_CATEGORY[sortColumn];
    if (category !== selectedCategory) {
      setSelectedCategory(category);
    }
    if (games !== minGames) {
      setMinGames(games);
    }
  }, [selectedCategory, minGames]);

  // Handle game phase filter change
  const handleGamePhaseChange = useCallback((phase: GamePhase) => {
    setGamePhase(phase);
  }, []);

  // Handle player click
  const handlePlayerClick = useCallback((id: string, isCustom: boolean) => {
    openModal(id, { isCustomPlayer: isCustom });
  }, [openModal]);

  return (
    <Card className={`rounded-xl border p-3 backdrop-blur sm:rounded-2xl sm:p-4 md:rounded-3xl md:p-6 ${getTournamentThemeClass('cardBorder', theme)} ${getTournamentThemeClass('cardBgSubtle', theme)} ${getTournamentThemeClass('cardTextMuted', theme)}`}>
      <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h2 className={`text-base font-semibold sm:text-lg md:text-xl ${getTournamentThemeClass('cardText', theme)}`}>Leaders</h2>
          <p className={`text-[10px] sm:text-xs md:text-sm ${getTournamentThemeClass('cardTextDim', theme)}`}>Advanced stats refresh in real-time</p>
        </div>
      </div>

      <Tabs defaultValue="players">
        <TabsList className={`grid w-full grid-cols-2 mb-4 ${getTournamentThemeClass('cardBgSubtle', theme)}`}>
          <TabsTrigger value="players" className={`text-[10px] sm:text-xs md:text-sm ${getTournamentThemeClass('cardText', theme)}`}>Players</TabsTrigger>
          <TabsTrigger value="teams" disabled className={`text-[10px] sm:text-xs md:text-sm ${getTournamentThemeClass('cardTextDim', theme)}`}>Teams (Coming Soon)</TabsTrigger>
        </TabsList>

        <TabsContent value="players" className="mt-0">
          <LeaderboardTable
            leaders={leaders}
            loading={loading}
            initialSortColumn="pts"
            initialPerMode="per_game"
            initialMinGames={minGames}
            initialGamePhase={gamePhase}
            onPlayerClick={handlePlayerClick}
            onFilterChange={handleFilterChange}
            onGamePhaseChange={handleGamePhaseChange}
          />
        </TabsContent>

        <TabsContent value="teams" className="mt-0">
          <div className={`rounded-2xl border p-8 text-center ${getTournamentThemeClass('cardBorder', theme)} ${getTournamentThemeClass('cardBg', theme)} ${getTournamentThemeClass('cardTextMuted', theme)}`}>
            Team leaders coming soon
          </div>
        </TabsContent>
      </Tabs>

      {/* Player Profile Modal */}
      {playerId && (
        <PlayerProfileModal 
          isOpen={isOpen} 
          onClose={closeModal} 
          playerId={playerId || ''} 
          isCustomPlayer={isCustomPlayer || false} 
        />
      )}
    </Card>
  );
}
