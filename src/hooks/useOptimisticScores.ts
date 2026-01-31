/** Per-team score freeze for instant UI updates. Prevents double-counting from DB sync. */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ScoreDelta } from './useShotMadeOverlay';

const FREEZE_MS = 5000;
type Freeze = { score: number } | null;

interface Input {
  dbHomeScore: number; dbAwayScore: number;
  teamAId: string | null; teamBId: string | null;
  scoreDelta: ScoreDelta | null;
}

export function useOptimisticScores({ dbHomeScore, dbAwayScore, teamAId, teamBId, scoreDelta }: Input) {
  const [teamAFreeze, setTeamAFreeze] = useState<Freeze>(null);
  const [teamBFreeze, setTeamBFreeze] = useState<Freeze>(null);
  const teamATimer = useRef<NodeJS.Timeout | null>(null);
  const teamBTimer = useRef<NodeJS.Timeout | null>(null);
  const processedDeltas = useRef<Set<string>>(new Set());
  
  // Track "pre-shot" scores - only update when NOT frozen
  const preHomeScore = useRef(dbHomeScore);
  const preAwayScore = useRef(dbAwayScore);
  if (!teamAFreeze) preHomeScore.current = dbHomeScore;
  if (!teamBFreeze) preAwayScore.current = dbAwayScore;

  const clearA = useCallback(() => { setTeamAFreeze(null); if (teamATimer.current) clearTimeout(teamATimer.current); }, []);
  const clearB = useCallback(() => { setTeamBFreeze(null); if (teamBTimer.current) clearTimeout(teamBTimer.current); }, []);

  useEffect(() => {
    if (!scoreDelta || !teamAId || !teamBId) return;
    
    // Dedupe by stat ID - each shot only applied once
    if (processedDeltas.current.has(scoreDelta.statId)) return;
    processedDeltas.current.add(scoreDelta.statId);
    setTimeout(() => processedDeltas.current.delete(scoreDelta.statId), FREEZE_MS + 1000);

    const isTeamA = scoreDelta.teamId === teamAId;
    if (isTeamA) {
      setTeamAFreeze(prev => ({ score: (prev?.score ?? preHomeScore.current) + scoreDelta.points }));
      if (teamATimer.current) clearTimeout(teamATimer.current);
      teamATimer.current = setTimeout(clearA, FREEZE_MS);
    } else {
      setTeamBFreeze(prev => ({ score: (prev?.score ?? preAwayScore.current) + scoreDelta.points }));
      if (teamBTimer.current) clearTimeout(teamBTimer.current);
      teamBTimer.current = setTimeout(clearB, FREEZE_MS);
    }
  }, [scoreDelta, teamAId, teamBId, clearA, clearB]);

  useEffect(() => () => {
    if (teamATimer.current) clearTimeout(teamATimer.current);
    if (teamBTimer.current) clearTimeout(teamBTimer.current);
  }, [teamAId, teamBId]);

  return useMemo(() => ({
    homeScore: teamAFreeze ? teamAFreeze.score : dbHomeScore,
    awayScore: teamBFreeze ? teamBFreeze.score : dbAwayScore,
  }), [teamAFreeze, teamBFreeze, dbHomeScore, dbAwayScore]);
}
