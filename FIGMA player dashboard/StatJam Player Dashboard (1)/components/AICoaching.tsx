import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { 
  Brain, 
  Target, 
  TrendingUp, 
  PlayCircle, 
  CheckCircle, 
  AlertTriangle,
  Sparkles,
  Star,
  Clock,
  BarChart3
} from "lucide-react";

interface AICoachingProps {
  playerName: string;
  playerData: any;
}

const coachingInsights = [
  {
    type: "strength",
    title: "Defensive Positioning",
    description: "Your defensive stance has improved 23% over the last month",
    progress: 85,
    icon: CheckCircle,
    color: "text-emerald-600"
  },
  {
    type: "improvement",
    title: "Free Throw Consistency",
    description: "Work on follow-through technique for better accuracy",
    progress: 62,
    icon: AlertTriangle,
    color: "text-amber-600"
  },
  {
    type: "focus",
    title: "Three-Point Range",
    description: "Extend shooting practice beyond the arc",
    progress: 45,
    icon: Target,
    color: "text-primary"
  }
];

const weeklyDrills = [
  {
    name: "Defensive Slides",
    duration: "15 min",
    difficulty: "Intermediate",
    completed: false,
    thumbnail: "https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=300&h=200&fit=crop"
  },
  {
    name: "Shooting Form",
    duration: "20 min",
    difficulty: "Beginner",
    completed: true,
    thumbnail: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=300&h=200&fit=crop"
  },
  {
    name: "Footwork Fundamentals",
    duration: "25 min",
    difficulty: "Advanced",
    completed: false,
    thumbnail: "https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=300&h=200&fit=crop"
  }
];

const gameAnalysis = {
  lastGame: "vs Eagles",
  date: "3 days ago",
  strengths: ["Strong rebounding presence", "Excellent court vision", "Solid defensive rotations"],
  improvements: ["Shot selection in traffic", "Free throw consistency", "Ball handling under pressure"]
};

export function AICoaching({ playerName, playerData }: AICoachingProps) {
  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-6 h-6 text-orange-200" />
              <Sparkles className="w-4 h-4 text-orange-200" />
              <span className="text-sm font-bold text-orange-200">PREMIUM FEATURE</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">AI Powered Coaching</h2>
            <p className="text-white/80">Personalized insights and training recommendations powered by advanced analytics</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-white">94</div>
            <div className="text-white/80">Overall Score</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Insights & Analysis */}
        <div className="lg:col-span-2 space-y-6">
          {/* Performance Insights */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                AI Performance Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {coachingInsights.map((insight, index) => {
                const IconComponent = insight.icon;
                return (
                  <div key={index} className="p-4 bg-accent rounded-lg">
                    <div className="flex items-start gap-3 mb-3">
                      <IconComponent className={`w-5 h-5 ${insight.color} mt-1`} />
                      <div className="flex-1">
                        <h4 className="text-card-foreground font-semibold mb-1">{insight.title}</h4>
                        <p className="text-muted-foreground text-sm">{insight.description}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {insight.progress}%
                      </Badge>
                    </div>
                    <Progress value={insight.progress} className="h-2" />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Game Analysis */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Last Game Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-card-foreground font-semibold">{gameAnalysis.lastGame}</h4>
                  <span className="text-muted-foreground text-sm">{gameAnalysis.date}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-emerald-600 font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Strengths
                  </h5>
                  <ul className="space-y-2">
                    {gameAnalysis.strengths.map((strength, index) => (
                      <li key={index} className="text-muted-foreground text-sm flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></div>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h5 className="text-amber-600 font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Areas to Improve
                  </h5>
                  <ul className="space-y-2">
                    {gameAnalysis.improvements.map((improvement, index) => (
                      <li key={index} className="text-muted-foreground text-sm flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-amber-600 rounded-full"></div>
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Training Recommendations */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                AI Training Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-card-foreground font-semibold mb-2">Custom Training Plan</h4>
                <p className="text-muted-foreground mb-4">AI is analyzing your performance to create a personalized training plan</p>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Drills & Practice */}
        <div className="space-y-6">
          {/* Weekly Drills */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-emerald-600" />
                This Week's Drills
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {weeklyDrills.map((drill, index) => (
                <div key={index} className="p-3 bg-accent rounded-lg">
                  <div className="flex gap-3">
                    <div className="w-16 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                      <ImageWithFallback 
                        src={drill.thumbnail}
                        alt={drill.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="text-card-foreground font-medium text-sm truncate">{drill.name}</h5>
                        {drill.completed && (
                          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{drill.duration}</span>
                        <span>•</span>
                        <span>{drill.difficulty}</span>
                      </div>
                    </div>
                  </div>
                  
                  {!drill.completed && (
                    <Button size="sm" className="w-full mt-3 bg-primary hover:bg-primary/90 text-primary-foreground">
                      Start Drill
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Progress Tracker */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Weekly Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground text-sm">Drills Completed</span>
                  <span className="text-card-foreground font-semibold">3/5</span>
                </div>
                <Progress value={60} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground text-sm">Training Hours</span>
                  <span className="text-card-foreground font-semibold">12/15</span>
                </div>
                <Progress value={80} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground text-sm">Skill Improvement</span>
                  <span className="text-card-foreground font-semibold">+8%</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Upgrade CTA */}
          <Card className="bg-gradient-to-br from-red-600/10 to-orange-600/10 border-primary/30">
            <CardContent className="p-6 text-center">
              <Star className="w-8 h-8 text-primary mx-auto mb-3" />
              <h4 className="text-card-foreground font-semibold mb-2">Unlock Full AI Coaching</h4>
              <p className="text-muted-foreground text-sm mb-4">Get unlimited AI analysis, custom training plans, and video breakdown</p>
              <Button className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white border-0">
                <Sparkles className="w-4 h-4 mr-2" />
                Upgrade Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}