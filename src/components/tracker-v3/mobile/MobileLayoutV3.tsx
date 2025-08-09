'use client';

import React, { useState } from 'react';
import { CompactScoreboardV3 } from './CompactScoreboardV3';
import { HorizontalRosterV3 } from './HorizontalRosterV3';
import { MobileStatGridV3 } from './MobileStatGridV3';
import { FoulModalV3 } from './FoulModalV3';
import { SubstitutionModalV3 } from '../SubstitutionModalV3';

interface Player {
  id: string;
  name: string;
  jersey_number?: number;
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
  onSubstitution
}: MobileLayoutV3Props) {
  const [possessionTeam, setPossessionTeam] = useState<'A' | 'B'>('A');
  const [showFoulModal, setShowFoulModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [subOutPlayer, setSubOutPlayer] = useState<string | null>(null);

  // Get current team data
  const currentPlayers = selectedTeam === 'A' ? teamAPlayers : teamBPlayers;
  const currentTeamName = selectedTeam === 'A' 
    ? (gameData.team_a?.name || 'Team A')
    : (gameData.team_b?.name || 'Team B');
  const currentTeamId = selectedTeam === 'A' ? gameData.team_a_id : gameData.team_b_id;

  // Get selected player details
  const selectedPlayerData = currentPlayers.find(p => p.id === selectedPlayer);
  // Get all players not currently on court for the selected team
  const onCourtPlayerIds = selectedTeam === 'A' 
    ? tracker.rosterA.onCourt.map((p: any) => p.id)
    : tracker.rosterB.onCourt.map((p: any) => p.id);
  
  const benchPlayers = currentPlayers.filter(player => 
    !onCourtPlayerIds.includes(player.id)
  );

  // Handle stat recording
  const handleStatRecord = async (statType: string, modifier?: string) => {
    if (!selectedPlayer) return;

    await tracker.recordStat({
      gameId: gameData.id,
      playerId: selectedPlayer,
      teamId: currentTeamId,
      statType,
      modifier
    });
  };

  // Handle foul recording
  const handleFoulRecord = async (foulType: 'personal' | 'technical') => {
    if (!selectedPlayer) return;

    await tracker.recordStat({
      gameId: gameData.id,
      playerId: selectedPlayer,
      teamId: currentTeamId,
      statType: 'foul',
      modifier: foulType
    });
  };

  // Handle substitution
  const handleSubstitution = (playerId: string) => {
    setSubOutPlayer(playerId);
    setShowSubModal(true);
  };

  const handleSubConfirm = async (playerInId: string) => {
    if (!subOutPlayer) return;

    const success = await tracker.substitute({
      gameId: gameData.id,
      teamId: currentTeamId,
      playerOutId: subOutPlayer,
      playerInId,
      quarter: tracker.quarter,
      gameTimeSeconds: tracker.clock.secondsRemaining
    });

    if (success) {
      setShowSubModal(false);
      setSubOutPlayer(null);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--dashboard-bg)' }}>
      <div className="flex-1 flex flex-col px-2 py-1 w-full space-y-1">
        
        {/* Compact Scoreboard */}
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
        />

        {/* Horizontal Player Roster */}
        <HorizontalRosterV3
          players={currentPlayers}
          selectedPlayer={selectedPlayer}
          onPlayerSelect={onPlayerSelect}
          onSubstitution={handleSubstitution}
          teamName={currentTeamName}
        />

        {/* Mobile Stat Grid */}
        <MobileStatGridV3
          selectedPlayer={selectedPlayer}
          isClockRunning={tracker.clock.isRunning}
          onStatRecord={handleStatRecord}
          onFoulModal={() => setShowFoulModal(true)}
          onSubstitution={() => selectedPlayer && handleSubstitution(selectedPlayer)}
          lastAction={tracker.lastAction}
        />

        {/* Modals */}
        <FoulModalV3
          isOpen={showFoulModal}
          onClose={() => setShowFoulModal(false)}
          selectedPlayer={selectedPlayer}
          playerName={selectedPlayerData?.name}
          onConfirm={handleFoulRecord}
        />

        <SubstitutionModalV3
          isOpen={showSubModal}
          onClose={() => {
            setShowSubModal(false);
            setSubOutPlayer(null);
          }}
          playerOutId={subOutPlayer}
          benchPlayers={benchPlayers}
          onConfirm={handleSubConfirm}
        />

        {/* Game ID Display for Testing - Mobile */}
        <div className="fixed bottom-2 left-2 z-50">
          <div 
            className="px-2 py-1 rounded border text-xs font-mono"
            style={{ 
              background: 'var(--dashboard-card)', 
              borderColor: 'var(--dashboard-border)',
              color: 'var(--dashboard-text-secondary)'
            }}
          >
            <div className="text-orange-500 font-semibold text-xs">Game ID:</div>
            <div className="text-orange-400 text-xs">{gameData.id}</div>
          </div>
        </div>
      </div>
    </div>
  );
}