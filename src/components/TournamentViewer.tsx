import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/avatar";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { 
  Heart, 
  MessageCircle, 
  Share, 
  TrendingDown,
  TrendingUp,
  Eye,
  Clock,
  Trophy,
  Users,
  ArrowLeft
} from "lucide-react";

interface TournamentViewerProps {
  onBack?: () => void;
}

export function TournamentViewer({ onBack }: TournamentViewerProps) {
  const [activeTab, setActiveTab] = useState("feed");

  // Mock game data
  const gameData = {
    teams: [
      {
        name: "Kings",
        city: "Sacramento", 
        score: 78,
        logo: "👑",
        color: "bg-purple-600"
      },
      {
        name: "Hornets",
        city: "Charlotte",
        score: 83, 
        logo: "🐝",
        color: "bg-teal-600"
      }
    ],
    status: "Final",
    date: "Jul 20, 2025",
    quarter: "End of 4th",
    viewers: "39.4k",
    trending: "5.3"
  };

  // Mock feed data
  const feedData = [
    {
      id: 1,
      quarter: "Q4",
      time: "1.0",
      timeAgo: "15d",
      player: {
        name: "D. Carter",
        photo: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=150",
        stats: "5/16"
      },
      event: "Missed 47' half-courter",
      details: [
        "3-straight missed FG",
        "4-straight missed threes"
      ],
      reactions: {
        likes: 427,
        comments: 170,
        trending: -7.7
      },
      teamLogo: "👑",
      teamScore: "78-83"
    },
    {
      id: 2,
      quarter: "Q4", 
      time: "0.0",
      timeAgo: "15d",
      player: {
        name: "D. Carter",
        photo: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=150",
        stats: "5/16"
      },
      event: "Missed 47' half-courter",
      details: [
        "3-straight missed FG",
        "4-straight missed threes"
      ],
      reactions: {
        likes: 2200,
        comments: 198,
        trending: -8.2
      },
      teamLogo: "👑",
      teamScore: "78-83",
      subtitle: "FIRST AND ONLY TROPHY IN FRANCHI..."
    },
    {
      id: 3,
      quarter: "Q4",
      time: "3.5", 
      timeAgo: "15d",
      player: {
        name: "R. Kalkbrenner",
        photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
        stats: "15 pt",
        secondary: "M. Raynaud • 2 foul"
      },
      event: "2/2 free throws",
      teamLogo: "👑",
      teamScore: "78-83",
      reactions: {
        likes: 0,
        comments: 0,
        trending: 5.6
      },
      badge: "RK"
    }
  ];

  // Mock team stats
  const teamStats = {
    kings: {
      fg: "32/85 (37.6%)",
      threePt: "8/32 (25.0%)", 
      ft: "6/8 (75.0%)",
      rebounds: "42",
      assists: "18",
      steals: "7",
      blocks: "4",
      turnovers: "15"
    },
    hornets: {
      fg: "35/82 (42.7%)",
      threePt: "11/28 (39.3%)",
      ft: "2/4 (50.0%)", 
      rebounds: "38",
      assists: "22",
      steals: "9",
      blocks: "6",
      turnovers: "12"
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation Bar */}
      {onBack && (
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="text-white hover:bg-gray-700 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Landing
          </Button>
        </div>
      )}
      
      {/* Game Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Teams and Score */}
          <div className="flex items-center justify-between mb-4">
            {/* Team 1 */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center text-2xl">
                {gameData.teams[0].logo}
              </div>
              <div>
                <div className="text-2xl font-bold">{gameData.teams[0].score}</div>
                <div className="text-gray-300">{gameData.teams[0].name}</div>
              </div>
            </div>

            {/* Game Status */}
            <div className="text-center">
              <div className="text-xl font-bold mb-1">{gameData.status}</div>
              <div className="text-gray-400">{gameData.date}</div>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {gameData.viewers}
                </div>
                <div className="flex items-center gap-1">
                  <TrendingDown className="w-4 h-4" />
                  {gameData.trending}
                </div>
              </div>
            </div>

            {/* Team 2 */}
            <div className="flex items-center gap-4">
              <div>
                <div className="text-2xl font-bold text-right">{gameData.teams[1].score}</div>
                <div className="text-gray-300 text-right">{gameData.teams[1].name}</div>
              </div>
              <div className="w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center text-2xl">
                {gameData.teams[1].logo}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-4xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-gray-800 border-b border-gray-700 rounded-none h-auto p-0">
            <TabsTrigger 
              value="feed" 
              className="flex-1 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-400 rounded-none py-4 text-white"
            >
              Feed
            </TabsTrigger>
            <TabsTrigger 
              value="game"
              className="flex-1 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-400 rounded-none py-4 text-white"
            >
              Game
            </TabsTrigger>
            <TabsTrigger 
              value="sac"
              className="flex-1 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-400 rounded-none py-4 text-white"
            >
              SAC
            </TabsTrigger>
            <TabsTrigger 
              value="cha"
              className="flex-1 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-400 rounded-none py-4 text-white"
            >
              CHA
            </TabsTrigger>
          </TabsList>

          {/* Game Status Bar */}
          <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
            <div className="text-center text-gray-300">
              {gameData.quarter} • {gameData.teams[0].score}-{gameData.teams[1].score}
            </div>
          </div>

          {/* Feed Tab */}
          <TabsContent value="feed" className="mt-0">
            <div className="bg-gray-900 min-h-screen">
              {feedData.map((item) => (
                <div key={item.id} className="border-b border-gray-800 p-4">
                  <div className="flex gap-4">
                    {/* Team Logo & Score */}
                    <div className="flex flex-col items-center gap-2 min-w-[80px]">
                      <div className="text-2xl">{item.teamLogo}</div>
                      <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                        {item.teamScore}
                      </Badge>
                      <div className="text-xs text-gray-400">
                        {item.quarter} {item.time} • {item.timeAgo}
                      </div>
                      {item.reactions.trending !== 0 && (
                        <div className={`flex items-center gap-1 text-xs ${item.reactions.trending > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {item.reactions.trending > 0 ? 
                            <TrendingUp className="w-3 h-3" /> : 
                            <TrendingDown className="w-3 h-3" />
                          }
                          {Math.abs(item.reactions.trending)}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      {/* Player Info */}
                      <div className="flex items-center gap-3 mb-2">
                        {item.badge ? (
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                            {item.badge}
                          </div>
                        ) : (
                          <Avatar className="w-10 h-10">
                            <ImageWithFallback
                              src={item.player.photo}
                              alt={item.player.name}
                              className="w-full h-full object-cover"
                            />
                          </Avatar>
                        )}
                        <div>
                          <div className="font-semibold">{item.player.name} • {item.player.stats}</div>
                          {item.player.secondary && (
                            <div className="text-sm text-gray-400">{item.player.secondary}</div>
                          )}
                        </div>
                      </div>

                      {/* Event */}
                      <div className="mb-2">
                        <div className="text-lg font-semibold mb-1">{item.event}</div>
                        {item.details && (
                          <div className="space-y-1">
                            {item.details.map((detail, index) => (
                              <div key={index} className="flex items-center gap-2 text-gray-300">
                                <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                                <span>{detail}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {item.subtitle && (
                          <div className="text-gray-400 text-sm mt-2">{item.subtitle}</div>
                        )}
                      </div>

                      {/* Reactions */}
                      <div className="flex items-center gap-6 text-gray-400">
                        <button className="flex items-center gap-2 hover:text-red-400 transition-colors">
                          <Heart className="w-4 h-4" />
                          <span>{item.reactions.likes}</span>
                        </button>
                        <button className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                          <MessageCircle className="w-4 h-4" />
                          <span>{item.reactions.comments}</span>
                        </button>
                        <button className="flex items-center gap-2 hover:text-green-400 transition-colors">
                          <Share className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Load More */}
              <div className="p-4 text-center">
                <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                  Load More Plays
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Game Tab */}
          <TabsContent value="game" className="mt-0 bg-gray-900 min-h-screen p-4">
            <div className="max-w-2xl mx-auto space-y-6">
              <Card className="bg-gray-800 border-gray-700 p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Game Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-gray-300">Quarter Scores:</div>
                  <div className="text-white">18-22, 20-19, 22-24, 18-18</div>
                  <div className="text-gray-300">Lead Changes:</div>
                  <div className="text-white">8</div>
                  <div className="text-gray-300">Largest Lead:</div>
                  <div className="text-white">Hornets by 12</div>
                  <div className="text-gray-300">Time of Possession:</div>
                  <div className="text-white">Kings 24:15, Hornets 23:45</div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* SAC Team Stats */}
          <TabsContent value="sac" className="mt-0 bg-gray-900 min-h-screen p-4">
            <div className="max-w-2xl mx-auto space-y-6">
              <Card className="bg-gray-800 border-gray-700 p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
                  <span className="text-2xl">👑</span>
                  Sacramento Kings Stats
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-gray-300">Field Goals:</div>
                  <div className="text-white">{teamStats.kings.fg}</div>
                  <div className="text-gray-300">3-Pointers:</div>
                  <div className="text-white">{teamStats.kings.threePt}</div>
                  <div className="text-gray-300">Free Throws:</div>
                  <div className="text-white">{teamStats.kings.ft}</div>
                  <div className="text-gray-300">Rebounds:</div>
                  <div className="text-white">{teamStats.kings.rebounds}</div>
                  <div className="text-gray-300">Assists:</div>
                  <div className="text-white">{teamStats.kings.assists}</div>
                  <div className="text-gray-300">Steals:</div>
                  <div className="text-white">{teamStats.kings.steals}</div>
                  <div className="text-gray-300">Blocks:</div>
                  <div className="text-white">{teamStats.kings.blocks}</div>
                  <div className="text-gray-300">Turnovers:</div>
                  <div className="text-white">{teamStats.kings.turnovers}</div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* CHA Team Stats */}
          <TabsContent value="cha" className="mt-0 bg-gray-900 min-h-screen p-4">
            <div className="max-w-2xl mx-auto space-y-6">
              <Card className="bg-gray-800 border-gray-700 p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
                  <span className="text-2xl">🐝</span>
                  Charlotte Hornets Stats
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-gray-300">Field Goals:</div>
                  <div className="text-white">{teamStats.hornets.fg}</div>
                  <div className="text-gray-300">3-Pointers:</div>
                  <div className="text-white">{teamStats.hornets.threePt}</div>
                  <div className="text-gray-300">Free Throws:</div>
                  <div className="text-white">{teamStats.hornets.ft}</div>
                  <div className="text-gray-300">Rebounds:</div>
                  <div className="text-white">{teamStats.hornets.rebounds}</div>
                  <div className="text-gray-300">Assists:</div>
                  <div className="text-white">{teamStats.hornets.assists}</div>
                  <div className="text-gray-300">Steals:</div>
                  <div className="text-white">{teamStats.hornets.steals}</div>
                  <div className="text-gray-300">Blocks:</div>
                  <div className="text-white">{teamStats.hornets.blocks}</div>
                  <div className="text-gray-300">Turnovers:</div>
                  <div className="text-white">{teamStats.hornets.turnovers}</div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}