'use client';

/**
 * Dashboard Core Cards
 * 
 * Three-card layout for Stat Admin dashboard:
 * 1. Profile Card - Compact profile info
 * 2. Game Stats Card - Game metrics  
 * 3. Video Tracking Card - Video assignment metrics
 * 
 * Follows .cursorrules: <200 lines, UI only
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import {
  User,
  MapPin,
  Edit,
  Share2,
  Trophy,
  Clock,
  CheckCircle,
  Video,
  Play,
  AlertTriangle
} from 'lucide-react';
import { StatAdminProfile } from '@/lib/types/profile';
import { getCountryName } from '@/data/countries';

interface VideoStats {
  total: number;
  assigned: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

interface GameStats {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
}

interface DashboardCoreCardsProps {
  profileData: StatAdminProfile | null;
  profileLoading: boolean;
  gameStats: GameStats;
  gamesLoading: boolean;
  videoStats: VideoStats;
  videosLoading: boolean;
  onEditProfile: () => void;
  onShareProfile: () => void;
}

// Get initials for avatar fallback
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

// Card skeleton for loading states
function CardSkeleton({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <Card className="border-2 border-orange-200/50 bg-gradient-to-br from-white to-orange-50/30 overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600" />
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-bold text-gray-900">{title}</h3>
        </div>
        <div className="space-y-3">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardCoreCards({
  profileData,
  profileLoading,
  gameStats,
  gamesLoading,
  videoStats,
  videosLoading,
  onEditProfile,
  onShareProfile
}: DashboardCoreCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* 1. PROFILE CARD */}
      {profileLoading ? (
        <CardSkeleton icon={User} title="Profile" />
      ) : profileData ? (
        <Card className="border-2 border-orange-200/50 bg-gradient-to-br from-white to-orange-50/30 overflow-hidden hover:shadow-xl hover:border-orange-400/50 transition-all duration-300">
          <div className="h-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600" />
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <Avatar className="w-16 h-16 border-3 border-orange-300/50 shadow-lg">
                {profileData.profilePhotoUrl && (
                  <AvatarImage src={profileData.profilePhotoUrl} alt={profileData.name} />
                )}
                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-lg font-bold">
                  {getInitials(profileData.name)}
                </AvatarFallback>
              </Avatar>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-gray-900 truncate">
                  {profileData.name}
                </h3>
                <Badge className="bg-purple-600 hover:bg-purple-700 text-white text-xs mt-1">
                  <Trophy className="w-3 h-3 mr-1" />
                  Stat Admin
                </Badge>
                {profileData.location && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                    <MapPin className="w-3 h-3" />
                    {getCountryName(profileData.location)}
                  </div>
                )}
              </div>
            </div>
            
            {/* Bio Preview */}
            {profileData.bio && (
              <p className="text-xs text-gray-600 mt-3 line-clamp-2 italic">
                "{profileData.bio}"
              </p>
            )}
            
            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={onEditProfile}
                className="flex-1 text-xs border-orange-300 hover:bg-orange-50"
              >
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onShareProfile}
                className="flex-1 text-xs border-orange-300 hover:bg-orange-50"
              >
                <Share2 className="w-3 h-3 mr-1" />
                Share
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* 2. GAME STATS CARD */}
      {gamesLoading ? (
        <CardSkeleton icon={Trophy} title="Game Stats" />
      ) : (
        <Card className="border-2 border-blue-200/50 bg-gradient-to-br from-white to-blue-50/30 overflow-hidden hover:shadow-xl hover:border-blue-400/50 transition-all duration-300">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600" />
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-gray-900">Game Stats</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-100/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {gameStats.total}
                </div>
                <div className="text-xs text-gray-600">Assigned</div>
              </div>
              <div className="bg-green-100/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {gameStats.completed}
                </div>
                <div className="text-xs text-gray-600">Completed</div>
              </div>
              <div className="bg-amber-100/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {gameStats.pending}
                </div>
                <div className="text-xs text-gray-600">Pending</div>
              </div>
              <div className="bg-purple-100/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {gameStats.completionRate}%
                </div>
                <div className="text-xs text-gray-600">Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. VIDEO TRACKING CARD */}
      {videosLoading ? (
        <CardSkeleton icon={Video} title="Video Tracking" />
      ) : (
        <Card className="border-2 border-orange-200/50 bg-gradient-to-br from-white to-orange-50/30 overflow-hidden hover:shadow-xl hover:border-orange-400/50 transition-all duration-300">
          <div className="h-1.5 bg-gradient-to-r from-orange-500 via-red-500 to-orange-600" />
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                <Video className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">Video Tracking</h3>
                <span className="text-xs text-gray-500">
                  {videoStats.total} total videos
                </span>
              </div>
            </div>
            
            {/* Status Breakdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-blue-100/50">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-700">Assigned</span>
                </div>
                <span className="font-bold text-blue-600">{videoStats.assigned}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-orange-100/50">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-gray-700">In Progress</span>
                </div>
                <span className="font-bold text-orange-600">{videoStats.inProgress}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-green-100/50">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-700">Completed</span>
                </div>
                <span className="font-bold text-green-600">{videoStats.completed}</span>
              </div>
              {videoStats.overdue > 0 && (
                <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-red-100/50">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-gray-700">Overdue</span>
                  </div>
                  <span className="font-bold text-red-600">{videoStats.overdue}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
