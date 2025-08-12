"use client";

import React, { useMemo } from 'react';
import { Button } from "@/components/ui/Button";
import { Play } from "lucide-react";
import LiveGameCard from "@/components/LiveGameCard";
import { useLiveGames } from "@/hooks/useLiveGames";
import { useRouter } from "next/navigation";

interface LiveTournamentSectionProps {
  onWatchLive?: () => void;
  onViewTournament?: () => void;
}

export function LiveTournamentSection({ onWatchLive, onViewTournament }: LiveTournamentSectionProps) {
  const { games, loading } = useLiveGames();
  // Group by organizer
  const grouped = useMemo(() => {
    const map = new Map<string, { organizerName: string; live: typeof games; scheduled: typeof games }>();
    for (const g of games) {
      const orgId = g.organizerId || 'unknown';
      const orgName = g.organizerName || 'Organizer';
      if (!map.has(orgId)) map.set(orgId, { organizerName: orgName, live: [], scheduled: [] });
      const bucket = map.get(orgId)!;
      const status = String(g.status || '').toLowerCase();
      if (['live','in_progress','overtime'].includes(status)) bucket.live.push(g);
      if (status === 'scheduled') bucket.scheduled.push(g);
    }
    return Array.from(map.entries());
  }, [games]);
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
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            <span className="text-orange-500">Live</span> Tournament Action
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Follow real-time games from tournaments around the world. See how StatJam 
            tracks every play, score, and statistic as it happens.
          </p>
        </div>

        {/* Organizer Groups */}
        {loading && (
          <div className="text-center text-gray-500">Loading live games…</div>
        )}
        {!loading && grouped.length === 0 && (
          <div className="text-center text-gray-500">No live games right now.</div>
        )}
        {!loading && grouped.map(([orgId, group]) => (
          <div key={orgId} className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">{group.organizerName}</h3>
            </div>
            {/* Live now */}
            {group.live.length > 0 && (
              <div className="grid md:grid-cols-2 gap-6 mb-4">
                {group.live.map((g) => {
                  const timeLabel = `${g.quarter <= 4 ? `Q${g.quarter}` : `OT${g.quarter - 4}`} ${g.minutes}:${String(g.seconds).padStart(2,'0')}`;
                  return (
                    <LiveGameCard
                      key={g.id}
                      gameId={g.id}
                      teamLeftName={g.teamAName}
                      teamRightName={g.teamBName}
                      leftScore={g.homeScore}
                      rightScore={g.awayScore}
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
                  const timeLabel = `Q${g.quarter}  ${String(g.minutes).padStart(2,'0')}:${String(g.seconds).padStart(2,'0')}`;
                  return (
                    <LiveGameCard
                      key={g.id}
                      gameId={g.id}
                      teamLeftName={g.teamAName}
                      teamRightName={g.teamBName}
                      leftScore={g.homeScore}
                      rightScore={g.awayScore}
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