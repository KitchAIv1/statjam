'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { TeamService } from '@/lib/services/tournamentService';
import { useTracker } from '@/hooks/useTracker';
import { formatClock } from '@/lib/domain/tracker';
import { ClockControls } from '@/components/tracker/ClockControls';
import { ScoreBoard } from '@/components/tracker/ScoreBoard';
import { GameStatusBar } from '@/components/tracker/GameStatusBar';
import { CombinedScoreboard } from '@/components/tracker/CombinedScoreboard';
import { TeamRoster } from '@/components/tracker/TeamRoster';
import { StatRecorder } from '@/components/tracker/StatRecorder';
import { SubstitutionControls } from '@/components/tracker/SubstitutionControls';
import { ActionBar } from '@/components/tracker/ActionBar';
import { PlayerGrid } from '@/components/tracker/PlayerGrid';
import { SubstitutionModal } from '@/components/tracker/SubstitutionModal';
import ResponsiveContainer from '@/components/layout/ResponsiveContainer';
import { TrackerHeader } from '@/components/tracker/TrackerHeader';

type GameRow = {
  id: string;
  team_a_id: string;
  team_b_id: string;
  status: string;
  team_a?: { name?: string | null } | null;
  team_b?: { name?: string | null } | null;
};

export default function TrackerV2Page() {
  const params = useSearchParams();
  const router = useRouter();

  const [game, setGame] = useState<GameRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const gameIdParam = params.get('gameId') || '';
  const teamAParam = params.get('teamAId') || '';
  const teamBParam = params.get('teamBId') || '';

  useEffect(() => {
    const fetchDefaultGame = async () => {
      setLoading(true);
      setError(null);
      try {
        if (gameIdParam && teamAParam && teamBParam) {
          // Minimal fetch: just names
          const { data, error } = await supabase
            .from('games')
            .select('id, team_a_id, team_b_id, status, team_a:teams!team_a_id(name), team_b:teams!team_b_id(name)')
            .eq('id', gameIdParam)
            .single();
          if (error) throw error;
          setGame(data as unknown as GameRow);
          setLoading(false);
          return;
        }

        // Pick the most recent uncompleted game
        const { data, error } = await supabase
          .from('games')
          .select('id, team_a_id, team_b_id, status, team_a:teams!team_a_id(name), team_b:teams!team_b_id(name)')
          .or('end_time.is.null,status.neq.completed')
          .order('start_time', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        if (!data) {
          setError('No active games found.');
          setLoading(false);
          return;
        }
        setGame(data as unknown as GameRow);
      } catch (e) {
        setError('Failed to load game.');
      } finally {
        setLoading(false);
      }
    };

    fetchDefaultGame();
  }, [gameIdParam, teamAParam, teamBParam]);

  const gameId = game?.id || gameIdParam;
  const teamAId = game?.team_a_id || teamAParam;
  const teamBId = game?.team_b_id || teamBParam;
  const teamAName = game?.team_a?.name || 'Team A';
  const teamBName = game?.team_b?.name || 'Team B';
  const [subOutId, setSubOutId] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<'A'|'B'>('A');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const tracker = useTracker({
    initialGameId: gameId || 'unknown',
    teamAId: teamAId || 'teamA',
    teamBId: teamBId || 'teamB'
  });

  // Drive ticking when running
  useEffect(() => {
    if (!tracker.clock.isRunning) return;
    const int = setInterval(() => {
      tracker.tick(1);
      if (tracker.clock.secondsRemaining <= 1) {
        tracker.advanceIfNeeded();
      }
    }, 1000);
    return () => clearInterval(int);
  }, [tracker.clock.isRunning, tracker.clock.secondsRemaining, tracker]);

  const clockLabel = useMemo(() => formatClock(tracker.clock.secondsRemaining).label, [tracker.clock.secondsRemaining]);

  // Initialize rosters (first 5 on-court), then default select first player
  useEffect(() => {
    const init = async () => {
      if (!teamAId || !teamBId) return;
      // Only if empty
      if (tracker.rosterA.onCourt.length === 0) {
        const a = await TeamService.getTeamPlayers(teamAId);
        tracker.setRosterA(r => ({ ...r, onCourt: a.slice(0,5).map(p=>p.id), bench: a.slice(5).map(p=>p.id) }));
        if (!selectedPlayerId && a.length > 0 && selectedTeam === 'A') setSelectedPlayerId(a[0].id);
      }
      if (tracker.rosterB.onCourt.length === 0) {
        const b = await TeamService.getTeamPlayers(teamBId);
        tracker.setRosterB(r => ({ ...r, onCourt: b.slice(0,5).map(p=>p.id), bench: b.slice(5).map(p=>p.id) }));
        if (!selectedPlayerId && b.length > 0 && selectedTeam === 'B') setSelectedPlayerId(b[0].id);
      }
    };
    init();
  }, [teamAId, teamBId, tracker.rosterA.onCourt.length, tracker.rosterB.onCourt.length, selectedPlayerId, selectedTeam]);

  if (loading) return <div className="p-8 text-center text-gray-400">Loading tracker…</div>;
  if (error) return <div className="p-8 text-center text-red-400">{error}</div>;
  if (!gameId || !teamAId || !teamBId) return <div className="p-8 text-center text-gray-400">Missing game or team IDs.</div>;

  const teamAScore = tracker.scores[teamAId] || 0;
  const teamBScore = tracker.scores[teamBId] || 0;

  return (
    <main className="min-h-screen">
      <ResponsiveContainer>
      <div className="flex flex-col gap-8 py-8">
        <TrackerHeader gameId={gameId} />
        <GameStatusBar status={game?.status || (tracker.clock.isRunning ? 'in_progress' : 'scheduled')} />

        <CombinedScoreboard
          teamAName={teamAName}
          teamBName={teamBName}
          teamAScore={teamAScore}
          teamBScore={teamBScore}
          quarter={tracker.quarter}
          clockLabel={clockLabel}
          isRunning={tracker.clock.isRunning}
          onPrevQuarter={() => tracker.setQuarter(Math.max(1, tracker.quarter - 1) as any)}
          onNextQuarter={() => tracker.setQuarter((tracker.quarter + 1) as any)}
          onStart={tracker.startClock}
          onStop={tracker.stopClock}
          onReset={tracker.resetClock}
          selectedTeam={selectedTeam}
          onSelectTeam={setSelectedTeam}
        />

        {/* ClockControls replaced by CombinedScoreboard to match V1 visual */}

        {/* Rosters (read-only for now) */}
        <div className={`rounded-xl p-2 ${selectedTeam === 'A' ? 'border-2 border-orange-500 bg-orange-500/5 outline outline-2 outline-orange-500/30' : 'border-2 border-blue-500/0'}`}>
          <div className="mb-2 text-gray-300 text-sm">{selectedTeam==='A' ? teamAName : teamBName} On Court</div>
          <PlayerGrid
            roster={selectedTeam==='A' ? tracker.rosterA : tracker.rosterB}
            playerSeconds={tracker.playerSeconds}
            onSubClick={(pid)=>setSubOutId(pid)}
            selectedPlayerId={selectedPlayerId}
            onSelectPlayer={(pid)=> setSelectedPlayerId(pid)}
          />
        </div>

        {/* Substitutions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <SubstitutionControls
            teamId={teamAId}
            teamName={teamAName}
            roster={tracker.rosterA}
            onSubmit={tracker.substitute}
            gameId={tracker.gameId}
            quarter={tracker.quarter}
            gameTimeSeconds={tracker.clock.secondsRemaining}
          />
          <SubstitutionControls
            teamId={teamBId}
            teamName={teamBName}
            roster={tracker.rosterB}
            onSubmit={tracker.substitute}
            gameId={tracker.gameId}
            quarter={tracker.quarter}
            gameTimeSeconds={tracker.clock.secondsRemaining}
          />
        </div>

        {/* Quick Stat Recorder */}
        <StatRecorder onRecord={async (s) => { await tracker.recordStat(s); }} teamAId={teamAId} teamBId={teamBId} rosterA={tracker.rosterA} rosterB={tracker.rosterB} activeTeam={selectedTeam} selectedPlayerId={selectedPlayerId} />

        <SubstitutionModal
          open={!!subOutId}
          onClose={() => setSubOutId(null)}
          bench={subOutId && tracker.rosterA.onCourt.includes(subOutId) ? tracker.rosterA.bench : tracker.rosterB.bench}
          onSelect={async (playerInId) => {
            const teamId = subOutId && tracker.rosterA.onCourt.includes(subOutId) ? tracker.rosterA.teamId : tracker.rosterB.teamId;
            const ok = await tracker.substitute({
              gameId: tracker.gameId,
              teamId,
              playerOutId: subOutId!,
              playerInId,
              quarter: tracker.quarter as any,
              gameTimeSeconds: tracker.clock.secondsRemaining
            });
            if (ok) setSubOutId(null);
          }}
        />

        <div className="h-24" />
        <ActionBar
          lastAction={tracker.lastAction}
          onCloseGame={async () => {
            if (!gameId) return;
            const confirmEnd = confirm('End the game now? This will set status to completed.');
            if (!confirmEnd) return;
            await tracker.closeGame();
          }}
        />
      </div>
      </ResponsiveContainer>
    </main>
  );
}

