"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { PerformanceChart } from "./PerformanceChart";
import { TournamentCard } from "./TournamentCard";
import { AchievementBadge } from "./AchievementBadge";
import { PremiumCards } from "./PremiumCards";
import { AICoaching } from "./AICoaching";
import { SubscriptionModal } from "./SubscriptionModal";
import { EditProfileModal } from "./EditProfileModal";
import { NotificationBell } from "./NotificationBell";
import { GameStatsTable } from "./GameStatsTable";
import { PersonalStatTracker } from "./player-dashboard/PersonalStatTracker";
import { usePlayerDashboardData } from "@/hooks/usePlayerDashboardData";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Play, Trophy, Star, Calendar, BarChart3, TrendingUp, Brain, Sparkles, Edit3 } from "lucide-react";
import { Skeleton, SkeletonStat } from "@/components/ui/skeleton";
import { getCountryName } from "@/data/countries";
import { SocialFooter } from "./shared/SocialFooter";

const defaultPlayerData = {
  name: "",
  jerseyNumber: "",
  position: "",
  height: "",
  weight: "",
  age: 0,
  team: "",
  location: "",
  profilePhoto: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=400&fit=crop&crop=faces",
  posePhoto: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=600&fit=crop&crop=faces",
  seasonAverages: {
    rebounds: 0,
    assists: 0,
    fieldGoalPercent: 0
  },
  careerHigh: {
    points: 0,
    rebounds: 0,
    assists: 0
  }
};

// Mock data removed - now using live data from usePlayerDashboardData hook

