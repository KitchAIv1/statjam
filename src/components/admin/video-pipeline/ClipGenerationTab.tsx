'use client';

/**
 * Clip Generation Tab Component
 * Displays clip generation job progress
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { ClipGenerationJob } from '@/lib/services/clipService';
import { 
  Film, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  PlayCircle, 
  ExternalLink,
  RotateCcw,
  Pause
} from 'lucide-react';

interface JobWithGame extends ClipGenerationJob {
  gameName: string;
}

interface ClipGenerationTabProps {
  clipJobs: JobWithGame[];
  loading: boolean;
  onCancelJob: (jobId: string) => void;
  onRetryJob: (jobId: string) => void;
}

export function ClipGenerationTab({ 
  clipJobs, 
  loading, 
  onCancelJob,
  onRetryJob
}: ClipGenerationTabProps) {
  const router = useRouter();

  const clipJobStats = {
    pending: clipJobs.filter(j => j.status === 'pending').length,
    processing: clipJobs.filter(j => j.status === 'processing' || j.status === 'approved').length,
    completed: clipJobs.filter(j => j.status === 'completed').length,
    failed: clipJobs.filter(j => j.status === 'failed' || j.status === 'cancelled').length,
  };

  return (
    <>
      {/* Clip Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-amber-500" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{clipJobStats.pending}</div>
              <div className="text-sm text-gray-500">Pending QC</div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Loader2 className="w-8 h-8 text-purple-500" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{clipJobStats.processing}</div>
              <div className="text-sm text-gray-500">Processing</div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{clipJobStats.completed}</div>
              <div className="text-sm text-gray-500">Completed</div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <XCircle className="w-8 h-8 text-red-500" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{clipJobStats.failed}</div>
              <div className="text-sm text-gray-500">Failed/Cancelled</div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
      ) : clipJobs.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
          <Film className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700">No Clip Jobs</h3>
          <p className="text-gray-500 mt-1">
            Clip generation jobs will appear here after QC approval
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {clipJobs.map((job) => {
            const progress = job.total_clips > 0
              ? ((job.completed_clips + job.failed_clips) / job.total_clips) * 100
              : 0;
            
            return (
              <div 
                key={job.id}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:border-orange-200 
                           hover:shadow-md transition-all shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      job.status === 'completed' ? 'bg-green-100' :
                      job.status === 'processing' ? 'bg-purple-100' :
                      job.status === 'failed' ? 'bg-red-100' :
                      job.status === 'cancelled' ? 'bg-gray-100' :
                      job.status === 'approved' ? 'bg-blue-100' :
                      'bg-amber-100'
                    }`}>
                      {job.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-600" />}
                      {job.status === 'processing' && <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />}
                      {job.status === 'failed' && <XCircle className="w-5 h-5 text-red-600" />}
                      {job.status === 'cancelled' && <Pause className="w-5 h-5 text-gray-600" />}
                      {job.status === 'pending' && <Clock className="w-5 h-5 text-amber-600" />}
                      {job.status === 'approved' && <PlayCircle className="w-5 h-5 text-blue-600" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{job.gameName}</h3>
                      <p className="text-sm text-gray-500">
                        {job.completed_clips}/{job.total_clips} clips • {job.status}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {job.status === 'pending' && (
                      <button
                        onClick={() => router.push(`/dashboard/admin/qc-review/${job.game_id}`)}
                        className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg 
                                   hover:bg-green-200 transition-colors"
                      >
                        Review & Approve
                      </button>
                    )}
                    {job.status === 'completed' && (
                      <button
                        onClick={() => router.push(`/dashboard/coach/game/${job.game_id}/clips`)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 
                                   hover:text-gray-900 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Clips
                      </button>
                    )}
                    {(job.status === 'failed' || job.status === 'cancelled') && (
                      <button
                        onClick={() => onRetryJob(job.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-100 
                                   text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Retry Job
                      </button>
                    )}
                    {(job.status === 'pending' || job.status === 'processing') && (
                      <button
                        onClick={() => onCancelJob(job.id)}
                        className="px-3 py-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {job.status === 'processing' && (
                  <div className="mb-2">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-orange-500 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{Math.round(progress)}% complete</p>
                  </div>
                )}

                {/* Error Message */}
                {job.error_message && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {job.error_message}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
