'use client';

/**
 * Admin Video Tracking Pipeline Page
 * 
 * Unified dashboard with 3 tabs:
 * 1. Assignment Queue - Assign uploaded videos to stat admins
 * 2. QC Review - Review tracked stats before clip generation
 * 3. Clip Generation - Monitor clip generation progress
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthV2 } from '@/hooks/useAuthV2';
import { 
  getVideoQueue, 
  getStatAdminOptions,
  assignVideoToStatAdmin,
  unassignVideo,
  VideoQueueItem,
  StatAdminOption 
} from '@/lib/services/videoAssignmentService';
import {
  getAllClipJobs,
  cancelClipJob,
  retryClipJob,
  ClipGenerationJob,
} from '@/lib/services/clipService';
import { GameService } from '@/lib/services/gameService';
import { 
  Video, 
  AlertCircle,
  RefreshCw,
  Film,
  UserCheck,
  ClipboardCheck,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { 
  AssignmentQueueTab, 
  QCReviewTab, 
  ClipGenerationTab 
} from '@/components/admin/video-pipeline';

type TabType = 'assignment' | 'qc_review' | 'clip_generation';

interface JobWithGame extends ClipGenerationJob {
  gameName: string;
}

export default function AdminVideoQueuePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuthV2();
  
  // Tab state - initialize from URL param if present
  const tabFromUrl = searchParams.get('tab') as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>(
    tabFromUrl && ['assignment', 'qc_review', 'clip_generation'].includes(tabFromUrl)
      ? tabFromUrl
      : 'assignment'
  );
  
  // Assignment Queue state
  const [queue, setQueue] = useState<VideoQueueItem[]>([]);
  const [statAdmins, setStatAdmins] = useState<StatAdminOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigningVideoId, setAssigningVideoId] = useState<string | null>(null);

  // Clip Jobs state
  const [clipJobs, setClipJobs] = useState<JobWithGame[]>([]);
  const [clipJobsLoading, setClipJobsLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [queueData, adminsData] = await Promise.all([
        getVideoQueue(),
        getStatAdminOptions()
      ]);
      setQueue(queueData);
      setStatAdmins(adminsData);
    } catch (err) {
      console.error('Error loading video queue:', err);
      setError('Failed to load video queue');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadClipJobs = useCallback(async () => {
    try {
      setClipJobsLoading(true);
      const allJobs = await getAllClipJobs();
      
      // Load game names for each job
      const jobsWithGames = await Promise.all(
        allJobs.map(async (job) => {
          try {
            const game = await GameService.getGame(job.game_id);
            const teamA = game?.team_a_name || 'Team A';
            const teamB = game?.team_b_name || game?.opponent_name || 'Team B';
            return {
              ...job,
              gameName: `${teamA} vs ${teamB}`,
            };
          } catch {
            return {
              ...job,
              gameName: 'Unknown Game',
            };
          }
        })
      );

      setClipJobs(jobsWithGames);
    } catch (error) {
      console.error('Error loading clip jobs:', error);
    } finally {
      setClipJobsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    if (user) {
      loadData();
      loadClipJobs();
    }
  }, [user, authLoading, router, loadData, loadClipJobs]);

  const handleAssign = async (videoId: string, statAdminId: string) => {
    try {
      setAssigningVideoId(videoId);
      await assignVideoToStatAdmin(videoId, statAdminId);
      await loadData();
    } catch (err) {
      console.error('Error assigning video:', err);
      setError('Failed to assign video');
    } finally {
      setAssigningVideoId(null);
    }
  };

  const handleUnassign = async (videoId: string) => {
    try {
      setAssigningVideoId(videoId);
      await unassignVideo(videoId);
      await loadData();
    } catch (err) {
      console.error('Error unassigning video:', err);
      setError('Failed to unassign video');
    } finally {
      setAssigningVideoId(null);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to cancel this job?')) return;
    const success = await cancelClipJob(jobId);
    if (success) {
      await loadClipJobs();
    }
  };

  const handleRetryJob = async (jobId: string) => {
    if (!confirm('Retry this clip generation job?')) return;
    const success = await retryClipJob(jobId);
    if (success) {
      await loadClipJobs();
    }
  };

  // Get QC-ready games (in_progress or completed tracking)
  const qcReadyGames = queue.filter(item => 
    item.video.assignmentStatus === 'in_progress' || 
    item.video.assignmentStatus === 'completed'
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-red-50/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-red-50/30">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Video className="w-6 h-6 text-orange-500" />
                Video Tracking Pipeline
              </h1>
              <p className="text-sm text-gray-500">
                Manage video assignments, QC review, and clip generation
              </p>
            </div>
          </div>
          <button
            onClick={() => { loadData(); loadClipJobs(); }}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 
                       rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('assignment')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${activeTab === 'assignment' 
                ? 'bg-orange-500 text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-white'
              }`}
          >
            <UserCheck className="w-4 h-4" />
            Assignment Queue
            <span className={`px-1.5 py-0.5 text-xs rounded ${
              activeTab === 'assignment' ? 'bg-orange-600' : 'bg-gray-200 text-gray-600'
            }`}>
              {queue.filter(q => q.video.assignmentStatus === 'pending').length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('qc_review')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${activeTab === 'qc_review' 
                ? 'bg-orange-500 text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-white'
              }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            QC Review
            <span className={`px-1.5 py-0.5 text-xs rounded ${
              activeTab === 'qc_review' ? 'bg-orange-600' : 'bg-gray-200 text-gray-600'
            }`}>
              {qcReadyGames.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('clip_generation')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${activeTab === 'clip_generation' 
                ? 'bg-orange-500 text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-white'
              }`}
          >
            <Film className="w-4 h-4" />
            Clip Generation
            <span className={`px-1.5 py-0.5 text-xs rounded ${
              activeTab === 'clip_generation' ? 'bg-orange-600' : 'bg-gray-200 text-gray-600'
            }`}>
              {clipJobs.length}
            </span>
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg 
                          flex items-center gap-3 text-red-600">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'assignment' && (
          <AssignmentQueueTab
            queue={queue}
            statAdmins={statAdmins}
            assigningVideoId={assigningVideoId}
            onAssign={handleAssign}
            onUnassign={handleUnassign}
          />
        )}

        {activeTab === 'qc_review' && (
          <QCReviewTab qcReadyGames={qcReadyGames} />
        )}

        {activeTab === 'clip_generation' && (
          <ClipGenerationTab
            clipJobs={clipJobs}
            loading={clipJobsLoading}
            onCancelJob={handleCancelJob}
            onRetryJob={handleRetryJob}
          />
        )}
      </main>
    </div>
  );
}
