import { Card, CardContent, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Clock, Users, Eye } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function LiveGames() {
  // Placeholder; logic will be wired from existing landing live logic in integration step
  const liveGames: any[] = [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "LIVE":
        return "bg-red-500 text-white";
      case "FINAL":
        return "bg-gray-500 text-white";
      case "UPCOMING":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <section className="py-20 bg-gradient-to-b from-orange-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl mb-4">
            <span className="text-orange-500">Live</span> Tournament Action
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Follow real-time games from tournaments around the world. See how StatJam 
            tracks every play, score, and statistic as it happens.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
          {liveGames.map((game) => (
            <Card key={game.id} className="hover:shadow-xl transition-shadow duration-300 border-2 hover:border-orange-200">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {game.tournament}
                  </Badge>
                  <Badge className={`text-xs ${getStatusColor(game.status)}`}>
                    {game.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Teams and Scores */}
                <div className="space-y-3">
                  {/* Away Team */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                        <ImageWithFallback
                          src={game.awayTeam.logo}
                          alt={`${game.awayTeam.name} logo`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-sm">{game.awayTeam.name}</span>
                    </div>
                    <span className="text-2xl">{game.awayTeam.score}</span>
                  </div>

                  {/* Home Team */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                        <ImageWithFallback
                          src={game.homeTeam.logo}
                          alt={`${game.homeTeam.name} logo`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-sm">{game.homeTeam.name}</span>
                    </div>
                    <span className="text-2xl">{game.homeTeam.score}</span>
                  </div>
                </div>

                {/* Game Info */}
                <div className="border-t pt-3 flex justify-between items-center text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      {game.status === "UPCOMING" 
                        ? game.timeRemaining 
                        : game.status === "FINAL" 
                          ? "Final" 
                          : `${game.quarter} ${game.timeRemaining}`
                      }
                    </span>
                  </div>
                  {game.status !== "UPCOMING" && (
                    <div className="flex items-center space-x-1">
                      <Eye className="h-4 w-4" />
                      <span>{game.viewers.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All Games Button */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 text-orange-600 hover:text-orange-700 transition-colors cursor-pointer">
            <Users className="h-5 w-5" />
            <span className="text-lg">View All Live Tournaments</span>
          </div>
        </div>
      </div>
    </section>
  );
}