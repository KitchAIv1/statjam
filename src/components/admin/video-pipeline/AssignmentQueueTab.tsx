'use client';

/**
 * Assignment Queue Tab Component
 * Displays videos pending assignment to stat admins
 */

import React from 'react';
import { 
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
  ChevronDown
} from 'lucide-react';

interface AssignmentQueueTabProps {
  queue: VideoQueueItem[];
  statAdmins: StatAdminOption[];
  assigningVideoId: string | null;
  onAssign: (videoId: string, statAdminId: string) => void;
  onUnassign: (videoId: string) => void;
}

export function AssignmentQueueTab({
  queue,
  statAdmins,
  assigningVideoId,
  onAssign,
  onUnassign,
}: AssignmentQueueTabProps) {
  const getStatusBadge = (item: VideoQueueItem) => {
    const status = item.video.assignmentStatus;
    const colors = {
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      assigned: 'bg-blue-100 text-blue-700 border-blue-200',
      in_progress: 'bg-purple-100 text-purple-700 border-purple-200',
      completed: 'bg-green-100 text-green-700 border-green-200',
      cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
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
    if (hours <= 0) return <span className="text-red-600 font-medium">Overdue</span>;
    if (hours < 6) return <span className="text-amber-600">{hours.toFixed(1)}h left</span>;
    return <span className="text-green-600">{hours.toFixed(1)}h left</span>;
  };

  return (
    <>
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="text-3xl font-bold text-amber-600">
            {queue.filter(q => q.video.assignmentStatus === 'pending').length}
          </div>
          <div className="text-sm text-gray-500">Pending Assignment</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="text-3xl font-bold text-blue-600">
            {queue.filter(q => q.video.assignmentStatus === 'assigned').length}
          </div>
          <div className="text-sm text-gray-500">Assigned</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="text-3xl font-bold text-purple-600">
            {queue.filter(q => q.video.assignmentStatus === 'in_progress').length}
          </div>
          <div className="text-sm text-gray-500">In Progress</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="text-3xl font-bold text-gray-600">
            {statAdmins.length}
          </div>
          <div className="text-sm text-gray-500">Available Stat Admins</div>
        </div>
      </div>

      {/* Queue Table */}
      {queue.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
          <Video className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700">No Videos in Queue</h3>
          <p className="text-gray-500 mt-1">
            Videos uploaded by coaches will appear here for assignment
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Video / Game
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Coach
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Time Left
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Assign To
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {queue.map((item) => (
                <tr key={item.video.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Video className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {item.teamName} vs {item.opponentName}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                          {item.gameDate && (
                            <>
                              <Calendar className="w-3 h-3" />
                              {new Date(item.gameDate).toLocaleDateString()}
                            </>
                          )}
                          {item.video.durationSeconds && (
                            <span className="text-gray-400">
                              • {Math.floor(item.video.durationSeconds / 60)}min
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-900">{item.coachName}</div>
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
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        {item.assignedAdminName}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {getTimeRemaining(item.hoursRemaining)}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {item.video.assignmentStatus === 'pending' ? (
                      <div className="relative">
                        <select
                          className="appearance-none bg-white border border-gray-300 rounded-lg 
                                     px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 
                                     focus:ring-orange-500 focus:border-orange-500 cursor-pointer"
                          disabled={assigningVideoId === item.video.id}
                          onChange={(e) => {
                            if (e.target.value) {
                              onAssign(item.video.id, e.target.value);
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
                        onClick={() => onUnassign(item.video.id)}
                        disabled={assigningVideoId === item.video.id}
                        className="text-sm text-gray-500 hover:text-red-600 transition-colors"
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
    </>
  );
}
