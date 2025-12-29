'use client';

/**
 * Coach Video Status Card
 * 
 * Displays the status of an uploaded video with 24-hour countdown.
 * Shows progress through: Uploading → Processing → Pending → Tracking → Complete
 * 
 * Theme: Warm cream (orange-50, white, orange accents) to match coach dashboard
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Video, 
  Clock, 
  CheckCircle, 
  Loader2, 
  Upload, 
  UserCheck,
  BarChart3,
  AlertTriangle
} from 'lucide-react';
import type { GameVideo } from '@/lib/types/video';

interface CoachVideoStatusCardProps {
  video: GameVideo;
  teamName: string;
  opponentName: string;
  compact?: boolean;
}

export function CoachVideoStatusCard({ 
  video, 
  teamName, 
  opponentName,
  compact = false 
}: CoachVideoStatusCardProps) {
  const router = useRouter();
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [hoursRemaining, setHoursRemaining] = useState<number | null>(null);

  const handleViewStats = () => {
    if (video.gameId) {
      router.push(`/dashboard/coach/game/${video.gameId}`);
    }
  };

  // Calculate time remaining
  useEffect(() => {
    if (!video.dueAt) return;

    const updateTime = () => {
      const due = new Date(video.dueAt!);
      const now = new Date();
      const diffMs = due.getTime() - now.getTime();
      
      if (diffMs <= 0) {
        setTimeRemaining('Completing soon...');
        setHoursRemaining(0);
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setHoursRemaining(hours + minutes / 60);
      
      if (hours >= 1) {
        setTimeRemaining(`${hours}h ${minutes}m remaining`);
      } else {
        setTimeRemaining(`${minutes} minutes remaining`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [video.dueAt]);

  const getStatusInfo = () => {
    switch (video.assignmentStatus) {
      case 'pending':
        return {
          icon: <Clock className="w-5 h-5" />,
          label: 'In Queue',
          description: 'Your video is in queue and will be assigned to a stat tracker soon.',
          color: 'amber',
          progress: 25,
        };
      case 'assigned':
        return {
          icon: <UserCheck className="w-5 h-5" />,
          label: 'Assigned',
          description: 'A stat tracker has been assigned and will begin tracking soon.',
          color: 'blue',
          progress: 50,
        };
      case 'in_progress':
        return {
          icon: <Loader2 className="w-5 h-5 animate-spin" />,
          label: 'Tracking',
          description: 'Your video is being tracked. Stats will be available shortly.',
          color: 'orange',
          progress: 75,
        };
      case 'completed':
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          label: 'Complete',
          description: 'Your video has been tracked. View stats in your game summary.',
          color: 'green',
          progress: 100,
        };
      default:
        return {
          icon: <Upload className="w-5 h-5" />,
          label: 'Processing',
          description: 'Your video is being processed.',
          color: 'gray',
          progress: 10,
        };
    }
  };

  const status = getStatusInfo();
  
  const colorClasses = {
    amber: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: 'text-amber-600',
      badge: 'bg-amber-100 text-amber-700',
      progress: 'bg-amber-500',
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      badge: 'bg-blue-100 text-blue-700',
      progress: 'bg-blue-500',
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      icon: 'text-orange-600',
      badge: 'bg-orange-100 text-orange-700',
      progress: 'bg-orange-500',
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      badge: 'bg-green-100 text-green-700',
      progress: 'bg-green-500',
    },
    gray: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      icon: 'text-gray-600',
      badge: 'bg-gray-100 text-gray-700',
      progress: 'bg-gray-500',
    },
  };
  
  const colors = colorClasses[status.color as keyof typeof colorClasses];

  // Compact version for game list
  if (compact) {
    return (
      <div className={`rounded-lg border ${colors.border} ${colors.bg} p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-white border ${colors.border} 
                            flex items-center justify-center ${colors.icon}`}>
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="font-medium text-foreground">
                vs {opponentName}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors.badge}`}>
                  {status.icon}
                  {status.label}
                </span>
                {video.durationSeconds && (
                  <span className="text-xs text-muted-foreground">
                    {Math.floor(video.durationSeconds / 60)} min
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {timeRemaining && video.assignmentStatus !== 'completed' && (
              <div className={`flex items-center gap-1 text-xs ${
                hoursRemaining !== null && hoursRemaining < 6 
                  ? 'text-amber-600' : 'text-muted-foreground'
              }`}>
                <Clock className="w-3 h-3" />
                {timeRemaining}
              </div>
            )}
            
            {video.assignmentStatus === 'completed' && (
              <button 
                onClick={handleViewStats}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white 
                                 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors">
                <BarChart3 className="w-4 h-4" />
                View Stats
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Full version for dedicated page
  return (
    <div className={`rounded-xl border ${colors.border} bg-white shadow-sm overflow-hidden`}>
      {/* Header */}
      <div className={`${colors.bg} px-6 py-4 border-b ${colors.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg bg-white border ${colors.border} 
                            flex items-center justify-center ${colors.icon} shadow-sm`}>
              <Video className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {teamName} vs {opponentName}
              </h3>
              <p className="text-sm text-muted-foreground">
                Uploaded {new Date(video.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${colors.badge}`}>
            {status.icon}
            <span className="font-medium text-sm">{status.label}</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Upload</span>
            <span>Queue</span>
            <span>Assign</span>
            <span>Track</span>
            <span>Complete</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full ${colors.progress} transition-all duration-500`}
              style={{ width: `${status.progress}%` }}
            />
          </div>
        </div>

        {/* Status Description */}
        <p className="text-sm text-muted-foreground mb-4">
          {status.description}
        </p>

        {/* Time Remaining */}
        {video.assignmentStatus !== 'completed' && timeRemaining && (
          <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${colors.bg}`}>
            <Clock className={`w-4 h-4 ${hoursRemaining !== null && hoursRemaining < 6 
              ? 'text-amber-500' : colors.icon}`} />
            <span className={hoursRemaining !== null && hoursRemaining < 6 
              ? 'text-amber-600 font-medium' : 'text-muted-foreground'}>
              {timeRemaining}
            </span>
          </div>
        )}

        {/* Video Details */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4 text-sm text-muted-foreground">
          {video.durationSeconds && (
            <span>Duration: {Math.floor(video.durationSeconds / 60)} min</span>
          )}
          {video.fileSizeBytes && (
            <span>Size: {(video.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
          )}
        </div>

        {/* View Stats Button (only if completed) */}
        {video.assignmentStatus === 'completed' && (
          <div className="mt-4">
            <button 
              onClick={handleViewStats}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 
                               bg-green-500 text-white rounded-lg font-medium 
                               hover:bg-green-600 transition-colors shadow-sm">
              <BarChart3 className="w-4 h-4" />
              View Game Stats
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
