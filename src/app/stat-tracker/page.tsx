'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Undo2 } from 'lucide-react';

const StatTracker = () => {
  const { user, userRole, loading } = useAuthStore();
  const router = useRouter();
  
  // Get game and tournament IDs from URL parameters
  const [gameId, setGameId] = useState<string | null>(null);
  const [tournamentId, setTournamentId] = useState<string | null>(null);
  
  useEffect(() => {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const gameIdParam = urlParams.get('gameId');
    const tournamentIdParam = urlParams.get('tournamentId');
    
    setGameId(gameIdParam);
    setTournamentId(tournamentIdParam);
    
    console.log('Stat Tracker loaded for:', { gameId: gameIdParam, tournamentId: tournamentIdParam });
  }, []);
  
  const [selectedPlayer, setSelectedPlayer] = useState('11 Ross');
  const [lastAction, setLastAction] = useState('+3 Points');
  const [quarter, setQuarter] = useState(3);
  const [homeScore, setHomeScore] = useState(57);
  const [awayScore, setAwayScore] = useState(52);
  const [showMadeMissed, setShowMadeMissed] = useState(false);
  const [showOffensiveDefensive, setShowOffensiveDefensive] = useState(false);
  const [showPersonalTechnical, setShowPersonalTechnical] = useState(false);
  const [selectedStat, setSelectedStat] = useState<any>(null);
  const [selectedTeam, setSelectedTeam] = useState('Team A');
  const [gameClock, setGameClock] = useState({ minutes: 12, seconds: 0 });
  const [isClockRunning, setIsClockRunning] = useState(false);
  const [playerMinutes, setPlayerMinutes] = useState<{[key: string]: number}>({});
  const [activePlayers, setActivePlayers] = useState<{[key: string]: boolean}>({});
  const [showSubstitutionRoster, setShowSubstitutionRoster] = useState(false);
  const [subbingOutPlayer, setSubbingOutPlayer] = useState<string | null>(null);
  const [currentRoster, setCurrentRoster] = useState<any[]>([]);
  const [currentBench, setCurrentBench] = useState<any[]>([]);
  
  // Update selected player when team changes
  React.useEffect(() => {
    const currentPlayers = teamPlayers[selectedTeam as keyof typeof teamPlayers];
    const currentBenchPlayers = teamBenchPlayers[selectedTeam as keyof typeof teamBenchPlayers];
    
    if (currentPlayers && currentPlayers.length > 0) {
      setSelectedPlayer(currentPlayers[0].name);
      setCurrentRoster([...currentPlayers]);
      setCurrentBench([...currentBenchPlayers]);
    }
  }, [selectedTeam]);

  // Game clock timer
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isClockRunning && (gameClock.minutes > 0 || gameClock.seconds > 0)) {
      interval = setInterval(() => {
        setGameClock(prev => {
          if (prev.seconds > 0) {
            return { ...prev, seconds: prev.seconds - 1 };
          } else if (prev.minutes > 0) {
            return { minutes: prev.minutes - 1, seconds: 59 };
          }
          return prev;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isClockRunning, gameClock.minutes, gameClock.seconds]);

  // Track player minutes when clock is running
  React.useEffect(() => {
    if (isClockRunning) {
      const interval = setInterval(() => {
        setPlayerMinutes(prev => {
          const newMinutes = { ...prev };
          Object.keys(activePlayers).forEach(playerId => {
            if (activePlayers[playerId]) {
              newMinutes[playerId] = (newMinutes[playerId] || 0) + (1/60); // Add 1 second
            }
          });
          return newMinutes;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isClockRunning, activePlayers]);
  
  const teamNames = {
    'Team A': 'Lakers',
    'Team B': 'Warriors'
  };

  const teamPlayers = {
    'Team A': [
      { id: 'james', name: 'James', number: '', image: '/api/placeholder/40/40' },
      { id: 'ross', name: '11 Ross', number: '11', image: '/api/placeholder/40/40' },
      { id: 'clark', name: 'Clark', number: '', image: '/api/placeholder/40/40' },
      { id: 'triges', name: '30 Triges', number: '30', image: '/api/placeholder/40/40' },
      { id: 'hayes', name: 'Hayes', number: '', image: '/api/placeholder/40/40' },
    ],
    'Team B': [
      { id: 'curry', name: 'Curry', number: '30', image: '/api/placeholder/40/40' },
      { id: 'thompson', name: 'Thompson', number: '11', image: '/api/placeholder/40/40' },
      { id: 'green', name: 'Green', number: '23', image: '/api/placeholder/40/40' },
      { id: 'wiggins', name: 'Wiggins', number: '22', image: '/api/placeholder/40/40' },
      { id: 'looney', name: 'Looney', number: '5', image: '/api/placeholder/40/40' },
    ]
  };

  const teamBenchPlayers = {
    'Team A': [
      { id: 'bench1', name: 'Taurean Prince', number: '8', image: '/api/placeholder/40/40', position: 'SF' },
      { id: 'bench2', name: 'Jaxson Hayes', number: '12', image: '/api/placeholder/40/40', position: 'C' },
      { id: 'bench3', name: 'Max Christie', number: '15', image: '/api/placeholder/40/40', position: 'SG' },
      { id: 'bench4', name: 'Cam Reddish', number: '22', image: '/api/placeholder/40/40', position: 'SF' },
      { id: 'bench5', name: 'Christian Wood', number: '33', image: '/api/placeholder/40/40', position: 'PF' },
    ],
    'Team B': [
      { id: 'bench6', name: 'Gary Payton II', number: '9', image: '/api/placeholder/40/40', position: 'SG' },
      { id: 'bench7', name: 'Jonathan Kuminga', number: '16', image: '/api/placeholder/40/40', position: 'SF' },
      { id: 'bench8', name: 'Moses Moody', number: '18', image: '/api/placeholder/40/40', position: 'SG' },
      { id: 'bench9', name: 'Trayce Jackson-Davis', number: '25', image: '/api/placeholder/40/40', position: 'PF' },
      { id: 'bench10', name: 'Brandin Podziemski', number: '31', image: '/api/placeholder/40/40', position: 'SG' },
    ]
  };

  const players = teamPlayers[selectedTeam as keyof typeof teamPlayers];

  const statButtons = [
    { label: '+2', type: 'points', value: 2, color: '#1e3a8a', hasMadeMissed: true },
    { label: '+3', type: 'points', value: 3, color: '#1e3a8a', hasMadeMissed: true },
    { label: 'FT', type: 'freethrow', value: 1, color: '#1e3a8a', hasMadeMissed: true },
    { label: 'AST', type: 'assist', value: 1, color: '#1e3a8a' },
    { label: 'REB', type: 'rebound', value: 1, color: '#1e3a8a', hasOffensiveDefensive: true },
    { label: 'STL', type: 'steal', value: 1, color: '#1e3a8a' },
    { label: 'BLK', type: 'block', value: 1, color: '#1e3a8a' },
    { label: 'FOUL', type: 'foul', value: 1, color: '#1e3a8a', hasPersonalTechnical: true },
    { label: 'TO', type: 'turnover', value: 1, color: '#1e3a8a' },
  ];

  const handleStatClick = (stat: any) => {
    setSelectedStat(stat);
    
    if (stat.hasMadeMissed) {
      setShowMadeMissed(true);
      setShowOffensiveDefensive(false);
      setShowPersonalTechnical(false);
    } else if (stat.hasOffensiveDefensive) {
      setShowOffensiveDefensive(true);
      setShowMadeMissed(false);
      setShowPersonalTechnical(false);
    } else if (stat.hasPersonalTechnical) {
      setShowPersonalTechnical(true);
      setShowMadeMissed(false);
      setShowOffensiveDefensive(false);
    } else {
      // Direct stat recording for simple stats
      recordStat(stat, 'made'); // Default for simple stats
    }
  };

  const recordStat = (stat: any, modifier: string = '') => {
    let actionText = '';
    
    if (stat.hasMadeMissed) {
      actionText = `${stat.label} ${modifier === 'made' ? 'Made' : 'Missed'} ${stat.type === 'points' ? 'Points' : stat.type === 'freethrow' ? 'Free Throw' : stat.type.toUpperCase()}`;
    } else if (stat.hasOffensiveDefensive) {
      actionText = `${modifier === 'offensive' ? 'Offensive' : 'Defensive'} ${stat.label}`;
    } else if (stat.hasPersonalTechnical) {
      actionText = `${modifier === 'personal' ? 'Personal' : 'Technical'} ${stat.label}`;
    } else {
      actionText = `${stat.label} ${stat.type === 'points' ? 'Points' : stat.type === 'freethrow' ? 'Free Throw' : stat.type.toUpperCase()}`;
    }
    
    setLastAction(actionText);
    setShowMadeMissed(false);
    setShowOffensiveDefensive(false);
    setShowPersonalTechnical(false);
    setSelectedStat(null);
  };

  const handleUndo = () => {
    setLastAction('Action Undone');
  };

  const startClock = () => {
    setIsClockRunning(true);
  };

  const pauseClock = () => {
    setIsClockRunning(false);
  };

  const stopClock = () => {
    setIsClockRunning(false);
    setGameClock({ minutes: 12, seconds: 0 });
  };

  const initiateSubstitution = (playerId: string) => {
    setSubbingOutPlayer(playerId);
    setShowSubstitutionRoster(true);
  };

  const completeSubstitution = (subbingInPlayerId: string) => {
    if (subbingOutPlayer) {
      // Find the players
      const subbingOutPlayerData = currentRoster.find(p => p.id === subbingOutPlayer);
      const subbingInPlayerData = currentBench.find(p => p.id === subbingInPlayerId);
      
      if (subbingOutPlayerData && subbingInPlayerData) {
        // Log the substitution
        setLastAction(`SUB: ${subbingOutPlayerData.name} OUT, ${subbingInPlayerData.name} IN`);
        
        // Update active players
        setActivePlayers(prev => ({
          ...prev,
          [subbingOutPlayer]: false, // Sub out
          [subbingInPlayerId]: true  // Sub in
        }));
        
        // Swap players between roster and bench
        const newRoster = currentRoster.map(player => 
          player.id === subbingOutPlayer ? subbingInPlayerData : player
        );
        const newBench = currentBench.map(player => 
          player.id === subbingInPlayerId ? subbingOutPlayerData : player
        );
        
        setCurrentRoster(newRoster);
        setCurrentBench(newBench);
        
        // Update selected player if it was the subbed out player
        if (selectedPlayer === subbingOutPlayerData.name) {
          setSelectedPlayer(subbingInPlayerData.name);
        }
        

      }
      
      // Reset substitution state
      setShowSubstitutionRoster(false);
      setSubbingOutPlayer(null);
    }
  };

  const cancelSubstitution = () => {
    setShowSubstitutionRoster(false);
    setSubbingOutPlayer(null);
  };

  const formatTime = (minutes: number, seconds: number) => {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatPlayerMinutes = (minutes: number) => {
    const mins = Math.floor(minutes);
    const secs = Math.round((minutes - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: '#1a1a1a',
      color: '#ffffff',
      padding: '20px',
      fontFamily: 'system-ui, sans-serif',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '24px',
    },
    backButton: {
      background: 'transparent',
      border: 'none',
      color: '#ffffff',
      cursor: 'pointer',
      padding: '8px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    quarterDisplay: {
      fontSize: '24px',
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: '16px',
    },
    combinedScoreboard: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '24px',
      gap: '16px',
    },
    teamCard: {
      flex: 1,
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '16px',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      borderWidth: '2px',
      borderStyle: 'solid',
      borderColor: 'transparent',
    },
    teamCardSelected: {
      borderColor: '#ea580c',
      background: 'rgba(234, 88, 12, 0.1)',
    },
    centerSection: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      minWidth: '120px',
    },
    quarterText: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#ffffff',
    },
    teamName: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#b3b3b3',
      marginTop: '4px',
    },
    clockDisplay: {
      textAlign: 'center',
      marginBottom: '12px',
    },
    clockTime: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#ffffff',
      marginBottom: '4px',
    },
    clockStatus: {
      fontSize: '12px',
      color: '#b3b3b3',
      fontWeight: '600',
    },
    clockControls: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'center',
    },
    clockButton: {
      padding: '4px 8px',
      borderRadius: '6px',
      border: 'none',
      fontSize: '10px',
      fontWeight: '600',
      cursor: 'pointer',
      color: '#ffffff',
      transition: 'all 0.2s ease',
    },
    scoreboard: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '16px 24px',
      marginBottom: '24px',
    },
    teamScore: {
      textAlign: 'center',
      fontSize: '48px',
      fontWeight: '700',
      color: '#ffffff',
    },
    teamLabel: {
      fontSize: '14px',
      color: '#b3b3b3',
      marginBottom: '4px',
    },
    score: {
      fontSize: '32px',
      fontWeight: '700',
    },


    playerSection: {
      marginBottom: '32px',
    },
    playerGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: '12px',
      marginBottom: '16px',
    },
    playerCard: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '12px 8px',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      borderWidth: '2px',
      borderStyle: 'solid',
      borderColor: 'transparent',
    },
    playerCardSelected: {
      borderColor: '#ea580c',
      background: 'rgba(234, 88, 12, 0.1)',
    },


    playerMinutes: {
      fontSize: '12px',
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: '8px',
    },
    subButton: {
      padding: '4px 8px',
      borderRadius: '6px',
      border: 'none',
      fontSize: '10px',
      fontWeight: '600',
      cursor: 'pointer',
      color: '#ffffff',
      background: '#666666',
      transition: 'all 0.2s ease',
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    substitutionModal: {
      background: 'rgba(30, 30, 30, 0.95)',
      borderRadius: '16px',
      padding: '24px',
      maxWidth: '400px',
      width: '90%',
      borderWidth: '2px',
      borderStyle: 'solid',
      borderColor: '#ea580c',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
    },
    statModal: {
      background: 'rgba(30, 30, 30, 0.95)',
      borderRadius: '16px',
      padding: '24px',
      maxWidth: '300px',
      width: '90%',
      borderWidth: '2px',
      borderStyle: 'solid',
      borderColor: '#1e3a8a',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
    },
    substitutionTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#ffffff',
      textAlign: 'center',
      marginBottom: '16px',
    },
    substitutionGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: '12px',
      marginBottom: '16px',
    },
    substitutionPlayerButton: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '12px 8px',
      borderRadius: '12px',
      borderWidth: '2px',
      borderStyle: 'solid',
      borderColor: '#4a4a4a',
      background: 'rgba(255, 255, 255, 0.1)',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    substitutionPlayerButtonDisabled: {
      borderColor: '#ff4444',
      background: 'rgba(255, 68, 68, 0.2)',
      cursor: 'not-allowed',
      opacity: '0.6',
    },
    substitutionPlayerImage: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      background: '#4a4a4a',
      marginBottom: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '10px',
      fontWeight: '600',
    },
    substitutionPlayerName: {
      fontSize: '10px',
      textAlign: 'center',
      lineHeight: '1.2',
      marginBottom: '4px',
    },

    cancelSubstitutionButton: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: 'none',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      background: '#666666',
      color: '#ffffff',
      transition: 'all 0.2s ease',
    },

    playerImage: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: '#4a4a4a',
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: '600',
    },
    playerName: {
      fontSize: '12px',
      textAlign: 'center',
      lineHeight: '1.2',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '12px',
      marginBottom: '16px',
    },
    statButton: {
      padding: '16px 12px',
      borderRadius: '12px',
      border: 'none',
      fontSize: '18px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      color: '#ffffff',
    },

    undoButton: {
      width: '100%',
      padding: '12px',
      borderRadius: '12px',
      border: 'none',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      background: '#1e3a8a',
      color: '#ffffff',
      marginBottom: '24px',
    },
    actionBar: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: '#ea580c',
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      zIndex: 1000,
    },
    actionPlayerImage: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      background: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '10px',
      fontWeight: '600',
    },
    actionText: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#ffffff',
    },

    modifierTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#ffffff',
      textAlign: 'center',
      marginBottom: '12px',
    },
    modifierButtons: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '12px',
    },
    modifierButton: {
      padding: '12px 16px',
      borderRadius: '8px',
      border: 'none',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      color: '#ffffff',
      transition: 'all 0.2s ease',
    },
  };

  if (loading || !user) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: 'center', paddingTop: '100px' }}>
          Loading Stat Tracker...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backButton}>
          <ArrowLeft size={20} />
          Back
        </button>
        <div style={{ fontSize: '18px', fontWeight: '600' }}>
          Stat Tracker
          {gameId && (
            <div style={{ fontSize: '14px', color: '#888', marginTop: '4px' }}>
              Game ID: {gameId}
            </div>
          )}
        </div>
        <div style={{ width: '40px' }}></div>
      </div>



      {/* Combined Team Scoreboard */}
      <div style={styles.combinedScoreboard}>
        {/* Team A Card */}
        <div 
          style={{
            ...styles.teamCard,
            ...(selectedTeam === 'Team A' ? styles.teamCardSelected : {})
          }}
          onClick={() => setSelectedTeam('Team A')}
        >
          <div style={styles.teamLabel}>HOME</div>
          <div style={styles.teamScore}>{homeScore}</div>
          <div style={styles.teamName}>{teamNames['Team A']}</div>
        </div>

        {/* Quarter and Clock Section */}
        <div style={styles.centerSection}>
          <div style={styles.quarterText}>Q{quarter}</div>
          <div style={styles.clockTime}>
            {formatTime(gameClock.minutes, gameClock.seconds)}
          </div>
          <div style={styles.clockStatus}>
            {isClockRunning ? 'RUNNING' : 'STOPPED'}
          </div>
          <div style={styles.clockControls}>
            <button 
              style={{...styles.clockButton, background: isClockRunning ? '#ff4444' : '#00ff88'}}
              onClick={isClockRunning ? pauseClock : startClock}
            >
              {isClockRunning ? 'PAUSE' : 'START'}
            </button>
            <button 
              style={{...styles.clockButton, background: '#666666'}}
              onClick={stopClock}
            >
              STOP
            </button>
          </div>
        </div>

        {/* Team B Card */}
        <div 
          style={{
            ...styles.teamCard,
            ...(selectedTeam === 'Team B' ? styles.teamCardSelected : {})
          }}
          onClick={() => setSelectedTeam('Team B')}
        >
          <div style={styles.teamLabel}>AWAY</div>
          <div style={styles.teamScore}>{awayScore}</div>
          <div style={styles.teamName}>{teamNames['Team B']}</div>
        </div>
      </div>



      {/* Player Selection */}
      <div style={styles.playerSection}>
        <div style={styles.playerGrid}>
          {currentRoster.map((player) => (
            <div
              key={player.id}
                                        style={{
                            ...styles.playerCard,
                            ...(selectedPlayer === player.name ? styles.playerCardSelected : {})
                          }}
              onClick={() => setSelectedPlayer(player.name)}
            >
              <div style={styles.playerImage}>
                {player.number || player.name.charAt(0)}
              </div>
              <div style={styles.playerName}>
                {player.name}
              </div>

              <div style={styles.playerMinutes}>
                {formatPlayerMinutes(playerMinutes[player.id] || 0)}
              </div>
              <button
                style={styles.subButton}
                onClick={(e) => {
                  e.stopPropagation();
                  initiateSubstitution(player.id);
                }}
              >
                SUB
              </button>
            </div>
          ))}
        </div>
      </div>



      {/* Substitution Modal */}
      {showSubstitutionRoster && (
        <div style={styles.modalOverlay}>
          <div style={styles.substitutionModal}>
            <div style={styles.substitutionTitle}>
              Select player to sub in for {currentRoster.find(p => p.id === subbingOutPlayer)?.name}:
            </div>
            <div style={styles.substitutionGrid}>
              {currentBench.map((player) => (
                <button
                  key={player.id}
                  style={styles.substitutionPlayerButton}
                  onClick={() => completeSubstitution(player.id)}
                >
                  <div style={styles.substitutionPlayerImage}>
                    {player.number || player.name.charAt(0)}
                  </div>
                  <div style={styles.substitutionPlayerName}>
                    {player.name}
                  </div>
                  
                </button>
              ))}
            </div>
            <button 
              style={styles.cancelSubstitutionButton}
              onClick={cancelSubstitution}
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        {statButtons.map((stat, index) => (
          <button
            key={index}
            style={{
              ...styles.statButton,
              background: stat.color,
            }}
            onClick={() => handleStatClick(stat)}
          >
            {stat.label}
          </button>
        ))}
      </div>

      {/* Made/Missed Modal */}
      {showMadeMissed && (
        <div style={styles.modalOverlay}>
          <div style={styles.statModal}>
            <div style={styles.modifierTitle}>Made or Missed?</div>
            <div style={styles.modifierButtons}>
              <button 
                style={{...styles.modifierButton, background: '#00ff88'}}
                onClick={() => recordStat(selectedStat, 'made')}
              >
                MADE
              </button>
              <button 
                style={{...styles.modifierButton, background: '#ff4444'}}
                onClick={() => recordStat(selectedStat, 'missed')}
              >
                MISSED
              </button>
            </div>
            <button 
              style={{...styles.modifierButton, background: '#666666', marginTop: '16px', width: '100%'}}
              onClick={() => {
                setShowMadeMissed(false);
                setSelectedStat(null);
              }}
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* Offensive/Defensive Modal */}
      {showOffensiveDefensive && (
        <div style={styles.modalOverlay}>
          <div style={styles.statModal}>
            <div style={styles.modifierTitle}>Rebound Type?</div>
            <div style={styles.modifierButtons}>
              <button 
                style={{...styles.modifierButton, background: '#00ff88'}}
                onClick={() => recordStat(selectedStat, 'offensive')}
              >
                OFFENSIVE
              </button>
              <button 
                style={{...styles.modifierButton, background: '#1e3a8a'}}
                onClick={() => recordStat(selectedStat, 'defensive')}
              >
                DEFENSIVE
              </button>
            </div>
            <button 
              style={{...styles.modifierButton, background: '#666666', marginTop: '16px', width: '100%'}}
              onClick={() => {
                setShowOffensiveDefensive(false);
                setSelectedStat(null);
              }}
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* Personal/Technical Modal */}
      {showPersonalTechnical && (
        <div style={styles.modalOverlay}>
          <div style={styles.statModal}>
            <div style={styles.modifierTitle}>Foul Type?</div>
            <div style={styles.modifierButtons}>
              <button 
                style={{...styles.modifierButton, background: '#ffaa00'}}
                onClick={() => recordStat(selectedStat, 'personal')}
              >
                PERSONAL
              </button>
              <button 
                style={{...styles.modifierButton, background: '#ff4444'}}
                onClick={() => recordStat(selectedStat, 'technical')}
              >
                TECHNICAL
              </button>
            </div>
            <button 
              style={{...styles.modifierButton, background: '#666666', marginTop: '16px', width: '100%'}}
              onClick={() => {
                setShowPersonalTechnical(false);
                setSelectedStat(null);
              }}
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* Undo Button */}
      <button style={styles.undoButton} onClick={handleUndo}>
        <Undo2 size={16} style={{ marginRight: '8px' }} />
        UNDO
      </button>

      {/* Action Bar */}
      <div style={styles.actionBar}>
        <div style={styles.actionPlayerImage}>
          {selectedPlayer.includes('11') ? '11' : selectedPlayer.charAt(0)}
        </div>
        <div style={styles.actionText}>
          {selectedTeam} - #{selectedPlayer.includes('11') ? '11' : ''} {selectedPlayer.replace('11 ', '')} {lastAction}
        </div>
      </div>
    </div>
  );
};

export default StatTracker; 