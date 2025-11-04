"use client";

import React, { useMemo, memo } from 'react';
import LiveGameCard from "@/components/LiveGameCard";
import { useLiveGamesHybrid } from "@/hooks/useLiveGamesHybrid";
import { useRouter } from "next/navigation";

interface LiveTournamentSectionProps {
  onWatchLive?: () => void;
  onViewTournament?: () => void;
}

export function LiveTournamentSection({ onWatchLive, onViewTournament }: LiveTournamentSectionProps) {
  // 🏀 NBA-LEVEL SOLUTION: Use hybrid approach (WebSocket + raw fetch fallback)
  const { games: actualGames, loading: actualLoading, error, connectionStatus } = useLiveGamesHybrid();
  
  // Group by organizer - STABLE MEMOIZATION
  const grouped = useMemo(() => {
    console.log('🔄 LiveTournamentSection: Regrouping games (this should be rare)');
    const map = new Map<string, { organizerName: string; live: typeof actualGames; scheduled: typeof actualGames }>();
    
    if (!actualGames || actualGames.length === 0) {
      return Array.from(map.entries());
    }
    
    for (const g of actualGames) {
      // 🚨 V2 data uses tournament_name, not organizerId/organizerName
      const orgId = g.tournament_id || 'unknown';
      const orgName = g.tournament_name || 'Unknown Tournament';
      if (!map.has(orgId)) map.set(orgId, { organizerName: orgName, live: [], scheduled: [] });
      const bucket = map.get(orgId)!;
      const status = String(g.status || '').toLowerCase();
      if (['live','in_progress','overtime'].includes(status)) bucket.live.push(g);
      if (status === 'scheduled') bucket.scheduled.push(g);
    }
    return Array.from(map.entries());
  }, [actualGames]);
  const router = useRouter();
  // Mock data retained below for reference
  const tournaments = [
    {
      name: "Summer League Championship",
      status: "LIVE",
      statusColor: "bg-red-500",
      teams: [
        { name: "Lightning Bolts", score: 82, logo: "⚡" },
        { name: "Thunder Hawks", score: 78, logo: "🦅" }
      ],
      time: "4th 2:34",
      viewers: "1,247"
    },
    {
      name: "City Basketball League",
      status: "LIVE", 
      statusColor: "bg-red-500",
      teams: [
        { name: "Court Crushers", score: 58, logo: "🏀" },
        { name: "Street Kings", score: 65, logo: "👑" }
      ],
      time: "3rd 8:12",
      viewers: "892"
    },
    {
      name: "Regional Championships",
      status: "FINAL",
      statusColor: "bg-gray-500",
      teams: [
        { name: "Ice Wolves", score: 98, logo: "🐺" },
        { name: "Fire Dragons", score: 103, logo: "🐲" }
      ],
      time: "Final",
      viewers: "2,156"
    },
    {
      name: "Youth Development League", 
      status: "LIVE",
      statusColor: "bg-red-500",
      teams: [
        { name: "Future Legends", score: 41, logo: "⭐" },
        { name: "Rising Stars", score: 45, logo: "🌟" }
      ],
      time: "2nd 4:55",
      viewers: "623"
    }
  ];

  return (
    <section id="live-games" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
      {/* Header */}
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                <span className="text-orange-500">Live</span> Tournament Action
                <span className="hidden sm:inline"> — Real‑Time Updates, No Refresh</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Watch scores, clocks, and play‑by‑play update in under 3 seconds — powered by WebSockets with smart fallback.
              </p>
              {actualGames && actualGames.length === 0 && (
                <p className="text-base sm:text-lg text-gray-500 max-w-3xl mx-auto mt-2">
                  <em>No live games right now — check back soon or explore past tournaments.</em>
                </p>
              )}
              {/* 🏀 NBA-Level Connection Status */}
              {connectionStatus === 'connected' && (
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Real-time updates active
                </div>
              )}
              {connectionStatus === 'polling' && (
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Backup mode (updates every 3 seconds)
                </div>
              )}
            </div>

        {/* Organizer Groups */}
        {actualLoading && (
          <div className="text-center text-gray-500">Loading live games…</div>
        )}
        {!actualLoading && grouped.length === 0 && (
          <div className="text-center text-gray-500">No live games right now.</div>
        )}
        {!actualLoading && grouped.map(([orgId, group]) => (
          <div key={orgId} className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">{group.organizerName}</h3>
            </div>
            {/* Live now */}
            {group.live.length > 0 && (
              <div className="grid md:grid-cols-2 gap-6 mb-4">
                {group.live.map((g) => {
                  const timeLabel = `${g.quarter <= 4 ? `Q${g.quarter}` : `OT${g.quarter - 4}`} ${String(g.game_clock_minutes || 0).padStart(2,'0')}:${String(g.game_clock_seconds || 0).padStart(2,'0')}`;
                  return (
                    <MemoizedLiveGameCard
                      key={g.id}
                      gameId={g.id}
                      teamLeftName={g.team_a_name || 'Team A'}
                      teamRightName={g.team_b_name || 'Team B'}
                      leftScore={g.home_score || 0}
                      rightScore={g.away_score || 0}
                      timeLabel={timeLabel}
                      isLive
                      onClick={() => { router.push(`/game-viewer/${g.id}`); }}
                    />
                  );
                })}
              </div>
            )}
            {/* Scheduled */}
            {group.scheduled.length > 0 && (
              <div className="grid md:grid-cols-2 gap-6">
                {group.scheduled.map((g) => {
                  const timeLabel = `Q${g.quarter} ${String(g.game_clock_minutes || 0).padStart(2,'0')}:${String(g.game_clock_seconds || 0).padStart(2,'0')}`;
                  return (
                    <MemoizedLiveGameCard
                      key={g.id}
                      gameId={g.id}
                      teamLeftName={g.team_a_name || 'Team A'}
                      teamRightName={g.team_b_name || 'Team B'}
                      leftScore={g.home_score || 0}
                      rightScore={g.away_score || 0}
                      timeLabel={timeLabel}
                      isLive={false}
                      onClick={() => { router.push(`/game-viewer/${g.id}`); }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        ))}

            {/* Bottom CTA */}
            <div className="text-center mt-12">
              <p className="text-lg text-gray-600 mb-6">
                Experience every moment as it unfolds across multiple courts simultaneously.
              </p>
            </div>
          </div>
        </section>
      );
    }

    // ✅ ANTI-FLICKER: Memoize LiveGameCard to prevent unnecessary re-renders
    const MemoizedLiveGameCard = memo(LiveGameCard, (prev, next) => {
      return (
        prev.gameId === next.gameId &&
        prev.leftScore === next.leftScore &&
        prev.rightScore === next.rightScore &&
        prev.timeLabel === next.timeLabel &&
        prev.isLive === next.isLive
      );
    });