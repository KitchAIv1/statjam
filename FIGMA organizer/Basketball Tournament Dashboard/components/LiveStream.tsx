import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Play, Video, Users, Calendar, Bell } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function LiveStream() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2>Live Stream</h2>
          <p className="text-muted-foreground">Broadcast your tournaments to the world</p>
        </div>
        <Badge variant="secondary" className="gap-2">
          <Calendar className="w-3 h-3" />
          Coming Soon
        </Badge>
      </div>

      {/* Hero Section */}
      <Card className="overflow-hidden">
        <div className="relative">
          <div className="aspect-video bg-gradient-to-br from-primary/20 via-accent/30 to-orange-200 dark:from-primary/10 dark:via-accent/20 dark:to-orange-900/20 flex items-center justify-center">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=800&h=450&fit=crop&crop=center"
              alt="Basketball live streaming setup with camera and court"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                  <Play className="w-8 h-8 text-white ml-1" />
                </div>
                <div className="text-white">
                  <h3 className="text-2xl font-semibold mb-2">Stream Your Games Live</h3>
                  <p className="text-white/90 max-w-md">Professional live streaming capabilities coming to StatJam</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Feature Preview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-border/50 hover:border-primary/20">
          <CardHeader className="relative bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-950/30">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Video className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-lg group-hover:text-primary transition-colors">Multi-Camera Setup</CardTitle>
            <CardDescription>
              Stream from multiple camera angles with professional broadcast quality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                HD 1080p streaming quality
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                Court-side and overhead views
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                Instant replay capabilities
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-border/50 hover:border-primary/20">
          <CardHeader className="relative bg-gradient-to-br from-green-50 to-transparent dark:from-green-950/30">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Users className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-lg group-hover:text-primary transition-colors">Live Audience</CardTitle>
            <CardDescription>
              Engage with viewers through real-time chat and interactive features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                Real-time viewer chat
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                Live polls and reactions
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                Viewer analytics dashboard
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-border/50 hover:border-primary/20">
          <CardHeader className="relative bg-gradient-to-br from-orange-50 to-transparent dark:from-orange-950/30">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-lg group-hover:text-primary transition-colors">Smart Notifications</CardTitle>
            <CardDescription>
              Automatically notify fans when games start and highlight key moments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                Game start notifications
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                Highlight detection
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                Social media integration
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon Banner */}
      <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-r from-primary/5 via-accent/5 to-orange-50 dark:to-orange-950/20">
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">Next Version Release</span>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold">Live Streaming is Coming Soon!</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We're working hard to bring you professional-grade live streaming capabilities. 
                Stream your tournaments, engage with fans, and grow your basketball community like never before.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
              <Button variant="outline" size="lg" className="gap-2">
                <Bell className="w-4 h-4" />
                Notify Me When Available
              </Button>
              <Button variant="default" size="lg" className="gap-2">
                <Video className="w-4 h-4" />
                Learn More About Streaming
              </Button>
            </div>

            <div className="pt-4 border-t border-border/50 mt-8">
              <p className="text-sm text-muted-foreground">
                Expected in StatJam v2.0 • Professional streaming tools for tournament organizers
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}