export function PlayerDashboard() {
  const router = useRouter();
  const { user } = useAuthContext(); // ✅ Use centralized auth
  const { data, loading, refetch } = usePlayerDashboardData(user);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [currentPlayerData, setCurrentPlayerData] = useState(defaultPlayerData);
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [showCardGeneration, setShowCardGeneration] = useState(false);

  const handlePremiumFeatureClick = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setIsSubscriptionModalOpen(true);
  };

  const handleCardGenerationClick = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    // For now, show subscription modal
    // Later this will check subscription status and proceed accordingly
    setIsSubscriptionModalOpen(true);
  };

  const handleSubscriptionClose = () => {
    setIsSubscriptionModalOpen(false);
    // If user upgraded, redirect to card generation
    router.push('/dashboard/player/cards');
  };

  const handleEditProfile = () => {
    setIsEditProfileModalOpen(true);
  };

  const handleSaveProfile = async (updatedData: typeof defaultPlayerData) => {
    try {
      // Update local state immediately for better UX
      setCurrentPlayerData(updatedData);
      
      // Get user from context instead of supabase.auth (more reliable)
      if (!user?.id) {
        console.error('💾 No authenticated user for profile save');
        alert('Please sign in to save your profile.');
        return;
      }
      
      // Helper function to convert height to inches (if in ft'in" format)
      const parseHeight = (heightStr: string): number | null => {
        if (!heightStr || heightStr === 'N/A') return null;
        
        // Check if it's in ft'in" format (e.g., "6'0\"")
        const feetInchesMatch = heightStr.match(/(\d+)'(\d+)"/);
        if (feetInchesMatch) {
          const feet = parseInt(feetInchesMatch[1]);
          const inches = parseInt(feetInchesMatch[2]);
          return (feet * 12) + inches; // Convert to total inches
        }
        
        // Check if it's already a number
        const numValue = parseInt(heightStr);
        if (!isNaN(numValue)) return numValue;
        
        return null;
      };
      
      // Helper function to extract numeric weight (e.g., "180 lbs" -> 180)
      const parseWeight = (weightStr: string): number | null => {
        if (!weightStr || weightStr === 'N/A') return null;
        const numMatch = weightStr.match(/(\d+)/);
        return numMatch ? parseInt(numMatch[1]) : null;
      };
      
      // Prepare data with proper type conversions
      const updateData = {
        name: updatedData.name || null,
        jersey_number: updatedData.jerseyNumber ? parseInt(String(updatedData.jerseyNumber)) : null,
        position: updatedData.position || null,
        age: updatedData.age ? parseInt(String(updatedData.age)) : null,
        height: parseHeight(updatedData.height), // Convert to inches (INTEGER)
        weight: parseWeight(updatedData.weight), // Extract number (INTEGER)
        country: updatedData.location || null, // Map 'location' field to DB 'country' column
        profile_photo_url: updatedData.profilePhoto || null,
        pose_photo_url: updatedData.posePhoto || null,
      };
      
      const { data, error } = await supabase!
        .from('users')
        .update(updateData)
        .eq('id', user.id)
        .select();
      
      if (error) {
        console.error('💾 Error saving profile:', error);
        console.error('💾 Error details:', error.message, error.code, error.details);
        alert(`Failed to save profile: ${error.message}`);
        return;
      }
      
      // ✅ CRITICAL: Update local state FIRST for immediate UI update
      setCurrentPlayerData(updatedData);
      
      // Then refresh from database to sync everything else
      await refetch();
      
    } catch (error) {
      console.error('💾 Unexpected error saving profile:', error);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  const handleTabChange = (value: string) => {
    if (value === "ai-coaching") {
      handlePremiumFeatureClick();
      return;
    }
    setCurrentTab(value);
  };

  // Sync database data to currentPlayerData for edit form population
  useEffect(() => {
    if (data.identity) {
      // Helper to format height from inches to feet'inches"
      const formatHeightForDisplay = (inches: number | null | undefined): string => {
        if (!inches || inches === 0) return '';
        const feet = Math.floor(inches / 12);
        const remainingInches = inches % 12;
        return `${feet}'${remainingInches}"`;
      };
      
      // Helper to format weight with "lbs" suffix
      const formatWeightForDisplay = (weight: number | null | undefined): string => {
        if (!weight || weight === 0) return '';
        return `${weight} lbs`;
      };
      
      setCurrentPlayerData({
        name: data.identity.name || '',
        jerseyNumber: String(data.identity.jerseyNumber || ''),
        position: data.identity.position || '',
        height: formatHeightForDisplay(data.identity.height),
        weight: formatWeightForDisplay(data.identity.weight),
        age: data.identity.age || 0,
        team: data.identity.teamName || '',
        location: data.identity.location || '',
        profilePhoto: data.identity.profilePhotoUrl || '',
        posePhoto: data.identity.posePhotoUrl || '',
        seasonAverages: {
          rebounds: data.seasonAverages?.rebounds || 0,
          assists: data.seasonAverages?.assists || 0,
          fieldGoalPercent: data.seasonAverages?.fieldGoalPercent || 0
        },
        careerHigh: {
          points: data.careerHighs?.points || 0,
          rebounds: data.careerHighs?.rebounds || 0,
          assists: data.careerHighs?.assists || 0
        }
      });
    }
  }, [data.identity, data.careerHighs, data.seasonAverages]);

  // Helper function to check if data is meaningful (not null/empty/default)
  const hasValidData = (value: any, defaultCheck?: any) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && (value === '' || value === 'N/A' || value === 'Player Name')) return false;
    if (typeof value === 'number' && value === 0) return false;
    if (defaultCheck !== undefined && value === defaultCheck) return false;
    return true;
  };

  // Use real data when available and meaningful, otherwise show editable state
  const identityName = hasValidData(data.identity?.name) 
    ? data.identity!.name 
    : (currentPlayerData.name || "Click Edit Profile to add your name");
  const identityTeam = hasValidData(data.identity?.teamName) 
    ? data.identity!.teamName 
    : (currentPlayerData.team || "No Team");
  const jerseyNumber = hasValidData(data.identity?.jerseyNumber) 
    ? data.identity!.jerseyNumber 
    : (currentPlayerData.jerseyNumber || "--");
  const position = hasValidData(data.identity?.position) 
    ? data.identity!.position 
    : (currentPlayerData.position || "Position");
  // ✅ CRITICAL: Use currentPlayerData FIRST (most up-to-date after save), then fall back to data.identity
  const profilePhoto = currentPlayerData.profilePhoto || data.identity?.profilePhotoUrl || "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=400&fit=crop&crop=faces";
  const posePhoto = currentPlayerData.posePhoto || data.identity?.posePhotoUrl || "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=600&fit=crop&crop=faces";
  const age = (data.identity?.age !== undefined && data.identity?.age !== null && data.identity?.age > 0) 
    ? data.identity.age 
    : (currentPlayerData.age > 0 ? currentPlayerData.age : "--");
  const height = hasValidData(data.identity?.height) 
    ? data.identity!.height 
    : (currentPlayerData.height || "--");
  const weight = hasValidData(data.identity?.weight) 
    ? data.identity!.weight 
    : (currentPlayerData.weight || "--");
  const location = data.identity?.location || currentPlayerData.location || '';

  // Season averages with better fallback logic - show live data even if 0
  const seasonPts = (data.season?.pointsPerGame !== undefined && data.season?.pointsPerGame !== null) 
    ? data.season.pointsPerGame 
    : "--";
  const seasonReb = (data.season?.reboundsPerGame !== undefined && data.season?.reboundsPerGame !== null) 
    ? data.season.reboundsPerGame 
    : "--";
  const seasonAst = (data.season?.assistsPerGame !== undefined && data.season?.assistsPerGame !== null) 
    ? data.season.assistsPerGame 
    : "--";
  const seasonFg = (data.season?.fieldGoalPct !== undefined && data.season?.fieldGoalPct !== null) 
    ? `${data.season.fieldGoalPct}%`
    : "--";
  const season3Pt = (data.season?.threePointPct !== undefined && data.season?.threePointPct !== null) 
    ? `${data.season.threePointPct}%`
    : "--";
  const seasonFt = (data.season?.freeThrowPct !== undefined && data.season?.freeThrowPct !== null) 
    ? `${data.season.freeThrowPct}%`
    : "--";
  const seasonMin = (data.season?.minutesPerGame !== undefined && data.season?.minutesPerGame !== null) 
    ? data.season.minutesPerGame 
    : "--";

  // Career highs with better fallback logic - show live data even if 0
  const careerPts = (data.careerHighs?.points !== undefined && data.careerHighs?.points !== null) 
    ? data.careerHighs.points 
    : "--";
  const careerReb = (data.careerHighs?.rebounds !== undefined && data.careerHighs?.rebounds !== null) 
    ? data.careerHighs.rebounds 
    : "--";
  const careerAst = (data.careerHighs?.assists !== undefined && data.careerHighs?.assists !== null) 
    ? data.careerHighs.assists 
    : "--";

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-background to-red-50/30 text-foreground p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-primary font-bold">STATJAM</span>
          </div>
          
          {/* Notification Bell */}
          <NotificationBell items={data.notifications?.map(n => ({
            id: n.id,
            type: (n.type as any) || 'tournament',
            title: n.title,
            message: n.message,
            time: new Date(n.createdAt).toLocaleTimeString(),
            isRead: n.isRead,
            icon: undefined,
            priority: 'low'
          }))} />
        </div>

        {/* Navigation Tabs */}
        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-2 glass-card mb-8">
            <TabsTrigger value="dashboard" className="data-[state=active]:glass-card-accent data-[state=active]:text-primary">
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="personal-stats" 
              className="data-[state=active]:glass-card-accent data-[state=active]:text-primary"
            >
              <div className="flex items-center">
                <Trophy className="w-4 h-4 mr-2" />
                Personal Stats
              </div>
            </TabsTrigger>
            {/* AI Coaching - Temporarily Disabled */}
            {/* <TabsTrigger 
              value="ai-coaching" 
              className="data-[state=active]:glass-card-accent data-[state=active]:text-primary"
            >
              <div className="flex items-center">
                <Brain className="w-4 h-4 mr-2" />
                AI Coaching
                <Sparkles className="w-3 h-3 ml-1 text-primary" />
              </div>
            </TabsTrigger> */}
          </TabsList>

          {/* Dashboard Content */}
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Hero Section - Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Player Profile */}
                <Card className="bg-card border-border overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative min-h-[32rem] bg-gradient-to-br from-red-600 to-orange-600">
                      <div className="absolute inset-0 flex">
                        {/* Player Info */}
                        <div className="flex-[1.5] p-8">
                          <div className="mb-4">
                            <h1 className="text-4xl font-bold mb-2 text-white">{identityName}</h1>
                            <div className="flex items-center gap-3 text-orange-200 mb-2">
                              <span className="text-2xl">#{jerseyNumber}</span>
                              <span className="text-lg">•</span>
                              <span className="text-lg font-semibold">{position}</span>
                            </div>
                            <div className="flex items-center gap-2 text-orange-100">
                              <span>{height}{height !== '--' && !String(height).includes('"') && '"'}</span>
                              <span>•</span>
                              <span>{weight}{weight !== '--' && !String(weight).includes('lbs') && ' lbs'}</span>
                              <span>•</span>
                              <span>Age {age}</span>
                              {location && (
                                <>
                                  <span>•</span>
                                  <span>{getCountryName(location)}</span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="mb-6">
                            <p className="text-orange-100 mb-4">SEASON AVERAGES</p>
                            {loading ? (
                              <>
                                {/* ⚡ SKELETON: Loading state for season stats */}
                                <div className="flex gap-8 mb-6">
                                  <SkeletonStat size="large" />
                                  <SkeletonStat size="large" />
                                  <SkeletonStat size="large" />
                                </div>
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-2 h-2 bg-orange-300 rounded-full"></div>
                                  <p className="text-orange-200 text-sm font-medium uppercase tracking-wider">Shooting Efficiency</p>
                                </div>
                                <div className="grid grid-cols-4 gap-4">
                                  <div className="text-center space-y-2">
                                    <Skeleton className="h-7 w-16 mx-auto" />
                                    <Skeleton className="h-3 w-8 mx-auto" />
                                  </div>
                                  <div className="text-center space-y-2">
                                    <Skeleton className="h-7 w-16 mx-auto" />
                                    <Skeleton className="h-3 w-10 mx-auto" />
                                  </div>
                                  <div className="text-center space-y-2">
                                    <Skeleton className="h-7 w-16 mx-auto" />
                                    <Skeleton className="h-3 w-8 mx-auto" />
                                  </div>
                                  <div className="text-center space-y-2">
                                    <Skeleton className="h-7 w-12 mx-auto" />
                                    <Skeleton className="h-3 w-8 mx-auto" />
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                {/* Primary Stats Row */}
                                <div className="flex gap-8 mb-6">
                                  <div>
                                    <div className="text-3xl font-bold text-white">{seasonPts}</div>
                                    <div className="text-orange-200">Points</div>
                                  </div>
                                  <div>
                                    <div className="text-3xl font-bold text-white">{seasonReb}</div>
                                    <div className="text-orange-200">Rebounds</div>
                                  </div>
                                  <div>
                                    <div className="text-3xl font-bold text-white">{seasonAst}</div>
                                    <div className="text-orange-200">Assists</div>
                                  </div>
                                </div>
                                
                                {/* Shooting Efficiency - Integrated Below */}
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-2 h-2 bg-orange-300 rounded-full"></div>
                                  <p className="text-orange-200 text-sm font-medium uppercase tracking-wider">Shooting Efficiency</p>
                                </div>
                                <div className="grid grid-cols-4 gap-4">
                                  <div className="text-center">
                                    <div className="text-xl font-bold text-white">{seasonFg}</div>
                                    <div className="text-orange-300 text-xs">FG%</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-xl font-bold text-white">{season3Pt}</div>
                                    <div className="text-orange-300 text-xs">3PT%</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-xl font-bold text-white">{seasonFt}</div>
                                    <div className="text-orange-300 text-xs">FT%</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-xl font-bold text-white">{seasonMin}</div>
                                    <div className="text-orange-300 text-xs">MPG</div>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-3 mt-4">
                            <Button 
                              className="bg-white/30 text-white/50 px-6 py-3 border-0 cursor-not-allowed hover:bg-white/30"
                              disabled
                              title="NBA Card Generator - Coming Soon"
                            >
                              <Sparkles className="w-4 h-4 mr-2 opacity-50" />
                              GENERATE MY NBA CARD
                              <Badge variant="secondary" className="ml-2 bg-white/20 text-white/70 text-xs">Coming Soon</Badge>
                            </Button>
                            <Button 
                              variant="outline" 
                              className="border-white/30 bg-white/10 hover:bg-white/20 text-white hover:text-white px-6 py-3"
                              onClick={handleEditProfile}
                            >
                              <Edit3 className="w-4 h-4 mr-2" />
                              EDIT PROFILE
                            </Button>
                          </div>
                        </div>

                        {/* Player Image */}
                        <div className="flex-[0.7] relative">
                          <ImageWithFallback 
                            key={posePhoto} // Force remount on URL change (bypass browser cache)
                            src={posePhoto}
                            alt={currentPlayerData.name}
                            className="absolute right-0 top-0 h-full w-auto object-cover object-top"
                          />
                          {/* Team Badge - Only show if team exists */}
                          {hasValidData(identityTeam) && identityTeam !== "No Team" && (
                            <div className="absolute top-4 right-4 bg-black/30 rounded px-3 py-1">
                              <span className="text-orange-200 font-bold">{String(identityTeam).toUpperCase()}</span>
                            </div>
                          )}
                          {/* Jersey Number Overlay */}
                          <div className="absolute bottom-4 right-4 text-6xl font-bold text-white opacity-50">
                            #{jerseyNumber}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* StatJam Social Footer */}
                <SocialFooter />

                {/* Performance Chart - Glass Effect */}
                <Card className="glass-card-light relative overflow-hidden">
                  {/* Glass effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-red-500/5 pointer-events-none" />
                  <div className="relative">
                    <CardHeader>
                      <CardTitle className="text-foreground flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent font-bold">
                          PERFORMANCE ANALYTICS
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Performance Stats Row */}
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 relative overflow-hidden rounded-lg glass-card-accent border-2 border-primary/30 shadow-xl">
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-chart-2/10" />
                          <div className="relative">
                            <div className="text-2xl font-bold text-primary">
                              {data.kpis?.trendVsLastMonthPercent !== undefined && data.kpis?.trendVsLastMonthPercent !== null
                                ? `${data.kpis.trendVsLastMonthPercent > 0 ? '+' : ''}${data.kpis.trendVsLastMonthPercent}%`
                                : '--'
                              }
                            </div>
                            <div className="text-sm font-medium text-chart-1">vs Last Month</div>
                          </div>
                        </div>
                        <div className="text-center p-4 relative overflow-hidden rounded-lg glass-card-light border-2 border-chart-2/40 shadow-xl">
                          <div className="absolute inset-0 bg-gradient-to-br from-chart-2/20 to-chart-3/15" />
                          <div className="relative">
                            <div className="text-2xl font-bold text-chart-1">
                              {data.kpis?.seasonHighPoints !== undefined && data.kpis?.seasonHighPoints !== null
                                ? data.kpis.seasonHighPoints
                                : '--'
                              }
                            </div>
                            <div className="text-sm font-medium text-chart-2">Season High</div>
                          </div>
                        </div>
                        <div className="text-center p-4 relative overflow-hidden rounded-lg glass-card border-2 border-foreground/20 shadow-xl">
                          <div className="absolute inset-0 bg-gradient-to-br from-foreground/10 to-primary/5" />
                          <div className="relative">
                            <div className="text-2xl font-bold text-foreground">
                              {data.kpis?.overallRating !== undefined && data.kpis?.overallRating !== null
                                ? data.kpis.overallRating
                                : '--'
                              }
                            </div>
                            <div className="text-sm font-medium text-muted-foreground">Overall Rating</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Chart */}
                      <PerformanceChart 
                        series={
                          data.series && data.series.length > 0 
                            ? data.series.map(s => ({
                                date: s.date,
                                points: s.points || 0,
                                rebounds: s.rebounds || 0,
                                assists: s.assists || 0,
                                fieldGoal: s.fgm && s.fga ? (s.fga ? (s.fgm / s.fga) * 100 : 0) : 0,
                                threePoint: s.threePm && s.threePa ? (s.threePa ? (s.threePm / s.threePa) * 100 : 0) : 0,
                                freeThrow: s.ftm && s.fta ? (s.fta ? (s.ftm / s.fta) * 100 : 0) : 0,
                                fgm: s.fgm || 0,
                                fga: s.fga || 0,
                                threePm: s.threePm || 0,
                                threePa: s.threePa || 0,
                                ftm: s.ftm || 0,
                                fta: s.fta || 0,
                                month: s.date
                              }))
                            : [] // Empty array for new users
                        }
                        seasonAverages={data.season}
                      />
                    </CardContent>
                  </div>
                </Card>

                {/* Game Stats Table - NBA Box Score */}
                {user?.premium_status ? (
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="text-card-foreground flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        My Stats
                        <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">Premium</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <GameStatsTable userId={user.id} />
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="text-card-foreground flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        My Stats
                        <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800">Premium</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center py-12">
                      <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
                      <p className="text-muted-foreground mb-4">
                        Detailed game statistics and analytics are available with Premium access.
                      </p>
                      <Button 
                        variant="outline" 
                        disabled
                        className="cursor-not-allowed opacity-60"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Upgrade to Premium
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Premium Features (Phase 1: hidden) */}

                {/* Social Highlights (Phase 1: hidden) */}
                <Card className="hidden">
                  <CardHeader>
                    <CardTitle className="text-card-foreground flex items-center gap-2">
                      <Play className="w-5 h-5 text-primary" />
                      Social Highlights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative h-48 bg-muted rounded-lg overflow-hidden">
                      <ImageWithFallback 
                        src="https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=600&h=300&fit=crop"
                        alt="Game highlight"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Button className="glass-card rounded-full p-4">
                          <Play className="w-8 h-8 text-white" />
                        </Button>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <div className="glass-card rounded-lg p-3">
                          <p className="text-white text-sm font-medium">Amazing dunk vs Eagles</p>
                          <p className="text-white/70 text-xs">2.3K views • 2 days ago</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* My Tournaments */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-card-foreground flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      My Tournaments
                      <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">Coming Soon</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center py-12">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
                    <p className="text-muted-foreground mb-4">
                      Tournament registration and management features are coming soon.
                    </p>
                    <Button 
                      variant="outline" 
                      disabled
                      className="cursor-not-allowed opacity-60"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      View Tournaments
                    </Button>
                  </CardContent>
                </Card>
                {/* Hidden original tournament content */}
                <div className="hidden">
                  <CardContent className="space-y-4">
                    {data.upcomingGames && data.upcomingGames.length > 0 ? (
                      data.upcomingGames.map((game, index) => (
                        <TournamentCard key={index} game={{
                          opponent: game.opponentTeamName || 'Unknown Team',
                          time: new Date(game.scheduledAt || '').toLocaleString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          }),
                          isUpcoming: game.status === 'scheduled'
                        }} />
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <p className="text-muted-foreground text-sm">No upcoming games scheduled</p>
                        <p className="text-muted-foreground text-xs mt-1">Games will appear here when you join a team</p>
                      </div>
                    )}
                  </CardContent>
                </div>
                {/* End hidden tournament content */}

                {/* Achievements */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-card-foreground flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-primary" />
                      Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.achievements && data.achievements.length > 0 ? (
                      <div className="flex gap-4">
                        {data.achievements.slice(0,3).map((achievement, index) => (
                          <AchievementBadge key={achievement.id || index} achievement={{
                            type: (achievement.type as any) ?? 'locked',
                            value: (achievement.value as any) ?? '?',
                            label: achievement.label ?? 'ACHIEVEMENT'
                          }} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <p className="text-muted-foreground text-sm">No achievements unlocked yet</p>
                        <p className="text-muted-foreground text-xs mt-1">Play games to earn achievements</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Career Stats */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-card-foreground flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Career Highs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {loading ? (
                      <>
                        {/* ⚡ SKELETON: Loading state for career highs */}
                        <div className="flex justify-between items-center p-3 glass-card rounded-lg">
                          <span className="text-muted-foreground">Points</span>
                          <Skeleton className="h-6 w-12" />
                        </div>
                        <div className="flex justify-between items-center p-3 glass-card rounded-lg">
                          <span className="text-muted-foreground">Rebounds</span>
                          <Skeleton className="h-6 w-12" />
                        </div>
                        <div className="flex justify-between items-center p-3 glass-card rounded-lg">
                          <span className="text-muted-foreground">Assists</span>
                          <Skeleton className="h-6 w-12" />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between items-center p-3 glass-card rounded-lg">
                          <span className="text-muted-foreground">Points</span>
                          <span className="text-card-foreground font-bold text-lg">{careerPts}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 glass-card rounded-lg">
                          <span className="text-muted-foreground">Rebounds</span>
                          <span className="text-card-foreground font-bold text-lg">{careerReb}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 glass-card rounded-lg">
                          <span className="text-muted-foreground">Assists</span>
                          <span className="text-card-foreground font-bold text-lg">{careerAst}</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Personal Stats Content */}
          <TabsContent value="personal-stats">
            <PersonalStatTracker />
          </TabsContent>

          {/* AI Coaching Content - Temporarily Disabled */}
          {/* <TabsContent value="ai-coaching">
            <AICoaching playerName={currentPlayerData.name} playerData={currentPlayerData} />
          </TabsContent> */}
        </Tabs>
      </div>
      
      {/* Subscription Modal */}
      <SubscriptionModal 
        isOpen={isSubscriptionModalOpen} 
        onClose={() => setIsSubscriptionModalOpen(false)}
        onUpgrade={handleSubscriptionClose}
      />
      
      {/* Edit Profile Modal */}
      <EditProfileModal 
        isOpen={isEditProfileModalOpen} 
        onClose={() => setIsEditProfileModalOpen(false)} 
        onSave={handleSaveProfile} 
        playerData={currentPlayerData} 
      />
    </div>
  );
}