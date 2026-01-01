'use client';

/**
 * QC Review Tab Component
 * Displays games ready for quality control review before clip generation
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { VideoQueueItem } from '@/lib/services/videoAssignmentService';
import { Video, User, ClipboardCheck } from 'lucide-react';

interface QCReviewTabProps {
  qcReadyGames: VideoQueueItem[];
}

export function QCReviewTab({ qcReadyGames }: QCReviewTabProps) {
  const router = useRouter();

  if (qcReadyGames.length === 0) {
    return (
      <>
        <div className="mb-6">
          <p className="text-gray-500">
            Games with completed tracking ready for QC review before clip generation.
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
          <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700">No Games Ready for QC</h3>
          <p className="text-gray-500 mt-1">
            Games will appear here once stat tracking is in progress or completed
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-6">
        <p className="text-gray-500">
          Games with completed tracking ready for QC review before clip generation.
        </p>
      </div>
      <div className="grid gap-4">
        {qcReadyGames.map((item) => (
          <div 
            key={item.video.id}
            className="bg-white border border-gray-200 rounded-xl p-4 hover:border-orange-200 
                       hover:shadow-md transition-all shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Video className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {item.teamName} vs {item.opponentName}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {item.assignedAdminName || 'Unassigned'}
                    </span>
                    {/* Game Status - actual completion state */}
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      item.gameStatus === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {item.gameStatus === 'completed' ? 'Game Complete' : 'Game In Progress'}
                    </span>
                    {/* Pipeline Status - tracking/clips status */}
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      item.video.assignmentStatus === 'completed'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {item.video.assignmentStatus === 'completed' ? 'Clips Ready' : 'Tracking'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => router.push(`/dashboard/admin/qc-review/${item.video.gameId}`)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 
                           text-white rounded-lg transition-colors shadow-sm"
              >
                <ClipboardCheck className="w-4 h-4" />
                Review Stats
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
