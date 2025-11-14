"use client";

import { useState } from 'react';
import { PlayerLeader } from '@/lib/services/tournamentLeadersService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { PlayerProfileModal } from '@/components/player/PlayerProfileModal';
import { usePlayerProfileModal } from '@/hooks/usePlayerProfileModal';
import { useTournamentLeaders } from '@/hooks/useTournamentLeaders';

interface LeadersTabProps {
  tournamentId: string;
}

type LeaderCategory = 'points' | 'rebounds' | 'assists' | 'steals' | 'blocks';

const CATEGORIES: Array<{ key: LeaderCategory; label: string; valueKey: keyof PlayerLeader }> = [
  { key: 'points', label: 'PPG', valueKey: 'pointsPerGame' },
  { key: 'rebounds', label: 'RPG', valueKey: 'reboundsPerGame' },
  { key: 'assists', label: 'APG', valueKey: 'assistsPerGame' },
  { key: 'steals', label: 'SPG', valueKey: 'stealsPerGame' },
  { key: 'blocks', label: 'BPG', valueKey: 'blocksPerGame' },
];

export function LeadersTab({ tournamentId }: LeadersTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<LeaderCategory>('points');
  const [minGames, setMinGames] = useState(1);
  const { isOpen, playerId, openModal, closeModal } = usePlayerProfileModal();

  // ✅ OPTIMIZED: Use custom hook with batching and caching
  const { leaders: allLeaders, loading } = useTournamentLeaders(tournamentId, selectedCategory, minGames);
  
  // Top 10 leaders
  const leaders = allLeaders.slice(0, 10);

  const formatValue = (leader: PlayerLeader, valueKey: keyof PlayerLeader): string => {
    const value = leader[valueKey] as number;
    if (typeof value === 'number') {
      return value.toFixed(1);
    }
    return String(value);
  };

  const getCategoryLabel = (category: LeaderCategory): string => {
    return CATEGORIES.find(c => c.key === category)?.label || 'PPG';
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="rounded-xl border border-white/10 bg-white/5 p-3 text-white/80 backdrop-blur sm:rounded-2xl sm:p-4 md:rounded-3xl md:p-6">
      <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold text-white sm:text-lg md:text-xl">Leaders</h2>
          <p className="text-[10px] text-white/50 sm:text-xs md:text-sm">Advanced stats refresh in real-time</p>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-white/50 sm:gap-2 sm:text-[10px] md:text-xs">
          <span>Min games:</span>
          <button
            className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] text-white/60 hover:border-white/30 hover:text-white sm:px-2.5 sm:py-1 sm:text-[10px] md:px-3 md:text-xs"
            onClick={() => setMinGames(minGames === 1 ? 2 : 1)}
          >
            {minGames} {minGames === 1 ? 'game' : 'games'}
          </button>
        </div>
      </div>

      <Tabs defaultValue="players" className="mt-3 sm:mt-4 md:mt-6">
        <TabsList className="grid w-full grid-cols-2 bg-white/5">
          <TabsTrigger value="players" className="text-[10px] sm:text-xs md:text-sm">Players</TabsTrigger>
          <TabsTrigger value="teams" disabled className="text-[10px] sm:text-xs md:text-sm">Teams (Coming Soon)</TabsTrigger>
        </TabsList>

        <TabsContent value="players" className="mt-3 space-y-2.5 sm:mt-4 sm:space-y-3 md:mt-6 md:space-y-4">
          {/* Category Selector */}
          <div className="flex flex-wrap gap-1 sm:gap-1.5 md:gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category.key}
                onClick={() => setSelectedCategory(category.key)}
                className={`rounded-full px-2 py-1 text-[9px] font-semibold transition sm:px-2.5 sm:py-1.5 sm:text-[10px] md:px-4 md:py-2 md:text-sm ${
                  selectedCategory === category.key
                    ? 'bg-[#FF3B30] text-white'
                    : 'border border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:text-white'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-2 sm:space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-16 animate-pulse rounded-xl border border-white/10 bg-white/5 sm:h-20 sm:rounded-2xl" />
              ))}
            </div>
          ) : leaders.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-center text-[10px] text-white/60 sm:rounded-2xl sm:p-6 sm:text-xs md:p-8 md:text-sm">
              No player stats available yet. Leaders will appear as games are tracked.
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
              {leaders.map((leader) => {
                const value = formatValue(leader, CATEGORIES.find(c => c.key === selectedCategory)!.valueKey);
                const initials = getInitials(leader.playerName);

                return (
                  <div
                    key={`${leader.playerId}-${selectedCategory}`}
                    onClick={() => openModal(leader.playerId)}
                    className="flex cursor-pointer items-center justify-between gap-1.5 rounded-lg border border-white/10 bg-black/30 px-2.5 py-2 transition hover:border-white/20 hover:bg-black/40 sm:gap-2 sm:rounded-xl sm:px-3 sm:py-2.5 md:rounded-2xl md:px-5 md:py-4"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2 md:gap-4">
                      <div className="text-xs font-bold text-white/40 sm:text-sm md:text-lg">#{leader.rank}</div>
                      <Avatar className="h-6 w-6 shrink-0 border-2 border-white/10 sm:h-8 sm:w-8 md:h-12 md:w-12">
                        {leader.profilePhotoUrl ? (
                          <AvatarImage src={leader.profilePhotoUrl} alt={leader.playerName} />
                        ) : null}
                        <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10 text-white">
                          {initials || <User className="h-3 w-3 sm:h-4 sm:w-4 md:h-6 md:w-6" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-semibold text-white truncate sm:text-xs md:text-lg">{leader.playerName}</div>
                        <div className="text-[9px] text-white/50 truncate sm:text-[10px] md:text-xs">
                          {leader.teamName} • {leader.gamesPlayed} {leader.gamesPlayed === 1 ? 'game' : 'games'}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-bold text-[#FF3B30] sm:text-lg md:text-2xl">{value}</div>
                      <div className="text-[9px] text-white/40 sm:text-[10px] md:text-xs">{getCategoryLabel(selectedCategory)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="teams" className="mt-6">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-8 text-center text-white/60">
            Team leaders coming soon
          </div>
        </TabsContent>
      </Tabs>

      {/* Player Profile Modal */}
      {playerId && (
        <PlayerProfileModal isOpen={isOpen} onClose={closeModal} playerId={playerId} />
      )}
    </Card>
  );
}
