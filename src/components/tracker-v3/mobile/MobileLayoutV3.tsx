'use client';

import React, { useState } from 'react';
import { CompactScoreboardV3 } from './CompactScoreboardV3';
import { DualTeamHorizontalRosterV3 } from './DualTeamHorizontalRosterV3';
import { MobileStatGridV3 } from './MobileStatGridV3';
import { MobileShotClockV3 } from './MobileShotClockV3'; // NEW: Mobile Shot Clock

import { SubstitutionModalV3 } from '../SubstitutionModalV3';

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
  const [showSubModal, setShowSubModal] = useState(false);
  const [subOutPlayer, setSubOutPlayer] = useState<string | null>(null);
  
  // V1 pattern: Track current roster and bench state (like V1)
  const [currentRosterA, setCurrentRosterA] = useState<Player[]>([]);
  const [currentBenchA, setCurrentBenchA] = useState<Player[]>([]);
  const [currentRosterB, setCurrentRosterB] = useState<Player[]>([]);
  const [currentBenchB, setCurrentBenchB] = useState<Player[]>([]);

  // Initialize rosters when team data loads (V1 pattern)
  React.useEffect(() => {
    if (teamAPlayers.length > 0) {
      setCurrentRosterA(teamAPlayers.slice(0, 5)); // First 5 on court
      setCurrentBenchA(teamAPlayers.slice(5));     // Rest on bench
    }
    if (teamBPlayers.length > 0) {
      setCurrentRosterB(teamBPlayers.slice(0, 5)); // First 5 on court
      setCurrentBenchB(teamBPlayers.slice(5));     // Rest on bench
    }
  }, [teamAPlayers, teamBPlayers]);

  // Get current team data (V1 pattern)
  const currentRoster = selectedTeam === 'A' ? currentRosterA : currentRosterB;
  const currentBench = selectedTeam === 'A' ? currentBenchA : currentBenchB;
  const currentPlayers = selectedTeam === 'A' ? teamAPlayers : teamBPlayers;
  const currentTeamName = selectedTeam === 'A' 
    ? (gameData.team_a?.name || 'Team A')
    : (gameData.team_b?.name || 'Team B');
  const currentTeamId = selectedTeam === 'A' ? gameData.team_a_id : gameData.team_b_id;

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

  // Handle substitution
  const handleSubstitution = (playerId: string) => {
    setSubOutPlayer(playerId);
    setShowSubModal(true);
  };

  const handleSubConfirm = async (playerInId: string) => {
    if (!subOutPlayer) return;

    // Determine which team the player being substituted belongs to
    const isTeamAPlayer = teamAPlayers.some(p => p.id === subOutPlayer);
    const teamId = isTeamAPlayer ? gameData.team_a_id : gameData.team_b_id;
    const currentRoster = isTeamAPlayer ? currentRosterA : currentRosterB;
    const currentBench = isTeamAPlayer ? currentBenchA : currentBenchB;

    // Find the players in current roster and bench
    const subbingOutPlayerData = currentRoster.find(p => p.id === subOutPlayer);
    const subbingInPlayerData = currentBench.find(p => p.id === playerInId);

    if (subbingOutPlayerData && subbingInPlayerData) {
      // Record substitution to database
      const success = await tracker.substitute({
        gameId: gameData.id,
        teamId,
        playerOutId: subOutPlayer,
        playerInId,
        quarter: tracker.quarter,
        gameTimeSeconds: tracker.clock.secondsRemaining
      });

      if (success) {
        // Swap players between roster and bench
        const newRoster = currentRoster.map(player => 
          player.id === subOutPlayer ? subbingInPlayerData : player
        );
        const newBench = currentBench.map(player => 
          player.id === playerInId ? subbingOutPlayerData : player
        );

        // Update the appropriate team's roster and bench
        if (isTeamAPlayer) {
          setCurrentRosterA(newRoster);
          setCurrentBenchA(newBench);
        } else {
          setCurrentRosterB(newRoster);
          setCurrentBenchB(newBench);
        }

        // Update selected player if it was the subbed out player
        if (selectedPlayer === subbingOutPlayerData.id) {
          onPlayerSelect(subbingInPlayerData.id);
        }

        setShowSubModal(false);
        setSubOutPlayer(null);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #1f2937, #111827)' }}>
      <div className="flex-1 flex flex-col px-2 py-1 w-full space-y-1 overflow-y-auto">
        
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
          onSetCustomTime={tracker.setCustomTime} // NEW: Manual clock editing
        />

        {/* Dual Team Horizontal Roster */}
        <DualTeamHorizontalRosterV3
          teamAPlayers={teamAPlayers}
          teamBPlayers={teamBPlayers}
          teamAName={gameData.team_a?.name || 'Team A'}
          teamBName={gameData.team_b?.name || 'Team B'}
          selectedPlayer={selectedPlayer}
          onPlayerSelect={onPlayerSelect}
          onSubstitution={handleSubstitution}
        />

        {/* NEW: Mobile Shot Clock */}
        <MobileShotClockV3
          seconds={tracker.shotClock.secondsRemaining}
          isRunning={tracker.shotClock.isRunning}
          isVisible={tracker.shotClock.isVisible}
          onStart={tracker.startShotClock}
          onStop={tracker.stopShotClock}
          onReset={tracker.resetShotClock}
          onSetTime={tracker.setShotClockTime}
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
          onSubstitution={() => selectedPlayer && handleSubstitution(selectedPlayer)}
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

        {/* Modals */}

        <SubstitutionModalV3
          isOpen={showSubModal}
          onClose={() => {
            setShowSubModal(false);
            setSubOutPlayer(null);
          }}
          playerOutId={subOutPlayer}
          benchPlayers={(() => {
            if (!subOutPlayer) return [];
            const isTeamAPlayer = teamAPlayers.some(p => p.id === subOutPlayer);
            return isTeamAPlayer ? currentBenchA : currentBenchB;
          })()}
          onConfirm={handleSubConfirm}
        />


      </div>
    </div>
  );
}