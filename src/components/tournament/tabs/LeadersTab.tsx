"use client";

import { useEffect, useState } from 'react';
import { TournamentLeadersService, PlayerLeader } from '@/lib/services/tournamentLeadersService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { PlayerProfileModal } from '@/components/player/PlayerProfileModal';
import { usePlayerProfileModal } from '@/hooks/usePlayerProfileModal';

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
  const [leaders, setLeaders] = useState<PlayerLeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [minGames, setMinGames] = useState(1);
  const { isOpen, playerId, openModal, closeModal } = usePlayerProfileModal();

  useEffect(() => {
    let mounted = true;

    const loadLeaders = async () => {
      try {
        const data = await TournamentLeadersService.getTournamentPlayerLeaders(
          tournamentId,
          selectedCategory,
          minGames
        );
        if (mounted) {
          setLeaders(data.slice(0, 10)); // Top 10 leaders
        }
      } catch (error) {
        console.error('Failed to load leaders:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadLeaders();

    return () => {
      mounted = false;
    };
  }, [tournamentId, selectedCategory, minGames]);

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
    <Card className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80 backdrop-blur sm:rounded-3xl sm:p-6">
      <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white sm:text-xl">Leaders</h2>
          <p className="text-xs text-white/50 sm:text-sm">Advanced stats refresh in real-time</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-white/50 sm:text-xs">
          <span>Min games:</span>
          <button
            className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-white/60 hover:border-white/30 hover:text-white sm:px-3 sm:text-xs"
            onClick={() => setMinGames(minGames === 1 ? 2 : 1)}
          >
            {minGames} {minGames === 1 ? 'game' : 'games'}
          </button>
        </div>
      </div>

      <Tabs defaultValue="players" className="mt-4 sm:mt-6">
        <TabsList className="grid w-full grid-cols-2 bg-white/5">
          <TabsTrigger value="players" className="text-xs sm:text-sm">Players</TabsTrigger>
          <TabsTrigger value="teams" disabled className="text-xs sm:text-sm">Teams (Coming Soon)</TabsTrigger>
        </TabsList>

        <TabsContent value="players" className="mt-4 space-y-3 sm:mt-6 sm:space-y-4">
          {/* Category Selector */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category.key}
                onClick={() => setSelectedCategory(category.key)}
                className={`rounded-full px-2.5 py-1.5 text-[10px] font-semibold transition sm:px-4 sm:py-2 sm:text-sm ${
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
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-20 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
              ))}
            </div>
          ) : leaders.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-8 text-center text-white/60">
              No player stats available yet. Leaders will appear as games are tracked.
            </div>
          ) : (
            <div className="space-y-2.5 sm:space-y-3">
              {leaders.map((leader) => {
                const value = formatValue(leader, CATEGORIES.find(c => c.key === selectedCategory)!.valueKey);
                const initials = getInitials(leader.playerName);

                return (
                  <div
                    key={`${leader.playerId}-${selectedCategory}`}
                    onClick={() => openModal(leader.playerId)}
                    className="flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 transition hover:border-white/20 hover:bg-black/40 sm:rounded-2xl sm:px-5 sm:py-4"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
                      <div className="text-sm font-bold text-white/40 sm:text-lg">#{leader.rank}</div>
                      <Avatar className="h-8 w-8 shrink-0 border-2 border-white/10 sm:h-12 sm:w-12">
                        {leader.profilePhotoUrl ? (
                          <AvatarImage src={leader.profilePhotoUrl} alt={leader.playerName} />
                        ) : null}
                        <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10 text-white">
                          {initials || <User className="h-4 w-4 sm:h-6 sm:w-6" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-white truncate sm:text-lg">{leader.playerName}</div>
                        <div className="text-[10px] text-white/50 truncate sm:text-xs">
                          {leader.teamName} • {leader.gamesPlayed} {leader.gamesPlayed === 1 ? 'game' : 'games'}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-lg font-bold text-[#FF3B30] sm:text-2xl">{value}</div>
                      <div className="text-[10px] text-white/40 sm:text-xs">{getCategoryLabel(selectedCategory)}</div>
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
