'use client';

import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Undo2 } from 'lucide-react';
import { GameService } from '@/lib/services/gameService';
import { TeamService } from '@/lib/services/tournamentService';
import { Game } from '@/lib/types/game';
import { Player, Team } from '@/lib/types/tournament';
import { supabase } from '@/lib/supabase';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { MobileSubstitutionModal } from '@/components/tracker/MobileSubstitutionModal';
import { DesktopSubstitutionModal } from '@/components/tracker/DesktopSubstitutionModal';

import GameCompletionManager from '@/components/game/GameCompletionManager';

const StatTracker = () => {
  const { user, loading } = useAuthContext(); // ✅ NO API CALL - Uses context
  const router = useRouter();
  const userRole = user?.role;
  const { isMobile } = useResponsiveLayout();
  
  // Get game and tournament IDs from URL parameters
  const [gameId, setGameId] = useState<string | null>(null);
  const [tournamentId, setTournamentId] = useState<string | null>(null);
  
  // Real game and team data
  const [gameData, setGameData] = useState<Game | null>(null);
  const [teamAData, setTeamAData] = useState<Player[]>([]);
  const [teamBData, setTeamBData] = useState<Player[]>([]);
  const [teamAInfo, setTeamAInfo] = useState<{ id: string; name: string } | null>(null);
  const [teamBInfo, setTeamBInfo] = useState<{ id: string; name: string } | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  
  useEffect(() => {
    // Parse URL parameters
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const gameIdParam = urlParams.get('gameId');
      const tournamentIdParam = urlParams.get('tournamentId');
      
      setGameId(gameIdParam);
      setTournamentId(tournamentIdParam);
      
      console.log('Stat Tracker loaded for:', { gameId: gameIdParam, tournamentId: tournamentIdParam });
      
      // Load real game data when gameId is available
      if (gameIdParam) {
        loadGameData(gameIdParam);
      }
    }
  }, []);

  // Function to load real game and team data
  const loadGameData = async (gameId: string) => {
    try {
      setDataLoading(true);
      setDataError(null);
      
      console.log('🔍 Loading game data for gameId:', gameId);
      
      // Load game data
      const game = await GameService.getGame(gameId);
      if (!game) {
        setDataError('Game not found');
        return;
      }
      
      console.log('🔍 Loaded game data:', game);
      setGameData(game);

      // Initialize quarter/clock/run state from DB so refresh retains state
      if (typeof game.quarter === 'number' && game.quarter > 0) {
        setQuarter(game.quarter);
      }
      if (typeof game.game_clock_minutes === 'number' && typeof game.game_clock_seconds === 'number') {
        setGameClock({ minutes: game.game_clock_minutes || 12, seconds: game.game_clock_seconds || 0 });
      }
      if (typeof game.is_clock_running === 'boolean') {
        setIsClockRunning(game.is_clock_running);
      }
      
      // Load team A data and info
      const teamAPlayers = await TeamService.getTeamPlayers(game.team_a_id);
      setTeamAData(teamAPlayers);
      console.log('🔍 Loaded Team A players:', teamAPlayers.length);
      
      // Load team B data and info
      const teamBPlayers = await TeamService.getTeamPlayers(game.team_b_id);
      setTeamBData(teamBPlayers);
      console.log('🔍 Loaded Team B players:', teamBPlayers.length);
      
      // Load actual team names
      const teamAInfo = await TeamService.getTeamInfo(game.team_a_id);
      const teamBInfo = await TeamService.getTeamInfo(game.team_b_id);
      
      setTeamAInfo(teamAInfo || { id: game.team_a_id, name: 'Team A' });
      setTeamBInfo(teamBInfo || { id: game.team_b_id, name: 'Team B' });

      // Compute current scores from game_stats so refresh restores scoreboard
      try {
        const { data: stats, error: statsError } = await supabase
          .from('game_stats')
          .select('team_id, stat_type, modifier')
          .eq('game_id', gameId);

        if (!statsError && stats) {
          let home = 0;
          let away = 0;
          for (const s of stats) {
            if (s.modifier !== 'made') continue;
            let pts = 0;
            if (s.stat_type === 'three_pointer') pts = 3;
            else if (s.stat_type === 'field_goal') pts = 2;
            else if (s.stat_type === 'free_throw') pts = 1;
            if (s.team_id === game.team_a_id) home += pts;
            else if (s.team_id === game.team_b_id) away += pts;
          }
          setHomeScore(home);
          setAwayScore(away);
          console.log('🔁 Initialized scores from DB:', { home, away });
        } else {
          console.warn('⚠️ Could not load stats for score init:', statsError?.message);
        }
      } catch (e) {
        console.warn('⚠️ Score init from stats failed:', e);
      }
      
    } catch (error) {
      console.error('❌ Error loading game data:', error);
      setDataError(error instanceof Error ? error.message : 'Failed to load game data');
    } finally {
      setDataLoading(false);
    }
  };
  
  const [selectedPlayer, setSelectedPlayer] = useState('11 Ross');
  const [lastAction, setLastAction] = useState('+3 Points');
  const [quarter, setQuarter] = useState(1);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);

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
  
  // Update selected player when team changes or data is loaded
  React.useEffect(() => {
    const currentPlayers = teamPlayers[selectedTeam as keyof typeof teamPlayers];
    const currentBenchPlayers = teamBenchPlayers[selectedTeam as keyof typeof teamBenchPlayers];
    
    if (currentPlayers && currentPlayers.length > 0) {
      setSelectedPlayer(currentPlayers[0].name);
      setCurrentRoster([...currentPlayers]);
      setCurrentBench([...currentBenchPlayers]);
    }
  }, [selectedTeam, teamAData, teamBData]);

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
  
  // Dynamic team names from loaded data
  const teamNames = {
    'Team A': teamAInfo?.name || 'Team A',
    'Team B': teamBInfo?.name || 'Team B'
  };

  // Transform real player data to match stat tracker format
  const teamPlayers = {
    'Team A': teamAData.slice(0, 5).map(player => ({
      id: player.id,
      name: player.name,
      number: player.jerseyNumber.toString(),
      image: '/api/placeholder/40/40'
    })),
    'Team B': teamBData.slice(0, 5).map(player => ({
      id: player.id,
      name: player.name,
      number: player.jerseyNumber.toString(),
      image: '/api/placeholder/40/40'
    }))
  };

  // Transform remaining players as bench players
  const teamBenchPlayers = {
    'Team A': teamAData.slice(5).map(player => ({
      id: player.id,
      name: player.name,
      number: player.jerseyNumber.toString(),
      image: '/api/placeholder/40/40',
      position: player.position
    })),
    'Team B': teamBData.slice(5).map(player => ({
      id: player.id,
      name: player.name,
      number: player.jerseyNumber.toString(),
      image: '/api/placeholder/40/40',
      position: player.position
    }))
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

  /**
   * Calculate score points for a recorded stat
   */
  const calculateStatPoints = (stat: any, modifier: string): number => {
    // Only count "made" scoring stats
    if (modifier !== 'made') return 0;
    
    // Map stat type to points based on label and type
    if (stat.type === 'points') {
      if (stat.label.includes('3')) return 3;
      if (stat.label.includes('2')) return 2;
      if (stat.label.includes('Free')) return 1;
      return stat.value || 0; // fallback to value
    } else if (stat.type === 'freethrow') {
      return 1;
    }
    
    return 0;
  };



  const recordStat = async (stat: any, modifier: string = '') => {
    let actionText = '';
    
    // Build action text for UI
    if (stat.hasMadeMissed) {
      actionText = `${stat.label} ${modifier === 'made' ? 'Made' : 'Missed'} ${stat.type === 'points' ? 'Points' : stat.type === 'freethrow' ? 'Free Throw' : stat.type.toUpperCase()}`;
    } else if (stat.hasOffensiveDefensive) {
      actionText = `${modifier === 'offensive' ? 'Offensive' : 'Defensive'} ${stat.label}`;
    } else if (stat.hasPersonalTechnical) {
      actionText = `${modifier === 'personal' ? 'Personal' : 'Technical'} ${stat.label}`;
    } else {
      actionText = `${stat.label} ${stat.type === 'points' ? 'Points' : stat.type === 'freethrow' ? 'Free Throw' : stat.type.toUpperCase()}`;
    }
    
      // Note: Scores will be calculated from game_stats table in real-time
  console.log(`🎯 Recording stat: ${stat.type} ${modifier} for ${selectedTeam}`);
    
    // Update UI immediately for responsiveness
    setLastAction(actionText);
    setShowMadeMissed(false);
    setShowOffensiveDefensive(false);
    setShowPersonalTechnical(false);
    setSelectedStat(null);
    
    // ===== DATABASE PERSISTENCE =====
    try {
      console.log('🏀 Recording stat to database:', { stat, modifier, selectedPlayer, selectedTeam });
      
      // Find the selected player's data from the current on-court roster
      const selectedPlayerData = currentRoster.find(p => p.name === selectedPlayer);
      
      if (!selectedPlayerData) {
        console.error('❌ Selected player not found:', selectedPlayer);
        return;
      }
      
      // Get team ID based on selected team
      const teamId = selectedTeam === 'Team A' ? teamAInfo?.id : teamBInfo?.id;
      if (!teamId) {
        console.error('❌ Team ID not found for:', selectedTeam);
        return;
      }
      
      // Map stat type and calculate value - using common basketball stat terminology
      let statType = stat.type || 'misc';
      let statValue = 1; // Default value
      
      // Handle different stat types - map to likely allowed constraint values
      if (stat.type === 'points') {
        // Try common basketball stat type names
        if (stat.label.includes('3')) {
          statType = 'three_pointer'; // or 'three_point' or '3pt'
          statValue = 3;
        } else if (stat.label.includes('2')) {
          statType = 'field_goal'; // or 'two_pointer' or '2pt'
          statValue = 2;
        } else if (stat.label.includes('Free')) {
          statType = 'free_throw'; // or 'freethrow' or '1pt'
          statValue = 1;
        }
      } else if (stat.type === 'freethrow') {
        statType = 'free_throw';
        statValue = 1;
      }
      
      // For missed shots, set value to 0 but keep the same stat type
      // The modifier field will indicate if it was made/missed
      if (modifier === 'missed') {
        statValue = 0; // Track attempts but no points scored
      }
      
      // Map other stat types to likely backend constraint values
      const statTypeMapping: { [key: string]: string } = {
        'rebound': 'rebound',
        'assist': 'assist', 
        'steal': 'steal',
        'block': 'block',
        'turnover': 'turnover',
        'foul': 'foul'
      };
      
      // Apply mapping if stat type exists in our mapping
      if (statTypeMapping[statType]) {
        statType = statTypeMapping[statType];
      }
      
      console.log('📝 Final mapped stat type:', statType, 'with value:', statValue);
      
      // Guard: block stats when clock is not running
      if (!isClockRunning) {
        console.warn('⛔ Stat blocked: clock is not running');
        alert('Start the game clock to record stats.');
        return;
      }

      // Prepare stat data for database
      const statData = {
        gameId: gameId!,
        playerId: selectedPlayerData.id,
        teamId: teamId,
        statType: statType,
        statValue: statValue,
        modifier: modifier || undefined,
        quarter: quarter,
        gameTimeMinutes: gameClock.minutes,
        gameTimeSeconds: gameClock.seconds
      };
      
      console.log('📊 Sending stat data to database:', statData);
      
      // Record stat in database
      const result = await GameService.recordStat(statData);
      
      if (!result.success) {
        console.error('❌ Failed to record stat:', result.error);
        alert(`Error recording stat: ${result.error}`);
        return;
      }
      
      console.log('✅ Stat recorded successfully in database');
        
      // Quarter boundary: if clock hit 0:00, prepare next quarter
      if (gameClock.minutes === 0 && gameClock.seconds === 0) {
        if (quarter < 4) {
          const proceed = confirm('Quarter ended. Move to next quarter?');
          if (proceed) {
            setQuarter(quarter + 1);
            setIsClockRunning(false);
            setGameClock({ minutes: 12, seconds: 0 });
          }
        } else {
          console.log('🏁 Regulation ended. Consider overtime or completion.');
        }
      }
      // Immediate local scoreboard update for real-time UX
      const points = calculateStatPoints(stat, modifier);
      if (points > 0) {
        if (teamId === teamAInfo?.id) {
          setHomeScore(prev => prev + points);
        } else if (teamId === teamBInfo?.id) {
          setAwayScore(prev => prev + points);
        }
      }
      
    } catch (error) {
      console.error('❌ Error recording stat:', error);
      // Could show user feedback here
    }
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

  /**
   * Quarter Management Functions with Overtime Support
   */
  const nextQuarter = () => {
    if (quarter < 4) {
      // Regular quarters Q1-Q3
      setQuarter(prev => prev + 1);
      setGameClock({ minutes: 12, seconds: 0 });
      setIsClockRunning(false);
      console.log(`🏀 Advanced to Quarter ${quarter + 1}`);
    } else if (quarter === 4) {
      // Q4 → Check for overtime (handled by GameCompletionManager)
      console.log('🏀 Q4 Complete - Game completion logic will handle next steps');
    } else {
      // Already in overtime, advance to next OT period
      setQuarter(prev => prev + 1);
      setGameClock({ minutes: 5, seconds: 0 }); // 5-minute overtime periods
      setIsClockRunning(false);
      const otPeriod = quarter - 3; // Q5=OT1, Q6=OT2, etc.
      console.log(`🏀 Advanced to Overtime OT${otPeriod}`);
    }
  };

  const previousQuarter = () => {
    if (quarter > 1) {
      const newQuarter = quarter - 1;
      setQuarter(newQuarter);
      
      // Set appropriate clock time
      if (newQuarter <= 4) {
        setGameClock({ minutes: 12, seconds: 0 }); // Regular quarter
      } else {
        setGameClock({ minutes: 5, seconds: 0 }); // Overtime period
      }
      
      setIsClockRunning(false);
      
      if (newQuarter <= 4) {
        console.log(`🏀 Moved back to Quarter ${newQuarter}`);
      } else {
        const otPeriod = newQuarter - 4;
        console.log(`🏀 Moved back to Overtime OT${otPeriod}`);
      }
    }
  };

  /**
   * Start overtime period (called by GameCompletionManager)
   */
  const startOvertimePeriod = (overtimePeriod: number) => {
    const overtimeQuarter = 4 + overtimePeriod; // OT1=Q5, OT2=Q6, etc.
    setQuarter(overtimeQuarter);
    setGameClock({ minutes: 5, seconds: 0 }); // 5-minute overtime
    setIsClockRunning(false);
    console.log(`🏀 Starting Overtime OT${overtimePeriod} (Q${overtimeQuarter})`);
  };

  /**
   * Handle game completion (called by GameCompletionManager)
   */
  const handleGameComplete = (finalScores: { home: number; away: number }) => {
    setIsClockRunning(false); // Ensure clock is stopped
    console.log('🏆 Game Complete!', finalScores);
    // Could show game complete modal or redirect here
  };

  const initiateSubstitution = (playerId: string) => {
    setSubbingOutPlayer(playerId);
    setShowSubstitutionRoster(true);
  };

  const completeSubstitution = async (subbingInPlayerId: string) => {
    if (subbingOutPlayer) {
      // Find the players
      const subbingOutPlayerData = currentRoster.find(p => p.id === subbingOutPlayer);
      const subbingInPlayerData = currentBench.find(p => p.id === subbingInPlayerId);
      
      if (subbingOutPlayerData && subbingInPlayerData) {
        // Persist substitution to database (non-blocking for UI responsiveness)
        if (gameId) {
          const teamId = selectedTeam === 'Team A' ? teamAInfo?.id : teamBInfo?.id;
          if (teamId) {
            try {
              console.log('🔄 Recording substitution to database:', {
                gameId,
                playerOutId: subbingOutPlayerData.id,
                playerInId: subbingInPlayerId,
                teamId,
                quarter,
                gameTimeMinutes: gameClock.minutes,
                gameTimeSeconds: gameClock.seconds
              });
              const ok = await GameService.recordSubstitution({
                gameId,
                playerOutId: subbingOutPlayerData.id,
                playerInId: subbingInPlayerId,
                teamId,
                quarter,
                gameTimeMinutes: gameClock.minutes,
                gameTimeSeconds: gameClock.seconds
              });
              console.log('✅ Substitution DB result:', ok);
            } catch (err) {
              console.error('❌ Error recording substitution:', err);
            }
          } else {
            console.error('❌ Team ID not found for substitution');
          }
        }
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
      position: 'relative' as const,
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
    quarterControls: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '8px',
    },
    quarterButton: {
      width: '32px',
      height: '32px',
      borderRadius: '6px',
      border: 'none',
      background: '#FFD700',
      color: '#000',
      fontSize: '16px',
      fontWeight: '700',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
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
      zIndex: 9999,
      margin: 0,
      padding: '16px',
    } as React.CSSProperties,
    substitutionModal: {
      background: 'rgba(30, 30, 30, 0.95)',
      borderRadius: '16px',
      padding: '20px',
      maxWidth: '400px',
      width: '100%',
      maxHeight: '80vh',
      overflowY: 'auto',
      borderWidth: '2px',
      borderStyle: 'solid',
      borderColor: '#ea580c',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
      position: 'relative',
      zIndex: 10000,
    } as React.CSSProperties,
    statModal: {
      background: 'rgba(30, 30, 30, 0.95)',
      borderRadius: '16px',
      padding: '24px',
      maxWidth: '300px',
      width: '100%',
      borderWidth: '2px',
      borderStyle: 'solid',
      borderColor: '#1e3a8a',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
      position: 'relative',
      zIndex: 10000,
    } as React.CSSProperties,
    substitutionTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#ffffff',
      textAlign: 'center',
      marginBottom: '20px',
      lineHeight: '1.3',
      padding: '0 8px',
    },
    substitutionGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))',
      gap: '12px',
      marginBottom: '16px',
      maxWidth: '100%',
    },
    substitutionPlayerButton: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '14px 10px',
      borderRadius: '12px',
      borderWidth: '2px',
      borderStyle: 'solid',
      borderColor: '#4a4a4a',
      background: 'rgba(255, 255, 255, 0.1)',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      minHeight: '80px',
      minWidth: '60px',
      touchAction: 'manipulation',
    },
    substitutionPlayerButtonDisabled: {
      borderColor: '#ff4444',
      background: 'rgba(255, 68, 68, 0.2)',
      cursor: 'not-allowed',
      opacity: '0.6',
    },
    substitutionPlayerImage: {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      background: '#4a4a4a',
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: '600',
      color: '#ffffff',
    },
    substitutionPlayerName: {
      fontSize: '11px',
      textAlign: 'center',
      lineHeight: '1.2',
      marginBottom: '4px',
      color: '#ffffff',
      fontWeight: '500',
    },

    cancelSubstitutionButton: {
      width: '100%',
      padding: '16px',
      borderRadius: '8px',
      border: 'none',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      background: '#666666',
      color: '#ffffff',
      transition: 'all 0.2s ease',
      touchAction: 'manipulation',
      minHeight: '48px',
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

  // Show data loading state
  if (dataLoading) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: 'center', paddingTop: '100px' }}>
          <div style={{ color: '#FFD700', fontSize: '18px', marginBottom: '16px' }}>
            Loading Game Data...
          </div>
          <div style={{ color: '#888', fontSize: '14px' }}>
            {gameId ? `Game ID: ${gameId}` : 'Initializing...'}
          </div>
        </div>
      </div>
    );
  }

  // Show data error state
  if (dataError) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: 'center', paddingTop: '100px' }}>
          <div style={{ color: '#ff4444', fontSize: '18px', marginBottom: '16px' }}>
            Error Loading Game Data
          </div>
          <div style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>
            {dataError}
          </div>
          <button 
            onClick={() => gameId && loadGameData(gameId)}
            style={{
              background: '#FFD700',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show message if no data loaded yet
  if (!gameData || !teamAInfo || !teamBInfo) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: 'center', paddingTop: '100px' }}>
          <div style={{ color: '#888', fontSize: '16px' }}>
            No game data available. Please check the game ID.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Note: Scores are now calculated from game_stats table in real-time */}

      {/* Game Completion Manager Component */}
      {gameId && (
        <GameCompletionManager
          gameId={gameId}
          currentQuarter={quarter}
          gameClockMinutes={gameClock.minutes}
          gameClockSeconds={gameClock.seconds}
          isClockRunning={isClockRunning}
          homeScore={homeScore}
          awayScore={awayScore}
          onGameComplete={handleGameComplete}
          onOvertimeStart={startOvertimePeriod}
          onQuarterEnd={(q, scores) => {
            console.log(`🏀 Quarter ${q} ended with scores:`, scores);
          }}
        />
      )}
      
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
          {/* Quarter Controls */}
          <div style={styles.quarterControls}>
            <button 
              style={{...styles.quarterButton, opacity: quarter <= 1 ? 0.5 : 1}}
              onClick={previousQuarter}
              disabled={quarter <= 1}
            >
              ←
            </button>
            <div style={styles.quarterText}>
              {quarter <= 4 ? `Q${quarter}` : `OT${quarter - 4}`}
            </div>
            <button 
              style={{...styles.quarterButton}}
              onClick={nextQuarter}
            >
              →
            </button>
          </div>
          
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



      {/* Substitution Modal - Responsive */}
      {showSubstitutionRoster && (
        isMobile ? (
          <MobileSubstitutionModal
            isOpen={showSubstitutionRoster}
            onClose={cancelSubstitution}
            playerOut={currentRoster.find(p => p.id === subbingOutPlayer) || null}
            benchPlayers={currentBench}
            onConfirm={completeSubstitution}
          />
        ) : (
          <DesktopSubstitutionModal
            isOpen={showSubstitutionRoster}
            onClose={cancelSubstitution}
            playerOut={currentRoster.find(p => p.id === subbingOutPlayer) || null}
            benchPlayers={currentBench}
            onConfirm={completeSubstitution}
          />
        )
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
        <button
          onClick={async () => {
            if (!gameId) return;
            const confirmEnd = confirm('End the game now? This will set status to completed.');
            if (!confirmEnd) return;
            await GameService.updateGameStatus(gameId, 'completed');
            setIsClockRunning(false);
          }}
          style={{
            marginLeft: 'auto',
            background: '#991b1b',
            color: '#fff',
            border: 'none',
            padding: '10px 14px',
            borderRadius: '8px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Close Game
        </button>
      </div>
    </div>
  );
};

export default StatTracker; 