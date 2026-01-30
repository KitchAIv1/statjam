'use client';

/**
 * Video Stat Tracker Page - Stat Admin Only
 * 
 * PURPOSE: Video-based stat tracking with synchronized game clock.
 * Split-screen layout: video on left, stat entry on right, timeline at bottom.
 * 
 * ACCESS: Stat Admin role only (authenticated)
 * 
 * @module VideoStatTrackerPage
 */

import React, { use, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { VideoUploader } from '@/components/video/VideoUploader';
import { JumpballSyncModal } from '@/components/video/JumpballSyncModal';
import { DualClockDisplay } from '@/components/video/DualClockDisplay';
import { VideoStatEntryPanel, VideoStatHandlers } from '@/components/video/VideoStatEntryPanel';
import { VideoStatsTimeline } from '@/components/video/VideoStatsTimeline';
import { ActiveRosterDisplay } from '@/components/video/ActiveRosterDisplay';
import { VideoStatEntryButtons } from '@/components/video/VideoStatEntryButtons';
import { useVideoStatEntry } from '@/hooks/useVideoStatEntry';
import { useOptimisticTimeline } from '@/hooks/useOptimisticTimeline';
import { VideoStatPromptRenderer } from '@/components/video/VideoStatPromptRenderer';
import { SubstitutionModalV4 } from '@/components/tracker-v3/SubstitutionModalV4';
import { useVideoPlayer } from '@/hooks/useVideoPlayer';
import { useVideoClockSync } from '@/hooks/useVideoClockSync';
import { useKeyboardShortcuts, KEYBOARD_SHORTCUTS_REFERENCE } from '@/hooks/useKeyboardShortcuts';
import { useVideoProcessingStatus } from '@/hooks/useVideoProcessingStatus';
import { VideoStatService } from '@/lib/services/videoStatService';
import { TeamStatsService } from '@/lib/services/teamStatsService';
import { BunnyUploadService } from '@/lib/services/bunnyUploadService';
import { isBunnyConfigured } from '@/lib/config/videoConfig';
import type { GameVideo, ClockSyncConfig, GameClock } from '@/lib/types/video';
import { 
  Loader2, 
  ArrowLeft, 
  ShieldAlert, 
  Upload, 
  Video, 
  Clock, 
  Keyboard,
  AlertCircle,
  Settings,
  Edit,
  RefreshCw,
  FastForward,
  Eye,
  Play,
  Pause,
  Trophy
} from 'lucide-react';
import { StatEditModalV2 } from '@/components/tracker-v3/modals/StatEditModalV2';
import { GameCompletionModal } from '@/components/tracker-v3/modals/GameCompletionModal';
import { VideoQuarterAdvancePrompt } from '@/components/video/VideoQuarterAdvancePrompt';
import { GameService } from '@/lib/services/gameService';
import { TeamService } from '@/lib/services/tournamentService';
import { TeamServiceV3 } from '@/lib/services/teamServiceV3';
import { CoachPlayerService } from '@/lib/services/coachPlayerService';
import { GameAwardsService } from '@/lib/services/gameAwardsService';
import { StatAdminDashboardService } from '@/lib/services/statAdminDashboardService';
import { updateAssignmentStatus } from '@/lib/services/videoAssignmentService';
import { AIAnalysisService } from '@/lib/services/aiAnalysisService';

interface VideoStatTrackerPageProps {
  params: Promise<{ gameId: string }>;
}

export default function VideoStatTrackerPage({ params }: VideoStatTrackerPageProps) {
  const { gameId } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  
  // Video state
  const [gameVideo, setGameVideo] = useState<GameVideo | null>(null);
  const [videoLoading, setVideoLoading] = useState(true);
  const [clockSyncConfig, setClockSyncConfig] = useState<ClockSyncConfig | null>(null);
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null);
  
  // Modal state
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAwardsModal, setShowAwardsModal] = useState(false);
  
  // Game data for edit modal
  const [gameData, setGameData] = useState<any>(null);
  const [teamAPlayers, setTeamAPlayers] = useState<any[]>([]);
  const [teamBPlayers, setTeamBPlayers] = useState<any[]>([]);
  
  // Coach mode detection
  const isCoachGame = gameData?.is_coach_game === true;
  const opponentName = gameData?.opponent_name || gameData?.team_b?.name || 'Opponent';
  
  // Track if we've already handled the ready state
  const [hasHandledReady, setHasHandledReady] = useState(false);
  
  // Stat handlers from VideoStatEntryPanel (for keyboard shortcuts)
  const statHandlersRef = useRef<VideoStatHandlers | null>(null);
  
  // Timeline refresh trigger - increments when a stat is recorded
  const [timelineRefreshTrigger, setTimelineRefreshTrigger] = useState(0);
  
  // Last recorded stat for undo functionality
  const [lastRecordedStatId, setLastRecordedStatId] = useState<string | null>(null);
  
  // Syncing existing stats state
  const [isSyncingStats, setIsSyncingStats] = useState(false);
  
  // Shared player selection state for Active Roster
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  
  // Manual mode state for stat entry buttons
  const [isManualMode, setIsManualMode] = useState(false);
  
  // Quarter advancement state
  const [showQuarterPrompt, setShowQuarterPrompt] = useState(false);
  const [lastPromptedQuarter, setLastPromptedQuarter] = useState<number>(0);
  
  // Live scores - calculated from TeamStatsService (source of truth)
  const [teamAScore, setTeamAScore] = useState(0);
  const [teamBScore, setTeamBScore] = useState(0);
  
  // Clock freeze state - auto-pauses game clock on fouls (like manual tracker)
  const [clockFrozen, setClockFrozen] = useState(false);
  const [frozenClockValue, setFrozenClockValue] = useState<GameClock | null>(null);
  
  // Poll for video processing status
  const { status: processingStatus, isPolling, error: processingError } = useVideoProcessingStatus({
    videoId: uploadedVideoId,
    enabled: !!uploadedVideoId && gameVideo?.status === 'processing' && !hasHandledReady,
    pollIntervalMs: 5000, // Check every 5 seconds
    onReady: async (status) => {
      // Prevent multiple callbacks
      if (hasHandledReady) return;
      setHasHandledReady(true);
      
      console.log('✅ Video processing complete:', status);
      // Refresh video data from our database
      const video = await VideoStatService.getGameVideo(gameId);
      if (video) {
        // Update status in our database
        await VideoStatService.updateVideoStatus(video.id, 'ready', undefined, status.duration);
        setGameVideo({ ...video, status: 'ready', durationSeconds: status.duration });
        setUploadedVideoId(null);
        // Show sync modal
        setShowSyncModal(true);
      }
    },
    onError: (error) => {
      console.error('❌ Video processing error:', error);
      setUploadedVideoId(null);
      setHasHandledReady(false); // Allow retry
    },
  });
  
  // Video player
  const {
    state: videoState,
    controls: videoControls,
    videoRef,
    currentTimeMs,
  } = useVideoPlayer({
    videoUrl: gameVideo ? BunnyUploadService.getVideoDirectUrl(gameVideo.bunnyVideoId) : undefined,
    videoId: gameVideo?.bunnyVideoId,
  });
  
  // Clock sync
  const {
    isCalibrated,
    videoToGameClock,
    formatGameClock,
  } = useVideoClockSync({ config: clockSyncConfig });
  
  // Current game clock (derived from video position, or frozen value if clock is frozen)
  const derivedGameClock: GameClock | null = isCalibrated 
    ? videoToGameClock(currentTimeMs) 
    : null;
  
  // Use frozen clock when frozen (foul committed), otherwise use derived clock
  const gameClock: GameClock | null = clockFrozen && frozenClockValue 
    ? frozenClockValue 
    : derivedGameClock;
  
  // 🔍 DEBUG: Log clock sync state on every render (remove after debugging)
  useEffect(() => {
    console.log(`🎬 VIDEO CLOCK DEBUG: hasConfig=${!!clockSyncConfig}, jumpballMs=${clockSyncConfig?.jumpballTimestampMs}, quarterLen=${clockSyncConfig?.quarterLengthMinutes}, isCalibrated=${isCalibrated}, currentTimeMs=${currentTimeMs}, gameClock=${gameClock ? `Q${gameClock.quarter} ${gameClock.minutesRemaining}:${gameClock.secondsRemaining}` : 'null'}${clockFrozen ? ' ❄️ FROZEN' : ''}`);
  }, [clockSyncConfig, isCalibrated, currentTimeMs, gameClock, clockFrozen]);
  
  // Auto-pause video before recording stat (for precision)
  const handleBeforeStatRecord = useCallback(() => {
    if (videoState.playing) {
      videoControls.pause();
    }
  }, [videoState.playing, videoControls]);
  
  // Load scores from TeamStatsService (source of truth)
  const loadScores = useCallback(async () => {
    if (!gameData?.team_a_id) return;
    
    try {
      // Fetch team stats for both teams using source of truth
      const [teamAStats, teamBStats] = await Promise.all([
        TeamStatsService.aggregateTeamStats(gameId, gameData.team_a_id),
        isCoachGame 
          ? TeamStatsService.aggregateTeamStats(gameId, gameData.team_b_id || gameData.team_a_id)
          : TeamStatsService.aggregateTeamStats(gameId, gameData.team_b_id),
      ]);
      
      // Calculate points: (2PT made * 2) + (3PT made * 3) + (FT made * 1)
      // Note: fieldGoalsMade includes 3PT, so: points = (FG-3PT)*2 + 3PT*3 + FT
      const calcPoints = (stats: typeof teamAStats) => 
        (stats.fieldGoalsMade - stats.threePointersMade) * 2 + 
        stats.threePointersMade * 3 + 
        stats.freeThrowsMade;
      
      setTeamAScore(calcPoints(teamAStats));
      setTeamBScore(calcPoints(teamBStats));
    } catch (error) {
      console.error('Error loading scores:', error);
    }
  }, [gameId, gameData?.team_a_id, gameData?.team_b_id, isCoachGame]);
  
  // Debounced score refresh to prevent DB timeouts from rapid stat recording
  const scoreRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Handle stat recorded - store ID for undo + refresh scores + auto-freeze on foul
  // ✅ OPTIMISTIC UI: No longer triggers timeline refresh (optimistic stat already shows)
  const handleStatRecorded = useCallback((statType: string, statId?: string) => {
    // Store stat ID for undo functionality
    if (statId) {
      setLastRecordedStatId(statId);
    }
    
    // Auto-freeze game clock on foul (NBA rule: clock stops on whistle)
    if (statType === 'foul' && gameClock && !clockFrozen) {
      console.log('❄️ Auto-freezing game clock on foul:', `Q${gameClock.quarter} ${gameClock.minutesRemaining}:${gameClock.secondsRemaining}`);
      setClockFrozen(true);
      setFrozenClockValue(gameClock);
    }
    
    // Debounced score refresh (2s) to prevent rapid query timeouts
    if (scoreRefreshTimeoutRef.current) {
      clearTimeout(scoreRefreshTimeoutRef.current);
    }
    scoreRefreshTimeoutRef.current = setTimeout(() => {
      loadScores();
    }, 2000);
  }, [loadScores, gameClock, clockFrozen]);
  
  // ✅ OPTIMISTIC UI: Manage pending stats for instant timeline display
  const optimisticTimeline = useOptimisticTimeline({
    onBackgroundSync: useCallback(async () => {
      return VideoStatService.getVideoStats(gameId);
    }, [gameId]),
  });
  
  // Video stat entry hook for bottom buttons (must be called after handleStatRecorded is defined)
  const videoStatEntry = useVideoStatEntry({
    gameId,
    videoId: gameVideo?.bunnyVideoId || '',
    currentVideoTimeMs: currentTimeMs,
    gameClock,
    onStatRecorded: handleStatRecorded,
    onBeforeRecord: handleBeforeStatRecord,
    onOptimisticStatAdded: optimisticTimeline.addPendingStat, // ✅ OPTIMISTIC UI
    isCoachMode: isCoachGame,
    userId: user?.id,
    opponentName,
    preloadedTeamAPlayers: teamAPlayers,
    preloadedTeamBPlayers: teamBPlayers,
    preloadedGameData: gameData,
    sequenceFlags: isManualMode 
      ? { sequences: { enabled: false } }
      : { sequences: { enabled: true } },
  });
  
  // Sync selected player between videoStatEntry and our state (bidirectional)
  useEffect(() => {
    if (videoStatEntry.selectedPlayer && videoStatEntry.selectedPlayer !== selectedPlayerId) {
      setSelectedPlayerId(videoStatEntry.selectedPlayer);
    }
  }, [videoStatEntry.selectedPlayer, selectedPlayerId]);
  
  // Update videoStatEntry when selectedPlayerId changes from ActiveRosterDisplay
  useEffect(() => {
    if (selectedPlayerId && selectedPlayerId !== videoStatEntry.selectedPlayer) {
      videoStatEntry.handlePlayerSelect(selectedPlayerId);
    }
  }, [selectedPlayerId]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Register handlers for keyboard shortcuts
  useEffect(() => {
    statHandlersRef.current = {
      recordShot2PT: () => videoStatEntry.handleStatRecord('field_goal', 'made'),
      recordShot3PT: () => videoStatEntry.handleStatRecord('three_pointer', 'made'),
      recordMiss2PT: () => videoStatEntry.handleStatRecord('field_goal', 'missed'),
      recordMiss3PT: () => videoStatEntry.handleStatRecord('three_pointer', 'missed'),
      recordFTMade: () => videoStatEntry.handleStatRecord('free_throw', 'made'),
      recordFTMiss: () => videoStatEntry.handleStatRecord('free_throw', 'missed'),
      recordRebound: videoStatEntry.handleInitiateRebound,
      recordAssist: () => videoStatEntry.handleStatRecord('assist'),
      recordSteal: () => videoStatEntry.handleStatRecord('steal'),
      recordBlock: () => videoStatEntry.handleStatRecord('block'),
      recordTurnover: videoStatEntry.handleInitiateTurnover,
      recordFoul: videoStatEntry.handleInitiateFoul,
      openSubstitutionModal: videoStatEntry.handleOpenSubModal,
      selectPlayerByIndex: videoStatEntry.handlePlayerSelectByIndex,
    };
  }, [videoStatEntry]);
  
  // Resume (unfreeze) game clock and recalibrate to current video position
  const handleClockResume = useCallback(async () => {
    if (!clockFrozen || !frozenClockValue || !clockSyncConfig || !gameVideo) {
      console.warn('Cannot resume clock - missing frozen value or config');
      setClockFrozen(false);
      setFrozenClockValue(null);
      return;
    }
    
    console.log('▶️ Resuming game clock from frozen state:', `Q${frozenClockValue.quarter} ${frozenClockValue.minutesRemaining}:${frozenClockValue.secondsRemaining}`);
    
    // Recalibrate: set the quarter start marker so that current video position = frozen clock value
    const quarterLengthMs = clockSyncConfig.quarterLengthMinutes * 60 * 1000;
    const overtimeLengthMs = 5 * 60 * 1000;
    const isOvertime = frozenClockValue.quarter > 4;
    const currentQuarterLengthMs = isOvertime ? overtimeLengthMs : quarterLengthMs;
    const timeRemainingMs = (frozenClockValue.minutesRemaining * 60 + frozenClockValue.secondsRemaining) * 1000;
    const elapsedInQuarterMs = currentQuarterLengthMs - timeRemainingMs;
    const newQuarterStartMs = Math.max(0, currentTimeMs - elapsedInQuarterMs);
    
    // Update the clock sync config
    const updatedConfig = { ...clockSyncConfig };
    switch (frozenClockValue.quarter) {
      case 1: updatedConfig.jumpballTimestampMs = newQuarterStartMs; break;
      case 2: updatedConfig.q2StartTimestampMs = newQuarterStartMs; break;
      case 3: updatedConfig.q3StartTimestampMs = newQuarterStartMs; break;
      case 4: updatedConfig.q4StartTimestampMs = newQuarterStartMs; break;
      case 5: updatedConfig.ot1StartTimestampMs = newQuarterStartMs; break;
      case 6: updatedConfig.ot2StartTimestampMs = newQuarterStartMs; break;
      case 7: updatedConfig.ot3StartTimestampMs = newQuarterStartMs; break;
    }
    
    try {
      await VideoStatService.saveClockSync(gameVideo.id, updatedConfig);
      setClockSyncConfig(updatedConfig);
      console.log(`✅ Clock resumed and recalibrated: Q${frozenClockValue.quarter} start at ${newQuarterStartMs}ms`);
    } catch (error) {
      console.error('Error saving clock recalibration:', error);
    }
    
    // Unfreeze
    setClockFrozen(false);
    setFrozenClockValue(null);
  }, [clockFrozen, frozenClockValue, clockSyncConfig, gameVideo, currentTimeMs]);
  
  // Undo last recorded stat (Ctrl+Z)
  const handleUndo = useCallback(async () => {
    if (!lastRecordedStatId) {
      console.log('⚠️ Nothing to undo');
      return;
    }
    
    try {
      const { StatEditServiceV2 } = await import('@/lib/services/statEditServiceV2');
      console.log('🔄 Undoing stat:', lastRecordedStatId);
      await StatEditServiceV2.deleteStat(lastRecordedStatId, gameId);
      setLastRecordedStatId(null);
      setTimelineRefreshTrigger(prev => prev + 1);
      console.log('✅ Stat undone successfully');
    } catch (error) {
      console.error('❌ Error undoing stat:', error);
    }
  }, [lastRecordedStatId, gameId]);
  
  // Manually sync existing stats with video timestamps
  const handleSyncExistingStats = useCallback(async () => {
    if (!clockSyncConfig) {
      console.warn('⚠️ Cannot sync stats - no clock sync config');
      return;
    }
    
    try {
      setIsSyncingStats(true);
      
      // ✅ FIX: Clear pending optimistic stats BEFORE refresh to prevent duplicates
      // When user clicks "Sync Stats", they want authoritative DB data
      optimisticTimeline.clearPendingStats();
      
      const count = await VideoStatService.backfillVideoTimestamps(gameId, clockSyncConfig);
      console.log(`✅ Synced ${count} existing stats`);
      
      // ✅ FIX: Also backfill game clock state for minutes calculation
      await VideoStatService.backfillGameClockFromStats(gameId);
      console.log('✅ Game clock synced for minutes calculation');
      
      // Always refresh timeline after sync to show latest DB state
      setTimelineRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('❌ Error syncing stats:', error);
    } finally {
      setIsSyncingStats(false);
    }
  }, [clockSyncConfig, gameId, optimisticTimeline]);
  
  // Register stat handlers from VideoStatEntryPanel
  const handleRegisterStatHandlers = useCallback((handlers: VideoStatHandlers) => {
    statHandlersRef.current = handlers;
  }, []);
  
  // Detect quarter expiry (clock at 0:00) and show prompt
  useEffect(() => {
    if (!gameClock || !isCalibrated) return;
    
    const isExpired = gameClock.minutesRemaining === 0 && gameClock.secondsRemaining === 0;
    const currentQuarter = gameClock.quarter;
    
    // Check if this is a game-ending situation (Q4 expired, not tied)
    // If so, don't show quarter prompt - the awards modal will handle it
    const isGameEnd = currentQuarter === 4 && teamAScore !== teamBScore;
    
    // Show prompt only once per quarter (not repeatedly), skip if game should end
    if (isExpired && currentQuarter !== lastPromptedQuarter && !isGameEnd) {
      console.log(`⏰ Quarter ${currentQuarter} expired - showing advance prompt`);
      setShowQuarterPrompt(true);
      setLastPromptedQuarter(currentQuarter);
    }
  }, [gameClock, isCalibrated, lastPromptedQuarter, teamAScore, teamBScore]);
  
  // Detect game end (Q4 expired, not tied) - show awards modal
  useEffect(() => {
    if (!gameClock || !isCalibrated || !gameData) return;
    
    const isQ4Expired = gameClock.quarter === 4 && 
                        gameClock.minutesRemaining === 0 && 
                        gameClock.secondsRemaining === 0;
    const isNotTied = teamAScore !== teamBScore;
    const gameNotCompleted = gameData.status !== 'completed';
    
    // Show awards modal when Q4 ends and game is not tied
    if (isQ4Expired && isNotTied && gameNotCompleted && !showAwardsModal) {
      console.log(`🏆 Game ended - Q4 expired, score ${teamAScore}-${teamBScore}, showing awards modal`);
      setShowAwardsModal(true);
    }
  }, [gameClock, isCalibrated, gameData, teamAScore, teamBScore, showAwardsModal]);
  
  // Handle quarter advancement
  const handleAdvanceQuarter = useCallback(async (nextQuarter: number) => {
    if (!clockSyncConfig || !gameVideo) {
      console.warn('Cannot advance quarter - missing config or video');
      return;
    }
    
    console.log(`🏀 Advancing to Q${nextQuarter} at video time ${currentTimeMs}ms`);
    
    // Create updated config with the new quarter marker
    const updatedConfig: ClockSyncConfig = {
      ...clockSyncConfig,
    };
    
    // Set the appropriate quarter start timestamp
    switch (nextQuarter) {
      case 2:
        updatedConfig.q2StartTimestampMs = currentTimeMs;
        break;
      case 3:
        updatedConfig.q3StartTimestampMs = currentTimeMs;
        break;
      case 4:
        updatedConfig.q4StartTimestampMs = currentTimeMs;
        break;
      case 5:
        updatedConfig.ot1StartTimestampMs = currentTimeMs;
        break;
      case 6:
        updatedConfig.ot2StartTimestampMs = currentTimeMs;
        break;
      case 7:
        updatedConfig.ot3StartTimestampMs = currentTimeMs;
        break;
      default:
        console.warn(`Unsupported quarter: ${nextQuarter}`);
    }
    
    try {
      // Save the updated config
      await VideoStatService.saveClockSync(gameVideo.id, updatedConfig);
      setClockSyncConfig(updatedConfig);
      setShowQuarterPrompt(false);
      console.log(`✅ Quarter ${nextQuarter} start marked at ${currentTimeMs}ms`);
    } catch (error) {
      console.error('Error saving quarter marker:', error);
    }
  }, [clockSyncConfig, gameVideo, currentTimeMs]);

  // Handle game completion with awards (Player of the Game, Hustle Player)
  const handleCompleteGameWithAwards = useCallback(async (awards: {
    playerOfTheGameId: string;
    hustlePlayerId: string;
    isPlayerOfGameCustom?: boolean;
    isHustlePlayerCustom?: boolean;
    finalOpponentScore?: number;
  }) => {
    if (!gameData) return;
    
    try {
      console.log('🏆 Completing game with awards:', awards);
      
      // Save awards to database
      await GameAwardsService.saveGameAwards(gameId, {
        playerOfTheGameId: awards.playerOfTheGameId,
        hustlePlayerId: awards.hustlePlayerId,
        isPlayerOfGameCustom: awards.isPlayerOfGameCustom,
        isHustlePlayerCustom: awards.isHustlePlayerCustom
      });
      
      // Update game status to completed (also clears game cache)
      const gameStatusUpdated = await GameService.updateGameStatus(gameId, 'completed');
      console.log('🎯 Game status update result:', gameStatusUpdated ? 'SUCCESS' : 'FAILED');
      
      // Update video assignment status to completed (for Admin pipeline)
      if (gameVideo?.id) {
        try {
          await updateAssignmentStatus(gameVideo.id, 'completed');
          console.log('✅ Video assignment status updated to completed, videoId:', gameVideo.id);
        } catch (err) {
          console.error('❌ Failed to update video assignment status:', err);
        }
      } else {
        console.warn('⚠️ gameVideo.id not available - video assignment status NOT updated');
      }
      
      // Clear stat admin dashboard cache so they see the update immediately
      if (user?.id) {
        StatAdminDashboardService.clearCache(user.id);
        console.log('🗑️ Cleared stat admin dashboard cache for user:', user.id);
      } else {
        console.warn('⚠️ user.id not available - stat admin cache NOT cleared');
      }
      
      // Close modal
      setShowAwardsModal(false);
      
      // Refresh game data (force fresh fetch, cache was cleared)
      const updatedGame = await GameService.getGame(gameId);
      if (updatedGame) {
        setGameData(updatedGame);
        console.log('🔄 Game data refreshed, status:', updatedGame.status);
      }
      
      console.log('✅ Game completed with awards saved');
      
      // 🧠 FIRE-AND-FORGET: Pre-generate AI analysis for faster coach viewing
      // This runs in background - failure doesn't affect game completion flow
      AIAnalysisService.getAnalysis(gameId)
        .then(() => console.log('🧠 AI Analysis pre-generation triggered for game:', gameId))
        .catch((err) => console.warn('⚠️ AI Analysis pre-generation failed (fallback available):', err));
    } catch (error) {
      console.error('❌ Error completing game with awards:', error);
    }
  }, [gameId, gameData, user?.id, gameVideo?.id]);

  // Handle manual clock edit
  const handleClockEdit = useCallback(async (
    quarter: number,
    minutes: number,
    seconds: number,
    isOvertime?: boolean
  ) => {
    if (!clockSyncConfig || !gameVideo) {
      console.warn('Cannot edit clock - missing config or video');
      return;
    }

    const effectiveQuarter = isOvertime ? quarter + 4 : quarter;
    console.log(`✏️ Editing clock to ${isOvertime ? 'OT' : 'Q'}${quarter} ${minutes}:${seconds} at video ${currentTimeMs}ms (effective Q${effectiveQuarter})`);

    const quarterLengthMs = clockSyncConfig.quarterLengthMinutes * 60 * 1000;
    const overtimeLengthMs = 5 * 60 * 1000; // 5 minutes OT
    
    // Time remaining in the quarter (what user entered)
    const timeRemainingMs = (minutes * 60 + seconds) * 1000;
    
    // Current quarter length
    const currentQuarterLengthMs = isOvertime ? overtimeLengthMs : quarterLengthMs;
    
    // Elapsed time in this quarter
    const elapsedInQuarterMs = currentQuarterLengthMs - timeRemainingMs;
    
    // Calculate new quarter start timestamp
    // newQuarterStart = currentVideoTime - elapsedInQuarter
    const newQuarterStartMs = Math.max(0, currentTimeMs - elapsedInQuarterMs);
    
    // Create updated config - update the CORRECT quarter marker
    // ✅ CRITICAL: Clear ALL markers AFTER the target quarter (allows going back to earlier quarters)
    const updatedConfig: ClockSyncConfig = { ...clockSyncConfig };
    
    // Helper to clear markers for quarters > targetQuarter
    const clearFutureMarkers = (targetQ: number) => {
      if (targetQ < 2) updatedConfig.q2StartTimestampMs = undefined;
      if (targetQ < 3) updatedConfig.q3StartTimestampMs = undefined;
      if (targetQ < 4) updatedConfig.q4StartTimestampMs = undefined;
      if (targetQ < 5) updatedConfig.ot1StartTimestampMs = undefined;
      if (targetQ < 6) updatedConfig.ot2StartTimestampMs = undefined;
      if (targetQ < 7) updatedConfig.ot3StartTimestampMs = undefined;
    };
    
    switch (effectiveQuarter) {
      case 1:
        updatedConfig.jumpballTimestampMs = newQuarterStartMs;
        clearFutureMarkers(1);
        console.log(`✅ Clock adjusted: Q1 start (jumpball) at ${newQuarterStartMs}ms, cleared Q2-OT3 markers`);
        break;
      case 2:
        updatedConfig.q2StartTimestampMs = newQuarterStartMs;
        clearFutureMarkers(2);
        console.log(`✅ Clock adjusted: Q2 start at ${newQuarterStartMs}ms, cleared Q3-OT3 markers`);
        break;
      case 3:
        updatedConfig.q3StartTimestampMs = newQuarterStartMs;
        clearFutureMarkers(3);
        console.log(`✅ Clock adjusted: Q3 start at ${newQuarterStartMs}ms, cleared Q4-OT3 markers`);
        break;
      case 4:
        updatedConfig.q4StartTimestampMs = newQuarterStartMs;
        clearFutureMarkers(4);
        console.log(`✅ Clock adjusted: Q4 start at ${newQuarterStartMs}ms, cleared OT markers`);
        break;
      case 5:
        updatedConfig.ot1StartTimestampMs = newQuarterStartMs;
        clearFutureMarkers(5);
        console.log(`✅ Clock adjusted: OT1 start at ${newQuarterStartMs}ms, cleared OT2-OT3 markers`);
        break;
      case 6:
        updatedConfig.ot2StartTimestampMs = newQuarterStartMs;
        clearFutureMarkers(6);
        console.log(`✅ Clock adjusted: OT2 start at ${newQuarterStartMs}ms, cleared OT3 marker`);
        break;
      case 7:
        updatedConfig.ot3StartTimestampMs = newQuarterStartMs;
        console.log(`✅ Clock adjusted: OT3 start at ${newQuarterStartMs}ms`);
        break;
      default:
        console.warn(`Unknown quarter ${effectiveQuarter}, defaulting to jumpball`);
        updatedConfig.jumpballTimestampMs = newQuarterStartMs;
    }

    try {
      await VideoStatService.saveClockSync(gameVideo.id, updatedConfig);
      setClockSyncConfig(updatedConfig);
    } catch (error) {
      console.error('Error saving clock edit:', error);
    }
  }, [clockSyncConfig, gameVideo, currentTimeMs]);
  
  // Keyboard shortcuts - video controls + stat shortcuts
  useKeyboardShortcuts({
    // Video controls
    onPlayPause: videoControls.togglePlayPause,
    onRewind10: () => videoControls.seekRelative(-10),
    onForward10: () => videoControls.seekRelative(10),
    onRewind1: () => videoControls.seekRelative(-1),
    onForward1: () => videoControls.seekRelative(1),
    onPrevFrame: () => videoControls.stepFrame('backward'),
    onNextFrame: () => videoControls.stepFrame('forward'),
    onSpeed05: () => videoControls.setPlaybackRate(0.5),
    onSpeed1: () => videoControls.setPlaybackRate(1),
    onSpeed2: () => videoControls.setPlaybackRate(2),
    // Stat shortcuts - Made shots (P=2PT, Shift+P=3PT)
    onQuickShot2PT: () => statHandlersRef.current?.recordShot2PT(),
    onQuickShot3PT: () => statHandlersRef.current?.recordShot3PT(),
    // Stat shortcuts - Missed shots (M=2PT, Shift+M=3PT)
    onQuickMiss2PT: () => statHandlersRef.current?.recordMiss2PT(),
    onQuickMiss3PT: () => statHandlersRef.current?.recordMiss3PT(),
    // Stat shortcuts - Free throws (G=made, Shift+G=missed)
    onQuickFTMade: () => statHandlersRef.current?.recordFTMade(),
    onQuickFTMiss: () => statHandlersRef.current?.recordFTMiss(),
    // Other stats (R=rebound, A=assist, S=steal, B=block, T=turnover, F=foul)
    onQuickRebound: () => statHandlersRef.current?.recordRebound(),
    onQuickAssist: () => statHandlersRef.current?.recordAssist(),
    onQuickSteal: () => statHandlersRef.current?.recordSteal(),
    onQuickBlock: () => statHandlersRef.current?.recordBlock(),
    onQuickTurnover: () => statHandlersRef.current?.recordTurnover(),
    onQuickFoul: () => statHandlersRef.current?.recordFoul(),
    // Substitution (U key)
    onSubstitution: () => statHandlersRef.current?.openSubstitutionModal(),
    // Player selection (1-0 keys)
    onSelectPlayer: (index) => statHandlersRef.current?.selectPlayerByIndex(index),
    // Undo (Ctrl+Z)
    onUndo: handleUndo,
    // Enable when video is calibrated
    enabled: isCalibrated,
  });
  
  // Load video data
  useEffect(() => {
    async function loadVideo() {
      if (!gameId) return;
      
      try {
        setVideoLoading(true);
        const video = await VideoStatService.getGameVideo(gameId);
        console.log('🎬 Video loaded:', { 
          status: video?.status, 
          isCalibrated: video?.isCalibrated,
          jumpballMs: video?.jumpballTimestampMs 
        });
        setGameVideo(video);
        
        // If video exists and is processing, start polling
        if (video && video.status === 'processing' && video.bunnyVideoId) {
          console.log('📡 Video is processing, starting polling...');
          setUploadedVideoId(video.bunnyVideoId);
        }
        
        if (video?.isCalibrated) {
          const sync = await VideoStatService.getClockSync(video.id);
          console.log('⏰ Clock sync loaded:', sync);
          setClockSyncConfig(sync);
        }
      } catch (error) {
        console.error('Error loading video:', error);
      } finally {
        setVideoLoading(false);
      }
    }
    
    loadVideo();
  }, [gameId]);
  
  // Load game data for edit modal
  useEffect(() => {
    async function loadGameData() {
      if (!gameId) return;
      try {
        const game = await GameService.getGame(gameId);
        if (!game) return;
        setGameData(game);
        
        // Check if this is a coach game (ONLY use is_coach_game flag)
        // Note: opponent_name can exist on organizer games too, so don't use it for detection
        const gameAny = game as any;
        const isCoach = gameAny.is_coach_game === true;
        console.log('🎮 Game type detection:', { isCoach, opponent: gameAny.opponent_name, teamAId: game.team_a_id });
        
        if (isCoach) {
          // Coach game: Load custom players with substitutions applied
          try {
            // Use the new method that applies substitution state
            const playersWithSubs = await CoachPlayerService.getCoachTeamPlayersWithSubstitutions(game.team_a_id, gameId);
            
            setTeamAPlayers(playersWithSubs.map((p: any) => ({
              id: p.id,
              name: p.name || 'Unknown',
              jerseyNumber: p.jersey_number || p.jerseyNumber,
              // ✅ FIX: Respect is_custom_player flag from service (was incorrectly always true)
              // Claimed players have is_custom_player: false and should use player_id, not custom_player_id
              is_custom_player: p.is_custom_player === true,
            })));
            setTeamBPlayers([]); // No Team B players in coach mode
            console.log('👥 Loaded coach team players with substitutions:', playersWithSubs.length);
          } catch (err) {
            console.error('Error loading coach players:', err);
            // Fallback to base roster without substitutions
            const basePlayers = await CoachPlayerService.getCoachTeamPlayers(game.team_a_id);
            setTeamAPlayers(basePlayers.map((p: any) => ({
              id: p.id, name: p.name || 'Unknown',
              jerseyNumber: p.jersey_number || p.jerseyNumber,
              // ✅ FIX: Respect is_custom_player flag (was hardcoded to true)
              is_custom_player: p.is_custom_player === true,
            })));
          }
        } else {
          // Regular game: Load both teams with substitutions applied
          const [playersA, playersB] = await Promise.all([
            TeamServiceV3.getTeamPlayersWithSubstitutions(game.team_a_id, gameId),
            TeamServiceV3.getTeamPlayersWithSubstitutions(game.team_b_id, gameId),
          ]);
          
          setTeamAPlayers(playersA.map((p: any) => ({
            id: p.id, name: p.name || 'Unknown',
            jerseyNumber: p.jerseyNumber || p.jersey_number,
            // ✅ FIX: Preserve is_custom_player flag for organizer games with coach-created teams
            is_custom_player: p.is_custom_player === true,
          })));
          setTeamBPlayers(playersB.map((p: any) => ({
            id: p.id, name: p.name || 'Unknown',
            jerseyNumber: p.jerseyNumber || p.jersey_number,
            // ✅ FIX: Preserve is_custom_player flag for organizer games with coach-created teams
            is_custom_player: p.is_custom_player === true,
          })));
        }
      } catch (error) {
        console.error('Error loading game data:', error);
      }
    }
    loadGameData();
  }, [gameId]);
  
  // Load scores when gameData is available (source of truth: TeamStatsService)
  // ✅ FIX: Remove loadScores from deps - only load on initial gameData, not on every render
  useEffect(() => {
    if (gameData?.team_a_id) {
      loadScores();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameData?.team_a_id, gameData?.team_b_id]);
  
  // Handle video upload complete
  const handleUploadComplete = async (bunnyVideoId: string) => {
    console.log('📤 Upload complete, video ID:', bunnyVideoId);
    
    // Reset ready flag and start polling
    setHasHandledReady(false);
    setUploadedVideoId(bunnyVideoId);
    
    // Create/update video record in our database
    try {
      await VideoStatService.createGameVideo(
        gameId,
        process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || '',
        bunnyVideoId,
        user?.id || ''
      );
    } catch (err) {
      console.error('Error creating video record:', err);
    }
    
    // Refresh video data
    const video = await VideoStatService.getGameVideo(gameId);
    setGameVideo(video);
    
    // If already ready (unlikely but possible), show sync modal
    if (video && video.status === 'ready') {
      setUploadedVideoId(null);
      setShowSyncModal(true);
    }
  };
  
  // Handle clock sync complete
  const handleSyncComplete = async (config: ClockSyncConfig) => {
    if (!gameVideo) return;
    
    console.log('⏰ Sync complete, config:', config);
    await VideoStatService.saveClockSync(gameVideo.id, config);
    setClockSyncConfig(config);
    setShowSyncModal(false);
    
    // Backfill video timestamps for existing stats (completed games)
    try {
      const backfilledCount = await VideoStatService.backfillVideoTimestamps(gameId, config);
      if (backfilledCount > 0) {
        console.log(`✅ Backfilled ${backfilledCount} existing stats with video timestamps`);
        setTimelineRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error backfilling video timestamps:', error);
    }
    
    // Refresh video data
    const video = await VideoStatService.getGameVideo(gameId);
    console.log('🎬 Video refreshed after sync:', { isCalibrated: video?.isCalibrated });
    setGameVideo(video);
  };
  
  // Auth check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-red-50/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }
  
  if (!user || user.role !== 'stat_admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-red-50/30 flex items-center justify-center">
        <div className="text-center p-6">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-700 mb-4">This page is only available to Stat Admins.</p>
          <Button
            onClick={() => router.push('/dashboard')}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }
  
  // Check if Bunny.net is configured
  const bunnyConfigured = isBunnyConfigured();
  
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-orange-50/50 via-white to-red-50/30">
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Phase 1: Top Section - Only Title + Actions Bar */}
        {!videoLoading && gameVideo && gameVideo.status === 'ready' && isCalibrated && (
          <div className="flex-shrink-0 border-b bg-white shadow-sm">
            <div className="px-4 py-2">
              {/* Single Row: Title + Primary Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/dashboard/stat-admin')}
                    className="gap-2 h-8 hover:bg-orange-50"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                  </Button>
                  <div className="h-5 w-px bg-gray-300" />
                  <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Video className="w-5 h-5 text-orange-500" />
                    Video Stat Tracker
                  </h1>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Complete Game / Edit Awards - Primary Action */}
                  {gameData && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setShowAwardsModal(true)}
                      className="gap-2 bg-orange-600 hover:bg-orange-700 text-white h-8"
                    >
                      <Trophy className="w-4 h-4" />
                      {gameData.status === 'completed' ? 'Edit Awards' : 'Complete Game'}
                    </Button>
                  )}
                  
                  {/* More Actions - Will be dropdown in next phase */}
                  <div className="flex items-center gap-2">
                    {clockSyncConfig && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSyncExistingStats}
                        className="gap-2 h-8"
                        disabled={isSyncingStats}
                      >
                        <RefreshCw className={`w-4 h-4 ${isSyncingStats ? 'animate-spin' : ''}`} />
                        {isSyncingStats ? 'Syncing...' : 'Sync Stats'}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/stat-admin/game/${gameId}`)}
                      className="gap-2 h-8"
                      disabled={!gameData}
                    >
                      <Eye className="w-4 h-4" />
                      View Game
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEditModal(true)}
                      className="gap-2 h-8"
                      disabled={!gameData}
                    >
                      <Edit className="w-4 h-4" />
                      Edit Stats
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
                      className="gap-2 h-8"
                    >
                      <Keyboard className="w-4 h-4" />
                      Shortcuts
                    </Button>
                    {gameVideo && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSyncModal(true)}
                        className="gap-2 h-8"
                      >
                        <Clock className="w-4 h-4" />
                        {isCalibrated ? 'Re-sync Clock' : 'Sync Clock'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Legacy Header - Keep for non-calibrated states */}
        {(!gameVideo || gameVideo.status !== 'ready' || !isCalibrated) && (
          <div className="flex-shrink-0 px-4 py-4">
        <div className="max-w-[1800px] mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/stat-admin')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              
              <div className="h-6 w-px bg-gray-300" />
              
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Video className="w-5 h-5 text-orange-500" />
                Video Stat Tracker
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Sync Existing Stats */}
              {clockSyncConfig && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncExistingStats}
                  className="gap-2"
                  disabled={isSyncingStats}
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncingStats ? 'animate-spin' : ''}`} />
                  {isSyncingStats ? 'Syncing...' : 'Sync Stats'}
                </Button>
              )}
              
              {/* View Game */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/dashboard/stat-admin/game/${gameId}`)}
                className="gap-2"
                disabled={!gameData}
              >
                <Eye className="w-4 h-4" />
                View Game
              </Button>
              
              {/* Edit Stats */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditModal(true)}
                className="gap-2"
                disabled={!gameData}
              >
                <Edit className="w-4 h-4" />
                Edit Stats
              </Button>
              
              {/* Complete Game / Edit Awards */}
              {gameData && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowAwardsModal(true)}
                  className="gap-2 bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Trophy className="w-4 h-4" />
                  {gameData.status === 'completed' ? 'Edit Awards' : 'Complete Game'}
                </Button>
              )}
              
              {/* Keyboard Help */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
                className="gap-2"
              >
                <Keyboard className="w-4 h-4" />
                Shortcuts
              </Button>
              
              {/* Clock Sync Settings */}
              {gameVideo && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSyncModal(true)}
                  className="gap-2"
                >
                  <Clock className="w-4 h-4" />
                  {isCalibrated ? 'Re-sync Clock' : 'Sync Clock'}
                </Button>
              )}
            </div>
          </div>
            </div>
          </div>
        )}
          
        {/* Loading and Non-Calibrated States */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="max-w-[1800px] mx-auto">
          {/* Loading */}
          {videoLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          )}
          
          {/* Bunny.net not configured warning */}
          {!videoLoading && !bunnyConfigured && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-yellow-800 mb-1">
                    Bunny.net Not Configured
                  </h3>
                  <p className="text-yellow-700 text-sm mb-3">
                    Video uploads require Bunny.net Stream to be configured. 
                    Please add the following environment variables:
                  </p>
                  <ul className="text-yellow-700 text-sm list-disc list-inside space-y-1">
                    <li>NEXT_PUBLIC_BUNNY_LIBRARY_ID</li>
                    <li>NEXT_PUBLIC_BUNNY_CDN_HOSTNAME</li>
                    <li>BUNNY_STREAM_API_KEY</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {/* No video yet - Show uploader */}
          {!videoLoading && bunnyConfigured && !gameVideo && (
            <div className="bg-white rounded-2xl shadow-lg border p-8">
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-orange-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Upload Game Video
                  </h2>
                  <p className="text-gray-600">
                    Upload the game recording to begin video stat tracking.
                  </p>
                </div>
                
                <VideoUploader
                  gameId={gameId}
                  onUploadComplete={handleUploadComplete}
                />
              </div>
            </div>
          )}
          
          {/* Video uploaded but processing */}
          {!videoLoading && gameVideo && gameVideo.status === 'processing' && (
            <div className="bg-white rounded-2xl shadow-lg border p-8 text-center">
              <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Processing Video
              </h2>
              <p className="text-gray-600 mb-4">
                Your video is being processed by Bunny.net. This usually takes 1-5 minutes.
              </p>
              
              {/* Processing progress from polling */}
              {isPolling && processingStatus && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                    Checking status...
                  </div>
                  {processingStatus.encodeProgress > 0 && (
                    <div className="max-w-xs mx-auto">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Encoding</span>
                        <span>{processingStatus.encodeProgress}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-orange-500 transition-all duration-500"
                          style={{ width: `${processingStatus.encodeProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-400">
                    Status: {processingStatus.status}
                  </p>
                </div>
              )}
              
              {processingError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{processingError}</p>
                </div>
              )}
            </div>
          )}
          
          {/* Video ready but not calibrated */}
          {!videoLoading && gameVideo && gameVideo.status === 'ready' && !isCalibrated && (
            <div className="bg-white rounded-2xl shadow-lg border p-8">
              <div className="max-w-2xl mx-auto text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Sync Game Clock
                </h2>
                <p className="text-gray-600 mb-6">
                  Before tracking stats, you need to sync the video with the game clock.
                  This ensures stats are recorded with accurate game time.
                </p>
                <Button
                  onClick={() => setShowSyncModal(true)}
                  size="lg"
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Clock className="w-5 h-5 mr-2" />
                  Start Clock Sync
                </Button>
              </div>
            </div>
          )}
          
          {/* Video ready and calibrated - Show tracker */}
          {!videoLoading && gameVideo && gameVideo.status === 'ready' && isCalibrated && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Main Content Area - Video + Right Sidebar */}
              <div className="flex-1 flex min-h-0 overflow-hidden">
                {/* Video Player Section - Maximized Left with Clock/Score Bar */}
                <div className="flex-1 flex flex-col overflow-hidden bg-black border-r border-gray-300">
                  {/* Clock/Score Bar - Above Video */}
                  <div className="flex-shrink-0 bg-gray-900 px-4 py-2 border-b border-gray-700">
                    <div className="flex items-center justify-between gap-4">
                      {/* Left: Clock Display (Compact) */}
                      <div className="flex-shrink-0">
                  <DualClockDisplay
                    videoTimeMs={currentTimeMs}
                    gameClock={gameClock}
                    isCalibrated={isCalibrated}
                    showQuarterExpiredWarning={!showQuarterPrompt}
                          showScores={false}
                    teamAName={gameData?.team_a?.name || gameData?.teamAName || 'My Team'}
                    teamBName={isCoachGame ? opponentName : (gameData?.team_b?.name || 'Team B')}
                    teamAScore={teamAScore}
                    teamBScore={teamBScore}
                    onClockEdit={handleClockEdit}
                    quarterLength={clockSyncConfig?.quarterLengthMinutes || 12}
                  />
                      </div>
                      
                      {/* Center: Score Display (Compact) */}
                      <div className="flex items-center gap-3 px-4 py-1.5 bg-gray-800 rounded-lg border border-gray-600">
                        <div className="text-center min-w-[80px]">
                          <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide truncate">
                            {gameData?.team_a?.name || gameData?.teamAName || 'Team A'}
                          </div>
                          <div className="text-2xl font-bold text-white">{teamAScore}</div>
                        </div>
                        <div className="text-xl font-bold text-gray-500">-</div>
                        <div className="text-center min-w-[80px]">
                          <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide truncate">
                            {isCoachGame ? opponentName : (gameData?.team_b?.name || 'Team B')}
                          </div>
                          <div className="text-2xl font-bold text-white">{teamBScore}</div>
                        </div>
                      </div>
                      
                      {/* Right: Clock Controls (Compact) */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {clockFrozen && frozenClockValue ? (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleClockResume}
                            className="gap-1.5 bg-orange-600 hover:bg-orange-700 text-white h-8 px-3 text-xs animate-pulse"
                      >
                            <Play className="w-3.5 h-3.5" />
                            Resume
                      </Button>
                        ) : (
                          gameClock && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (gameClock) {
                            setClockFrozen(true);
                            setFrozenClockValue(gameClock);
                          }
                        }}
                              className="gap-1.5 text-orange-400 border-orange-500/50 hover:bg-orange-900/30 h-8 px-3 text-xs"
                      >
                              <Pause className="w-3.5 h-3.5" />
                              Pause
                      </Button>
                          )
                    )}
                    
                    {gameClock && gameClock.quarter < 7 && !clockFrozen && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowQuarterPrompt(true)}
                            className="gap-1.5 text-orange-400 border-orange-500/50 hover:bg-orange-900/30 h-8 px-3 text-xs"
                      >
                            <FastForward className="w-3.5 h-3.5" />
                            Q{gameClock.quarter + 1 > 4 ? `OT${gameClock.quarter - 3}` : gameClock.quarter + 1}
                      </Button>
                    )}
                  </div>
                </div>
                
                    {/* Frozen Clock Banner (Compact) */}
                {clockFrozen && frozenClockValue && (
                      <div className="mt-2 px-3 py-1.5 bg-orange-900/40 border border-orange-500/40 rounded flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                        <span className="text-orange-300 text-xs font-medium">
                          ❄️ Clock frozen at Q{frozenClockValue.quarter > 4 ? `OT${frozenClockValue.quarter - 4}` : frozenClockValue.quarter} {frozenClockValue.minutesRemaining}:{frozenClockValue.secondsRemaining.toString().padStart(2, '0')}
                    </span>
                  </div>
                )}
                
                {/* Quarter Advance Prompt */}
                {showQuarterPrompt && gameClock && (
                      <div className="mt-2">
                    <VideoQuarterAdvancePrompt
                      currentQuarter={gameClock.quarter}
                      onAdvanceQuarter={handleAdvanceQuarter}
                      onDismiss={() => setShowQuarterPrompt(false)}
                      isOvertime={gameClock.isOvertime}
                      teamAScore={teamAScore}
                      teamBScore={teamBScore}
                    />
                  </div>
                )}
              </div>
              
                  {/* Video Player */}
                  <div className="flex-1 flex items-center justify-center p-4 min-h-0">
                    <div className="w-full h-full max-w-full max-h-full flex items-center justify-center">
                      <VideoPlayer
                        videoUrl={BunnyUploadService.getVideoDirectUrl(gameVideo.bunnyVideoId)}
                        state={videoState}
                        controls={videoControls}
                        videoRef={videoRef}
                        showGameClock={gameClock ? formatGameClock(gameClock) : undefined}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Right Sidebar - Active Roster + Stats Feed (Full Height) */}
                <div className="w-[400px] flex-shrink-0 flex flex-col h-full min-h-0 bg-white border-l border-gray-200">
                  {/* Active Roster - Uses live hook state for immediate substitution updates */}
                  <ActiveRosterDisplay
                    teamAPlayers={videoStatEntry.onCourtA}
                    teamBPlayers={videoStatEntry.onCourtB}
                    teamAName={gameData?.team_a?.name || gameData?.teamAName || 'Team A'}
                    teamBName={isCoachGame ? opponentName : (gameData?.team_b?.name || 'Team B')}
                    selectedPlayerId={selectedPlayerId}
                    onPlayerSelect={(playerId) => {
                      setSelectedPlayerId(playerId);
                      // Update videoStatEntry directly
                      if (videoStatEntry) {
                        videoStatEntry.handlePlayerSelect(playerId);
                      }
                    }}
                    isCoachMode={isCoachGame}
                    opponentName={opponentName}
                    onCourtA={videoStatEntry.onCourtA}
                    onCourtB={videoStatEntry.onCourtB}
                  />
                  
                  {/* Stats Feed - Takes all remaining space */}
                  <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {/* Stats Feed Header - Compact */}
                    <div className="flex-shrink-0 px-3 py-2 border-b bg-gradient-to-r from-orange-50 to-white">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          <Settings className="w-4 h-4 text-orange-500" />
                          Stats Timeline
                        </h3>
                        {timelineRefreshTrigger > 0 && (
                          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            Updated
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Scrollable Stats List - Full remaining height */}
                    <div className="flex-1 min-h-0 overflow-y-auto">
                      <VideoStatsTimeline
                        gameId={gameId}
                        onSeekToTimestamp={(ms, clockData) => {
                          videoControls.seek(ms / 1000);
                          if (clockFrozen) {
                            setClockFrozen(false);
                            setFrozenClockValue(null);
                          }
                          if (clockData && clockSyncConfig) {
                            const isOvertime = clockData.quarter > 4;
                            const quarterLengthMs = clockSyncConfig.quarterLengthMinutes * 60 * 1000;
                            const overtimeLengthMs = 5 * 60 * 1000;
                            const currentQuarterLengthMs = isOvertime ? overtimeLengthMs : quarterLengthMs;
                            const timeRemainingMs = (clockData.minutes * 60 + clockData.seconds) * 1000;
                            const elapsedInQuarterMs = currentQuarterLengthMs - timeRemainingMs;
                            const newQuarterStartMs = Math.max(0, ms - elapsedInQuarterMs);
                            const updatedConfig = { ...clockSyncConfig };
                            switch (clockData.quarter) {
                              case 1: updatedConfig.jumpballTimestampMs = newQuarterStartMs; break;
                              case 2: updatedConfig.q2StartTimestampMs = newQuarterStartMs; break;
                              case 3: updatedConfig.q3StartTimestampMs = newQuarterStartMs; break;
                              case 4: updatedConfig.q4StartTimestampMs = newQuarterStartMs; break;
                              case 5: updatedConfig.ot1StartTimestampMs = newQuarterStartMs; break;
                              case 6: updatedConfig.ot2StartTimestampMs = newQuarterStartMs; break;
                              case 7: updatedConfig.ot3StartTimestampMs = newQuarterStartMs; break;
                            }
                            setClockSyncConfig(updatedConfig);
                            console.log(`🔄 Clock recalibrated: Q${clockData.quarter} start at ${newQuarterStartMs}ms (based on stat at ${ms}ms)`);
                          }
                        }}
                        refreshTrigger={timelineRefreshTrigger}
                        teamAPlayers={teamAPlayers}
                        teamBPlayers={teamBPlayers}
                        teamAId={gameData?.team_a_id}
                        teamBId={gameData?.team_b_id}
                        teamAName={gameData?.team_a?.name || gameData?.teamAName || 'My Team'}
                        teamBName={isCoachGame ? opponentName : (gameData?.team_b?.name || 'Team B')}
                        isCoachMode={isCoachGame}
                        opponentName={opponentName}
                        clockSyncConfig={clockSyncConfig}
                        currentVideoTimeMs={currentTimeMs}
                        clockFrozen={clockFrozen}
                        frozenClockValue={frozenClockValue}
                        gameClock={gameClock}
                        onClockPause={() => {
                          if (gameClock) {
                            console.log('⏸️ Clock paused from timeline:', `Q${gameClock.quarter} ${gameClock.minutesRemaining}:${gameClock.secondsRemaining}`);
                            setClockFrozen(true);
                            setFrozenClockValue(gameClock);
                          }
                        }}
                        onClockResume={handleClockResume}
                        onScoresChanged={loadScores}
                        pendingStats={optimisticTimeline.pendingStats}
                        onClearPendingStats={optimisticTimeline.clearPendingStats}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Phase 5: Bottom Section - Stat Entry Buttons */}
              {videoStatEntry && !videoStatEntry.loading && videoStatEntry.gameData && (
                <div className="flex-shrink-0 border-t bg-white">
                  <VideoStatEntryButtons
                    onStatRecord={(statType, modifier, locationData) => {
                      if (statType === 'turnover') {
                        videoStatEntry.handleInitiateTurnover();
                      } else if (statType === 'foul') {
                        videoStatEntry.handleInitiateFoul();
                      } else if (statType === 'rebound') {
                        videoStatEntry.handleInitiateRebound();
                      } else {
                        videoStatEntry.handleStatRecord(statType, modifier, locationData);
                      }
                    }}
                    onInitiateTurnover={videoStatEntry.handleInitiateTurnover}
                    onInitiateFoul={videoStatEntry.handleInitiateFoul}
                    onInitiateRebound={videoStatEntry.handleInitiateRebound}
                    disabled={!videoStatEntry.selectedPlayer || videoStatEntry.isRecording}
                    selectedPlayerId={videoStatEntry.selectedPlayer}
                    selectedTeamId={videoStatEntry.selectedTeam === 'A' ? (gameData?.team_a_id || '') : (gameData?.team_b_id || '')}
                    teamAId={gameData?.team_a_id || ''}
                    playerName={videoStatEntry.getSelectedPlayerData()?.name}
                    jerseyNumber={videoStatEntry.getSelectedPlayerData()?.jerseyNumber}
                    isManualMode={isManualMode}
                    onToggleManualMode={() => setIsManualMode(!isManualMode)}
                  />
                  
                  {/* Prompt Renderer Overlay */}
                  {videoStatEntry.promptType && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
                        <VideoStatPromptRenderer
                          promptType={videoStatEntry.promptType}
                          lastEvent={videoStatEntry.lastEvent}
                          promptPlayers={videoStatEntry.getPromptPlayers()}
                          onTurnoverTypeSelect={videoStatEntry.handleTurnoverTypeSelect}
                          onFoulTypeSelect={videoStatEntry.handleFoulTypeSelect}
                          onFreeThrowComplete={videoStatEntry.handleFreeThrowComplete}
                          onPromptPlayerSelect={videoStatEntry.handlePromptPlayerSelect}
                          onBlockedShotTypeSelect={videoStatEntry.handleBlockedShotTypeSelect}
                          onReboundTypeSelect={videoStatEntry.handleReboundTypeSelect}
                          onShotMadeMissed={videoStatEntry.handleShotMadeMissed}
                          onClosePrompt={videoStatEntry.closePrompt}
                          isRecording={videoStatEntry.isRecording}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Substitution Modal */}
                  <SubstitutionModalV4
                    isOpen={videoStatEntry.showSubModal}
                    onClose={() => videoStatEntry.setShowSubModal(false)}
                    onConfirm={videoStatEntry.handleSubConfirm}
                    teamAOnCourt={videoStatEntry.onCourtA}
                    teamABench={videoStatEntry.benchA}
                    teamBOnCourt={isCoachGame ? [] : videoStatEntry.onCourtB}
                    teamBBench={isCoachGame ? [] : videoStatEntry.benchB}
                    teamAName={videoStatEntry.gameData.team_a?.name || videoStatEntry.gameData.teamAName || 'My Team'}
                    teamBName={videoStatEntry.gameData.team_b?.name || videoStatEntry.gameData.teamBName || 'Team B'}
                    initialTeam={isCoachGame ? 'teamA' : (videoStatEntry.selectedTeam === 'B' ? 'teamB' : 'teamA')}
                  />
                </div>
              )}
            </div>
          )}
          
          {/* Legacy Layout - Keep for non-calibrated states */}
          {!videoLoading && gameVideo && gameVideo.status === 'ready' && isCalibrated && false && (
            <div className="space-y-4">
              {/* Legacy Main Content - Split Screen */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Video Player (2/3 width) */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <VideoPlayer
                      videoUrl={BunnyUploadService.getVideoDirectUrl(gameVideo.bunnyVideoId)}
                      state={videoState}
                      controls={videoControls}
                      videoRef={videoRef}
                      showGameClock={gameClock ? formatGameClock(gameClock) : undefined}
                      className="aspect-video"
                    />
                  </div>
                </div>
                
                {/* Stat Entry Panel (1/3 width) */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-xl shadow-sm border h-full overflow-hidden">
                    <VideoStatEntryPanel
                      gameId={gameId}
                      videoId={gameVideo.bunnyVideoId}
                      currentVideoTimeMs={currentTimeMs}
                      gameClock={gameClock}
                      onBeforeRecord={handleBeforeStatRecord}
                      onRegisterHandlers={handleRegisterStatHandlers}
                      onStatRecorded={handleStatRecorded}
                      isCoachMode={isCoachGame}
                      userId={user?.id}
                      opponentName={opponentName}
                      preloadedTeamAPlayers={teamAPlayers}
                      preloadedTeamBPlayers={teamBPlayers}
                      preloadedGameData={gameData}
                    />
                  </div>
                </div>
              </div>
              
              {/* Stats Timeline (bottom) */}
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Stats Timeline
                </h3>
                <VideoStatsTimeline
                  gameId={gameId}
                  onSeekToTimestamp={(ms, clockData) => {
                    // Seek video to the timestamp
                    videoControls.seek(ms / 1000);
                    
                    // Unfreeze clock if frozen (so the recalibration takes effect)
                    if (clockFrozen) {
                      setClockFrozen(false);
                      setFrozenClockValue(null);
                    }
                    
                    // Recalibrate game clock sync based on the stat's recorded game clock
                    // This permanently fixes the clock for this quarter, not just a temporary override
                    if (clockData && clockSyncConfig) {
                      // Calculate the new quarter start timestamp based on this stat's data
                      const isOvertime = clockData.quarter > 4;
                      const quarterLengthMs = clockSyncConfig.quarterLengthMinutes * 60 * 1000;
                      const overtimeLengthMs = 5 * 60 * 1000;
                      const currentQuarterLengthMs = isOvertime ? overtimeLengthMs : quarterLengthMs;
                      const timeRemainingMs = (clockData.minutes * 60 + clockData.seconds) * 1000;
                      const elapsedInQuarterMs = currentQuarterLengthMs - timeRemainingMs;
                      const newQuarterStartMs = Math.max(0, ms - elapsedInQuarterMs);
                      
                      // Update the clock sync config locally (recalibrate)
                      const updatedConfig = { ...clockSyncConfig };
                      switch (clockData.quarter) {
                        case 1: updatedConfig.jumpballTimestampMs = newQuarterStartMs; break;
                        case 2: updatedConfig.q2StartTimestampMs = newQuarterStartMs; break;
                        case 3: updatedConfig.q3StartTimestampMs = newQuarterStartMs; break;
                        case 4: updatedConfig.q4StartTimestampMs = newQuarterStartMs; break;
                        case 5: updatedConfig.ot1StartTimestampMs = newQuarterStartMs; break;
                        case 6: updatedConfig.ot2StartTimestampMs = newQuarterStartMs; break;
                        case 7: updatedConfig.ot3StartTimestampMs = newQuarterStartMs; break;
                      }
                      setClockSyncConfig(updatedConfig);
                      console.log(`🔄 Clock recalibrated: Q${clockData.quarter} start at ${newQuarterStartMs}ms (based on stat at ${ms}ms)`);
                    }
                  }}
                  refreshTrigger={timelineRefreshTrigger}
                  teamAPlayers={teamAPlayers}
                  teamBPlayers={teamBPlayers}
                  teamAId={gameData?.team_a_id}
                  teamBId={gameData?.team_b_id}
                  teamAName={gameData?.team_a?.name || gameData?.teamAName || 'My Team'}
                  teamBName={isCoachGame ? opponentName : (gameData?.team_b?.name || 'Team B')}
                  isCoachMode={isCoachGame}
                  opponentName={opponentName}
                  clockSyncConfig={clockSyncConfig}
                  currentVideoTimeMs={currentTimeMs}
                  // Clock control props
                  clockFrozen={clockFrozen}
                  frozenClockValue={frozenClockValue}
                  gameClock={gameClock}
                  onClockPause={() => {
                    if (gameClock) {
                      console.log('⏸️ Clock paused from timeline:', `Q${gameClock.quarter} ${gameClock.minutesRemaining}:${gameClock.secondsRemaining}`);
                      setClockFrozen(true);
                      setFrozenClockValue(gameClock);
                    }
                  }}
                  onClockResume={handleClockResume}
                  onScoresChanged={loadScores}
                  pendingStats={optimisticTimeline.pendingStats}
                  onClearPendingStats={optimisticTimeline.clearPendingStats}
                />
              </div>
            </div>
          )}
          
          {/* Keyboard Shortcuts Help */}
          {showKeyboardHelp && (
            <div className="fixed bottom-4 right-4 bg-white rounded-xl shadow-xl border p-4 w-80 z-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Keyboard Shortcuts</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowKeyboardHelp(false)}
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>
              
              {KEYBOARD_SHORTCUTS_REFERENCE.map((category) => (
                <div key={category.category} className="mb-3">
                  <h5 className="text-xs font-medium text-gray-500 uppercase mb-1">
                    {category.category}
                  </h5>
                  <div className="space-y-1">
                    {category.shortcuts.map((shortcut) => (
                      <div key={shortcut.keys} className="flex justify-between text-sm">
                        <span className="text-gray-600">{shortcut.action}</span>
                        <kbd className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">
                          {shortcut.keys}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
      </main>
      
      {/* Jumpball Sync Modal */}
      {gameVideo && (
        <JumpballSyncModal
          isOpen={showSyncModal}
          onClose={() => setShowSyncModal(false)}
          onComplete={handleSyncComplete}
          videoId={gameVideo.bunnyVideoId}
        />
      )}
      
      {/* Stat Edit Modal */}
      {gameData && (
        <StatEditModalV2
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            // Refresh timeline after edit
            setTimelineRefreshTrigger(prev => prev + 1);
          }}
          gameId={gameId}
          teamAPlayers={teamAPlayers}
          teamBPlayers={teamBPlayers}
          teamAId={gameData.team_a_id}
          teamBId={gameData.team_b_id}
          teamAName={gameData.team_a?.name || gameData.teamAName || 'My Team'}
          teamBName={isCoachGame ? opponentName : (gameData.team_b?.name || 'Team B')}
          isCoachMode={isCoachGame}
          currentQuarter={gameClock?.quarter || 1}
          currentMinutes={gameClock?.minutesRemaining ?? 0}
          currentSeconds={gameClock?.secondsRemaining || 0}
        />
      )}
      
      {/* Game Completion Modal with Awards Selection */}
      {gameData && (
        <GameCompletionModal
          isOpen={showAwardsModal}
          onClose={() => setShowAwardsModal(false)}
          onComplete={handleCompleteGameWithAwards}
          gameId={gameId}
          teamAId={gameData.team_a_id}
          teamBId={gameData.team_b_id}
          teamAName={gameData.team_a?.name || gameData.teamAName || 'My Team'}
          teamBName={isCoachGame ? opponentName : (gameData.team_b?.name || 'Team B')}
          teamAScore={teamAScore}
          teamBScore={teamBScore}
          isCoachGame={isCoachGame}
          opponentName={opponentName}
        />
      )}
    </div>
  );
}

