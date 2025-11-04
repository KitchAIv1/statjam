import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { TrendingUp, Video, User, Trophy, Zap, Target, BarChart3, Clock } from "lucide-react";

export function PlayerPremiumSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left side - Player mockup */}
          <div className="relative">
            <div className="relative">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=1740&auto=format&fit=crop"
                alt="Amateur basketball player in action"
                className="w-full h-[600px] object-cover rounded-2xl shadow-2xl"
              />
              
              {/* Overlay stats UI */}
              <div className="absolute top-6 right-6 space-y-4">
                <Card className="p-4 bg-white/95 backdrop-blur-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Points</span>
                      <span className="font-bold text-xl text-orange-500">24</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Assists</span>
                      <span className="font-bold text-xl">7</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Rebounds</span>
                      <span className="font-bold text-xl">5</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">FG%</span>
                      <span className="font-bold text-xl text-green-500">67%</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-3 bg-white/95 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-red-500" />
                    <span className="text-sm">Highlight Reel</span>
                    <Badge variant="secondary" className="text-xs">3 clips</Badge>
                  </div>
                </Card>
              </div>

              <div className="absolute bottom-6 left-6 right-6">
                <Card className="p-4 bg-white/95 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold">Marcus Johnson</p>
                      <p className="text-sm text-muted-foreground">Forward • 6'8"</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>

          {/* Right side - Content */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">Turn Your Game Into Your Brand</h2>
              <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8 leading-relaxed">
                With Player Premium, every game you play gets tracked like the pros — real-time stats, automatic highlight reels, and a career profile that tells your story.
              </p>
              <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 leading-relaxed">
                Whether it's your school league, streetball run, or local tournament — every play counts.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Pro-Grade Stat Tracking</h3>
                  <p className="text-muted-foreground">Every shot, assist, and rebound logged live with professional accuracy.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Video className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">AI Highlight Reels</h3>
                  <p className="text-muted-foreground">Your best moments captured automatically — no editing needed.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Career Profile & History</h3>
                  <p className="text-muted-foreground">Showcase your growth, season after season.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Performance Badges</h3>
                  <p className="text-muted-foreground">Earn recognition for clutch plays and tournament achievements.</p>
                </div>
              </div>
            </div>

            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg">
              <span className="hidden sm:inline">Upgrade to Player Premium — Start Building Your Legacy</span>
              <span className="sm:hidden">Upgrade to Player Premium</span>
            </Button>

            <div className="pt-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold">For players:</span> Your game, tracked like you're in the league.
                <br />
                <span className="font-semibold">For fans:</span> Watch the action live, with every play at your fingertips.
              </p>
            </div>
          </div>
        </div>

        {/* Coming Soon: Solo Stat Tracking */}
        <div className="mt-16">
          <Card className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-orange-50 border-2 border-orange-200/50 shadow-xl">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-4 left-4 w-24 h-24 bg-orange-500 rounded-full blur-2xl"></div>
              <div className="absolute bottom-4 right-4 w-20 h-20 bg-orange-400 rounded-full blur-xl"></div>
            </div>
            
            <div className="relative p-6 sm:p-8">
              {/* Main Content */}
              <div className="text-center max-w-3xl mx-auto">
                <div className="flex justify-center items-center gap-3 mb-4 relative">
                  <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    Solo Stat Tracking
                  </h3>
                  {/* Coming Soon Badge - positioned on the right */}
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full text-xs font-bold shadow-lg">
                      <Clock className="w-3 h-3 animate-spin" />
                      Coming Soon
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
                
                <p className="text-lg sm:text-xl text-gray-700 mb-6 leading-relaxed">
                  Record your own pickup games, practices, or scrimmages — no team or tournament needed.
                  Use the same pro-grade controls to log your stats, improve your performance, and own your journey.
                </p>

                {/* Feature Preview Cards */}
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-orange-100 shadow-sm">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Zap className="w-5 h-5 text-orange-500" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm">Quick Setup</h4>
                    <p className="text-xs text-gray-600">Start tracking in seconds, anywhere you play</p>
                  </div>
                  
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-orange-100 shadow-sm">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <BarChart3 className="w-5 h-5 text-orange-500" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm">Personal Analytics</h4>
                    <p className="text-xs text-gray-600">Track your improvement over time</p>
                  </div>
                  
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-orange-100 shadow-sm">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Trophy className="w-5 h-5 text-orange-500" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm">Achievement Goals</h4>
                    <p className="text-xs text-gray-600">Set and reach personal milestones</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}