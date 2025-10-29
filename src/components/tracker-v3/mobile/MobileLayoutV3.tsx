'use client';

import React, { useState } from 'react';
import { CompactScoreboardV3 } from './CompactScoreboardV3';
import { DualTeamHorizontalRosterV3 } from './DualTeamHorizontalRosterV3';
import { MobileStatGridV3 } from './MobileStatGridV3';
import { OpponentStatsPanel } from '../OpponentStatsPanel';

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
  photo_url?: string;
}

interface GameData {
  id: string;
  team_a_id: string;
  team_b_id: string;
  team_a?: { name?: string | null } | null;
  team_b?: { name?: string | null } | null;
  tournament?: { name?: string | null } | null;
}

interface TrackerData {
  quarter: number;
  clock: {
    isRunning: boolean;
    secondsRemaining: number;
  };
  shotClock: {
    isRunning: boolean;
    secondsRemaining: number;
    isVisible: boolean;
  };
  scores: Record<string, number>;
  teamFouls: { [teamId: string]: number };
  teamTimeouts: { [teamId: string]: number };
  timeoutActive: boolean;
  timeoutSecondsRemaining: number;
  timeoutTeamId: string | null;
  startClock: () => void;
  stopClock: () => void;
  resetClock: () => void;
  setCustomTime: (minutes: number, seconds: number) => Promise<void>;
  resetShotClock: (seconds?: number) => void;
  setShotClockTime: (seconds: number) => void;
  lastAction: string | null;
  lastActionPlayerId: string | null;
  closeGame: () => Promise<void>;
  recordStat: (stat: any) => Promise<void>;
  substitute: (sub: any) => Promise<boolean>;
  // ✅ PHASE 3: Possession state
  possession?: {
    currentTeamId: string;
    possessionArrow: string;
    lastChangeReason: string | null;
    lastChangeTimestamp: string | null;
  };
  ruleset?: any;
  automationFlags?: any;
}

interface MobileLayoutV3Props {
  gameData: GameData;
  tracker: TrackerData;
  teamAPlayers: Player[];
  teamBPlayers: Player[];
  selectedTeam: 'A' | 'B';
  selectedPlayer: string | null;
  onTeamSelect: (team: 'A' | 'B') => void;
  onPlayerSelect: (playerId: string) => void;
  onSubstitution: (playerId: string) => void;
  onTeamPlayersUpdate?: (teamAPlayers: Player[], teamBPlayers: Player[]) => void; // Add callback to update main state
  onTimeOut: () => void; // Add timeout handler from main page
  isCoachMode?: boolean; // Add coach mode flag
  userId?: string; // ✅ FIX: User ID for opponent stats
  onPossessionChange?: (teamId: string) => void; // ✅ PHASE 6: Manual possession control
  gameStatus?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'overtime'; // ✅ Game status
}

