'use client';

import React, { useState } from 'react';
import { CompactScoreboardV3 } from './CompactScoreboardV3';
import { DualTeamHorizontalRosterV3 } from './DualTeamHorizontalRosterV3';
import { MobileStatGridV3 } from './MobileStatGridV3';

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
}

interface TrackerData {
  quarter: number;
  clock: {
    isRunning: boolean;
    secondsRemaining: number;
  };
  scores: Record<string, number>;
  lastAction: string | null;
  recordStat: (stat: any) => Promise<void>;
  substitute: (sub: any) => Promise<boolean>;
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
  onTeamPlayersUpdate
}: MobileLayoutV3Props) {
  const [possessionTeam, setPossessionTeam] = useState<'A' | 'B'>('A');

  // Get selected player details from both teams
  const selectedPlayerData = [...teamAPlayers, ...teamBPlayers].find(p => p.id === selectedPlayer);

  // Handle stat recording
  const handleStatRecord = async (statType: string, modifier?: string) => {
    if (!selectedPlayer) return;

    // Determine which team the selected player belongs to
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

    // Determine which team the selected player belongs to
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
          teamBName={gameData.team_b?.name || 'Team B'}
          teamAScore={tracker.scores[gameData.team_a_id] || 0}
          teamBScore={tracker.scores[gameData.team_b_id] || 0}
          teamAFouls={0} // TODO: Add team fouls tracking
          teamBFouls={0} // TODO: Add team fouls tracking
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
        />

        {/* Dual Team Horizontal Roster */}
        <DualTeamHorizontalRosterV3
          teamAPlayers={teamAPlayers}
          teamBPlayers={teamBPlayers}
          teamAName={gameData.team_a?.name || 'Team A'}
          teamBName={gameData.team_b?.name || 'Team B'}
          selectedPlayer={selectedPlayer}
          onPlayerSelect={onPlayerSelect}
          onSubstitution={onSubstitution}
        />

        {/* Mobile Stat Grid */}
        <MobileStatGridV3
          selectedPlayer={selectedPlayer}
          selectedPlayerData={selectedPlayerData}
          isClockRunning={tracker.clock.isRunning}
          onStatRecord={handleStatRecord}
          onFoulRecord={handleFoulRecord}
          onTimeOut={() => {
            // TODO: Implement timeout functionality
            console.log('⏰ Time out called');
            alert('Time out functionality will be implemented');
          }}
          onSubstitution={() => selectedPlayer && onSubstitution(selectedPlayer)}
          lastAction={tracker.lastAction}
          lastActionPlayerId={tracker.lastActionPlayerId}
        />

        {/* End Game Button - Clean Design */}
        <div className="px-4 pb-4 mt-8">
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
        </div>

        {/* Modals now handled by main page */}


      </div>
    </div>
  );
}