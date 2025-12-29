'use client';

/**
 * Assigned Videos Section
 * 
 * Displays videos assigned to the current stat admin for tracking.
 * Used in the Stat Admin dashboard.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getAssignedVideos, 
  updateAssignmentStatus,
  VideoQueueItem 
} from '@/lib/services/videoAssignmentService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Video, 
  Clock, 
  Play, 
  AlertTriangle, 
  RefreshCw,
  CheckCircle,
  MapPin
} from 'lucide-react';

interface AssignedVideosSectionProps {
  userId: string;
}

export function AssignedVideosSection({ userId }: AssignedVideosSectionProps) {
  const router = useRouter();
  const [videos, setVideos] = useState<VideoQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVideos = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await getAssignedVideos(userId);
      setVideos(data);
    } catch (err) {
      console.error('Error loading assigned videos:', err);
      setError('Failed to load assigned videos');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const handleStartTracking = async (videoItem: VideoQueueItem) => {
    try {
      // For completed videos, navigate to game viewer
      if (videoItem.video.assignmentStatus === 'completed') {
        router.push(`/dashboard/coach/game/${videoItem.video.gameId}`);
        return;
      }
      
      // Update status to in_progress
      if (videoItem.video.assignmentStatus === 'assigned') {
        await updateAssignmentStatus(videoItem.video.id, 'in_progress');
      }
      // Navigate to video tracker
      router.push(`/dashboard/stat-admin/video/${videoItem.video.gameId}`);
    } catch (err) {
      console.error('Error starting tracking:', err);
    }
  };

  const getTimeRemainingDisplay = (hours: number | null) => {
    if (hours === null) return null;
    
    if (hours <= 0) {
      return (
        <span className="flex items-center gap-1 text-red-400">
          <AlertTriangle className="w-3 h-3" />
          Overdue
        </span>
      );
    }
    
    if (hours < 6) {
      return (
        <span className="flex items-center gap-1 text-amber-400">
          <Clock className="w-3 h-3" />
          {hours.toFixed(1)}h left
        </span>
      );
    }
    
    return (
      <span className="flex items-center gap-1 text-green-400">
        <Clock className="w-3 h-3" />
        {hours.toFixed(1)}h left
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    if (status === 'completed') {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Completed
        </span>
      );
    }
    if (status === 'in_progress') {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
          In Progress
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
        Assigned
      </span>
    );
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-purple-500" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (videos.length === 0) {
    return null; // Don't show section if no videos assigned
  }

  return (
    <Card className="border-2 border-purple-500/30 hover:shadow-lg transition-all">
      <CardHeader className="bg-gradient-to-r from-purple-500/10 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-purple-500" />
            <CardTitle>Assigned Videos</CardTitle>
            <span className="text-xs px-2 py-1 bg-purple-500 text-white rounded-full font-medium">
              {videos.length}
            </span>
          </div>
          <button
            onClick={loadVideos}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <CardDescription>
          Videos assigned to you for stat tracking
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4 pt-4">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}
        
        <div className="grid gap-4">
          {videos.map((item) => (
            <div 
              key={item.video.id}
              className="p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 
                         rounded-lg hover:border-purple-500/50 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(item.video.assignmentStatus)}
                    {getTimeRemainingDisplay(item.hoursRemaining)}
                  </div>
                  
                  <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                    {item.teamName} vs {item.opponentName}
                  </h4>
                  
                  <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 space-y-1">
                    <div className="flex items-center gap-2">
                      <span>Coach: {item.coachName}</span>
                      {item.country && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {item.country}
                          </span>
                        </>
                      )}
                    </div>
                    {item.video.durationSeconds && (
                      <div>
                        Duration: {Math.floor(item.video.durationSeconds / 60)} minutes
                      </div>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => handleStartTracking(item)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-md hover:shadow-lg flex-shrink-0 ${
                    item.video.assignmentStatus === 'completed'
                      ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                      : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white'
                  }`}
                >
                  {item.video.assignmentStatus === 'completed' ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      View Stats
                    </>
                  ) : item.video.assignmentStatus === 'in_progress' ? (
                    <>
                      <Play className="w-4 h-4" />
                      Continue
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Start Tracking
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

