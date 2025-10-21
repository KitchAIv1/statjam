import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { TrendingUp, Video, User, Trophy } from "lucide-react";

export function PlayerPremiumSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
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
        <div className="mt-16 pt-16 border-t border-gray-200">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold mb-6">
              <span className="animate-pulse">●</span>
              Coming Soon
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Solo Stat Tracking
            </h3>
            <p className="text-lg sm:text-xl text-gray-600 mb-4 leading-relaxed">
              Record your own pickup games, practices, or scrimmages — no team or tournament needed.
            </p>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
              Use the same pro-grade controls to log your stats, improve your performance, and own your journey.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}