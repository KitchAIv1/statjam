'use client';

import React, { use, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthV2 } from '@/hooks/useAuthV2';
import { GameService } from '@/lib/services/gameService';
import { VideoStatService, ClockSyncConfig } from '@/lib/services/videoStatService';
import { BunnyUploadService } from '@/lib/services/bunnyUploadService';
import {
  getStatsForQCReview,
  getClipJob,
  createClipJob,
  approveClipJob,
  requestCorrections,
  ClipEligibleStat,
  ClipGenerationJob,
} from '@/lib/services/clipService';
import { QCReviewTimeline } from '@/components/clips/QCReviewTimeline';
import { StatEditForm } from '@/components/tracker-v3/modals/StatEditForm';
import { CoachPlayerService } from '@/lib/services/coachPlayerService';
import { GameStatRecord } from '@/lib/services/statEditService';
import {
  Loader2,
  AlertCircle,
  ShieldAlert,
  ArrowLeft,
  Check,
  X,
  Film,
  Play,
  Pause,
  SkipBack,
  SkipForward,
} from 'lucide-react';

interface QCReviewPageProps {
  params: Promise<{ gameId: string }>;
}

/**
 * QC Review Page
 * Allows admins to review tracked stats before approving clip generation
 */
export default function QCReviewPage({ params }: QCReviewPageProps) {
  const { gameId } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuthV2();
  const videoRef = useRef<HTMLVideoElement>(null);

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [game, setGame] = useState<any>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<ClipEligibleStat[]>([]);
  const [job, setJob] = useState<ClipGenerationJob | null>(null);
  const [selectedStatId, setSelectedStatId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Approval state
  const [isApproving, setIsApproving] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectMessage, setRejectMessage] = useState('');

  // Edit form state
  const [editingStat, setEditingStat] = useState<GameStatRecord | null>(null);
  const [editingStatId, setEditingStatId] = useState<string | null>(null); // Track ID separately
  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  const [clockSyncConfig, setClockSyncConfig] = useState<ClockSyncConfig | null>(null);

  // Load data
  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
        setLoading(true);

        // Load game
        const gameData = await GameService.getGame(gameId);
        if (!gameData) {
          setError('Game not found');
          return;
        }
        setGame(gameData);

        // Load video - use BunnyUploadService for consistent URL construction
        const videoData = await VideoStatService.getGameVideo(gameId);
        if (videoData?.bunnyVideoId) {
          const url = BunnyUploadService.getVideoDirectUrl(videoData.bunnyVideoId);
          setVideoUrl(url);
          
          // Load clock sync config for edit modal (auto-sync video timestamp)
          const config = await VideoStatService.getClockSync(videoData.id);
          setClockSyncConfig(config);
        }

        // Load stats
        const statsData = await getStatsForQCReview(gameId);
        setStats(statsData);

        // Load existing job
        const existingJob = await getClipJob(gameId);
        setJob(existingJob);

        // Load players for edit form
        if (gameData.is_coach_game) {
          // Coach game: load custom players
          const customPlayers = await CoachPlayerService.getCoachTeamPlayers(gameData.team_a_id);
          setAllPlayers(customPlayers.map((p: any) => ({
            id: p.id,
            name: p.name,
            jersey_number: p.jersey_number,
            is_custom_player: true,
          })));
        } else {
          // Organizer game: would need to load from teams - simplified for now
          setAllPlayers([]);
        }

      } catch (err) {
        console.error('Error loading QC data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && user) {
      loadData();
    }
  }, [gameId, user, authLoading]);

  // Video event handlers
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime * 1000);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration * 1000);
    }
  }, []);

  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handleSeekToTime = useCallback((timestampMs: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestampMs / 1000;
      // Find and select the stat at this time
      const stat = stats.find(s => s.video_timestamp_ms === timestampMs);
      if (stat) {
        setSelectedStatId(stat.id);
      }
    }
  }, [stats]);

  const handleSkip = useCallback((seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  }, []);

  // Handle edit stat - open StatEditForm directly
  const handleEditStat = useCallback((statId: string) => {
    const stat = stats.find(s => s.id === statId);
    if (stat) {
      // Convert ClipEligibleStat to GameStatRecord format
      const statRecord: GameStatRecord = {
        id: stat.id,
        game_id: gameId,
        player_id: stat.player_id,
        custom_player_id: stat.custom_player_id,
        team_id: game?.team_a_id || '',
        stat_type: stat.stat_type,
        modifier: stat.modifier,
        stat_value: stat.points || 0,
        quarter: stat.quarter,
        game_time_minutes: stat.game_time_minutes,
        game_time_seconds: stat.game_time_seconds,
        shot_location_x: null,
        shot_location_y: null,
        shot_zone: null,
        created_at: '',
      };
      setEditingStatId(statId); // Track ID separately
      setEditingStat(statRecord);
    }
  }, [stats, gameId, game]);

  // Handle edit form close - refresh stats
  const handleEditClose = useCallback(async () => {
    const editedId = editingStatId;
    setEditingStat(null);
    setEditingStatId(null);
    // Small delay to allow Supabase write to propagate to read replicas
    await new Promise(resolve => setTimeout(resolve, 500));
    // Refresh stats after edit
    console.log('🔄 Refreshing stats after edit... editedId:', editedId);
    const statsData = await getStatsForQCReview(gameId);
    // Find the edited stat to verify
    const editedStat = statsData.find(s => s.id === editedId);
    console.log('✅ Stats refreshed. Edited stat now:', editedStat?.video_timestamp_ms, 'ms, game clock:', editedStat?.game_time_minutes, ':', editedStat?.game_time_seconds);
    setStats(statsData);
  }, [gameId, editingStatId]);

  // Submit for QC (create job)
  const handleSubmitForQC = async () => {
    if (!user) return;

    try {
      setIsApproving(true);
      const videoData = await VideoStatService.getGameVideo(gameId);
      if (!videoData) {
        setError('Video not found');
        return;
      }

      const newJob = await createClipJob(gameId, videoData.id);
      if (newJob) {
        setJob(newJob);
      }
    } catch (err) {
      console.error('Error creating job:', err);
      setError('Failed to submit for QC');
    } finally {
      setIsApproving(false);
    }
  };

  // Approve and generate clips
  const handleApprove = async () => {
    if (!user || !job) return;

    try {
      setIsApproving(true);
      const success = await approveClipJob(job.id, user.id);
      if (success) {
        // Refresh job status
        const updatedJob = await getClipJob(gameId);
        setJob(updatedJob);
        // Redirect to clip jobs dashboard
        router.push('/dashboard/admin/clip-jobs');
      }
    } catch (err) {
      console.error('Error approving job:', err);
      setError('Failed to approve');
    } finally {
      setIsApproving(false);
    }
  };

  // Request corrections
  const handleReject = async () => {
    if (!job || !rejectMessage.trim()) return;

    try {
      setIsApproving(true);
      const success = await requestCorrections(job.id, rejectMessage);
      if (success) {
        setShowRejectModal(false);
        setRejectMessage('');
        const updatedJob = await getClipJob(gameId);
        setJob(updatedJob);
      }
    } catch (err) {
      console.error('Error requesting corrections:', err);
      setError('Failed to request corrections');
    } finally {
      setIsApproving(false);
    }
  };

  // Format time
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Clip count
  const clipEligibleCount = stats.filter(s => s.is_clip_eligible).length;

  // Auth check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-red-50/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-red-50/30 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-orange-200">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 mb-4">This page is only available to administrators.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-red-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading QC data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-red-50/30 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-red-200">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-orange-50/50 via-white to-red-50/30 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-orange-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">QC Review</h1>
              <p className="text-sm text-gray-500">
                {game?.team_a_name} vs {game?.team_b_name || game?.opponent_name}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Status Badge */}
            {job && (
              <span className={`
                px-3 py-1 rounded-full text-sm font-medium
                ${job.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''}
                ${job.status === 'approved' ? 'bg-blue-100 text-blue-700' : ''}
                ${job.status === 'processing' ? 'bg-purple-100 text-purple-700' : ''}
                ${job.status === 'completed' ? 'bg-green-100 text-green-700' : ''}
                ${job.status === 'failed' ? 'bg-red-100 text-red-700' : ''}
              `}>
                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
              </span>
            )}

            {/* Clip Count */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 rounded-full">
              <Film className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">{clipEligibleCount} clips</span>
            </div>

            {/* Submit / Approve Buttons */}
            {!job && (
              <button
                onClick={handleSubmitForQC}
                disabled={isApproving || clipEligibleCount === 0}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
                <span>Submit for QC</span>
              </button>
            )}

            {job && job.status === 'pending' && (
              <>
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Request Corrections</span>
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Approve & Generate Clips</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Player Section */}
        <div className="flex-1 flex flex-col bg-black">
          {/* Video */}
          <div className="flex-1 relative">
            {videoUrl ? (
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <p>No video available</p>
              </div>
            )}
          </div>

          {/* Video Controls */}
          <div className="flex-shrink-0 bg-gray-900 px-4 py-3">
            <div className="flex items-center gap-4">
              {/* Play/Pause */}
              <button
                onClick={handlePlayPause}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white" />
                )}
              </button>

              {/* Skip buttons */}
              <button
                onClick={() => handleSkip(-10)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <SkipBack className="w-4 h-4 text-white/70" />
              </button>
              <button
                onClick={() => handleSkip(10)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <SkipForward className="w-4 h-4 text-white/70" />
              </button>

              {/* Time Display */}
              <div className="text-sm text-white/70">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>

              {/* Progress Bar */}
              <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Timeline */}
        <div className="w-[400px] flex-shrink-0 border-l border-gray-200">
          <QCReviewTimeline
            stats={stats}
            onSeekToTime={handleSeekToTime}
            onStatSelect={setSelectedStatId}
            onEditStat={handleEditStat}
            selectedStatId={selectedStatId}
          />
        </div>
      </div>

      {/* Direct Edit Form */}
      {editingStat && (
        <StatEditForm
          stat={editingStat}
          players={allPlayers}
          onClose={() => setEditingStat(null)}
          onSuccess={handleEditClose}
          clockSyncConfig={clockSyncConfig}
        />
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Request Corrections</h3>
            <p className="text-sm text-gray-500 mb-4">
              Describe what needs to be corrected before clips can be generated.
            </p>
            <textarea
              value={rejectMessage}
              onChange={(e) => setRejectMessage(e.target.value)}
              placeholder="e.g., Missing rebounds in Q3, incorrect player attribution at 12:34..."
              className="w-full h-32 px-3 py-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectMessage('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectMessage.trim() || isApproving}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isApproving && <Loader2 className="w-4 h-4 animate-spin" />}
                Send Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