export function MobileLayoutV3({
  gameData,
  tracker,
  teamAPlayers,
  teamBPlayers,
  selectedTeam,
  selectedPlayer,
  onTeamSelect,
  onPlayerSelect,
  onSubstitution,
  onTeamPlayersUpdate,
  onTimeOut,
  isCoachMode = false,
  userId,
  onPossessionChange,
  gameStatus = 'in_progress' // ✅ Game status
}: MobileLayoutV3Props) {
  const [possessionTeam, setPossessionTeam] = useState<'A' | 'B'>('A');

  // Get selected player details from both teams
  const selectedPlayerData = [...teamAPlayers, ...teamBPlayers].find(p => p.id === selectedPlayer);

  // Handle stat recording
  const handleStatRecord = async (statType: string, modifier?: string) => {
    if (!selectedPlayer) return;

    // ✅ FIX: Handle opponent team stats (same logic as expanded view)
    if (isCoachMode && selectedPlayer === 'opponent-team') {
      // OPPONENT TEAM STATS: Use coach's user ID as proxy, mark as opponent stat
      await tracker.recordStat({
        gameId: gameData.id,
        playerId: userId || null, // ✅ FIX: Use actual user ID
        customPlayerId: null,
        teamId: gameData.team_a_id, // Coach's team UUID (required for DB)
        statType,
        modifier,
        isOpponentStat: true // ✅ FLAG: This is an opponent stat
      });
      return;
    }

    // Regular player stats
    const isTeamAPlayer = teamAPlayers.some(p => p.id === selectedPlayer);
    const teamId = isTeamAPlayer ? gameData.team_a_id : gameData.team_b_id;

    await tracker.recordStat({
      gameId: gameData.id,
      playerId: selectedPlayer,
      teamId,
      statType,
      modifier
    });
  };

  // Handle foul recording
  const handleFoulRecord = async (foulType: 'personal' | 'technical') => {
    if (!selectedPlayer) return;

    // ✅ FIX: Handle opponent team fouls (same logic as expanded view)
    if (isCoachMode && selectedPlayer === 'opponent-team') {
      // OPPONENT TEAM FOULS: Use coach's user ID as proxy, mark as opponent stat
      await tracker.recordStat({
        gameId: gameData.id,
        playerId: userId || null, // ✅ FIX: Use actual user ID
        customPlayerId: null,
        teamId: gameData.team_a_id, // Coach's team UUID (required for DB)
        statType: 'foul',
        modifier: foulType,
        isOpponentStat: true // ✅ FLAG: This is an opponent stat
      });
      return;
    }

    // Regular player fouls
    const isTeamAPlayer = teamAPlayers.some(p => p.id === selectedPlayer);
    const teamId = isTeamAPlayer ? gameData.team_a_id : gameData.team_b_id;

    await tracker.recordStat({
      gameId: gameData.id,
      playerId: selectedPlayer,
      teamId,
      statType: 'foul',
      modifier: foulType
    });
  };

  // Substitution now handled by main page - just use the prop

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #1f2937, #111827)' }}>
      <div className="flex-1 flex flex-col px-2 py-1 w-full space-y-1 overflow-y-auto">
        
        {/* Compact Scoreboard with Integrated Shot Clock */}
        <CompactScoreboardV3
          gameId={gameData.id}
          tournamentName={gameData.tournament?.name || 'Demo Tournament'}
          gameDate={new Date().toLocaleDateString()}
          teamAName={gameData.team_a?.name || 'Team A'}
          teamBName={isCoachMode ? 'Opponent' : (gameData.team_b?.name || 'Team B')}
          teamAScore={tracker.scores[gameData.team_a_id] || 0}
          teamBScore={isCoachMode ? (tracker.scores.opponent || 0) : (tracker.scores[gameData.team_b_id] || 0)}
          teamAFouls={tracker.teamFouls?.[gameData.team_a_id] || 0}
          teamBFouls={tracker.teamFouls?.[gameData.team_b_id] || 0}
          quarter={tracker.quarter}
          minutes={Math.floor(tracker.clock.secondsRemaining / 60)}
          seconds={tracker.clock.secondsRemaining % 60}
          isRunning={tracker.clock.isRunning}
          possessionTeam={possessionTeam}
          selectedTeam={selectedTeam}
          onTeamSelect={onTeamSelect}
          onPossessionToggle={() => setPossessionTeam(prev => prev === 'A' ? 'B' : 'A')}
          onStartClock={tracker.startClock}
          onStopClock={tracker.stopClock}
          onResetClock={tracker.resetClock}
          onSetCustomTime={tracker.setCustomTime} // NEW: Manual clock editing
          shotClockSeconds={tracker.shotClock.secondsRemaining}
          shotClockIsRunning={tracker.shotClock.isRunning}
          shotClockIsVisible={tracker.shotClock.isVisible}
          onShotClockReset={tracker.resetShotClock}
          onShotClockSetTime={tracker.setShotClockTime}
          showPossessionIndicator={tracker.ruleset && tracker.automationFlags?.possession?.enabled && !!tracker.possession}
          currentPossessionTeamId={tracker.possession?.currentTeamId}
          teamAId={gameData.team_a_id}
          teamBId={isCoachMode ? 'opponent-team' : gameData.team_b_id}
          possessionArrow={tracker.possession?.possessionArrow}
          isCoachMode={isCoachMode}
          onPossessionChange={onPossessionChange}
        />

        {/* ✅ REFINEMENT 4: Possession Indicator moved to CompactScoreboardV3 center column */}

        {/* Dual Team Horizontal Roster */}
        <DualTeamHorizontalRosterV3
          teamAPlayers={teamAPlayers}
          teamBPlayers={teamBPlayers}
          teamAName={gameData.team_a?.name || 'Team A'}
          teamBName={gameData.team_b?.name || 'Team B'}
          selectedPlayer={selectedPlayer}
          onPlayerSelect={onPlayerSelect}
          onSubstitution={onSubstitution}
          isCoachMode={isCoachMode}
          gameId={gameData.id}
          teamId={gameData.team_a_id}
          opponentName={isCoachMode ? 'Opponent Team' : undefined}
        />

        {/* Mobile Stat Grid */}
        <MobileStatGridV3
          selectedPlayer={selectedPlayer}
          selectedPlayerData={selectedPlayerData}
          isClockRunning={tracker.clock.isRunning && !tracker.timeoutActive}
          onStatRecord={handleStatRecord}
          onFoulRecord={handleFoulRecord}
          onTimeOut={onTimeOut}
          onSubstitution={() => selectedPlayer && onSubstitution(selectedPlayer)}
          lastAction={tracker.lastAction}
          lastActionPlayerId={tracker.lastActionPlayerId}
        />

        {/* End Game Button / Status - Clean Design */}
        <div className="px-4 pb-4 mt-8">
          {gameStatus === 'completed' || gameStatus === 'cancelled' ? (
            <div
              className="w-full text-base font-black py-4 rounded-xl border-2 border-gray-400 bg-gray-500 text-white cursor-not-allowed opacity-50"
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl">🏁</span>
                <span>{gameStatus === 'completed' ? 'GAME ENDED' : 'GAME CANCELLED'}</span>
              </div>
            </div>
          ) : (
            <button
              className="w-full text-base font-black py-4 rounded-xl border-2 border-red-400 bg-red-500 hover:bg-red-600 text-white transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95"
              onClick={() => {
                if (confirm('End Game?\n\nThis will mark the game as completed and save all statistics. This action cannot be undone.')) {
                  tracker.closeGame();
                }
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl">🏁</span>
                <span>END GAME</span>
              </div>
            </button>
          )}
        </div>

        {/* ✅ ADJUSTMENT 2: Team Stats & Aggregates (Coach Mode Only) */}
        {isCoachMode && (
          <div className="px-2 pb-4">
            <div className="rounded-xl overflow-hidden" style={{
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
              <OpponentStatsPanel
                gameId={gameData.id}
                teamId={gameData.team_a_id}
                teamName={gameData.team_a?.name || 'Team A'}
                opponentName="Opponent Team"
              />
            </div>
          </div>
        )}

        {/* Modals now handled by main page */}


      </div>
    </div>
  );
}