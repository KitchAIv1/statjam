import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
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
              <h2 className="text-4xl font-bold mb-6">Turn Your Game Into Your Brand</h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                With Player Premium, every game you play gets tracked like the pros — real-time stats, personal highlight reels, and a shareable profile that gets you noticed.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Pro-style live stat tracking</h3>
                  <p className="text-muted-foreground">Every shot, pass, and defensive play tracked in real-time with professional accuracy.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Video className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Automated highlight reels</h3>
                  <p className="text-muted-foreground">AI-powered highlight creation captures your best moments automatically.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Public player profile & career history</h3>
                  <p className="text-muted-foreground">Showcase your growth with detailed career stats and game history.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Tournament performance badges</h3>
                  <p className="text-muted-foreground">Earn recognition for clutch performances and tournament achievements.</p>
                </div>
              </div>
            </div>

            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4">
              Upgrade to Player Premium
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
      </div>
    </section>
  );
}