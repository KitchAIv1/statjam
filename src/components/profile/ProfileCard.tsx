// ============================================================================
// PROFILE CARD COMPONENT
// ============================================================================
// Purpose: Reusable profile card with photo, stats, bio, and actions
// Follows .cursorrules: <200 lines, UI only, no business logic
// ============================================================================

'use client';

import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Edit, Share2, Trophy, Users, Calendar, MapPin, 
  Twitter, Instagram, Globe, Facebook, ImageOff 
} from 'lucide-react';
import { OrganizerProfile, CoachProfile, StatAdminProfile, ProfileShareData } from '@/lib/types/profile';
import { getCountryName } from '@/data/countries';

interface ProfileCardProps {
  profileData: OrganizerProfile | CoachProfile | StatAdminProfile;
  shareData: ProfileShareData;
  onEdit: () => void;
  onShare: () => void;
}

/**
 * ProfileCard - Beautiful profile display card
 * 
 * Features:
 * - Profile photo with fallback
 * - Name, role badge
 * - Role-specific stats (3 metrics)
 * - Bio, location
 * - Social links
 * - Edit & Share actions
 * 
 * Follows .cursorrules: <200 lines, UI only
 */
export function ProfileCard({ profileData, shareData, onEdit, onShare }: ProfileCardProps) {
  // Track avatar image loading state
  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get role-specific badge color
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'organizer':
        return 'bg-blue-600 hover:bg-blue-700';
      case 'coach':
        return 'bg-orange-600 hover:bg-orange-700';
      case 'stat_admin':
        return 'bg-purple-600 hover:bg-purple-700';
      default:
        return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  // Get role-specific stats
  const getStatsDisplay = () => {
    if (profileData.role === 'organizer') {
      const stats = profileData.stats;
      return [
        { label: 'Tournaments', value: stats.totalTournaments, icon: Trophy },
        { label: 'Teams', value: stats.totalTeams, icon: Users },
        { label: 'Games', value: stats.totalGames, icon: Calendar }
      ];
    } else if (profileData.role === 'coach') {
      const stats = profileData.stats;
      return [
        { label: 'Teams', value: stats.totalTeams, icon: Users },
        { label: 'Games Tracked', value: stats.gamesTracked, icon: Calendar },
        { label: 'Players', value: stats.totalPlayers, icon: Users }
      ];
    } else if (profileData.role === 'stat_admin') {
      const stats = profileData.stats;
      return [
        { label: 'Games Assigned', value: stats.totalGamesAssigned, icon: Calendar },
        { label: 'Completed', value: stats.gamesCompleted, icon: Trophy },
        { label: 'Completion Rate', value: `${stats.completionRate}%`, icon: Trophy }
      ];
    }
    return [];
  };

  const statsDisplay = getStatsDisplay();

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-2 border-border/50 hover:border-primary/30 overflow-hidden">
      {/* Gradient Top Bar */}
      <div className="h-2 bg-gradient-to-r from-primary via-accent to-orange-500"></div>
      
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Profile Photo */}
          <div className="relative flex-shrink-0">
            <Avatar className="w-32 h-32 sm:w-36 sm:h-36 border-4 border-primary/20 group-hover:border-primary/40 transition-colors">
              {/* Loading Shimmer Effect */}
              {imageStatus === 'loading' && profileData.profilePhotoUrl && (
                <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer bg-[length:200%_100%]" />
              )}
              
              {/* Avatar Image with optimizations */}
              {profileData.profilePhotoUrl && imageStatus !== 'error' && (
                <AvatarImage 
                  src={profileData.profilePhotoUrl} 
                  alt={profileData.name}
                  loading="eager"
                  decoding="async"
                  onLoad={() => setImageStatus('loaded')}
                  onError={() => setImageStatus('error')}
                  className={`object-cover transition-opacity duration-300 ${
                    imageStatus === 'loaded' ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              )}
              
              {/* Fallback - Shows for no image, loading (behind shimmer), or error */}
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-3xl font-bold">
                {imageStatus === 'error' && profileData.profilePhotoUrl ? (
                  <div className="flex flex-col items-center gap-2">
                    <ImageOff className="w-8 h-8 opacity-50" />
                    <span className="text-xs opacity-75">Failed</span>
                  </div>
                ) : (
                  getInitials(profileData.name)
                )}
              </AvatarFallback>
            </Avatar>
            
            {/* Status Indicator */}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-gradient-to-br from-green-400 to-green-500 rounded-full border-4 border-white dark:border-gray-900 flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center sm:text-left">
            {/* Name & Role */}
            <div className="mb-3">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {profileData.name}
              </h2>
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <Badge className={`${getRoleBadgeClass(profileData.role)} text-white gap-1`}>
                  <Trophy className="w-3 h-3" />
                  {profileData.role === 'organizer' ? 'Organizer' : profileData.role === 'coach' ? 'Coach' : 'Stat Admin'}
                </Badge>
                {profileData.location && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {getCountryName(profileData.location)}
                  </span>
                )}
              </div>
              {/* Member Since */}
              <div className="mt-2">
                <span className="text-xs text-muted-foreground flex items-center justify-center sm:justify-start gap-1">
                  <Calendar className="w-3 h-3" />
                  Member since {new Date(profileData.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              {statsDisplay.map((stat, index) => (
                <div 
                  key={index}
                  className="bg-muted/50 rounded-lg p-3 text-center hover:bg-muted transition-colors"
                >
                  <div className="flex items-center justify-center mb-1">
                    <stat.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Bio */}
            {profileData.bio && (
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {profileData.bio}
              </p>
            )}

            {/* Social Links */}
            {profileData.socialLinks && (
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-4">
                {profileData.socialLinks.facebook && (
                  <a
                    href={profileData.socialLinks.facebook.startsWith('http') 
                      ? profileData.socialLinks.facebook 
                      : `https://facebook.com/${profileData.socialLinks.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white transition-colors"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                )}
                {profileData.socialLinks.twitter && (
                  <a
                    href={`https://twitter.com/${profileData.socialLinks.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white transition-colors"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                )}
                {profileData.socialLinks.instagram && (
                  <a
                    href={`https://instagram.com/${profileData.socialLinks.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 flex items-center justify-center text-white transition-colors"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {profileData.socialLinks.website && (
                  <a
                    href={profileData.socialLinks.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-gray-500 hover:bg-gray-600 flex items-center justify-center text-white transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-6">
              <Button
                onClick={onEdit}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </Button>
              <Button
                onClick={onShare}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          </div>
        </div>

        {/* StatJam Social Footer */}
        <div className="border-t border-border/50 bg-muted/30 px-6 py-3 mt-6">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Follow StatJam for tips & updates</span>
            <div className="flex items-center gap-2">
              <a
                href="https://www.facebook.com/people/Statjam/61583861420167/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                <Facebook className="w-3 h-3" />
                <span className="hidden sm:inline">Facebook</span>
              </a>
              <a
                href="https://instagram.com/stat.jam"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transition-colors"
              >
                <Instagram className="w-3 h-3" />
                <span className="hidden sm:inline">Instagram</span>
              </a>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

