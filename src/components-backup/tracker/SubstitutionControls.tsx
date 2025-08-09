'use client';

import React, { useEffect, useState } from 'react';
import { RosterState, SubstitutionInput } from '@/lib/types/tracker';

export const SubstitutionControls: React.FC<{
  teamId: string;
  teamName: string;
  roster: RosterState;
  onSubmit: (sub: SubstitutionInput) => Promise<boolean>;
  gameId: string;
  quarter: number;
  gameTimeSeconds: number;
}> = ({ teamId, teamName, roster, onSubmit, gameId, quarter, gameTimeSeconds }) => {
  const [outId, setOutId] = useState('');
  const [inId, setInId] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!outId && roster.onCourt.length > 0) setOutId(roster.onCourt[0]);
    if (!inId && roster.bench.length > 0) setInId(roster.bench[0]);
  }, [roster.onCourt, roster.bench, outId, inId]);

  const submit = async () => {
    setMsg(null);
    setBusy(true);
    const ok = await onSubmit({
      gameId,
      teamId,
      playerOutId: outId,
      playerInId: inId,
      quarter: (quarter as any),
      gameTimeSeconds
    });
    setBusy(false);
    setMsg(ok ? 'Substitution recorded' : 'Substitution failed');
  };

  return (
    <div className="p-4 rounded-lg border border-gray-700 bg-gray-900">
      <div className="text-gray-200 font-semibold mb-3">Substitution – {teamName}</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div>
          <div className="text-xs text-gray-400 mb-1">Player Out</div>
          <select value={outId} onChange={(e)=>setOutId(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-gray-100">
            {roster.onCourt.map(pid => (<option key={pid} value={pid}>{pid.slice(0,8)}</option>))}
          </select>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Player In</div>
          <select value={inId} onChange={(e)=>setInId(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-gray-100">
            {roster.bench.map(pid => (<option key={pid} value={pid}>{pid.slice(0,8)}</option>))}
          </select>
        </div>
        <div>
          <button disabled={busy || !outId || !inId} onClick={submit} className="w-full px-4 py-2 rounded-md bg-yellow-400 text-gray-900 font-semibold disabled:opacity-50">{busy ? 'Saving…' : 'Apply'}</button>
        </div>
      </div>
      {msg && <div className="text-xs text-gray-400 mt-2">{msg}</div>}
    </div>
  );
};

