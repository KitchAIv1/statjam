'use client';

/**
 * Admin Video Queue Page
 * 
 * Lists all uploaded videos pending assignment to stat admins.
 * Admins can view video details and assign to available stat admins.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  Video, 
  Clock, 
  User, 
  MapPin, 
  Calendar,
  UserCheck,
  AlertCircle,
  RefreshCw,
  ChevronDown
} from 'lucide-react';

export default function AdminVideoQueuePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthV2();
  
  const [queue, setQueue] = useState<VideoQueueItem[]>([]);
  const [statAdmins, setStatAdmins] = useState<StatAdminOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigningVideoId, setAssigningVideoId] = useState<string | null>(null);

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
    }
  }, [user, authLoading, router, loadData]);

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

  const getStatusBadge = (item: VideoQueueItem) => {
    const status = item.video.assignmentStatus;
    const colors = {
      pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      assigned: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      in_progress: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      completed: 'bg-green-500/20 text-green-400 border-green-500/30',
      cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    const labels = {
      pending: 'Pending',
      assigned: 'Assigned',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded border ${colors[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getTimeRemaining = (hours: number | null) => {
    if (hours === null) return null;
    if (hours <= 0) return <span className="text-red-400 font-medium">Overdue</span>;
    if (hours < 6) return <span className="text-amber-400">{hours.toFixed(1)}h left</span>;
    return <span className="text-green-400">{hours.toFixed(1)}h left</span>;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Video className="w-7 h-7 text-orange-500" />
            Video Tracking Queue
          </h1>
          <p className="text-gray-400 mt-1">
            Assign uploaded videos to stat admins for tracking
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 
                     rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg 
                        flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-3xl font-bold text-amber-400">
            {queue.filter(q => q.video.assignmentStatus === 'pending').length}
          </div>
          <div className="text-sm text-gray-400">Pending Assignment</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-3xl font-bold text-blue-400">
            {queue.filter(q => q.video.assignmentStatus === 'assigned').length}
          </div>
          <div className="text-sm text-gray-400">Assigned</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-3xl font-bold text-purple-400">
            {queue.filter(q => q.video.assignmentStatus === 'in_progress').length}
          </div>
          <div className="text-sm text-gray-400">In Progress</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-3xl font-bold text-gray-400">
            {statAdmins.length}
          </div>
          <div className="text-sm text-gray-400">Available Stat Admins</div>
        </div>
      </div>

      {/* Queue Table */}
      {queue.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
          <Video className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300">No Videos in Queue</h3>
          <p className="text-gray-500 mt-1">
            Videos uploaded by coaches will appear here for assignment
          </p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Video / Game
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Coach
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Time Left
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Assign To
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {queue.map((item) => (
                <tr key={item.video.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                        <Video className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {item.teamName} vs {item.opponentName}
                        </div>
                        <div className="text-sm text-gray-400 flex items-center gap-2 mt-1">
                          {item.gameDate && (
                            <>
                              <Calendar className="w-3 h-3" />
                              {new Date(item.gameDate).toLocaleDateString()}
                            </>
                          )}
                          {item.video.durationSeconds && (
                            <span className="text-gray-500">
                              • {Math.floor(item.video.durationSeconds / 60)}min
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <div>
                        <div className="text-sm">{item.coachName}</div>
                        {item.country && (
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {item.country}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {getStatusBadge(item)}
                    {item.assignedAdminName && (
                      <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        {item.assignedAdminName}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      {getTimeRemaining(item.hoursRemaining)}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {item.video.assignmentStatus === 'pending' ? (
                      <div className="relative">
                        <select
                          className="appearance-none bg-gray-800 border border-gray-700 rounded-lg 
                                     px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 
                                     focus:ring-orange-500 cursor-pointer"
                          disabled={assigningVideoId === item.video.id}
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAssign(item.video.id, e.target.value);
                            }
                          }}
                          defaultValue=""
                        >
                          <option value="" disabled>Select Admin</option>
                          {statAdmins.map((admin) => (
                            <option key={admin.id} value={admin.id}>
                              {admin.name} ({admin.activeAssignments} active)
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 
                                                 text-gray-400 pointer-events-none" />
                      </div>
                    ) : (
                      <button
                        onClick={() => handleUnassign(item.video.id)}
                        disabled={assigningVideoId === item.video.id}
                        className="text-sm text-gray-400 hover:text-red-400 transition-colors"
                      >
                        Unassign
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

