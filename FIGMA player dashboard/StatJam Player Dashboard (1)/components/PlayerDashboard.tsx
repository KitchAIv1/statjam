"use client";

import { useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { PerformanceChart } from "./PerformanceChart";
import { TournamentCard } from "./TournamentCard";
import { AchievementBadge } from "./AchievementBadge";
import { PremiumCards } from "./PremiumCards";
import { AICoaching } from "./AICoaching";
import { SubscriptionModal } from "./SubscriptionModal";
import { EditProfileModal } from "./EditProfileModal";
import { NotificationBell } from "./NotificationBell";
import { Play, Trophy, Star, Calendar, BarChart3, TrendingUp, Brain, Sparkles, Edit3 } from "lucide-react";

const playerData = {
  name: "Andre Simpson",
  jerseyNumber: "34",
  position: "Power Forward",
  height: "6'8\"",
  weight: "235 lbs",
  age: 24,
  team: "Central",
  profilePhoto: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=400&fit=crop&crop=faces",
  posePhoto: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=600&fit=crop&crop=faces",
  seasonAverages: {
    rebounds: 23.4,
    assists: 5.2,
    fieldGoalPercent: 48.5
  },
  careerHigh: {
    points: 82,
    rebounds: 20,
    assists: 15
  }
};

const upcomingGames = [
  {
    opponent: "Eagles",
    opponentLogo: "🦅",
    time: "02:15:24",
    isUpcoming: true
  },
  {
    opponent: "Wildcats", 
    opponentLogo: "🐱",
    time: "Tomorrow 7:30 PM",
    isUpcoming: true
  }
];

const achievements = [
  { type: "rebounds", value: 10, label: "REB" },
  { type: "points", value: 30, label: "PTS" },
  { type: "locked", value: "?", label: "LOCKED" }
];

export function PlayerDashboard() {
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [currentPlayerData, setCurrentPlayerData] = useState(playerData);
  const [currentTab, setCurrentTab] = useState("dashboard");

  const handlePremiumFeatureClick = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setIsSubscriptionModalOpen(true);
  };

  const handleEditProfile = () => {
    setIsEditProfileModalOpen(true);
  };

  const handleSaveProfile = (updatedData: typeof playerData) => {
    setCurrentPlayerData(updatedData);
  };

  const handleTabChange = (value: string) => {
    if (value === "ai-coaching") {
      handlePremiumFeatureClick();
      return;
    }
    setCurrentTab(value);
  };

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
          <NotificationBell />
        </div>

        {/* Navigation Tabs */}
        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 glass-card mb-8">
            <TabsTrigger value="dashboard" className="data-[state=active]:glass-card-accent data-[state=active]:text-primary">
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="ai-coaching" 
              className="data-[state=active]:glass-card-accent data-[state=active]:text-primary"
            >
              <div className="flex items-center">
                <Brain className="w-4 h-4 mr-2" />
                AI Coaching
                <Sparkles className="w-3 h-3 ml-1 text-primary" />
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Content */}
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Hero Section - Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Player Profile */}
                <Card className="bg-card border-border overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative h-96 bg-gradient-to-br from-red-600 to-orange-600">
                      <div className="absolute inset-0 flex">
                        {/* Player Info */}
                        <div className="flex-1 p-8">
                          <div className="mb-4">
                            <h1 className="text-4xl font-bold mb-2 text-white">{currentPlayerData.name}</h1>
                            <div className="flex items-center gap-3 text-orange-200 mb-2">
                              <span className="text-2xl">#{currentPlayerData.jerseyNumber}</span>
                              <span className="text-lg">•</span>
                              <span className="text-lg font-semibold">{currentPlayerData.position}</span>
                            </div>
                            <div className="flex items-center gap-2 text-orange-100">
                              <span>{currentPlayerData.height}</span>
                              <span>•</span>
                              <span>{currentPlayerData.weight}</span>
                              <span>•</span>
                              <span>Age {currentPlayerData.age}</span>
                            </div>
                          </div>
                          
                          <div className="mb-6">
                            <p className="text-orange-100 mb-4">SEASON AVERAGES</p>
                            <div className="flex gap-8">
                              <div>
                                <div className="text-3xl font-bold text-white">{currentPlayerData.seasonAverages.rebounds}</div>
                                <div className="text-orange-200">Rebounds</div>
                              </div>
                              <div>
                                <div className="text-3xl font-bold text-white">{currentPlayerData.seasonAverages.assists}</div>
                                <div className="text-orange-200">Assists</div>
                              </div>
                              <div>
                                <div className="text-3xl font-bold text-white">{currentPlayerData.seasonAverages.fieldGoalPercent}%</div>
                                <div className="text-orange-200">FG%</div>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <Button 
                              className="bg-white hover:bg-orange-50 text-red-600 px-6 py-3 border-0"
                              onClick={handlePremiumFeatureClick}
                            >
                              GENERATE MY NBA CARD
                            </Button>
                            <Button 
                              variant="outline" 
                              className="border-white/20 bg-white/10 hover:bg-white/20 text-white hover:text-white px-4 py-3"
                              onClick={handleEditProfile}
                            >
                              <Edit3 className="w-4 h-4 mr-2" />
                              EDIT PROFILE
                            </Button>
                          </div>
                        </div>

                        {/* Player Image */}
                        <div className="flex-1 relative">
                          <ImageWithFallback 
                            src={currentPlayerData.posePhoto}
                            alt={currentPlayerData.name}
                            className="absolute right-0 top-0 h-full w-auto object-cover"
                          />
                          <div className="absolute top-4 right-4 bg-black/30 rounded px-3 py-1">
                            <span className="text-orange-200 font-bold">{currentPlayerData.team.toUpperCase()}</span>
                          </div>
                          <div className="absolute bottom-4 right-4 text-6xl font-bold text-white opacity-50">
                            {currentPlayerData.age}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

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
                            <div className="text-2xl font-bold text-primary">+12%</div>
                            <div className="text-sm font-medium text-chart-1">vs Last Month</div>
                          </div>
                        </div>
                        <div className="text-center p-4 relative overflow-hidden rounded-lg glass-card-light border-2 border-chart-2/40 shadow-xl">
                          <div className="absolute inset-0 bg-gradient-to-br from-chart-2/20 to-chart-3/15" />
                          <div className="relative">
                            <div className="text-2xl font-bold text-chart-1">30</div>
                            <div className="text-sm font-medium text-chart-2">Season High</div>
                          </div>
                        </div>
                        <div className="text-center p-4 relative overflow-hidden rounded-lg glass-card border-2 border-foreground/20 shadow-xl">
                          <div className="absolute inset-0 bg-gradient-to-br from-foreground/10 to-primary/5" />
                          <div className="relative">
                            <div className="text-2xl font-bold text-foreground">94</div>
                            <div className="text-sm font-medium text-muted-foreground">Overall Rating</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Chart */}
                      <PerformanceChart />
                    </CardContent>
                  </div>
                </Card>

                {/* Premium Features */}
                <Card className="glass-card-accent relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-orange-500/5 pointer-events-none" />
                  <div className="relative">
                    <CardHeader>
                      <CardTitle className="text-card-foreground flex items-center gap-2">
                        <Star className="w-5 h-5 text-primary" />
                        <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent font-bold">
                          PREMIUM FEATURE
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <PremiumCards playerName={currentPlayerData.name} onPremiumClick={handlePremiumFeatureClick} />
                    </CardContent>
                  </div>
                </Card>

                {/* Social Highlights */}
                <Card className="glass-card">
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
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {upcomingGames.map((game, index) => (
                      <TournamentCard key={index} game={game} />
                    ))}
                  </CardContent>
                </Card>

                {/* Achievements */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-card-foreground flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-primary" />
                      Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      {achievements.map((achievement, index) => (
                        <AchievementBadge key={index} achievement={achievement} />
                      ))}
                    </div>
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
                    <div className="flex justify-between items-center p-3 glass-card rounded-lg">
                      <span className="text-muted-foreground">Points</span>
                      <span className="text-card-foreground font-bold text-lg">{currentPlayerData.careerHigh.points}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 glass-card rounded-lg">
                      <span className="text-muted-foreground">Rebounds</span>
                      <span className="text-card-foreground font-bold text-lg">{currentPlayerData.careerHigh.rebounds}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 glass-card rounded-lg">
                      <span className="text-muted-foreground">Assists</span>
                      <span className="text-card-foreground font-bold text-lg">{currentPlayerData.careerHigh.assists}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* AI Coaching Content */}
          <TabsContent value="ai-coaching">
            <AICoaching playerName={currentPlayerData.name} playerData={currentPlayerData} />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Subscription Modal */}
      <SubscriptionModal 
        isOpen={isSubscriptionModalOpen} 
        onClose={() => setIsSubscriptionModalOpen(false)} 
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