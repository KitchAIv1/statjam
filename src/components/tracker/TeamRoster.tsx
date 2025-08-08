'use client';

import React, { useEffect, useState } from 'react';
import { TeamService } from '@/lib/services/tournamentService';
import { RosterState } from '@/lib/types/tracker';

type Player = { id: string; name: string };

export const TeamRoster: React.FC<{
  teamId: string;
  teamName: string;
  roster: RosterState;
  setRoster: (updater: (r: RosterState) => RosterState) => void;
}> = ({ teamId, teamName, roster, setRoster }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await TeamService.getTeamPlayers(teamId);
        if (!mounted) return;
        setPlayers(data.map(p => ({ id: p.id, name: p.name })));
        // Initialize roster if empty
        setRoster(r => (
          r.onCourt.length > 0
            ? r
            : ({ ...r, onCourt: data.slice(0, 5).map(p => p.id), bench: data.slice(5).map(p => p.id) })
        ));
      } catch (e) {
        if (!mounted) return;
        setError('Failed to load roster');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [teamId, setRoster]);

  if (loading) return <div className="text-sm text-gray-400">Loading {teamName} roster…</div>;
  if (error) return <div className="text-sm text-red-400">{error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <div className="mb-2 text-gray-300 text-sm">On Court</div>
        <div className="flex flex-wrap gap-2">
          {roster.onCourt.map(pid => {
            const p = players.find(x => x.id === pid);
            return (
              <span key={pid} className="px-3 py-1 rounded-full bg-gray-800 border border-gray-700 text-gray-100 text-sm">
                {p?.name || pid.slice(0,6)}
              </span>
            );
          })}
        </div>
      </div>
      <div>
        <div className="mb-2 text-gray-300 text-sm">Bench</div>
        <div className="flex flex-wrap gap-2">
          {roster.bench.map(pid => {
            const p = players.find(x => x.id === pid);
            return (
              <span key={pid} className="px-3 py-1 rounded-full bg-gray-800 border border-gray-700 text-gray-100 text-sm">
                {p?.name || pid.slice(0,6)}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

